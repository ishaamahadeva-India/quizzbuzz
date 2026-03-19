'use client';

import { doc, getDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { IPLUserPickHistoryEntry } from '@/lib/types';
import { getIPLUserPicksByTournament } from './ipl-user-picks';

const COLLECTION = 'ipl_user_picks';

/** Same logic as match completion: sum history into total points. */
export function sumHistoryToTotalPoints(history: IPLUserPickHistoryEntry[]): number {
  return history.reduce((sum, e) => {
    if (e.totalMatchPoints != null) return sum + e.totalMatchPoints;
    return sum + (e.finalPoints ?? 0) + (e.penalty ?? 0);
  }, 0);
}

/**
 * Admin: set totalPoints from sum(history) for one pick document.
 */
export async function adminRecalculatePickTotalFromHistory(
  firestore: Firestore,
  pickId: string
): Promise<{ totalPoints: number }> {
  const ref = doc(firestore, COLLECTION, pickId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Pick not found');
  const history = (snap.data()?.history as IPLUserPickHistoryEntry[]) ?? [];
  const totalPoints = sumHistoryToTotalPoints(history);
  await updateDoc(ref, { totalPoints, updatedAt: serverTimestamp() }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: {},
    }));
    throw serverError;
  });
  return { totalPoints };
}

/**
 * Admin: recalculate totalPoints from history for every pick in tournament.
 */
export async function adminRecalculateAllPickTotalsInTournament(
  firestore: Firestore,
  tournamentId: string
): Promise<{ updated: number; errors: string[] }> {
  const picks = await getIPLUserPicksByTournament(firestore, tournamentId);
  const errors: string[] = [];
  let updated = 0;
  for (const pick of picks) {
    try {
      const history = pick.history ?? [];
      const totalPoints = sumHistoryToTotalPoints(history);
      const ref = doc(firestore, COLLECTION, pick.id!);
      await updateDoc(ref, { totalPoints, updatedAt: serverTimestamp() });
      updated++;
    } catch (e) {
      errors.push(pick.id ?? 'unknown');
    }
  }
  return { updated, errors };
}

/**
 * Admin: remove history entry for matchId from all picks; recalc totalPoints.
 * Use only for testing / fixing bad runs.
 */
export async function adminRemoveMatchFromAllHistories(
  firestore: Firestore,
  tournamentId: string,
  matchId: string
): Promise<{ updated: number; errors: string[] }> {
  const picks = await getIPLUserPicksByTournament(firestore, tournamentId);
  const errors: string[] = [];
  let updated = 0;
  for (const pick of picks) {
    try {
      const history = (pick.history ?? []).filter((e) => e.matchId !== matchId);
      if (history.length === (pick.history ?? []).length) continue;
      const totalPoints = sumHistoryToTotalPoints(history);
      const ref = doc(firestore, COLLECTION, pick.id!);
      await updateDoc(ref, { history, totalPoints, updatedAt: serverTimestamp() });
      updated++;
    } catch (e) {
      errors.push(pick.id ?? 'unknown');
    }
  }
  return { updated, errors };
}

/**
 * Admin: fix totalPoints when it mismatches sum(history) (read-only compare + optional fix).
 */
export async function adminFixMismatchedTotals(
  firestore: Firestore,
  tournamentId: string,
  dryRun: boolean
): Promise<{ fixed: number; mismatches: number; details: string[] }> {
  const picks = await getIPLUserPicksByTournament(firestore, tournamentId);
  const details: string[] = [];
  let mismatches = 0;
  let fixed = 0;
  for (const pick of picks) {
    const history = pick.history ?? [];
    const expected = sumHistoryToTotalPoints(history);
    if (expected !== pick.totalPoints) {
      mismatches++;
      details.push(`${pick.id}: stored=${pick.totalPoints} expected=${expected}`);
      if (!dryRun) {
        const ref = doc(firestore, COLLECTION, pick.id!);
        await updateDoc(ref, { totalPoints: expected, updatedAt: serverTimestamp() });
        fixed++;
      }
    }
  }
  return { fixed, mismatches, details };
}
