import { NextRequest, NextResponse } from 'next/server';

// Secret key - should be in environment variables in production
const SECRET_KEY = 'sk_test_uCbs4YG4Ss71psXWdK3J8z8uZg1ABqSCtbPtCeS7';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, amount, description, metadata, cardDetails, orderId } =
      body;

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
    const amountInHalalas =
      amountValue >= 1000
        ? Math.round(amountValue)
        : Math.round(amountValue * 100);

    // Determine payment source
    let source: {
      type: string;
      token?: string;
      name?: string;
      number?: string;
      month?: string;
      year?: string;
      cvc?: string;
    };

    if (tokenId) {
      // Use token if provided
      console.log('Creating payment with token:', tokenId);
      source = {
        type: 'token',
        token: tokenId,
      };
    } else if (cardDetails) {
      // Use card details directly if provided
      // Sanitize card number - remove any non-numeric characters
      const sanitizedCardNumber = cardDetails.number?.replace(/\D/g, '') || '';
      
      console.log('Creating payment with card details:', {
        nameLength: cardDetails.name?.length,
        cardNumberLength: sanitizedCardNumber.length,
        cardNumberFirst4: sanitizedCardNumber.slice(0, 4),
        cardNumberLast4: sanitizedCardNumber.slice(-4),
        month: cardDetails.month,
        year: cardDetails.year,
        cvcLength: cardDetails.cvc?.length,
      });
      
      // Validate card number before sending to Moyasar
      if (sanitizedCardNumber.length < 13 || sanitizedCardNumber.length > 19) {
        return NextResponse.json(
          { error: 'Invalid card number length. Must be 13-19 digits.' },
          { status: 400 }
        );
      }
      
      source = {
        type: 'creditcard',
        name: cardDetails.name,
        number: sanitizedCardNumber,
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

    // Get callback URL from multiple sources with priority:
    // 1. Metadata origin (passed from frontend - most reliable)
    // 2. Environment variable (production)
    // 3. Request origin header
    // 4. Request referer header
    // 5. Fallback to localhost (development only)

    const originFromMetadata = metadata?.origin;
    const productionUrl = process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
        ? process.env.NEXT_PUBLIC_APP_URL
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;

    const originFromHeader =
      request.headers.get('origin') ||
      request.headers
        .get('referer')
        ?.split('/api')[0]
        ?.split('?')[0]
        ?.replace(/\/$/, '');

    // Priority: metadata origin > production URL > header origin > localhost
    let origin =
      originFromMetadata ||
      productionUrl ||
      originFromHeader ||
      'http://localhost:3000';

    // For localhost testing: if origin is localhost but we're in production, use production URL
    // This prevents the "blocked connection" error when 3DS iframe tries to redirect
    if (
      origin.includes('localhost') &&
      productionUrl &&
      !originFromMetadata?.includes('localhost')
    ) {
      console.warn(
        'Localhost detected but production URL available. Using production URL for callback to avoid browser blocking.'
      );
      origin = productionUrl;
    }

    // Ensure origin doesn't have trailing slash and is clean
    const cleanOrigin = origin.replace(/\/$/, '').trim();

    const locale = metadata?.locale || 'en';
    const callbackUrl = `${cleanOrigin}/${locale}/payment/callback?offerId=${
      metadata?.offerId || ''
    }&product=${encodeURIComponent(metadata?.product || '')}&offerPrice=${
      metadata?.offerPrice || ''
    }&shipping=${metadata?.shipping || ''}`;

    console.log('Creating payment with callback URL:', callbackUrl);
    console.log('Origin sources:', {
      originFromMetadata,
      productionUrl,
      originFromHeader,
      finalOrigin: cleanOrigin,
      isLocalhost: cleanOrigin.includes('localhost'),
    });

    // Create payment using Moyasar API
    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString(
          'base64'
        )}`,
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
          error:
            errorData.message || errorData.type || 'Payment processing failed',
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    console.error('Payment processing error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
