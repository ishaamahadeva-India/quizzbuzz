'use client';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { ImageAdView } from '@/lib/types';

type NewImageAdView = Omit<ImageAdView, 'id'>;

/**
 * Creates a new ad view record
 */
export function createImageAdView(
  firestore: Firestore,
  viewData: NewImageAdView
) {
  const viewsCollection = collection(firestore, 'image-ad-views');
  // Preserve wasCompleted and clicked if provided, otherwise use defaults
  const docToSave = {
    ...viewData,
    viewedAt: serverTimestamp(),
    wasCompleted: viewData.wasCompleted !== undefined ? viewData.wasCompleted : false,
    clicked: viewData.clicked !== undefined ? viewData.clicked : false,
  };

  return addDoc(viewsCollection, docToSave)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: viewsCollection.path,
        operation: 'create',
        requestResourceData: docToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Updates ad view progress
 */
export function updateImageAdViewProgress(
  firestore: Firestore,
  viewId: string,
  progress: {
    viewedDuration: number;
    wasCompleted: boolean;
  }
) {
  const viewDocRef = doc(firestore, 'image-ad-views', viewId);
  const updateData = {
    viewedDuration: progress.viewedDuration,
    wasCompleted: progress.wasCompleted,
    updatedAt: serverTimestamp(),
  };

  return updateDoc(viewDocRef, updateData)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: viewDocRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Marks ad view as completed
 */
export function completeImageAdView(
  firestore: Firestore,
  viewId: string
) {
  const viewDocRef = doc(firestore, 'image-ad-views', viewId);
  const updateData = {
    wasCompleted: true,
    updatedAt: serverTimestamp(),
  };

  return updateDoc(viewDocRef, updateData)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: viewDocRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Tracks click-through on ad
 */
export function trackImageAdClick(
  firestore: Firestore,
  viewId: string,
  clickThroughUrl: string
) {
  const viewDocRef = doc(firestore, 'image-ad-views', viewId);
  return updateDoc(viewDocRef, {
    clicked: true,
    clickedAt: serverTimestamp(),
    clickThroughUrl,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Checks if user has viewed an ad for a tournament
 * Returns true if user should NOT see ad (already viewed based on repeat rules)
 */
export async function hasUserViewedAd(
  firestore: Firestore,
  userId: string,
  tournamentId: string,
  advertisementId?: string,
  repeatInterval?: 'never' | 'always' | 'daily' | 'weekly' | 'session',
  minTimeBetweenViews?: number
): Promise<boolean> {
  const viewsCollection = collection(firestore, 'image-ad-views');
  let q;

  if (advertisementId) {
    q = query(
      viewsCollection,
      where('userId', '==', userId),
      where('tournamentId', '==', tournamentId),
      where('advertisementId', '==', advertisementId),
      where('wasCompleted', '==', true)
    );
  } else {
    q = query(
      viewsCollection,
      where('userId', '==', userId),
      where('tournamentId', '==', tournamentId),
      where('wasCompleted', '==', true)
    );
  }

  const snapshot = await getDocs(q);
  
  // If no views found, user can see ad
  if (snapshot.empty) {
    return false;
  }

  // Handle repeat intervals
  if (repeatInterval === 'always') {
    // Always show ad (never block)
    return false;
  }

  if (repeatInterval === 'session') {
    // Check localStorage for session-based tracking
    // This is handled in the component, so return false here
    return false;
  }

  // Get most recent view with safe date conversion
  const views = snapshot.docs.map(doc => {
    const data = doc.data();
    let viewedAt: Date | null = null;
    
    try {
      if (data.viewedAt) {
        if (data.viewedAt.toDate && typeof data.viewedAt.toDate === 'function') {
          viewedAt = data.viewedAt.toDate();
        } else if (data.viewedAt instanceof Date) {
          viewedAt = data.viewedAt;
        } else if (typeof data.viewedAt === 'string' || typeof data.viewedAt === 'number') {
          viewedAt = new Date(data.viewedAt);
        }
        
        // Validate date
        if (viewedAt && isNaN(viewedAt.getTime())) {
          viewedAt = null;
        }
      }
    } catch (error) {
      console.error('Error converting viewedAt date:', error);
      viewedAt = null;
    }
    
    return {
      id: doc.id,
      ...data,
      viewedAt,
    };
  }).filter(v => v.viewedAt && !isNaN(v.viewedAt.getTime()))
    .sort((a, b) => {
      if (!a.viewedAt || !b.viewedAt) return 0;
      return b.viewedAt.getTime() - a.viewedAt.getTime();
    });

  if (views.length === 0) {
    return false; // No valid views found
  }

  const mostRecentView = views[0];
  if (!mostRecentView.viewedAt || isNaN(mostRecentView.viewedAt.getTime())) {
    return false; // Invalid date, allow ad to show
  }
  
  const now = new Date();
  const timeSinceLastView = (now.getTime() - mostRecentView.viewedAt.getTime()) / 1000; // seconds

  // Check time-based intervals
  if (minTimeBetweenViews && timeSinceLastView >= minTimeBetweenViews) {
    // Enough time has passed
    return false;
  }

  if (repeatInterval === 'daily') {
    const hoursSinceLastView = timeSinceLastView / 3600;
    if (hoursSinceLastView >= 24) {
      return false; // Can show again (24+ hours passed)
    }
    return true; // Already viewed today
  }

  if (repeatInterval === 'weekly') {
    const daysSinceLastView = timeSinceLastView / (3600 * 24);
    if (daysSinceLastView >= 7) {
      return false; // Can show again (7+ days passed)
    }
    return true; // Already viewed this week
  }

  // Default: 'never' - block if any view exists
  return true;
}

/**
 * Checks if user has viewed an ad for a campaign (movie fantasy)
 * Returns true if user should NOT see ad (already viewed based on repeat rules)
 */
export async function hasUserViewedAdForCampaign(
  firestore: Firestore,
  userId: string,
  campaignId: string,
  advertisementId?: string,
  repeatInterval?: 'never' | 'always' | 'daily' | 'weekly' | 'session',
  minTimeBetweenViews?: number
): Promise<boolean> {
  const viewsCollection = collection(firestore, 'image-ad-views');
  let q;

  if (advertisementId) {
    q = query(
      viewsCollection,
      where('userId', '==', userId),
      where('campaignId', '==', campaignId),
      where('advertisementId', '==', advertisementId),
      where('wasCompleted', '==', true)
    );
  } else {
    q = query(
      viewsCollection,
      where('userId', '==', userId),
      where('campaignId', '==', campaignId),
      where('wasCompleted', '==', true)
    );
  }

  const snapshot = await getDocs(q);
  
  // If no views found, user can see ad
  if (snapshot.empty) {
    return false;
  }

  // Handle repeat intervals
  if (repeatInterval === 'always') {
    // Always show ad (never block)
    return false;
  }

  if (repeatInterval === 'session') {
    // Check localStorage for session-based tracking
    // This is handled in the component, so return false here
    return false;
  }

  // Get most recent view with safe date conversion
  const views = snapshot.docs.map(doc => {
    const data = doc.data();
    let viewedAt: Date | null = null;
    
    try {
      if (data.viewedAt) {
        if (data.viewedAt.toDate && typeof data.viewedAt.toDate === 'function') {
          viewedAt = data.viewedAt.toDate();
        } else if (data.viewedAt instanceof Date) {
          viewedAt = data.viewedAt;
        } else if (typeof data.viewedAt === 'string' || typeof data.viewedAt === 'number') {
          viewedAt = new Date(data.viewedAt);
        }
        
        // Validate date
        if (viewedAt && isNaN(viewedAt.getTime())) {
          viewedAt = null;
        }
      }
    } catch (error) {
      console.error('Error converting viewedAt date:', error);
      viewedAt = null;
    }
    
    return {
      id: doc.id,
      ...data,
      viewedAt,
    };
  }).filter(v => v.viewedAt && !isNaN(v.viewedAt.getTime()))
    .sort((a, b) => {
      if (!a.viewedAt || !b.viewedAt) return 0;
      return b.viewedAt.getTime() - a.viewedAt.getTime();
    });

  if (views.length === 0) {
    return false; // No valid views found
  }

  const mostRecentView = views[0];
  if (!mostRecentView.viewedAt || isNaN(mostRecentView.viewedAt.getTime())) {
    return false; // Invalid date, allow ad to show
  }
  
  const now = new Date();
  const timeSinceLastView = (now.getTime() - mostRecentView.viewedAt.getTime()) / 1000; // seconds

  // Check time-based intervals
  if (minTimeBetweenViews && timeSinceLastView >= minTimeBetweenViews) {
    // Enough time has passed
    return false;
  }

  if (repeatInterval === 'daily') {
    const hoursSinceLastView = timeSinceLastView / 3600;
    if (hoursSinceLastView >= 24) {
      return false; // Can show again (24+ hours passed)
    }
    return true; // Already viewed today
  }

  if (repeatInterval === 'weekly') {
    const daysSinceLastView = timeSinceLastView / (3600 * 24);
    if (daysSinceLastView >= 7) {
      return false; // Can show again (7+ days passed)
    }
    return true; // Already viewed this week
  }

  // Default: 'never' - block if any view exists
  return true;
}

/**
 * Gets user's ad views for an advertisement
 */
export async function getUserAdViews(
  firestore: Firestore,
  userId: string,
  advertisementId: string
): Promise<ImageAdView[]> {
  const viewsCollection = collection(firestore, 'image-ad-views');
  const q = query(
    viewsCollection,
    where('userId', '==', userId),
    where('advertisementId', '==', advertisementId)
  );

  const snapshot = await getDocs(q);
  const views: ImageAdView[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    
    // Safe date conversion for viewedAt
    let viewedAt: Date;
    try {
      if (data.viewedAt) {
        if (data.viewedAt.toDate && typeof data.viewedAt.toDate === 'function') {
          viewedAt = data.viewedAt.toDate();
        } else if (data.viewedAt instanceof Date) {
          viewedAt = data.viewedAt;
        } else {
          viewedAt = new Date(data.viewedAt);
        }
        if (isNaN(viewedAt.getTime())) {
          viewedAt = new Date();
        }
      } else {
        viewedAt = new Date();
      }
    } catch (error) {
      console.error('Error converting viewedAt date:', error);
      viewedAt = new Date();
    }
    
    // Safe date conversion for clickedAt
    let clickedAt: Date | undefined = undefined;
    try {
      if (data.clickedAt) {
        let tempClickedAt: Date | null = null;
        
        if (data.clickedAt.toDate && typeof data.clickedAt.toDate === 'function') {
          tempClickedAt = data.clickedAt.toDate();
        } else if (data.clickedAt instanceof Date) {
          tempClickedAt = data.clickedAt;
        } else {
          tempClickedAt = new Date(data.clickedAt);
        }
        
        // Validate date only if tempClickedAt was set
        if (tempClickedAt && !isNaN(tempClickedAt.getTime())) {
          clickedAt = tempClickedAt;
        }
      }
    } catch (error) {
      console.error('Error converting clickedAt date:', error);
      clickedAt = undefined;
    }
    
    views.push({
      id: docSnapshot.id,
      ...data,
      viewedAt,
      clickedAt,
    } as ImageAdView);
  });

  return views;
}

