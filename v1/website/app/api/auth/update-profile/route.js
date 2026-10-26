import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email, updates } = await request.json();

    if (!email || !updates) {
      return NextResponse.json(
        { success: false, message: 'Email and updates are required' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.toLowerCase().trim();

    // Verify session token from Authorization header or cookie
    const authHeader = request.headers.get('authorization') || '';
    const cookieToken = request.cookies.get('aw_auth_token')?.value;
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const clientToken = bearerToken || cookieToken;

    const secret = process.env.JWT_SECRET || 'aesthetx-secret-2024';
    const expectedToken = crypto.createHmac('sha256', secret).update(emailTrimmed).digest('hex');

    let isValid = false;
    if (clientToken && typeof clientToken === 'string') {
      const clientBuf = Buffer.from(clientToken, 'utf-8');
      const expectedBuf = Buffer.from(expectedToken, 'utf-8');
      if (clientBuf.length === expectedBuf.length && crypto.timingSafeEqual(clientBuf, expectedBuf)) {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call Convex mutation to save the dynamic autosave profile fields
    await convexClient.mutation('users:updateProfileByEmail', {
      email: emailTrimmed,
      updates,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
