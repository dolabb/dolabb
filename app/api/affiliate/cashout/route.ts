import { NextRequest, NextResponse } from 'next/server';

// Request cashout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateId, amount, currency, bankReference } = body;

    if (!affiliateId || !amount) {
      return NextResponse.json(
        { error: 'Affiliate ID and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Minimum cashout amount is 100 in the selected currency
    const MIN_CASHOUT_AMOUNT = 100;
    if (amount < MIN_CASHOUT_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum cashout amount is ${MIN_CASHOUT_AMOUNT} ${currency || 'SAR'}` },
        { status: 400 }
      );
    }

    // In production:
    // 1. Verify affiliate exists and is active
    // 2. Check available balance
    // 3. Create cashout request with status 'pending'
    // 4. Notify admin

    const cashoutRequest = {
      id: Date.now().toString(),
      affiliateId,
      amount,
      currency: currency || 'SAR',
      bankReference: bankReference || null,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };

    return NextResponse.json({
      success: true,
      cashoutRequest,
      message: 'Cashout request submitted successfully',
    });
  } catch (error: any) {
    console.error('Cashout request error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get cashout requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    if (!affiliateId) {
      return NextResponse.json(
        { error: 'Affiliate ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    const cashoutRequests: any[] = [];

    return NextResponse.json({
      success: true,
      cashoutRequests,
    });
  } catch (error: any) {
    console.error('Get cashout requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

