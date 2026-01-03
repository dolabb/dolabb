import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, userId } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Save the contact form submission to a database
    // 2. Send an email notification to the support team
    // 3. Optionally send a confirmation email to the user
    // 4. Log the submission for tracking

    // For now, we'll simulate storing the contact form data
    const contactSubmission = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      userId: userId || null,
      submittedAt: new Date().toISOString(),
      status: 'new',
    };

    // In production, save to database:
    // await db.contactSubmissions.create({ data: contactSubmission });

    // In production, send email notification:
    // await sendEmail({
    //   to: 'support@dolabb.com',
    //   subject: `New Contact Form Submission: ${subject}`,
    //   body: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
    // });

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      submission: contactSubmission,
    });
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

