import { NextRequest, NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg-sdk-nodejs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Initialize Cashfree
const cashfree = new Cashfree({
  env: process.env.CASHFREE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
  apiVersion: '2023-08-01',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderAmount, orderCurrency, paymentStatus, customerId } = body;

    if (!orderId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify webhook signature (optional but recommended)
    // You can add signature verification here using Cashfree's webhook signature

    if (paymentStatus === 'SUCCESS') {
      // Update user subscription in Firestore
      const db = getFirestore();
      const userRef = db.collection('users').doc(customerId);
      
      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

      await userRef.update({
        isSubscribed: true,
        subscriptionStartDate,
        subscriptionEndDate,
        subscriptionPlan: 'annual',
        paymentId: orderId,
        subscriptionStatus: 'active',
      });

      console.log(`Subscription activated for user: ${customerId}, orderId: ${orderId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

