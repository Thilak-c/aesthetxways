import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Generate a 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send the email via Hostinger SMTP
    await sendVerificationEmail({
      to: email,
      name: name || '',
      code,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      code, // returned so client can verify the user input
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send verification email. Please try again.',
      },
      { status: 500 }
    );
  }
}
