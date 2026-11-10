import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const DEFAULT_SELLER = {
  companyName: 'Aesthetx Ways',
  addressLine1: 'Kankarbagh Colony More, Ghrounda',
  addressLine2: 'opp. Pillar 42',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  stateCode: '10',
  country: 'India',
  phone: '7033769997',
  email: 'support@aesthetxways.com',
  gstin: '10AAACA0000A1Z5',
  signatureTitle: 'Authorized Signature for Aesthetx Ways',
  reverseCharge: 'No',
};

export async function GET() {
  try {
    const db = await getDb();
    const settingsDoc = await db.collection('settings').findOne({ _id: 'site_settings' });

    return NextResponse.json({
      success: true,
      seller: settingsDoc?.seller || DEFAULT_SELLER,
    });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ success: true, seller: DEFAULT_SELLER });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();
    await db.collection('settings').updateOne(
      { _id: 'site_settings' },
      { $set: { seller: body.seller, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

