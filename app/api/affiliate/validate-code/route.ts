import { NextRequest, NextResponse } from 'next/server';

// In production, this would check against a database
// For now, we'll simulate with a simple check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      );
    }

    // In production, check if code exists in database and affiliate is active
    // For now, we'll accept any code that matches the format AFF-XXXXXX
    const codePattern = /^AFF-[A-Z0-9]{6}$/;
    
    if (!codePattern.test(code)) {
      return NextResponse.json(
        { error: 'Invalid affiliate code format' },
        { status: 400 }
      );
    }

    // In production, verify the code exists and affiliate is active
    // For demo purposes, we'll return success for valid format
    return NextResponse.json({
      valid: true,
      message: 'Affiliate code is valid',
    });
  } catch (error: any) {
    console.error('Code validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

