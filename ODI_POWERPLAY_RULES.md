# ODI Powerplay Rules - Reference Guide

## Overview

One Day International (ODI) cricket matches have **three distinct powerplay phases** with specific fielding restrictions. These rules significantly impact match strategy and should be reflected in fantasy cricket events.

---

## Powerplay Phases

### Powerplay 1 (P1): Overs 1-10

**Duration**: Overs 1 to 10 (Mandatory)  
**Fielding Restriction**: Maximum of **2 fielders** allowed outside the 30-yard circle

**Characteristics:**
- Most restrictive fielding rules
- Typically highest scoring rate per over
- Batting team tries to maximize runs early
- Fielding team focuses on taking early wickets
- Strategic importance: Sets the tone for the innings

**Key Events:**
- Powerplay 1 Total Runs (Overs 1-10)
- Powerplay 1 Wickets
- Score After Over 5
- Score After Over 10
- Powerplay 1 Boundaries
- Powerplay 1 Sixes

---

### Powerplay 2 (P2): Overs 11-40

**Duration**: Overs 11 to 40 (30 overs)  
**Fielding Restriction**: Maximum of **4 fielders** allowed outside the 30-yard circle

**Note**: This is also referred to as the **Middle Overs** period. It is NOT a traditional "powerplay" but rather the consolidation phase.

**Characteristics:**
- Middle overs period (longest phase)
- Batting team consolidates position
- Fielding team tries to control run rate
- Strategic phase for building partnerships
- Lower scoring rate compared to powerplays
- Focus on rotating strike and building platform

**Key Events:**
- Score After Over 25
- Score After Over 30
- Score After Over 35
- Score After Over 40
- Wickets After Over 25/30/40
- First 100 Partnership Over
- Run Rate After Over 30/40

---

### Powerplay 3 (P3): Overs 41-50

**Duration**: Overs 41 to 50 (Death Overs)  
**Fielding Restriction**: Maximum of **5 fielders** allowed outside the 30-yard circle

**Note**: This is the **second powerplay** (also called Death Overs Powerplay). The naming can be confusing - it's "Powerplay 2" in terms of powerplay phases, but "P3" when counting all phases.

**Characteristics:**
- Final powerplay phase
- Batting team goes for maximum runs
- Fielding team tries to restrict scoring
- Most aggressive batting phase
- High risk, high reward
- Critical for setting/chasing targets

**Key Events:**
- Score After Over 45
- Final Innings Score
- Powerplay 2 Total Runs (Overs 41-50)
- Wickets Lost
- 300+ Score Achieved
- 400+ Score Achieved
- Last Over Runs

---

## Fielding Restrictions Summary

| Phase | Overs | Max Fielders Outside 30-yard Circle | Common Name |
|-------|-------|-------------------------------------|-------------|
| **P1** | 1-10 | 2 fielders | Mandatory Powerplay |
| **P2** | 11-40 | 4 fielders | Middle Overs |
| **P3** | 41-50 | 5 fielders | Death Overs Powerplay |

---

## Strategic Implications

### For Batting Team

**Powerplay 1 (Overs 1-10):**
- Aggressive approach to maximize runs
- Take advantage of fielding restrictions
- Risk vs. reward: High scoring but risk of early wickets
- Target: 50-70 runs typically

**Middle Overs (Overs 11-40):**
- Consolidate position
- Build partnerships
- Rotate strike
- Set platform for final push
- Target: 4-5 runs per over typically

**Powerplay 2 (Overs 41-50):**
- Maximum aggression
- Clear the boundary
- Accelerate scoring rate
- Target: 8-10+ runs per over typically

### For Fielding Team

**Powerplay 1 (Overs 1-10):**
- Focus on early wickets
- Contain aggressive batting
- Use best bowlers
- Target: Restrict to 40-50 runs, take 1-2 wickets

**Middle Overs (Overs 11-40):**
- Control run rate
- Build pressure
- Break partnerships
- Target: 4-5 runs per over, take wickets

**Powerplay 2 (Overs 41-50):**
- Minimize damage
- Use death bowling specialists
- Vary pace and length
- Target: Restrict to 50-60 runs

---

## Event Timing & Locking Rules

### Powerplay 1 Events
- **Unlock**: Over 0 (match start)
- **Lock**: After Over 10 completes
- **Status Flow**: `upcoming` → `live` → `locked`

### Middle Overs Events
- **Unlock**: After Over 10 completes
- **Lock**: After Over 40 completes
- **Status Flow**: `upcoming` → `live` → `locked`

### Powerplay 2 Events
- **Unlock**: After Over 40 completes
- **Lock**: After Over 50 completes (or innings ends)
- **Status Flow**: `upcoming` → `live` → `locked`

---

## Common Event Categories by Phase

### Powerplay 1 (Overs 1-10)
- Total Runs
- Wickets Lost
- Boundaries (4s)
- Sixes
- Dot Balls
- Run Rate
- Score After Over 5
- Score After Over 10

### Middle Overs (Overs 11-40)
- Score After Over 15/20/25/30/35/40
- Wickets After Over 25/30/40
- Run Rate After Over 30/40
- Partnership Milestones
- Consolidation Metrics

### Powerplay 2 (Overs 41-50)
- Score After Over 45
- Final Innings Score
- Powerplay 2 Total Runs
- Wickets Lost
- 300+ Score
- 400+ Score
- Last Over Runs

---

## Naming Conventions

### Phase Names (for Code/Events)
- `First Innings - Powerplay 1 (Overs 1-10)`
- `First Innings - Middle Overs (Overs 11-40)`
- `First Innings - Powerplay 2 (Overs 41-50)`
- `Second Innings - Powerplay 1 (Overs 1-10)`
- `Second Innings - Middle Overs (Overs 11-40)`
- `Second Innings - Powerplay 2 (Overs 41-50)`

### Display Names (for UI)
- **Powerplay 1**: "Powerplay 1 (Overs 1-10)" or "Mandatory Powerplay"
- **Middle Overs**: "Middle Overs (Overs 11-40)" or "Consolidation Phase"
- **Powerplay 2**: "Powerplay 2 (Overs 41-50)" or "Death Overs Powerplay"

---

## Comparison with T20 Powerplays

| Format | Powerplay 1 | Middle Phase | Powerplay 2 |
|--------|-------------|--------------|-------------|
| **T20** | Overs 1-6 (2 outside) | Overs 7-15 | Overs 16-20 (5 outside) |
| **ODI** | Overs 1-10 (2 outside) | Overs 11-40 (4 outside) | Overs 41-50 (5 outside) |

**Key Differences:**
- ODI has longer powerplay phases
- ODI has a much longer middle overs period (30 overs vs 9 overs)
- ODI middle overs have fielding restrictions (4 outside) vs T20 (unrestricted)

---

## Implementation Notes

1. **Phase Detection**: Use over ranges to determine current phase
2. **Event Unlocking**: Events unlock when their phase begins
3. **Event Locking**: Events lock when their phase ends
4. **Fielding Restrictions**: Document but may not need to track as events
5. **Naming**: Use consistent terminology across codebase

---

## Example Events by Phase

### Powerplay 1 Example Events
```
- ODI First Innings Powerplay 1 Total Runs (Overs 1-10)
  Options: ['0-40', '41-50', '51-60', '61-70', '71+']
  Points: 60, Difficulty: Medium
  Unlock: Over 0, Lock: After Over 10

- ODI First Innings Score After Over 5
  Options: ['0-20', '21-30', '31-40', '41-50', '51+']
  Points: 40, Difficulty: Easy
  Unlock: Over 0, Lock: After Over 5
```

### Middle Overs Example Events
```
- ODI First Innings Score After Over 30
  Options: ['0-120', '121-150', '151-180', '181-210', '211+']
  Points: 75, Difficulty: Medium
  Unlock: After Over 10, Lock: After Over 30

- ODI First Innings Wickets After Over 30
  Options: ['0-2', '3', '4', '5', '6+']
  Points: 55, Difficulty: Medium
  Unlock: After Over 10, Lock: After Over 30
```

### Powerplay 2 Example Events
```
- ODI Final First Innings Score
  Options: ['0-200', '201-250', '251-300', '301-350', '351-400', '401+']
  Points: 100, Difficulty: Hard
  Unlock: After Over 40, Lock: After Over 50

- ODI 300+ Score Achieved
  Options: ['Yes', 'No']
  Points: 60, Difficulty: Medium
  Unlock: Over 0, Lock: After Over 50
```

---

## References

- ICC ODI Playing Conditions
- Current Implementation: `src/firebase/firestore/cricket-matches.ts`
- Implementation Plan: `ODI_POWERPLAY_RULES_PLAN.md`

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Reference Guide

