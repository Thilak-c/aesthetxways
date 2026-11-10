import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.collection('siteSettings').findOne({ key: 'siteStatus' });
    return NextResponse.json({
      success: true,
      status: result?.value || result?.status || 'open',
      message: result?.message || '',
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      status: 'open',
      message: '',
    });
  }
}
