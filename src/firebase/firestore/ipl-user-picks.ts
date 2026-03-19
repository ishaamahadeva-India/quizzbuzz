'use client';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { IPLUserPick, IPLUserPickHistoryEntry, IPLMatchSelection } from '@/lib/types';

const COLLECTION = 'ipl_user_picks';

const DEFAULT_FREE_SWITCHES = 1;
const SWITCH_PENALTY_POINTS = 20;

function normalizeMatchSelection(
  value: unknown
): IPLMatchSelection | string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const o = value as Record<string, unknown>;
  return {
    batsmanId: (o.batsmanId as string) ?? undefined,
    bowlerId: (o.bowlerId as string) ?? undefined,
    allRounderId: (o.allRounderId as string) ?? undefined,
    captainId: (o.captainId as string) ?? undefined,
    emergingPlayerId: (o.emergingPlayerId as string) ?? undefined,
    underratedPlayerId: (o.underratedPlayerId as string) ?? undefined,
    switchPenalty: (o.switchPenalty as number) ?? undefined,
  };
}

function toPick(d: { id: string; data: () => Record<string, unknown> }): IPLUserPick & { id: string } {
  const data = d.data();
  const history = (data.history as IPLUserPickHistoryEntry[] | undefined) ?? [];
  const rawSelections = (data.matchSelections as Record<string, unknown> | undefined) ?? {};
  const matchSelections: Record<string, IPLMatchSelection | string> = {};
  for (const [k, v] of Object.entries(rawSelections)) {
    matchSelections[k] = normalizeMatchSelection(v);
  }
  return {
    id: d.id,
    userId: (data.userId as string) ?? '',
    tournamentId: (data.tournamentId as string) ?? '',
    currentBatsmanId: (data.currentBatsmanId as string) ?? '',
    bowlerId: (data.bowlerId as string) ?? undefined,
    allRounderId: (data.allRounderId as string) ?? undefined,
    captainId: (data.captainId as string) ?? undefined,
    emergingPlayerId: (data.emergingPlayerId as string) ?? undefined,
    underratedPlayerId: (data.underratedPlayerId as string) ?? undefined,
    matchSelections,
    totalPoints: (data.totalPoints as number) ?? 0,
    switchCount: (data.switchCount as number) ?? 0,
    switchCountBatsman: (data.switchCountBatsman as number) ?? (data.switchCount as number) ?? 0,
    switchCountBowler: (data.switchCountBowler as number) ?? 0,
    switchCountAllRounder: (data.switchCountAllRounder as number) ?? 0,
    switchCountCaptain: (data.switchCountCaptain as number) ?? 0,
    switchCountEmerging: (data.switchCountEmerging as number) ?? 0,
    freeSwitchesLeft: (data.freeSwitchesLeft as number) ?? DEFAULT_FREE_SWITCHES,
    history,
    createdAt: (data.createdAt as { seconds: number }) ?? { seconds: 0 },
    updatedAt: (data.updatedAt as { seconds: number }) ?? { seconds: 0 },
  };
}

export async function getIPLUserPick(
  firestore: Firestore,
  tournamentId: string,
  userId: string
): Promise<(IPLUserPick & { id: string }) | null> {
  const col = collection(firestore, COLLECTION);
  const q = query(
    col,
    where('tournamentId', '==', tournamentId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return toPick({ id: snapshot.docs[0].id, data: () => snapshot.docs[0].data() as Record<string, unknown> });
}

/**
 * Subscribe to the current user's pick for a tournament (real-time).
 */
export function subscribeIPLUserPick(
  firestore: Firestore,
  tournamentId: string,
  userId: string,
  onData: (pick: (IPLUserPick & { id: string }) | null) => void
): Unsubscribe {
  const col = collection(firestore, COLLECTION);
  const q = query(
    col,
    where('tournamentId', '==', tournamentId),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      onData(null);
      return;
    }
    onData(toPick({ id: snapshot.docs[0].id, data: () => snapshot.docs[0].data() as Record<string, unknown> }));
  });
}

/**
 * Create initial user pick when they first select a batsman (and optionally other roles) for the tournament.
 * Other roles and underratedPlayerId are optional for backward compatibility.
 */
export async function createIPLUserPick(
  firestore: Firestore,
  userId: string,
  tournamentId: string,
  currentBatsmanId: string,
  extraRoles?: { bowlerId?: string; allRounderId?: string; captainId?: string; emergingPlayerId?: string; underratedPlayerId?: string }
): Promise<string> {
  const col = collection(firestore, COLLECTION);
  const docToSave = {
    userId,
    tournamentId,
    currentBatsmanId,
    matchSelections: {},
    totalPoints: 0,
    switchCount: 0,
    freeSwitchesLeft: DEFAULT_FREE_SWITCHES,
    history: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(extraRoles?.bowlerId ? { bowlerId: extraRoles.bowlerId } : {}),
    ...(extraRoles?.allRounderId ? { allRounderId: extraRoles.allRounderId } : {}),
    ...(extraRoles?.captainId ? { captainId: extraRoles.captainId } : {}),
    ...(extraRoles?.emergingPlayerId ? { emergingPlayerId: extraRoles.emergingPlayerId } : {}),
    ...(extraRoles?.underratedPlayerId != null ? { underratedPlayerId: extraRoles.underratedPlayerId } : {}),
  };
  const ref = await addDoc(col, docToSave).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: col.path,
      operation: 'create',
      requestResourceData: docToSave,
    }));
    throw serverError;
  });
  return ref.id;
}

/**
 * Update user's current batsman (before match lock).
 * Applies switching penalty: use free switch if available, else deduct SWITCH_PENALTY_POINTS.
 * Returns { pickId, usedFreeSwitch, penaltyApplied }.
 */
export async function updateIPLUserPickBatsman(
  firestore: Firestore,
  pickId: string,
  newBatsmanId: string,
  options: { freeSwitchesLeft: number; currentTotalPoints: number }
): Promise<{ usedFreeSwitch: boolean; penaltyApplied: number; newFreeSwitchesLeft: number }> {
  const ref = doc(firestore, COLLECTION, pickId);
  let usedFreeSwitch = false;
  let penaltyApplied = 0;
  let newFreeSwitchesLeft = options.freeSwitchesLeft;

  if (options.freeSwitchesLeft > 0) {
    usedFreeSwitch = true;
    newFreeSwitchesLeft = options.freeSwitchesLeft - 1;
  } else {
    penaltyApplied = -SWITCH_PENALTY_POINTS;
  }

  const { getDoc } = await import('firebase/firestore');
  if (!usedFreeSwitch) {
    const snap = await getDoc(ref);
    const nextSwitch = ((snap.data()?.switchCount as number) ?? 0) + 1;
    const nextBatsmanSwitch =
      ((snap.data()?.switchCountBatsman as number) ?? (snap.data()?.switchCount as number) ?? 0) + 1;
    await updateDoc(ref, {
      currentBatsmanId: newBatsmanId,
      freeSwitchesLeft: newFreeSwitchesLeft,
      switchCount: nextSwitch,
      switchCountBatsman: nextBatsmanSwitch,
      totalPoints: Math.max(0, options.currentTotalPoints + penaltyApplied),
      updatedAt: serverTimestamp(),
    }).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: {},
      }));
      throw serverError;
    });
  } else {
    await updateDoc(ref, {
      currentBatsmanId: newBatsmanId,
      freeSwitchesLeft: newFreeSwitchesLeft,
      updatedAt: serverTimestamp(),
    }).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: {},
      }));
      throw serverError;
    });
  }

  return { usedFreeSwitch, penaltyApplied, newFreeSwitchesLeft };
}

/** Role field and switch-count field mapping for multi-role updates */
const ROLE_FIELD: Record<string, { field: keyof IPLUserPick; switchField: keyof IPLUserPick }> = {
  batsman: { field: 'currentBatsmanId', switchField: 'switchCountBatsman' },
  bowler: { field: 'bowlerId', switchField: 'switchCountBowler' },
  allRounder: { field: 'allRounderId', switchField: 'switchCountAllRounder' },
  captain: { field: 'captainId', switchField: 'switchCountCaptain' },
  emerging: { field: 'emergingPlayerId', switchField: 'switchCountEmerging' },
};

/**
 * Update one role's pick (batsman, bowler, allRounder, captain, emerging).
 * Applies -20 penalty per switch (or uses one free switch if available).
 * Returns { usedFreeSwitch, penaltyApplied, newFreeSwitchesLeft }.
 */
export async function updateIPLUserPickRole(
  firestore: Firestore,
  pickId: string,
  role: keyof typeof ROLE_FIELD,
  newPlayerId: string,
  options: { freeSwitchesLeft: number; currentTotalPoints: number; currentPlayerIdForRole: string | null }
): Promise<{ usedFreeSwitch: boolean; penaltyApplied: number; newFreeSwitchesLeft: number }> {
  const { field, switchField } = ROLE_FIELD[role];
  const isChanging = options.currentPlayerIdForRole != null && options.currentPlayerIdForRole !== newPlayerId;
  if (!isChanging) {
    const ref = doc(firestore, COLLECTION, pickId);
    await updateDoc(ref, {
      [field]: newPlayerId,
      updatedAt: serverTimestamp(),
    }).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: {},
      }));
      throw serverError;
    });
    return { usedFreeSwitch: false, penaltyApplied: 0, newFreeSwitchesLeft: options.freeSwitchesLeft };
  }

  let usedFreeSwitch = false;
  let penaltyApplied = 0;
  let newFreeSwitchesLeft = options.freeSwitchesLeft;
  if (options.freeSwitchesLeft > 0) {
    usedFreeSwitch = true;
    newFreeSwitchesLeft = options.freeSwitchesLeft - 1;
  } else {
    penaltyApplied = -SWITCH_PENALTY_POINTS;
  }

  const ref = doc(firestore, COLLECTION, pickId);
  const { getDoc } = await import('firebase/firestore');
  if (!usedFreeSwitch) {
    const snap = await getDoc(ref);
    const currentRoleSwitch = (snap.data()?.[switchField] as number) ?? 0;
    const nextGlobalSwitch = ((snap.data()?.switchCount as number) ?? 0) + 1;
    await updateDoc(
      ref,
      {
        [field]: newPlayerId,
        freeSwitchesLeft: newFreeSwitchesLeft,
        [switchField]: currentRoleSwitch + 1,
        switchCount: nextGlobalSwitch,
        totalPoints: Math.max(0, options.currentTotalPoints + penaltyApplied),
        updatedAt: serverTimestamp(),
      } as never
    ).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: {},
      }));
      throw serverError;
    });
  } else {
    await updateDoc(
      ref,
      {
        [field]: newPlayerId,
        freeSwitchesLeft: newFreeSwitchesLeft,
        updatedAt: serverTimestamp(),
      } as never
    ).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: {},
      }));
      throw serverError;
    });
  }

  return { usedFreeSwitch, penaltyApplied, newFreeSwitchesLeft };
}

/**
 * Clear an optional role (bowler, allRounder, captain, emerging). Does not apply switch penalty.
 */
export async function clearIPLUserPickRole(
  firestore: Firestore,
  pickId: string,
  role: 'bowler' | 'allRounder' | 'captain' | 'emerging'
): Promise<void> {
  const { field } = ROLE_FIELD[role];
  const ref = doc(firestore, COLLECTION, pickId);
  const { deleteField } = await import('firebase/firestore');
  await updateDoc(ref, {
    [field]: deleteField(),
    updatedAt: serverTimestamp(),
  }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: {},
    }));
    throw serverError;
  });
}

/**
 * Get current player ID for a role from a pick (for UI and updateIPLUserPickRole).
 */
export function getCurrentPlayerIdForRole(
  pick: IPLUserPick & { id: string },
  role: keyof typeof ROLE_FIELD
): string | null {
  const { field } = ROLE_FIELD[role];
  const v = pick[field];
  if (typeof v === 'string' && v) return v;
  return null;
}

/**
 * Points to add from a history entry (backward compat: finalPoints + penalty, or totalMatchPoints).
 */
function historyEntryPoints(entry: IPLUserPickHistoryEntry): number {
  const total = entry.totalMatchPoints ?? entry.finalPoints ?? 0;
  const penalty = entry.penalty ?? 0;
  return total + penalty;
}

/**
 * Append history entry and update totalPoints after a match is scored.
 * Supports both legacy (finalPoints) and multi-role (totalMatchPoints) entries.
 */
export async function appendIPLUserPickHistory(
  firestore: Firestore,
  pickId: string,
  entry: IPLUserPickHistoryEntry,
  currentTotalPoints: number
): Promise<void> {
  const ref = doc(firestore, COLLECTION, pickId);
  const { arrayUnion } = await import('firebase/firestore');
  const newTotal = currentTotalPoints + historyEntryPoints(entry);
  await updateDoc(ref, {
    history: arrayUnion(entry),
    totalPoints: newTotal,
    updatedAt: serverTimestamp(),
  }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: {},
    }));
    throw serverError;
  });
}

/**
 * Get all picks for a tournament (for leaderboard).
 */
export async function getIPLUserPicksByTournament(
  firestore: Firestore,
  tournamentId: string
): Promise<(IPLUserPick & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('tournamentId', '==', tournamentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toPick({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

/**
 * Subscribe to leaderboard (all picks for tournament) for real-time updates.
 */
export function subscribeIPLLeaderboard(
  firestore: Firestore,
  tournamentId: string,
  onData: (picks: (IPLUserPick & { id: string })[]) => void
): Unsubscribe {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('tournamentId', '==', tournamentId));
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map((d) => toPick({ id: d.id, data: () => d.data() as Record<string, unknown> })));
  });
}

/**
 * Lock current team (all roles) for a specific match (call before match lock time).
 * Sets matchSelections[matchId] to current batsman + bowler + allRounder + captain + emerging + underrated + switchPenalty.
 * Backward compat: still supports legacy string value (batsmanId only).
 */
export async function lockIPLUserPickForMatch(
  firestore: Firestore,
  pickId: string,
  matchId: string,
  options?: { underratedPlayerId?: string | null; switchPenalty?: number }
): Promise<void> {
  const ref = doc(firestore, COLLECTION, pickId);
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const current = (data?.matchSelections as Record<string, unknown>) ?? {};
  const selection: IPLMatchSelection = {
    batsmanId: (data?.currentBatsmanId as string) ?? undefined,
    bowlerId: (data?.bowlerId as string) ?? undefined,
    allRounderId: (data?.allRounderId as string) ?? undefined,
    captainId: (data?.captainId as string) ?? undefined,
    emergingPlayerId: (data?.emergingPlayerId as string) ?? undefined,
    underratedPlayerId: options?.underratedPlayerId ?? undefined,
    switchPenalty: options?.switchPenalty ?? undefined,
  };
  const updated = { ...current, [matchId]: selection };
  await updateDoc(ref, { matchSelections: updated, updatedAt: serverTimestamp() }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: {},
    }));
    throw serverError;
  });
}

export { SWITCH_PENALTY_POINTS, DEFAULT_FREE_SWITCHES };
