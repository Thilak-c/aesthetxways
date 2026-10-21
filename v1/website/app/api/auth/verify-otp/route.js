import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.toLowerCase().trim();
    const otpTrimmed = otp.trim();

    // Call Convex mutation to verify OTP and login/signup
    const result = await convexClient.mutation('auth:verifyEmailOtpAndLogin', {
      email: emailTrimmed,
      otp: otpTrimmed,
    });

    if (!result || !result.success) {
      return NextResponse.json(
        { success: false, message: result?.message || 'Invalid or expired OTP code.' },
        { status: 400 }
      );
    }

    const secret = process.env.JWT_SECRET || 'aesthetx-secret-2024';
    const token = crypto.createHmac('sha256', secret).update(emailTrimmed).digest('hex');

    const response = NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });

    response.cookies.set('aw_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
