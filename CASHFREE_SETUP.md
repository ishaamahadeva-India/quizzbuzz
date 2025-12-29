# Cashfree Subscription Setup Guide

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```env
# Cashfree Configuration
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox  # Use 'sandbox' for testing, 'production' for live

# Application URL (for return URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL

# Firebase Admin (for server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # JSON string of Firebase service account key
```

## Setup Steps

1. **Create Cashfree Account**
   - Sign up at https://www.cashfree.com/
   - Complete merchant verification

2. **Get API Credentials**
   - Log in to Cashfree Dashboard
   - Navigate to Developers > API Keys
   - Copy your App ID and Secret Key
   - Add them to your `.env.local` file

3. **Configure Webhook**
   - In Cashfree Dashboard, go to Webhooks
   - Add webhook URL: `https://yourdomain.com/api/subscription/webhook`
   - Select events: Payment Success, Payment Failed

4. **Firebase Admin Setup**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate a new private key
   - Copy the JSON content and add it as `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local` (as a JSON string)

## Testing

1. Use Cashfree sandbox environment for testing
2. Test payment flow with test cards provided by Cashfree
3. Verify webhook receives payment notifications
4. Check Firestore user document for subscription status updates

## Subscription Details

- **Price**: ₹99 per annum
- **Plan**: Annual subscription
- **Features**: 
  - Full access to all fantasy features
  - Ad-free experience
  - Priority support
  - Exclusive tournaments and events

