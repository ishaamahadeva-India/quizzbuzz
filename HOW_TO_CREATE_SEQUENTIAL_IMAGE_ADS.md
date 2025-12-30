# How to Create 20-Second Non-Skippable Sequential Image Ads (3 Ads)

## Overview

Your system automatically displays **3 image ads sequentially** for a total of **20 seconds**:
- **Ad 1**: 9 seconds
- **Ad 2**: 6 seconds  
- **Ad 3**: 5 seconds
- **Total**: 20 seconds (non-skippable)

The system automatically selects 3 ads and displays them one after another. You need to create **at least 3 separate image ads** in the admin panel.

---

## Step-by-Step Guide

### Step 1: Access Admin Panel

1. Go to: `/admin/image-ads` (or navigate via admin menu)
2. Make sure you're logged in as an admin user
3. Click **"Create New Image Ad"** button

### Step 2: Create First Ad (Ad 1 - Will show for 9 seconds)

Fill out the form with these settings:

#### Required Fields:
- **Sponsor**: Select a sponsor (or create one first)
- **Title**: `Ad 1 - [Your Sponsor Name]` (e.g., "Ad 1 - Coca Cola")
- **Ad Image**: Upload your first ad image
  - Recommended size: 1200x800px or similar aspect ratio
  - Format: JPG, PNG, or WebP
  - File size: Under 2MB for fast loading

#### Display Settings:
- **Display Duration**: `9` seconds
  - ⚠️ **Note**: This will be overridden to 9s automatically, but set it anyway for consistency
- **Priority**: `100` (highest priority - shown first)
- **Status**: `Active`

#### Repeat Behavior (Important for Sequential Ads):
- ✅ **Allow Multiple Views**: `ON` (Enable this!)
- **Repeat Interval**: `Always` (or `Daily` if you want once per day)
- **Min Time Between Views**: Leave empty (or set to `0`)

#### Targeting:
- **Target Tournaments**: 
  - Leave **empty** to show for all tournaments
  - OR enter specific tournament IDs: `tournament-id-1, tournament-id-2`
- **Target Campaigns**: 
  - Leave **empty** to show for all campaigns
  - OR enter specific campaign IDs: `campaign-id-1, campaign-id-2`

#### Dates:
- **Start Date**: Today's date (or when you want ads to start)
- **End Date**: 30+ days from now (or your campaign end date)

#### Optional Settings:
- **Click-Through URL**: Your sponsor's website (optional)
- **Description**: Brief description of the ad
- **Max Views**: Leave empty for unlimited
- **Max Views Per User**: Leave empty (or set to `3` if you want each user to see max 3 times)

#### Click "Create Ad"

---

### Step 3: Create Second Ad (Ad 2 - Will show for 6 seconds)

Repeat Step 2 with these changes:

#### Required Fields:
- **Title**: `Ad 2 - [Your Sponsor Name]` (e.g., "Ad 2 - Coca Cola")
- **Ad Image**: Upload your **second** ad image (different from Ad 1)

#### Display Settings:
- **Display Duration**: `6` seconds
- **Priority**: `90` (slightly lower than Ad 1)
- **Status**: `Active`

#### Repeat Behavior:
- ✅ **Allow Multiple Views**: `ON`
- **Repeat Interval**: `Always` (or `Daily`)
- **Min Time Between Views**: Leave empty

#### Targeting:
- Use **same targeting** as Ad 1 (same tournaments/campaigns)

#### Click "Create Ad"

---

### Step 4: Create Third Ad (Ad 3 - Will show for 5 seconds)

Repeat Step 2 with these changes:

#### Required Fields:
- **Title**: `Ad 3 - [Your Sponsor Name]` (e.g., "Ad 3 - Coca Cola")
- **Ad Image**: Upload your **third** ad image (different from Ad 1 & 2)

#### Display Settings:
- **Display Duration**: `5` seconds
- **Priority**: `80` (lower than Ad 1 & 2)
- **Status**: `Active`

#### Repeat Behavior:
- ✅ **Allow Multiple Views**: `ON`
- **Repeat Interval**: `Always` (or `Daily`)
- **Min Time Between Views**: Leave empty

#### Targeting:
- Use **same targeting** as Ad 1 & 2 (same tournaments/campaigns)

#### Click "Create Ad"

---

## Important Settings Summary

### ✅ Critical Settings for Sequential Ads:

1. **Allow Multiple Views**: Must be `ON` for all 3 ads
   - This allows the same ad to be shown multiple times in sequence

2. **Repeat Interval**: Set to `Always` or `Daily`
   - `Never` will prevent ads from showing in sequence
   - `Always` = Show every time user visits
   - `Daily` = Show once per day per user

3. **Priority**: Set different priorities (100, 90, 80)
   - Higher priority ads are selected first
   - Ensures your 3 ads are selected together

4. **Status**: Must be `Active`
   - Inactive ads won't be selected

5. **Targeting**: Use same targeting for all 3 ads
   - If Ad 1 targets Tournament A, Ad 2 & 3 should also target Tournament A
   - OR leave empty to show for all tournaments/campaigns

---

## How It Works

### Automatic Selection:
1. When user visits a tournament/campaign page, system selects **3 ads** from available pool
2. Ads are selected based on:
   - Priority (highest first)
   - Targeting (matches tournament/campaign)
   - Repeat settings (allows multiple views)
   - User view limits (if set)

### Sequential Display:
1. **Ad 1** displays for **9 seconds** (non-skippable timer)
2. User clicks **"Next Ad"** button
3. **Ad 2** displays for **6 seconds** (non-skippable timer)
4. User clicks **"Next Ad"** button
5. **Ad 3** displays for **5 seconds** (non-skippable timer)
6. User clicks **"Continue"** button
7. User proceeds to join/enter

### Total Viewing Time: 20 seconds

---

## Best Practices

### 1. Create Ads for Same Sponsor Together
- If all 3 ads are for the same sponsor, create them with same `sponsorId`
- Use consistent naming: "Ad 1 - Sponsor", "Ad 2 - Sponsor", "Ad 3 - Sponsor"

### 2. Use Different Images
- Each ad should have a **different image**
- Can be different products, offers, or variations
- Or same brand with different messages

### 3. Set Appropriate Priorities
- **Ad 1**: Priority `100` (highest)
- **Ad 2**: Priority `90` (medium-high)
- **Ad 3**: Priority `80` (medium)
- This ensures they're selected together

### 4. Test Your Ads
- After creating all 3 ads, visit a tournament/campaign page
- Check browser console for `[ImageAdGate]` logs
- Verify all 3 ads show sequentially

### 5. Monitor Performance
- Check `currentViews` count in admin panel
- Each ad view is tracked separately
- Use analytics to see which ads perform best

---

## Troubleshooting

### Problem: Only 1 or 2 ads showing instead of 3

**Solutions:**
1. Check if you have **at least 3 active ads** in database
2. Verify all 3 ads have **Allow Multiple Views = ON**
3. Check **Repeat Interval** is not set to `Never`
4. Ensure all 3 ads have **same targeting** (same tournaments/campaigns)
5. Check browser console for `[ImageAdGate]` logs

### Problem: Ads not showing at all

**Solutions:**
1. Verify ads are **Active** (not Inactive/Expired)
2. Check **Start Date** is today or earlier
3. Check **End Date** is in the future
4. Verify **targeting** matches the tournament/campaign
5. Check user is **logged in**
6. Check browser console for errors

### Problem: Ads showing but user can skip

**Solutions:**
1. This is **normal behavior** - ads are non-skippable during timer countdown
2. After timer reaches 0, "Continue" button appears (this is intentional)
3. User must wait for timer to complete before proceeding

### Problem: Same ad showing 3 times

**Solutions:**
1. Create **3 different ads** with different images
2. Use different **titles** for each ad
3. System will select different ads if available
4. If only 1 ad exists, it may repeat (if `Allow Multiple Views = ON`)

---

## Example Configuration

### Ad 1 (9 seconds):
```
Title: "Ad 1 - Coca Cola Summer Campaign"
Image: coca-cola-ad-1.jpg
Display Duration: 9
Priority: 100
Allow Multiple Views: ON
Repeat Interval: Always
Status: Active
Target Tournaments: (empty - all tournaments)
```

### Ad 2 (6 seconds):
```
Title: "Ad 2 - Coca Cola Summer Campaign"
Image: coca-cola-ad-2.jpg
Display Duration: 6
Priority: 90
Allow Multiple Views: ON
Repeat Interval: Always
Status: Active
Target Tournaments: (empty - all tournaments)
```

### Ad 3 (5 seconds):
```
Title: "Ad 3 - Coca Cola Summer Campaign"
Image: coca-cola-ad-3.jpg
Display Duration: 5
Priority: 80
Allow Multiple Views: ON
Repeat Interval: Always
Status: Active
Target Tournaments: (empty - all tournaments)
```

---

## Quick Checklist

Before creating ads, ensure:
- [ ] You have admin access
- [ ] At least 1 sponsor exists (or create one)
- [ ] You have 3 different ad images ready
- [ ] You know which tournaments/campaigns to target (or leave empty for all)

When creating each ad:
- [ ] Set **Allow Multiple Views = ON**
- [ ] Set **Repeat Interval = Always** (or Daily)
- [ ] Set **Status = Active**
- [ ] Set **Priority** (100, 90, 80)
- [ ] Set **Display Duration** (9, 6, 5) - for reference
- [ ] Use **same targeting** for all 3 ads
- [ ] Upload **different images** for each ad

After creating all 3 ads:
- [ ] Test by visiting a tournament/campaign page
- [ ] Check browser console for logs
- [ ] Verify all 3 ads show sequentially
- [ ] Confirm total viewing time is 20 seconds

---

## Technical Notes

- **Display Duration Override**: The system automatically overrides `displayDuration` to 9s, 6s, 5s for sequential ads. Setting it in the form is for reference only.

- **Ad Selection**: System selects ads based on priority, then filters by targeting and repeat settings.

- **Non-Skippable**: Timer counts down from duration to 0. User cannot proceed until timer completes.

- **Tracking**: Each ad view is tracked separately in Firestore with its own `viewId`.

- **Fallback**: If fewer than 3 ads are available, system will show 1 or 2 ads (still sequential).

---

## Need Help?

If ads aren't working:
1. Check browser console for `[ImageAdGate]` logs
2. Verify all settings match this guide
3. Ensure at least 3 active ads exist
4. Test with a fresh user account (or clear localStorage)

For more details, see:
- `IMAGE_AD_DISPLAY_LOGIC.md` - Complete ad display logic
- `SEQUENTIAL_ADS_EXPLANATION.md` - Technical implementation details

