'use client';

import {
  collection,
  query,
  where,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import type { CampaignEntry } from '@/lib/types';

/**
 * Aggregation results for campaign entries
 * All contests are FREE - no revenue tracking
 */
export type CampaignEntryAggregation = {
  totalEntries: number;
  uniqueParticipants: number;
  // REMOVED: All revenue/payment fields (totalRevenue, paidEntries, etc.)
  // All contests are free - no payment collection
  entriesByCity: Record<string, number>; // city -> count
  entriesByState: Record<string, number>; // state -> count
  monthlyParticipants: Array<{
    month: string;
    participants: number;
    entries: number;
  }>;
};

/**
 * Gets aggregation statistics for campaign entries
 */
export async function getCampaignEntryStats(
  firestore: Firestore,
  campaignId?: string
): Promise<CampaignEntryAggregation> {
  const entriesRef = collection(firestore, 'campaign-entries');
  const q = campaignId
    ? query(entriesRef, where('campaignId', '==', campaignId))
    : entriesRef;
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CampaignEntry[];

  return aggregateCampaignEntries(entries);
}

/**
 * Gets entry stats for multiple campaigns
 */
export async function getMultipleCampaignEntryStats(
  firestore: Firestore,
  campaignIds: string[]
): Promise<Record<string, CampaignEntryAggregation>> {
  const stats: Record<string, CampaignEntryAggregation> = {};

  await Promise.all(
    campaignIds.map(async (campaignId) => {
      try {
        stats[campaignId] = await getCampaignEntryStats(
          firestore,
          campaignId
        );
      } catch (error) {
        console.error(`Error fetching entry stats for campaign ${campaignId}:`, error);
        stats[campaignId] = getEmptyEntryAggregation();
      }
    })
  );

  return stats;
}

/**
 * Gets overall platform entry statistics
 */
export async function getOverallEntryStats(
  firestore: Firestore
): Promise<CampaignEntryAggregation> {
  return getCampaignEntryStats(firestore);
}

/**
 * Aggregates campaign entry data
 */
function aggregateCampaignEntries(
  entries: CampaignEntry[]
): CampaignEntryAggregation {
  if (entries.length === 0) {
    return getEmptyEntryAggregation();
  }

  const totalEntries = entries.length;
  const uniqueParticipants = new Set(entries.map((e) => e.userId)).size;

  // REMOVED: All payment status and revenue calculations
  // All contests are free - no payment collection

  // Entries by city
  const entriesByCity: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.city) {
      entriesByCity[e.city] = (entriesByCity[e.city] || 0) + 1;
    }
  });

  // Entries by state
  const entriesByState: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.state) {
      entriesByState[e.state] = (entriesByState[e.state] || 0) + 1;
    }
  });

  // Monthly participants (no revenue tracking)
  const monthlyData: Record<
    string,
    { participants: Set<string>; entries: number }
  > = {};
  entries.forEach((e) => {
    const date =
      e.joinedAt instanceof Date
        ? e.joinedAt
        : (e.joinedAt as any)?.toDate
        ? (e.joinedAt as any).toDate()
        : new Date();
    const monthKey = date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { participants: new Set(), entries: 0 };
    }
    monthlyData[monthKey].participants.add(e.userId);
    monthlyData[monthKey].entries += 1;
  });

  const monthlyParticipants = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      participants: data.participants.size,
      entries: data.entries,
    }))
    .sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  return {
    totalEntries,
    uniqueParticipants,
    // REMOVED: All revenue/payment fields
    entriesByCity,
    entriesByState,
    monthlyParticipants,
  };
}

/**
 * Returns empty aggregation structure
 */
function getEmptyEntryAggregation(): CampaignEntryAggregation {
  return {
    totalEntries: 0,
    uniqueParticipants: 0,
    // REMOVED: All revenue/payment fields
    entriesByCity: {},
    entriesByState: {},
    monthlyParticipants: [],
  };
}

