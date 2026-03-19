'use client';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { PlayerSelectionStats } from '@/lib/types';

const COLLECTION = 'player_selection_stats';

function toStat(d: { id: string; data: () => Record<string, unknown> }): PlayerSelectionStats & { id: string } {
  const data = d.data();
  return {
    id: d.id,
    matchId: (data.matchId as string) ?? '',
    playerId: (data.playerId as string) ?? '',
    totalSelections: (data.totalSelections as number) ?? 0,
    selectionPercentage: (data.selectionPercentage as number) ?? 0,
  };
}

/** Document ID convention: matchId_playerId for deterministic lookup */
function docId(matchId: string, playerId: string): string {
  return `${matchId}_${playerId}`;
}

export async function getSelectionStatsForMatch(
  firestore: Firestore,
  matchId: string
): Promise<(PlayerSelectionStats & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('matchId', '==', matchId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toStat({ id: d.id, data: d.data() }));
}

export async function getSelectionStat(
  firestore: Firestore,
  matchId: string,
  playerId: string
): Promise<(PlayerSelectionStats & { id: string }) | null> {
  const ref = doc(firestore, COLLECTION, docId(matchId, playerId));
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return toStat({ id: snapshot.id, data: snapshot.data() });
}

/**
 * Increment selection count for a player in a match (when user picks).
 * Creates document if not exists. Call recalcSelectionPercentages after to update percentages.
 */
export async function incrementSelectionCount(
  firestore: Firestore,
  matchId: string,
  playerId: string
): Promise<void> {
  const ref = doc(firestore, COLLECTION, docId(matchId, playerId));
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    await updateDoc(ref, { totalSelections: increment(1) }).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: {},
      }));
      throw serverError;
    });
  } else {
    await setDoc(ref, {
      matchId,
      playerId,
      totalSelections: 1,
      selectionPercentage: 0,
    }).catch((serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'create',
        requestResourceData: {},
      }));
      throw serverError;
    });
  }
}

/**
 * Decrement selection count (e.g. when user switches to another player).
 */
export async function decrementSelectionCount(
  firestore: Firestore,
  matchId: string,
  playerId: string
): Promise<void> {
  const ref = doc(firestore, COLLECTION, docId(matchId, playerId));
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  const current = (data?.totalSelections as number) ?? 0;
  const { deleteDoc } = await import('firebase/firestore');
  if (current <= 1) {
    await deleteDoc(ref).catch(() => {});
    return;
  }
  await updateDoc(ref, { totalSelections: current - 1 }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: {},
    }));
    throw serverError;
  });
}

/**
 * Update selectionPercentage for all players in a match.
 * selectionPercentage = (totalSelections / totalUsersInMatch) * 100
 */
export async function updateSelectionPercentagesForMatch(
  firestore: Firestore,
  matchId: string,
  totalUsersInMatch: number
): Promise<void> {
  if (totalUsersInMatch <= 0) return;
  const stats = await getSelectionStatsForMatch(firestore, matchId);
  for (const s of stats) {
    const pct = (s.totalSelections / totalUsersInMatch) * 100;
    const ref = doc(firestore, COLLECTION, s.id);
    await updateDoc(ref, { selectionPercentage: Math.round(pct * 100) / 100 }).catch((e) => {
      console.error('updateSelectionPercentagesForMatch', e);
    });
  }
}
