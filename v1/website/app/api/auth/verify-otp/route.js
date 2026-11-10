import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
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

    // Verify OTP in MongoDB
    const db = await getDb();
    const record = await db.collection('passwordResetOTPs').findOne({
      email: emailTrimmed,
      otp: otpTrimmed,
      expiresAt: { $gte: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP code.' },
        { status: 400 }
      );
    }

    // Delete used OTP
    await db.collection('passwordResetOTPs').deleteMany({ email: emailTrimmed });

    // Find or create user in MongoDB
    let user = await db.collection('users').findOne({ email: emailTrimmed });
    if (!user) {
      const newUser = {
        email: emailTrimmed,
        name: emailTrimmed.split('@')[0],
        role: 'user',
        createdAt: new Date(),
      };
      const insertResult = await db.collection('users').insertOne(newUser);
      user = { ...newUser, _id: insertResult.insertedId };
    }

    const secret = process.env.JWT_SECRET || 'aesthetx-secret-2024';
    const token = crypto.createHmac('sha256', secret).update(emailTrimmed).digest('hex');

    const response = NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id?.toString() || user.originalConvexId || user.id,
        name: user.name || emailTrimmed.split('@')[0],
        email: user.email,
        role: user.role || 'user',
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
