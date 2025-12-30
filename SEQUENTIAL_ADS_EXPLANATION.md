# Sequential Image Ads - Technical Explanation

## Current Implementation
- **Single Ad Display**: `ImageAdGate` component shows ONE ad at a time
- **Duration**: Each ad has `displayDuration` property (default: 5 seconds)
- **Non-Skippable**: Timer counts down, user must wait until timer reaches 0

## Sequential Ads Concept (9s + 6s + 5s = 20s)

### Option 1: Multiple Ad Selection (Recommended)
**How it works:**
1. When user clicks "Join Tournament/Campaign", `ImageAdGate` selects **3 ads** from the pool
2. Display them sequentially:
   - **Ad 1**: 9 seconds (non-skippable)
   - **Ad 2**: 6 seconds (non-skippable) 
   - **Ad 3**: 5 seconds (non-skippable)
3. Total viewing time: 20 seconds
4. User can only proceed after ALL 3 ads complete

**Implementation Approach:**
```typescript
// In ImageAdGate component:
const [currentAdIndex, setCurrentAdIndex] = useState(0);
const [selectedAds, setSelectedAds] = useState<ImageAdvertisement[]>([]);

// Select 3 ads at once
const ads = await selectMultipleAds(firestore, tournamentId, user.uid, 3);

// Display sequentially
<ImageAdDisplay 
  advertisement={selectedAds[currentAdIndex]}
  onComplete={() => {
    if (currentAdIndex < selectedAds.length - 1) {
      setCurrentAdIndex(currentAdIndex + 1); // Show next ad
    } else {
      onComplete(); // All ads viewed
    }
  }}
/>
```

**Pros:**
- ✅ Different sponsors get exposure
- ✅ More revenue opportunity
- ✅ Flexible (can show 2, 3, or 4 ads)
- ✅ Each ad tracked separately

**Cons:**
- ⚠️ Requires 3+ ads in database
- ⚠️ More complex tracking

---

### Option 2: Single Ad with Multiple Images (Carousel)
**How it works:**
1. Create ONE ad record with **3 images** (imageUrl1, imageUrl2, imageUrl3)
2. Display images in sequence:
   - **Image 1**: 9 seconds
   - **Image 2**: 6 seconds
   - **Image 3**: 5 seconds
3. Total: 20 seconds

**Implementation Approach:**
```typescript
type ImageAdvertisement = {
  // ... existing fields
  images: Array<{
    imageUrl: string;
    duration: number; // 9, 6, 5
  }>;
  // OR
  imageSequence: [
    { url: string, duration: 9 },
    { url: string, duration: 6 },
    { url: string, duration: 5 }
  ];
}
```

**Pros:**
- ✅ Single sponsor gets full 20s
- ✅ Simpler data model
- ✅ One tracking record

**Cons:**
- ⚠️ Less flexible
- ⚠️ Requires new data structure

---

### Option 3: Fixed Duration Split (Current + Modification)
**How it works:**
1. Keep current single-ad system
2. Add `adSequence` configuration to tournaments/campaigns:
   ```typescript
   {
     adSequence: [
       { duration: 9, adId: 'ad1' },
       { duration: 6, adId: 'ad2' },
       { duration: 5, adId: 'ad3' }
     ]
   }
   ```
3. `ImageAdGate` reads sequence and displays ads accordingly

**Pros:**
- ✅ Most flexible
- ✅ Admin can configure per tournament
- ✅ Can mix different ad types

**Cons:**
- ⚠️ Most complex to implement
- ⚠️ Requires admin UI changes

---

## Recommended Implementation: Option 1 (Multiple Ad Selection)

### Step-by-Step Flow:

1. **User clicks "Join Tournament"**
   ```
   → ImageAdGate component loads
   → Selects 3 ads from available pool
   → Stores in state: [ad1, ad2, ad3]
   ```

2. **Display Ad 1 (9 seconds)**
   ```
   → Shows ad1.imageUrl
   → Timer: 9 → 8 → 7 → ... → 0
   → User cannot skip
   → After 9s: "Continue" button appears
   ```

3. **User clicks "Continue"**
   ```
   → Tracks ad1 view completion
   → Automatically shows ad2
   → No gap/delay (seamless transition)
   ```

4. **Display Ad 2 (6 seconds)**
   ```
   → Shows ad2.imageUrl
   → Timer: 6 → 5 → 4 → ... → 0
   → User cannot skip
   → After 6s: "Continue" button appears
   ```

5. **User clicks "Continue"**
   ```
   → Tracks ad2 view completion
   → Automatically shows ad3
   ```

6. **Display Ad 3 (5 seconds)**
   ```
   → Shows ad3.imageUrl
   → Timer: 5 → 4 → 3 → ... → 0
   → User cannot skip
   → After 5s: "Continue" button appears
   ```

7. **User clicks "Continue" (Final)**
   ```
   → Tracks ad3 view completion
   → Calls onComplete() callback
   → User joins tournament
   ```

---

## Technical Requirements

### Database Changes:
```typescript
// No changes needed! Current ImageAdvertisement type supports this:
type ImageAdvertisement = {
  displayDuration: number; // Can be 9, 6, or 5
  // ... other fields
}
```

### Component Changes:
1. **ImageAdGate**: 
   - Select multiple ads (3) instead of 1
   - Track current ad index
   - Handle sequential display

2. **ImageAdDisplay**:
   - Already supports custom `displayDuration`
   - No changes needed!

### Firestore Query:
```typescript
// Select 3 different ads
const ads = await Promise.all([
  selectAdForEntry(firestore, tournamentId, user.uid),
  selectAdForEntry(firestore, tournamentId, user.uid),
  selectAdForEntry(firestore, tournamentId, user.uid)
]);
// Filter duplicates if needed
```

---

## User Experience

### Visual Flow:
```
[Click Join] 
  ↓
[Ad 1 - 9s] ⏱️ 9...8...7...6...5...4...3...2...1...0 [Continue]
  ↓
[Ad 2 - 6s] ⏱️ 6...5...4...3...2...1...0 [Continue]
  ↓
[Ad 3 - 5s] ⏱️ 5...4...3...2...1...0 [Continue]
  ↓
[Joined Tournament! ✅]
```

### Key Points:
- ✅ **Non-skippable**: Each ad must complete before next appears
- ✅ **Seamless**: No gaps between ads (instant transition)
- ✅ **Clear Progress**: User sees timer for each ad
- ✅ **Total Time**: 20 seconds (9+6+5)
- ✅ **Tracking**: Each ad view tracked separately

---

## Implementation Complexity

**Easy** ✅ - Option 1 (Multiple Ad Selection)
- Modify `ImageAdGate` to select 3 ads
- Add state for current ad index
- Loop through ads sequentially
- **Estimated time**: 2-3 hours

**Medium** ⚠️ - Option 2 (Carousel)
- Add new data structure
- Modify `ImageAdDisplay` to handle image array
- **Estimated time**: 4-5 hours

**Complex** ❌ - Option 3 (Configuration-based)
- Add admin UI for sequence configuration
- Modify multiple components
- **Estimated time**: 8-10 hours

---

## Recommendation

**Go with Option 1** - It's the simplest, most flexible, and requires minimal changes to your existing codebase. The current `ImageAdDisplay` component already supports custom durations, so you just need to:

1. Select 3 ads instead of 1
2. Display them sequentially
3. Track each view separately

Would you like me to implement Option 1?

