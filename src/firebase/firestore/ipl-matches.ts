'use client';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { IPLMatch, IPLMatchStatus } from '@/lib/types';

const COLLECTION = 'ipl_matches';

function toMatch(d: { id: string; data: () => Record<string, unknown> }): IPLMatch & { id: string } {
  const data = d.data();
  const matchStartTime = data.matchStartTime as { seconds: number } | undefined;
  return {
    id: d.id,
    teamA: (data.teamA as string) ?? '',
    teamB: (data.teamB as string) ?? '',
    matchStartTime: matchStartTime ? { seconds: matchStartTime.seconds } : new Date(0),
    status: (data.status as IPLMatchStatus) ?? 'upcoming',
    winnerTeamId: (data.winnerTeamId as string) ?? undefined,
  };
}

export async function getIPLMatches(firestore: Firestore): Promise<(IPLMatch & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, orderBy('matchStartTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toMatch({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getUpcomingIPLMatch(
  firestore: Firestore
): Promise<(IPLMatch & { id: string }) | null> {
  const col = collection(firestore, COLLECTION);
  const q = query(
    col,
    where('status', '==', 'upcoming'),
    orderBy('matchStartTime', 'asc')
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return toMatch({ id: snapshot.docs[0].id, data: () => snapshot.docs[0].data() as Record<string, unknown> });
}

export async function getIPLMatchesByStatus(
  firestore: Firestore,
  status: IPLMatchStatus
): Promise<(IPLMatch & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('status', '==', status), orderBy('matchStartTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toMatch({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getIPLMatch(
  firestore: Firestore,
  matchId: string
): Promise<(IPLMatch & { id: string }) | null> {
  const ref = doc(firestore, COLLECTION, matchId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return toMatch({ id: snapshot.id, data: () => snapshot.data() as Record<string, unknown> });
}

export async function addIPLMatch(
  firestore: Firestore,
  data: { teamA: string; teamB: string; matchStartTime: Date; status?: IPLMatchStatus }
): Promise<string> {
  const col = collection(firestore, COLLECTION);
  const docToSave = {
    teamA: data.teamA,
    teamB: data.teamB,
    matchStartTime: data.matchStartTime instanceof Date
      ? Timestamp.fromDate(data.matchStartTime)
      : data.matchStartTime,
    status: data.status ?? 'upcoming',
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

export async function updateIPLMatchStatus(
  firestore: Firestore,
  matchId: string,
  status: IPLMatchStatus
): Promise<void> {
  const ref = doc(firestore, COLLECTION, matchId);
  await updateDoc(ref, { status }).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: { status },
    }));
    throw serverError;
  });
}
