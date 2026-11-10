import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

const DELHIVERY_API_KEY = (process.env.DELHIVERY_API_KEY || '1a34c296bed5e581c0ff8703cef40fbdc8467c0e').replace(/["']/g, '');
const DELHIVERY_BASE_URL = (process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com').replace(/\/+$/, '');

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const orderId = params.id;

    const db = await initDb();
    const order = await db.collection('orders').findOne({
      $or: [{ orderId }, { orderNumber: orderId }, { orderNumber: Number(orderId) }],
    });

    const waybill = order?.delhivery?.waybill || order?.shiprocket?.awbCode || orderId;

    if (!waybill) {
      return NextResponse.json({ error: 'No waybill found for this order' }, { status: 404 });
    }

    const res = await fetch(`${DELHIVERY_BASE_URL}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${DELHIVERY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const pdfUrl = data?.packages?.[0]?.pdf_download_link;
      if (pdfUrl) {
        return NextResponse.redirect(pdfUrl, { status: 302 });
      }
    }

    // Fallback direct Delhivery URL
    return NextResponse.redirect(`https://track.delhivery.com/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true`, { status: 302 });
  } catch (error) {
    console.error('[Delhivery Label Route Error]:', error);
    return NextResponse.json({ error: 'Failed to generate shipping label', details: error.message }, { status: 500 });
  }
}

