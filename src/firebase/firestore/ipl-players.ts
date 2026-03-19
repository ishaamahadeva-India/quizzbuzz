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
  type Firestore,
  type Unsubscribe,
  onSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { IPLPlayer } from '@/lib/types';

const COLLECTION = 'ipl_players';

function docToPlayer(docSnap: { id: string; data: () => Record<string, unknown> }): IPLPlayer & { id: string } {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    name: (d.name as string) ?? '',
    team: (d.team as string) ?? '',
    role: (d.role as IPLPlayer['role']) ?? 'batsman',
    isActive: (d.isActive as boolean) ?? true,
    isEmerging: (d.isEmerging as boolean) ?? false,
  };
}

export async function getIPLPlayers(firestore: Firestore): Promise<(IPLPlayer & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('isActive', '==', true), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToPlayer({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getIPLPlayersByTeam(
  firestore: Firestore,
  team: string
): Promise<(IPLPlayer & { id: string })[]> {
  const col = collection(firestore, COLLECTION);
  const q = query(col, where('team', '==', team), where('isActive', '==', true), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToPlayer({ id: d.id, data: () => d.data() as Record<string, unknown> }));
}

export async function getIPLPlayer(
  firestore: Firestore,
  playerId: string
): Promise<(IPLPlayer & { id: string }) | null> {
  const ref = doc(firestore, COLLECTION, playerId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return docToPlayer({ id: snapshot.id, data: () => snapshot.data() as Record<string, unknown> });
}

export async function addIPLPlayer(
  firestore: Firestore,
  data: Omit<IPLPlayer, 'id'>
): Promise<string> {
  const col = collection(firestore, COLLECTION);
  const docToSave = {
    name: data.name,
    team: data.team,
    role: data.role,
    isActive: data.isActive ?? true,
    ...(data.isEmerging != null ? { isEmerging: data.isEmerging } : {}),
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

export async function updateIPLPlayer(
  firestore: Firestore,
  playerId: string,
  data: Partial<Omit<IPLPlayer, 'id'>>
): Promise<void> {
  const ref = doc(firestore, COLLECTION, playerId);
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.team !== undefined) updateData.team = data.team;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isEmerging !== undefined) updateData.isEmerging = data.isEmerging;
  await updateDoc(ref, updateData as never).catch((serverError) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: ref.path,
      operation: 'update',
      requestResourceData: updateData,
    }));
    throw serverError;
  });
}
