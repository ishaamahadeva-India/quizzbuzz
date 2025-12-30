/**
 * Data Migration Script: Migrate to FREE + NON-CASH Model
 * 
 * This script updates all existing campaigns and entries to comply with the FREE + NON-CASH model:
 * - Sets all campaigns to isFreeContest: true
 * - Sets all campaigns to fundedBy: 'sponsor'
 * - Sets all campaigns to nonCashOnly: true
 * - Removes entryFee fields from campaign entries
 * - Removes cash prizes from prize distributions
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-free-model.ts
 * 
 * IMPORTANT: Backup your Firestore database before running this script!
 */

import { initializeApp, cert, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json';

let serviceAccount;
if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // Handle single-line JSON from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  console.error('❌ Firebase service account key not found!');
  console.error('Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH or FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = getFirestore();

interface MigrationStats {
  campaignsUpdated: number;
  entriesUpdated: number;
  cashPrizesRemoved: number;
  errors: string[];
}

const stats: MigrationStats = {
  campaignsUpdated: 0,
  entriesUpdated: 0,
  cashPrizesRemoved: 0,
  errors: [],
};

/**
 * Migrate a single campaign
 */
async function migrateCampaign(campaignId: string, campaignData: any): Promise<void> {
  try {
    const updates: any = {
      isFreeContest: true,
      fundedBy: 'sponsor',
      nonCashOnly: true,
    };

    // Remove entryFee or set it to free
    if (campaignData.entryFee) {
      updates.entryFee = { type: 'free' };
    }

    // Remove cash prizes from prize distribution
    if (campaignData.prizeDistribution?.tiers) {
      const originalTiers = campaignData.prizeDistribution.tiers;
      const updatedTiers = originalTiers.filter((tier: any) => {
        if (tier.prizeType === 'cash') {
          stats.cashPrizesRemoved++;
          return false; // Remove cash prizes
        }
        return true;
      });

      if (updatedTiers.length !== originalTiers.length) {
        updates.prizeDistribution = {
          ...campaignData.prizeDistribution,
          tiers: updatedTiers,
        };
      }
    }

    // Remove cash from rewards
    if (campaignData.rewards) {
      const updatedRewards = campaignData.rewards.filter((reward: any) => {
        if (reward.type === 'cash') {
          stats.cashPrizesRemoved++;
          return false;
        }
        return true;
      });

      if (updatedRewards.length !== campaignData.rewards.length) {
        updates.rewards = updatedRewards;
      }
    }

    await db.collection('fantasy-campaigns').doc(campaignId).update(updates);
    stats.campaignsUpdated++;
    console.log(`✓ Updated campaign: ${campaignId}`);
  } catch (error: any) {
    const errorMsg = `Error migrating campaign ${campaignId}: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
}

/**
 * Migrate campaign entries
 */
async function migrateCampaignEntry(entryId: string, entryData: any): Promise<void> {
  try {
    const updates: any = {
      isFreeContest: true,
      fundedBy: 'sponsor',
    };

    // Remove payment-related fields
    const fieldsToRemove = ['entryFee', 'entryFeeTier', 'paymentStatus', 'paymentMethod'];
    fieldsToRemove.forEach(field => {
      if (entryData[field] !== undefined) {
        updates[field] = admin.firestore.FieldValue.delete();
      }
    });

    await db.collection('campaign-entries').doc(entryId).update(updates);
    stats.entriesUpdated++;
  } catch (error: any) {
    const errorMsg = `Error migrating entry ${entryId}: ${error.message}`;
    stats.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting migration to FREE + NON-CASH model...\n');

  try {
    // Migrate campaigns
    console.log('📋 Migrating campaigns...');
    const campaignsSnapshot = await db.collection('fantasy-campaigns').get();
    
    for (const doc of campaignsSnapshot.docs) {
      await migrateCampaign(doc.id, doc.data());
    }

    // Migrate campaign entries
    console.log('\n📋 Migrating campaign entries...');
    const entriesSnapshot = await db.collection('campaign-entries').get();
    
    for (const doc of entriesSnapshot.docs) {
      await migrateCampaignEntry(doc.id, doc.data());
    }

    // Print summary
    console.log('\n✅ Migration completed!');
    console.log('\n📊 Summary:');
    console.log(`   Campaigns updated: ${stats.campaignsUpdated}`);
    console.log(`   Entries updated: ${stats.entriesUpdated}`);
    console.log(`   Cash prizes removed: ${stats.cashPrizesRemoved}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

