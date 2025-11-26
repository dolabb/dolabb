import { NextRequest, NextResponse } from 'next/server';

// Secret key - should be in environment variables in production
const SECRET_KEY = 'sk_test_uCbs4YG4Ss71psXWdK3J8z8uZg1ABqSCtbPtCeS7';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    console.log('Verifying payment:', paymentId);

    // Verify payment status with Moyasar API
    const response = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
      },
    });

    console.log('Moyasar verification response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Moyasar verification error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      return NextResponse.json(
        { 
          error: errorData.message || errorData.type || 'Payment verification failed',
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const paymentData = await response.json();

    // Log complete verification response
    console.log('Complete Payment Verification Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: paymentData,
    });

    return NextResponse.json({
      success: true,
      payment: paymentData,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

