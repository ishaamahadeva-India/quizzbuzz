# Vercel Environment Variables Setup Guide

## Required Environment Variables for Subscription Feature

Add the following environment variables in your Vercel project settings:

### Step 1: Go to Vercel Dashboard
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Environment Variables

#### 1. Cashfree Configuration (Required)

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `CASHFREE_APP_ID` | Your Cashfree App ID | Get from Cashfree Dashboard → Developers → API Keys |
| `CASHFREE_SECRET_KEY` | Your Cashfree Secret Key | Get from Cashfree Dashboard → Developers → API Keys |
| `CASHFREE_ENV` | `sandbox` or `production` | Use `sandbox` for testing, `production` for live |

**How to get Cashfree credentials:**
1. Log in to [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Navigate to **Developers** → **API Keys**
3. Copy your **App ID** and **Secret Key**
4. Paste them in Vercel environment variables

#### 2. Application URL (Required)

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Your production domain URL (e.g., `https://quizzbuzz.in`) |

**Important:** 
- Replace `yourdomain.com` with your actual domain
- Must include `https://` protocol
- No trailing slash

#### 3. Firebase Admin (Required for Server-Side Operations)

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON string of Firebase service account | Required for updating subscription status in Firestore |

**How to get Firebase Service Account Key:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Copy the entire JSON content
7. Paste it as a **single-line JSON string** in Vercel

**Important:** 
- The entire JSON must be on a single line
- Escape any quotes properly or use a JSON stringifier
- Example format: `{"type":"service_account","project_id":"your-project",...}`

### Step 3: Environment-Specific Settings

In Vercel, you can set different values for different environments:

- **Production**: Use production Cashfree credentials and production URL
- **Preview**: Use sandbox Cashfree credentials (for testing)
- **Development**: Use sandbox Cashfree credentials (for local testing)

### Step 4: Example Values

#### For Production:
```
CASHFREE_APP_ID=CF1234567890ABCDEF
CASHFREE_SECRET_KEY=your_production_secret_key_here
CASHFREE_ENV=production
NEXT_PUBLIC_APP_URL=https://quizzbuzz.in
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

#### For Sandbox/Testing:
```
CASHFREE_APP_ID=CF1234567890ABCDEF
CASHFREE_SECRET_KEY=your_sandbox_secret_key_here
CASHFREE_ENV=sandbox
NEXT_PUBLIC_APP_URL=https://your-preview-url.vercel.app
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Step 5: Configure Cashfree Webhook

After deploying to Vercel, configure the webhook in Cashfree:

1. Go to Cashfree Dashboard → **Webhooks**
2. Add new webhook with URL: `https://yourdomain.com/api/subscription/webhook`
3. Select events: **Payment Success**, **Payment Failed**
4. Save the webhook

### Step 6: Redeploy After Adding Variables

After adding environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Verification Checklist

- [ ] All 5 environment variables added in Vercel
- [ ] `CASHFREE_ENV` set to `production` for production, `sandbox` for testing
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual domain
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` is a valid JSON string
- [ ] Cashfree webhook configured with correct URL
- [ ] Project redeployed after adding variables

## Troubleshooting

### Issue: Payment not working
- Check if `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` are correct
- Verify `CASHFREE_ENV` matches your Cashfree account environment
- Check Vercel function logs for errors

### Issue: Subscription not updating in Firestore
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is correctly formatted
- Check Firebase Admin SDK initialization in server logs
- Ensure Firebase service account has Firestore write permissions

### Issue: Webhook not receiving notifications
- Verify webhook URL is correct: `https://yourdomain.com/api/subscription/webhook`
- Check if webhook is enabled in Cashfree dashboard
- Review Vercel function logs for webhook requests

## Security Notes

- Never commit environment variables to Git
- Use Vercel's environment variable encryption
- Rotate Cashfree keys regularly
- Keep Firebase service account key secure
- Use different credentials for production and testing

