# IPL Admin — Start the game

Use this checklist to go from zero to live so users can play IPL Fantasy.

---

## 1. Seed data (one-time)

| Step | Where | Action |
|------|--------|--------|
| **Players** | [Players](/admin/fantasy/ipl/players) | Click **"Seed IPL 2026 players"** (adds 140 players). |
| **Matches** | [Matches](/admin/fantasy/ipl/matches) | Click **"Generate official schedule (20 matches)"** (official first phase). Creates IPL + Cricket Fantasy matches. |

After this, users see the upcoming match on `/fantasy/ipl` and can pick their team.

---

## 2. Before the first match (per match)

- Users must **lock** their team before match start (e.g. 30 min before). Communicate lock time.
- Optional: After lock, go to **Scoring** → select match → **"Calculate selection %"** (can also do after the match).

---

## 3. When the match is live

| Step | Where | Action |
|------|--------|--------|
| **Start match** | [Matches](/admin/fantasy/ipl/matches) | Find the match → **Start** (status = live). |
| **Enter stats** | Same row → **Stats** | Enter runs, fours, sixes, wickets, economy, catches, isOut per player. **Save all** when done. |

---

## 4. After the match ends

| Step | Where | Action |
|------|--------|--------|
| **End match** | [Matches](/admin/fantasy/ipl/matches) | That match → **End** (status = completed). |
| **Selection %** | [Scoring](/admin/fantasy/ipl/scoring) | Select match → **"Calculate selection %"** (if not done earlier). |
| **Run scoring** | [Scoring](/admin/fantasy/ipl/scoring) | Same match → **"Run match scoring"**. Applies points to all users who had a team locked. |

Leaderboard and user history update after **Run match scoring**.

---

## 5. Check results

- **Admin:** [Results](/admin/fantasy/ipl/results) — leaderboard, filter by match, expand user history.
- **Users:** Share `/fantasy/ipl` and `/fantasy/ipl/leaderboard`.

---

## Quick start (minimal)

1. **Players** → Seed IPL 2026 players  
2. **Matches** → Generate official schedule (20 matches)  
3. Tell users: go to `/fantasy/ipl`, pick team, lock before match time  
4. On match day: **Matches** → Start → enter **Stats** → End → **Scoring** → Calculate selection % → **Run match scoring**
