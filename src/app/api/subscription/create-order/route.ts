import { NextRequest, NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg-sdk-nodejs';

// Initialize Cashfree
const cashfree = new Cashfree({
  env: process.env.CASHFREE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
  apiVersion: '2023-08-01',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, phone } = body;

    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment order
    const orderRequest = {
      orderId: `ORDER_${Date.now()}_${userId}`,
      orderAmount: 99.00,
      orderCurrency: 'INR',
      orderNote: 'Annual Subscription - Rs 99',
      customerDetails: {
        customerId: userId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || '9999999999',
      },
      orderMeta: {
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/success?order_id={order_id}`,
        notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscription/webhook`,
      },
    };

    const orderResponse = await cashfree.PGCreateOrder(
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!,
      orderRequest
    );

    if (orderResponse.status === 'SUCCESS' && orderResponse.data) {
      return NextResponse.json({
        success: true,
        paymentSessionId: orderResponse.data.paymentSessionId,
        orderId: orderResponse.data.orderId,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create order', details: orderResponse },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

