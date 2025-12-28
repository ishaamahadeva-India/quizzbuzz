# How to Use Sequential Event Unlocking System

## Quick Start Guide

This guide shows you how to use the sequential event unlocking system for cricket matches in your application.

---

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [For Users - Making Predictions](#for-users---making-predictions)
3. [For Admins - Managing Matches](#for-admins---managing-matches)
4. [Integration Examples](#integration-examples)
5. [Real-World Scenarios](#real-world-scenarios)

---

## Basic Setup

### Step 1: Create a Match with Events

First, create a cricket match in your admin panel:

```typescript
import { addCricketMatch, addMatchEvent } from '@/firebase/firestore/cricket-matches';
import { CRICKET_EVENT_TEMPLATES } from '@/firebase/firestore/cricket-matches';

// 1. Create the match
const matchRef = await addCricketMatch(firestore, {
  matchName: 'IND vs AUS',
  format: 'T20',
  teams: ['India', 'Australia'],
  team1: 'India',
  team2: 'Australia',
  venue: 'Wankhede Stadium',
  startTime: new Date('2024-12-25T19:00:00'),
  status: 'upcoming',
});

const matchId = matchRef.id;

// 2. Add events from templates
const powerplayEvents = CRICKET_EVENT_TEMPLATES.filter(
  template => template.matchPhase === 'First Innings - Powerplay (Overs 1-6)'
);

for (const template of powerplayEvents) {
  await addMatchEvent(firestore, matchId, {
    title: template.title,
    description: template.description,
    eventType: template.eventType,
    points: template.defaultPoints,
    difficultyLevel: template.difficultyLevel,
    options: template.defaultOptions,
    rules: template.defaultRules,
    status: 'upcoming', // Will be updated automatically
    applicableFormats: template.applicableFormats,
  });
}
```

### Step 2: Set Initial Match State

When creating a match, ensure it has these fields in Firestore:

```typescript
{
  format: 'T20', // or 'ODI', 'Test', 'IPL'
  currentOver: 0,
  currentInnings: 1,
  status: 'upcoming', // or 'live', 'completed'
  currentDay: undefined, // Only for Test matches (1-5)
  isInningsBreak: false,
}
```

---

## For Users - Making Predictions

### Viewing Match Events

Users can view events on the match events page:

**Route:** `/fantasy/cricket/match/[matchId]/events`

This page automatically:
- ✅ Shows current match phase
- ✅ Displays events organized by status (Live, Upcoming, Locked, Completed)
- ✅ Shows countdown timers for live events
- ✅ Updates in real-time as match progresses

### Making a Prediction

1. **Navigate to Events Page:**
   ```typescript
   router.push(`/fantasy/cricket/match/${matchId}/events`);
   ```

2. **Click on a Live Event:**
   - Events with "Predict Now" button are available
   - Countdown timer shows time remaining

3. **Make Your Prediction:**
   - Select from options (for multiple choice events)
   - Or enter text (for custom predictions)
   - Click "Submit Prediction"

4. **Update Prediction (if needed):**
   - You can update predictions until the event locks
   - Your existing prediction will be shown

### Example: User Component

```typescript
'use client';

import { useMatchEvents } from '@/hooks/use-match-events';
import { useEventNotifications } from '@/hooks/use-event-notifications';
import { MatchEventsDisplay } from '@/components/cricket/match-events-display';
import { MatchPhaseIndicator } from '@/components/cricket/match-phase-indicator';
import { useRouter } from 'next/navigation';

export default function MatchPage({ matchId }: { matchId: string }) {
  const router = useRouter();
  
  // Get match events and state
  const {
    matchState,
    currentPhase,
    events,
    eventsByStatus,
    eventsByPhase,
  } = useMatchEvents(matchId);

  // Enable notifications
  useEventNotifications({
    matchId,
    enabled: true,
    showBrowserNotifications: false, // Set to true for browser notifications
  });

  const handleEventClick = (event: CricketEvent) => {
    router.push(`/fantasy/cricket/match/${matchId}/event/${event.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Current Phase Indicator */}
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
        matchState={matchState}
        matchFormat={match?.format || 'T20'}
        onEventClick={handleEventClick}
      />
    </div>
  );
}
```

---

## For Admins - Managing Matches

### Starting a Match

When a match is about to start:

```typescript
import { startMatch } from '@/lib/match-state-utils';

// Start the match
await startMatch(firestore, matchId);

// This will:
// - Set status to 'live'
// - Set currentOver to 0
// - Set currentInnings to 1
// - Unlock pre-match and first powerplay events
```

### Tracking Match Progress

#### Option 1: Manual Over Updates

```typescript
import { incrementOver } from '@/lib/match-state-utils';

// When an over completes
await incrementOver(firestore, matchId, currentOver);

// Example: After Over 5 completes
await incrementOver(firestore, matchId, 5);
// Now Over 6 is active
```

#### Option 2: Using Match Tracking Hook

```typescript
import { useMatchTracking } from '@/hooks/use-match-tracking';

function AdminMatchControl({ matchId }: { matchId: string }) {
  const {
    handleMatchStart,
    handleOverComplete,
    handleInningsBreak,
    handleSecondInningsStart,
    handleMatchComplete,
    currentOver,
    currentInnings,
  } = useMatchTracking({
    matchId,
    format: 'T20',
    autoIncrement: false, // Set to true for demo/testing
  });

  return (
    <div>
      <p>Current Over: {currentOver}</p>
      <p>Current Innings: {currentInnings}</p>
      
      <button onClick={handleMatchStart}>Start Match</button>
      <button onClick={handleOverComplete}>Complete Over</button>
      <button onClick={handleInningsBreak}>Start Innings Break</button>
      <button onClick={handleSecondInningsStart}>Start 2nd Innings</button>
      <button onClick={handleMatchComplete}>Complete Match</button>
    </div>
  );
}
```

#### Option 3: Using Admin Component

```typescript
import { MatchTrackingControls } from '@/components/admin/match-tracking-controls';

// In your admin panel
<MatchTrackingControls matchId={matchId} format="T20" />
```

### Handling Innings Break

```typescript
import { startInningsBreak, startSecondInnings } from '@/lib/match-state-utils';

// When first innings ends
await startInningsBreak(firestore, matchId);

// When second innings starts (after break)
await startSecondInnings(firestore, matchId, 'T20');
```

### Completing the Match

```typescript
import { completeMatch } from '@/lib/match-state-utils';

// When match ends
await completeMatch(firestore, matchId);

// This will:
// - Set status to 'completed'
// - Lock all events
// - Unlock post-match events
```

---

## Integration Examples

### Example 1: Connect to Real Match API

```typescript
// In your match data fetcher/service
async function syncMatchData(matchId: string) {
  // Fetch from your match API
  const matchData = await fetch(`https://api.cricket.com/matches/${matchId}`);
  const data = await matchData.json();

  // Update Firestore match state
  await updateMatchState(firestore, matchId, {
    currentOver: data.currentOver,
    currentInnings: data.currentInnings,
    matchStatus: data.status === 'live' ? 'live' : 'upcoming',
    isInningsBreak: data.isInningsBreak || false,
  });
}

// Call this periodically (every 30 seconds)
setInterval(() => {
  syncMatchData(matchId);
}, 30000);
```

### Example 2: WebSocket Integration

```typescript
// Connect to WebSocket for real-time updates
const socket = new WebSocket('wss://your-cricket-api.com/live');

socket.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'over-complete') {
    await incrementOver(firestore, data.matchId, data.over);
  }
  
  if (data.type === 'innings-break') {
    await startInningsBreak(firestore, data.matchId);
  }
  
  if (data.type === 'match-complete') {
    await completeMatch(firestore, data.matchId);
  }
};
```

### Example 3: Scheduled Job (Cron)

```typescript
// In your backend/API route
// /api/cron/update-matches

export async function GET() {
  const liveMatches = await getLiveMatches();
  
  for (const match of liveMatches) {
    // Fetch current state from API
    const currentState = await fetchMatchState(match.id);
    
    // Update Firestore
    await updateMatchState(firestore, match.id, {
      currentOver: currentState.over,
      currentInnings: currentState.innings,
      matchStatus: currentState.status,
    });
  }
  
  return Response.json({ success: true });
}

// Run this every minute via cron job
```

---

## Real-World Scenarios

### Scenario 1: T20 Match Flow

```typescript
// 1. Pre-Match (Before match starts)
// Status: 'upcoming', currentOver: 0
// Events: Pre-match events are live

// 2. Match Starts
await startMatch(firestore, matchId);
// Status: 'live', currentOver: 0, currentInnings: 1
// Events: Pre-match events lock, Powerplay events unlock

// 3. Over 1-6 (Powerplay)
for (let over = 1; over <= 6; over++) {
  await incrementOver(firestore, matchId, over - 1);
  // Powerplay events remain live
}

// 4. Over 7 (Middle Overs Start)
await incrementOver(firestore, matchId, 6);
// Powerplay events lock, Middle overs events unlock

// 5. Over 16 (Death Overs Start)
await incrementOver(firestore, matchId, 15);
// Middle overs events lock, Death overs events unlock

// 6. Over 20 (First Innings End)
await incrementOver(firestore, matchId, 19);
await startInningsBreak(firestore, matchId);
// Death overs events lock, Innings break events unlock

// 7. Second Innings Start
await startSecondInnings(firestore, matchId, 'T20');
// Status: currentOver: 20, currentInnings: 2
// Second innings powerplay events unlock

// 8. Match Complete
await completeMatch(firestore, matchId);
// All events lock, Post-match events unlock
```

### Scenario 2: ODI Match Flow

```typescript
// ODI has 50 overs per innings and 2 powerplays

// First Innings Powerplay 1 (Overs 1-10)
for (let over = 1; over <= 10; over++) {
  await incrementOver(firestore, matchId, over - 1);
}

// Middle Overs 1 (Overs 11-30)
await incrementOver(firestore, matchId, 10);
// Powerplay 1 events lock, Middle overs events unlock

// Powerplay 2 (Overs 31-40)
await incrementOver(firestore, matchId, 30);
// Middle overs events lock, Powerplay 2 events unlock

// Death Overs (Overs 41-50)
await incrementOver(firestore, matchId, 40);
// Powerplay 2 events lock, Death overs events unlock

// Innings Break
await startInningsBreak(firestore, matchId);

// Second Innings (similar flow)
await startSecondInnings(firestore, matchId, 'ODI');
```

### Scenario 3: Test Match Flow

```typescript
// Test matches have 90 overs per day, 3 sessions

// Day 1, Session 1 (Overs 1-30)
for (let over = 1; over <= 30; over++) {
  await updateTestMatchDay(firestore, matchId, 1, over);
}

// Day 1, Session 2 (Overs 31-60)
await updateTestMatchDay(firestore, matchId, 1, 31);
// Session 1 events lock, Session 2 events unlock

// Day 1, Session 3 (Overs 61-90)
await updateTestMatchDay(firestore, matchId, 1, 61);
// Session 2 events lock, Session 3 events unlock

// Day 2, Session 1 (Overs 91-120)
await updateTestMatchDay(firestore, matchId, 2, 91);
// Day 1 events lock, Day 2 Session 1 events unlock
```

---

## Complete Example: Full Match Page

```typescript
'use client';

import { useMatchEvents } from '@/hooks/use-match-events';
import { useEventNotifications } from '@/hooks/use-event-notifications';
import { MatchEventsDisplay } from '@/components/cricket/match-events-display';
import { MatchPhaseIndicator } from '@/components/cricket/match-phase-indicator';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function LiveMatchPage({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { user } = useUser();
  
  const {
    matchState,
    currentPhase,
    match,
    events,
    eventsByStatus,
    eventsByPhase,
    isLoading,
  } = useMatchEvents(matchId);

  // Enable notifications
  useEventNotifications({
    matchId,
    enabled: true,
    showBrowserNotifications: false,
  });

  const handleEventClick = (event: CricketEvent) => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push(`/fantasy/cricket/match/${matchId}/event/${event.id}`);
  };

  if (isLoading) {
    return <div>Loading match...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Match Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {match?.matchName || `${match?.team1} vs ${match?.team2}`}
        </h1>
        <p className="text-muted-foreground">
          {match?.format} Match • {match?.venue}
        </p>
      </div>

      {/* Phase Indicator */}
      {matchState && (
        <MatchPhaseIndicator
          currentPhase={currentPhase}
          matchState={matchState}
        />
      )}

      {/* Events Display */}
      {events && events.length > 0 ? (
        <MatchEventsDisplay
          events={events}
          eventsByStatus={eventsByStatus}
          eventsByPhase={eventsByPhase}
          currentPhase={currentPhase}
          matchState={matchState}
          matchFormat={(match?.format as 'T20' | 'ODI' | 'Test' | 'IPL') || 'T20'}
          onEventClick={handleEventClick}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No events available for this match yet.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Admin Panel Example

```typescript
'use client';

import { MatchTrackingControls } from '@/components/admin/match-tracking-controls';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function AdminMatchPage({ matchId }: { matchId: string }) {
  const firestore = useFirestore();
  const matchRef = firestore ? doc(firestore, 'fantasy_matches', matchId) : null;
  const { data: match } = useDoc(matchRef);

  if (!match) {
    return <div>Match not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Match Control Panel</h1>
      
      <MatchTrackingControls
        matchId={matchId}
        format={match.format as 'T20' | 'ODI' | 'Test' | 'IPL'}
      />
    </div>
  );
}
```

---

## Key Points to Remember

1. **Match State Fields Required:**
   - `format`: 'T20' | 'ODI' | 'Test' | 'IPL'
   - `currentOver`: number (0-based)
   - `currentInnings`: 1 | 2
   - `status`: 'upcoming' | 'live' | 'completed'
   - `currentDay`: number (only for Test matches)
   - `isInningsBreak`: boolean

2. **Event Status Flow:**
   - `upcoming` → Event not yet unlocked
   - `live` → Event available for predictions
   - `locked` → Event phase passed, predictions closed
   - `completed` → Event result entered

3. **Automatic Updates:**
   - Events unlock/lock automatically based on match state
   - UI updates in real-time via Firestore listeners
   - No manual event status management needed

4. **Notifications:**
   - Toast notifications show when events unlock
   - Browser notifications available (requires permission)
   - Lock warnings appear 5 overs before phase ends

---

## Troubleshooting

### Events Not Unlocking

**Check:**
- Match state has correct `currentOver` and `currentInnings`
- Event templates have correct `matchPhase` and `unlockAfterOver`
- Match `status` is 'live'

### Events Not Locking

**Check:**
- Match state is updating correctly
- `getEventLockOver()` returns correct over number
- Event phase has passed

### Notifications Not Showing

**Check:**
- `useEventNotifications` hook is called
- `enabled` prop is `true`
- Browser notifications require user permission

---

## Next Steps

1. **Connect to Match API**: Integrate with your cricket match data source
2. **Add WebSocket**: Real-time updates via WebSocket
3. **Add Analytics**: Track prediction accuracy and user engagement
4. **Add Leaderboards**: Show user rankings based on predictions
5. **Add Result Verification**: Admin interface to verify event results

---

**Need Help?** Check the documentation files:
- `SEQUENTIAL_UNLOCKING_IMPLEMENTATION.md` - Technical details
- `UI_INTEGRATION_GUIDE.md` - UI integration guide
- `COMPLETE_INTEGRATION_SUMMARY.md` - Complete feature summary

