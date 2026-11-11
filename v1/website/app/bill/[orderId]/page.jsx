import React from 'react';
import { initDb } from '@/lib/mongodb';
import DigitalBillClient from './DigitalBillClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const orderId = decodeURIComponent(resolvedParams?.orderId || '');

  return {
    title: `Digital Receipt #${orderId} | Aesthetx Ways`,
    description: `Official digital receipt and tax invoice #${orderId} from Aesthetx Ways.`,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `Digital Receipt #${orderId} | Aesthetx Ways`,
      description: `Official digital receipt and tax invoice from Aesthetx Ways.`,
      siteName: 'Aesthetx Ways',
      locale: 'en_IN',
      type: 'website',
    },
  };
}

async function fetchBillData(orderId) {
  try {
    const db = await initDb();
    if (!orderId) return null;

    // 1. Check in POS bills collection
    let bill = await db.collection('bills').findOne({ billNumber: orderId });

    // 2. If not found by billNumber, fallback to orders collection
    if (!bill) {
      const order = await db.collection('orders').findOne({
        $or: [{ orderId }, { orderNumber: orderId }],
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

    if (!bill) return null;

    const pdfUrl = `/api/bills/${bill.billNumber}/pdf?download=1`;

    return {
      ...bill,
      _id: String(bill._id || ''),
      pdfUrl,
      invoiceUrl: pdfUrl,
    };
  } catch (error) {
    console.error('[Page /bill/[orderId]] Error fetching bill:', error);
    return null;
  }
}

export default async function BillPage({ params }) {
  const resolvedParams = await params;
  const orderId = decodeURIComponent(resolvedParams?.orderId || '').trim();
  const rawBill = await fetchBillData(orderId);
  const bill = rawBill ? JSON.parse(JSON.stringify(rawBill)) : null;

  return <DigitalBillClient bill={bill} />;
}

