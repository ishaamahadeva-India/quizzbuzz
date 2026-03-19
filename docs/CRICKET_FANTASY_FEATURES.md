# Cricket Fantasy — Implemented Features

This document describes **what is implemented** in the application for **Cricket Fantasy** (user-facing routes, data model, and admin). Paths are relative to the project root.

---

## 1. User entry points

| Route | Purpose |
|-------|---------|
| `/fantasy/cricket` | Main **Cricket Fantasy hub** |
| `/fantasy/cricket/tournament/[id]` | Tournament detail, join flow, list of prediction events |
| `/fantasy/cricket/tournament/[id]/event/[eventId]` | Submit or edit a prediction for one tournament event |
| `/fantasy/cricket/tournament/[id]/leaderboard` | Tournament standings by participation points |
| `/fantasy/cricket/match/[id]` | **Match-based** fantasy (innings / phases, player selection) |
| `/fantasy/cricket/match/[id]/events` | Match events list (if used for that match) |
| `/fantasy/cricket/match/[id]/event/[eventId]` | Per-match event prediction/detail |
| `/live-fantasy/[id]` | Alternate **live** match fantasy experience (similar phase flow) |

---

## 2. Cricket Fantasy hub (`/fantasy/cricket`)

**Implemented:**

- **Tabs**
  - **Series** — Lists tournaments from Firestore `cricket-tournaments` (sorted: live → upcoming → completed; then by start date).
  - **All Matches** — Lists documents from `fantasy_matches`.
  - **T20 / IPL**, **ODI**, **Test** — Same match list filtered by format (T20 tab also includes matches whose name contains “IPL”).
- **Tournament cards** show: name, format, team count, description snippet, date range, venue, **sponsored rewards pool** (`prizePool`), free vs paid entry hint, CTA (`Join Live` / `View Details` / `View Results`).
- **Match cards** show: name, format, status, “Sponsored Rewards Active”, link to enter when status is `live`.
- **Disclaimer modal** (`DisclaimerModal`) for compliance on first visit (local storage key).
- **Skill-based contest** copy in a footer card (“A Game of Skill”).

**Data sources:** `cricket-tournaments`, `fantasy_matches`.

---

## 3. Tournament-based fantasy (series / prediction contests)

### 3.1 Tournament detail page

**Implemented:**

- Load tournament from `cricket-tournaments/{tournamentId}`.
- Load **events** from `cricket-tournaments/{tournamentId}/events`.
- **Join / entry**
  - Checks existing entry via `tournament-entries` (`getUserTournamentEntry`).
  - Supports **free**, **paid** (tier selection in UI), and **ad_watch** entry paths (`entryMethod` / `entryFee.type`).
  - **Image ad gate** (`ImageAdGate`) on join: required when entry is ad-based; can also show for other flows depending on tournament config.
  - On successful join after ad: `addTournamentEntry` with optional `adViewId`, `advertisementId`, user city/state from profile.
- **User predictions** loaded from `tournament-predictions` (filter by `userId`, `tournamentId`) to show which events are already submitted.
- **UI:** Live badge, dates, venue, teams, prize pool, **AnimatedSponsorTile** (tournament sponsor), **SocialShare** (URL, title, description, optional image).
- **Contest disclosures** card (free participation, non-cash rewards, etc.).
- List of **events** with lock/upcoming/live states, points, links to event prediction pages.
- Navigation to **Leaderboard**.

### 3.2 Tournament event (prediction) page

**Implemented:**

- Single event from `cricket-tournaments/.../events/{eventId}`.
- **Input modes** by `eventType`:
  - **Radio** (single choice from `options`).
  - **Checkbox** multi-select when `multiSelect` / `maxSelections` apply.
  - **Text / textarea** for a large set of “player or outcome” style types (e.g. top run scorer, MVP, tournament winner, group topper, semi-finalists, etc.).
- **Create / update** predictions via `tournament-predictions` (`addTournamentPrediction`, `updateTournamentPrediction`).
- Shows existing prediction when user already submitted.
- **AnimatedSponsorTile** for event-level sponsorship when configured.
- Lock handling when event is locked/completed (read-only or messaging as implemented).

### 3.3 Tournament leaderboard

**Implemented:**

- Reads `cricket-tournaments/{tournamentId}/participations`.
- Sorts by `totalPoints` descending; assigns ranks; shows medals for top ranks.
- Resolves display names from `users` collection where possible.
- Highlights **current user** rank and participation when logged in.
- Tabs / table UI for standings.

---

## 4. Match-based fantasy (`fantasy_matches`)

**Implemented (high level):**

- Match loaded from `fantasy_matches/{id}`.
- **Players** from `cricketers` collection; filtered by match teams when possible, with fallback to all players.
- **Phased UI** (client state): pre-match → 1st innings → innings break → 2nd innings selection → 2nd innings live → match over.
- **Pre-match:** team/player selection style flow (`PreMatchView`).
- **Innings:** scoring / streak simulation (`FirstInningsView`, `handleScoreUpdate`).
- **Ad gate:** optional `ImageAdGate` / localStorage key per match+user for “ad viewed” before play.
- **Sponsored rewards** messaging on hub cards for matches.

**Related route:** `/live-fantasy/[id]` reuses similar phase components for a dedicated live entry.

---

## 5. Firestore collections (Cricket fantasy–related)

| Collection / path | Role |
|-------------------|------|
| `cricket-tournaments` | Tournament metadata (format, dates, status, teams, entry fee, prize pool, sponsor, visibility, etc.) |
| `cricket-tournaments/{id}/events` | Prediction events (type, options, points, lock times, sponsorship fields) |
| `cricket-tournaments/{id}/participations` | User participation + **`totalPoints`** for leaderboard |
| `tournament-entries` | User joined a tournament (entry method, ad linkage, location optional) |
| `tournament-predictions` | Per-user predictions per tournament event |
| `fantasy_matches` | Standalone match fantasy fixtures |
| `cricketers` | Player pool for match-based fantasy |

**Admin write, user read/create** patterns are defined in your Firestore security rules (see `firestore.rules` / `FIRESTORE_RULES_WITH_REWARDS.txt`).

---

## 6. Admin (Cricket fantasy operations)

**Implemented:**

| Area | Location |
|------|----------|
| Fantasy admin hub | `/admin/fantasy` |
| List + delete **tournaments**, **matches**, **movie campaigns** | Same page |
| CSV templates / upload for campaigns, matches, tournaments | `CSVUpload`, `downloadTournamentsTemplate`, etc. |
| **Tournament CRUD** | `src/firebase/firestore/cricket-tournaments.ts` — `addCricketTournament`, `updateCricketTournament`, `deleteCricketTournament`, event helpers |
| **Tournament UI** | `/admin/fantasy/tournament/new`, `tournament/edit/[id]`, `tournament/[id]/results`, `tournament/[id]/leaderboard` |
| **Match CRUD** | `cricket-matches` + admin match pages under `/admin/fantasy/match/...` |
| Forms | e.g. `cricket-tournament-form.tsx`, `cricket-match-form.tsx` |

---

## 7. Supporting libraries & types

- **Types:** `CricketTournament`, `TournamentEvent`, `TournamentGroup`, `FantasyMatch`, etc. in `src/lib/types.ts`.
- **Tournament event templates** (admin seeding): `TOURNAMENT_EVENT_TEMPLATES` in `cricket-tournaments.ts`.

---

## 8. Not documented as fully productized here

The following may exist in code but depend on **admin configuration**, **Firestore data**, and **rules**:

- Automatic **scoring** of tournament predictions into `participations.totalPoints` (verify admin/Cloud Function or manual processes).
- **Payment** flows for paid tiers (UI may exist; gateway integration is environment-specific).
- **Points engine** is strongly tied to **movie/campaign** flows in `src/lib/points-engine.ts`; confirm cricket tournament scoring pipeline if you rely on automated points.

---

## 9. Quick file index

| Feature | Primary files |
|---------|----------------|
| Hub | `src/app/fantasy/cricket/page.tsx` |
| Tournament detail | `src/app/fantasy/cricket/tournament/[id]/page.tsx` |
| Event prediction | `src/app/fantasy/cricket/tournament/[id]/event/[eventId]/page.tsx` |
| Leaderboard | `src/app/fantasy/cricket/tournament/[id]/leaderboard/page.tsx` |
| Match fantasy | `src/app/fantasy/cricket/match/[id]/page.tsx` |
| Live fantasy | `src/app/live-fantasy/[id]/page.tsx` |
| Tournament API | `src/firebase/firestore/cricket-tournaments.ts` |
| Entries / predictions | `tournament-entries.ts`, `tournament-predictions.ts` |
| Admin hub | `src/app/admin/fantasy/page.tsx` |

---

*Last updated from codebase review — QuizzBuzz / Fantasy monorepo.*
