# Firestore indexes for IPL Fantasy

These composite indexes are required for IPL Fantasy queries. Without them, the relevant Firestore queries will fail (you may see an error in the console with a link to create the index).

## Option 1: Deploy from project (recommended)

From the project root:

```bash
firebase deploy --only firestore:indexes
```

This uses `firestore.indexes.json` in the repo.

## Option 2: Create manually in Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Firestore Database** → **Indexes**.
2. Click **Create index** and add each of the following.

### 1. IPL matches (upcoming match list, admin match list by status)

- **Collection ID:** `ipl_matches`
- **Fields to index:**
  - `status` — Ascending
  - `matchStartTime` — Ascending
- **Query scope:** Collection

### 2. IPL players (players by team on “Select team” page)

- **Collection ID:** `ipl_players`
- **Fields to index:**
  - `team` — Ascending
  - `isActive` — Ascending
  - `name` — Ascending
- **Query scope:** Collection

## If you see an index error in the app

When a query fails due to a missing index, the browser console often shows a link like:

```
https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

Opening that link and confirming will create the required index for you.
