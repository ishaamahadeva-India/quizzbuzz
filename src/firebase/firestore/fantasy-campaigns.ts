'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { 
  FantasyCampaign, 
  FantasyEvent, 
  CampaignMovie, 
  CampaignType,
  EntryFeeConfig,
  RewardConfig,
  PointsConfig
} from '@/lib/types';

// Type for a new campaign, before it's saved
type NewFantasyCampaign = {
  title: string;
  campaignType: CampaignType;
  description?: string;
  prizePool?: string;
  sponsorName?: string;
  sponsorLogo?: string;
  
  // Single movie (for backward compatibility)
  movieId?: string;
  movieTitle?: string;
  movieLanguage?: string;
  
  // Multiple movies
  movies?: CampaignMovie[];
  
  // Campaign settings
  startDate: Date;
  endDate?: Date;
  status: 'upcoming' | 'active' | 'completed';
  visibility: 'public' | 'private' | 'invite_only';
  maxParticipants?: number;
  
  // Entry and rewards
  entryFee: EntryFeeConfig;
  rewards?: RewardConfig[];
  
  createdBy?: string;
};

// Type for a new event
type NewFantasyEvent = {
  title: string;
  description: string;
  eventType: 'choice_selection' | 'numeric_prediction' | 'draft_selection' | 
             'opening_day_collection' | 'weekend_collection' | 'lifetime_gross' |
             'imdb_rating' | 'occupancy_percentage' | 'day1_talk' |
             'awards_rank' | 'ott_debut_rank';
  status: 'upcoming' | 'live' | 'completed' | 'locked';
  startDate: Date;
  endDate: Date;
  points: number;
  movieId?: string; // For multiple movie campaigns
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  options?: string[];
  rules?: string[];
  draftConfig?: {
    budget: number;
    roles: Array<{ id: string; title: string; players: string[] }>;
    playerCredits: Record<string, number>;
  };
  lockTime?: Date;
};

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
    else if (typeof value === 'string' && value.trim() === '' && 
             (key === 'sponsorLogo' || key === 'sponsorName' || key === 'description' || 
              key === 'prizePool' || key === 'movieTitle' || key === 'movieLanguage')) {
      continue; // Skip empty strings for optional fields
    }
    else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Adds a new fantasy campaign to the 'fantasy-campaigns' collection.
 */
export function addFantasyCampaign(firestore: Firestore, campaignData: NewFantasyCampaign) {
  const campaignsCollection = collection(firestore, 'fantasy-campaigns');
  
  // Build the document to save
  const docToSave: Record<string, any> = {
    title: campaignData.title,
    campaignType: campaignData.campaignType,
    startDate: campaignData.startDate,
    status: campaignData.status,
    visibility: campaignData.visibility,
    entryFee: campaignData.entryFee,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Add optional fields only if they have values
  if (campaignData.description && campaignData.description.trim() !== '') {
    docToSave.description = campaignData.description;
  }
  if (campaignData.prizePool && campaignData.prizePool.trim() !== '') {
    docToSave.prizePool = campaignData.prizePool;
  }
  if (campaignData.sponsorName && campaignData.sponsorName.trim() !== '') {
    docToSave.sponsorName = campaignData.sponsorName;
  }
  if (campaignData.sponsorLogo && campaignData.sponsorLogo.trim() !== '') {
    docToSave.sponsorLogo = campaignData.sponsorLogo;
  }
  if (campaignData.endDate) {
    docToSave.endDate = campaignData.endDate;
  }
  if (campaignData.maxParticipants !== undefined && campaignData.maxParticipants !== null) {
    docToSave.maxParticipants = campaignData.maxParticipants;
  }
  if (campaignData.rewards && campaignData.rewards.length > 0) {
    docToSave.rewards = campaignData.rewards;
  }
  if (campaignData.createdBy) {
    docToSave.createdBy = campaignData.createdBy;
  }
  
  // Handle single movie fields
  if (campaignData.campaignType === 'single_movie') {
    if (campaignData.movieId && campaignData.movieId.trim() !== '') {
      docToSave.movieId = campaignData.movieId;
    }
    if (campaignData.movieTitle && campaignData.movieTitle.trim() !== '') {
      docToSave.movieTitle = campaignData.movieTitle;
    }
    if (campaignData.movieLanguage && campaignData.movieLanguage.trim() !== '') {
      docToSave.movieLanguage = campaignData.movieLanguage;
    }
  }
  
  // Handle multiple movies
  if (campaignData.campaignType === 'multiple_movies' && campaignData.movies && campaignData.movies.length > 0) {
    docToSave.movies = campaignData.movies;
  }
  
  // Final cleanup to remove any undefined values (safety check)
  const cleanData = removeUndefinedValues(docToSave);

  return addDoc(campaignsCollection, cleanData)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: campaignsCollection.path,
        operation: 'create',
        requestResourceData: cleanData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Updates an existing fantasy campaign.
 */
export function updateFantasyCampaign(
  firestore: Firestore,
  campaignId: string,
  campaignData: Partial<NewFantasyCampaign>
) {
  const campaignDocRef = doc(firestore, 'fantasy-campaigns', campaignId);
  
  // Build update object, only including defined fields
  const docToUpdate: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  
  // Only add fields that are defined
  Object.keys(campaignData).forEach(key => {
    const value = (campaignData as any)[key];
    if (value !== undefined) {
      // For strings, skip empty strings for optional fields
      if (typeof value === 'string' && value.trim() === '' && 
          (key === 'sponsorLogo' || key === 'sponsorName' || key === 'description' || 
           key === 'prizePool' || key === 'movieTitle' || key === 'movieLanguage')) {
        return; // Skip empty strings
      }
      docToUpdate[key] = value;
    }
  });
  
  // Final cleanup to remove any undefined values
  const cleanData = removeUndefinedValues(docToUpdate);

  return updateDoc(campaignDocRef, cleanData)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: campaignDocRef.path,
        operation: 'update',
        requestResourceData: cleanData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Deletes a fantasy campaign.
 */
export function deleteFantasyCampaign(firestore: Firestore, campaignId: string) {
  const campaignDocRef = doc(firestore, 'fantasy-campaigns', campaignId);
  return deleteDoc(campaignDocRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: campaignDocRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Adds an event to a campaign.
 */
export function addCampaignEvent(
  firestore: Firestore,
  campaignId: string,
  eventData: NewFantasyEvent
) {
  const eventsCollection = collection(firestore, 'fantasy-campaigns', campaignId, 'events');
  
  // Build the document to save, explicitly including required fields
  const docToSave: Record<string, any> = {
    title: eventData.title,
    description: eventData.description,
    eventType: eventData.eventType,
    status: eventData.status,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    points: eventData.points,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Add optional fields only if they have values
  if (eventData.movieId && eventData.movieId.trim() !== '') {
    docToSave.movieId = eventData.movieId;
  }
  if (eventData.difficultyLevel) {
    docToSave.difficultyLevel = eventData.difficultyLevel;
  }
  if (eventData.options && eventData.options.length > 0) {
    docToSave.options = eventData.options;
  }
  if (eventData.rules && eventData.rules.length > 0) {
    docToSave.rules = eventData.rules;
  }
  if (eventData.draftConfig) {
    docToSave.draftConfig = eventData.draftConfig;
  }
  if (eventData.lockTime) {
    docToSave.lockTime = eventData.lockTime;
  }
  
  // Clean undefined values
  const cleanData = removeUndefinedValues(docToSave);
  
  console.log('💾 Saving event to Firestore:', {
    campaignId,
    eventTitle: eventData.title,
    eventType: eventData.eventType,
    status: eventData.status,
    points: eventData.points,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    collectionPath: eventsCollection.path,
    cleanData
  });

  return addDoc(eventsCollection, cleanData)
    .then((docRef) => {
      console.log('✅ Event saved successfully! Document ID:', docRef.id);
      console.log('✅ Full path:', `fantasy-campaigns/${campaignId}/events/${docRef.id}`);
      return docRef;
    })
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: eventsCollection.path,
        operation: 'create',
        requestResourceData: docToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Updates an event in a campaign.
 */
export function updateCampaignEvent(
  firestore: Firestore,
  campaignId: string,
  eventId: string,
  eventData: Partial<NewFantasyEvent>
) {
  const eventDocRef = doc(firestore, 'fantasy-campaigns', campaignId, 'events', eventId);
  const docToUpdate = {
    ...eventData,
    updatedAt: serverTimestamp(),
  };

  return updateDoc(eventDocRef, docToUpdate)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: eventDocRef.path,
        operation: 'update',
        requestResourceData: docToUpdate,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Deletes an event from a campaign.
 */
export function deleteCampaignEvent(
  firestore: Firestore,
  campaignId: string,
  eventId: string
) {
  const eventDocRef = doc(firestore, 'fantasy-campaigns', campaignId, 'events', eventId);
  return deleteDoc(eventDocRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: eventDocRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Predefined event templates for movie fantasy campaigns
 * Events are organized by categories for better selection
 */
export type EventCategory = 
  | 'Pre-Release' 
  | 'Release Day' 
  | 'First Weekend' 
  | 'First Week' 
  | 'Ratings & Reviews' 
  | 'Social Media & Buzz' 
  | 'Music & Soundtrack' 
  | 'OTT & Streaming' 
  | 'Lifetime & Legacy'
  | 'Regional & Overseas';

export const EVENT_TEMPLATES: Array<{
  title: string;
  description: string;
  eventType: FantasyEvent['eventType'];
  defaultPoints: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  defaultOptions?: string[];
  defaultRules?: string[];
  category?: EventCategory; // Category for grouping
}> = [
  // ========== PRE-RELEASE EVENTS ==========
  {
    title: 'Pre-Release Event Location',
    description: 'Predict the primary location of the main pre-release event.',
    eventType: 'choice_selection',
    defaultPoints: 25,
    category: 'Pre-Release',
    defaultOptions: ['Hyderabad', 'Vizag', 'Dubai', 'Mumbai', 'Chennai', 'Bangalore'],
    defaultRules: ['The location of the main stage event will be considered final.'],
  },
  {
    title: 'First Teaser Views (24h)',
    description: 'Predict the range of total views for the first teaser across all official channels in its first 24 hours.',
    eventType: 'choice_selection',
    defaultPoints: 50,
    category: 'Pre-Release',
    defaultOptions: ['0 - 10 Million', '10 - 20 Million', '20 - 30 Million', '30 Million+'],
    defaultRules: ['Views from official YouTube, X, and Instagram channels only.'],
  },
  {
    title: 'First Look Views (24h)',
    description: 'Predict the range of total views for the first look across all official channels in its first 24 hours.',
    eventType: 'choice_selection',
    defaultPoints: 50,
    category: 'Pre-Release',
    defaultOptions: ['0 - 10 Million', '10 - 20 Million', '20 - 30 Million', '30 Million+'],
    defaultRules: ['Views from official YouTube, X, and Instagram channels only.'],
  },
  {
    title: 'First Look Views (1hr)',
    description: 'Predict the range of total views for the first look in its first hour.',
    eventType: 'choice_selection',
    defaultPoints: 20,
    category: 'Pre-Release',
    defaultOptions: ['0 - 1 Million', '1 - 2 Million', '2 Million+'],
    defaultRules: ['Views from official YouTube, X, and Instagram channels only.'],
  },
  {
    title: 'First Look Views (7 Days)',
    description: 'Predict the range of total views for the first look after 7 days.',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Pre-Release',
    defaultOptions: ['0 - 50 Million', '50 - 100 Million', '100 Million+'],
    defaultRules: ['Views from official YouTube, X, and Instagram channels only.'],
  },
  {
    title: 'Trailer Views (24h)',
    description: 'Predict the range of total views for the official trailer across all official channels within the first 24 hours.',
    eventType: 'choice_selection',
    defaultPoints: 75,
    category: 'Pre-Release',
    defaultOptions: ['0 - 25 Million', '25 - 50 Million', '50 - 75 Million', '75 Million+'],
    defaultRules: [
      'Views from official YouTube channels only.',
      'The 24-hour window starts from the exact time of the trailer release.',
    ],
  },
  {
    title: 'First Song Streaming Milestone',
    description: 'Which streaming platform will be the first to report 10 million streams for the first single?',
    eventType: 'choice_selection',
    defaultPoints: 40,
    category: 'Music & Soundtrack',
    defaultOptions: ['Spotify', 'Gaana', 'JioSaavn', 'Apple Music', 'YouTube Music'],
    defaultRules: ['Official reports from platform holders or the production house will be considered final.'],
  },
  // ========== RELEASE DAY EVENTS ==========
  {
    title: 'Opening Day Box Office Collection',
    description: 'Predict the range of opening day box office collections (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 150,
    category: 'Release Day',
    defaultOptions: ['0 - 10 Cr', '10 - 20 Cr', '20 - 30 Cr', '30 - 50 Cr', '50 Cr+'],
    defaultRules: ['Official box office reports will be considered final.'],
  },
  {
    title: 'First Weekend Box Office Collection',
    description: 'Predict the range of first weekend (3 days) box office collections (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 200,
    category: 'First Weekend',
    defaultOptions: ['0 - 30 Cr', '30 - 50 Cr', '50 - 75 Cr', '75 - 100 Cr', '100 Cr+'],
    defaultRules: ['Official box office reports will be considered final.'],
  },
  {
    title: 'First Week Box Office Collection',
    description: 'Predict the range of first week box office collections (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 250,
    category: 'First Week',
    defaultOptions: ['0 - 50 Cr', '50 - 100 Cr', '100 - 150 Cr', '150 - 200 Cr', '200 Cr+'],
    defaultRules: ['Official box office reports will be considered final.'],
  },
  {
    title: 'IMDb Rating Prediction',
    description: 'Predict the IMDb rating range the movie will achieve after 1000+ reviews.',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Ratings & Reviews',
    defaultOptions: ['Below 6.0', '6.0 - 7.0', '7.0 - 8.0', '8.0 - 9.0', '9.0+'],
    defaultRules: ['IMDb rating after 1000+ verified reviews will be considered final.'],
  },
  {
    title: 'Full Team Draft (Release Week)',
    description: 'Draft your fantasy team for the opening weekend. Your team will score points based on performance mentions, social media buzz, and critics\' ratings.',
    eventType: 'draft_selection',
    defaultPoints: 200,
    category: 'Release Day',
    difficultyLevel: 'hard',
    defaultRules: [
      'You have a budget of 100 credits.',
      'You must select one player for each role.',
      'Select one player as your Captain to earn 1.5x points.',
    ],
  },
  {
    title: 'Opening Day Collection Range',
    description: 'Predict the opening day box office collection range (in crores).',
    eventType: 'opening_day_collection',
    defaultPoints: 150,
    category: 'Release Day',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 10 Cr', '10 - 20 Cr', '20 - 30 Cr', '30 - 50 Cr', '50 Cr+'],
    defaultRules: ['Official box office reports will be considered final.'],
  },
  {
    title: 'First Weekend Collection',
    description: 'Predict the first weekend (3 days) box office collection range (in crores).',
    eventType: 'weekend_collection',
    defaultPoints: 200,
    category: 'First Weekend',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 30 Cr', '30 - 50 Cr', '50 - 75 Cr', '75 - 100 Cr', '100 Cr+'],
    defaultRules: ['Official box office reports will be considered final.'],
  },
  {
    title: 'Lifetime Gross Collection',
    description: 'Predict the lifetime gross box office collection range (in crores).',
    eventType: 'lifetime_gross',
    defaultPoints: 300,
    category: 'Lifetime & Legacy',
    difficultyLevel: 'hard',
    defaultOptions: ['0 - 50 Cr', '50 - 100 Cr', '100 - 200 Cr', '200 - 300 Cr', '300 Cr+'],
    defaultRules: ['Official box office reports will be considered final.'],
  },
  {
    title: 'IMDb Rating Range',
    description: 'Predict the IMDb rating range the movie will achieve after 1000+ reviews.',
    eventType: 'imdb_rating',
    defaultPoints: 100,
    category: 'Ratings & Reviews',
    difficultyLevel: 'medium',
    defaultOptions: ['Below 6.0', '6.0 - 7.0', '7.0 - 8.0', '8.0 - 9.0', '9.0+'],
    defaultRules: ['IMDb rating after 1000+ verified reviews will be considered final.'],
  },
  {
    title: 'Opening Day Occupancy Percentage',
    description: 'Predict the opening day theater occupancy percentage range.',
    eventType: 'occupancy_percentage',
    defaultPoints: 75,
    category: 'Release Day',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 30%', '30 - 50%', '50 - 70%', '70 - 85%', '85%+'],
    defaultRules: ['Average occupancy across all theaters will be considered.'],
  },
  {
    title: 'Day-1 Talk (Hit/Average/Flop)',
    description: 'Predict the Day-1 audience talk and word-of-mouth verdict.',
    eventType: 'day1_talk',
    defaultPoints: 50,
    category: 'Social Media & Buzz',
    difficultyLevel: 'easy',
    defaultOptions: ['Hit', 'Average', 'Flop'],
    defaultRules: ['Based on social media sentiment and audience reviews on Day 1.'],
  },
  {
    title: 'Awards / Trending Rank',
    description: 'Predict the movie\'s ranking in awards season or trending charts.',
    eventType: 'awards_rank',
    defaultPoints: 80,
    category: 'Ratings & Reviews',
    difficultyLevel: 'medium',
    defaultOptions: ['Top 3', 'Top 5', 'Top 10', 'Top 20', 'Below Top 20'],
    defaultRules: ['Based on official awards nominations or trending charts.'],
  },
  {
    title: 'OTT Platform Debut Week Rank',
    description: 'Predict the movie\'s ranking on OTT platform in its debut week.',
    eventType: 'ott_debut_rank',
    defaultPoints: 60,
    category: 'OTT & Streaming',
    difficultyLevel: 'easy',
    defaultOptions: ['#1', '#2-3', '#4-5', '#6-10', 'Below Top 10'],
    defaultRules: ['Based on official OTT platform rankings.'],
  },
  // ========== NEW ADDITIONS - PRE-RELEASE EVENTS ==========
  {
    title: 'Poster Launch Views (24h)',
    description: 'Predict the range of views for the first poster launch across all platforms in 24 hours.',
    eventType: 'choice_selection',
    defaultPoints: 30,
    category: 'Pre-Release',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 5 Million', '5 - 10 Million', '10 - 20 Million', '20 Million+'],
    defaultRules: ['Views from official social media accounts only.'],
  },
  {
    title: 'Title Announcement Engagement',
    description: 'Predict the range of total engagement (likes + comments + shares) for title announcement.',
    eventType: 'choice_selection',
    defaultPoints: 25,
    category: 'Pre-Release',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 1 Million', '1 - 3 Million', '3 - 5 Million', '5 Million+'],
    defaultRules: ['Total engagement across all official platforms.'],
  },
  {
    title: 'First Song Release Platform',
    description: 'Which platform will the first song be released on?',
    eventType: 'choice_selection',
    defaultPoints: 35,
    category: 'Music & Soundtrack',
    difficultyLevel: 'easy',
    defaultOptions: ['YouTube', 'Spotify', 'JioSaavn', 'Gaana', 'Apple Music', 'Simultaneous'],
    defaultRules: ['The first official song release will be considered.'],
  },
  {
    title: 'First Song Views (1hr)',
    description: 'Predict the first song views in the first hour after release.',
    eventType: 'choice_selection',
    defaultPoints: 40,
    category: 'Music & Soundtrack',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 500K', '500K - 1M', '1M - 2M', '2M+'],
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'First Song Views (24h)',
    description: 'Predict the first song views in the first 24 hours after release.',
    eventType: 'choice_selection',
    defaultPoints: 60,
    category: 'Music & Soundtrack',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 5 Million', '5 - 10 Million', '10 - 20 Million', '20 Million+'],
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'Teaser Views (1hr)',
    description: 'Predict the teaser views in the first hour after release.',
    eventType: 'choice_selection',
    defaultPoints: 35,
    category: 'Pre-Release',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 1 Million', '1 - 2 Million', '2 - 5 Million', '5 Million+'],
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'Teaser Views (7 Days)',
    description: 'Predict the teaser views after 7 days of release.',
    eventType: 'choice_selection',
    defaultPoints: 80,
    category: 'Pre-Release',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 20 Million', '20 - 50 Million', '50 - 100 Million', '100 Million+'],
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'Trailer Views (1hr)',
    description: 'Predict the trailer views in the first hour after release.',
    eventType: 'choice_selection',
    defaultPoints: 50,
    category: 'Pre-Release',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 2 Million', '2 - 5 Million', '5 - 10 Million', '10 Million+'],
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'Trailer Views (7 Days)',
    description: 'Predict the trailer views after 7 days of release.',
    eventType: 'choice_selection',
    defaultPoints: 120,
    category: 'Pre-Release',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 50 Million', '50 - 100 Million', '100 - 200 Million', '200 Million+'],
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'Trailer Likes Count (24h)',
    description: 'Predict the range of likes the trailer will receive in 24 hours.',
    eventType: 'choice_selection',
    defaultPoints: 45,
    category: 'Pre-Release',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 500K', '500K - 1M', '1M - 2M', '2M+'],
    defaultRules: ['Likes from official YouTube channel only.'],
  },
  {
    title: 'Social Media Hashtag Trend',
    description: 'Will the movie hashtag trend on Twitter/X within 24 hours of trailer release?',
    eventType: 'choice_selection',
    defaultPoints: 30,
    category: 'Social Media & Buzz',
    difficultyLevel: 'easy',
    defaultOptions: ['Yes - Top 10', 'Yes - Top 20', 'Yes - Below Top 20', 'No'],
    defaultRules: ['Based on official Twitter/X trending data.'],
  },
  {
    title: 'Instagram Reels Count (Release Week)',
    description: 'Predict the range of Instagram reels created using movie content in release week.',
    eventType: 'choice_selection',
    defaultPoints: 40,
    category: 'Social Media & Buzz',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 10K', '10K - 50K', '50K - 100K', '100K+'],
    defaultRules: ['Reels using official movie content or hashtags.'],
  },
  // ========== RELEASE DAY EVENTS ==========
  {
    title: 'Opening Day Shows Count',
    description: 'Predict the range of total shows screened on opening day.',
    eventType: 'choice_selection',
    defaultPoints: 70,
    category: 'Release Day',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 5K', '5K - 10K', '10K - 15K', '15K - 20K', '20K+'],
    defaultRules: ['Total shows across all theaters nationwide.'],
  },
  {
    title: 'Opening Day Morning Shows Occupancy',
    description: 'Predict the opening day morning shows occupancy percentage.',
    eventType: 'choice_selection',
    defaultPoints: 60,
    category: 'Release Day',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 40%', '40 - 60%', '60 - 80%', '80%+'],
    defaultRules: ['Average occupancy for morning shows (before 12 PM).'],
  },
  {
    title: 'Opening Day Evening Shows Occupancy',
    description: 'Predict the opening day evening shows occupancy percentage.',
    eventType: 'choice_selection',
    defaultPoints: 70,
    category: 'Release Day',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 50%', '50 - 70%', '70 - 85%', '85%+'],
    defaultRules: ['Average occupancy for evening shows (after 6 PM).'],
  },
  {
    title: 'Opening Day Night Shows Occupancy',
    description: 'Predict the opening day night shows occupancy percentage.',
    eventType: 'choice_selection',
    defaultPoints: 65,
    category: 'Release Day',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 45%', '45 - 65%', '65 - 80%', '80%+'],
    defaultRules: ['Average occupancy for night shows (after 9 PM).'],
  },
  {
    title: 'Opening Day Single Screen Collection',
    description: 'Predict the opening day collection from single screen theaters (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 80,
    category: 'Release Day',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 2 Cr', '2 - 5 Cr', '5 - 10 Cr', '10 Cr+'],
    defaultRules: ['Collection from single screen theaters only.'],
  },
  {
    title: 'Opening Day Multiplex Collection',
    description: 'Predict the opening day collection from multiplex theaters (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 90,
    category: 'Release Day',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 5 Cr', '5 - 10 Cr', '10 - 20 Cr', '20 Cr+'],
    defaultRules: ['Collection from multiplex theaters only.'],
  },
  {
    title: 'Opening Day Regional Leader',
    description: 'Which region will contribute the highest opening day collection?',
    eventType: 'choice_selection',
    defaultPoints: 75,
    category: 'Regional & Overseas',
    difficultyLevel: 'medium',
    defaultOptions: ['Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Bangalore', 'Kolkata', 'Other'],
    defaultRules: ['Based on regional box office collections.'],
  },
  {
    title: 'Opening Day Overseas Collection',
    description: 'Predict the opening day overseas collection (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Regional & Overseas',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 5 Cr', '5 - 10 Cr', '10 - 20 Cr', '20 Cr+'],
    defaultRules: ['Overseas collections from all international markets.'],
  },
  {
    title: 'Opening Day USA Collection',
    description: 'Predict the opening day USA box office collection (in USD).',
    eventType: 'choice_selection',
    defaultPoints: 85,
    category: 'Regional & Overseas',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 100K', '100K - 500K', '500K - 1M', '1M+'],
    defaultRules: ['USA box office collection in USD.'],
  },
  {
    title: 'Opening Day UAE Collection',
    description: 'Predict the opening day UAE box office collection (in crores).',
    eventType: 'choice_selection',
    defaultPoints: 70,
    category: 'Regional & Overseas',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 1 Cr', '1 - 2 Cr', '2 - 5 Cr', '5 Cr+'],
    defaultRules: ['UAE box office collection.'],
  },
  // ========== FIRST WEEKEND EVENTS ==========
  {
    title: 'Saturday Collection Growth',
    description: 'Predict the percentage growth in collection from Friday to Saturday.',
    eventType: 'choice_selection',
    defaultPoints: 90,
    category: 'First Weekend',
    difficultyLevel: 'medium',
    defaultOptions: ['Negative Growth', '0 - 20%', '20 - 50%', '50 - 100%', '100%+'],
    defaultRules: ['Growth percentage = ((Saturday - Friday) / Friday) × 100.'],
  },
  {
    title: 'Sunday Collection vs Saturday',
    description: 'Predict if Sunday collection will be higher or lower than Saturday.',
    eventType: 'choice_selection',
    defaultPoints: 60,
    category: 'First Weekend',
    difficultyLevel: 'easy',
    defaultOptions: ['Higher', 'Lower', 'Same'],
    defaultRules: ['Compare Sunday collection with Saturday collection.'],
  },
  {
    title: 'First Weekend Average Ticket Price',
    description: 'Predict the average ticket price range for first weekend (in ₹).',
    eventType: 'choice_selection',
    defaultPoints: 55,
    category: 'First Weekend',
    difficultyLevel: 'easy',
    defaultOptions: ['₹100 - ₹200', '₹200 - ₹300', '₹300 - ₹400', '₹400+'],
    defaultRules: ['Average ticket price across all theaters.'],
  },
  {
    title: 'First Weekend Footfalls',
    description: 'Predict the range of total footfalls (ticket sales) in first weekend.',
    eventType: 'choice_selection',
    defaultPoints: 110,
    category: 'First Weekend',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 5 Lakh', '5 - 10 Lakh', '10 - 20 Lakh', '20 Lakh+'],
    defaultRules: ['Total number of tickets sold in first weekend.'],
  },
  // ========== FIRST WEEK EVENTS ==========
  {
    title: 'First Week Average Occupancy',
    description: 'Predict the average theater occupancy percentage for first week.',
    eventType: 'choice_selection',
    defaultPoints: 95,
    category: 'First Week',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 40%', '40 - 60%', '60 - 75%', '75%+'],
    defaultRules: ['Average occupancy across all days of first week.'],
  },
  {
    title: 'First Week Weekday vs Weekend Ratio',
    description: 'Predict the ratio of weekday collection to weekend collection.',
    eventType: 'choice_selection',
    defaultPoints: 85,
    category: 'First Week',
    difficultyLevel: 'medium',
    defaultOptions: ['Weekend 2x+ Weekday', 'Weekend 1.5-2x Weekday', 'Weekend 1-1.5x Weekday', 'Weekend < Weekday'],
    defaultRules: ['Ratio = Weekend Collection / Weekday Collection.'],
  },
  {
    title: 'First Week Overseas vs Domestic',
    description: 'Predict if overseas collection will be higher or lower than domestic in first week.',
    eventType: 'choice_selection',
    defaultPoints: 75,
    category: 'Regional & Overseas',
    difficultyLevel: 'medium',
    defaultOptions: ['Overseas Higher', 'Domestic Higher', 'Almost Equal'],
    defaultRules: ['Compare overseas and domestic first week collections.'],
  },
  // ========== RATINGS & REVIEWS EVENTS ==========
  {
    title: 'Rotten Tomatoes Score',
    description: 'Predict the Rotten Tomatoes score range the movie will achieve.',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Ratings & Reviews',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 40%', '40 - 60%', '60 - 80%', '80%+'],
    defaultRules: ['Rotten Tomatoes score after 50+ critic reviews.'],
  },
  {
    title: 'Google Rating (1 Week)',
    description: 'Predict the Google rating range after 1 week of release.',
    eventType: 'choice_selection',
    defaultPoints: 70,
    category: 'Ratings & Reviews',
    difficultyLevel: 'easy',
    defaultOptions: ['Below 3.5', '3.5 - 4.0', '4.0 - 4.5', '4.5+'],
    defaultRules: ['Google user rating after 1 week.'],
  },
  {
    title: 'BookMyShow Rating (Opening Day)',
    description: 'Predict the BookMyShow rating range on opening day.',
    eventType: 'choice_selection',
    defaultPoints: 65,
    category: 'Ratings & Reviews',
    difficultyLevel: 'easy',
    defaultOptions: ['Below 3.5', '3.5 - 4.0', '4.0 - 4.5', '4.5+'],
    defaultRules: ['BookMyShow user rating on opening day.'],
  },
  {
    title: 'BookMyShow Rating (1 Week)',
    description: 'Predict the BookMyShow rating range after 1 week.',
    eventType: 'choice_selection',
    defaultPoints: 80,
    category: 'Ratings & Reviews',
    difficultyLevel: 'medium',
    defaultOptions: ['Below 3.5', '3.5 - 4.0', '4.0 - 4.5', '4.5+'],
    defaultRules: ['BookMyShow user rating after 1 week.'],
  },
  {
    title: 'Critics Rating Average',
    description: 'Predict the average critics rating range (out of 5).',
    eventType: 'choice_selection',
    defaultPoints: 90,
    category: 'Ratings & Reviews',
    difficultyLevel: 'medium',
    defaultOptions: ['Below 2.5', '2.5 - 3.0', '3.0 - 3.5', '3.5 - 4.0', '4.0+'],
    defaultRules: ['Average rating from at least 10 major critics.'],
  },
  {
    title: 'Audience vs Critics Rating Gap',
    description: 'Predict the gap between audience and critics ratings.',
    eventType: 'choice_selection',
    defaultPoints: 75,
    category: 'Ratings & Reviews',
    difficultyLevel: 'medium',
    defaultOptions: ['Critics Higher by 0.5+', 'Critics Higher by 0-0.5', 'Almost Equal', 'Audience Higher by 0.5+'],
    defaultRules: ['Gap = Audience Rating - Critics Rating.'],
  },
  // ========== SOCIAL MEDIA & BUZZ EVENTS ==========
  {
    title: 'Twitter/X Mentions (Opening Day)',
    description: 'Predict the range of Twitter/X mentions on opening day.',
    eventType: 'choice_selection',
    defaultPoints: 50,
    category: 'Social Media & Buzz',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 50K', '50K - 100K', '100K - 500K', '500K+'],
    defaultRules: ['Total mentions including hashtags and movie name.'],
  },
  {
    title: 'Instagram Posts Count (Release Week)',
    description: 'Predict the range of Instagram posts using movie hashtags in release week.',
    eventType: 'choice_selection',
    defaultPoints: 45,
    category: 'Social Media & Buzz',
    difficultyLevel: 'easy',
    defaultOptions: ['0 - 20K', '20K - 50K', '50K - 100K', '100K+'],
    defaultRules: ['Posts using official movie hashtags.'],
  },
  {
    title: 'YouTube Search Trend (Release Week)',
    description: 'Will the movie be in top 10 YouTube search trends during release week?',
    eventType: 'choice_selection',
    defaultPoints: 40,
    category: 'Social Media & Buzz',
    difficultyLevel: 'easy',
    defaultOptions: ['Yes - Top 3', 'Yes - Top 10', 'Yes - Top 20', 'No'],
    defaultRules: ['Based on YouTube search trends data.'],
  },
  // ========== OTT & STREAMING EVENTS ==========
  {
    title: 'OTT Release Platform',
    description: 'Which OTT platform will the movie release on?',
    eventType: 'choice_selection',
    defaultPoints: 50,
    category: 'OTT & Streaming',
    difficultyLevel: 'easy',
    defaultOptions: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'ZEE5', 'SonyLIV', 'Other'],
    defaultRules: ['The first OTT platform to release the movie.'],
  },
  {
    title: 'OTT Release Date Gap',
    description: 'Predict the gap between theatrical and OTT release (in days).',
    eventType: 'choice_selection',
    defaultPoints: 60,
    category: 'OTT & Streaming',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 30 days', '30 - 45 days', '45 - 60 days', '60+ days'],
    defaultRules: ['Gap = OTT Release Date - Theatrical Release Date.'],
  },
  {
    title: 'OTT Viewing Hours (First Week)',
    description: 'Predict the range of total viewing hours on OTT platform in first week.',
    eventType: 'choice_selection',
    defaultPoints: 85,
    category: 'OTT & Streaming',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 10M hours', '10M - 50M hours', '50M - 100M hours', '100M+ hours'],
    defaultRules: ['Total viewing hours from OTT platform data.'],
  },
  // ========== MUSIC & SOUNDTRACK EVENTS ==========
  {
    title: 'Total Songs Count',
    description: 'Predict the total number of songs in the movie soundtrack.',
    eventType: 'choice_selection',
    defaultPoints: 30,
    category: 'Music & Soundtrack',
    difficultyLevel: 'easy',
    defaultOptions: ['1 - 3 songs', '4 - 5 songs', '6 - 8 songs', '9+ songs'],
    defaultRules: ['Total songs in official soundtrack.'],
  },
  {
    title: 'Most Popular Song Views (1 Month)',
    description: 'Predict the views of the most popular song after 1 month (in millions).',
    eventType: 'choice_selection',
    defaultPoints: 95,
    category: 'Music & Soundtrack',
    difficultyLevel: 'medium',
    defaultOptions: ['0 - 10M', '10M - 50M', '50M - 100M', '100M+'],
    defaultRules: ['Views of the highest-viewed song after 1 month.'],
  },
  {
    title: 'Soundtrack Album Streaming (1 Month)',
    description: 'Predict the total soundtrack streams across all platforms after 1 month (in millions).',
    eventType: 'choice_selection',
    defaultPoints: 110,
    category: 'Music & Soundtrack',
    difficultyLevel: 'hard',
    defaultOptions: ['0 - 50M', '50M - 100M', '100M - 200M', '200M+'],
    defaultRules: ['Total streams from Spotify, Gaana, JioSaavn, Apple Music combined.'],
  },
  // ========== LIFETIME & LEGACY EVENTS ==========
  {
    title: 'Lifetime Gross Collection Range',
    description: 'Predict the lifetime gross collection range (in crores).',
    eventType: 'lifetime_gross',
    defaultPoints: 350,
    category: 'Lifetime & Legacy',
    difficultyLevel: 'hard',
    defaultOptions: ['0 - 100 Cr', '100 - 200 Cr', '200 - 300 Cr', '300 - 500 Cr', '500 Cr+'],
    defaultRules: ['Lifetime gross from all markets including re-releases.'],
  },
  {
    title: '100 Crore Club Entry',
    description: 'Will the movie enter the 100 crore club?',
    eventType: 'choice_selection',
    defaultPoints: 120,
    category: 'Lifetime & Legacy',
    difficultyLevel: 'medium',
    defaultOptions: ['Yes - Within 1 Week', 'Yes - Within 2 Weeks', 'Yes - Within 1 Month', 'No'],
    defaultRules: ['100 crore club = 100 Cr+ lifetime gross collection.'],
  },
  {
    title: '200 Crore Club Entry',
    description: 'Will the movie enter the 200 crore club?',
    eventType: 'choice_selection',
    defaultPoints: 200,
    category: 'Lifetime & Legacy',
    difficultyLevel: 'hard',
    defaultOptions: ['Yes - Within 2 Weeks', 'Yes - Within 1 Month', 'Yes - Within 2 Months', 'No'],
    defaultRules: ['200 crore club = 200 Cr+ lifetime gross collection.'],
  },
  {
    title: 'Theatrical Run Duration',
    description: 'Predict how long the movie will run in theaters (in weeks).',
    eventType: 'choice_selection',
    defaultPoints: 130,
    category: 'Lifetime & Legacy',
    difficultyLevel: 'hard',
    defaultOptions: ['1 - 2 weeks', '2 - 4 weeks', '4 - 8 weeks', '8+ weeks'],
    defaultRules: ['Duration until movie stops regular theatrical screening.'],
  },
];

/**
 * Comparison event templates for multiple movie campaigns
 * These events compare movies head-to-head and create competitive scenarios
 */
export type ComparisonEventCategory = 
  | 'Pre-Release Comparison'
  | 'Opening Day Comparison'
  | 'First Weekend Comparison'
  | 'First Week Comparison'
  | 'Post-Release Comparison'
  | 'Lifetime Comparison'
  | 'Social Media Comparison'
  | 'Ratings Comparison';

export const COMPARISON_EVENT_TEMPLATES: Array<{
  title: string;
  description: string;
  eventType: 'choice_selection' | 'ranking_selection';
  defaultPoints: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  defaultOptions?: string[]; // Predefined options (for events like Collection Gap Prediction)
  defaultRules?: string[];
  isIndustryBattle?: boolean; // If true, compares industries instead of individual movies
  category?: ComparisonEventCategory; // Category for grouping
}> = [
  // ========== PRE-RELEASE COMPARISON EVENTS ==========
  {
    title: 'Trailer Views Winner (24h)',
    description: 'Which movie\'s trailer will get the most views in the first 24 hours?',
    eventType: 'choice_selection',
    defaultPoints: 150,
    category: 'Pre-Release Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Views from official YouTube channels only.', 'Comparison across all movies in campaign.'],
  },
  {
    title: 'First Look Views Winner (24h)',
    description: 'Which movie\'s first look will get the most views in the first 24 hours?',
    eventType: 'choice_selection',
    defaultPoints: 150,
    category: 'Pre-Release Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Views from official YouTube, X, and Instagram channels only.'],
  },
  {
    title: 'Social Media Buzz Leader',
    description: 'Which movie will generate the most social media buzz before release?',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Social Media Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Based on trending topics, hashtags, and engagement across platforms.'],
  },
  
  // ========== OPENING DAY COMPARISON EVENTS ==========
  {
    title: 'Opening Day Collection Winner',
    description: 'Which movie will collect the highest opening day box office?',
    eventType: 'choice_selection',
    defaultPoints: 200,
    category: 'Opening Day Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Official box office reports will be considered final.', 'Comparison across all movies in campaign.'],
  },
  {
    title: 'Opening Day Collection Ranking',
    description: 'Rank all movies by opening day collection (1st, 2nd, 3rd, 4th, etc.)',
    eventType: 'ranking_selection',
    defaultPoints: 350,
    category: 'Opening Day Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Predict the complete ranking order of all movies.', 'Higher points for full ranking accuracy.'],
  },
  {
    title: 'Opening Day Occupancy Leader',
    description: 'Which movie will have the highest theater occupancy on opening day?',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Opening Day Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Average occupancy across all theaters will be considered.'],
  },
  {
    title: 'Industry Winner - Opening Day',
    description: 'Which industry will have the highest opening day collection?',
    eventType: 'choice_selection',
    defaultPoints: 180,
    category: 'Opening Day Comparison',
    difficultyLevel: 'medium',
    isIndustryBattle: true,
    defaultRules: ['Compares industries (Bollywood, Hollywood, Tollywood, etc.) based on their movie\'s performance.'],
  },
  
  // ========== FIRST WEEKEND COMPARISON EVENTS ==========
  {
    title: 'First Weekend Collection Winner',
    description: 'Which movie will have the highest first weekend (3 days) collection?',
    eventType: 'choice_selection',
    defaultPoints: 250,
    category: 'First Weekend Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Official box office reports will be considered final.', '3-day weekend collection comparison.'],
  },
  {
    title: 'First Weekend Collection Ranking',
    description: 'Rank all movies by first weekend collection (complete ranking order)',
    eventType: 'ranking_selection',
    defaultPoints: 400,
    category: 'First Weekend Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Predict the complete ranking order of all movies for first weekend.', 'Higher points for full ranking accuracy.'],
  },
  {
    title: 'Overseas Collection Leader',
    description: 'Which movie will lead in overseas (international) box office collections?',
    eventType: 'choice_selection',
    defaultPoints: 200,
    category: 'First Weekend Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Overseas collections from all international markets.', 'Official reports will be considered final.'],
  },
  {
    title: 'Domestic Collection Leader',
    description: 'Which movie will lead in domestic (India) box office collections?',
    eventType: 'choice_selection',
    defaultPoints: 200,
    category: 'First Weekend Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Domestic collections from Indian markets only.', 'Official reports will be considered final.'],
  },
  {
    title: 'Industry Winner - First Weekend',
    description: 'Which industry will dominate the first weekend box office?',
    eventType: 'choice_selection',
    defaultPoints: 220,
    category: 'First Weekend Comparison',
    difficultyLevel: 'medium',
    isIndustryBattle: true,
    defaultRules: ['Compares industries based on their movie\'s weekend performance.'],
  },
  
  // ========== FIRST WEEK COMPARISON EVENTS ==========
  {
    title: 'First Week Collection Winner',
    description: 'Which movie will have the highest first week box office collection?',
    eventType: 'choice_selection',
    defaultPoints: 300,
    category: 'First Week Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Official box office reports will be considered final.', '7-day collection comparison.'],
  },
  {
    title: 'IMDb Rating Leader',
    description: 'Which movie will achieve the highest IMDb rating after 1000+ reviews?',
    eventType: 'choice_selection',
    defaultPoints: 180,
    category: 'Ratings Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['IMDb rating after 1000+ verified reviews will be considered final.'],
  },
  {
    title: 'Critics\' Choice Leader',
    description: 'Which movie will get the best critics\' ratings across review platforms?',
    eventType: 'choice_selection',
    defaultPoints: 150,
    category: 'Ratings Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Average critics\' ratings across major review platforms.', 'At least 10 critic reviews required.'],
  },
  {
    title: 'Day-1 Talk Winner',
    description: 'Which movie will get the best Day-1 word-of-mouth and audience talk?',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Social Media Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Based on social media sentiment and audience reviews on Day 1.'],
  },
  {
    title: 'Collection Gap Prediction',
    description: 'What will be the gap between highest and second-highest opening day collection?',
    eventType: 'choice_selection',
    defaultPoints: 100,
    category: 'Opening Day Comparison',
    difficultyLevel: 'medium',
    defaultOptions: ['Less than 5 Cr', '5-10 Cr', '10-20 Cr', '20-30 Cr', 'More than 30 Cr'],
    defaultRules: ['Predict how close the competition will be.', 'Gap = Highest - Second Highest'],
  },
  
  // ========== POST-RELEASE COMPARISON EVENTS ==========
  {
    title: 'Lifetime Gross Collection Leader',
    description: 'Which movie will collect the highest lifetime gross box office?',
    eventType: 'choice_selection',
    defaultPoints: 400,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Official box office reports will be considered final.', 'Lifetime gross from all markets.'],
  },
  {
    title: 'OTT Debut Rank Winner',
    description: 'Which movie will rank highest on OTT platforms in its debut week?',
    eventType: 'choice_selection',
    defaultPoints: 150,
    category: 'Post-Release Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Based on official OTT platform rankings.', 'Highest rank among all movies.'],
  },
  {
    title: 'Awards/Trending Rank Winner',
    description: 'Which movie will rank highest in awards season or trending charts?',
    eventType: 'choice_selection',
    defaultPoints: 200,
    category: 'Post-Release Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Based on official awards nominations or trending charts.', 'Highest rank wins.'],
  },
  {
    title: 'Overall Performance Champion',
    description: 'Which movie will be the overall champion considering collections, ratings, and buzz?',
    eventType: 'choice_selection',
    defaultPoints: 500,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultRules: [
      'Considers multiple factors: box office collections, IMDb ratings, social media buzz, and critics\' reviews.',
      'Weighted scoring: Collections (40%), Ratings (30%), Buzz (20%), Critics (10%)',
    ],
  },
  {
    title: 'Fan War Winner',
    description: 'Which movie\'s fans will be most satisfied based on overall performance?',
    eventType: 'choice_selection',
    defaultPoints: 400,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultRules: [
      'Based on collections + ratings + social buzz + fan satisfaction.',
      'The movie that exceeds expectations the most wins.',
    ],
  },
  // ========== NEW ADDITIONS - MORE COMPARISON EVENTS ==========
  // Pre-Release Comparisons
  {
    title: 'Poster Launch Views Winner (24h)',
    description: 'Which movie\'s poster launch will get the most views in 24 hours?',
    eventType: 'choice_selection',
    defaultPoints: 120,
    category: 'Pre-Release Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Views from official social media accounts only.'],
  },
  {
    title: 'First Song Views Winner (24h)',
    description: 'Which movie\'s first song will get the most views in 24 hours?',
    eventType: 'choice_selection',
    defaultPoints: 130,
    category: 'Pre-Release Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Views from official YouTube channel only.'],
  },
  {
    title: 'Trailer Likes Winner (24h)',
    description: 'Which movie\'s trailer will get the most likes in 24 hours?',
    eventType: 'choice_selection',
    defaultPoints: 125,
    category: 'Pre-Release Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Likes from official YouTube channel only.'],
  },
  {
    title: 'Hashtag Trend Winner',
    description: 'Which movie\'s hashtag will trend highest on Twitter/X?',
    eventType: 'choice_selection',
    defaultPoints: 110,
    category: 'Social Media Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Based on Twitter/X trending rankings.'],
  },
  // Opening Day Comparisons
  {
    title: 'Opening Day Shows Count Winner',
    description: 'Which movie will have the most shows on opening day?',
    eventType: 'choice_selection',
    defaultPoints: 140,
    category: 'Opening Day Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Total shows across all theaters.'],
  },
  {
    title: 'Opening Day Morning Shows Winner',
    description: 'Which movie will have the highest morning shows occupancy?',
    eventType: 'choice_selection',
    defaultPoints: 115,
    category: 'Opening Day Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Average occupancy for morning shows (before 12 PM).'],
  },
  {
    title: 'Opening Day Single Screen vs Multiplex',
    description: 'Which movie will perform better in single screens vs multiplexes?',
    eventType: 'choice_selection',
    defaultPoints: 130,
    category: 'Opening Day Comparison',
    difficultyLevel: 'medium',
    defaultOptions: ['Single Screen Leader', 'Multiplex Leader', 'Equal Performance'],
    defaultRules: ['Compare single screen vs multiplex collections.'],
  },
  {
    title: 'Opening Day Regional Dominance',
    description: 'Which movie will dominate the most regions on opening day?',
    eventType: 'choice_selection',
    defaultPoints: 160,
    category: 'Opening Day Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Movie that leads in the most regions wins.'],
  },
  // First Weekend Comparisons
  {
    title: 'Saturday Growth Winner',
    description: 'Which movie will have the highest Saturday collection growth?',
    eventType: 'choice_selection',
    defaultPoints: 170,
    category: 'First Weekend Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Growth percentage = ((Saturday - Friday) / Friday) × 100.'],
  },
  {
    title: 'Weekend Footfalls Winner',
    description: 'Which movie will have the most footfalls (ticket sales) in first weekend?',
    eventType: 'choice_selection',
    defaultPoints: 180,
    category: 'First Weekend Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Total number of tickets sold.'],
  },
  {
    title: 'Weekend Average Ticket Price Winner',
    description: 'Which movie will have the highest average ticket price in first weekend?',
    eventType: 'choice_selection',
    defaultPoints: 135,
    category: 'First Weekend Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Average ticket price across all theaters.'],
  },
  // First Week Comparisons
  {
    title: 'First Week Collection Ranking',
    description: 'Rank all movies by first week collection (complete ranking order)',
    eventType: 'ranking_selection',
    defaultPoints: 450,
    category: 'First Week Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Predict the complete ranking order for first week.', 'Higher points for full ranking accuracy.'],
  },
  {
    title: 'First Week Occupancy Winner',
    description: 'Which movie will have the highest average occupancy in first week?',
    eventType: 'choice_selection',
    defaultPoints: 160,
    category: 'First Week Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Average occupancy across all days of first week.'],
  },
  {
    title: 'Weekday vs Weekend Performance',
    description: 'Which movie will have the best weekday vs weekend ratio?',
    eventType: 'choice_selection',
    defaultPoints: 145,
    category: 'First Week Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Best ratio = Weekend Collection / Weekday Collection.'],
  },
  // Ratings Comparisons
  {
    title: 'Rotten Tomatoes Score Winner',
    description: 'Which movie will achieve the highest Rotten Tomatoes score?',
    eventType: 'choice_selection',
    defaultPoints: 190,
    category: 'Ratings Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['Rotten Tomatoes score after 50+ critic reviews.'],
  },
  {
    title: 'Google Rating Winner (1 Week)',
    description: 'Which movie will have the highest Google rating after 1 week?',
    eventType: 'choice_selection',
    defaultPoints: 155,
    category: 'Ratings Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Google user rating after 1 week.'],
  },
  {
    title: 'BookMyShow Rating Winner',
    description: 'Which movie will have the highest BookMyShow rating?',
    eventType: 'choice_selection',
    defaultPoints: 165,
    category: 'Ratings Comparison',
    difficultyLevel: 'medium',
    defaultRules: ['BookMyShow user rating after 1 week.'],
  },
  {
    title: 'Audience vs Critics Gap Winner',
    description: 'Which movie will have the smallest gap between audience and critics ratings?',
    eventType: 'choice_selection',
    defaultPoints: 175,
    category: 'Ratings Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Smallest gap = Most aligned ratings.'],
  },
  // Social Media Comparisons
  {
    title: 'Twitter/X Mentions Winner',
    description: 'Which movie will get the most Twitter/X mentions on opening day?',
    eventType: 'choice_selection',
    defaultPoints: 140,
    category: 'Social Media Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Total mentions including hashtags and movie name.'],
  },
  {
    title: 'Instagram Posts Winner',
    description: 'Which movie will generate the most Instagram posts in release week?',
    eventType: 'choice_selection',
    defaultPoints: 130,
    category: 'Social Media Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Posts using official movie hashtags.'],
  },
  {
    title: 'YouTube Search Trend Winner',
    description: 'Which movie will rank highest in YouTube search trends?',
    eventType: 'choice_selection',
    defaultPoints: 120,
    category: 'Social Media Comparison',
    difficultyLevel: 'easy',
    defaultRules: ['Based on YouTube search trends data.'],
  },
  // Lifetime Comparisons
  {
    title: 'Lifetime Collection Ranking',
    description: 'Rank all movies by lifetime gross collection (complete ranking order)',
    eventType: 'ranking_selection',
    defaultPoints: 500,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Predict the complete ranking order for lifetime gross.', 'Highest points for full ranking accuracy.'],
  },
  {
    title: '100 Crore Club Entry Race',
    description: 'Which movie will enter the 100 crore club first?',
    eventType: 'choice_selection',
    defaultPoints: 220,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['First movie to cross 100 Cr lifetime gross.'],
  },
  {
    title: '200 Crore Club Entry Race',
    description: 'Which movie will enter the 200 crore club first (if any)?',
    eventType: 'choice_selection',
    defaultPoints: 300,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultOptions: ['Movie 1', 'Movie 2', 'Movie 3', 'Movie 4', 'None'],
    defaultRules: ['First movie to cross 200 Cr lifetime gross.'],
  },
  {
    title: 'Theatrical Run Duration Winner',
    description: 'Which movie will have the longest theatrical run?',
    eventType: 'choice_selection',
    defaultPoints: 210,
    category: 'Lifetime Comparison',
    difficultyLevel: 'hard',
    defaultRules: ['Duration until movie stops regular theatrical screening.'],
  },
];

