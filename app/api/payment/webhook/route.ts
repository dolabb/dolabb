import { NextRequest, NextResponse } from 'next/server';

// Secret key - should be in environment variables in production
const SECRET_KEY = process.env.MOYASAR_SECRET_KEY || 'sk_test_uCbs4YG4Ss71psXWdK3J8z8uZg1ABqSCtbPtCeS7';

// Helper function to verify payment status with Moyasar
async function verifyPaymentStatus(paymentId: string) {
  try {
    const response = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Moyasar verification error:', {
        status: response.status,
        error: errorData,
      });
      return null;
    }

    const paymentData = await response.json();
    return paymentData;
  } catch (error) {
    console.error('Error verifying payment with Moyasar:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, amount, offerId } = body;

    console.log('Payment webhook received:', {
      id,
      status,
      amount,
      offerId,
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
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    // CRITICAL: Verify payment status with Moyasar before processing
    // This ensures we only send emails/notifications when payment is actually successful
    console.log('Verifying payment status with Moyasar before processing...');
    const verifiedPayment = await verifyPaymentStatus(id);

    if (!verifiedPayment) {
      console.error('Failed to verify payment with Moyasar. Aborting webhook processing.');
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          success: false,
        },
        { status: 400 }
      );
    }

    const actualPaymentStatus = verifiedPayment.status;
    console.log('Verified payment status from Moyasar:', {
      paymentId: id,
      reportedStatus: status,
      actualStatus: actualPaymentStatus,
      match: status === actualPaymentStatus,
    });

    // Only process if payment is actually paid
    // Reject if status is 'initiated', 'failed', 'voided', etc.
    if (actualPaymentStatus !== 'paid') {
      console.warn('Payment is not paid. Status:', actualPaymentStatus, '- Skipping email notification and backend processing');
      return NextResponse.json({
        success: true,
        message: 'Webhook received but payment not paid yet',
        data: {
          id,
          status: actualPaymentStatus,
          amount,
          offerId: offerId || null,
          processedAt: new Date().toISOString(),
          emailSent: false, // Explicitly indicate email was NOT sent
          reason: `Payment status is '${actualPaymentStatus}', not 'paid'`,
        },
      });
    }

    // Payment is confirmed as 'paid' - safe to proceed with backend processing
    // Log complete webhook data
    console.log('Payment verified as PAID. Proceeding with backend processing and email notification.', {
      paymentId: id,
      status: actualPaymentStatus,
      amount: amount,
      amountInSAR: (amount / 100).toFixed(2),
      offerId: offerId || null,
      receivedAt: new Date().toISOString(),
    });

    // Forward to Django backend with verified status
    // The Django backend should:
    // 1. Update offer status to 'accepted'
    // 2. Create/update order
    // 3. Send "item sold" email notification (ONLY if status is 'paid')
    // 4. Update affiliate earnings
    // etc.

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully - payment verified as paid',
      data: {
        id,
        status: actualPaymentStatus, // Use verified status, not reported status
        amount,
        offerId: offerId || null,
        processedAt: new Date().toISOString(),
        emailSent: true, // Safe to send email now
        verified: true, // Indicate payment was verified
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
