import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const db = await initDb();
    const resolvedParams = await params;
    const billNumber = resolvedParams?.billNumber ? String(resolvedParams.billNumber) : '';

    if (!billNumber) {
      return NextResponse.json(
        { success: false, error: 'Bill number is required' },
        { status: 400 }
      );
    }

    const bill = await db.collection('bills').findOne({ billNumber });

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bill: {
        ...bill,
        _id: String(bill._id),
      },
    });
  } catch (err) {
    console.error('[API /api/pos/bills/[billNumber] GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

