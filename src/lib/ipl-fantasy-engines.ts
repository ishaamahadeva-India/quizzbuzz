/**
 * IPL Fantasy Engine — Points, multiplier, and selection % logic
 */

import type { PlayerMatchStats } from '@/lib/types';

// ---------- Multiplier (underrated) ----------

/**
 * Multiplier from selection percentage:
 * &lt; 5% → 3x, &lt; 10% → 2x, &lt; 20% → 1.5x, else 1x
 */
export function getMultiplierFromSelectionPercentage(selectionPercentage: number): number {
  if (selectionPercentage < 5) return 3;
  if (selectionPercentage < 10) return 2;
  if (selectionPercentage < 20) return 1.5;
  return 1;
}

// ---------- Batsman base points ----------

/**
 * Base points for a batsman from match stats (before multiplier).
 * Spec:
 * - runs * 1, fours * 2, sixes * 3
 * - 30+ runs: +5, 50+: +10, 100+: +25
 * - strike rate > 150: +10
 * - strike rate < 100: -5
 * - 0 runs: -10
 */
export function calculateBatsmanBasePoints(stats: PlayerMatchStats): number {
  let points = 0;
  points += stats.runs * 1;
  points += stats.fours * 2;
  points += stats.sixes * 3;

  if (stats.runs >= 30) points += 5;
  if (stats.runs >= 50) points += 10;
  if (stats.runs >= 100) points += 25;

  if (stats.strikeRate > 150) points += 10;
  if (stats.strikeRate > 0 && stats.strikeRate < 100) points -= 5;

  if (stats.runs === 0) points -= 10;

  return points;
}

/**
 * finalPoints = basePoints * multiplier (then penalty applied separately in history).
 */
export function calculateFinalPoints(basePoints: number, multiplier: number): number {
  return Math.round(basePoints * multiplier * 100) / 100;
}

// ---------- Bowler base points ----------

/**
 * Bowler points:
 * - wickets * 20
 * - +10 if wickets >= 3, +20 if wickets >= 5
 * - +10 if economy < 6, -10 if economy > 10
 */
export function calculateBowlerBasePoints(stats: PlayerMatchStats): number {
  let points = 0;
  points += stats.wickets * 20;
  if (stats.wickets >= 3) points += 10;
  if (stats.wickets >= 5) points += 20;
  const economy = stats.economy ?? 0;
  if (economy > 0 && economy < 6) points += 10;
  if (economy > 10) points -= 10;
  return points;
}

// ---------- All-rounder ----------

/**
 * All-rounder = batting points + bowling points.
 * +15 bonus if runs >= 30 AND wickets >= 2.
 */
export function calculateAllRounderBasePoints(stats: PlayerMatchStats): number {
  const batting = calculateBatsmanBasePoints(stats);
  const bowling = calculateBowlerBasePoints(stats);
  let bonus = 0;
  if (stats.runs >= 30 && stats.wickets >= 2) bonus = 15;
  return batting + bowling + bonus;
}

// ---------- Captain ----------

/**
 * Captain bonus points (added on top of player's normal points when they are captain):
 * +20 if team wins, +10 if player performs (runs > 30 OR wickets >= 2).
 */
export function calculateCaptainBonusPoints(
  stats: PlayerMatchStats,
  playerTeamId: string,
  winnerTeamId: string | undefined
): number {
  let points = 0;
  if (winnerTeamId && playerTeamId === winnerTeamId) points += 20;
  if (stats.runs > 30 || stats.wickets >= 2) points += 10;
  return points;
}

// ---------- Emerging player ----------

/**
 * If player is in Emerging slot and isEmerging: totalPoints * 1.5
 */
export function applyEmergingMultiplier(points: number, isEmerging: boolean): number {
  if (!isEmerging) return points;
  return Math.round(points * 1.5 * 100) / 100;
}

// ---------- Selection percentage ----------

/**
 * selectionPercentage = (totalSelections / totalUsersInMatch) * 100
 * Used when displaying and when computing multiplier at match completion.
 */
export function computeSelectionPercentage(totalSelections: number, totalUsersInMatch: number): number {
  if (totalUsersInMatch <= 0) return 0;
  return Math.round((totalSelections / totalUsersInMatch) * 10000) / 100;
}
