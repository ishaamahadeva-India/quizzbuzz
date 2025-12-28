/**
 * Utility functions for updating match state in Firestore
 * These functions help maintain real-time match state for sequential event unlocking
 */

import { Firestore, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { MatchState } from '@/firebase/firestore/cricket-matches';

/**
 * Updates the match state in Firestore
 * This should be called when:
 * - Match starts (currentOver: 0 -> 1)
 * - Over completes (currentOver increments)
 * - Innings changes (currentInnings: 1 -> 2)
 * - Match status changes (upcoming -> live -> completed)
 * - Innings break starts/ends
 */
export async function updateMatchState(
  firestore: Firestore,
  matchId: string,
  stateUpdate: Partial<MatchState>
) {
  const matchRef = doc(firestore, 'fantasy_matches', matchId);

  const updateData: any = {
    ...stateUpdate,
    updatedAt: serverTimestamp(),
  };

  // Convert Date objects to Firestore Timestamps if needed
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] instanceof Date) {
      updateData[key] = updateData[key];
    }
  });

  return updateDoc(matchRef, updateData);
}

/**
 * Increments the current over number
 * Call this when an over completes
 */
export async function incrementOver(
  firestore: Firestore,
  matchId: string,
  currentOver: number
) {
  return updateMatchState(firestore, matchId, {
    currentOver: currentOver + 1,
  });
}

/**
 * Starts the match (changes status from upcoming to live)
 */
export async function startMatch(
  firestore: Firestore,
  matchId: string
) {
  return updateMatchState(firestore, matchId, {
    matchStatus: 'live',
    currentOver: 0,
    currentInnings: 1,
  });
}

/**
 * Starts innings break
 */
export async function startInningsBreak(
  firestore: Firestore,
  matchId: string
) {
  return updateMatchState(firestore, matchId, {
    isInningsBreak: true,
  });
}

/**
 * Ends innings break and starts second innings
 */
export async function startSecondInnings(
  firestore: Firestore,
  matchId: string,
  format: 'T20' | 'ODI' | 'Test' | 'IPL'
) {
  // Calculate starting over for second innings
  let startingOver = 0;
  if (format === 'T20' || format === 'IPL') {
    startingOver = 20; // After 20 overs of first innings
  } else if (format === 'ODI') {
    startingOver = 50; // After 50 overs of first innings
  }

  return updateMatchState(firestore, matchId, {
    isInningsBreak: false,
    currentInnings: 2,
    currentOver: startingOver,
  });
}

/**
 * Completes the match
 */
export async function completeMatch(
  firestore: Firestore,
  matchId: string
) {
  return updateMatchState(firestore, matchId, {
    matchStatus: 'completed',
  });
}

/**
 * Updates current day for Test matches
 */
export async function updateTestMatchDay(
  firestore: Firestore,
  matchId: string,
  day: number,
  over: number
) {
  return updateMatchState(firestore, matchId, {
    currentDay: day,
    currentOver: over,
  });
}

