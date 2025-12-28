# UI Integration Guide: Sequential Event Unlocking

## Overview

This guide explains how the sequential event unlocking system has been integrated into the frontend UI, including real-time updates and event display components.

---

## Components Created

### 1. **useMatchEvents Hook** (`src/hooks/use-match-events.ts`)

A custom React hook that manages match state and event unlocking logic.

**Features:**
- ✅ Real-time match state updates via Firestore listeners
- ✅ Automatic phase detection
- ✅ Event status calculation (upcoming/live/locked/completed)
- ✅ Event grouping by status and phase
- ✅ Unlocked/locked event templates

**Usage:**
```typescript
import { useMatchEvents } from '@/hooks/use-match-events';

function MyComponent({ matchId }: { matchId: string }) {
  const {
    matchState,
    currentPhase,
    events,
    eventsByStatus,
    eventsByPhase,
    isLoading,
  } = useMatchEvents(matchId);

  // Use the data...
}
```

**Returns:**
- `matchState`: Current match state (format, over, innings, etc.)
- `currentPhase`: Current match phase
- `events`: All events for the match
- `eventsByStatus`: Events grouped by status (upcoming/live/locked/completed)
- `eventsByPhase`: Events grouped by match phase
- `isLoading`: Loading state

---

### 2. **MatchEventsDisplay Component** (`src/components/cricket/match-events-display.tsx`)

A component that displays events organized by status or phase.

**Features:**
- ✅ Tabbed interface (By Status / By Phase)
- ✅ Color-coded event cards based on status
- ✅ Current phase highlighting
- ✅ Event count badges
- ✅ Click handlers for event interaction

**Usage:**
```typescript
import { MatchEventsDisplay } from '@/components/cricket/match-events-display';

<MatchEventsDisplay
  events={events}
  eventsByStatus={eventsByStatus}
  eventsByPhase={eventsByPhase}
  currentPhase={currentPhase}
  onEventClick={(event) => {
    // Handle event click (navigate to prediction page, etc.)
  }}
/>
```

**Props:**
- `events`: Array of CricketEvent objects
- `eventsByStatus`: Object with upcoming/live/locked/completed arrays
- `eventsByPhase`: Object with phase names as keys and event arrays as values
- `currentPhase`: Current match phase
- `onEventClick`: Callback when event card is clicked

---

### 3. **MatchPhaseIndicator Component** (`src/components/cricket/match-phase-indicator.tsx`)

A component that displays the current match phase with visual indicators.

**Features:**
- ✅ Visual phase indicator with icons
- ✅ Current over information
- ✅ Format and innings display
- ✅ Color-coded phase badges

**Usage:**
```typescript
import { MatchPhaseIndicator } from '@/components/cricket/match-phase-indicator';

<MatchPhaseIndicator
  currentPhase={currentPhase}
  matchState={matchState}
/>
```

**Props:**
- `currentPhase`: Current match phase
- `matchState`: Current match state object

---

### 4. **Match State Utilities** (`src/lib/match-state-utils.ts`)

Helper functions for updating match state in Firestore.

**Functions:**
- `updateMatchState()`: Update match state
- `incrementOver()`: Increment over number
- `startMatch()`: Start the match
- `startInningsBreak()`: Start innings break
- `startSecondInnings()`: Start second innings
- `completeMatch()`: Complete the match
- `updateTestMatchDay()`: Update day for Test matches

**Usage:**
```typescript
import { incrementOver, startMatch } from '@/lib/match-state-utils';

// When an over completes
await incrementOver(firestore, matchId, currentOver);

// When match starts
await startMatch(firestore, matchId);
```

---

## Pages Created

### **Match Events Page** (`src/app/fantasy/cricket/match/[id]/events/page.tsx`)

A dedicated page for viewing match events with sequential unlocking.

**Features:**
- ✅ Uses `useMatchEvents` hook for real-time updates
- ✅ Displays `MatchPhaseIndicator` component
- ✅ Displays `MatchEventsDisplay` component
- ✅ Navigation to individual event pages

**Route:** `/fantasy/cricket/match/[id]/events`

---

## Real-Time Updates

### How It Works

1. **Firestore Listener**: The `useMatchEvents` hook sets up a real-time listener on the match document
2. **State Updates**: When match state changes (over, innings, status), the listener fires
3. **Automatic Recalculation**: Event statuses and phases are recalculated automatically
4. **UI Updates**: React re-renders components with new data

### Setting Up Real-Time Updates

**In your match management system:**

```typescript
import { incrementOver, startMatch } from '@/lib/match-state-utils';

// When match starts
await startMatch(firestore, matchId);

// When each over completes (call this from your over tracking system)
await incrementOver(firestore, matchId, currentOver);

// When innings break starts
await startInningsBreak(firestore, matchId);

// When second innings starts
await startSecondInnings(firestore, matchId, 'T20');
```

**The UI will automatically update** because:
- `useMatchEvents` hook listens to match document changes
- When match state updates, hook recalculates phases and event statuses
- Components re-render with new data

---

## Integration Steps

### Step 1: Add Match State Fields to Firestore

Ensure your match documents have these fields:

```typescript
{
  format: 'T20' | 'ODI' | 'Test' | 'IPL',
  currentOver: number, // Current over number (0 = pre-match)
  currentInnings: 1 | 2, // Current innings
  status: 'upcoming' | 'live' | 'completed',
  currentDay?: number, // For Test matches (1-5)
  isInningsBreak?: boolean, // Whether in innings break
}
```

### Step 2: Update Match State During Match

Use the utility functions to update match state:

```typescript
// Example: Over completion handler
async function handleOverComplete(matchId: string, currentOver: number) {
  await incrementOver(firestore, matchId, currentOver);
  
  // Optionally, update event statuses
  // The hook will automatically recalculate which events should be locked/unlocked
}
```

### Step 3: Use Components in Your Pages

```typescript
import { useMatchEvents } from '@/hooks/use-match-events';
import { MatchEventsDisplay } from '@/components/cricket/match-events-display';
import { MatchPhaseIndicator } from '@/components/cricket/match-phase-indicator';

export default function MatchPage({ matchId }: { matchId: string }) {
  const {
    matchState,
    currentPhase,
    events,
    eventsByStatus,
    eventsByPhase,
  } = useMatchEvents(matchId);

  return (
    <div>
      <MatchPhaseIndicator
        currentPhase={currentPhase}
        matchState={matchState}
      />
      
      <MatchEventsDisplay
        events={events || []}
        eventsByStatus={eventsByStatus}
        eventsByPhase={eventsByPhase}
        currentPhase={currentPhase}
        onEventClick={(event) => {
          router.push(`/match/${matchId}/event/${event.id}`);
        }}
      />
    </div>
  );
}
```

---

## Event Status Flow

### Status Transitions

1. **upcoming** → Event not yet unlocked (phase hasn't started)
2. **live** → Event is unlocked and available for predictions
3. **locked** → Event phase has passed, predictions closed
4. **completed** → Event result has been entered (manual update)

### Automatic Status Updates

The `getEventStatus()` function automatically determines status based on:
- Current match phase
- Event's `matchPhase` property
- Event's `unlockAfterOver` property
- Current over number
- Match status

**Status is calculated in real-time** - no manual updates needed!

---

## Example: Complete Integration

```typescript
'use client';

import { useMatchEvents } from '@/hooks/use-match-events';
import { MatchEventsDisplay } from '@/components/cricket/match-events-display';
import { MatchPhaseIndicator } from '@/components/cricket/match-phase-indicator';
import { incrementOver } from '@/lib/match-state-utils';
import { useFirestore } from '@/firebase';

export default function LiveMatchPage({ matchId }: { matchId: string }) {
  const firestore = useFirestore();
  const {
    matchState,
    currentPhase,
    events,
    eventsByStatus,
    eventsByPhase,
    isLoading,
  } = useMatchEvents(matchId);

  // Example: Simulate over completion (in real app, this would come from match tracking)
  const handleOverComplete = async () => {
    if (!matchState || !firestore) return;
    await incrementOver(firestore, matchId, matchState.currentOver);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Phase Indicator */}
      {matchState && (
        <MatchPhaseIndicator
          currentPhase={currentPhase}
          matchState={matchState}
        />
      )}

      {/* Events Display */}
      <MatchEventsDisplay
        events={events || []}
        eventsByStatus={eventsByStatus}
        eventsByPhase={eventsByPhase}
        currentPhase={currentPhase}
        onEventClick={(event) => {
          // Navigate to event prediction page
          window.location.href = `/match/${matchId}/event/${event.id}`;
        }}
      />

      {/* Example: Over completion button (for testing) */}
      {matchState && matchState.matchStatus === 'live' && (
        <button onClick={handleOverComplete}>
          Simulate Over Complete
        </button>
      )}
    </div>
  );
}
```

---

## Testing Real-Time Updates

### Manual Testing

1. **Open match page** in browser
2. **Open Firestore console** or use admin panel
3. **Update match document**:
   ```javascript
   {
     currentOver: 5, // Change from 0 to 5
     currentInnings: 1,
     status: 'live'
   }
   ```
4. **Watch UI update** automatically - events should unlock/lock based on phase

### Automated Testing

```typescript
// Test over increment
await incrementOver(firestore, matchId, 0);
// Should unlock powerplay events

await incrementOver(firestore, matchId, 6);
// Should lock powerplay events, unlock middle overs events

await incrementOver(firestore, matchId, 15);
// Should lock middle overs events, unlock death overs events
```

---

## Benefits

1. ✅ **Automatic Updates**: No manual event status management needed
2. ✅ **Real-Time**: Changes reflect immediately via Firestore listeners
3. ✅ **Type-Safe**: Full TypeScript support
4. ✅ **Reusable**: Components can be used across different pages
5. ✅ **Format-Aware**: Handles T20, ODI, and Test matches correctly
6. ✅ **User-Friendly**: Clear visual indicators for event status

---

## Next Steps

1. **Integrate with Match Tracking**: Connect over tracking system to `incrementOver()`
2. **Add Notifications**: Notify users when events unlock
3. **Add Countdown Timers**: Show time remaining before events lock
4. **Add Event Predictions**: Create prediction pages for each event
5. **Add Admin Controls**: Admin panel to manually update match state

---

**Implementation Date**: [Current Date]  
**Status**: ✅ Complete - Ready for Integration

