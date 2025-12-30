'use client';

import { doc, getDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { updateUserPoints } from './users';
import type { UserProfile } from '@/lib/types';

/**
 * Gets today's date in YYYY-MM-DD format (IST)
 */
function getTodayDateString(): string {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date string is today
 */
function isToday(dateString: string | undefined): boolean {
  if (!dateString) return false;
  return dateString === getTodayDateString();
}

/**
 * Awards daily login reward if user hasn't logged in today
 * Returns true if reward was awarded, false if already claimed today
 */
export async function checkAndAwardDailyLogin(
  firestore: Firestore,
  userId: string,
  points: number = 99
): Promise<{ awarded: boolean; streak: number; message: string }> {
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data() as UserProfile;
  const today = getTodayDateString();
  const lastLoginDate = userData.lastDailyLoginDate;

  // Already claimed today
  if (isToday(lastLoginDate)) {
    return {
      awarded: false,
      streak: userData.dailyLoginStreak || 0,
      message: 'Daily login reward already claimed today',
    };
  }

  // Calculate streak
  let newStreak = 1;
  if (lastLoginDate) {
    const lastDate = new Date(lastLoginDate + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      newStreak = (userData.dailyLoginStreak || 0) + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  // Award points
  await updateUserPoints(
    firestore,
    userId,
    points,
    `Daily login reward - Day ${newStreak}`,
    { type: 'daily_login', date: today, streak: newStreak }
  );

  // Update user profile
  await updateDoc(userDocRef, {
    lastDailyLoginDate: today,
    dailyLoginStreak: newStreak,
    totalDailyLogins: (userData.totalDailyLogins || 0) + 1,
    updatedAt: serverTimestamp(),
  });

  return {
    awarded: true,
    streak: newStreak,
    message: `Daily login reward claimed! +${points} points (Streak: ${newStreak} days)`,
  };
}

/**
 * Awards daily game play reward if user played at least 1 game today
 * Returns true if reward was awarded, false if already claimed today or no game played
 */
export async function checkAndAwardDailyGame(
  firestore: Firestore,
  userId: string,
  points: number = 99
): Promise<{ awarded: boolean; message: string }> {
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data() as UserProfile;
  const today = getTodayDateString();
  const lastGameDate = userData.lastDailyGameDate;

  // Already claimed today
  if (isToday(lastGameDate)) {
    return {
      awarded: false,
      message: 'Daily game reward already claimed today',
    };
  }

  // Award points
  await updateUserPoints(
    firestore,
    userId,
    points,
    `Daily game play reward`,
    { type: 'daily_game', date: today }
  );

  // Update user profile
  await updateDoc(userDocRef, {
    lastDailyGameDate: today,
    totalDailyGames: (userData.totalDailyGames || 0) + 1,
    updatedAt: serverTimestamp(),
  });

  return {
    awarded: true,
    message: `Daily game reward claimed! +${points} points`,
  };
}

/**
 * Records that a user played a game (to be called when user participates in any game)
 * This should be called from game participation handlers
 */
export async function recordGamePlay(
  firestore: Firestore,
  userId: string,
  gameType: 'fantasy_cricket' | 'fantasy_movie' | 'quiz' | 'other'
): Promise<void> {
  const userDocRef = doc(firestore, 'users', userId);
  const today = getTodayDateString();
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    return; // User not found, skip silently
  }

  const userData = userDoc.data() as UserProfile;
  const lastGameDate = userData.lastDailyGameDate;

  // If already played today, don't update
  if (isToday(lastGameDate)) {
    return;
  }

  // Update last game date
  await updateDoc(userDocRef, {
    lastDailyGameDate: today,
    totalDailyGames: (userData.totalDailyGames || 0) + 1,
    updatedAt: serverTimestamp(),
  }).catch(error => {
    // Don't fail if update fails
    console.error('Failed to record game play:', error);
  });
}

