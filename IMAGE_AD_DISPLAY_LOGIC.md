# Image Ad Display Logic - Complete Explanation

## Current Implementation Overview

### Where Ads Are Shown

1. **Tournament Page** (`/fantasy/cricket/tournament/[id]`)
   - **Trigger**: Only when user clicks "Join Tournament" button
   - **NOT shown**: When just visiting/loading the page
   - **Issue**: Users might not see ads if they don't click join

2. **Campaign Page** (`/fantasy/campaign/[id]`)
   - **Trigger**: Automatically on page load (useEffect)
   - **Shown**: When user first visits campaign page
   - **Status**: ✅ Working correctly

3. **Match Page** (`/fantasy/cricket/match/[id]`)
   - **Trigger**: Automatically on page load (useEffect)
   - **Shown**: Only on mobile devices (width < 768px)
   - **Issue**: Desktop users don't see ads

4. **Cricket Fantasy Landing** (`/fantasy/cricket`)
   - **Trigger**: None
   - **Status**: ❌ No ads on listing page

## ImageAdGate Component Flow

### Initialization (useEffect)

```
1. Check if already viewed → Skip if hasViewed = true
2. Check required params:
   - tournamentId OR campaignId must exist
   - firestore must be available
   - user?.uid must exist
   → If missing, setIsLoading(false) and return (no ad shown)

3. Prevent duplicate runs:
   - Check hasRunRef.current === targetId
   - If already run, skip

4. Select multiple ads (3 ads):
   - selectMultipleAdsForEntry() OR selectMultipleAdsForCampaign()
   - Returns up to 3 ads

5. Filter ads based on:
   - User view limits (maxViewsPerUser)
   - Repeat settings (repeatInterval, allowMultipleViews)
   - Session-based checks (localStorage)
   - Already viewed checks (Firestore)

6. If no eligible ads:
   - setHasViewed(true)
   - setIsLoading(false)
   - Call onComplete() → User proceeds without seeing ads

7. If eligible ads found:
   - setAds(eligibleAds)
   - setCurrentAdIndex(0)
   - setIsLoading(false)
   - Component renders ImageAdDisplay
```

### Sequential Ad Display

```
Ad 1 (9 seconds):
  - Shows first ad from ads array
  - Timer counts down: 9 → 8 → 7 → ... → 0
  - User cannot skip (required = true)
  - After timer: "Next Ad" button appears
  - User clicks "Next Ad"
  → handleAdComplete() called
  → Track ad view in Firestore
  → setCurrentAdIndex(1)

Ad 2 (6 seconds):
  - Shows second ad from ads array
  - Timer counts down: 6 → 5 → 4 → ... → 0
  - User cannot skip
  - After timer: "Next Ad" button appears
  - User clicks "Next Ad"
  → handleAdComplete() called
  → Track ad view in Firestore
  → setCurrentAdIndex(2)

Ad 3 (5 seconds):
  - Shows third ad from ads array
  - Timer counts down: 5 → 4 → 3 → ... → 0
  - User cannot skip
  - After timer: "Continue" button appears
  - User clicks "Continue"
  → handleAdComplete() called
  → Track ad view in Firestore
  → setHasViewed(true)
  → Call onComplete() callback
  → User proceeds to join/enter
```

## Issues Identified

### Issue 1: Ads Not Showing on Tournament Page Visit
**Problem**: Ads only show when clicking "Join Tournament", not on page load
**Location**: `src/app/fantasy/cricket/tournament/[id]/page.tsx` line 144
**Fix**: Add useEffect to show ads on page load (similar to campaign page)

### Issue 2: Ads Filtered Out Too Aggressively
**Problem**: Sequential ad logic filters ads based on view limits, which might filter out all ads
**Location**: `src/components/ads/image-ad-gate.tsx` lines 94-148
**Fix**: If all ads filtered out, still show ads if user hasn't viewed ANY ad for this tournament/campaign

### Issue 3: hasRunRef Not Resetting
**Problem**: Once hasRunRef is set, it prevents ads from showing on subsequent visits
**Location**: `src/components/ads/image-ad-gate.tsx` line 62
**Fix**: Reset hasRunRef when component unmounts or when targetId changes

### Issue 4: No Ads on Landing Page
**Problem**: `/fantasy/cricket` page has no ads
**Location**: `src/app/fantasy/cricket/page.tsx`
**Fix**: Add ImageAdGate on page load (optional, but good for engagement)

### Issue 5: Desktop Users Don't See Match Ads
**Problem**: Match page ads only show on mobile
**Location**: `src/app/fantasy/cricket/match/[id]/page.tsx` line 808
**Fix**: Show ads on all devices, not just mobile

## Required Conditions for Ads to Show

1. ✅ `tournamentId` OR `campaignId` must be provided
2. ✅ `firestore` must be initialized
3. ✅ `user?.uid` must exist (user must be logged in)
4. ✅ At least 1 active ad in database
5. ✅ Ad must be within date range (startDate <= now <= endDate)
6. ✅ Ad status must be 'active'
7. ✅ Ad must target the tournament/campaign (or target all)
8. ✅ Ad must not exceed maxViews limit
9. ✅ User must not have exceeded maxViewsPerUser (if set)
10. ✅ Repeat settings must allow showing (if repeatInterval !== 'never' or allowMultipleViews === true)

## Debugging Checklist

If ads are not showing, check:

- [ ] User is logged in (`user?.uid` exists)
- [ ] Firestore is initialized (`firestore` exists)
- [ ] `tournamentId` or `campaignId` is provided to ImageAdGate
- [ ] `showAdGate` state is `true` (check parent component)
- [ ] At least 1 ad exists in `image-advertisements` collection
- [ ] Ad status is 'active'
- [ ] Ad dates are valid (startDate <= now <= endDate)
- [ ] Ad targets the tournament/campaign (or targets all)
- [ ] Ad hasn't exceeded maxViews
- [ ] User hasn't exceeded maxViewsPerUser
- [ ] Repeat settings allow showing
- [ ] Browser console for errors
- [ ] Network tab for Firestore queries

## Recommended Fixes

1. ✅ **Show ads on tournament page load** (not just on join click) - **COMPLETED**
   - Added useEffect to show ads automatically on page load with 500ms delay
   - Location: `src/app/fantasy/cricket/tournament/[id]/page.tsx`

2. ✅ **Relax filtering logic** - if no ads pass filters, show ads anyway (with warning) - **COMPLETED**
   - If ads are filtered out but exist, show them anyway for better UX
   - Added console warnings when ads are filtered
   - Location: `src/components/ads/image-ad-gate.tsx`

3. ✅ **Reset hasRunRef** properly on unmount - **COMPLETED**
   - Resets when targetId changes, allowing ads on different pages
   - Location: `src/components/ads/image-ad-gate.tsx`

4. ⚠️ **Add ads to landing page** (optional) - **NOT IMPLEMENTED**
   - Considered too aggressive - ads already show on individual tournament/campaign pages
   - Can be added later if needed for revenue optimization

5. ✅ **Show match ads on all devices** (not just mobile) - **COMPLETED**
   - Removed mobile-only check (width < 768px)
   - Ads now show on desktop, tablet, and mobile
   - Location: `src/app/fantasy/cricket/match/[id]/page.tsx`

6. ✅ **Add better error logging** to debug why ads aren't showing - **COMPLETED**
   - Added comprehensive console logging with context:
     - When no ads available (with reason)
     - When ads are filtered out (with filtering reasons)
     - When ads load successfully (with ad IDs)
     - When errors occur (with full error details and context)
   - All logs prefixed with `[ImageAdGate]` for easy filtering
   - Location: `src/components/ads/image-ad-gate.tsx`

