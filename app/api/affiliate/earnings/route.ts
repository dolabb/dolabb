import { NextRequest, NextResponse } from 'next/server';

// Get affiliate earnings
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
    // For now, return mock data
    const earnings = {
      totalEarnings: 0,
      totalCommissions: 0,
      codeUsageCount: 0,
      pendingPayout: 0,
      transactions: [],
    };

    return NextResponse.json({
      success: true,
      earnings,
    });
  } catch (error: any) {
    console.error('Get earnings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Record commission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateCode, platformFee, saleId } = body;

    if (!affiliateCode || !platformFee || !saleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate commission: 25% of platform fee
    const commission = platformFee * 0.25;

    // In production:
    // 1. Find affiliate by code
    // 2. Verify affiliate is active
    // 3. Record commission in database
    // 4. Update affiliate's total earnings
    // 5. Increment code usage count

    // For demo: Store in a way that can be retrieved
    // In production, this would be stored in a database
    const transaction = {
      id: Date.now().toString(),
      affiliateCode,
      saleId,
      platformFee,
      commission,
      date: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      commission,
      transaction,
      message: 'Commission recorded successfully',
    });
  } catch (error: any) {
    console.error('Record commission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

