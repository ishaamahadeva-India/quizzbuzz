# IPL data seeding (admin) — so all users see matches

This app has **two** IPL-related surfaces for users:

| Surface | Collection | What users see |
|--------|------------|----------------|
| **Unified IPL Fantasy** (pick’em) | `ipl_matches`, `ipl_players`, `ipl_user_picks` | `/fantasy/ipl` → upcoming match, lock team, leaderboard |
| **Cricket Fantasy** (per-match events) | `fantasy_matches` | `/fantasy/cricket` → T20/IPL matches list |

---

## 1. Who can seed

- Sign in as **super admin** (`NEXT_PUBLIC_SUPER_ADMIN_EMAIL` in `.env.local`), **or**
- A user with **`users/{uid}.isAdmin === true`** in Firestore.

Deploy **`firestore.rules`** so `isAdmin()` includes your admin users (see rules helper).

---

## 2. Seed all IPL fixtures (one click)

1. Open **Admin** → **IPL Fantasy** (sidebar) or **Fantasy Games** → **Open IPL admin**.
2. Go to **Matches**: `/admin/fantasy/ipl/matches`.
3. Click **Generate Full IPL Schedule**.

By default this uses the **official IPL 2026 first phase** (BCCI announced): **20 matches, 28 Mar–12 Apr 2026** (source: iplt20.com / ESPN Cricinfo). You can uncheck “Official first phase only” to generate a full programmatic season (90 league + 4 playoffs) instead.

This creates:

- **`ipl_matches`** — official 20 or full programmatic rows (`status: upcoming`, `matchKey` for dedup).
- **`fantasy_matches`** — parallel cricket fantasy rows (`format: IPL`, `iplMatchKey` for dedup).

Re-running the button **skips** rows that already exist (same keys).

After this, users on **`/fantasy/ipl`** see the **next upcoming** IPL match (first by `matchStartTime` with `status === 'upcoming'`). Users on **`/fantasy/cricket`** see IPL-format matches in the cricket list.

---

## 3. Seed players (required for unified picks)

Unified fantasy needs **`ipl_players`** so users can pick batsman, bowler, etc.

1. **Admin** → **IPL Fantasy** → **Players** (`/admin/fantasy/ipl/players`).
2. Add players (name, team, role, emerging flag, active) — at least for teams in the schedule.

Without players, match pages may be empty or unusable for role picks.

---

## 4. Tournament id (unified picks)

User picks are tied to **`tournamentId: ipl_2026`** (`IPL_TOURNAMENT_ID` in `src/lib/ipl-constants.ts`).  
Do not change this unless you update the app to match.

---

## 5. After matches exist (ops checklist)

| Task | Where |
|------|--------|
| Enter stats after a game | Admin → IPL → Matches → **Stats** on that row |
| Selection % before scoring | Admin → IPL → **Scoring** → **Calculate selection %** |
| Apply points | Admin → IPL → **Scoring** → **Run match scoring** |
| Leaderboard / history | Admin → IPL → **Results**; users → `/fantasy/ipl/leaderboard` |

---

## 6. If users still see nothing

- Confirm **Firestore** has documents in `ipl_matches` (and `status` is `upcoming` for the next fixture).
- Check **Firestore rules**: authenticated users must be allowed **read** on `ipl_matches` (and `ipl_players`).
- **Index**: queries use `orderBy('matchStartTime')` — deploy any index errors from the Firebase console link.
- **Cricket list**: confirm `fantasy_matches` docs exist and the cricket page reads that collection.

---

## Quick path

```
Admin → IPL Fantasy → Matches → [Generate Full IPL Schedule]
Admin → IPL Fantasy → Players   → [add / import players]
```

Then share **`/fantasy/ipl`** (unified) and **`/fantasy/cricket`** (individual matches) with users.
