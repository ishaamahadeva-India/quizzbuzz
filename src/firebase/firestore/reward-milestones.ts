'use client';

import { doc, getDoc, updateDoc, setDoc, serverTimestamp, increment, type Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { updateUserPoints } from './users';
import { awardVoucher } from './vouchers';
import type { UserProfile, RewardMilestoneConfig, UserMilestoneProgress } from '@/lib/types';

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
 * Gets date string N days ago
 */
function getDateStringNDaysAgo(days: number): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  istTime.setUTCDate(istTime.getUTCDate() - days);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date string is within the last N days
 */
function isWithinLastNDays(dateString: string | undefined, days: number): boolean {
  if (!dateString) return false;
  const targetDate = new Date(dateString + 'T00:00:00');
  const cutoffDate = new Date(getDateStringNDaysAgo(days) + 'T00:00:00');
  return targetDate >= cutoffDate;
}

/**
 * Counts unique dates in an array of date strings within last N days
 */
function countUniqueDatesInWindow(dates: string[], days: number): number {
  const cutoffDate = new Date(getDateStringNDaysAgo(days) + 'T00:00:00');
  const uniqueDates = new Set<string>();
  
  dates.forEach(dateStr => {
    if (!dateStr) return;
    const date = new Date(dateStr + 'T00:00:00');
    if (date >= cutoffDate) {
      uniqueDates.add(dateStr);
    }
  });
  
  return uniqueDates.size;
}

/**
 * Records daily login and checks milestones
 */
export async function recordDailyLogin(
  firestore: Firestore,
  userId: string
): Promise<{ streak: number; milestonesAchieved: string[] }> {
  const userDocRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data() as UserProfile;
  const today = getTodayDateString();
  const lastLoginDate = userData.lastDailyLoginDate;

  // Calculate streak
  let newStreak = 1;
  if (lastLoginDate) {
    const lastDate = new Date(lastLoginDate + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      newStreak = (userData.dailyLoginStreak || 0) + 1;
    } else if (daysDiff === 0) {
      // Same day, keep current streak
      newStreak = userData.dailyLoginStreak || 0;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  // Update user profile
  await updateDoc(userDocRef, {
    lastDailyLoginDate: today,
    dailyLoginStreak: newStreak,
    totalDailyLogins: (userData.totalDailyLogins || 0) + (lastLoginDate !== today ? 1 : 0),
    updatedAt: serverTimestamp(),
  });

  // Check milestones
  const milestonesAchieved = await checkAndAwardMilestones(firestore, userId, 'login_streak', newStreak);

  return {
    streak: newStreak,
    milestonesAchieved,
  };
}

/**
 * Records game play and checks milestones
 */
export async function recordGamePlay(
  firestore: Firestore,
  userId: string,
  gameType: 'fantasy_cricket' | 'fantasy_movie' | 'quiz' | 'other'
): Promise<{ milestonesAchieved: string[] }> {
  const userDocRef = doc(firestore, 'users', userId);
  const today = getTodayDateString();
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    return { milestonesAchieved: [] };
  }

  const userData = userDoc.data() as UserProfile;
  const lastGameDate = userData.lastDailyGameDate;

  // If already played today, don't update but still check milestones
  if (lastGameDate === today) {
    // Still check milestones based on current progress
    const gamesInLast30Days = await getGamesPlayedInWindow(firestore, userId, 30);
    const milestonesAchieved = await checkAndAwardMilestones(firestore, userId, 'games_played', gamesInLast30Days);
    return { milestonesAchieved };
  }

  // Update last game date
  await updateDoc(userDocRef, {
    lastDailyGameDate: today,
    totalDailyGames: (userData.totalDailyGames || 0) + 1,
    updatedAt: serverTimestamp(),
  }).catch(error => {
    console.error('Failed to record game play:', error);
  });

  // Store game play date in a separate collection for milestone tracking
  const gamePlaysRef = doc(firestore, `users/${userId}/game-plays/${today}`);
  await setDoc(gamePlaysRef, {
    date: today,
    gameType,
    createdAt: serverTimestamp(),
  }, { merge: true }).catch(err => {
    console.error('Failed to store game play date:', err);
  });

  // Check milestones
  const gamesInLast30Days = await getGamesPlayedInWindow(firestore, userId, 30);
  const milestonesAchieved = await checkAndAwardMilestones(firestore, userId, 'games_played', gamesInLast30Days);

  return { milestonesAchieved };
}

/**
 * Gets number of games played in the last N days
 */
async function getGamesPlayedInWindow(
  firestore: Firestore,
  userId: string,
  days: number
): Promise<number> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const gamePlaysCollection = collection(firestore, `users/${userId}/game-plays`);
    const snapshot = await getDocs(gamePlaysCollection);
    
    const dates = snapshot.docs.map(doc => doc.id); // doc.id is the date string
    return countUniqueDatesInWindow(dates, days);
  } catch (error) {
    console.error('Error getting games played:', error);
    return 0;
  }
}

/**
 * Checks and awards milestones
 */
async function checkAndAwardMilestones(
  firestore: Firestore,
  userId: string,
  milestoneType: 'login_streak' | 'games_played' | 'points_earned' | 'custom',
  currentValue: number
): Promise<string[]> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    // Get active milestones of this type
    const milestonesCollection = collection(firestore, 'reward-milestones');
    const q = query(
      milestonesCollection,
      where('type', '==', milestoneType),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const milestones = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as (RewardMilestoneConfig & { id: string })[];

    const achieved: string[] = [];

    for (const milestone of milestones) {
      // Check if milestone is already achieved
      const progressRef = doc(firestore, `users/${userId}/milestone-progress/${milestone.id}`);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists() && progressDoc.data()?.achieved) {
        continue; // Already achieved
      }

      // Check if requirement is met
      let requirementMet = false;
      
      if (milestone.type === 'login_streak' && milestone.requirement.days) {
        requirementMet = currentValue >= milestone.requirement.days;
      } else if (milestone.type === 'games_played' && milestone.requirement.games && milestone.requirement.daysWindow) {
        requirementMet = currentValue >= milestone.requirement.games;
      }

      if (requirementMet) {
        // Award reward
        if (milestone.reward.voucherId) {
          // Award voucher (no point deduction for milestone rewards)
          try {
            await awardVoucher(firestore, userId, milestone.reward.voucherId, `Milestone: ${milestone.name}`);
            achieved.push(milestone.name);
          } catch (error: any) {
            console.error(`Failed to award voucher for milestone ${milestone.name}:`, error);
            // If voucher award fails, try awarding points instead
            if (milestone.reward.points) {
              await updateUserPoints(
                firestore,
                userId,
                milestone.reward.points,
                `Milestone reward: ${milestone.name}`,
                { type: 'milestone_reward', milestoneId: milestone.id }
              );
              achieved.push(milestone.name);
            }
          }
        } else if (milestone.reward.points) {
          // Award points
          await updateUserPoints(
            firestore,
            userId,
            milestone.reward.points,
            `Milestone reward: ${milestone.name}`,
            { type: 'milestone_reward', milestoneId: milestone.id }
          );
          achieved.push(milestone.name);
        }

        // Mark milestone as achieved
        const requiredProgress = milestone.type === 'login_streak' 
          ? (milestone.requirement.days || 0)
          : milestone.type === 'games_played'
            ? (milestone.requirement.games || 0)
            : (milestone.requirement.points || 0);
        
        const progressData: any = {
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          currentProgress: currentValue,
          requiredProgress,
          achieved: true,
          achievedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        };
        
        await setDoc(progressRef, progressData);
      } else {
        // Update progress
        const requiredProgress = milestone.type === 'login_streak' 
          ? (milestone.requirement.days || 0)
          : milestone.type === 'games_played'
            ? (milestone.requirement.games || 0)
            : (milestone.requirement.points || 0);
        
        const progressData: any = {
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          currentProgress: currentValue,
          requiredProgress,
          achieved: false,
          lastUpdated: serverTimestamp(),
        };
        
        await setDoc(progressRef, progressData, { merge: true });
      }
    }

    return achieved;
  } catch (error) {
    console.error('Error checking milestones:', error);
    return [];
  }
}

/**
 * Gets user's milestone progress
 */
export async function getUserMilestoneProgress(
  firestore: Firestore,
  userId: string
): Promise<UserMilestoneProgress[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const progressCollection = collection(firestore, `users/${userId}/milestone-progress`);
    const snapshot = await getDocs(progressCollection);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
    })) as UserMilestoneProgress[];
  } catch (error) {
    console.error('Error getting milestone progress:', error);
    return [];
  }
}

