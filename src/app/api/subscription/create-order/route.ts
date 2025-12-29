import { NextRequest, NextResponse } from 'next/server';
import { CFConfig, CFPaymentGateway, CFEnvironment, CFOrderRequest, CFCustomerDetails, CFOrderMeta } from 'cashfree-pg-sdk-nodejs';

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

    // Validate environment variables
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error('Missing Cashfree credentials');
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    // Create CFConfig
    const cfConfig = new CFConfig(
      process.env.CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      '2022-09-01',
      process.env.CASHFREE_APP_ID,
      process.env.CASHFREE_SECRET_KEY
    );

    // Create customer details
    const customerDetails = new CFCustomerDetails();
    customerDetails.customerId = userId;
    customerDetails.customerEmail = email;
    customerDetails.customerName = name;
    customerDetails.customerPhone = phone || '9999999999';

    // Create order meta with return URL and notify URL
    const orderMeta = new CFOrderMeta();
    orderMeta.returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/success?order_id={order_id}`;
    orderMeta.notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscription/webhook`;

    // Create order request
    const orderRequest = new CFOrderRequest();
    orderRequest.orderAmount = 99.00;
    orderRequest.orderCurrency = 'INR';
    orderRequest.customerDetails = customerDetails;
    orderRequest.orderNote = 'Annual Subscription - Rs 99';
    orderRequest.orderMeta = orderMeta;
    
    console.log('Creating order with:', {
      orderAmount: orderRequest.orderAmount,
      orderCurrency: orderRequest.orderCurrency,
      customerId: customerDetails.customerId,
      customerEmail: customerDetails.customerEmail,
      returnUrl: orderMeta.returnUrl,
      notifyUrl: orderMeta.notifyUrl
    });

    // Create payment gateway instance and create order
    const apiInstance = new CFPaymentGateway();
    const result = await apiInstance.orderCreate(cfConfig, orderRequest);

    if (result && result.cfOrder) {
      return NextResponse.json({
        success: true,
        paymentSessionId: result.cfOrder.paymentSessionId,
        orderId: result.cfOrder.orderId,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create order', details: result },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating Cashfree order:', error);
    console.error('Error response:', error.response?.body || error.body);
    console.error('Error status:', error.statusCode || error.status);
    
    // Return more detailed error information
    const errorMessage = error.response?.body?.message || error.body?.message || error.message || 'Unknown error';
    const errorDetails = error.response?.body || error.body || { message: errorMessage };
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order', 
        details: errorMessage,
        cashfreeError: errorDetails,
        statusCode: error.statusCode || error.status || 500
      },
      { status: error.statusCode || error.status || 500 }
    );
  }
}

