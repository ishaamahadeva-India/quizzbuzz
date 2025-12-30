'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  Timestamp,
  type Firestore,
  type Query,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { ImageAdvertisement } from '@/lib/types';

type NewImageAdvertisement = Omit<ImageAdvertisement, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to safely convert various date types to Date objects
function toDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (dateValue instanceof Timestamp) return dateValue.toDate();
  if (typeof dateValue === 'object' && dateValue !== null && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  if (typeof dateValue === 'number') return new Date(dateValue);
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

// Helper function to remove undefined values from an object recursively
function removeUndefinedValues(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Skip undefined values
    }
    // Handle arrays
    if (Array.isArray(value)) {
      cleaned[key] = value.map(item => 
        typeof item === 'object' && item !== null ? removeUndefinedValues(item) : item
      );
    }
    // Handle nested objects
    else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      cleaned[key] = removeUndefinedValues(value);
    }
    // Handle strings - filter out empty strings for optional fields
    else if (typeof value === 'string' && value.trim() === '') {
      continue; // Skip empty strings for optional fields
    }
    else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Creates a new image advertisement
 */
export function createImageAdvertisement(
  firestore: Firestore,
  adData: NewImageAdvertisement
) {
  const adsCollection = collection(firestore, 'image-advertisements');
  
  // Build the document to save, explicitly including required fields
  const docToSave: Record<string, any> = {
    sponsorId: adData.sponsorId,
    sponsorName: adData.sponsorName,
    title: adData.title,
    imageUrl: adData.imageUrl,
    status: adData.status,
    startDate: adData.startDate,
    endDate: adData.endDate,
    priority: adData.priority,
    displayDuration: adData.displayDuration,
    currentViews: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Add optional fields only if they have values
  if (adData.description && adData.description.trim() !== '') {
    docToSave.description = adData.description;
  }
  if (adData.thumbnailUrl && adData.thumbnailUrl.trim() !== '') {
    docToSave.thumbnailUrl = adData.thumbnailUrl;
  }
  if (adData.clickThroughUrl && adData.clickThroughUrl.trim() !== '') {
    docToSave.clickThroughUrl = adData.clickThroughUrl;
  }
  if (adData.maxViews !== undefined && adData.maxViews !== null) {
    docToSave.maxViews = adData.maxViews;
  }
  if (adData.maxViewsPerUser !== undefined && adData.maxViewsPerUser !== null) {
    docToSave.maxViewsPerUser = adData.maxViewsPerUser;
  }
  if (adData.allowMultipleViews !== undefined) {
    docToSave.allowMultipleViews = adData.allowMultipleViews;
  }
  if (adData.repeatInterval !== undefined) {
    docToSave.repeatInterval = adData.repeatInterval;
  }
  if (adData.minTimeBetweenViews !== undefined && adData.minTimeBetweenViews !== null) {
    docToSave.minTimeBetweenViews = adData.minTimeBetweenViews;
  }
  if (adData.targetTournaments && adData.targetTournaments.length > 0) {
    docToSave.targetTournaments = adData.targetTournaments;
  }
  if (adData.trackingPixel && adData.trackingPixel.trim() !== '') {
    docToSave.trackingPixel = adData.trackingPixel;
  }
  if (adData.createdBy && adData.createdBy.trim() !== '') {
    docToSave.createdBy = adData.createdBy;
  }
  
  // Clean undefined values as a final safety check
  const cleanData = removeUndefinedValues(docToSave);

  return addDoc(adsCollection, cleanData)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: adsCollection.path,
        operation: 'create',
        requestResourceData: docToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Updates an existing image advertisement
 */
export function updateImageAdvertisement(
  firestore: Firestore,
  adId: string,
  adData: Partial<NewImageAdvertisement>
) {
  const adDocRef = doc(firestore, 'image-advertisements', adId);
  
  // Build the document to update, explicitly including only defined fields
  const docToUpdate: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  
  // Add fields only if they are defined and have values
  if (adData.sponsorId !== undefined) {
    docToUpdate.sponsorId = adData.sponsorId;
  }
  if (adData.sponsorName !== undefined) {
    docToUpdate.sponsorName = adData.sponsorName;
  }
  if (adData.title !== undefined) {
    docToUpdate.title = adData.title;
  }
  if (adData.imageUrl !== undefined) {
    docToUpdate.imageUrl = adData.imageUrl;
  }
  if (adData.status !== undefined) {
    docToUpdate.status = adData.status;
  }
  if (adData.startDate !== undefined) {
    docToUpdate.startDate = adData.startDate;
  }
  if (adData.endDate !== undefined) {
    docToUpdate.endDate = adData.endDate;
  }
  if (adData.priority !== undefined) {
    docToUpdate.priority = adData.priority;
  }
  if (adData.displayDuration !== undefined) {
    docToUpdate.displayDuration = adData.displayDuration;
  }
  if (adData.description !== undefined && adData.description.trim() !== '') {
    docToUpdate.description = adData.description;
  }
  if (adData.thumbnailUrl !== undefined && adData.thumbnailUrl.trim() !== '') {
    docToUpdate.thumbnailUrl = adData.thumbnailUrl;
  }
  if (adData.clickThroughUrl !== undefined && adData.clickThroughUrl.trim() !== '') {
    docToUpdate.clickThroughUrl = adData.clickThroughUrl;
  }
  if (adData.maxViews !== undefined && adData.maxViews !== null) {
    docToUpdate.maxViews = adData.maxViews;
  }
  if (adData.maxViewsPerUser !== undefined && adData.maxViewsPerUser !== null) {
    docToUpdate.maxViewsPerUser = adData.maxViewsPerUser;
  }
  if (adData.allowMultipleViews !== undefined) {
    docToUpdate.allowMultipleViews = adData.allowMultipleViews;
  }
  if (adData.repeatInterval !== undefined) {
    docToUpdate.repeatInterval = adData.repeatInterval;
  }
  if (adData.minTimeBetweenViews !== undefined && adData.minTimeBetweenViews !== null) {
    docToUpdate.minTimeBetweenViews = adData.minTimeBetweenViews;
  }
  if (adData.targetTournaments !== undefined && adData.targetTournaments.length > 0) {
    docToUpdate.targetTournaments = adData.targetTournaments;
  }
  if (adData.targetCampaigns !== undefined && adData.targetCampaigns.length > 0) {
    docToUpdate.targetCampaigns = adData.targetCampaigns;
  }
  if (adData.trackingPixel !== undefined && adData.trackingPixel.trim() !== '') {
    docToUpdate.trackingPixel = adData.trackingPixel;
  }
  if (adData.createdBy !== undefined && adData.createdBy.trim() !== '') {
    docToUpdate.createdBy = adData.createdBy;
  }
  
  // Clean undefined values as a final safety check
  const cleanData = removeUndefinedValues(docToUpdate);

  return updateDoc(adDocRef, cleanData)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: adDocRef.path,
        operation: 'update',
        requestResourceData: docToUpdate,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Deletes an image advertisement
 */
export function deleteImageAdvertisement(
  firestore: Firestore,
  adId: string
) {
  const adDocRef = doc(firestore, 'image-advertisements', adId);
  return deleteDoc(adDocRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: adDocRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Gets active advertisements for a tournament
 */
export async function getActiveAdsForTournament(
  firestore: Firestore,
  tournamentId: string
): Promise<ImageAdvertisement[]> {
  const adsCollection = collection(firestore, 'image-advertisements');
  const now = new Date();
  
  const q = query(
    adsCollection,
    where('status', '==', 'active'),
    where('startDate', '<=', now),
    where('endDate', '>=', now)
  );

  const snapshot = await getDocs(q);
  const ads: ImageAdvertisement[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    // Check if ad targets this tournament
    if (
      !data.targetTournaments ||
      data.targetTournaments.length === 0 ||
      data.targetTournaments.includes(tournamentId)
    ) {
      // Check view limits
      if (!data.maxViews || data.currentViews < data.maxViews) {
        ads.push({
          id: docSnapshot.id,
          ...data,
          startDate: toDate(data.startDate) || new Date(),
          endDate: toDate(data.endDate) || new Date(),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        } as ImageAdvertisement);
      }
    }
  });

  // Sort by priority (highest first)
  ads.sort((a, b) => b.priority - a.priority);

  return ads;
}

/**
 * Gets active advertisements for a campaign (movie fantasy)
 */
export async function getActiveAdsForCampaign(
  firestore: Firestore,
  campaignId: string
): Promise<ImageAdvertisement[]> {
  const adsCollection = collection(firestore, 'image-advertisements');
  const now = new Date();
  
  const q = query(
    adsCollection,
    where('status', '==', 'active'),
    where('startDate', '<=', now),
    where('endDate', '>=', now)
  );

  const snapshot = await getDocs(q);
  const ads: ImageAdvertisement[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    // Check if ad targets this campaign
    // If targetCampaigns is empty/undefined, show for all campaigns
    // If targetCampaigns has values, only show if campaignId is in the list
    if (
      !data.targetCampaigns ||
      data.targetCampaigns.length === 0 ||
      data.targetCampaigns.includes(campaignId)
    ) {
      // Check view limits
      if (!data.maxViews || data.currentViews < data.maxViews) {
        ads.push({
          id: docSnapshot.id,
          ...data,
          startDate: toDate(data.startDate) || new Date(),
          endDate: toDate(data.endDate) || new Date(),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        } as ImageAdvertisement);
      }
    }
  });

  // Sort by priority (highest first)
  ads.sort((a, b) => b.priority - a.priority);

  return ads;
}

/**
 * Selects the best ad for a user/tournament combination
 */
export async function selectAdForEntry(
  firestore: Firestore,
  tournamentId: string,
  userId: string
): Promise<ImageAdvertisement | null> {
  const activeAds = await getActiveAdsForTournament(firestore, tournamentId);
  
  if (activeAds.length === 0) {
    return null;
  }

  // Filter by user eligibility
  const eligibleAds = activeAds.filter((ad) => {
    // Check per-user view limit
    if (ad.maxViewsPerUser) {
      // This will be checked when creating the view
      // For now, we'll filter in the view creation function
    }
    return true;
  });

  // Return highest priority ad that allows multiple views or hasn't been viewed
  // Priority: ads with allowMultipleViews=true or repeatInterval!='never' first
  eligibleAds.sort((a, b) => {
    const aAllowsRepeat = a.allowMultipleViews || (a.repeatInterval && a.repeatInterval !== 'never');
    const bAllowsRepeat = b.allowMultipleViews || (b.repeatInterval && b.repeatInterval !== 'never');
    
    if (aAllowsRepeat && !bAllowsRepeat) return -1;
    if (!aAllowsRepeat && bAllowsRepeat) return 1;
    
    // Then by priority
    return b.priority - a.priority;
  });

  return eligibleAds[0] || null;
}

/**
 * Selects the best ad for a user/campaign combination (movie fantasy)
 */
export async function selectAdForCampaign(
  firestore: Firestore,
  campaignId: string,
  userId: string
): Promise<ImageAdvertisement | null> {
  const activeAds = await getActiveAdsForCampaign(firestore, campaignId);
  
  if (activeAds.length === 0) {
    return null;
  }

  // Filter by user eligibility
  const eligibleAds = activeAds.filter((ad) => {
    // Check per-user view limit
    if (ad.maxViewsPerUser) {
      // This will be checked when creating the view
      // For now, we'll filter in the view creation function
    }
    return true;
  });

  // Return highest priority ad that allows multiple views or hasn't been viewed
  // Priority: ads with allowMultipleViews=true or repeatInterval!='never' first
  eligibleAds.sort((a, b) => {
    const aAllowsRepeat = a.allowMultipleViews || (a.repeatInterval && a.repeatInterval !== 'never');
    const bAllowsRepeat = b.allowMultipleViews || (b.repeatInterval && b.repeatInterval !== 'never');
    
    if (aAllowsRepeat && !bAllowsRepeat) return -1;
    if (!aAllowsRepeat && bAllowsRepeat) return 1;
    
    // Then by priority
    return b.priority - a.priority;
  });

  return eligibleAds[0] || null;
}

/**
 * Selects multiple ads (up to count) for sequential display in tournaments
 * Returns up to 3 ads with different durations (9s, 6s, 5s)
 */
export async function selectMultipleAdsForEntry(
  firestore: Firestore,
  tournamentId: string,
  userId: string,
  count: number = 3
): Promise<ImageAdvertisement[]> {
  const activeAds = await getActiveAdsForTournament(firestore, tournamentId);
  
  if (activeAds.length === 0) {
    return [];
  }

  // Filter by user eligibility
  const eligibleAds = activeAds.filter((ad) => {
    // Check per-user view limit
    if (ad.maxViewsPerUser) {
      // This will be checked when creating the view
      // For now, we'll filter in the view creation function
    }
    return true;
  });

  // Sort by priority: ads with allowMultipleViews=true or repeatInterval!='never' first
  eligibleAds.sort((a, b) => {
    const aAllowsRepeat = a.allowMultipleViews || (a.repeatInterval && a.repeatInterval !== 'never');
    const bAllowsRepeat = b.allowMultipleViews || (b.repeatInterval && b.repeatInterval !== 'never');
    
    if (aAllowsRepeat && !bAllowsRepeat) return -1;
    if (!aAllowsRepeat && bAllowsRepeat) return 1;
    
    // Then by priority
    return b.priority - a.priority;
  });

  // Select up to count ads, avoiding duplicates
  const selectedAds: ImageAdvertisement[] = [];
  const usedIds = new Set<string>();

  for (const ad of eligibleAds) {
    if (selectedAds.length >= count) break;
    
    // Skip if already selected (avoid duplicates)
    if (!usedIds.has(ad.id)) {
      selectedAds.push(ad);
      usedIds.add(ad.id);
    }
  }

  // If we don't have enough unique ads, we can repeat the highest priority ad
  // but only if it allows multiple views
  while (selectedAds.length < count && eligibleAds.length > 0) {
    const topAd = eligibleAds[0];
    if (topAd.allowMultipleViews || (topAd.repeatInterval && topAd.repeatInterval !== 'never')) {
      selectedAds.push(topAd);
    } else {
      break; // Can't repeat this ad
    }
  }

  return selectedAds;
}

/**
 * Selects multiple ads (up to count) for sequential display in campaigns
 * Returns up to 3 ads with different durations (9s, 6s, 5s)
 */
export async function selectMultipleAdsForCampaign(
  firestore: Firestore,
  campaignId: string,
  userId: string,
  count: number = 3
): Promise<ImageAdvertisement[]> {
  const activeAds = await getActiveAdsForCampaign(firestore, campaignId);
  
  if (activeAds.length === 0) {
    return [];
  }

  // Filter by user eligibility
  const eligibleAds = activeAds.filter((ad) => {
    // Check per-user view limit
    if (ad.maxViewsPerUser) {
      // This will be checked when creating the view
      // For now, we'll filter in the view creation function
    }
    return true;
  });

  // Sort by priority: ads with allowMultipleViews=true or repeatInterval!='never' first
  eligibleAds.sort((a, b) => {
    const aAllowsRepeat = a.allowMultipleViews || (a.repeatInterval && a.repeatInterval !== 'never');
    const bAllowsRepeat = b.allowMultipleViews || (b.repeatInterval && b.repeatInterval !== 'never');
    
    if (aAllowsRepeat && !bAllowsRepeat) return -1;
    if (!aAllowsRepeat && bAllowsRepeat) return 1;
    
    // Then by priority
    return b.priority - a.priority;
  });

  // Select up to count ads, avoiding duplicates
  const selectedAds: ImageAdvertisement[] = [];
  const usedIds = new Set<string>();

  for (const ad of eligibleAds) {
    if (selectedAds.length >= count) break;
    
    // Skip if already selected (avoid duplicates)
    if (!usedIds.has(ad.id)) {
      selectedAds.push(ad);
      usedIds.add(ad.id);
    }
  }

  // If we don't have enough unique ads, we can repeat the highest priority ad
  // but only if it allows multiple views
  while (selectedAds.length < count && eligibleAds.length > 0) {
    const topAd = eligibleAds[0];
    if (topAd.allowMultipleViews || (topAd.repeatInterval && topAd.repeatInterval !== 'never')) {
      selectedAds.push(topAd);
    } else {
      break; // Can't repeat this ad
    }
  }

  return selectedAds;
}

/**
 * Increments the view count for an advertisement
 */
export function incrementAdViews(
  firestore: Firestore,
  adId: string
) {
  const adDocRef = doc(firestore, 'image-advertisements', adId);
  return updateDoc(adDocRef, {
    currentViews: increment(1),
    updatedAt: serverTimestamp(),
  });
}

