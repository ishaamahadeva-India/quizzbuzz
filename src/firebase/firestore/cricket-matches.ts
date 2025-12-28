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
import type { FantasyMatch, CricketEvent, CricketEventType } from '@/lib/types';

type NewFantasyMatch = {
  matchName: string;
  format: "T20" | "ODI" | "Test" | "IPL";
  teams: string[];
  team1: string;
  team2: string;
  venue?: string;
  startTime: Date;
  status: "upcoming" | "live" | "completed";
  description?: string;
  entryFee?: {
    type: 'free' | 'paid';
    amount?: number;
  };
  maxParticipants?: number;
};

type NewCricketEvent = {
  title: string;
  description: string;
  eventType: CricketEventType;
  innings?: number;
  status: 'upcoming' | 'live' | 'completed' | 'locked';
  startTime?: Date;
  endTime?: Date;
  lockTime?: Date;
  points: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  options?: string[];
  rules?: string[];
  applicableFormats?: ('T20' | 'ODI' | 'Test' | 'IPL')[];
};

/**
 * Adds a new cricket match to the 'fantasy_matches' collection.
 */
export function addCricketMatch(firestore: Firestore, matchData: NewFantasyMatch) {
  const matchesCollection = collection(firestore, 'fantasy_matches');
  
  // Remove undefined values to avoid Firestore errors
  const docToSave: Record<string, any> = {
    matchName: matchData.matchName,
    format: matchData.format,
    teams: matchData.teams,
    team1: matchData.team1,
    team2: matchData.team2,
    startTime: matchData.startTime,
    status: matchData.status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only include optional fields if they are defined
  if (matchData.venue !== undefined) {
    docToSave.venue = matchData.venue;
  }
  if (matchData.description !== undefined) {
    docToSave.description = matchData.description;
  }
  if (matchData.entryFee !== undefined) {
    docToSave.entryFee = matchData.entryFee;
  }
  if (matchData.maxParticipants !== undefined) {
    docToSave.maxParticipants = matchData.maxParticipants;
  }

  return addDoc(matchesCollection, docToSave)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: matchesCollection.path,
        operation: 'create',
        requestResourceData: docToSave,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Updates an existing cricket match.
 */
export function updateCricketMatch(
  firestore: Firestore,
  matchId: string,
  matchData: Partial<NewFantasyMatch>
) {
  const matchDocRef = doc(firestore, 'fantasy_matches', matchId);
  
  // Remove undefined values to avoid Firestore errors
  const docToUpdate: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  // Only include fields that are defined (not undefined)
  Object.keys(matchData).forEach((key) => {
    const value = (matchData as any)[key];
    if (value !== undefined) {
      docToUpdate[key] = value;
    }
  });

  return updateDoc(matchDocRef, docToUpdate)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: matchDocRef.path,
        operation: 'update',
        requestResourceData: docToUpdate,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Deletes a cricket match.
 */
export function deleteCricketMatch(firestore: Firestore, matchId: string) {
  const matchDocRef = doc(firestore, 'fantasy_matches', matchId);
  return deleteDoc(matchDocRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: matchDocRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    });
}

/**
 * Adds an event to a cricket match.
 */
export function addMatchEvent(
  firestore: Firestore,
  matchId: string,
  eventData: NewCricketEvent
) {
  const eventsCollection = collection(firestore, 'fantasy_matches', matchId, 'events');
  
  // Remove undefined values to avoid Firestore errors
  const docToSave: Record<string, any> = {
    title: eventData.title,
    description: eventData.description,
    eventType: eventData.eventType,
    status: eventData.status,
    points: eventData.points,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only include optional fields if they are defined
  if (eventData.innings !== undefined) {
    docToSave.innings = eventData.innings;
  }
  if (eventData.startTime !== undefined) {
    docToSave.startTime = eventData.startTime;
  }
  if (eventData.endTime !== undefined) {
    docToSave.endTime = eventData.endTime;
  }
  if (eventData.lockTime !== undefined) {
    docToSave.lockTime = eventData.lockTime;
  }
  if (eventData.difficultyLevel !== undefined) {
    docToSave.difficultyLevel = eventData.difficultyLevel;
  }
  if (eventData.options !== undefined) {
    docToSave.options = eventData.options;
  }
  if (eventData.rules !== undefined) {
    docToSave.rules = eventData.rules;
  }
  if (eventData.applicableFormats !== undefined) {
    docToSave.applicableFormats = eventData.applicableFormats;
  }

  return addDoc(eventsCollection, docToSave)
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
 * Updates an event in a cricket match.
 */
export function updateMatchEvent(
  firestore: Firestore,
  matchId: string,
  eventId: string,
  eventData: Partial<NewCricketEvent>
) {
  const eventDocRef = doc(firestore, 'fantasy_matches', matchId, 'events', eventId);
  
  // Remove undefined values to avoid Firestore errors
  const docToUpdate: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  // Only include fields that are defined (not undefined)
  Object.keys(eventData).forEach((key) => {
    const value = (eventData as any)[key];
    if (value !== undefined) {
      docToUpdate[key] = value;
    }
  });

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
 * Deletes an event from a cricket match.
 */
export function deleteMatchEvent(
  firestore: Firestore,
  matchId: string,
  eventId: string
) {
  const eventDocRef = doc(firestore, 'fantasy_matches', matchId, 'events', eventId);
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
 * Cricket event categories for grouping
 */
export type CricketEventCategory = 
  | 'Powerplay Events'
  | 'Batting Events'
  | 'Bowling Events'
  | 'Fielding Events'
  | 'Match Outcome'
  | 'Innings Events'
  | 'Special Events'
  | 'Player Performance';

/**
 * Match phases for sequential event unlocking
 * Events unlock as the match progresses through these phases
 * 
 * Phases are organized by format:
 * - T20/IPL: 20 overs per innings
 * - ODI: 50 overs per innings (Powerplay 1: 1-10, Middle Overs: 11-40, Powerplay 2: 41-50)
 * - Test: 90 overs per day (3 sessions per day)
 */
export type MatchPhase = 
  // ========== COMMON PHASES (All Formats) ==========
  | 'Pre-Match'
  | 'Innings Break'
  | 'Post-Match'
  
  // ========== T20/IPL PHASES (20 Overs Per Innings) ==========
  | 'First Innings - Powerplay (Overs 1-6)'
  | 'First Innings - Middle Overs (Overs 7-15)'
  | 'First Innings - Death Overs (Overs 16-20)'
  | 'Second Innings - Powerplay (Overs 1-6)'
  | 'Second Innings - Middle Overs (Overs 7-15)'
  | 'Second Innings - Death Overs (Overs 16-20)'
  
  // ========== ODI PHASES (50 Overs Per Innings) ==========
  // First Innings ODI Phases
  | 'First Innings - Powerplay 1 (Overs 1-10)'
  | 'First Innings - Middle Overs (Overs 11-40)'
  | 'First Innings - Powerplay 2 (Overs 41-50)'
  // Second Innings ODI Phases
  | 'Second Innings - Powerplay 1 (Overs 1-10)'
  | 'Second Innings - Middle Overs (Overs 11-40)'
  | 'Second Innings - Powerplay 2 (Overs 41-50)'
  
  // ========== TEST MATCH PHASES (90 Overs Per Day, 3 Sessions) ==========
  // Day 1 Sessions
  | 'Day 1 - Session 1 (Overs 1-30)'
  | 'Day 1 - Session 2 (Overs 31-60)'
  | 'Day 1 - Session 3 (Overs 61-90)'
  // Day 2 Sessions
  | 'Day 2 - Session 1 (Overs 1-30)'
  | 'Day 2 - Session 2 (Overs 31-60)'
  | 'Day 2 - Session 3 (Overs 61-90)'
  // Day 3 Sessions
  | 'Day 3 - Session 1 (Overs 1-30)'
  | 'Day 3 - Session 2 (Overs 31-60)'
  | 'Day 3 - Session 3 (Overs 61-90)'
  // Day 4 Sessions
  | 'Day 4 - Session 1 (Overs 1-30)'
  | 'Day 4 - Session 2 (Overs 31-60)'
  | 'Day 4 - Session 3 (Overs 61-90)'
  // Day 5 Sessions
  | 'Day 5 - Session 1 (Overs 1-30)'
  | 'Day 5 - Session 2 (Overs 31-60)'
  | 'Day 5 - Session 3 (Overs 61-90)';

/**
 * Powerplay phase information for ODI matches
 */
export type PowerplayPhase = {
  phase: 'P1' | 'P2' | 'P3';
  overs: { start: number; end: number };
  maxFieldersOutside: 2 | 4 | 5;
  description: string;
};

/**
 * ODI Powerplay Rules - Fielding restrictions for each phase
 */
export const ODI_POWERPLAY_RULES: Record<'P1' | 'P2' | 'P3', PowerplayPhase> = {
  P1: {
    phase: 'P1',
    overs: { start: 1, end: 10 },
    maxFieldersOutside: 2,
    description: 'Mandatory powerplay with 2 fielders outside 30-yard circle',
  },
  P2: {
    phase: 'P2',
    overs: { start: 11, end: 40 },
    maxFieldersOutside: 4,
    description: 'Middle overs with 4 fielders outside 30-yard circle',
  },
  P3: {
    phase: 'P3',
    overs: { start: 41, end: 50 },
    maxFieldersOutside: 5,
    description: 'Death overs powerplay with 5 fielders outside 30-yard circle',
  },
};

/**
 * Match state information for determining event unlocking
 */
export type MatchState = {
  format: 'T20' | 'ODI' | 'Test' | 'IPL';
  currentOver: number; // Current over number (0-based, 0 = pre-match)
  currentInnings: 1 | 2; // Current innings (1 or 2)
  matchStatus: 'upcoming' | 'live' | 'completed';
  currentDay?: number; // For Test matches (1-5)
  isInningsBreak?: boolean; // Whether currently in innings break
};

/**
 * Determines the current match phase based on match state
 */
export function getCurrentMatchPhase(state: MatchState): MatchPhase {
  const { format, currentOver, currentInnings, isInningsBreak, currentDay } = state;

  // Pre-match phase
  if (currentOver === 0 && state.matchStatus === 'upcoming') {
    return 'Pre-Match';
  }

  // Innings break
  if (isInningsBreak) {
    return 'Innings Break';
  }

  // Post-match
  if (state.matchStatus === 'completed') {
    return 'Post-Match';
  }

  // T20/IPL phases
  if (format === 'T20' || format === 'IPL') {
    if (currentInnings === 1) {
      if (currentOver >= 0 && currentOver <= 6) {
        return 'First Innings - Powerplay (Overs 1-6)';
      } else if (currentOver > 6 && currentOver <= 15) {
        return 'First Innings - Middle Overs (Overs 7-15)';
      } else if (currentOver > 15 && currentOver <= 20) {
        return 'First Innings - Death Overs (Overs 16-20)';
      }
    } else if (currentInnings === 2) {
      // For second innings, adjust over number (subtract first innings overs)
      const secondInningsOver = currentOver - 20;
      if (secondInningsOver >= 0 && secondInningsOver <= 6) {
        return 'Second Innings - Powerplay (Overs 1-6)';
      } else if (secondInningsOver > 6 && secondInningsOver <= 15) {
        return 'Second Innings - Middle Overs (Overs 7-15)';
      } else if (secondInningsOver > 15 && secondInningsOver <= 20) {
        return 'Second Innings - Death Overs (Overs 16-20)';
      }
    }
  }

  // ODI phases: P1: 1-10, Middle Overs: 11-40, P2: 41-50
  if (format === 'ODI') {
    if (currentInnings === 1) {
      if (currentOver >= 0 && currentOver <= 10) {
        return 'First Innings - Powerplay 1 (Overs 1-10)';
      } else if (currentOver > 10 && currentOver <= 40) {
        return 'First Innings - Middle Overs (Overs 11-40)';
      } else if (currentOver > 40 && currentOver <= 50) {
        return 'First Innings - Powerplay 2 (Overs 41-50)';
      }
    } else if (currentInnings === 2) {
      // For second innings, adjust over number (subtract first innings overs)
      const secondInningsOver = currentOver - 50;
      if (secondInningsOver >= 0 && secondInningsOver <= 10) {
        return 'Second Innings - Powerplay 1 (Overs 1-10)';
      } else if (secondInningsOver > 10 && secondInningsOver <= 40) {
        return 'Second Innings - Middle Overs (Overs 11-40)';
      } else if (secondInningsOver > 40 && secondInningsOver <= 50) {
        return 'Second Innings - Powerplay 2 (Overs 41-50)';
      }
    }
  }

  // Test match phases (session-based)
  if (format === 'Test') {
    const day = currentDay || 1;
    const dayOver = ((day - 1) * 90) + currentOver;
    
    if (dayOver >= 0 && dayOver <= 30) {
      return `Day ${day} - Session 1 (Overs 1-30)` as MatchPhase;
    } else if (dayOver > 30 && dayOver <= 60) {
      return `Day ${day} - Session 2 (Overs 31-60)` as MatchPhase;
    } else if (dayOver > 60 && dayOver <= 90) {
      return `Day ${day} - Session 3 (Overs 61-90)` as MatchPhase;
    }
  }

  // Default to Pre-Match if phase cannot be determined
  return 'Pre-Match';
}

/**
 * Checks if an event should be unlocked based on current match state
 */
export function isEventUnlocked(
  eventTemplate: typeof CRICKET_EVENT_TEMPLATES[number],
  state: MatchState
): boolean {
  const { format, currentOver, currentInnings } = state;
  const currentPhase = getCurrentMatchPhase(state);

  // Check if event applies to current format
  if (eventTemplate.applicableFormats && eventTemplate.applicableFormats.length > 0) {
    if (!eventTemplate.applicableFormats.includes(format)) {
      return false;
    }
  }

  // Check if event matches current phase
  if (eventTemplate.matchPhase && eventTemplate.matchPhase !== currentPhase) {
    return false;
  }

  // Check if event matches current innings
  if (eventTemplate.defaultInnings && eventTemplate.defaultInnings !== currentInnings) {
    return false;
  }

  // Check unlock after over threshold
  if (eventTemplate.unlockAfterOver !== undefined) {
    // For second innings events, adjust the threshold
    let adjustedThreshold = eventTemplate.unlockAfterOver;
    if (currentInnings === 2) {
      if (format === 'T20' || format === 'IPL') {
        adjustedThreshold += 20; // Add first innings overs
      } else if (format === 'ODI') {
        adjustedThreshold += 50; // Add first innings overs
      }
    }
    
    if (currentOver < adjustedThreshold) {
      return false;
    }
  }

  // Pre-match events are always unlocked before match starts
  if (eventTemplate.matchPhase === 'Pre-Match' && state.matchStatus === 'upcoming') {
    return true;
  }

  // Post-match events unlock after match completes
  if (eventTemplate.matchPhase === 'Post-Match' && state.matchStatus === 'completed') {
    return true;
  }

  // Innings break events unlock during innings break
  if (eventTemplate.matchPhase === 'Innings Break' && state.isInningsBreak) {
    return true;
  }

  return true;
}

/**
 * Gets all events that should be unlocked for the current match state
 */
export function getUnlockedEvents(
  state: MatchState
): Array<typeof CRICKET_EVENT_TEMPLATES[number]> {
  return CRICKET_EVENT_TEMPLATES.filter((template) => isEventUnlocked(template, state));
}

/**
 * Gets events for a specific match phase
 */
export function getEventsForPhase(phase: MatchPhase): Array<typeof CRICKET_EVENT_TEMPLATES[number]> {
  return CRICKET_EVENT_TEMPLATES.filter((template) => template.matchPhase === phase);
}

/**
 * Gets events that should be locked (phase has passed)
 */
export function getLockedEvents(
  state: MatchState
): Array<typeof CRICKET_EVENT_TEMPLATES[number]> {
  const currentPhase = getCurrentMatchPhase(state);
  const { format, currentOver, currentInnings } = state;

  return CRICKET_EVENT_TEMPLATES.filter((template) => {
    // Pre-match events lock after match starts (unless they're post-match events)
    if (template.matchPhase === 'Pre-Match' && state.matchStatus === 'live') {
      return true;
    }

    // Innings break events lock when second innings starts
    if (template.matchPhase === 'Innings Break' && currentInnings === 2 && currentOver > 0) {
      return true;
    }

    // Phase-specific locking logic
    if (template.matchPhase && template.matchPhase !== currentPhase) {
      // Check if the phase has passed
      if (format === 'T20' || format === 'IPL') {
        if (currentInnings === 1) {
          if (template.matchPhase === 'First Innings - Powerplay (Overs 1-6)' && currentOver > 6) {
            return true;
          }
          if (template.matchPhase === 'First Innings - Middle Overs (Overs 7-15)' && currentOver > 15) {
            return true;
          }
          if (template.matchPhase === 'First Innings - Death Overs (Overs 16-20)' && currentOver > 20) {
            return true;
          }
        }
      }

      // Similar logic for ODI and Test matches...
    }

    return false;
  });
}

/**
 * Determines the lock over for an event based on its phase
 */
export function getEventLockOver(
  eventTemplate: typeof CRICKET_EVENT_TEMPLATES[number],
  format: 'T20' | 'ODI' | 'Test' | 'IPL'
): number | null {
  if (!eventTemplate.matchPhase) {
    return null;
  }

  // T20/IPL lock overs
  if (format === 'T20' || format === 'IPL') {
    switch (eventTemplate.matchPhase) {
      case 'First Innings - Powerplay (Overs 1-6)':
        return 6;
      case 'First Innings - Middle Overs (Overs 7-15)':
        return 15;
      case 'First Innings - Death Overs (Overs 16-20)':
        return 20;
      case 'Second Innings - Powerplay (Overs 1-6)':
        return 26; // 20 (first innings) + 6
      case 'Second Innings - Middle Overs (Overs 7-15)':
        return 35; // 20 + 15
      case 'Second Innings - Death Overs (Overs 16-20)':
        return 40; // 20 + 20
      default:
        return null;
    }
  }

  // ODI lock overs: P1: 1-10, Middle Overs: 11-40, P2: 41-50
  if (format === 'ODI') {
    switch (eventTemplate.matchPhase) {
      case 'First Innings - Powerplay 1 (Overs 1-10)':
        return 10;
      case 'First Innings - Middle Overs (Overs 11-40)':
        return 40;
      case 'First Innings - Powerplay 2 (Overs 41-50)':
        return 50;
      case 'Second Innings - Powerplay 1 (Overs 1-10)':
        return 60; // 50 + 10
      case 'Second Innings - Middle Overs (Overs 11-40)':
        return 90; // 50 + 40
      case 'Second Innings - Powerplay 2 (Overs 41-50)':
        return 100; // 50 + 50
      default:
        return null;
    }
  }

  // Test match lock overs (session-based)
  if (format === 'Test') {
    // Extract day and session from phase name
    const phaseMatch = eventTemplate.matchPhase.match(/Day (\d+) - Session (\d+)/);
    if (phaseMatch) {
      const day = parseInt(phaseMatch[1]);
      const session = parseInt(phaseMatch[2]);
      const baseOver = (day - 1) * 90;
      
      switch (session) {
        case 1:
          return baseOver + 30;
        case 2:
          return baseOver + 60;
        case 3:
          return baseOver + 90;
        default:
          return null;
      }
    }
  }

  return null;
}

/**
 * Determines the appropriate status for an event based on current match state
 */
export function getEventStatus(
  eventTemplate: typeof CRICKET_EVENT_TEMPLATES[number],
  state: MatchState
): 'upcoming' | 'live' | 'locked' | 'completed' {
  const { format, currentOver, matchStatus } = state;

  // Completed events stay completed
  // (This would be set when results are entered)

  // Pre-match events
  if (eventTemplate.matchPhase === 'Pre-Match') {
    if (matchStatus === 'upcoming') {
      return 'live'; // Available for prediction
    } else if (matchStatus === 'live' || matchStatus === 'completed') {
      return 'locked'; // Locked after match starts
    }
  }

  // Post-match events
  if (eventTemplate.matchPhase === 'Post-Match') {
    if (matchStatus === 'completed') {
      return 'live'; // Available after match ends
    } else {
      return 'upcoming'; // Not yet available
    }
  }

  // Check if event should be unlocked
  if (!isEventUnlocked(eventTemplate, state)) {
    return 'upcoming'; // Not yet unlocked
  }

  // Check if event should be locked
  const lockOver = getEventLockOver(eventTemplate, format);
  if (lockOver !== null && currentOver > lockOver) {
    return 'locked'; // Phase has passed
  }

  // Event is currently live
  return 'live';
}

/**
 * Predefined cricket event templates (30+ events)
 */
export const CRICKET_EVENT_TEMPLATES: Array<{
  title: string;
  description: string;
  eventType: CricketEventType;
  defaultPoints: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  defaultOptions?: string[];
  defaultRules?: string[];
  applicableFormats?: ('T20' | 'ODI' | 'Test' | 'IPL')[];
  category?: CricketEventCategory; // Category for grouping
  matchPhase?: MatchPhase; // Phase when this event unlocks/becomes active
  defaultInnings?: 1 | 2; // Which innings this event applies to
  unlockAfterOver?: number; // Unlock after this over (for sequential events)
}> = [
  // ========== FIRST INNINGS - POWERPLAY EVENTS (OVERS 1-6) ==========
  {
    title: 'First Innings Powerplay Runs (Overs 1-6)',
    description: 'Predict the total runs scored in the first innings powerplay (overs 1-6).',
    eventType: 'powerplay_runs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-30', '31-40', '41-50', '51-60', '61+'],
    defaultRules: ['Unlocks at match start. Locks after over 6.'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'First Innings Powerplay Wickets',
    description: 'Predict the number of wickets lost in first innings powerplay.',
    eventType: 'powerplay_wickets',
    defaultPoints: 40,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0', '1', '2', '3', '4+'],
    defaultRules: ['Unlocks at match start. Locks after over 6.'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'First Innings Powerplay Boundaries',
    description: 'Predict the total number of boundaries (4s) in first innings powerplay.',
    eventType: 'powerplay_boundaries',
    defaultPoints: 35,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9+'],
    defaultRules: ['Unlocks at match start. Locks after over 6.'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'First Innings Powerplay Sixes',
    description: 'Predict the total number of sixes in first innings powerplay.',
    eventType: 'powerplay_sixes',
    defaultPoints: 45,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0', '1-2', '3-4', '5-6', '7+'],
    defaultRules: ['Unlocks at match start. Locks after over 6.'],
    applicableFormats: ['T20', 'ODI'],
  },
  
  // ========== BATTING EVENTS ==========
  {
    title: 'First Ball Runs',
    description: 'Predict the runs scored off the first ball of the match.',
    eventType: 'first_ball_runs',
    defaultPoints: 25,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    defaultOptions: ['0', '1', '2', '3', '4', '6', 'Wicket'],
  },
  {
    title: 'First Boundary',
    description: 'Predict which over will see the first boundary (4 or 6).',
    eventType: 'first_boundary',
    defaultPoints: 30,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    defaultOptions: ['Over 1', 'Over 2', 'Over 3', 'Over 4', 'Over 5+'],
  },
  {
    title: 'First Six',
    description: 'Predict which over will see the first six.',
    eventType: 'first_six',
    defaultPoints: 35,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['Over 1-2', 'Over 3-4', 'Over 5-6', 'Over 7-10', 'Over 11+'],
  },
  {
    title: 'First Wicket',
    description: 'Predict which over will see the first wicket fall.',
    eventType: 'first_wicket',
    defaultPoints: 40,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['Over 1-3', 'Over 4-6', 'Over 7-10', 'Over 11-15', 'Over 16+'],
  },
  {
    title: 'First 50 Partnership',
    description: 'Predict which over will see the first 50-run partnership.',
    eventType: 'first_50_partnership',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['Over 1-5', 'Over 6-10', 'Over 11-15', 'Over 16-20', 'No 50 partnership'],
  },
  {
    title: 'First 100 Partnership',
    description: 'Predict if there will be a 100-run partnership and in which over.',
    eventType: 'first_100_partnership',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    defaultOptions: ['Over 1-10', 'Over 11-20', 'Over 21-30', 'Over 31+', 'No 100 partnership'],
  },
  {
    title: 'Highest Individual Score',
    description: 'Predict the range of the highest individual score in the match.',
    eventType: 'highest_individual_score',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Player Performance',
    defaultOptions: ['0-30', '31-50', '51-70', '71-100', '101+'],
  },
  {
    title: 'Most Boundaries',
    description: 'Predict which team will hit more boundaries (4s).',
    eventType: 'most_boundaries',
    defaultPoints: 30,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Most Sixes',
    description: 'Predict which team will hit more sixes.',
    eventType: 'most_sixes',
    defaultPoints: 35,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Strike Rate Range',
    description: 'Predict the strike rate range of the top scorer.',
    eventType: 'strike_rate_range',
    defaultPoints: 45,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['Below 100', '100-120', '121-150', '151-180', '181+'],
  },
  
  {
    title: 'First Wicket Bowler',
    description: 'Predict which bowler will take the first wicket.',
    eventType: 'first_wicket_bowler',
    defaultPoints: 50,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Bowler 1', 'Bowler 2', 'Bowler 3', 'Bowler 4', 'Other'],
  },
  {
    title: 'Most Wickets',
    description: 'Predict which bowler will take the most wickets.',
    eventType: 'most_wickets',
    defaultPoints: 60,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Bowler 1', 'Bowler 2', 'Bowler 3', 'Bowler 4', 'Tie'],
  },
  {
    title: 'Best Economy Rate',
    description: 'Predict the economy rate range of the best bowler (min 2 overs).',
    eventType: 'best_economy',
    defaultPoints: 55,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Below 4', '4-5', '5-6', '6-7', '7+'],
  },
  {
    title: 'Maiden Overs',
    description: 'Predict the total number of maiden overs in the match.',
    eventType: 'maiden_overs',
    defaultPoints: 40,
    difficultyLevel: 'medium',
    category: 'Bowling Events',
    defaultOptions: ['0', '1-2', '3-4', '5-6', '7+'],
  },
  {
    title: 'Hat-trick',
    description: 'Predict if there will be a hat-trick in the match.',
    eventType: 'hat_trick',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Special Events',
    defaultOptions: ['Yes', 'No'],
  },
  {
    title: 'First 5-Wicket Haul',
    description: 'Predict if any bowler will take 5 wickets in an innings.',
    eventType: 'first_5_wicket_haul',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Yes', 'No'],
  },
  
  // ========== PRE-MATCH EVENTS ==========
  {
    title: 'Toss Winner',
    description: 'Predict which team will win the toss.',
    eventType: 'toss_winner',
    defaultPoints: 20,
    difficultyLevel: 'easy',
    category: 'Match Outcome',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Team 1', 'Team 2'],
    defaultRules: ['Locked before toss.'],
  },
  {
    title: 'Toss Decision',
    description: 'Predict what the toss winner will choose.',
    eventType: 'toss_decision',
    defaultPoints: 25,
    difficultyLevel: 'easy',
    category: 'Match Outcome',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Bat', 'Bowl', 'Field'],
    defaultRules: ['Locked before toss.'],
  },
  {
    title: 'Match Winner',
    description: 'Predict which team will win the match.',
    eventType: 'match_winner',
    defaultPoints: 100,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['Team 1', 'Team 2', 'Tie', 'No Result'],
  },
  {
    title: 'Win Margin',
    description: 'Predict the margin of victory (if applicable).',
    eventType: 'win_margin',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Match Outcome',
    defaultOptions: ['1-20 runs', '21-40 runs', '41-60 runs', '61+ runs', '1-3 wickets', '4-6 wickets', '7+ wickets'],
  },
  {
    title: 'Win By Wickets or Runs',
    description: 'Predict if the match will be won by wickets or runs.',
    eventType: 'win_by_wickets_or_runs',
    defaultPoints: 30,
    difficultyLevel: 'easy',
    category: 'Match Outcome',
    defaultOptions: ['By Runs', 'By Wickets', 'Tie/No Result'],
  },
  {
    title: 'Total Runs',
    description: 'Predict the total runs scored in the match.',
    eventType: 'total_runs',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Match Outcome',
    defaultOptions: ['0-200', '201-300', '301-400', '401-500', '501+'],
  },
  {
    title: 'Total Wickets',
    description: 'Predict the total wickets fallen in the match.',
    eventType: 'total_wickets',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['0-5', '6-10', '11-15', '16-20', '21+'],
  },
  {
    title: 'Total Fours',
    description: 'Predict the total number of fours in the match.',
    eventType: 'total_fours',
    defaultPoints: 45,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['0-10', '11-20', '21-30', '31-40', '41+'],
  },
  {
    title: 'Total Sixes',
    description: 'Predict the total number of sixes in the match.',
    eventType: 'total_sixes',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['0-5', '6-10', '11-15', '16-20', '21+'],
  },
  {
    title: 'Total Extras',
    description: 'Predict the total extras (wides, no-balls, byes, leg-byes) in the match.',
    eventType: 'total_extras',
    defaultPoints: 40,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['0-10', '11-20', '21-30', '31-40', '41+'],
  },
  
  {
    title: 'First Innings Score',
    description: 'Predict the total score in the first innings.',
    eventType: 'first_innings_score',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'Pre-Match',
    defaultInnings: 1,
    defaultOptions: ['0-100', '101-150', '151-200', '201-250', '251+'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
  },
  {
    title: 'Second Innings Score',
    description: 'Predict the total score in the second innings.',
    eventType: 'second_innings_score',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'Innings Break',
    defaultInnings: 2,
    unlockAfterOver: 20,
    defaultOptions: ['0-100', '101-150', '151-200', '201-250', '251+'],
    defaultRules: ['Unlocks during innings break. Locks after second innings ends.'],
  },
  {
    title: 'First Innings Wickets',
    description: 'Predict the wickets lost in first innings.',
    eventType: 'first_innings_wickets',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'Pre-Match',
    defaultInnings: 1,
    defaultOptions: ['0-3', '4-6', '7-9', '10 (All Out)'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
  },
  {
    title: 'Second Innings Wickets',
    description: 'Predict the wickets lost in second innings.',
    eventType: 'second_innings_wickets',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'Innings Break',
    defaultInnings: 2,
    unlockAfterOver: 20,
    defaultOptions: ['0-3', '4-6', '7-9', '10 (All Out)'],
    defaultRules: ['Unlocks during innings break. Locks after second innings ends.'],
  },
  
  // ========== TEST MATCH SPECIFIC SEQUENTIAL EVENTS ==========
  {
    title: 'First Innings Lead',
    description: 'Predict which team will have the first innings lead (Test matches).',
    eventType: 'first_innings_lead',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'Innings Break',
    unlockAfterOver: 90,
    defaultOptions: ['Team 1', 'Team 2', 'No Lead'],
    defaultRules: ['Unlocks after first innings ends. Locks after second innings ends.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Follow On',
    description: 'Predict if there will be a follow-on enforced (Test matches).',
    eventType: 'follow_on',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Special Events',
    matchPhase: 'Innings Break',
    unlockAfterOver: 90,
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks after first innings ends. Locks after second innings starts.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Declaration',
    description: 'Predict if any team will declare their innings (Test matches).',
    eventType: 'declaration',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Special Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 50,
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks after over 50. Locks after first innings ends.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'First Innings Score After Session 1 (Test)',
    description: 'Predict the score after first session (30 overs) in first innings (Test).',
    eventType: 'first_innings_score',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 20,
    defaultOptions: ['0-80', '81-120', '121-160', '161-200', '201+'],
    defaultRules: ['Unlocks after over 20. Locks after over 30.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'First Innings Score After Session 2 (Test)',
    description: 'Predict the score after second session (60 overs) in first innings (Test).',
    eventType: 'first_innings_score',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 50,
    defaultOptions: ['0-150', '151-220', '221-290', '291-360', '361+'],
    defaultRules: ['Unlocks after over 50. Locks after over 60.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Century Count',
    description: 'Predict the total number of centuries in the match.',
    eventType: 'century_count',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  {
    title: 'Fifty Count',
    description: 'Predict the total number of fifties (50+) in the match.',
    eventType: 'fifty_count',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Player Performance',
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9+'],
  },
  
  // ========== ODI SPECIFIC SEQUENTIAL EVENTS ==========
  {
    title: 'First Innings Score After Over 25 (ODI)',
    description: 'Predict the total score after 25 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 20,
    defaultOptions: ['0-100', '101-130', '131-160', '161-190', '191+'],
    defaultRules: ['Unlocks after over 20. Locks after over 25.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'First Innings Score After Over 40 (ODI)',
    description: 'Predict the total score after 40 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'First Innings - Death Overs (Overs 16-20)',
    defaultInnings: 1,
    unlockAfterOver: 35,
    defaultOptions: ['0-200', '201-250', '251-300', '301-350', '351+'],
    defaultRules: ['Unlocks after over 35. Locks after over 40.'],
    applicableFormats: ['ODI'],
  },
  {
    title: '300+ Score',
    description: 'Predict if any team will score 300+ runs (ODI).',
    eventType: '300_plus_score',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
    applicableFormats: ['ODI'],
  },
  {
    title: '400+ Score',
    description: 'Predict if any team will score 400+ runs (ODI).',
    eventType: '400_plus_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'Chase Successful',
    description: 'Predict if the chasing team will successfully chase the target.',
    eventType: 'chase_successful',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Innings Break',
    unlockAfterOver: 50,
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks during innings break. Locks after match ends.'],
    applicableFormats: ['ODI', 'T20'],
  },
  
  // ========== T20/IPL SPECIFIC ==========
  {
    title: '200+ Score',
    description: 'Predict if any team will score 200+ runs (T20/IPL).',
    eventType: '200_plus_score',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['Yes', 'No'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'Fastest 50',
    description: 'Predict the range of balls for the fastest 50 in the match.',
    eventType: 'fastest_50',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['1-20 balls', '21-30 balls', '31-40 balls', '41-50 balls', '51+ balls'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'Fastest 100',
    description: 'Predict the range of balls for the fastest 100 in the match (if any).',
    eventType: 'fastest_100',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['1-40 balls', '41-50 balls', '51-60 balls', '61-70 balls', 'No 100'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'Super Over',
    description: 'Predict if the match will go to a super over (T20/IPL).',
    eventType: 'super_over',
    defaultPoints: 90,
    difficultyLevel: 'hard',
    category: 'Special Events',
    defaultOptions: ['Yes', 'No'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'DRS Reviews',
    description: 'Predict the total number of DRS reviews taken in the match.',
    eventType: 'drs_reviews',
    defaultPoints: 40,
    difficultyLevel: 'medium',
    category: 'Special Events',
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9+'],
  },
  {
    title: 'Timeout Taken',
    description: 'Predict if any team will take a strategic timeout (IPL).',
    eventType: 'timeout_taken',
    defaultPoints: 30,
    difficultyLevel: 'easy',
    category: 'Special Events',
    defaultOptions: ['Yes', 'No'],
    applicableFormats: ['IPL'],
  },
  // ========== NEW ADDITIONS - EXPANDED CRICKET EVENTS ==========
  // ========== POWERPLAY VARIATIONS ==========
  {
    title: 'Powerplay Dot Balls',
    description: 'Predict the total number of dot balls in the powerplay.',
    eventType: 'powerplay_runs',
    defaultPoints: 40,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    defaultOptions: ['0-5', '6-10', '11-15', '16-20', '21+'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Powerplay Run Rate',
    description: 'Predict the run rate range in powerplay (runs per over).',
    eventType: 'powerplay_runs',
    defaultPoints: 45,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    defaultOptions: ['Below 5', '5-7', '7-9', '9-11', '11+'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Powerplay Wicket Type',
    description: 'Predict the type of first wicket in powerplay (if any).',
    eventType: 'powerplay_wickets',
    defaultPoints: 50,
    difficultyLevel: 'hard',
    category: 'Powerplay Events',
    defaultOptions: ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'No Wicket'],
    applicableFormats: ['T20', 'ODI'],
  },
  // ========== BATTING MILESTONES & RECORDS ==========
  {
    title: 'First 10 Overs Score',
    description: 'Predict the total runs scored in first 10 overs.',
    eventType: 'total_runs',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['0-50', '51-70', '71-90', '91-110', '111+'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Last 5 Overs Score',
    description: 'Predict the total runs scored in last 5 overs.',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    defaultOptions: ['0-30', '31-50', '51-70', '71-90', '91+'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Death Overs Score (Last 4)',
    description: 'Predict the total runs scored in death overs (last 4 overs).',
    eventType: 'total_runs',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    defaultOptions: ['0-25', '26-40', '41-55', '56-70', '71+'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'Duck Count',
    description: 'Predict the total number of ducks (0 runs) in the match.',
    eventType: 'total_wickets',
    defaultPoints: 55,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  {
    title: 'Golden Duck Count',
    description: 'Predict the total number of golden ducks (first ball dismissal) in the match.',
    eventType: 'total_wickets',
    defaultPoints: 60,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    defaultOptions: ['0', '1', '2', '3+'],
  },
  {
    title: 'Highest Partnership Runs',
    description: 'Predict the range of highest partnership runs in the match.',
    eventType: 'first_100_partnership',
    defaultPoints: 85,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    defaultOptions: ['0-30', '31-50', '51-75', '76-100', '101+'],
  },
  {
    title: 'Partnership Count (50+)',
    description: 'Predict the total number of 50+ run partnerships in the match.',
    eventType: 'first_50_partnership',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  {
    title: 'Double Century',
    description: 'Predict if any batsman will score a double century.',
    eventType: 'highest_individual_score',
    defaultPoints: 150,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['Yes', 'No'],
    applicableFormats: ['ODI', 'Test'],
  },
  {
    title: '150+ Individual Score',
    description: 'Predict if any batsman will score 150+ runs.',
    eventType: 'highest_individual_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['Yes', 'No'],
  },
  {
    title: 'Fastest 30',
    description: 'Predict the range of balls for the fastest 30 runs in the match.',
    eventType: 'fastest_50',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Player Performance',
    defaultOptions: ['1-10 balls', '11-15 balls', '16-20 balls', '21-25 balls', '26+ balls'],
    applicableFormats: ['T20', 'IPL'],
  },
  // ========== BOWLING VARIATIONS & RECORDS ==========
  {
    title: 'Most Dot Balls',
    description: 'Predict which team will bowl more dot balls.',
    eventType: 'maiden_overs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Bowling Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Most Wides',
    description: 'Predict which team will bowl more wides.',
    eventType: 'total_extras',
    defaultPoints: 35,
    difficultyLevel: 'easy',
    category: 'Bowling Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Most No-Balls',
    description: 'Predict which team will bowl more no-balls.',
    eventType: 'total_extras',
    defaultPoints: 40,
    difficultyLevel: 'easy',
    category: 'Bowling Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Bowling Average Range',
    description: 'Predict the bowling average range of the best bowler (min 2 wickets).',
    eventType: 'best_economy',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Below 10', '10-15', '15-20', '20-25', '25+'],
  },
  {
    title: 'Bowling Strike Rate Range',
    description: 'Predict the strike rate range of the best bowler (min 2 wickets).',
    eventType: 'best_economy',
    defaultPoints: 65,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Below 10', '10-15', '15-20', '20-25', '25+'],
  },
  {
    title: '4-Wicket Haul',
    description: 'Predict if any bowler will take exactly 4 wickets.',
    eventType: 'first_5_wicket_haul',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['Yes', 'No'],
  },
  {
    title: '3-Wicket Haul Count',
    description: 'Predict the total number of 3+ wicket hauls in the match.',
    eventType: 'most_wickets',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  {
    title: 'Bowled Count',
    description: 'Predict the total number of bowled dismissals in the match.',
    eventType: 'total_wickets',
    defaultPoints: 55,
    difficultyLevel: 'medium',
    category: 'Bowling Events',
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9+'],
  },
  {
    title: 'Caught Count',
    description: 'Predict the total number of caught dismissals in the match.',
    eventType: 'total_wickets',
    defaultPoints: 50,
    difficultyLevel: 'easy',
    category: 'Bowling Events',
    defaultOptions: ['0-3', '4-6', '7-9', '10-12', '13+'],
  },
  {
    title: 'LBW Count',
    description: 'Predict the total number of LBW dismissals in the match.',
    eventType: 'total_wickets',
    defaultPoints: 60,
    difficultyLevel: 'hard',
    category: 'Bowling Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  {
    title: 'Run Out Count',
    description: 'Predict the total number of run out dismissals in the match.',
    eventType: 'total_wickets',
    defaultPoints: 55,
    difficultyLevel: 'medium',
    category: 'Fielding Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  {
    title: 'Stumped Count',
    description: 'Predict the total number of stumped dismissals in the match.',
    eventType: 'total_wickets',
    defaultPoints: 65,
    difficultyLevel: 'hard',
    category: 'Fielding Events',
    defaultOptions: ['0', '1', '2', '3+'],
  },
  // ========== FIELDING EVENTS ==========
  {
    title: 'Most Catches',
    description: 'Predict which team will take more catches.',
    eventType: 'total_wickets',
    defaultPoints: 45,
    difficultyLevel: 'easy',
    category: 'Fielding Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Most Run Outs',
    description: 'Predict which team will effect more run outs.',
    eventType: 'total_wickets',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Fielding Events',
    defaultOptions: ['Team 1', 'Team 2', 'Tie'],
  },
  {
    title: 'Fielding Errors (Dropped Catches)',
    description: 'Predict the total number of dropped catches in the match.',
    eventType: 'total_wickets',
    defaultPoints: 60,
    difficultyLevel: 'hard',
    category: 'Fielding Events',
    defaultOptions: ['0', '1-2', '3-4', '5-6', '7+'],
  },
  // ========== OVER-BY-OVER PREDICTIONS ==========
  {
    title: 'Highest Scoring Over',
    description: 'Predict the range of runs in the highest scoring over.',
    eventType: 'total_runs',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    defaultOptions: ['0-10', '11-15', '16-20', '21-25', '26+'],
  },
  {
    title: 'Most Expensive Over',
    description: 'Predict the range of runs in the most expensive over.',
    eventType: 'best_economy',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Bowling Events',
    defaultOptions: ['0-10', '11-15', '16-20', '21-25', '26+'],
  },
  {
    title: 'Maiden Over Count',
    description: 'Predict the total number of maiden overs in the match.',
    eventType: 'maiden_overs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Bowling Events',
    defaultOptions: ['0', '1-2', '3-4', '5-6', '7+'],
  },
  // ========== MATCH SITUATION EVENTS ==========
  {
    title: 'Required Run Rate (10 Overs)',
    description: 'Predict the required run rate after 10 overs (if chasing).',
    eventType: 'chase_successful',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Match Outcome',
    defaultOptions: ['Below 6', '6-8', '8-10', '10-12', '12+'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Required Run Rate (15 Overs)',
    description: 'Predict the required run rate after 15 overs (if chasing).',
    eventType: 'chase_successful',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Match Outcome',
    defaultOptions: ['Below 8', '8-10', '10-12', '12-15', '15+'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Wickets in Hand (10 Overs)',
    description: 'Predict the wickets remaining after 10 overs (if chasing).',
    eventType: 'chase_successful',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9-10'],
    applicableFormats: ['T20', 'ODI'],
  },
  {
    title: 'Wickets in Hand (15 Overs)',
    description: 'Predict the wickets remaining after 15 overs (if chasing).',
    eventType: 'chase_successful',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9-10'],
    applicableFormats: ['T20', 'ODI'],
  },
  // ========== PLAYER PERFORMANCE EVENTS ==========
  {
    title: 'Man of the Match',
    description: 'Predict which type of player will win Man of the Match.',
    eventType: 'match_winner',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
  },
  {
    title: 'Top Scorer Runs Range',
    description: 'Predict the runs range of the top scorer.',
    eventType: 'highest_individual_score',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['0-30', '31-50', '51-75', '76-100', '101+'],
  },
  {
    title: 'Top Wicket Taker Wickets',
    description: 'Predict the wickets range of the top wicket taker.',
    eventType: 'most_wickets',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    defaultOptions: ['0-1', '2', '3', '4', '5+'],
  },
  // ========== SPECIAL EVENTS ==========
  {
    title: 'Free Hit Count',
    description: 'Predict the total number of free hits in the match.',
    eventType: 'total_extras',
    defaultPoints: 45,
    difficultyLevel: 'medium',
    category: 'Special Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'Free Hit Runs',
    description: 'Predict the total runs scored from free hits.',
    eventType: 'total_runs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Special Events',
    defaultOptions: ['0', '1-5', '6-10', '11-15', '16+'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'Review Success Rate',
    description: 'Predict if more than 50% of DRS reviews will be successful.',
    eventType: 'drs_reviews',
    defaultPoints: 55,
    difficultyLevel: 'hard',
    category: 'Special Events',
    defaultOptions: ['Yes', 'No'],
  },
  {
    title: 'Umpire Decision Overturned',
    description: 'Predict the total number of umpire decisions overturned by DRS.',
    eventType: 'drs_reviews',
    defaultPoints: 60,
    difficultyLevel: 'hard',
    category: 'Special Events',
    defaultOptions: ['0', '1', '2', '3', '4+'],
  },
  // ========== IPL SPECIFIC EVENTS ==========
  {
    title: 'Impact Player Used',
    description: 'Predict if any team will use an impact player substitution (IPL).',
    eventType: 'timeout_taken',
    defaultPoints: 35,
    difficultyLevel: 'easy',
    category: 'Special Events',
    defaultOptions: ['Yes', 'No'],
    applicableFormats: ['IPL'],
  },
  {
    title: 'Strategic Timeout Timing',
    description: 'Predict which over range will see the strategic timeout (IPL).',
    eventType: 'timeout_taken',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Special Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 6,
    defaultOptions: ['Over 7-9', 'Over 10-12', 'Over 13-15', 'Over 16-18', 'Not Taken'],
    defaultRules: ['Unlocks after over 6. Locks after over 15.'],
    applicableFormats: ['IPL'],
  },
  
  // ========== SEQUENTIAL/LIVE EVENTS FOR FIRST INNINGS ==========
  // Powerplay Phase (Overs 1-6)
  {
    title: 'First Innings Powerplay Score After Over 3',
    description: 'Predict the score after 3 overs in first innings.',
    eventType: 'powerplay_runs',
    defaultPoints: 35,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-15', '16-25', '26-35', '36-45', '46+'],
    defaultRules: ['Unlocks at match start. Locks after over 3.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'First Innings Powerplay Score After Over 6',
    description: 'Predict the score after 6 overs (end of powerplay) in first innings.',
    eventType: 'powerplay_runs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-30', '31-40', '41-50', '51-60', '61+'],
    defaultRules: ['Unlocks at match start. Locks after over 6.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'First Innings Wickets After Powerplay',
    description: 'Predict wickets lost after first innings powerplay (after over 6).',
    eventType: 'powerplay_wickets',
    defaultPoints: 40,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay (Overs 1-6)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0', '1', '2', '3', '4+'],
    defaultRules: ['Unlocks at match start. Locks after over 6.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // Middle Overs Phase (Overs 7-15)
  {
    title: 'First Innings Score After Over 10',
    description: 'Predict the total score after 10 overs in first innings.',
    eventType: 'total_runs',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 6,
    defaultOptions: ['0-50', '51-70', '71-90', '91-110', '111+'],
    defaultRules: ['Unlocks after over 6. Locks after over 10.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'First Innings Score After Over 15',
    description: 'Predict the total score after 15 overs in first innings.',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 6,
    defaultOptions: ['0-80', '81-100', '101-120', '121-140', '141+'],
    defaultRules: ['Unlocks after over 6. Locks after over 15.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'First Innings Wickets After Over 10',
    description: 'Predict wickets lost after 10 overs in first innings.',
    eventType: 'total_wickets',
    defaultPoints: 45,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 1,
    unlockAfterOver: 6,
    defaultOptions: ['0-1', '2', '3', '4', '5+'],
    defaultRules: ['Unlocks after over 6. Locks after over 10.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // Death Overs Phase (Overs 16-20)
  {
    title: 'First Innings Score After Over 18',
    description: 'Predict the total score after 18 overs in first innings.',
    eventType: 'total_runs',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'First Innings - Death Overs (Overs 16-20)',
    defaultInnings: 1,
    unlockAfterOver: 15,
    defaultOptions: ['0-100', '101-130', '131-160', '161-190', '191+'],
    defaultRules: ['Unlocks after over 15. Locks after over 18.'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'First Innings Final Score Range',
    description: 'Predict the final score range for first innings.',
    eventType: 'first_innings_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'First Innings - Death Overs (Overs 16-20)',
    defaultInnings: 1,
    unlockAfterOver: 15,
    defaultOptions: ['0-100', '101-150', '151-200', '201-250', '251+'],
    defaultRules: ['Unlocks after over 15. Locks after first innings ends.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'First Innings Wickets Lost',
    description: 'Predict total wickets lost in first innings.',
    eventType: 'first_innings_wickets',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'First Innings - Death Overs (Overs 16-20)',
    defaultInnings: 1,
    unlockAfterOver: 15,
    defaultOptions: ['0-3', '4-6', '7-9', '10 (All Out)'],
    defaultRules: ['Unlocks after over 15. Locks after first innings ends.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // ========== INNINGS BREAK EVENTS ==========
  {
    title: 'Target Prediction',
    description: 'Predict if the target will be chased successfully.',
    eventType: 'chase_successful',
    defaultPoints: 80,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Innings Break',
    unlockAfterOver: 20,
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks during innings break. Locks at start of second innings.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'Required Run Rate After Powerplay',
    description: 'Predict the required run rate after second innings powerplay (if chasing).',
    eventType: 'chase_successful',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Innings Break',
    unlockAfterOver: 20,
    defaultOptions: ['Below 6', '6-8', '8-10', '10-12', '12+'],
    defaultRules: ['Unlocks during innings break. Locks after second innings over 6.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // ========== SECOND INNINGS - POWERPLAY EVENTS (OVERS 1-6) ==========
  {
    title: 'Second Innings Powerplay Runs (Overs 1-6)',
    description: 'Predict the total runs scored in the second innings powerplay (overs 1-6).',
    eventType: 'powerplay_runs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    matchPhase: 'Second Innings - Powerplay (Overs 1-6)',
    defaultInnings: 2,
    unlockAfterOver: 20,
    defaultOptions: ['0-30', '31-40', '41-50', '51-60', '61+'],
    defaultRules: ['Unlocks at start of second innings. Locks after over 6 of second innings.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'Second Innings Powerplay Wickets',
    description: 'Predict the number of wickets lost in second innings powerplay.',
    eventType: 'powerplay_wickets',
    defaultPoints: 40,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'Second Innings - Powerplay (Overs 1-6)',
    defaultInnings: 2,
    unlockAfterOver: 20,
    defaultOptions: ['0', '1', '2', '3', '4+'],
    defaultRules: ['Unlocks at start of second innings. Locks after over 6 of second innings.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'Second Innings Powerplay Score After Over 3',
    description: 'Predict the score after 3 overs in second innings.',
    eventType: 'powerplay_runs',
    defaultPoints: 35,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'Second Innings - Powerplay (Overs 1-6)',
    defaultInnings: 2,
    unlockAfterOver: 20,
    defaultOptions: ['0-15', '16-25', '26-35', '36-45', '46+'],
    defaultRules: ['Unlocks at start of second innings. Locks after over 3 of second innings.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // ========== SECOND INNINGS - MIDDLE OVERS (OVERS 7-15) ==========
  {
    title: 'Second Innings Score After Over 10',
    description: 'Predict the total score after 10 overs in second innings.',
    eventType: 'total_runs',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Second Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 2,
    unlockAfterOver: 26,
    defaultOptions: ['0-50', '51-70', '71-90', '91-110', '111+'],
    defaultRules: ['Unlocks after over 6 of second innings. Locks after over 10 of second innings.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  {
    title: 'Second Innings Score After Over 15',
    description: 'Predict the total score after 15 overs in second innings.',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Second Innings - Middle Overs (Overs 7-15)',
    defaultInnings: 2,
    unlockAfterOver: 26,
    defaultOptions: ['0-80', '81-100', '101-120', '121-140', '141+'],
    defaultRules: ['Unlocks after over 6 of second innings. Locks after over 15 of second innings.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // ========== SECOND INNINGS - DEATH OVERS (OVERS 16-20) ==========
  {
    title: 'Second Innings Score After Over 18',
    description: 'Predict the total score after 18 overs in second innings.',
    eventType: 'total_runs',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Second Innings - Death Overs (Overs 16-20)',
    defaultInnings: 2,
    unlockAfterOver: 35,
    defaultOptions: ['0-100', '101-130', '131-160', '161-190', '191+'],
    defaultRules: ['Unlocks after over 15 of second innings. Locks after over 18 of second innings.'],
    applicableFormats: ['T20', 'IPL'],
  },
  {
    title: 'Second Innings Final Score Range',
    description: 'Predict the final score range for second innings.',
    eventType: 'second_innings_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'Second Innings - Death Overs (Overs 16-20)',
    defaultInnings: 2,
    unlockAfterOver: 35,
    defaultOptions: ['0-100', '101-150', '151-200', '201-250', '251+'],
    defaultRules: ['Unlocks after over 15 of second innings. Locks after second innings ends.'],
    applicableFormats: ['T20', 'ODI', 'IPL'],
  },
  
  // ========== ODI SPECIFIC EVENTS - FIRST INNINGS ==========
  // ========== FIRST INNINGS - POWERPLAY 1 (OVERS 1-10) ==========
  {
    title: 'ODI First Innings Powerplay 1 Total Runs (Overs 1-10)',
    description: 'Predict the total runs scored in the first innings powerplay 1 (overs 1-10) in ODI.',
    eventType: 'powerplay_runs',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay 1 (Overs 1-10)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-40', '41-50', '51-60', '61-70', '71+'],
    defaultRules: ['Unlocks at match start. Locks after over 10.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Powerplay 1 Wickets',
    description: 'Predict the number of wickets lost in first innings powerplay 1 (overs 1-10) in ODI.',
    eventType: 'powerplay_wickets',
    defaultPoints: 45,
    difficultyLevel: 'easy',
    category: 'Powerplay Events',
    matchPhase: 'First Innings - Powerplay 1 (Overs 1-10)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0', '1', '2', '3', '4+'],
    defaultRules: ['Unlocks at match start. Locks after over 10.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Score After Over 5',
    description: 'Predict the total score after 5 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 40,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    matchPhase: 'First Innings - Powerplay 1 (Overs 1-10)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-20', '21-30', '31-40', '41-50', '51+'],
    defaultRules: ['Unlocks at match start. Locks after over 5.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Score After Over 10',
    description: 'Predict the total score after 10 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 55,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Powerplay 1 (Overs 1-10)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-40', '41-50', '51-60', '61-70', '71+'],
    defaultRules: ['Unlocks at match start. Locks after over 10.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== FIRST INNINGS - MIDDLE OVERS (OVERS 11-40) ==========
  {
    title: 'ODI First Innings Score After Over 25',
    description: 'Predict the total score after 25 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 10,
    defaultOptions: ['0-100', '101-130', '131-160', '161-190', '191+'],
    defaultRules: ['Unlocks after over 10. Locks after over 25.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Score After Over 30',
    description: 'Predict the total score after 30 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 75,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 10,
    defaultOptions: ['0-120', '121-150', '151-180', '181-210', '211+'],
    defaultRules: ['Unlocks after over 10. Locks after over 30.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Wickets After Over 25',
    description: 'Predict wickets lost after 25 overs in first innings (ODI).',
    eventType: 'total_wickets',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 10,
    defaultOptions: ['0-2', '3', '4', '5', '6+'],
    defaultRules: ['Unlocks after over 10. Locks after over 25.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Wickets After Over 30',
    description: 'Predict wickets lost after 30 overs in first innings (ODI).',
    eventType: 'total_wickets',
    defaultPoints: 55,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 10,
    defaultOptions: ['0-2', '3', '4', '5', '6+'],
    defaultRules: ['Unlocks after over 10. Locks after over 30.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First 100 Partnership Over',
    description: 'Predict which over range will see the first 100-run partnership (ODI).',
    eventType: 'first_100_partnership',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 10,
    defaultOptions: ['Over 1-20', 'Over 21-30', 'Over 31+', 'No 100 partnership'],
    defaultRules: ['Unlocks after over 10. Locks after over 30.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== FIRST INNINGS - MIDDLE OVERS CONTINUED (OVERS 31-40) ==========
  {
    title: 'ODI First Innings Score After Over 35',
    description: 'Predict the total score after 35 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['0-150', '151-200', '201-250', '251-300', '301+'],
    defaultRules: ['Unlocks after over 30. Locks after over 35.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Score After Over 40',
    description: 'Predict the total score after 40 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 85,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['0-200', '201-250', '251-300', '301-350', '351+'],
    defaultRules: ['Unlocks after over 30. Locks after over 40.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Wickets After Over 40',
    description: 'Predict wickets lost after 40 overs in first innings (ODI).',
    eventType: 'total_wickets',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'First Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['0-3', '4', '5', '6', '7+'],
    defaultRules: ['Unlocks after over 30. Locks after over 40.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== FIRST INNINGS - POWERPLAY 2 (OVERS 41-50) ==========
  {
    title: 'ODI First Innings Score After Over 45',
    description: 'Predict the total score after 45 overs in first innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 90,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'First Innings - Powerplay 2 (Overs 41-50)',
    defaultInnings: 1,
    unlockAfterOver: 40,
    defaultOptions: ['0-250', '251-300', '301-350', '351-400', '401+'],
    defaultRules: ['Unlocks after over 40. Locks after over 45.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI Final First Innings Score',
    description: 'Predict the final score range for first innings (ODI).',
    eventType: 'first_innings_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'First Innings - Powerplay 2 (Overs 41-50)',
    defaultInnings: 1,
    unlockAfterOver: 40,
    defaultOptions: ['0-200', '201-250', '251-300', '301-350', '351-400', '401+'],
    defaultRules: ['Unlocks after over 40. Locks after first innings ends.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI First Innings Wickets Lost',
    description: 'Predict total wickets lost in first innings (ODI).',
    eventType: 'first_innings_wickets',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'First Innings - Powerplay 2 (Overs 41-50)',
    defaultInnings: 1,
    unlockAfterOver: 40,
    defaultOptions: ['0-3', '4-6', '7-9', '10 (All Out)'],
    defaultRules: ['Unlocks after over 40. Locks after first innings ends.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI 300+ Score Achieved',
    description: 'Predict if any team will score 300+ runs in an innings (ODI).',
    eventType: '300_plus_score',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI 400+ Score Achieved',
    description: 'Predict if any team will score 400+ runs in an innings (ODI).',
    eventType: '400_plus_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== ODI SPECIFIC EVENTS - SECOND INNINGS ==========
  // ========== SECOND INNINGS - POWERPLAY 1 (OVERS 1-10) ==========
  {
    title: 'ODI Second Innings Powerplay 1 Total Runs (Overs 1-10)',
    description: 'Predict the total runs scored in the second innings powerplay 1 (overs 1-10) in ODI.',
    eventType: 'powerplay_runs',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Powerplay Events',
    matchPhase: 'Second Innings - Powerplay 1 (Overs 1-10)',
    defaultInnings: 2,
    unlockAfterOver: 50,
    defaultOptions: ['0-40', '41-50', '51-60', '61-70', '71+'],
    defaultRules: ['Unlocks at start of second innings. Locks after over 10 of second innings.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI Second Innings Required Run Rate After Over 10',
    description: 'Predict the required run rate after 10 overs in second innings (ODI).',
    eventType: 'chase_successful',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Second Innings - Powerplay 1 (Overs 1-10)',
    defaultInnings: 2,
    unlockAfterOver: 50,
    defaultOptions: ['Below 5', '5-6', '6-7', '7-8', '8+'],
    defaultRules: ['Unlocks at start of second innings. Locks after over 10 of second innings.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== SECOND INNINGS - MIDDLE OVERS (OVERS 11-40) ==========
  {
    title: 'ODI Second Innings Score After Over 25',
    description: 'Predict the total score after 25 overs in second innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Second Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 2,
    unlockAfterOver: 60,
    defaultOptions: ['0-100', '101-130', '131-160', '161-190', '191+'],
    defaultRules: ['Unlocks after over 10 of second innings. Locks after over 25 of second innings.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI Second Innings Required Run Rate After Over 30',
    description: 'Predict the required run rate after 30 overs in second innings (ODI).',
    eventType: 'chase_successful',
    defaultPoints: 75,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Second Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 2,
    unlockAfterOver: 60,
    defaultOptions: ['Below 5', '5-6', '6-7', '7-8', '8+'],
    defaultRules: ['Unlocks after over 10 of second innings. Locks after over 30 of second innings.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== SECOND INNINGS - MIDDLE OVERS CONTINUED (OVERS 31-40) ==========
  {
    title: 'ODI Second Innings Score After Over 40',
    description: 'Predict the total score after 40 overs in second innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 85,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Second Innings - Middle Overs (Overs 11-40)',
    defaultInnings: 2,
    unlockAfterOver: 80,
    defaultOptions: ['0-200', '201-250', '251-300', '301-350', '351+'],
    defaultRules: ['Unlocks after over 30 of second innings. Locks after over 40 of second innings.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== SECOND INNINGS - POWERPLAY 2 (OVERS 41-50) ==========
  {
    title: 'ODI Second Innings Score After Over 45',
    description: 'Predict the total score after 45 overs in second innings (ODI).',
    eventType: 'total_runs',
    defaultPoints: 90,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Second Innings - Powerplay 2 (Overs 41-50)',
    defaultInnings: 2,
    unlockAfterOver: 90,
    defaultOptions: ['0-250', '251-300', '301-350', '351-400', '401+'],
    defaultRules: ['Unlocks after over 40 of second innings. Locks after over 45 of second innings.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI Final Second Innings Score',
    description: 'Predict the final score range for second innings (ODI).',
    eventType: 'second_innings_score',
    defaultPoints: 100,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'Second Innings - Powerplay 2 (Overs 41-50)',
    defaultInnings: 2,
    unlockAfterOver: 90,
    defaultOptions: ['0-200', '201-250', '251-300', '301-350', '351-400', '401+'],
    defaultRules: ['Unlocks after over 40 of second innings. Locks after second innings ends.'],
    applicableFormats: ['ODI'],
  },
  {
    title: 'ODI Chase Successful',
    description: 'Predict if the chasing team will successfully chase the target (ODI).',
    eventType: 'chase_successful',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Innings Break',
    unlockAfterOver: 50,
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks during innings break. Locks after match ends.'],
    applicableFormats: ['ODI'],
  },
  
  // ========== TEST MATCH SPECIFIC EVENTS ==========
  // ========== PRE-MATCH TEST EVENTS ==========
  {
    title: 'Test Match First Innings Lead',
    description: 'Predict which team will have the first innings lead (Test matches).',
    eventType: 'first_innings_lead',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Innings Events',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Team 1', 'Team 2', 'No Lead'],
    defaultRules: ['Unlocks at match start. Locks after second innings ends.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Match Follow-On Enforced',
    description: 'Predict if there will be a follow-on enforced (Test matches).',
    eventType: 'follow_on',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Special Events',
    matchPhase: 'Pre-Match',
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks at match start. Locks after first innings ends.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Match Total Centuries',
    description: 'Predict the total number of centuries in the match (Test).',
    eventType: 'century_count',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    matchPhase: 'Pre-Match',
    defaultOptions: ['0', '1', '2', '3', '4+'],
    defaultRules: ['Unlocks at match start. Locks after match ends.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Match Total Fifties',
    description: 'Predict the total number of fifties (50+) in the match (Test).',
    eventType: 'fifty_count',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Player Performance',
    matchPhase: 'Pre-Match',
    defaultOptions: ['0-2', '3-4', '5-6', '7-8', '9+'],
    defaultRules: ['Unlocks at match start. Locks after match ends.'],
    applicableFormats: ['Test'],
  },
  
  // ========== DAY 1 - SESSION 1 (OVERS 1-30) ==========
  {
    title: 'Test Day 1 Session 1 - Score After Over 15',
    description: 'Predict the score after 15 overs on Day 1 Session 1 (Test).',
    eventType: 'total_runs',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 1 (Overs 1-30)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-40', '41-60', '61-80', '81-100', '101+'],
    defaultRules: ['Unlocks at match start. Locks after over 15.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 1 - Score After Over 30 (Lunch)',
    description: 'Predict the score after 30 overs on Day 1 Session 1 - Lunch (Test).',
    eventType: 'total_runs',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 1 (Overs 1-30)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-80', '81-120', '121-160', '161-200', '201+'],
    defaultRules: ['Unlocks at match start. Locks after over 30 (Lunch).'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 1 - Wickets After Session',
    description: 'Predict wickets lost after Day 1 Session 1 (Test).',
    eventType: 'total_wickets',
    defaultPoints: 45,
    difficultyLevel: 'easy',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 1 (Overs 1-30)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['0-1', '2', '3', '4', '5+'],
    defaultRules: ['Unlocks at match start. Locks after over 30.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 1 - First Wicket Over',
    description: 'Predict which over range will see the first wicket fall (Test Day 1 Session 1).',
    eventType: 'first_wicket',
    defaultPoints: 40,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 1 (Overs 1-30)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['Over 1-10', 'Over 11-20', 'Over 21-30', 'No Wicket'],
    defaultRules: ['Unlocks at match start. Locks after over 30.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 1 - First 50 Partnership Over',
    description: 'Predict which over range will see the first 50-run partnership (Test Day 1 Session 1).',
    eventType: 'first_50_partnership',
    defaultPoints: 50,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 1 (Overs 1-30)',
    defaultInnings: 1,
    unlockAfterOver: 0,
    defaultOptions: ['Over 1-15', 'Over 16-30', 'Over 31+', 'No 50 partnership'],
    defaultRules: ['Unlocks at match start. Locks after over 30.'],
    applicableFormats: ['Test'],
  },
  
  // ========== DAY 1 - SESSION 2 (OVERS 31-60) ==========
  {
    title: 'Test Day 1 Session 2 - Score After Over 45',
    description: 'Predict the score after 45 overs on Day 1 Session 2 (Test).',
    eventType: 'total_runs',
    defaultPoints: 70,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 2 (Overs 31-60)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['0-120', '121-180', '181-240', '241-300', '301+'],
    defaultRules: ['Unlocks after over 30. Locks after over 45.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 2 - Score After Over 60 (Tea)',
    description: 'Predict the score after 60 overs on Day 1 Session 2 - Tea (Test).',
    eventType: 'total_runs',
    defaultPoints: 75,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 2 (Overs 31-60)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['0-150', '151-220', '221-290', '291-360', '361+'],
    defaultRules: ['Unlocks after over 30. Locks after over 60 (Tea).'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 2 - Wickets After Session',
    description: 'Predict wickets lost after Day 1 Session 2 (Test).',
    eventType: 'total_wickets',
    defaultPoints: 55,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 2 (Overs 31-60)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['0-2', '3', '4', '5', '6+'],
    defaultRules: ['Unlocks after over 30. Locks after over 60.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 2 - First Century Over',
    description: 'Predict which over range will see the first century (Test Day 1 Session 2).',
    eventType: 'highest_individual_score',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Player Performance',
    matchPhase: 'Day 1 - Session 2 (Overs 31-60)',
    defaultInnings: 1,
    unlockAfterOver: 30,
    defaultOptions: ['Over 1-40', 'Over 41-60', 'Over 61+', 'No Century'],
    defaultRules: ['Unlocks after over 30. Locks after over 60.'],
    applicableFormats: ['Test'],
  },
  
  // ========== DAY 1 - SESSION 3 (OVERS 61-90) ==========
  {
    title: 'Test Day 1 Session 3 - Score After Over 75',
    description: 'Predict the score after 75 overs on Day 1 Session 3 (Test).',
    eventType: 'total_runs',
    defaultPoints: 80,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 3 (Overs 61-90)',
    defaultInnings: 1,
    unlockAfterOver: 60,
    defaultOptions: ['0-200', '201-280', '281-360', '361-440', '441+'],
    defaultRules: ['Unlocks after over 60. Locks after over 75.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 3 - Score After Over 90 (Stumps)',
    description: 'Predict the score after 90 overs on Day 1 Session 3 - Stumps (Test).',
    eventType: 'total_runs',
    defaultPoints: 85,
    difficultyLevel: 'hard',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 3 (Overs 61-90)',
    defaultInnings: 1,
    unlockAfterOver: 60,
    defaultOptions: ['0-250', '251-350', '351-450', '451-550', '551+'],
    defaultRules: ['Unlocks after over 60. Locks after over 90 (Stumps Day 1).'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 3 - Wickets After Day 1',
    description: 'Predict wickets lost after Day 1 (Test).',
    eventType: 'total_wickets',
    defaultPoints: 60,
    difficultyLevel: 'medium',
    category: 'Batting Events',
    matchPhase: 'Day 1 - Session 3 (Overs 61-90)',
    defaultInnings: 1,
    unlockAfterOver: 60,
    defaultOptions: ['0-2', '3', '4', '5', '6+'],
    defaultRules: ['Unlocks after over 60. Locks after over 90.'],
    applicableFormats: ['Test'],
  },
  {
    title: 'Test Day 1 Session 3 - First Innings Score After Day 1',
    description: 'Predict the first innings score after Day 1 (Test).',
    eventType: 'first_innings_score',
    defaultPoints: 90,
    difficultyLevel: 'hard',
    category: 'Innings Events',
    matchPhase: 'Day 1 - Session 3 (Overs 61-90)',
    defaultInnings: 1,
    unlockAfterOver: 60,
    defaultOptions: ['0-200', '201-300', '301-400', '401-500', '501+'],
    defaultRules: ['Unlocks after over 60. Locks after over 90.'],
    applicableFormats: ['Test'],
  },
  
  // ========== TEST DECLARATION EVENT ==========
  {
    title: 'Test Match Declaration',
    description: 'Predict if any team will declare their innings (Test matches).',
    eventType: 'declaration',
    defaultPoints: 65,
    difficultyLevel: 'medium',
    category: 'Special Events',
    matchPhase: 'Day 1 - Session 2 (Overs 31-60)',
    defaultInnings: 1,
    unlockAfterOver: 50,
    defaultOptions: ['Yes', 'No'],
    defaultRules: ['Unlocks after over 50. Locks after first innings ends.'],
    applicableFormats: ['Test'],
  },
  
  // ========== POST-MATCH EVENTS ==========
  {
    title: 'Match Winner',
    description: 'Predict which team will win the match.',
    eventType: 'match_winner',
    defaultPoints: 100,
    difficultyLevel: 'medium',
    category: 'Match Outcome',
    matchPhase: 'Post-Match',
    defaultOptions: ['Team 1', 'Team 2', 'Tie', 'No Result'],
    defaultRules: ['Unlocks at match start. Locks after match ends.'],
  },
];

