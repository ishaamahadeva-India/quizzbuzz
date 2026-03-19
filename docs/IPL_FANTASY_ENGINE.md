# IPL Fantasy Engine — Implementation Summary

## Overview

Skill-based IPL fantasy: users pick a **multi-role team** per match (batsman required; bowler, all-rounder, captain, emerging optional), earn points from real match stats, get **underrated multipliers on the batsman** only, and can switch per role with the same penalty rules.

---

## Multi-role upgrade (same collection: `ipl_user_picks`)

The user “team” document extends the original model (no new collection, no deletion of data):

| Field | Purpose |
|-------|---------|
| `currentBatsmanId` | Batsman (unchanged; legacy name kept) |
| `bowlerId`, `allRounderId`, `captainId`, `emergingPlayerId` | Optional role picks |
| `matchSelections[matchId]` | Object `{ batsmanId?, bowlerId?, ... }` or **legacy string** = batsman only |
| `switchCountBatsman` … `switchCountEmerging` | Per-role switch counts (penalty path) |
| `switchCount` | Legacy global counter (still incremented on batsman / role penalties) |

**Engines** (`ipl-fantasy-engines.ts`): `calculateBowlerBasePoints`, `calculateAllRounderBasePoints`, `calculateCaptainBonusPoints`, `applyEmergingMultiplier` (1.5× when `ipl_players.isEmerging`).

**Match completion** sums `totalMatchPoints` from all filled roles; history entries include `totalMatchPoints` plus per-role points. Legacy history rows keep `playerId` / `finalPoints` (batsman-only).

**Captain**: set `winnerTeamId` on `ipl_matches` when completing for +20 win bonus.

**Bowler economy**: set `economy` (and optionally `overs`) on `player_match_stats`.

---

## Phases Implemented

### Phase 1: Data models & security
- **Types** in `src/lib/types.ts`: `IPLPlayer`, `IPLMatch`, `PlayerMatchStats`, `IPLUserPick`, `IPLUserPickHistoryEntry`, `PlayerSelectionStats`, `matchSelections` on pick for per-match lock.
- **Firestore rules** in `firestore.rules`: `ipl_players`, `ipl_matches`, `player_match_stats`, `player_selection_stats`, `ipl_user_picks` (read/write as per spec).

### Phase 2: Firestore services
- **ipl-players.ts**: get all, by team, get one; add/update (admin).
- **ipl-matches.ts**: get all, upcoming, by status; add match; update status.
- **player-match-stats.ts**: get by match, by match+player; set stats (admin).
- **player-selection-stats.ts**: get by match, get one; increment/decrement selection count; `updateSelectionPercentagesForMatch`.
- **ipl-user-picks.ts**: get pick, subscribe (real-time), create pick (optional extra roles), update batsman (with switch penalty), `updateIPLUserPickRole`, `clearIPLUserPickRole`, `getCurrentPlayerIdForRole`, append history, get by tournament, subscribe leaderboard, `lockIPLUserPickForMatch` (locks full team object).

### Phase 3: Engines
- **src/lib/ipl-fantasy-engines.ts**:
  - `getMultiplierFromSelectionPercentage`: &lt;5% → 3, &lt;10% → 2, &lt;20% → 1.5, else 1 (**batsman only**).
  - `calculateBatsmanBasePoints`: runs, fours, sixes, milestones, strike rate, duck penalty.
  - `calculateFinalPoints`: base × multiplier.
  - Bowler / all-rounder / captain / emerging: see multi-role section above.

### Phase 4: Match completion
- **ipl-match-completion.ts**: `processIPLMatchCompletion` — resolves legacy `matchSelections` string to batsman; scores all locked roles; writes one history entry with `totalMatchPoints` and role breakdown.

### Phase 5: UI
- **/fantasy/ipl** — Hub: upcoming match, team selection CTA, leaderboard link.
- **/fantasy/ipl/match/[matchId]** — Role tabs (Batsman, Bowler, All-Rounder, Captain, Emerging); underrated badge on batsman tab; lock full team; per-role switch warnings in confirm modal.
- **/fantasy/ipl/leaderboard** — Real-time leaderboard (rank, points), current user highlighted.
- **Fantasy hub** — New “IPL Fantasy” card linking to `/fantasy/ipl`.

### Phase 6: Real-time
- Leaderboard uses `subscribeIPLLeaderboard` (onSnapshot).
- User pick can use `subscribeIPLUserPick` for live updates on selection page.

---

## Constants

- **Tournament ID**: `ipl_2026`
- **Lock**: 30 minutes before `matchStartTime`
- **Switch penalty**: 20 points (no penalty if `freeSwitchesLeft > 0`; default free switches = 1)

---

## Admin: Match completion flow

1. **Create match** (e.g. via Firestore or admin UI): `ipl_matches` with `teamA`, `teamB`, `matchStartTime`, `status: 'upcoming'`.
2. **Add players**: `ipl_players` with `name`, `team`, `role`, `isActive`.
3. **When match ends**: set `player_match_stats` for each player (include **`economy`** for bowlers). Set **`winnerTeamId`** on the match for captain bonuses.
4. **Run completion**: call `processIPLMatchCompletion(firestore, matchId, 'ipl_2026')` (e.g. from admin page or Cloud Function).
5. **Set match status**: `updateIPLMatchStatus(firestore, matchId, 'completed')`.

---

## Firestore indexes (if needed)

- `ipl_matches`: `status` (ASC) + `matchStartTime` (ASC)
- `ipl_user_picks`: `tournamentId` (ASC) + `userId` (ASC)
- `player_match_stats`: `matchId` (ASC)
- `player_selection_stats`: `matchId` (ASC)

---

## Optional (not implemented)

- Free switch tokens (beyond default 1).
- Streak bonus (30+ in 3 matches → +25).
- Notifications (“Underrated player scored big”, “Leaderboard updated”).
- Display names on leaderboard (resolve from `users` by userId).
