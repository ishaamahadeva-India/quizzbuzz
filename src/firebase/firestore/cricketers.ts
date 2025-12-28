'use client';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type CricketerData = {
  name: string;
  country: string;
  roles: string[];
  avatarUrl?: string;
};

/**
 * Adds a new cricketer to the 'cricketers' collection.
 * @param firestore - The Firestore instance.
 * @param data - The data for the new cricketer.
 */
export function addCricketer(firestore: Firestore, data: CricketerData) {
  const cricketersCollection = collection(firestore, 'cricketers');
  
  // Remove undefined values - Firestore doesn't allow undefined
  const cleanData: Record<string, any> = {
    name: data.name,
    country: data.country,
    roles: data.roles,
  };
  
  // Only include avatarUrl if it's defined and not empty
  if (data.avatarUrl !== undefined && data.avatarUrl !== null && data.avatarUrl.trim() !== '') {
    cleanData.avatarUrl = data.avatarUrl;
  }
  
  return addDoc(cricketersCollection, cleanData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: cricketersCollection.path,
      operation: 'create',
      requestResourceData: cleanData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw to be caught by the caller
  });
}

/**
 * Updates an existing cricketer in the 'cricketers' collection.
 * @param firestore - The Firestore instance.
 * @param cricketerId - The ID of the cricketer to update.
 * @param data - The data to update.
 */
export function updateCricketer(
  firestore: Firestore,
  cricketerId: string,
  data: Partial<CricketerData>
) {
  const cricketerDocRef = doc(firestore, 'cricketers', cricketerId);
  
  // Remove undefined values - Firestore doesn't allow undefined
  const cleanData: Record<string, any> = {};
  
  // Only include fields that are defined
  if (data.name !== undefined) cleanData.name = data.name;
  if (data.country !== undefined) cleanData.country = data.country;
  if (data.roles !== undefined) cleanData.roles = data.roles;
  
  // Only include avatarUrl if it's defined and not empty
  if (data.avatarUrl !== undefined && data.avatarUrl !== null && data.avatarUrl.trim() !== '') {
    cleanData.avatarUrl = data.avatarUrl;
  }
  
  return updateDoc(cricketerDocRef, cleanData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: cricketerDocRef.path,
      operation: 'update',
      requestResourceData: cleanData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw to be caught by the caller
  });
}

/**
 * Deletes a cricketer from the 'cricketers' collection.
 * @param firestore - The Firestore instance.
 * @param cricketerId - The ID of the cricketer to delete.
 */
export function deleteCricketer(firestore: Firestore, cricketerId: string) {
    const cricketerDocRef = doc(firestore, 'cricketers', cricketerId);
    return deleteDoc(cricketerDocRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: cricketerDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}
