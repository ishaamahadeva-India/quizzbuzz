# Data Migration Instructions: FREE + NON-CASH Model

## ⚠️ IMPORTANT: Backup First!

**Before running the migration script, create a backup of your Firestore database!**

## Prerequisites

1. **Firebase Admin SDK Setup**
   - Ensure you have Firebase Admin SDK credentials
   - Set up service account key (see `FIREBASE_SERVICE_ACCOUNT_SETUP.md`)

2. **Install Dependencies**
   ```bash
   npm install firebase-admin tsx
   ```

## Running the Migration

### Option 1: Using Environment Variable (Recommended for CI/CD)

```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
npx tsx scripts/migrate-to-free-model.ts
```

### Option 2: Using Service Account Key File

1. Place your service account key JSON file in the project root as `service-account-key.json`
2. Or set the path:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json
   npx tsx scripts/migrate-to-free-model.ts
   ```

## What the Migration Does

### Campaigns (`fantasy-campaigns` collection)
- ✅ Sets `isFreeContest: true` on all campaigns
- ✅ Sets `fundedBy: 'sponsor'` on all campaigns
- ✅ Sets `nonCashOnly: true` on all campaigns
- ✅ Updates `entryFee` to `{ type: 'free' }` if present
- ✅ Removes all `cash` prizes from `prizeDistribution.tiers`
- ✅ Removes all `cash` rewards from `rewards` array

### Campaign Entries (`campaign-entries` collection)
- ✅ Sets `isFreeContest: true` on all entries
- ✅ Sets `fundedBy: 'sponsor'` on all entries
- ✅ Removes `entryFee` field
- ✅ Removes `entryFeeTier` field
- ✅ Removes `paymentStatus` field
- ✅ Removes `paymentMethod` field

## Verification

After migration, verify:

1. **Check Campaigns**
   ```javascript
   // In Firebase Console or using Admin SDK
   const campaigns = await db.collection('fantasy-campaigns').get();
   campaigns.forEach(doc => {
     const data = doc.data();
     console.assert(data.isFreeContest === true);
     console.assert(data.fundedBy === 'sponsor');
     console.assert(data.nonCashOnly === true);
   });
   ```

2. **Check Entries**
   ```javascript
   const entries = await db.collection('campaign-entries').get();
   entries.forEach(doc => {
     const data = doc.data();
     console.assert(data.isFreeContest === true);
     console.assert(data.fundedBy === 'sponsor');
     console.assert(data.entryFee === undefined);
     console.assert(data.paymentStatus === undefined);
   });
   ```

3. **Check Prize Distributions**
   ```javascript
   const campaigns = await db.collection('fantasy-campaigns').get();
   campaigns.forEach(doc => {
     const data = doc.data();
     if (data.prizeDistribution?.tiers) {
       data.prizeDistribution.tiers.forEach((tier: any) => {
         console.assert(tier.prizeType !== 'cash', 'Cash prize found!');
       });
     }
   });
   ```

## Rollback

If you need to rollback:

1. Restore from your Firestore backup
2. Or manually revert the changes using Firebase Console

## Troubleshooting

### Error: "Firebase service account key not found"
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is set
- Or place `service-account-key.json` in project root
- Or set `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` environment variable

### Error: "Permission denied"
- Ensure your service account has Firestore Admin permissions
- Check Firebase project permissions

### Error: "Collection not found"
- This is normal if you don't have campaigns/entries yet
- The script will skip empty collections

## Post-Migration Checklist

- [ ] All campaigns have `isFreeContest: true`
- [ ] All campaigns have `fundedBy: 'sponsor'`
- [ ] All campaigns have `nonCashOnly: true`
- [ ] No `cash` prizes in prize distributions
- [ ] No `entryFee` fields in campaign entries
- [ ] No `paymentStatus` fields in campaign entries
- [ ] Application builds successfully
- [ ] Admin forms work correctly
- [ ] User-facing pages display correctly

