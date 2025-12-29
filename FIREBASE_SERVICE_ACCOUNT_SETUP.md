# How to Generate Single-Line Firebase Service Account Key

## Method 1: Using Command Line (Recommended)

### Step 1: Download Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** (⚙️) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** (downloads a JSON file)

### Step 2: Convert to Single-Line JSON

#### Option A: Using Node.js (if you have Node.js installed)

```bash
# Navigate to where you downloaded the JSON file
cd ~/Downloads  # or wherever you saved it

# Convert to single-line JSON
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('your-firebase-key.json', 'utf8'))))"
```

**Example:**
```bash
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('fantasy-app-firebase-adminsdk.json', 'utf8'))))"
```

This will output the single-line JSON. Copy the entire output.

#### Option B: Using Python (if you have Python installed)

```bash
python3 -c "import json; print(json.dumps(json.load(open('your-firebase-key.json'))))"
```

**Example:**
```bash
python3 -c "import json; print(json.dumps(json.load(open('fantasy-app-firebase-adminsdk.json'))))"
```

#### Option C: Using jq (if installed)

```bash
jq -c . your-firebase-key.json
```

---

## Method 2: Manual Method (No Tools Required)

### Step 1: Open the JSON file in a text editor

### Step 2: Remove all line breaks

You can:
- Use Find & Replace in your editor:
  - Find: `\n` (newline)
  - Replace: (leave empty)
- Or manually copy the entire content and paste it into a single line

### Step 3: Ensure proper formatting

The JSON should look like this (all on one line):
```
{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important:** The `\n` inside the `private_key` field should remain as `\n` (literal backslash-n), not actual newlines.

---

## Method 3: Online Tool (Less Secure - Use with Caution)

1. Go to https://www.jsonformatter.org/json-minify
2. Paste your Firebase JSON file content
3. Click "Minify"
4. Copy the single-line output

⚠️ **Warning:** Only use this method if you trust the website. It's better to use local tools.

---

## Method 4: Using VS Code or Any Code Editor

1. Open the JSON file in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Format Document" and select it
4. Then use Find & Replace:
   - Press `Ctrl+H` (or `Cmd+H` on Mac)
   - Enable regex mode (click `.*` icon)
   - Find: `\n`
   - Replace: (leave empty)
   - Click "Replace All"
5. Copy the entire single-line result

---

## Step 3: Add to Vercel

1. Copy the entire single-line JSON string
2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
3. Add new variable:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire single-line JSON
4. Make sure to select the correct environment (Production/Preview/Development)
5. Click **Save**

---

## Example Output

Your single-line JSON should look like this:

```
{"type":"service_account","project_id":"fantasy-app-12345","private_key_id":"abc123def456","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@fantasy-app-12345.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40fantasy-app-12345.iam.gserviceaccount.com"}
```

---

## Verification

After adding to Vercel, you can verify it works by:

1. Checking Vercel function logs after deployment
2. Testing the subscription payment flow
3. If you see Firebase Admin initialization errors, the JSON format might be incorrect

---

## Troubleshooting

### Issue: "Invalid JSON" error
- Make sure there are no actual line breaks in the string
- Ensure all quotes are properly escaped
- Verify the JSON is valid by testing it in a JSON validator

### Issue: "Firebase Admin initialization error"
- Double-check the JSON string is complete
- Ensure the `private_key` field has `\n` (not actual newlines)
- Verify the service account has Firestore permissions

### Issue: Can't copy the entire string
- Use command line method (Method 1) - it's the most reliable
- Make sure you're copying the entire output, including the outer quotes if present

---

## Security Reminder

⚠️ **Never commit the Firebase service account key to Git**
⚠️ **Never share the key publicly**
⚠️ **Keep the downloaded JSON file secure**
⚠️ **Delete the JSON file after adding to Vercel (or store it securely)**

