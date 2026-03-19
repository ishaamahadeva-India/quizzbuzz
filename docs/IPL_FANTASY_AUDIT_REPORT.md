# IPL Fantasy System — Full Audit Report

**Audit scope:** Unified multi-role fantasy engine (batsman, bowler, all-rounder, captain, emerging, underrated).  
**Collection in use:** `ipl_user_picks` (not `ipl_user_team`).  
**Date:** Generated from current codebase.

---

## 1. Core Data Model

### 1.1 Collection name and fields

| Spec expectation | Implementation | Status |
|------------------|----------------|--------|
| Collection `ipl_user_team` | Collection `ipl_user_picks` | ⚠️ **Naming only** — same logical “user team”; no migration to `ipl_user_team`. |
| `userId` | `userId` | ✅ |
| `tournamentId` | `tournamentId` | ✅ |
| `batsmanId` | `currentBatsmanId` (root); `matchSelections[m].batsmanId` (locked) | ✅ |
| `bowlerId` | `bowlerId` (optional) | ✅ |
| `allRounderId` | `allRounderId` (optional) | ✅ |
| `captainId` | `captainId` (optional) | ✅ |
| `emergingPlayerId` | `emergingPlayerId` (optional) | ✅ |
| `underratedPlayerId` | Not present | ❌ **Missing** — underrated is implemented as selection-% multiplier on **batsman only**, not a separate slot. |
| `totalPoints` | `totalPoints` | ✅ |
| Switches per role | `switchCountBatsman`, `switchCountBowler`, `switchCountAllRounder`, `switchCountCaptain`, `switchCountEmerging` (+ legacy `switchCount`) | ✅ |
| `freeSwitchesLeft` | `freeSwitchesLeft` | ✅ |
| History array | `history: IPLUserPickHistoryEntry[]` | ✅ |

### 1.2 History entry shape

| Spec field | Implementation | Status |
|------------|----------------|--------|
| `matchId` | `matchId` | ✅ |
| `batsmanPoints` | `batsmanPoints` | ✅ |
| `bowlerPoints` | `bowlerPoints` | ✅ |
| `allRounderPoints` | `allRounderPoints` | ✅ |
| `captainBonus` | `captainPoints` (same meaning) | ✅ |
| `emergingBonus` | `emergingPoints` (same meaning) | ✅ |
| `underratedMultiplier` | Not stored in new entries; legacy `multiplier` on old batsman-only entries | ⚠️ **Needs improvement** — multiplier not persisted in multi-role history (cannot show “You earned 3x” from history). |
| `switchPenalty` | Not stored in match-completion entry; penalty applied at **switch time** to `totalPoints` | ⚠️ **Design difference** — penalty is applied when user switches, not at match completion; history does not record per-match penalty. |
| `totalMatchPoints` | `totalMatchPoints` | ✅ |

**Summary (1):**  
✅ Model is unified and multi-role; ✅ switches and free switches per role; ✅ history has per-role points and `totalMatchPoints`.  
❌ No `underratedPlayerId` (underrated = batsman selection % only).  
⚠️ History does not store `selectionPercentage`/`multiplier` or `switchPenalty` for new entries.

---

## 2. Points Engine (All Roles)

### 2.1 Batsman

- **Implementation:** `calculateBatsmanBasePoints` in `src/lib/ipl-fantasy-engines.ts`
- runs×1, fours×2, sixes×3; 30+ → +5, 50+ → +10, 100+ → +25; SR>150 → +10; SR<100 → −5; 0 runs → −10.  
- **Status:** ✅ **Fully correct**

### 2.2 Bowler

- **Implementation:** `calculateBowlerBasePoints`
- wickets×20; 3+ wickets → +10; 5+ wickets → +20; economy &lt; 6 → +10; economy &gt; 10 → −10.  
- **Status:** ✅ **Fully correct** (relies on `player_match_stats.economy`)

### 2.3 All-rounder

- **Implementation:** `calculateAllRounderBasePoints` = batting + bowling + 15 if runs≥30 and wickets≥2.  
- **Status:** ✅ **Fully correct**

### 2.4 Captain

- **Implementation:** `calculateCaptainBonusPoints`: +20 if player’s team = `winnerTeamId`; +10 if runs&gt;30 or wickets≥2.  
- **Status:** ✅ **Fully correct** (requires `IPLMatch.winnerTeamId` and player’s `team`)

### 2.5 Emerging player

- **Implementation:** `applyEmergingMultiplier(points, isEmerging)`: 1.5× when `isEmerging` true. Applied to all-rounder-style base for the emerging slot.  
- **Status:** ✅ **Fully correct**

**Summary (2):** ✅ All five role point rules implemented and consistent with spec.

---

## 3. Underrated Multiplier

### 3.1 Selection percentage

- **Implementation:** `player_selection_stats`: `selectionPercentage = (totalSelections / totalUsersInMatch) * 100`; `updateSelectionPercentagesForMatch` recalculates after lock.  
- **Status:** ✅ **Fully correct**

### 3.2 Multiplier logic

- **Implementation:** `getMultiplierFromSelectionPercentage`: &lt;5% → 3, &lt;10% → 2, &lt;20% → 1.5, else 1.  
- **Status:** ✅ **Fully correct**

### 3.3 Where multiplier is applied

- **Implementation:** Multiplier is applied **only to batsman base points** in match completion (`calculateFinalPoints(base, mult)` for batsman). It is **not** applied to total match points or to other roles.  
- **Spec expectation (audit):** “multiplier is applied to TOTAL match points (not just one role)”.  
- **Status:** ❌ **Incorrect vs spec** — multiplier is applied to batsman only; total match points are not multiplied.

**Suggested fix (if spec is required):** Either (a) document that underrated applies to batsman only, or (b) define and implement “underrated” for total (e.g. apply multiplier to `totalMatchPoints` when a designated underrated slot or condition is met).

---

## 4. Switching System

### 4.1 Per-role switching

- **Implementation:** `updateIPLUserPickBatsman` and `updateIPLUserPickRole(role, …)` for bowler, allRounder, captain, emerging; `clearIPLUserPickRole` for clearing optional roles.  
- **Status:** ✅ **Fully correct**

### 4.2 Penalty per role change

- **Implementation:** −20 points when no free switch (`SWITCH_PENALTY_POINTS = 20`); applied immediately to `totalPoints` on switch; `freeSwitchesLeft` shared across all roles.  
- **Status:** ✅ **Fully correct**

### 4.3 Switches tracked per role

- **Implementation:** `switchCountBatsman`, `switchCountBowler`, etc. incremented when penalty path is used.  
- **Status:** ✅ **Fully correct**

### 4.4 Penalty in totalMatchPoints

- **Implementation:** Switch penalty is **not** part of match completion. It is applied at **lock/switch time** and reflected in `totalPoints` only. History entries do not include a `switchPenalty` field.  
- **Status:** ⚠️ **Design choice** — penalty is correct and per-role; it is just not stored per match in history.

**Summary (4):** ✅ Switching and penalty behavior correct; ⚠️ penalty not stored in history.

---

## 5. Match Processing

### 5.1 Flow

- Fetches `player_match_stats` by match, `ipl_user_picks` by tournament, `getSelectionStatsForMatch`, match (for `winnerTeamId`), and players (for team / `isEmerging`).  
- For each user with any locked selection for the match: computes batsman (with multiplier), bowler, all-rounder, captain, emerging points; sums `totalMatchPoints`; appends one history entry; updates `totalPoints` in batch.  
- **Status:** ✅ **Fully correct** for single run

### 5.2 Duplicate calculations

- **Implementation:** No duplicate logic; each role’s points computed once per user per match.  
- **Status:** ✅ **Fully correct**

### 5.3 Re-run handling

- **Implementation:** **No guard** against re-running completion for the same match. Each run appends a new history entry and adds `totalMatchPoints` again to `totalPoints`.  
- **Status:** ❌ **Missing** — re-running `processIPLMatchCompletion` for the same match will double (or more) points and duplicate history.

**Suggested fix:** Before processing, exclude users who already have a history entry for this `matchId`, or make completion idempotent (e.g. “set history entry for matchId” instead of append).

---

## 6. Leaderboard

### 6.1 Sorting and rank

- **Implementation:** `sorted = [...picks].sort((a, b) => b.totalPoints - a.totalPoints)`; `rank = index + 1`.  
- **Status:** ✅ **Fully correct**

### 6.2 All roles reflected

- **Implementation:** `totalPoints` is updated by match completion from sum of all role points (and already includes switch penalties applied at switch time). Leaderboard reads `totalPoints`.  
- **Status:** ✅ **Fully correct**

### 6.3 Updates after match

- **Implementation:** Leaderboard uses `subscribeIPLLeaderboard` (onSnapshot on `ipl_user_picks`). When match completion updates `totalPoints`, listener fires and UI updates.  
- **Status:** ✅ **Fully correct**

**Summary (6):** ✅ Leaderboard correct and real-time; reflects all roles.

---

## 7. Real-time System

- **Implementation:** `subscribeIPLUserPick` and `subscribeIPLLeaderboard` use Firestore `onSnapshot`.  
- **Status:** ✅ **Fully correct**

---

## 8. UI (Multi-role)

### 8.1 Multi-role selection

- **Implementation:** Match page uses tabs: Batsman, Bowler, All-Rounder, Captain, Emerging; one selection per role; batsman required.  
- **Status:** ✅ **Fully correct**

### 8.2 Player cards per role

- **Implementation:** Each tab shows filtered/all players as cards; role-specific filters (e.g. batsman/bowler/allrounder) where applicable.  
- **Status:** ✅ **Fully correct**

### 8.3 Selection percentage

- **Implementation:** Shown on **batsman** tab (“Selection: X%”, “Underrated pick” when &lt;10%). Other roles do not show selection %.  
- **Status:** ✅ **Fully correct** (multiplier only used for batsman)

### 8.4 Switching warnings per role

- **Implementation:** `switchWarningsByRole` computed per role; confirm modal shows a single warning when any role has a change (with free switch or −20 message).  
- **Status:** ✅ **Fully correct**

### 8.5 Leaderboard UI

- **Implementation:** Rank, points, “You” highlight, top-3 icons.  
- **Status:** ✅ **Fully correct**

**Summary (8):** ✅ Multi-role UI and leaderboard in place and consistent.

---

## 9. Edge Cases

### 9.1 Player not in playing XI / missing stats

- **Implementation:** If `player_match_stats` has no doc for a locked player, match completion pushes an error and leaves that role’s points as 0; other roles still scored; one history entry with `totalMatchPoints` still written.  
- **Status:** ✅ **Handled** (degraded gracefully)

### 9.2 Multiple switches

- **Implementation:** Each role change (after free switch exhausted) applies −20 and updates per-role switch count.  
- **Status:** ✅ **Fully correct**

### 9.3 Switching after lock time

- **Implementation:** UI disables selection 30 minutes before match start (`isLocked`); lock time not re-checked on server in match completion. If client time is wrong or API is called directly, late changes could theoretically be locked.  
- **Status:** ⚠️ **Needs improvement** — consider enforcing lock window in Firestore rules or in a backend/Cloud Function that writes `matchSelections`.

**Summary (9):** ✅ Missing stats and multiple switches handled; ⚠️ server-side lock-time enforcement not verified.

---

## 10. Data Consistency

### 10.1 History vs totalPoints

- **Implementation:** Match completion does `newTotal = pick.totalPoints + totalMatchPoints` and appends one entry. Switch penalties are applied at switch time to `totalPoints`. No reconciliation of “sum(history)” vs `totalPoints`.  
- **Status:** ⚠️ **Needs improvement** — if completion is re-run or bugs occur, `totalPoints` can drift from sum of history; no validation or repair path.

### 10.2 Negative inconsistencies

- **Implementation:** `totalPoints` is clamped with `Math.max(0, …)` when applying switch penalty.  
- **Status:** ✅ **No negative totalPoints from penalty**

### 10.3 Duplicate match entries

- **Implementation:** No check for existing history entry for same `matchId`; re-run causes duplicate entries.  
- **Status:** ❌ **Missing** — same as re-run handling in Section 5.

**Summary (10):** ✅ No negative totals from current logic; ❌ re-run creates duplicate history and wrong total; ⚠️ no sum(history) vs totalPoints check.

---

## 11. Summary Table

| Section | Result | Notes |
|--------|--------|--------|
| 1. Core data model | ⚠️ Needs improvement | Collection name differs; no `underratedPlayerId`; history missing multiplier/penalty fields for new entries. |
| 2. Points engine (all roles) | ✅ Fully correct | Batsman, bowler, all-rounder, captain, emerging implemented per spec. |
| 3. Underrated multiplier | ❌ Incorrect vs spec | Multiplier applied to batsman only, not to total match points. |
| 4. Switching system | ✅ Fully correct | Per-role switching and −20 penalty; penalty not in history by design. |
| 5. Match processing | ❌ Re-run unsafe | No idempotency; re-run duplicates history and inflates totalPoints. |
| 6. Leaderboard | ✅ Fully correct | Sort, rank, real-time, all roles in totalPoints. |
| 7. Real-time | ✅ Fully correct | onSnapshot for pick and leaderboard. |
| 8. UI multi-role | ✅ Fully correct | Tabs, cards, selection %, switch warnings, leaderboard. |
| 9. Edge cases | ⚠️ Needs improvement | Missing stats handled; server-side lock time not enforced. |
| 10. Data consistency | ❌ Re-run / duplicates | totalPoints can diverge; duplicate history if completion re-run. |

---

## 12. Recommended Fixes (no code rewrite)

1. **Re-run safety:** In `processIPLMatchCompletion`, skip users who already have a history entry for this `matchId`, or replace “append + add totalMatchPoints” with an idempotent “set entry for matchId” and recalc total from history.
2. **Underrated vs spec:** Either document “underrated applies to batsman only” or implement application of multiplier to total match points (or to a dedicated underrated slot) and document behavior.
3. **History transparency (optional):** When writing multi-role history entries, add `selectionPercentage` and `multiplier` (and optionally `switchPenalty` if you decide to store it at completion) so post-match UI can show “You earned 3x” and penalty breakdown.
4. **Lock time (optional):** Enforce “no writes to matchSelections for this match after lock time” in Firestore rules or in a trusted backend to avoid late locks.

---

---

## 13. Fixes applied (post-audit)

- **Data model:** Added `underratedPlayerId` to pick and `IPLMatchSelection`; added `switchPenalty` to `IPLMatchSelection`. History entry now includes `selectionPercentage`, `multiplier`, `switchPenalty`; backward compat for old entries (defaults when missing).
- **Underrated multiplier:** Now applied to **full base total** (all roles); `totalMatchPoints = (baseTotal * multiplier) + switchPenalty`; multiplier from `underratedPlayerId` selection % (fallback batsman).
- **Server-side lock:** `GET /api/ipl/validate-lock?matchId=` uses server time; client calls before lock and rejects if `locked`.
- **Idempotency:** `processIPLMatchCompletion` finds existing history entry by `matchId`; replaces if exists, else appends; no duplicate entries.
- **Total points consistency:** After any history update, `totalPoints = recalcTotalFromHistory(history)` (sum of `totalMatchPoints` or legacy `finalPoints + penalty`).
- **Switch penalty storage:** `switchPenalty` passed at lock time and stored in `matchSelections[matchId]` and in history entry.
- **Tests:** `tests/ipl-fantasy.test.ts` (run: `npm run test:ipl`).

*End of audit.*
