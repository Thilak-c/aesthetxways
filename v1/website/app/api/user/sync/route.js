import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      mobile,
      firstName,
      lastName,
      name,
      address = {},
    } = body;

    if (!email && !mobile) {
      return NextResponse.json(
        { error: 'Either email or mobile is required to sync user profile' },
        { status: 400 }
      );
    }

    const db = await initDb();

    const fullName =
      name ||
      `${firstName || ''} ${lastName || ''}`.trim() ||
      'Customer';

    const userFilter = email
      ? { email: email.toLowerCase().trim() }
      : { mobile: mobile.trim() };

    const updateDoc = {
      $set: {
        name: fullName,
        firstName: firstName || '',
        lastName: lastName || '',
        ...(email ? { email: email.toLowerCase().trim() } : {}),
        ...(mobile ? { mobile: mobile.trim() } : {}),
        primaryAddress: {
          houseNo: address.houseNo || '',
          street: address.street || address.roadArea || '',
          landmark: address.landmark || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
        },
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        orders: [],
      },
    };

    const result = await db.collection('users').updateOne(userFilter, updateDoc, { upsert: true });

    return NextResponse.json({
      success: true,
      message: 'User profile synced to MongoDB successfully',
      matchedCount: result.matchedCount,
      upsertedId: result.upsertedId,
    });
  } catch (error) {
    console.error('[MongoDB] User sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user data in MongoDB' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const mobile = searchParams.get('mobile');

    if (!email && !mobile) {
      return NextResponse.json(
        { error: 'Please provide email or mobile to lookup profile' },
        { status: 400 }
      );
    }

    const db = await initDb();
    const query = email
      ? { email: email.toLowerCase().trim() }
      : { mobile: mobile.trim() };

    const user = await db.collection('users').findOne(query);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[MongoDB] Error finding user:', error);
    return NextResponse.json(
      { error: 'Failed to lookup user profile' },
      { status: 500 }
    );
  }
}
