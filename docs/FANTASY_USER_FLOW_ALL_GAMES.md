# Fantasy Games — User Flow: From Start to Winning

This document describes **all fantasy games** on the platform and the **end-to-end user journey** for each: how users discover a game, participate, earn points, and see results (leaderboard / winning).

---

## Overview: Fantasy Arena

**Entry:** `/fantasy` (Fantasy Arena hub)

- First-time users may see an **onboarding** flow; completion is stored in `localStorage`.
- The hub shows **three game cards**:
  1. **IPL Fantasy** — cricket pick'em per match
  2. **Cricket Live Fantasy** — tournaments + live match fantasy
  3. **Movie Fantasy** — movie/campaign prediction events

Users choose a game and follow the flow below. **Prizes** (when configured) are described at `/fantasy/prizes`.

---

## 1. IPL Fantasy

**Purpose:** Pick a team per IPL match (batsman required; bowler, all-rounder, captain, emerging optional). Points from real match stats; underrated picks get multipliers. Cumulative leaderboard across matches.

### 1.1 User flow (start → play → winning)

| Step | Where | What the user does |
|------|--------|---------------------|
| **1. Discover** | `/fantasy` | Clicks **IPL Fantasy** card → goes to `/fantasy/ipl`. |
| **2. See upcoming match** | `/fantasy/ipl` | Sees **Upcoming Match** (e.g. RCB vs SRH, date/time in IST). Clicks **Select team**. |
| **3. Pick team** | `/fantasy/ipl/match/[matchId]` | Picks **batsman** (required), optional bowler, all-rounder, captain, emerging. Sees selection % and underrated multiplier hint. Clicks **Lock selection** before match lock (e.g. 30 min before start). |
| **4. Lock** | Same page | After lock, selections are final. One free switch pool; later role changes cost −20 points. |
| **5. Match runs** | — | Admin starts match, enters player stats (runs, wickets, etc.), ends match, runs scoring (see admin docs). |
| **6. See points** | `/fantasy/ipl` or **Leaderboard** | User’s `totalPoints` update from match scoring. History shows per-match breakdown. |
| **7. Leaderboard / winning** | `/fantasy/ipl/leaderboard` | **Leaderboard** shows all players sorted by **total points**. Top ranks = winners. User sees their rank and points. |

### 1.2 Key routes

| Route | Purpose |
|-------|--------|
| `/fantasy/ipl` | Hub: upcoming match card, link to leaderboard |
| `/fantasy/ipl/match/[matchId]` | Pick & lock team for one match |
| `/fantasy/ipl/leaderboard` | Standings by total points (rank, userId, totalPoints) |

### 1.3 Data (conceptual)

- **ipl_matches** — fixtures (teamA, teamB, matchStartTime, status).
- **ipl_players** — player pool (name, team, role, isEmerging).
- **ipl_user_picks** — user’s pick per tournament (roles, history, totalPoints).
- **player_match_stats** — runs, wickets, etc. per player per match (admin-entered).
- **player_selection_stats** — selection % per player per match (admin-calculated).

Scoring uses role-based points (batting, bowling, all-rounder, captain, emerging) plus underrated multiplier and switch penalty. **Winning** = position on leaderboard when tournament/phase ends.

---

## 2. Cricket Live Fantasy

**Purpose:** Two modes: (A) **Tournament (series)** — join a series, predict events, earn points; (B) **Match-based** — join a single match, make live decisions/phases, earn points. Leaderboards per tournament or per match.

### 2.1 User flow — Tournament (series)

| Step | Where | What the user does |
|------|--------|---------------------|
| **1. Discover** | `/fantasy` | Clicks **Cricket Live Fantasy** → `/fantasy/cricket`. |
| **2. Choose series** | `/fantasy/cricket` (Series tab) | Sees list of **tournaments** (live / upcoming / completed). Clicks a tournament (e.g. T20 World Cup, IPL 2026). |
| **3. Join tournament** | `/fantasy/cricket/tournament/[id]` | Sees tournament details, prize pool, events. Clicks **Join** (free / paid / ad-watch as configured). May see **image ad gate** if entry is ad-based. |
| **4. Make predictions** | `/fantasy/cricket/tournament/[id]/event/[eventId]` | For each **event** (e.g. “Match winner”, “Top run scorer”), submits prediction (radio, checkbox, or text per event type). Events can be upcoming / live / completed. |
| **5. Earn points** | — | When admin/scoring system resolves events, correct predictions add points to the user’s **participation** in that tournament. |
| **6. Leaderboard / winning** | `/fantasy/cricket/tournament/[id]/leaderboard` | **Tournament leaderboard** shows participants sorted by **totalPoints**. Top ranks = winners. |

### 2.2 User flow — Match-based (single match)

| Step | Where | What the user does |
|------|--------|---------------------|
| **1. Discover** | `/fantasy/cricket` (All Matches or T20/IPL tab) | Sees **matches** from `fantasy_matches`. Clicks a **live** (or upcoming) match. |
| **2. Enter match** | `/fantasy/cricket/match/[id]` | May see **ad gate** if configured. Enters match fantasy. |
| **3. Phases** | Same page | Pre-match: team/player selection. Then 1st innings, break, 2nd innings, etc. Makes choices (e.g. predictions, picks) as the UI moves through phases. |
| **4. Score** | Same page | Points update during/after phases (e.g. streaks, correct predictions). |
| **5. Match over** | Same page / leaderboard | Final leaderboard for that match; user sees rank and score. **Winning** = top positions when match ends. |

### 2.3 Key routes

| Route | Purpose |
|-------|--------|
| `/fantasy/cricket` | Hub: Series tab (tournaments) + All Matches / T20/IPL / ODI / Test (matches) |
| `/fantasy/cricket/tournament/[id]` | Tournament detail, join, list of events |
| `/fantasy/cricket/tournament/[id]/event/[eventId]` | Submit/edit prediction for one event |
| `/fantasy/cricket/tournament/[id]/leaderboard` | Tournament standings |
| `/fantasy/cricket/match/[id]` | Match-based fantasy (phases, scoring) |
| `/fantasy/cricket/match/[id]/event/[eventId]` | Per-match event prediction (if used) |

### 2.4 Data (conceptual)

- **cricket-tournaments** — series metadata, entry fee, prize pool.
- **cricket-tournaments/…/events** — prediction events (type, options, points).
- **tournament-entries** — user joined a tournament.
- **tournament-predictions** — user’s prediction per event.
- **cricket-tournaments/…/participations** — totalPoints per user (leaderboard).
- **fantasy_matches** — single match fixtures (can be linked to IPL via `iplMatchKey`).
- **cricketers** — player pool for match fantasy.

**Winning** = high rank on the relevant leaderboard (tournament or match) when the series/match is closed.

---

## 3. Movie Fantasy (Campaigns)

**Purpose:** Movie (or generic) **campaigns** with **events** (e.g. “First look views”, “Box office range”, “Draft”). User joins a campaign, makes predictions per event, accumulates points. Leaderboard and prizes (if configured) determine winners.

### 3.1 User flow (start → play → winning)

| Step | Where | What the user does |
|------|--------|---------------------|
| **1. Discover** | `/fantasy` | Clicks **Movie Fantasy** → `/fantasy/movie`. |
| **2. See campaigns** | `/fantasy/movie` | Sees **movie campaigns** (single_movie / multiple_movies). Clicks **View Campaign** on one. |
| **3. Open campaign** | `/fantasy/campaign/[id]` | Sees campaign details, sponsor, events (upcoming / live / completed). May need **age / fantasy disclaimer** (modal) on first use. |
| **4. Participate in events** | `/fantasy/campaign/[id]/event/[eventId]` | For each **event**, submits prediction (choice, multi-select, text, or draft as per event type). Events show “Attempted” when user has submitted. |
| **5. Earn points** | — | When events are resolved (admin/scoring), correct predictions add points. Campaign leaderboard aggregates points. |
| **6. Leaderboard / winning** | `/fantasy/campaign/[id]` (Leaderboard tab) | **Campaign leaderboard** shows participants by total points. Top ranks = winners. If **prize distribution** is set, winners get tiers (e.g. 1st, 2nd–5th). |
| **7. Prizes** | `/fantasy/prizes` | User can see **all campaigns with prizes** and tier rules. |

### 3.2 Key routes

| Route | Purpose |
|-------|--------|
| `/fantasy/movie` | Lists movie campaigns; links to campaign page |
| `/fantasy/campaign/[id]` | Campaign detail, events list, leaderboard tab |
| `/fantasy/campaign/[id]/event/[eventId]` | Submit/edit prediction for one event |
| `/fantasy/campaign/[id]/prizes` | Prizes for this campaign (if any) |
| `/fantasy/prizes` | All campaigns with prize distribution |

### 3.3 Data (conceptual)

- **fantasy-campaigns** — campaign metadata (type, sponsor, dates, prizeDistribution).
- **fantasy-campaigns/…/events** — events (title, type, options, points).
- **campaign-predictions** — user’s prediction per event.
- **campaign-entries** or participations — used for leaderboard total (implementation may vary).

**Winning** = rank on campaign leaderboard; if `prizeDistribution` exists, top tiers (e.g. rank 1, ranks 2–5) are the “winners” for that campaign.

---

## 4. Live Fantasy (redirect)

**Purpose:** Legacy entry; now redirects to Cricket Fantasy.

| Route | Purpose |
|-------|--------|
| `/live-fantasy` | Redirects to `/fantasy/cricket`. |
| `/live-fantasy/[id]` | Can be used for a specific live match experience (similar phase flow to cricket match). |

Users going to “live fantasy” are sent to the Cricket hub; from there they follow **Cricket Live Fantasy** (tournament or match) as above.

---

## 5. Cross-cutting: Login, Prizes, Compliance

- **Login / Signup:** Many actions (join, lock, submit prediction) require the user to be **logged in**. Unauthenticated users are redirected to login when they try to act.
- **Prizes:** `/fantasy/prizes` lists campaigns with prize distribution and explains how tiers work. Actual “winning” for a game is always the **leaderboard rank** for that game; prizes are applied to those ranks when configured.
- **Skill-based / compliance:** Hub and game pages present the product as **skill-based** (no gambling). Age/eligibility and disclaimers (e.g. Movie Fantasy) are shown where implemented.

---

## 6. Quick reference: “How do I win?”

| Game | How users win |
|------|----------------|
| **IPL Fantasy** | Lock team each match; earn points from match stats. **Win** = top position(s) on **IPL leaderboard** (`/fantasy/ipl/leaderboard`) by total points. |
| **Cricket tournament** | Join tournament, predict events. **Win** = top position(s) on **tournament leaderboard** by totalPoints. |
| **Cricket match** | Play through match phases, make predictions/picks. **Win** = top position(s) on **that match’s** leaderboard. |
| **Movie / Campaign** | Join campaign, predict events. **Win** = top position(s) on **campaign leaderboard**; if prizes exist, top tiers get rewards. |

---

## 7. Admin and scoring (for reference)

- **IPL:** Admin seeds players & matches, starts/ends matches, enters stats, runs “Calculate selection %” and “Run match scoring”. See `docs/IPL_ADMIN_START_THE_GAME.md`.
- **Cricket:** Admin creates tournaments/matches and events; scoring may be via Cloud Functions or admin tools that update participations/totalPoints.
- **Campaign/Movie:** Admin creates campaigns and events; resolves outcomes and updates points/leaderboard.

Detailed admin flows are in:

- `docs/IPL_ADMIN_START_THE_GAME.md`
- `docs/CRICKET_FANTASY_FEATURES.md`
- `docs/FIRESTORE_INDEXES_IPL.md` (indexes for IPL)

---

## 8. Testing checklist (manual)

Use this to verify fantasy flows. Run the app (`npm run dev`), then:

| # | Game | Route | What to check |
|---|------|--------|----------------|
| 1 | Hub | `/fantasy` | Fantasy Arena loads; onboarding or three game cards (IPL, Cricket, Movie) visible. |
| 2 | IPL | `/fantasy/ipl` | IPL Fantasy hub: upcoming match card or “No upcoming match”; Leaderboard link. |
| 3 | IPL | `/fantasy/ipl/match/[matchId]` | With a valid match ID: select team (batsman + optional roles), lock (if not locked). |
| 4 | IPL | `/fantasy/ipl/leaderboard` | Leaderboard page: “IPL Fantasy Leaderboard”, “Sorted by total points”, list or “No entries yet”. |
| 5 | Cricket | `/fantasy/cricket` | Cricket hub: Series tab (tournaments) and/or All Matches / T20/IPL tabs. |
| 6 | Cricket | `/fantasy/cricket/tournament/[id]` | Tournament detail: join, events list, leaderboard link. |
| 7 | Cricket | `/fantasy/cricket/tournament/[id]/leaderboard` | Tournament leaderboard. |
| 8 | Cricket | `/fantasy/cricket/match/[id]` | Match fantasy: phases (pre-match, innings, etc.) if match exists. |
| 9 | Movie | `/fantasy/movie` | Movie campaigns list; disclaimer if required. |
| 10 | Campaign | `/fantasy/campaign/[id]` | Campaign detail: events, leaderboard tab. |
| 11 | Campaign | `/fantasy/campaign/[id]/event/[eventId]` | Event prediction form (choice/text/draft). |
| 12 | Prizes | `/fantasy/prizes` | Campaigns with prize distribution listed. |
| 13 | Live | `/live-fantasy` | Redirects to `/fantasy/cricket`. |

Build verification: `npm run build` should complete without errors (all fantasy routes compile).

---

*Last updated from codebase review — all fantasy games.*
