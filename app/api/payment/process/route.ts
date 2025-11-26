import { NextRequest, NextResponse } from 'next/server';

// Secret key - should be in environment variables in production
const SECRET_KEY = 'sk_test_uCbs4YG4Ss71psXWdK3J8z8uZg1ABqSCtbPtCeS7';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, amount, description, metadata, cardDetails, orderId } = body;

    console.log('Payment process request received:', {
      orderId,
      amount,
      hasCardDetails: !!cardDetails,
      hasTokenId: !!tokenId,
      metadata,
    });

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    // Convert amount to halalas (smallest currency unit)
    // If amount is already large (>= 1000), assume it's already in halalas
    // Otherwise, assume it's in SAR and convert
    const amountValue = parseFloat(amount);
    const amountInHalalas = amountValue >= 1000 
      ? Math.round(amountValue) 
      : Math.round(amountValue * 100);

    // Determine payment source
    let source: any;
    
    if (tokenId) {
      // Use token if provided
      console.log('Creating payment with token:', tokenId);
      source = {
        type: 'token',
        token: tokenId,
      };
    } else if (cardDetails) {
      // Use card details directly if provided
      console.log('Creating payment with card details');
      source = {
        type: 'creditcard',
        name: cardDetails.name,
        number: cardDetails.number,
        month: cardDetails.month,
        year: cardDetails.year,
        cvc: cardDetails.cvc,
      };
    } else {
      return NextResponse.json(
        { error: 'Token ID or card details are required' },
        { status: 400 }
      );
    }

    // Get callback URL from request headers
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/api')[0] || 'http://localhost:3000';
    const locale = metadata?.locale || 'en';
    const callbackUrl = `${origin}/${locale}/payment/callback?offerId=${metadata?.offerId || ''}&product=${encodeURIComponent(metadata?.product || '')}&offerPrice=${metadata?.offerPrice || ''}&shipping=${metadata?.shipping || ''}`;
    
    console.log('Creating payment with callback URL:', callbackUrl);

    // Create payment using Moyasar API
    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountInHalalas,
        currency: 'SAR',
        description: description || 'Payment for offer',
        callback_url: callbackUrl, // Required for 3DS verification
        source: source,
        metadata: metadata || {},
      }),
    });

    console.log('Payment API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Moyasar API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      // Return detailed error information
      return NextResponse.json(
        { 
          error: errorData.message || errorData.type || 'Payment processing failed',
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const paymentData = await response.json();

    // Log complete response
    console.log('Complete Payment API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: paymentData,
      orderId: orderId,
    });

    return NextResponse.json({
      success: true,
      payment: paymentData,
      orderId: orderId,
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

