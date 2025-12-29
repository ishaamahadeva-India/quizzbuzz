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
    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Missing orderId or userId' },
        { status: 400 }
      );
    }

    // Verify payment with Cashfree
    const orderResponse = await cashfree.PGFetchOrder(
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!,
      orderId
    );

    if (orderResponse.status === 'SUCCESS' && orderResponse.data) {
      const orderData = orderResponse.data;
      const paymentStatus = orderData.paymentStatus || 'PENDING';

      if (paymentStatus === 'SUCCESS') {
        // Update user subscription in Firestore
        const db = getFirestore();
        const userRef = db.collection('users').doc(userId);
        
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

        return NextResponse.json({
          success: true,
          paymentStatus: 'SUCCESS',
          message: 'Subscription activated successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          paymentStatus,
          message: 'Payment not completed',
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Failed to verify payment', details: orderResponse },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

