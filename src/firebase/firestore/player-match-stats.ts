'use client';

import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { PlayerMatchStats } from '@/lib/types';

const COLLECTION = 'player_match_stats';

function toStat(d: { id: string; data: () => Record<string, unknown> }): PlayerMatchStats & { id: string } {
  const data = d.data();
  return {
    id: d.id,
    matchId: (data.matchId as string) ?? '',
    playerId: (data.playerId as string) ?? '',
    runs: (data.runs as number) ?? 0,
    fours: (data.fours as number) ?? 0,
    sixes: (data.sixes as number) ?? 0,
    strikeRate: (data.strikeRate as number) ?? 0,
    wickets: (data.wickets as number) ?? 0,
    isOut: (data.isOut as boolean) ?? false,
    economy: (data.economy as number) ?? undefined,
    overs: (data.overs as number) ?? undefined,
    catches: (data.catches as number) ?? undefined,
  };
}

function statDocId(matchId: string, playerId: string): string {
  return `${matchId}_${playerId}`;
}

export async function getStatsByMatch(
  firestore: Firestore,
  matchId: string
): Promise<(PlayerMatchStats & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('matchId', '==', matchId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toStat({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getStatByMatchAndPlayer(
  firestore: Firestore,
  matchId: string,
  playerId: string
): Promise<(PlayerMatchStats & { id: string }) | null> {
  const col = collection(firestore, COLLECTION);
  const q = query(
    col,
    where('matchId', '==', matchId),
    where('playerId', '==', playerId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return toStat({ id: snapshot.docs[0].id, data: () => snapshot.docs[0].data() as Record<string, unknown> });
}

export async function setPlayerMatchStats(
  firestore: Firestore,
  data: Omit<PlayerMatchStats, 'id'>
): Promise<string> {
  const col = collection(firestore, COLLECTION);
  const docToSave: Record<string, unknown> = {
    matchId: data.matchId,
    playerId: data.playerId,
    runs: data.runs,
    fours: data.fours,
    sixes: data.sixes,
    strikeRate: data.strikeRate,
    wickets: data.wickets,
    isOut: data.isOut,
  };
  if (data.economy != null) docToSave.economy = data.economy;
  if (data.overs != null) docToSave.overs = data.overs;
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
 * Admin: create or overwrite stats for match+player (deterministic doc id).
 */
export async function upsertPlayerMatchStats(
  firestore: Firestore,
  data: Omit<PlayerMatchStats, 'id'>
): Promise<void> {
  const id = statDocId(data.matchId, data.playerId);
  const ref = doc(firestore, COLLECTION, id);
  const docToSave: Record<string, unknown> = {
    matchId: data.matchId,
    playerId: data.playerId,
    runs: data.runs,
    fours: data.fours,
    sixes: data.sixes,
    strikeRate: data.strikeRate,
    wickets: data.wickets,
    isOut: data.isOut,
  };
  if (data.economy != null) docToSave.economy = data.economy;
  if (data.overs != null) docToSave.overs = data.overs;
  if (data.catches != null) docToSave.catches = data.catches;
  await setDoc(ref, docToSave).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'write',
      requestResourceData: docToSave,
    }));
    throw serverError;
  });
}
