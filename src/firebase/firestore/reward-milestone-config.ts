'use client';

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { RewardMilestoneConfig } from '@/lib/types';

import type { NewRewardMilestoneConfig } from '@/lib/types';

/**
 * Adds a new reward milestone configuration
 */
export async function addRewardMilestone(
  firestore: Firestore, 
  config: NewRewardMilestoneConfig
): Promise<string> {
  const milestonesCollection = collection(firestore, 'reward-milestones');
  const docToSave = {
    ...config,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(milestonesCollection, docToSave);
    return docRef.id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: milestonesCollection.path,
      operation: 'create',
      requestResourceData: docToSave,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Updates a reward milestone configuration
 */
export async function updateRewardMilestone(
  firestore: Firestore,
  milestoneId: string,
  config: Partial<NewRewardMilestoneConfig>
): Promise<void> {
  const milestoneDocRef = doc(firestore, 'reward-milestones', milestoneId);
  const updateData = {
    ...config,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(milestoneDocRef, updateData);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: milestoneDocRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Deletes a reward milestone configuration
 */
export async function deleteRewardMilestone(
  firestore: Firestore,
  milestoneId: string
): Promise<void> {
  const milestoneDocRef = doc(firestore, 'reward-milestones', milestoneId);

  try {
    await deleteDoc(milestoneDocRef);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: milestoneDocRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Gets all reward milestone configurations
 */
export async function getAllRewardMilestones(
  firestore: Firestore
): Promise<(RewardMilestoneConfig & { id: string })[]> {
  const milestonesCollection = collection(firestore, 'reward-milestones');
  const q = query(milestonesCollection, orderBy('createdAt', 'desc'));

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (RewardMilestoneConfig & { id: string })[];
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: milestonesCollection.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Gets active reward milestone configurations
 */
export async function getActiveRewardMilestones(
  firestore: Firestore
): Promise<(RewardMilestoneConfig & { id: string })[]> {
  const milestonesCollection = collection(firestore, 'reward-milestones');
  const q = query(
    milestonesCollection,
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (RewardMilestoneConfig & { id: string })[];
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: milestonesCollection.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

