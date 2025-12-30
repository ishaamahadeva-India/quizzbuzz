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
  increment,
  type Firestore 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Voucher, VoucherRedemption } from '@/lib/types';
import { updateUserPoints } from './users';

type NewVoucher = Omit<Voucher, 'id' | 'createdAt' | 'updatedAt'>;
type NewVoucherRedemption = Omit<VoucherRedemption, 'id' | 'redeemedAt' | 'fulfilledAt'>;

/**
 * Adds a new voucher
 */
export async function addVoucher(firestore: Firestore, voucherData: NewVoucher): Promise<string> {
  const vouchersCollection = collection(firestore, 'vouchers');
  const docToSave = {
    ...voucherData,
    redeemedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(vouchersCollection, docToSave);
    return docRef.id;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: vouchersCollection.path,
      operation: 'create',
      requestResourceData: docToSave,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Updates a voucher
 */
export async function updateVoucher(
  firestore: Firestore,
  voucherId: string,
  voucherData: Partial<NewVoucher>
): Promise<void> {
  const voucherDocRef = doc(firestore, 'vouchers', voucherId);
  const updateData = {
    ...voucherData,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(voucherDocRef, updateData);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: voucherDocRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Deletes a voucher
 */
export async function deleteVoucher(firestore: Firestore, voucherId: string): Promise<void> {
  const voucherDocRef = doc(firestore, 'vouchers', voucherId);

  try {
    await deleteDoc(voucherDocRef);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: voucherDocRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Gets all active vouchers
 */
export async function getActiveVouchers(firestore: Firestore): Promise<(Voucher & { id: string })[]> {
  const vouchersCollection = collection(firestore, 'vouchers');
  const q = query(
    vouchersCollection,
    where('active', '==', true),
    orderBy('pointsRequired', 'asc')
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (Voucher & { id: string })[];
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: vouchersCollection.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Gets all vouchers (for admin)
 */
export async function getAllVouchers(firestore: Firestore): Promise<(Voucher & { id: string })[]> {
  const vouchersCollection = collection(firestore, 'vouchers');
  const q = query(vouchersCollection, orderBy('pointsRequired', 'asc'));

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (Voucher & { id: string })[];
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: vouchersCollection.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Redeems a voucher for a user
 */
export async function redeemVoucher(
  firestore: Firestore,
  userId: string,
  voucherId: string
): Promise<string> {
  // Get voucher details
  const voucherDocRef = doc(firestore, 'vouchers', voucherId);
  const voucherDoc = await getDoc(voucherDocRef);
  
  if (!voucherDoc.exists()) {
    throw new Error('Voucher not found');
  }

  const voucher = { id: voucherDoc.id, ...voucherDoc.data() } as Voucher & { id: string };

  if (!voucher.active) {
    throw new Error('Voucher is not active');
  }

  // Check stock
  if (voucher.stock !== undefined && (voucher.redeemedCount || 0) >= voucher.stock) {
    throw new Error('Voucher is out of stock');
  }

  // Get user profile to check points
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userPoints = userDoc.data()?.points || 0;
  
  if (userPoints < voucher.pointsRequired) {
    throw new Error(`Insufficient points. Required: ${voucher.pointsRequired}, Available: ${userPoints}`);
  }

  // Deduct points
  await updateUserPoints(
    firestore,
    userId,
    -voucher.pointsRequired,
    `Redeemed voucher: ${voucher.name}`,
    { type: 'voucher_redemption', voucherId: voucher.id }
  );

  // Create redemption record
  const redemptionsCollection = collection(firestore, 'voucher-redemptions');
  const redemptionData: NewVoucherRedemption = {
    userId,
    voucherId: voucher.id,
    voucherName: voucher.name,
    pointsSpent: voucher.pointsRequired,
    voucherValue: voucher.value,
    status: 'pending', // Admin will fulfill and provide voucher code
  };

  try {
    const redemptionRef = await addDoc(redemptionsCollection, {
      ...redemptionData,
      redeemedAt: serverTimestamp(),
    });

    // Update voucher redeemed count
    await updateDoc(voucherDocRef, {
      redeemedCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return redemptionRef.id;
  } catch (serverError: any) {
    // Refund points if redemption record creation fails
    await updateUserPoints(
      firestore,
      userId,
      voucher.pointsRequired,
      `Refund for failed voucher redemption: ${voucher.name}`,
      { type: 'refund', voucherId: voucher.id }
    );

    const permissionError = new FirestorePermissionError({
      path: redemptionsCollection.path,
      operation: 'create',
      requestResourceData: redemptionData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Gets user's voucher redemptions
 */
export async function getUserRedemptions(
  firestore: Firestore,
  userId: string
): Promise<(VoucherRedemption & { id: string })[]> {
  const redemptionsCollection = collection(firestore, 'voucher-redemptions');
  const q = query(
    redemptionsCollection,
    where('userId', '==', userId),
    orderBy('redeemedAt', 'desc')
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (VoucherRedemption & { id: string })[];
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: redemptionsCollection.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/**
 * Fulfills a voucher redemption (admin only)
 */
export async function fulfillVoucherRedemption(
  firestore: Firestore,
  redemptionId: string,
  voucherCode: string,
  notes?: string
): Promise<void> {
  const redemptionDocRef = doc(firestore, 'voucher-redemptions', redemptionId);
  const updateData = {
    status: 'fulfilled' as const,
    voucherCode,
    fulfilledAt: serverTimestamp(),
    notes: notes || '',
  };

  try {
    await updateDoc(redemptionDocRef, updateData);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: redemptionDocRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

