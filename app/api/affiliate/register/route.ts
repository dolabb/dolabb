import { NextRequest, NextResponse } from 'next/server';

// Generate unique affiliate code
function generateAffiliateCode(): string {
  const prefix = 'AFF';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
      countryCode,
      dialCode,
      bankName,
      accountNumber,
      iban,
      accountHolderName,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !password || !bankName || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique affiliate code
    const affiliateCode = generateAffiliateCode();

    // In a real application, you would:
    // 1. Hash the password
    // 2. Store affiliate data in database
    // 3. Send verification email
    // 4. Handle duplicate email/phone checks

    // For now, we'll simulate storing in localStorage (client-side)
    // In production, this should be stored in a database
    const affiliate = {
      id: Date.now().toString(),
      fullName,
      email,
      phone: `${dialCode} ${phone}`,
      countryCode,
      affiliateCode,
      bankDetails: {
        bankName,
        accountNumber,
        iban: iban || null,
        accountHolderName,
      },
      totalEarnings: 0,
      totalCommissions: 0,
      codeUsageCount: 0,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    return NextResponse.json({
      success: true,
      affiliate,
      message: 'Affiliate registered successfully',
    });
  } catch (error: any) {
    console.error('Affiliate registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

