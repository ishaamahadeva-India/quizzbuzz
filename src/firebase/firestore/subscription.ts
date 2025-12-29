'use client';

import { Firestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Updates user subscription status
 * @param firestore - The Firestore instance
 * @param userId - The user ID
 * @param subscriptionData - Subscription data to update
 */
export async function updateSubscription(
  firestore: Firestore,
  userId: string,
  subscriptionData: {
    isSubscribed: boolean;
    subscriptionStartDate: Date;
    subscriptionEndDate: Date;
    subscriptionPlan: 'annual';
    paymentId: string;
    subscriptionStatus: 'active' | 'expired' | 'cancelled';
  }
) {
  const userRef = doc(firestore, 'users', userId);
  
  try {
    await updateDoc(userRef, {
      ...subscriptionData,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: subscriptionData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  }
}

/**
 * Checks if user subscription is active
 * @param subscriptionEndDate - Subscription end date
 * @returns boolean indicating if subscription is active
 */
export function isSubscriptionActive(subscriptionEndDate?: Date): boolean {
  if (!subscriptionEndDate) return false;
  return new Date() < subscriptionEndDate;
}

