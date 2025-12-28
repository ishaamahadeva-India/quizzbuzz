# Cricket Event Enhancement Plan: Sequential Live Engagement System

## Executive Summary

This document outlines a comprehensive plan to enhance the cricket event system for **T20/IPL**, **ODI**, and **Test** matches. The goal is to create a **sequential, phase-based event unlocking system** that keeps users engaged throughout the entire match duration, rather than allowing one-time selections at the start.

---

## Current Structure Analysis

### What We Have Now

1. **MatchPhase Types** (defined in `cricket-matches.ts`):
   - `Pre-Match`
   - `First Innings - Powerplay (Overs 1-6)`
   - `First Innings - Middle Overs (Overs 7-15)`
   - `First Innings - Death Overs (Overs 16-20)`
   - `Innings Break`
   - `Second Innings - Powerplay (Overs 1-6)`
   - `Second Innings - Middle Overs (Overs 7-15)`
   - `Second Innings - Death Overs (Overs 16-20)`
   - `Post-Match`

2. **Event Properties**:
   - `matchPhase`: Which phase the event belongs to
   - `unlockAfterOver`: Over number when event unlocks
   - `defaultInnings`: Which innings (1 or 2)
   - `applicableFormats`: T20, ODI, Test, IPL
   - `status`: `upcoming`, `live`, `completed`, `locked`

3. **Current Event Types**: ~50+ events already defined with templates

### What's Missing

1. **Sequential Unlocking Logic**: Events don't automatically unlock based on match progress
2. **Format-Specific Phases**: ODI and Test matches need different phase structures
3. **Real-time Engagement**: Users can select all events upfront instead of waiting for sequential unlocks
4. **DRS Events**: Limited DRS-related events
5. **Over-by-Over Events**: More granular events for continuous engagement

---

## Proposed Enhancement: Sequential Phase System

### Core Concept

**Events unlock sequentially as the match progresses through phases.** Users can only participate in events that are currently "live" or "upcoming" for the current phase. This creates continuous engagement throughout the match.

---

## Phase Structure by Match Format

### 1. T20/IPL Match Phases

#### **Pre-Match Phase** (Before match starts)
- **Duration**: Until toss
- **Events**:
  - Toss Winner
  - Toss Decision (Bat/Bowl)
  - Match Winner (pre-match prediction)
  - First Innings Score Range (pre-match prediction)
  - Total Match Runs (pre-match prediction)
  - 200+ Score Prediction
  - Super Over Prediction

#### **First Innings - Powerplay (Overs 1-6)**
- **Duration**: Over 0 to Over 6
- **Unlock Timing**: Events unlock at match start
- **Lock Timing**: Events lock after Over 6 completes
- **Events**:
  - **Over 0-1**: First Ball Runs, First Boundary Over
  - **Over 1-3**: Powerplay Score After Over 3
  - **Over 1-6**: Powerplay Total Runs, Powerplay Wickets, Powerplay Boundaries, Powerplay Sixes
  - **Live Events**: First Wicket Over, First Six Over, First 50 Partnership Over

#### **First Innings - Middle Overs (Overs 7-15)**
- **Duration**: Over 6 to Over 15
- **Unlock Timing**: Events unlock after Over 6 completes
- **Lock Timing**: Events lock after Over 15 completes
- **Events**:
  - **Over 7-10**: Score After Over 10, Wickets After Over 10
  - **Over 7-15**: Score After Over 15, Strategic Timeout Timing (IPL)
  - **Live Events**: Highest Individual Score So Far, Most Boundaries So Far, Best Strike Rate So Far

#### **First Innings - Death Overs (Overs 16-20)**
- **Duration**: Over 15 to Over 20
- **Unlock Timing**: Events unlock after Over 15 completes
- **Lock Timing**: Events lock after Over 20 completes
- **Events**:
  - **Over 16-18**: Score After Over 18
  - **Over 16-20**: Final First Innings Score Range, First Innings Wickets Lost, Fastest 50 in Innings
  - **Live Events**: Final Over Runs, Last Wicket Over

#### **Innings Break** (Between innings)
- **Duration**: End of Over 20 to Start of Over 1 (2nd innings)
- **Unlock Timing**: Events unlock immediately after first innings ends
- **Lock Timing**: Events lock when second innings starts
- **Events**:
  - Target Prediction (Will chase be successful?)
  - Required Run Rate After Powerplay
  - Second Innings Powerplay Runs Prediction
  - Second Innings Score Range Prediction
  - Chasing Team Powerplay Strategy Prediction

#### **Second Innings - Powerplay (Overs 1-6)**
- **Duration**: Over 0 to Over 6 (2nd innings)
- **Unlock Timing**: Events unlock at start of second innings
- **Lock Timing**: Events lock after Over 6 completes
- **Events**:
  - **Over 0-3**: Second Innings Score After Over 3
  - **Over 1-6**: Second Innings Powerplay Runs, Second Innings Powerplay Wickets
  - **Live Events**: Required Run Rate After Powerplay, Chasing Team Score After Powerplay

#### **Second Innings - Middle Overs (Overs 7-15)**
- **Duration**: Over 6 to Over 15 (2nd innings)
- **Unlock Timing**: Events unlock after Over 6 completes
- **Lock Timing**: Events lock after Over 15 completes
- **Events**:
  - **Over 7-10**: Second Innings Score After Over 10
  - **Over 7-15**: Second Innings Score After Over 15
  - **Live Events**: Required Run Rate After Over 10/15, Wickets Lost After Over 10/15

#### **Second Innings - Death Overs (Overs 16-20)**
- **Duration**: Over 15 to Over 20 (2nd innings)
- **Unlock Timing**: Events unlock after Over 15 completes
- **Lock Timing**: Events lock after Over 20 completes or match ends
- **Events**:
  - **Over 16-18**: Second Innings Score After Over 18
  - **Over 16-20**: Final Second Innings Score, Match Winner (if not decided), Win Margin
  - **Live Events**: Last Over Runs Needed, Final Over Outcome

#### **Post-Match Phase**
- **Duration**: After match ends
- **Events**:
  - Match Winner (final)
  - Win Margin (final)
  - Total Match Runs, Wickets, Fours, Sixes
  - Player of the Match
  - Highest Individual Score
  - Most Wickets
  - Fastest 50/100

---

### 2. ODI Match Phases

ODI matches have **50 overs per innings**, so phases are different:

#### **Pre-Match Phase**
- Same as T20, but with ODI-specific predictions (300+, 400+ scores)

#### **First Innings - Powerplay 1 (Overs 1-10)**
- **Duration**: Over 0 to Over 10
- **Events**: Powerplay Runs (Overs 1-10), Powerplay Wickets, Powerplay Boundaries

#### **First Innings - Middle Overs 1 (Overs 11-30)**
- **Duration**: Over 10 to Over 30
- **Events**: 
  - Score After Over 25
  - Score After Over 30
  - Wickets After Over 25/30
  - First 100 Partnership Over

#### **First Innings - Powerplay 2 (Overs 31-40)**
- **Duration**: Over 30 to Over 40
- **Events**: 
  - Score After Over 35
  - Score After Over 40
  - Second Powerplay Runs (Overs 31-40)

#### **First Innings - Death Overs (Overs 41-50)**
- **Duration**: Over 40 to Over 50
- **Events**: 
  - Score After Over 45
  - Final First Innings Score
  - First Innings Wickets Lost

#### **Innings Break**
- Similar to T20 but with ODI-specific target predictions

#### **Second Innings - Powerplay 1 (Overs 1-10)**
- Similar structure to first innings

#### **Second Innings - Middle Overs 1 (Overs 11-30)**
- Score predictions at Over 25, Over 30

#### **Second Innings - Powerplay 2 (Overs 31-40)**
- Score predictions at Over 35, Over 40

#### **Second Innings - Death Overs (Overs 41-50)**
- Final score predictions, match outcome

#### **Post-Match**
- ODI-specific statistics

---

### 3. Test Match Phases

Test matches have **90 overs per day** and can last **5 days**. Phases are session-based:

#### **Pre-Match Phase**
- Toss Winner, Toss Decision
- Match Winner (pre-match)
- First Innings Lead Prediction

#### **Day 1 - Session 1 (Overs 1-30)**
- **Events**: 
  - Score After Over 15
  - Score After Over 30 (Lunch)
  - Wickets After Session 1
  - First Wicket Over
  - First 50 Partnership Over

#### **Day 1 - Session 2 (Overs 31-60)**
- **Events**: 
  - Score After Over 45
  - Score After Over 60 (Tea)
  - Wickets After Session 2
  - First Century Over

#### **Day 1 - Session 3 (Overs 61-90)**
- **Events**: 
  - Score After Over 75
  - Score After Over 90 (Stumps Day 1)
  - Wickets After Day 1
  - First Innings Score After Day 1

#### **Day 2-5**: Similar session-based structure
- Each day has 3 sessions (30 overs each)
- Events unlock at the start of each session
- Lock at the end of each session

#### **Innings Break**
- First Innings Lead
- Follow-On Prediction
- Declaration Prediction

#### **Post-Match**
- Match Result
- First Innings Lead (final)
- Follow-On Enforced (final)
- Total Centuries, Fifties
- Highest Individual Score
- Best Bowling Figures

---

## DRS (Decision Review System) Events

### DRS Events by Format

#### **T20/IPL**
- Total DRS Reviews Taken (0-2, 3-4, 5+)
- First DRS Review Over
- Successful DRS Reviews Count
- Unsuccessful DRS Reviews Count
- DRS Review Result (Umpire's Call, Overturned, Not Out)

#### **ODI**
- Total DRS Reviews Taken (0-3, 4-6, 7+)
- First DRS Review Over
- DRS Reviews Per Innings
- Most DRS Reviews by a Team

#### **Test**
- Total DRS Reviews Taken (0-5, 6-10, 11+)
- DRS Reviews Per Day
- DRS Reviews Per Session
- Most DRS Reviews in an Innings
- DRS Success Rate

### DRS Event Timing
- **Unlock**: After match starts (can be predicted anytime)
- **Lock**: After match ends
- **Live Updates**: Show real-time DRS count as reviews happen

---

## Implementation Strategy

### Phase 1: Extend MatchPhase Types

Add format-specific phases to the `MatchPhase` type:

```typescript
export type MatchPhase = 
  // T20/IPL Phases
  | 'Pre-Match'
  | 'First Innings - Powerplay (Overs 1-6)'
  | 'First Innings - Middle Overs (Overs 7-15)'
  | 'First Innings - Death Overs (Overs 16-20)'
  | 'Innings Break'
  | 'Second Innings - Powerplay (Overs 1-6)'
  | 'Second Innings - Middle Overs (Overs 7-15)'
  | 'Second Innings - Death Overs (Overs 16-20)'
  | 'Post-Match'
  
  // ODI Phases
  | 'First Innings - Powerplay 1 (Overs 1-10)'
  | 'First Innings - Middle Overs 1 (Overs 11-30)'
  | 'First Innings - Powerplay 2 (Overs 31-40)'
  | 'First Innings - Death Overs (Overs 41-50)'
  | 'Second Innings - Powerplay 1 (Overs 1-10)'
  | 'Second Innings - Middle Overs 1 (Overs 11-30)'
  | 'Second Innings - Powerplay 2 (Overs 31-40)'
  | 'Second Innings - Death Overs (Overs 41-50)'
  
  // Test Phases
  | 'Day 1 - Session 1 (Overs 1-30)'
  | 'Day 1 - Session 2 (Overs 31-60)'
  | 'Day 1 - Session 3 (Overs 61-90)'
  | 'Day 2 - Session 1'
  | 'Day 2 - Session 2'
  | 'Day 2 - Session 3'
  // ... and so on for Days 3-5
  | 'Post-Match';
```

### Phase 2: Add Event Unlocking Logic

Create a function that determines which events should be unlocked based on:
- Current match format (T20/ODI/Test)
- Current over number
- Current innings (1 or 2)
- Current match phase

```typescript
function getUnlockedEvents(
  matchFormat: 'T20' | 'ODI' | 'Test' | 'IPL',
  currentOver: number,
  currentInnings: 1 | 2,
  matchStatus: 'upcoming' | 'live' | 'completed'
): CricketEvent[] {
  // Logic to filter events based on:
  // 1. matchPhase matches current phase
  // 2. unlockAfterOver <= currentOver
  // 3. applicableFormats includes matchFormat
  // 4. status is 'upcoming' or 'live'
}
```

### Phase 3: Add Real-Time Event Status Updates

When match progresses:
1. **Auto-unlock events** when `unlockAfterOver` is reached
2. **Auto-lock events** when their phase ends
3. **Update event status** from `upcoming` → `live` → `locked` → `completed`

### Phase 4: Enhanced Event Templates

Add more granular events:
- **Over-by-over predictions**: "Score after Over X"
- **Ball-by-ball events**: "First Ball Runs", "First Boundary Ball"
- **Partnership events**: "First 50 Partnership Over", "First 100 Partnership Over"
- **DRS events**: As outlined above
- **Player-specific events**: "Top Scorer After Over X", "Most Wickets After Over X"

### Phase 5: User Engagement Features

1. **Notification System**: 
   - Notify users when new events unlock
   - Remind users to make predictions before events lock

2. **Live Event Dashboard**:
   - Show "Available Now" events (unlocked and live)
   - Show "Upcoming" events (will unlock soon)
   - Show "Locked" events (phase has passed)
   - Show "Completed" events (results available)

3. **Countdown Timers**:
   - Show time remaining before events lock
   - Show time until next events unlock

4. **Streak System**:
   - Reward users for making predictions in each phase
   - Bonus points for predicting in multiple sequential phases

---

## Event Categories Enhancement

### Current Categories:
- Powerplay Events
- Batting Events
- Bowling Events
- Fielding Events
- Match Outcome
- Innings Events
- Special Events
- Player Performance

### Proposed Additional Categories:
- **DRS Events**: All DRS-related predictions
- **Over-by-Over Events**: Score predictions at specific overs
- **Partnership Events**: Partnership-related predictions
- **Session Events**: Test match session-based events
- **Live Engagement Events**: Events that unlock during live play

---

## Backward Compatibility

### Maintaining Current Structure

1. **Keep existing event types**: All current `CricketEventType` values remain valid
2. **Keep existing properties**: `matchPhase`, `unlockAfterOver`, `defaultInnings` remain
3. **Add new properties** (optional):
   - `lockAfterOver?: number` - When event locks
   - `notificationSent?: boolean` - Track if users were notified
   - `unlockTime?: Date` - Actual unlock timestamp
   - `lockTime?: Date` - Actual lock timestamp

4. **Migration Strategy**:
   - Existing events without `matchPhase` default to `Pre-Match`
   - Existing events without `unlockAfterOver` default to `0` (unlock at start)
   - Existing events remain functional

---

## Example: Sequential Event Flow for T20 Match

### Timeline Example:

**T-30 minutes (Pre-Match)**:
- ✅ Unlocked: Toss Winner, Toss Decision, Match Winner, First Innings Score Range
- 🔒 Locked: All in-match events

**T+0 (Match Starts, Over 0)**:
- ✅ Unlocked: First Ball Runs, First Boundary Over, Powerplay Events (Overs 1-6)
- 🔒 Locked: Middle Overs events, Death Overs events

**T+6 overs (End of Powerplay)**:
- ✅ Unlocked: Middle Overs events (Overs 7-15)
- 🔒 Locked: Powerplay events (now locked, predictions closed)

**T+15 overs (End of Middle Overs)**:
- ✅ Unlocked: Death Overs events (Overs 16-20)
- 🔒 Locked: Middle Overs events

**T+20 overs (End of First Innings)**:
- ✅ Unlocked: Innings Break events (Target Prediction, etc.)
- 🔒 Locked: All First Innings events

**T+20.1 overs (Start of Second Innings)**:
- ✅ Unlocked: Second Innings Powerplay events
- 🔒 Locked: Innings Break events

**T+26 overs (End of Second Innings Powerplay)**:
- ✅ Unlocked: Second Innings Middle Overs events
- 🔒 Locked: Second Innings Powerplay events

**T+35 overs (End of Second Innings Middle Overs)**:
- ✅ Unlocked: Second Innings Death Overs events
- 🔒 Locked: Second Innings Middle Overs events

**T+40 overs (Match Ends)**:
- ✅ Unlocked: Post-Match events (final results)
- 🔒 Locked: All in-match events

---

## Key Benefits

1. **Continuous Engagement**: Users must check back throughout the match
2. **Fair Play**: Prevents users from making all predictions upfront
3. **Real-Time Strategy**: Users can adjust predictions based on match progress
4. **Increased Retention**: More reasons to stay engaged during the match
5. **Format-Specific**: Tailored experience for T20, ODI, and Test matches
6. **DRS Integration**: Modern cricket features included

---

## Next Steps (When Ready to Implement)

1. ✅ **Phase 1**: Extend `MatchPhase` type with format-specific phases
2. ✅ **Phase 2**: Add more event templates for each format
3. ✅ **Phase 3**: Implement event unlocking/locking logic
4. ✅ **Phase 4**: Update UI to show sequential events
5. ✅ **Phase 5**: Add notifications for event unlocks
6. ✅ **Phase 6**: Add countdown timers and live updates
7. ✅ **Phase 7**: Test with sample matches (T20, ODI, Test)

---

## Notes

- This plan maintains **100% backward compatibility** with existing events
- All current events will continue to work
- New events can be added incrementally
- The system can be enhanced gradually without breaking changes

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Planning Phase - No Development Yet

