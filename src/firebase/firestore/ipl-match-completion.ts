'use client';

import { writeBatch, doc, getDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { getStatsByMatch } from './player-match-stats';
import { getIPLUserPicksByTournament } from './ipl-user-picks';
import { getSelectionStatsForMatch } from './player-selection-stats';
import { getIPLMatch } from './ipl-matches';
import { getIPLPlayer } from './ipl-players';
import {
  calculateBatsmanBasePoints,
  calculateBowlerBasePoints,
  calculateAllRounderBasePoints,
  calculateCaptainBonusPoints,
  applyEmergingMultiplier,
  getMultiplierFromSelectionPercentage,
} from '@/lib/ipl-fantasy-engines';
import type { IPLUserPickHistoryEntry, IPLMatchSelection } from '@/lib/types';
import type { PlayerMatchStats } from '@/lib/types';

const IPL_USER_PICKS = 'ipl_user_picks';

export type LockedSelection = {
  batsmanId?: string;
  bowlerId?: string;
  allRounderId?: string;
  captainId?: string;
  emergingPlayerId?: string;
  underratedPlayerId?: string;
  switchPenalty?: number;
};

function getLockedSelection(
  matchSelections: Record<string, IPLMatchSelection | string> | undefined,
  matchId: string
): LockedSelection {
  const raw = matchSelections?.[matchId];
  if (!raw) return {};
  if (typeof raw === 'string') return { batsmanId: raw };
  return {
    batsmanId: raw.batsmanId,
    bowlerId: raw.bowlerId,
    allRounderId: raw.allRounderId,
    captainId: raw.captainId,
    emergingPlayerId: raw.emergingPlayerId,
    underratedPlayerId: raw.underratedPlayerId,
    switchPenalty: raw.switchPenalty,
  };
}

function hasAnySelection(locked: LockedSelection): boolean {
  return !!(
    locked.batsmanId ||
    locked.bowlerId ||
    locked.allRounderId ||
    locked.captainId ||
    locked.emergingPlayerId
  );
}

/** Sum of totalMatchPoints (or legacy finalPoints + penalty) for consistency. */
function recalcTotalFromHistory(history: IPLUserPickHistoryEntry[]): number {
  return history.reduce((sum, e) => {
    if (e.totalMatchPoints != null) return sum + e.totalMatchPoints;
    return sum + (e.finalPoints ?? 0) + (e.penalty ?? 0);
  }, 0);
}

/**
 * Process a completed match: for each user who had a team locked for this match,
 * compute base points per role, apply underrated multiplier to FULL base total,
 * add switchPenalty, store in history with selectionPercentage/multiplier/switchPenalty.
 * Idempotent: if history already has entry for matchId, replace it and recalc totalPoints.
 * totalPoints is always set to sum(history.totalMatchPoints) for consistency.
 */
export async function processIPLMatchCompletion(
  firestore: Firestore,
  matchId: string,
  tournamentId: string
): Promise<{ processedUsers: number; errors: string[] }> {
  const errors: string[] = [];
  const [match, stats, picks, selectionStats] = await Promise.all([
    getIPLMatch(firestore, matchId),
    getStatsByMatch(firestore, matchId),
    getIPLUserPicksByTournament(firestore, tournamentId),
    getSelectionStatsForMatch(firestore, matchId),
  ]);

  const winnerTeamId = match?.winnerTeamId;
  const totalUsersInMatch = picks.filter((p) =>
    hasAnySelection(getLockedSelection(p.matchSelections, matchId))
  ).length;
  const selectionByPlayer = new Map(
    selectionStats.map((s) => [
      s.playerId,
      totalUsersInMatch > 0 ? s.selectionPercentage : 0,
    ])
  );
  const statsByPlayer = new Map(stats.map((s) => [s.playerId, s]));

  const playerIds = new Set<string>();
  for (const pick of picks) {
    const locked = getLockedSelection(pick.matchSelections, matchId);
    if (locked.batsmanId) playerIds.add(locked.batsmanId);
    if (locked.bowlerId) playerIds.add(locked.bowlerId);
    if (locked.allRounderId) playerIds.add(locked.allRounderId);
    if (locked.captainId) playerIds.add(locked.captainId);
    if (locked.emergingPlayerId) playerIds.add(locked.emergingPlayerId);
  }
  const playerMap = new Map<
    string,
    Awaited<ReturnType<typeof getIPLPlayer>>
  >();
  await Promise.all(
    Array.from(playerIds).map(async (id) => {
      const p = await getIPLPlayer(firestore, id);
      if (p) playerMap.set(id, p);
    })
  );

  let processedUsers = 0;
  const batch = writeBatch(firestore);

  for (const pick of picks) {
    const locked = getLockedSelection(pick.matchSelections, matchId);
    if (
      !locked.batsmanId &&
      !locked.bowlerId &&
      !locked.allRounderId &&
      !locked.captainId &&
      !locked.emergingPlayerId
    )
      continue;

    // ---- Base points per role (no multiplier yet) ----
    let batsmanBase = 0;
    let bowlerPoints = 0;
    let allRounderPoints = 0;
    let captainPoints = 0;
    let emergingPoints = 0;

    if (locked.batsmanId) {
      const stat = statsByPlayer.get(locked.batsmanId) as
        | PlayerMatchStats
        | undefined;
      if (stat) batsmanBase = calculateBatsmanBasePoints(stat);
      else errors.push(`No stats for batsman ${locked.batsmanId} in match ${matchId}`);
    }

    if (locked.bowlerId) {
      const stat = statsByPlayer.get(locked.bowlerId) as
        | PlayerMatchStats
        | undefined;
      if (stat) bowlerPoints = calculateBowlerBasePoints(stat);
      else errors.push(`No stats for bowler ${locked.bowlerId} in match ${matchId}`);
    }

    if (locked.allRounderId) {
      const stat = statsByPlayer.get(locked.allRounderId) as
        | PlayerMatchStats
        | undefined;
      if (stat) allRounderPoints = calculateAllRounderBasePoints(stat);
      else errors.push(`No stats for all-rounder ${locked.allRounderId} in match ${matchId}`);
    }

    if (locked.captainId) {
      const stat = statsByPlayer.get(locked.captainId) as
        | PlayerMatchStats
        | undefined;
      const player = playerMap.get(locked.captainId);
      const teamId = player?.team ?? '';
      if (stat)
        captainPoints = calculateCaptainBonusPoints(
          stat,
          teamId,
          winnerTeamId
        );
    }

    if (locked.emergingPlayerId) {
      const stat = statsByPlayer.get(locked.emergingPlayerId) as
        | PlayerMatchStats
        | undefined;
      const player = playerMap.get(locked.emergingPlayerId);
      const isEmerging = player?.isEmerging ?? false;
      if (stat) {
        const base = calculateAllRounderBasePoints(stat);
        emergingPoints = applyEmergingMultiplier(base, isEmerging);
      } else {
        errors.push(`No stats for emerging ${locked.emergingPlayerId} in match ${matchId}`);
      }
    }

    const baseTotal =
      batsmanBase +
      bowlerPoints +
      allRounderPoints +
      captainPoints +
      emergingPoints;

    const underratedPlayerId =
      locked.underratedPlayerId ?? locked.batsmanId;
    const selectionPercentage = underratedPlayerId
      ? selectionByPlayer.get(underratedPlayerId) ?? 0
      : 0;
    const multiplier = getMultiplierFromSelectionPercentage(selectionPercentage);
    const finalTotal = Math.round(baseTotal * multiplier * 100) / 100;
    const switchPenalty = locked.switchPenalty ?? 0;
    const totalMatchPoints = finalTotal + switchPenalty;

    const entry: IPLUserPickHistoryEntry = {
      matchId,
      totalMatchPoints,
      batsmanPoints: batsmanBase,
      bowlerPoints,
      allRounderPoints,
      captainPoints,
      emergingPoints,
      selectionPercentage,
      multiplier,
      switchPenalty,
      batsmanId: locked.batsmanId,
      bowlerId: locked.bowlerId,
      allRounderId: locked.allRounderId,
      captainId: locked.captainId,
      emergingPlayerId: locked.emergingPlayerId,
      playerId: locked.batsmanId,
      finalPoints: batsmanBase,
    };

    const ref = doc(firestore, IPL_USER_PICKS, pick.id!);

    const snap = await getDoc(ref);
    const currentHistory = (snap.data()?.history as IPLUserPickHistoryEntry[]) ?? [];
    const existingIndex = currentHistory.findIndex((e) => e.matchId === matchId);

    let newHistory: IPLUserPickHistoryEntry[];
    if (existingIndex >= 0) {
      newHistory = [...currentHistory];
      newHistory[existingIndex] = entry;
    } else {
      newHistory = [...currentHistory, entry];
    }

    const recalculatedTotal = recalcTotalFromHistory(newHistory);

    batch.update(ref, {
      history: newHistory,
      totalPoints: recalculatedTotal,
      updatedAt: serverTimestamp(),
    });
    processedUsers++;
  }

  if (processedUsers > 0) {
    try {
      await batch.commit();
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'Batch commit failed');
    }
  }

  return { processedUsers, errors };
}
