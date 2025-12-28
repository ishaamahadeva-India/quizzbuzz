# ODI Powerplay Rules - Implementation Plan

## Overview

This document outlines the plan for implementing correct ODI Powerplay Rules in the fantasy cricket application. ODI matches have **three distinct powerplay phases** with specific fielding restrictions that affect gameplay and event predictions.

---

## Current State Analysis

### Current Implementation Issues

1. **Incorrect Phase Naming:**
   - Current: "Powerplay 2 (Overs 11-40)" - This is actually the **Middle Overs** period
   - Current: "Powerplay 3 (Overs 41-50)" - This should be **Powerplay 2**
   - Missing: Proper distinction between powerplay phases and middle overs

2. **Missing Fielding Restrictions:**
   - No tracking of fielding restrictions (30-yard circle rules)
   - No events related to fielding restrictions
   - No documentation of powerplay rules

3. **Event Templates:**
   - Some events incorrectly reference "Powerplay 2" for overs 31-40
   - Need to align event naming with correct powerplay phases

---

## Correct ODI Powerplay Rules

### Powerplay 1 (P1): Overs 1-10
- **Duration**: Overs 1 to 10 (Mandatory)
- **Fielding Restriction**: Maximum of **2 fielders** allowed outside the 30-yard circle
- **Characteristics**: 
  - Most restrictive fielding rules
  - Typically highest scoring rate
  - Batting team tries to maximize runs
  - Fielding team focuses on early wickets

### Powerplay 2 (P2): Overs 11-40
- **Duration**: Overs 11 to 40 (30 overs)
- **Fielding Restriction**: Maximum of **4 fielders** allowed outside the 30-yard circle
- **Characteristics**:
  - Middle overs period
  - Batting team consolidates position
  - Fielding team tries to control run rate
  - Strategic phase for building partnerships

### Powerplay 3 (P3): Overs 41-50
- **Duration**: Overs 41 to 50 (Death Overs)
- **Fielding Restriction**: Maximum of **5 fielders** allowed outside the 30-yard circle
- **Characteristics**:
  - Final powerplay phase
  - Batting team goes for maximum runs
  - Fielding team tries to restrict scoring
  - Most aggressive batting phase

---

## Implementation Plan

### Phase 1: Documentation & Planning ✅ (Current Phase)

**Tasks:**
- [x] Create comprehensive plan document
- [x] Document correct powerplay rules
- [x] Identify current implementation issues
- [x] Plan event template updates

**Deliverables:**
- ODI Powerplay Rules Plan document (this file)
- Updated event phase documentation

---

### Phase 2: Update Type Definitions

**File**: `src/firebase/firestore/cricket-matches.ts`

**Changes Required:**

1. **Update MatchPhase Type:**
   ```typescript
   // Current (INCORRECT):
   | 'First Innings - Powerplay 2 (Overs 11-40)'
   | 'First Innings - Powerplay 3 (Overs 41-50)'
   
   // Should be (CORRECT):
   | 'First Innings - Middle Overs (Overs 11-40)'
   | 'First Innings - Powerplay 2 (Overs 41-50)'
   ```

2. **Add Powerplay Metadata Type:**
   ```typescript
   export type PowerplayPhase = {
     phase: 'P1' | 'P2' | 'P3';
     overs: { start: number; end: number };
     maxFieldersOutside: 2 | 4 | 5;
     description: string;
   };
   
   export const ODI_POWERPLAY_RULES: Record<'P1' | 'P2' | 'P3', PowerplayPhase> = {
     P1: {
       phase: 'P1',
       overs: { start: 1, end: 10 },
       maxFieldersOutside: 2,
       description: 'Mandatory powerplay with 2 fielders outside circle'
     },
     P2: {
       phase: 'P2',
       overs: { start: 11, end: 40 },
       maxFieldersOutside: 4,
       description: 'Middle overs with 4 fielders outside circle'
     },
     P3: {
       phase: 'P3',
       overs: { start: 41, end: 50 },
       maxFieldersOutside: 5,
       description: 'Death overs powerplay with 5 fielders outside circle'
     }
   };
   ```

**Tasks:**
- [ ] Update MatchPhase type definitions
- [ ] Add PowerplayPhase type
- [ ] Create ODI_POWERPLAY_RULES constant
- [ ] Update getCurrentMatchPhase() function
- [ ] Update getEventLockOver() function

---

### Phase 3: Update Phase Detection Logic

**File**: `src/firebase/firestore/cricket-matches.ts`

**Function**: `getCurrentMatchPhase()`

**Current Logic (Lines 384-405):**
```typescript
// ODI phases (3 powerplays: P1: 1-10, P2: 11-40, P3: 41-50)
if (format === 'ODI') {
  if (currentInnings === 1) {
    if (currentOver >= 0 && currentOver <= 10) {
      return 'First Innings - Powerplay 1 (Overs 1-10)';
    } else if (currentOver > 10 && currentOver <= 40) {
      return 'First Innings - Powerplay 2 (Overs 11-40)'; // ❌ WRONG NAME
    } else if (currentOver > 40 && currentOver <= 50) {
      return 'First Innings - Powerplay 3 (Overs 41-50)'; // ❌ WRONG NAME
    }
  }
}
```

**Updated Logic:**
```typescript
// ODI phases: P1: 1-10, Middle Overs: 11-40, P2: 41-50
if (format === 'ODI') {
  if (currentInnings === 1) {
    if (currentOver >= 0 && currentOver <= 10) {
      return 'First Innings - Powerplay 1 (Overs 1-10)';
    } else if (currentOver > 10 && currentOver <= 40) {
      return 'First Innings - Middle Overs (Overs 11-40)'; // ✅ CORRECT
    } else if (currentOver > 40 && currentOver <= 50) {
      return 'First Innings - Powerplay 2 (Overs 41-50)'; // ✅ CORRECT
    }
  } else if (currentInnings === 2) {
    const secondInningsOver = currentOver - 50;
    if (secondInningsOver >= 0 && secondInningsOver <= 10) {
      return 'Second Innings - Powerplay 1 (Overs 1-10)';
    } else if (secondInningsOver > 10 && secondInningsOver <= 40) {
      return 'Second Innings - Middle Overs (Overs 11-40)'; // ✅ CORRECT
    } else if (secondInningsOver > 40 && secondInningsOver <= 50) {
      return 'Second Innings - Powerplay 2 (Overs 41-50)'; // ✅ CORRECT
    }
  }
}
```

**Tasks:**
- [ ] Update getCurrentMatchPhase() for first innings
- [ ] Update getCurrentMatchPhase() for second innings
- [ ] Update getEventLockOver() function
- [ ] Add helper function to get powerplay phase info

---

### Phase 4: Update Event Templates

**File**: `src/firebase/firestore/cricket-matches.ts`

**Event Templates to Update:**

1. **Rename "Powerplay 2" events (Overs 31-40) to "Middle Overs":**
   - Current: `'ODI First Innings Powerplay 2 Total Runs (Overs 31-40)'`
   - Should be: `'ODI First Innings Middle Overs Score After Over 35'` or similar
   - Update matchPhase from `'First Innings - Powerplay 2 (Overs 31-40)'` to `'First Innings - Middle Overs (Overs 11-40)'`

2. **Rename "Powerplay 3" events (Overs 41-50) to "Powerplay 2":**
   - Current: `'First Innings - Powerplay 3 (Overs 41-50)'`
   - Should be: `'First Innings - Powerplay 2 (Overs 41-50)'`
   - Update all event templates with this phase

3. **Add New Powerplay-Specific Events:**
   - Powerplay 1 fielding restriction events
   - Powerplay 2 (death overs) specific events
   - Middle overs consolidation events

**Specific Events to Update:**

| Current Event | Current Phase | New Phase | Status |
|--------------|---------------|-----------|--------|
| ODI First Innings Powerplay 2 Total Runs (Overs 31-40) | Powerplay 2 (Overs 31-40) | Middle Overs (Overs 11-40) | ❌ Needs Update |
| ODI First Innings Score After Over 35 | Powerplay 2 (Overs 31-40) | Middle Overs (Overs 11-40) | ❌ Needs Update |
| ODI First Innings Score After Over 40 | Powerplay 2 (Overs 31-40) | Middle Overs (Overs 11-40) | ❌ Needs Update |
| ODI First Innings Score After Over 45 | Powerplay 3 (Overs 41-50) | Powerplay 2 (Overs 41-50) | ❌ Needs Update |
| ODI Final First Innings Score | Powerplay 3 (Overs 41-50) | Powerplay 2 (Overs 41-50) | ❌ Needs Update |

**Tasks:**
- [ ] Update all event template matchPhase references
- [ ] Rename "Powerplay 2" (11-40) to "Middle Overs"
- [ ] Rename "Powerplay 3" (41-50) to "Powerplay 2"
- [ ] Update event descriptions to reflect correct phases
- [ ] Add fielding restriction information to event rules

---

### Phase 5: Add Powerplay Rule Documentation

**New File**: `ODI_POWERPLAY_RULES.md` (or update existing docs)

**Content:**
- Detailed explanation of each powerplay phase
- Fielding restrictions for each phase
- Strategic implications
- Event timing and locking rules
- Examples of powerplay-specific events

**Tasks:**
- [ ] Create comprehensive powerplay rules documentation
- [ ] Add examples and use cases
- [ ] Document fielding restriction implications
- [ ] Add visual diagrams/tables

---

### Phase 6: Update UI Components (If Applicable)

**Areas to Check:**
- Event creation forms
- Event display components
- Match phase indicators
- Admin dashboards

**Tasks:**
- [ ] Review UI components that display phase names
- [ ] Update phase labels in UI
- [ ] Add powerplay phase indicators
- [ ] Display fielding restrictions in event details

---

### Phase 7: Testing & Validation

**Test Cases:**

1. **Phase Detection:**
   - [ ] Test getCurrentMatchPhase() for all ODI phases
   - [ ] Verify correct phase returned for each over range
   - [ ] Test both first and second innings

2. **Event Unlocking:**
   - [ ] Verify events unlock at correct over numbers
   - [ ] Verify events lock at correct over numbers
   - [ ] Test sequential event unlocking

3. **Event Templates:**
   - [ ] Verify all ODI events have correct matchPhase
   - [ ] Verify event descriptions are accurate
   - [ ] Test event filtering by format

4. **Edge Cases:**
   - [ ] Test over 0 (pre-match)
   - [ ] Test exact boundary overs (10, 40, 50)
   - [ ] Test innings break transitions

**Tasks:**
- [ ] Create test suite for phase detection
- [ ] Create test suite for event unlocking
- [ ] Manual testing of event creation flow
- [ ] Validate all ODI event templates

---

## Updated Phase Structure

### First Innings ODI Phases

| Phase | Overs | Fielding Restriction | Description |
|-------|-------|---------------------|-------------|
| **Powerplay 1 (P1)** | 1-10 | Max 2 outside circle | Mandatory powerplay, most restrictive |
| **Middle Overs** | 11-40 | Max 4 outside circle | Consolidation phase, strategic play |
| **Powerplay 2 (P2)** | 41-50 | Max 5 outside circle | Death overs, final powerplay |

### Second Innings ODI Phases

| Phase | Overs | Fielding Restriction | Description |
|-------|-------|---------------------|-------------|
| **Powerplay 1 (P1)** | 1-10 | Max 2 outside circle | Chasing team's start |
| **Middle Overs** | 11-40 | Max 4 outside circle | Chase consolidation |
| **Powerplay 2 (P2)** | 41-50 | Max 5 outside circle | Final chase phase |

---

## Event Template Updates Summary

### Events Requiring Phase Name Changes

**From "Powerplay 2 (Overs 11-40)" to "Middle Overs (Overs 11-40)":**
- ODI First Innings Powerplay 2 Total Runs (Overs 31-40) → Rename to Middle Overs event
- ODI First Innings Score After Over 35
- ODI First Innings Score After Over 40
- ODI First Innings Wickets After Over 40
- Similar second innings events

**From "Powerplay 3 (Overs 41-50)" to "Powerplay 2 (Overs 41-50)":**
- ODI First Innings Score After Over 45
- ODI Final First Innings Score
- ODI First Innings Wickets Lost
- ODI 300+ Score Achieved
- ODI 400+ Score Achieved
- Similar second innings events

---

## Implementation Checklist

### Documentation
- [x] Create implementation plan
- [ ] Update EVENT_PHASES_DETAILED_BREAKDOWN.md
- [ ] Create ODI_POWERPLAY_RULES.md
- [ ] Update HOW_TO_USE_SEQUENTIAL_EVENTS.md

### Code Changes
- [ ] Update MatchPhase type definitions
- [ ] Add PowerplayPhase type and constants
- [ ] Update getCurrentMatchPhase() function
- [ ] Update getEventLockOver() function
- [ ] Update all ODI event templates
- [ ] Add helper functions for powerplay info

### Testing
- [ ] Unit tests for phase detection
- [ ] Unit tests for event unlocking
- [ ] Integration tests for event creation
- [ ] Manual testing of complete flow

### UI Updates (if needed)
- [ ] Update phase labels in UI
- [ ] Add powerplay indicators
- [ ] Display fielding restrictions

---

## Key Considerations

1. **Backward Compatibility:**
   - Existing matches may have events with old phase names
   - Consider migration strategy for existing data
   - Or maintain both old and new phase names temporarily

2. **Event Naming Consistency:**
   - Ensure all ODI events follow consistent naming
   - Use "Powerplay 1", "Middle Overs", "Powerplay 2" terminology
   - Avoid confusion with T20 powerplay naming

3. **Fielding Restrictions:**
   - While fielding restrictions are important rules, they may not need to be tracked as events
   - Consider if we need events specifically about fielding restrictions
   - Or just document them for user understanding

4. **Documentation:**
   - Update all documentation to reflect correct powerplay rules
   - Ensure consistency across all docs
   - Add examples and use cases

---

## Timeline Estimate

- **Phase 1 (Documentation)**: ✅ Complete
- **Phase 2 (Type Definitions)**: 2-3 hours
- **Phase 3 (Phase Detection)**: 2-3 hours
- **Phase 4 (Event Templates)**: 4-6 hours
- **Phase 5 (Documentation)**: 2-3 hours
- **Phase 6 (UI Updates)**: 2-4 hours (if needed)
- **Phase 7 (Testing)**: 3-4 hours

**Total Estimated Time**: 15-23 hours

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Start with Phase 2** (Type Definitions) as foundation
4. **Implement incrementally** with testing after each phase
5. **Update documentation** as changes are made

---

## References

- [ICC ODI Playing Conditions](https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions)
- Current codebase: `src/firebase/firestore/cricket-matches.ts`
- Event documentation: `EVENT_PHASES_DETAILED_BREAKDOWN.md`

---

**Document Version**: 1.0  
**Created**: [Current Date]  
**Status**: Planning Complete - Ready for Implementation

