import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
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

    if (!clientToken || clientToken !== expectedToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile from Convex
    const user = await convexClient.query('users:getProfileByEmail', {
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const address = user.address || {};

    // Map Convex schema (nested address, phoneNumber) to the flat properties expected by frontend
    return NextResponse.json({
      success: true,
      user: {
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        address: address.fullAddress || '',
        houseNo: address.flatNo || '',
        area: address.area || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pinCode || '',
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load profile' },
      { status: 500 }
    );
  }
}
