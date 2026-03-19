'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
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
  data: {
    teamA: string;
    teamB: string;
    matchStartTime: Date;
    status?: IPLMatchStatus;
    matchKey?: string;
  }
): Promise<string> {
  const col = collection(firestore, COLLECTION);
  const docToSave: Record<string, unknown> = {
    teamA: data.teamA,
    teamB: data.teamB,
    matchStartTime: data.matchStartTime instanceof Date
      ? Timestamp.fromDate(data.matchStartTime)
      : data.matchStartTime,
    status: data.status ?? 'upcoming',
  };
  if (data.matchKey != null) docToSave.matchKey = data.matchKey;
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

export async function updateIPLMatch(
  firestore: Firestore,
  matchId: string,
  data: {
    teamA?: string;
    teamB?: string;
    matchStartTime?: Date;
    status?: IPLMatchStatus;
    winnerTeamId?: string | null;
  }
): Promise<void> {
  const ref = doc(firestore, COLLECTION, matchId);
  const updateData: Record<string, unknown> = {};
  if (data.teamA !== undefined) updateData.teamA = data.teamA;
  if (data.teamB !== undefined) updateData.teamB = data.teamB;
  if (data.matchStartTime !== undefined) {
    updateData.matchStartTime = Timestamp.fromDate(data.matchStartTime);
  }
  if (data.status !== undefined) updateData.status = data.status;
  if (data.winnerTeamId !== undefined) {
    if (data.winnerTeamId === null) {
      const { deleteField } = await import('firebase/firestore');
      updateData.winnerTeamId = deleteField();
    } else {
      updateData.winnerTeamId = data.winnerTeamId;
    }
  }
  await updateDoc(ref, updateData as never).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: updateData,
    }));
    throw serverError;
  });
}

export async function deleteIPLMatch(firestore: Firestore, matchId: string): Promise<void> {
  const ref = doc(firestore, COLLECTION, matchId);
  await deleteDoc(ref).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'delete',
      requestResourceData: {},
    }));
    throw serverError;
  });
}

/** Latest matches first (admin list). */
export async function getIPLMatchesDescending(
  firestore: Firestore
): Promise<(IPLMatch & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, orderBy('matchStartTime', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toMatch({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

/** Get all matchKeys present in ipl_matches (for duplicate prevention). */
export async function getExistingIPLMatchKeys(firestore: Firestore): Promise<Set<string>> {
  const col = collection(firestore, COLLECTION);
  const snapshot = await getDocs(col);
  const keys = new Set<string>();
  snapshot.docs.forEach((d) => {
    const key = d.data().matchKey as string | undefined;
    if (key) keys.add(key);
  });
  return keys;
}

export type InsertGeneratedScheduleResult = {
  inserted: number;
  skipped: number;
  errors: string[];
  cricketInserted: number;
  cricketSkipped: number;
  cricketErrors: string[];
};

/**
 * Generate full IPL schedule: insert into ipl_matches and create corresponding cricket matches
 * in fantasy_matches (T20/IPL) so users can join either unified IPL fantasy or individual match fantasy.
 * Skips duplicates by matchKey (ipl_matches) and iplMatchKey (fantasy_matches).
 */
export async function insertGeneratedIPLSchedule(
  firestore: Firestore,
  options?: { startDate?: string; useOfficialFirstPhase?: boolean }
): Promise<InsertGeneratedScheduleResult> {
  const { addCricketMatch, getExistingCricketMatchIPLKeys } = await import('./cricket-matches');
  const { generateIPLSchedule } = await import('@/lib/ipl-schedule-generator');
  const [existing, cricketExisting] = await Promise.all([
    getExistingIPLMatchKeys(firestore),
    getExistingCricketMatchIPLKeys(firestore),
  ]);
  const matches = generateIPLSchedule({
    startDate: options?.startDate ?? '2026-03-28',
    includePlayoffs: true,
    useOfficialFirstPhase: options?.useOfficialFirstPhase !== false,
  });
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];
  let cricketInserted = 0;
  let cricketSkipped = 0;
  const cricketErrors: string[] = [];

  for (const m of matches) {
    if (existing.has(m.matchKey)) {
      skipped++;
    } else {
      try {
        await addIPLMatch(firestore, {
          teamA: m.teamA,
          teamB: m.teamB,
          matchStartTime: m.matchStartTime,
          status: m.status,
          matchKey: m.matchKey,
        });
        inserted++;
        existing.add(m.matchKey);
      } catch (e) {
        errors.push(`${m.teamA} vs ${m.teamB} @ ${m.matchStartTime.toISOString()}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (cricketExisting.has(m.matchKey)) {
      cricketSkipped++;
    } else {
      try {
        await addCricketMatch(firestore, {
          matchName: `${m.teamA} vs ${m.teamB}`,
          format: 'IPL',
          teams: [m.teamA, m.teamB],
          team1: m.teamA,
          team2: m.teamB,
          startTime: m.matchStartTime,
          status: 'upcoming',
          entryFee: { type: 'free' },
          iplMatchKey: m.matchKey,
        });
        cricketInserted++;
        cricketExisting.add(m.matchKey);
      } catch (e) {
        cricketErrors.push(`${m.teamA} vs ${m.teamB}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return {
    inserted,
    skipped,
    errors,
    cricketInserted,
    cricketSkipped,
    cricketErrors,
  };
}
