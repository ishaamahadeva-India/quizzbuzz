
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

type TeamData = {
  name: string;
  type: 'ip' | 'national';
  logoUrl?: string;
};

/**
 * Adds a new team to the 'teams' collection.
 * @param firestore - The Firestore instance.
 * @param data - The data for the new team.
 */
export function addTeam(firestore: Firestore, data: TeamData) {
  const teamsCollection = collection(firestore, 'teams');
  
  // Remove undefined values - Firestore doesn't allow undefined
  const cleanData: Record<string, any> = {
    name: data.name,
    type: data.type,
  };
  
  // Only include logoUrl if it's defined and not empty
  if (data.logoUrl !== undefined && data.logoUrl !== null && data.logoUrl.trim() !== '') {
    cleanData.logoUrl = data.logoUrl;
  }
  
  return addDoc(teamsCollection, cleanData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: teamsCollection.path,
      operation: 'create',
      requestResourceData: cleanData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

/**
 * Updates an existing team in the 'teams' collection.
 * @param firestore - The Firestore instance.
 * @param teamId - The ID of the team to update.
 * @param data - The data to update.
 */
export function updateTeam(
  firestore: Firestore,
  teamId: string,
  data: Partial<TeamData>
) {
  const teamDocRef = doc(firestore, 'teams', teamId);
  
  // Remove undefined values - Firestore doesn't allow undefined
  const cleanData: Record<string, any> = {};
  
  // Only include fields that are defined
  if (data.name !== undefined) cleanData.name = data.name;
  if (data.type !== undefined) cleanData.type = data.type;
  
  // Only include logoUrl if it's defined and not empty
  if (data.logoUrl !== undefined && data.logoUrl !== null && data.logoUrl.trim() !== '') {
    cleanData.logoUrl = data.logoUrl;
  }
  
  return updateDoc(teamDocRef, cleanData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: teamDocRef.path,
      operation: 'update',
      requestResourceData: cleanData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

/**
 * Deletes a team from the 'teams' collection.
 * @param firestore - The Firestore instance.
 * @param teamId - The ID of the team to delete.
 */
export function deleteTeam(firestore: Firestore, teamId: string) {
    const teamDocRef = doc(firestore, 'teams', teamId);
    return deleteDoc(teamDocRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: teamDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}
