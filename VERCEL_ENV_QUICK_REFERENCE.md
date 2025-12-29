# Quick Reference: Vercel Environment Variables

## ✅ Environment Variables to Add in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **5 required variables** (and 1 optional):

### 1. `CASHFREE_APP_ID`
- **Value**: Your Cashfree App ID
- **Where to get**: Cashfree Dashboard → Developers → API Keys
- **Example**: `CF1234567890ABCDEF`

### 2. `CASHFREE_SECRET_KEY`
- **Value**: Your Cashfree Secret Key  
- **Where to get**: Cashfree Dashboard → Developers → API Keys
- **Example**: `your_secret_key_here`

### 3. `CASHFREE_ENV`
- **Value**: `sandbox` (for testing) or `production` (for live)
- **Production**: `production`
- **Testing**: `sandbox`

### 3b. `NEXT_PUBLIC_CASHFREE_ENV` (Optional)
- **Value**: `sandbox` (for testing) or `production` (for live)
- **Note**: If not set, the code will auto-detect from hostname
- **Production**: `production`
- **Testing**: `sandbox`

### 4. `NEXT_PUBLIC_APP_URL`
- **Value**: Your production domain URL
- **Format**: `https://yourdomain.com` (no trailing slash)
- **Example**: `https://quizzbuzz.in`

### 5. `FIREBASE_SERVICE_ACCOUNT_KEY`
- **Value**: Complete JSON string from Firebase service account key
- **Where to get**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- **Format**: Single-line JSON string: `{"type":"service_account","project_id":"...",...}`
- **Important**: Must be on one line, escape quotes properly

---

## ❌ Files You DON'T Need to Modify

✅ **No code changes needed** - The code already reads from `process.env`
✅ **No `.env` file needed** - Vercel handles environment variables
✅ **No config file changes** - `next.config.ts` already loads environment variables

---

## 🔧 Additional Setup Required

### Cashfree Webhook Configuration
After deploying to Vercel, configure webhook in Cashfree Dashboard:

1. Go to Cashfree Dashboard → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/subscription/webhook`
3. Select events: **Payment Success**, **Payment Failed**
4. Save

---

## 📋 Quick Checklist

- [ ] Added `CASHFREE_APP_ID` in Vercel
- [ ] Added `CASHFREE_SECRET_KEY` in Vercel  
- [ ] Added `CASHFREE_ENV` = `production` in Vercel
- [ ] Added `NEXT_PUBLIC_APP_URL` = your domain in Vercel
- [ ] Added `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string) in Vercel
- [ ] Configured Cashfree webhook URL
- [ ] Redeployed project after adding variables

---

## 🚀 After Adding Variables

1. **Redeploy** your project in Vercel (or push a new commit)
2. **Test** the subscription flow
3. **Check** Vercel function logs if issues occur

---

## 📝 Example Values (Production)

```
CASHFREE_APP_ID=CF1234567890ABCDEF
CASHFREE_SECRET_KEY=sk_live_1234567890abcdef
CASHFREE_ENV=production
NEXT_PUBLIC_APP_URL=https://quizzbuzz.in
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

---

## ⚠️ Important Notes

- **Never commit** these values to Git
- Use **different values** for Production vs Preview environments
- **FIREBASE_SERVICE_ACCOUNT_KEY** must be a valid JSON string on one line
- **NEXT_PUBLIC_APP_URL** must match your actual Vercel domain
- Redeploy after adding/changing environment variables

