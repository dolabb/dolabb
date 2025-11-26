import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, amount } = body;

    console.log('Payment webhook received:', {
      id,
      status,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Payment status is required' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'Payment amount is required' },
        { status: 400 }
      );
    }

    // Log complete webhook data
    console.log('Complete Payment Webhook Data:', {
      paymentId: id,
      status: status,
      amount: amount,
      amountInSAR: (amount / 100).toFixed(2),
      receivedAt: new Date().toISOString(),
      fullBody: body,
    });

    // Here you can add additional processing:
    // - Update database records
    // - Send notifications
    // - Update order status
    // - Trigger other workflows
    // etc.

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        id,
        status,
        amount,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

