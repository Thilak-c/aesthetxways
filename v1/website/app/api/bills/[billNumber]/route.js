import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const db = await initDb();
    const resolvedParams = await params;
    const rawParam = resolvedParams?.billNumber || '';
    const billNumber = decodeURIComponent(String(rawParam)).trim();

    if (!billNumber) {
      return NextResponse.json(
        { success: false, error: 'Bill number / Order ID is required' },
        { status: 400 }
      );
    }

    // 1. Check in POS bills collection
    let bill = await db.collection('bills').findOne({ billNumber });

    // 2. If not found by billNumber, try finding by orderId in orders collection
    if (!bill) {
      const order = await db.collection('orders').findOne({
        $or: [{ orderId: billNumber }, { orderNumber: billNumber }],
      });
      if (order) {
        bill = {
          billNumber: order.orderId || order.orderNumber,
          customerName: order.customer?.name || order.shippingAddress?.fullName || 'Valued Customer',
          customerPhone: order.customer?.mobile || order.shippingAddress?.phone || '',
          customerEmail: order.customer?.email || '',
          items: (order.items || []).map((it) => ({
            productId: it.productId,
            productName: it.title || it.name,
            productImage: it.image || it.productImage,
            size: it.size || 'Standard',
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            sizeDisplayType: it.sizeDisplayType || 'letter',
          })),
          subtotal: Number(order.pricing?.subtotal ?? order.subtotal ?? 0),
          discount: Number(order.pricing?.discount ?? 0),
          discountAmount: Number(order.pricing?.discountAmount ?? 0),
          total: Number(order.pricing?.total ?? order.total ?? 0),
          paymentMethod: order.payment?.method || 'ONLINE',
          createdAt: order.createdAt || new Date().toISOString(),
          branch: 'patna',
          isOnlineOrder: true,
        };
      }
    }

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill record not found' },
        { status: 404 }
      );
    }

    const pdfUrl = `/api/bills/${bill.billNumber}/pdf?download=1`;

    return NextResponse.json({
      success: true,
      bill: {
        ...bill,
        _id: String(bill._id || ''),
        pdfUrl,
        invoiceUrl: pdfUrl,
      },
    });
  } catch (err) {
    console.error('[API /api/bills/[billNumber] GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

