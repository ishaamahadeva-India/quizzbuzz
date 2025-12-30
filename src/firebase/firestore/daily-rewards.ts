'use client';

// DEPRECATED: This file is kept for backward compatibility
// New code should use reward-milestones.ts instead

// Re-export from reward-milestones for backward compatibility
export { recordDailyLogin, recordGamePlay, getUserMilestoneProgress } from './reward-milestones';

// Legacy functions - kept for compatibility but will be removed
export async function checkAndAwardDailyLogin(
  firestore: any,
  userId: string,
  points: number = 0
): Promise<{ awarded: boolean; streak: number; message: string }> {
  // This function is deprecated - use recordDailyLogin instead
  const { recordDailyLogin } = await import('./reward-milestones');
  const result = await recordDailyLogin(firestore, userId);
  return {
    awarded: result.milestonesAchieved.length > 0,
    streak: result.streak,
    message: result.milestonesAchieved.length > 0 
      ? `Milestones achieved: ${result.milestonesAchieved.join(', ')}`
      : `Current streak: ${result.streak} days`,
  };
}

export async function checkAndAwardDailyGame(
  firestore: any,
  userId: string,
  points: number = 0
): Promise<{ awarded: boolean; message: string }> {
  // This function is deprecated - use recordGamePlay instead
  const { recordGamePlay } = await import('./reward-milestones');
  const result = await recordGamePlay(firestore, userId, 'other');
  return {
    awarded: result.milestonesAchieved.length > 0,
    message: result.milestonesAchieved.length > 0
      ? `Milestones achieved: ${result.milestonesAchieved.join(', ')}`
      : 'Game play recorded',
  };
}

