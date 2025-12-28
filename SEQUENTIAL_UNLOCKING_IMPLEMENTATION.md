# Sequential Event Unlocking Implementation

## Overview

This document describes the sequential event unlocking system that has been implemented for cricket matches. The system automatically determines which events should be unlocked based on the current match state (format, over number, innings, etc.).

---

## Implementation Summary

### 1. **MatchState Type** (`MatchState`)

A new type that encapsulates the current state of a cricket match:

```typescript
export type MatchState = {
  format: 'T20' | 'ODI' | 'Test' | 'IPL';
  currentOver: number; // Current over number (0-based, 0 = pre-match)
  currentInnings: 1 | 2; // Current innings (1 or 2)
  matchStatus: 'upcoming' | 'live' | 'completed';
  currentDay?: number; // For Test matches (1-5)
  isInningsBreak?: boolean; // Whether currently in innings break
};
```

**Usage Example:**
```typescript
const matchState: MatchState = {
  format: 'T20',
  currentOver: 5,
  currentInnings: 1,
  matchStatus: 'live',
  isInningsBreak: false
};
```

---

### 2. **getCurrentMatchPhase()** Function

Determines the current match phase based on match state.

**Function Signature:**
```typescript
export function getCurrentMatchPhase(state: MatchState): MatchPhase
```

**How it works:**
- Analyzes format, over number, innings, and match status
- Returns the appropriate `MatchPhase` value
- Handles all three formats: T20/IPL, ODI, and Test

**Examples:**

**T20 Match:**
- Over 0-6, Innings 1 → `'First Innings - Powerplay (Overs 1-6)'`
- Over 7-15, Innings 1 → `'First Innings - Middle Overs (Overs 7-15)'`
- Over 16-20, Innings 1 → `'First Innings - Death Overs (Overs 16-20)'`
- Over 21-26, Innings 2 → `'Second Innings - Powerplay (Overs 1-6)'`

**ODI Match:**
- Over 0-10, Innings 1 → `'First Innings - Powerplay 1 (Overs 1-10)'`
- Over 11-30, Innings 1 → `'First Innings - Middle Overs 1 (Overs 11-30)'`
- Over 31-40, Innings 1 → `'First Innings - Powerplay 2 (Overs 31-40)'`
- Over 41-50, Innings 1 → `'First Innings - Death Overs (Overs 41-50)'`

**Test Match:**
- Day 1, Over 1-30 → `'Day 1 - Session 1 (Overs 1-30)'`
- Day 1, Over 31-60 → `'Day 1 - Session 2 (Overs 31-60)'`
- Day 1, Over 61-90 → `'Day 1 - Session 3 (Overs 61-90)'`

---

### 3. **isEventUnlocked()** Function

Checks if a specific event template should be unlocked based on current match state.

**Function Signature:**
```typescript
export function isEventUnlocked(
  eventTemplate: typeof CRICKET_EVENT_TEMPLATES[number],
  state: MatchState
): boolean
```

**Checks performed:**
1. ✅ Format compatibility (`applicableFormats`)
2. ✅ Phase matching (`matchPhase`)
3. ✅ Innings matching (`defaultInnings`)
4. ✅ Unlock threshold (`unlockAfterOver`)
5. ✅ Special cases (Pre-Match, Post-Match, Innings Break)

**Usage Example:**
```typescript
const eventTemplate = CRICKET_EVENT_TEMPLATES[0]; // Powerplay Runs event
const matchState: MatchState = {
  format: 'T20',
  currentOver: 3,
  currentInnings: 1,
  matchStatus: 'live'
};

if (isEventUnlocked(eventTemplate, matchState)) {
  // Event is unlocked, allow predictions
}
```

---

### 4. **getUnlockedEvents()** Function

Gets all events that should be unlocked for the current match state.

**Function Signature:**
```typescript
export function getUnlockedEvents(
  state: MatchState
): Array<typeof CRICKET_EVENT_TEMPLATES[number]>
```

**Usage Example:**
```typescript
const matchState: MatchState = {
  format: 'T20',
  currentOver: 5,
  currentInnings: 1,
  matchStatus: 'live'
};

const unlockedEvents = getUnlockedEvents(matchState);
// Returns array of event templates that are currently unlocked
```

---

### 5. **getEventsForPhase()** Function

Gets all events for a specific match phase.

**Function Signature:**
```typescript
export function getEventsForPhase(phase: MatchPhase): Array<typeof CRICKET_EVENT_TEMPLATES[number]>
```

**Usage Example:**
```typescript
const powerplayEvents = getEventsForPhase('First Innings - Powerplay (Overs 1-6)');
// Returns all events that belong to the powerplay phase
```

---

### 6. **getLockedEvents()** Function

Gets events that should be locked (their phase has passed).

**Function Signature:**
```typescript
export function getLockedEvents(
  state: MatchState
): Array<typeof CRICKET_EVENT_TEMPLATES[number]>
```

**Usage Example:**
```typescript
const matchState: MatchState = {
  format: 'T20',
  currentOver: 10, // Middle overs
  currentInnings: 1,
  matchStatus: 'live'
};

const lockedEvents = getLockedEvents(matchState);
// Returns events from powerplay phase (which has passed)
```

---

### 7. **getEventLockOver()** Function

Determines the over number when an event should lock.

**Function Signature:**
```typescript
export function getEventLockOver(
  eventTemplate: typeof CRICKET_EVENT_TEMPLATES[number],
  format: 'T20' | 'ODI' | 'Test' | 'IPL'
): number | null
```

**Returns:**
- Over number when event locks (or `null` if not applicable)

**Examples:**
- T20 Powerplay event → `6` (locks after over 6)
- ODI Powerplay 1 event → `10` (locks after over 10)
- Test Session 1 event → `30` (locks after over 30)

---

### 8. **getEventStatus()** Function

Determines the appropriate status for an event based on current match state.

**Function Signature:**
```typescript
export function getEventStatus(
  eventTemplate: typeof CRICKET_EVENT_TEMPLATES[number],
  state: MatchState
): 'upcoming' | 'live' | 'locked' | 'completed'
```

**Status Logic:**
- `upcoming`: Event not yet unlocked
- `live`: Event is unlocked and available for predictions
- `locked`: Event phase has passed, predictions closed
- `completed`: Event results have been entered (set manually)

**Usage Example:**
```typescript
const eventTemplate = CRICKET_EVENT_TEMPLATES[0];
const matchState: MatchState = {
  format: 'T20',
  currentOver: 5,
  currentInnings: 1,
  matchStatus: 'live'
};

const status = getEventStatus(eventTemplate, matchState);
// Returns 'live' if unlocked, 'locked' if phase passed, etc.
```

---

## Usage Workflow

### Step 1: Create Match State

```typescript
const matchState: MatchState = {
  format: 'T20',
  currentOver: 5,
  currentInnings: 1,
  matchStatus: 'live',
  isInningsBreak: false
};
```

### Step 2: Get Current Phase

```typescript
const currentPhase = getCurrentMatchPhase(matchState);
// Returns: 'First Innings - Powerplay (Overs 1-6)'
```

### Step 3: Get Unlocked Events

```typescript
const unlockedEvents = getUnlockedEvents(matchState);
// Returns array of event templates that are currently unlocked
```

### Step 4: Filter Events for UI

```typescript
// Show only unlocked events
const availableEvents = unlockedEvents.filter(event => 
  getEventStatus(event, matchState) === 'live'
);

// Show locked events (for reference)
const pastEvents = getLockedEvents(matchState);
```

### Step 5: Update Event Statuses

```typescript
// When creating/updating events, use getEventStatus()
const eventStatus = getEventStatus(eventTemplate, matchState);

// Update event in database
await updateMatchEvent(firestore, matchId, eventId, {
  status: eventStatus
});
```

---

## Integration Points

### Frontend Integration

1. **Match Page Component:**
   - Use `getCurrentMatchPhase()` to display current phase
   - Use `getUnlockedEvents()` to show available events
   - Use `getEventStatus()` to determine button states (Predict/Locked)

2. **Event List Component:**
   - Filter events by status: `live`, `upcoming`, `locked`
   - Group events by phase
   - Show countdown timers based on `getEventLockOver()`

3. **Real-time Updates:**
   - Listen to match state changes (over updates)
   - Recalculate unlocked events when over changes
   - Auto-update event statuses

### Backend Integration

1. **Event Creation:**
   - When creating events from templates, use `getEventStatus()` to set initial status
   - Store `matchPhase` and `unlockAfterOver` from templates

2. **Scheduled Jobs:**
   - Run periodic checks to update event statuses
   - Lock events when their phase passes
   - Unlock events when their phase starts

3. **API Endpoints:**
   - `/api/matches/:id/events/unlocked` - Get unlocked events
   - `/api/matches/:id/phase` - Get current phase
   - `/api/matches/:id/events/status` - Get event statuses

---

## Example: Complete Flow

```typescript
// 1. Match starts (T20 match)
const matchState: MatchState = {
  format: 'T20',
  currentOver: 0,
  currentInnings: 1,
  matchStatus: 'live',
  isInningsBreak: false
};

// 2. Get current phase
const phase = getCurrentMatchPhase(matchState);
// Returns: 'Pre-Match' (if status was 'upcoming') or 'First Innings - Powerplay (Overs 1-6)'

// 3. Get unlocked events
const unlockedEvents = getUnlockedEvents(matchState);
// Returns: Pre-match events + Powerplay events

// 4. User makes predictions on unlocked events

// 5. Match progresses to Over 7
matchState.currentOver = 7;

// 6. Phase changes
const newPhase = getCurrentMatchPhase(matchState);
// Returns: 'First Innings - Middle Overs (Overs 7-15)'

// 7. Powerplay events are now locked
const lockedEvents = getLockedEvents(matchState);
// Returns: Powerplay events (phase has passed)

// 8. Middle overs events are now unlocked
const newUnlockedEvents = getUnlockedEvents(matchState);
// Returns: Middle overs events

// 9. Update event statuses
lockedEvents.forEach(event => {
  const status = getEventStatus(event, matchState);
  // Returns: 'locked'
  // Update in database
});
```

---

## Testing Scenarios

### Scenario 1: T20 Match Progression

```typescript
// Over 0-6: Powerplay
matchState = { format: 'T20', currentOver: 3, currentInnings: 1, matchStatus: 'live' };
// Unlocked: Powerplay events
// Phase: 'First Innings - Powerplay (Overs 1-6)'

// Over 7-15: Middle Overs
matchState.currentOver = 10;
// Unlocked: Middle overs events
// Locked: Powerplay events
// Phase: 'First Innings - Middle Overs (Overs 7-15)'

// Over 16-20: Death Overs
matchState.currentOver = 18;
// Unlocked: Death overs events
// Locked: Powerplay + Middle overs events
// Phase: 'First Innings - Death Overs (Overs 16-20)'
```

### Scenario 2: ODI Match Progression

```typescript
// Over 0-10: Powerplay 1
matchState = { format: 'ODI', currentOver: 5, currentInnings: 1, matchStatus: 'live' };
// Phase: 'First Innings - Powerplay 1 (Overs 1-10)'

// Over 11-30: Middle Overs 1
matchState.currentOver = 25;
// Phase: 'First Innings - Middle Overs 1 (Overs 11-30)'

// Over 31-40: Powerplay 2
matchState.currentOver = 35;
// Phase: 'First Innings - Powerplay 2 (Overs 31-40)'

// Over 41-50: Death Overs
matchState.currentOver = 45;
// Phase: 'First Innings - Death Overs (Overs 41-50)'
```

### Scenario 3: Test Match Progression

```typescript
// Day 1, Over 1-30: Session 1
matchState = { format: 'Test', currentOver: 15, currentInnings: 1, matchStatus: 'live', currentDay: 1 };
// Phase: 'Day 1 - Session 1 (Overs 1-30)'

// Day 1, Over 31-60: Session 2
matchState.currentOver = 45;
// Phase: 'Day 1 - Session 2 (Overs 31-60)'

// Day 1, Over 61-90: Session 3
matchState.currentOver = 75;
// Phase: 'Day 1 - Session 3 (Overs 61-90)'
```

---

## Benefits

1. ✅ **Automatic Phase Detection**: No manual phase tracking needed
2. ✅ **Format-Aware**: Handles T20, ODI, and Test matches correctly
3. ✅ **Sequential Unlocking**: Events unlock automatically as match progresses
4. ✅ **Status Management**: Automatic status updates (upcoming → live → locked)
5. ✅ **Backward Compatible**: Existing events continue to work
6. ✅ **Type-Safe**: Full TypeScript support with proper types

---

## Next Steps

1. **UI Integration**: Update frontend components to use these functions
2. **Real-time Updates**: Implement WebSocket/real-time listeners for match state
3. **Notifications**: Add notifications when events unlock
4. **Countdown Timers**: Show time remaining before events lock
5. **Testing**: Add unit tests for all functions
6. **Documentation**: Add JSDoc comments to functions

---

**Implementation Date**: [Current Date]  
**Status**: ✅ Complete - Ready for Integration

