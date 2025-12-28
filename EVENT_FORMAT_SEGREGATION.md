# Event Format Segregation - Explanation & Implementation

## Problem Statement

When creating a match, admins were seeing events from all formats (T20, IPL, ODI, Test) regardless of which format they selected. This made it confusing and difficult to add the right events for the selected match format.

**Example Issue:**
- Admin selects **ODI** format
- Still sees **T20/IPL** events (like "200+ Score", "Super Over")
- Still sees **Test** events (like "First Innings Lead", "Follow-On")
- This caused confusion and potential errors

---

## Solution: Format-Based Event Filtering

### What Changed

1. **Improved Format Filtering Logic:**
   - Treats **IPL** as **T20** (since they have same rules)
   - Properly filters events based on `applicableFormats` property
   - Shows only relevant events for selected format

2. **Visual Segregation:**
   - Events are now displayed in **two sections**:
     - **Format-Specific Events**: Events that only apply to the selected format
     - **Common Events**: Events that apply to all formats

3. **Format Badges:**
   - Each event shows which format(s) it applies to
   - Format-specific events show: `T20`, `ODI`, `Test`, etc.
   - Common events show: `All Formats`

---

## How It Works Now

### When Admin Selects Format:

#### **ODI Format Selected:**
**Shows:**
- ✅ ODI-specific events (e.g., "ODI First Innings Powerplay 1", "300+ Score", "400+ Score")
- ✅ Common events (e.g., "Toss Winner", "Match Winner", "Total Runs")

**Hides:**
- ❌ T20/IPL events (e.g., "200+ Score", "Super Over")
- ❌ Test events (e.g., "First Innings Lead", "Follow-On")

#### **T20/IPL Format Selected:**
**Shows:**
- ✅ T20/IPL-specific events (e.g., "200+ Score", "Super Over", "Fastest 50")
- ✅ Common events (e.g., "Toss Winner", "Match Winner", "Total Runs")

**Hides:**
- ❌ ODI events (e.g., "300+ Score", "ODI Powerplay 1")
- ❌ Test events (e.g., "First Innings Lead", "Follow-On")

#### **Test Format Selected:**
**Shows:**
- ✅ Test-specific events (e.g., "First Innings Lead", "Follow-On", "Day 1 Session 1")
- ✅ Common events (e.g., "Toss Winner", "Match Winner", "Total Runs")

**Hides:**
- ❌ T20/IPL events (e.g., "200+ Score", "Super Over")
- ❌ ODI events (e.g., "300+ Score", "ODI Powerplay 1")

---

## Event Categories

### Format-Specific Events

#### **T20/IPL Events:**
- Powerplay events (Overs 1-6)
- Middle overs events (Overs 7-15)
- Death overs events (Overs 16-20)
- 200+ Score
- Super Over
- Fastest 50/100
- Strategic Timeout (IPL)

#### **ODI Events:**
- Powerplay 1 events (Overs 1-10)
- Middle Overs 1 events (Overs 11-30)
- Powerplay 2 events (Overs 31-40)
- Death Overs events (Overs 41-50)
- 300+ Score
- 400+ Score
- Chase Successful

#### **Test Events:**
- Day 1-5 Session events (3 sessions per day)
- First Innings Lead
- Follow-On
- Declaration
- Century Count
- Fifty Count

### Common Events (All Formats)

These events appear for **all formats**:
- Toss Winner
- Toss Decision
- Match Winner
- Win Margin
- Total Runs
- Total Wickets
- Total Fours
- Total Sixes
- Total Extras
- DRS Reviews
- Highest Individual Score
- Most Wickets
- Best Economy
- Hat-trick
- First Wicket
- First Boundary
- First Six

---

## UI Changes

### Before:
```
[All Events Mixed Together]
- Toss Winner (Common)
- ODI Powerplay 1 (ODI)
- 200+ Score (T20/IPL)
- First Innings Lead (Test)
- Match Winner (Common)
```

### After:
```
[ODI-Specific Events] (15 events)
- ODI First Innings Powerplay 1
- ODI 300+ Score
- ODI 400+ Score
...

[Common Events] (20 events)
- Toss Winner
- Match Winner
- Total Runs
...
```

---

## Technical Implementation

### Filtering Logic:

```typescript
// Normalize format: Treat IPL as T20
const normalizedFormat = selectedFormat === 'IPL' ? 'T20' : selectedFormat;

// Filter events
const availableTemplates = CRICKET_EVENT_TEMPLATES.filter((template) => {
  // Common events (no applicableFormats) apply to all
  if (!template.applicableFormats || template.applicableFormats.length === 0) {
    return true;
  }
  
  // Check if selected format matches template formats
  const formatsToCheck = normalizedFormat === 'T20' 
    ? ['T20', 'IPL'] 
    : [normalizedFormat];
  
  return template.applicableFormats.some(format => formatsToCheck.includes(format));
});
```

### Separation:

```typescript
// Format-specific events
const formatSpecificEvents = availableTemplates.filter(
  (template) => template.applicableFormats && template.applicableFormats.length > 0
);

// Common events
const commonEvents = availableTemplates.filter(
  (template) => !template.applicableFormats || template.applicableFormats.length === 0
);
```

---

## Benefits

1. ✅ **Clear Organization**: Events are clearly separated by format
2. ✅ **No Confusion**: Admins only see relevant events
3. ✅ **Faster Selection**: Easier to find the right events
4. ✅ **Visual Clarity**: Format badges show which events apply to which formats
5. ✅ **Prevents Errors**: Can't accidentally add wrong format events

---

## Usage Example

### Step 1: Select Format
```
Format: [ODI ▼]
```

### Step 2: View Events Dialog
```
Add Events from Templates
Select events for ODI format.
(15 format-specific, 20 common)

[ODI-Specific Events] (15 events)
  ✓ ODI First Innings Powerplay 1 (Overs 1-10) [ODI]
  ✓ ODI 300+ Score [ODI]
  ✓ ODI 400+ Score [ODI]
  ...

[Common Events] (20 events)
  ✓ Toss Winner [All Formats]
  ✓ Match Winner [All Formats]
  ✓ Total Runs [All Formats]
  ...
```

### Step 3: Select Events
- Check boxes for events you want
- Format badges help identify event types
- Click "Add Selected Events"

### Step 4: Events Added
- Only ODI and Common events are added
- No T20/IPL or Test events included

---

## Event Template Structure

Each event template has an `applicableFormats` property:

```typescript
{
  title: 'ODI First Innings Powerplay 1',
  applicableFormats: ['ODI'], // Only shows for ODI
  ...
}

{
  title: '200+ Score',
  applicableFormats: ['T20', 'IPL'], // Shows for T20 and IPL
  ...
}

{
  title: 'Toss Winner',
  applicableFormats: undefined, // Shows for all formats
  ...
}
```

---

## Summary

**Before:** All events mixed together, confusing for admins  
**After:** Events clearly segregated by format, easy to find and select

**Key Improvements:**
1. Format-based filtering
2. Visual separation (Format-Specific vs Common)
3. Format badges on each event
4. IPL treated as T20
5. Clear event counts per section

This makes it much easier for admins to add the correct events for each match format!

