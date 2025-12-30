# ⚠️ URGENT: Update Firestore Security Rules for Rewards System

## You're Getting Permission Errors Because Rules Haven't Been Updated

The errors you're seeing:
- `Error loading rewards data: FirebaseError: Missing or insufficient permissions`
- `Error getting milestone progress: FirebaseError: Missing or insufficient permissions`
- `Error checking milestones: FirebaseError: Missing or insufficient permissions`

These mean your Firestore security rules don't include rules for the new rewards collections.

## Quick Fix (5 minutes)

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project

### Step 2: Navigate to Firestore Rules
1. Click **"Firestore Database"** in the left sidebar
2. Click the **"Rules"** tab at the top

### Step 3: Copy the Complete Rules
Copy **ALL** the content from `FIRESTORE_RULES_WITH_REWARDS.txt` file in your project root.

**OR** copy the rules directly from the file - it includes all existing rules PLUS the new rewards rules.

### Step 4: Replace Your Current Rules
1. **DELETE** all existing rules in the Firebase Console editor
2. **PASTE** the complete rules from `FIRESTORE_RULES_WITH_REWARDS.txt`
3. **IMPORTANT**: Verify line 14 has the correct admin email: `request.auth.token.email == 'admin@fantasy.com'`
   - If your admin email is different, change it to match your actual admin email

### Step 5: Publish
1. Click the **"Publish"** button at the top
2. Wait for confirmation that rules were published (you'll see a timestamp)

### Step 6: Test
1. Go back to your application
2. Visit `/rewards` page
3. The permission errors should be gone!

## What Was Added?

The new rules include permissions for:

### 1. Reward Milestones Collection
```javascript
match /reward-milestones/{milestoneId} {
  allow read: if isAuthenticated() && 
                (resource.data.active == true || isAdmin());
  allow write: if isAdmin();
}
```
- Users can read active milestones
- Admin can read/write all milestones

### 2. Vouchers Collection
```javascript
match /vouchers/{voucherId} {
  allow read: if isAuthenticated() && 
                (resource.data.active == true || isAdmin());
  allow write: if isAdmin();
}
```
- Users can read active vouchers
- Admin can read/write all vouchers

### 3. Voucher Redemptions Collection
```javascript
match /voucher-redemptions/{redemptionId} {
  allow read: if isAuthenticated() && 
                 (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() && 
                  request.resource.data.userId == request.auth.uid;
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```
- Users can read their own redemptions
- Users can create redemptions (for themselves)
- Admin can read/update/delete all redemptions

### 4. User Milestone Progress Subcollection
```javascript
match /users/{userId}/milestone-progress/{progressId} {
  allow read: if isAuthenticated() && 
                (request.auth.uid == userId || isAdmin());
  allow create: if isAuthenticated() && request.auth.uid == userId;
  allow update: if isAuthenticated() && request.auth.uid == userId;
  allow delete: if isAdmin();
}
```
- Users can read/write their own milestone progress
- Admin can read all progress

### 5. User Game Plays Subcollection
```javascript
match /users/{userId}/game-plays/{playId} {
  allow read: if isAuthenticated() && 
                (request.auth.uid == userId || isAdmin());
  allow create: if isAuthenticated() && request.auth.uid == userId;
  allow update: if isAuthenticated() && request.auth.uid == userId;
  allow delete: if isAdmin();
}
```
- Users can read/write their own game play records
- Admin can read all game plays

## Still Getting Errors?

1. **Check your admin email**: Make sure the email in the `isAdmin()` function matches exactly (case-sensitive)
2. **Sign out and sign back in**: Sometimes you need to refresh your auth token
3. **Check browser console**: Look for more specific error messages
4. **Verify rules were published**: Go back to Rules tab and make sure they're saved (check timestamp)
5. **Clear browser cache**: Sometimes cached rules cause issues

## Need Help?

If you're still having issues:
1. Check that you're signed in with the correct email
2. Verify the rules were published (you should see a timestamp)
3. Try clearing browser cache and signing in again
4. Check Firebase Console → Firestore → Rules tab for any syntax errors (they'll be highlighted in red)

