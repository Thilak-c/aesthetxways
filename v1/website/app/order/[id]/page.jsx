import React from 'react';
import { getDb, initDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import OrderTrackingClient from '@/components/order/OrderTrackingClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '');

  return {
    title: `Track Order #${decodedId} | Aesthetx Ways`,
    description: `Track your order in real-time. Live Shiprocket courier status, expected delivery date, and order breakdown for Aesthetx Ways.`,
    alternates: {
      canonical: `/order/${encodeURIComponent(decodedId)}`,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `Track Order #${decodedId} | Aesthetx Ways`,
      description: `Track your order delivery in real-time with live courier tracking.`,
      url: `/order/${encodeURIComponent(decodedId)}`,
      siteName: 'Aesthetx Ways',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Track Order #${decodedId} | Aesthetx Ways`,
      description: `Track your order delivery in real-time with live courier tracking.`,
    },
  };
}

async function getOrder(orderId) {
  try {
    const db = await getDb();
    let order = await db.collection('orders').findOne({
      $or: [{ orderId }, { orderNumber: orderId }],
    });

    if (!order && ObjectId.isValid(orderId)) {
      try {
        order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
      } catch (e) {
        // Not a valid ObjectId
      }
    }

    if (!order) return null;

    // Serialize MongoDB objects (ObjectId, Date) for Server Component -> Client Component boundary
    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error('Error fetching order on server:', error);
    return null;
  }
}

export default async function OrderTrackingPage({ params }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '');
  const order = await getOrder(decodedId);

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Order',
    orderNumber: decodedId,
    orderStatus: order?.status
      ? `https://schema.org/Order${order.status}`
      : 'https://schema.org/OrderProcessing',
    broker: {
      '@type': 'Organization',
      name: 'Aesthetx Ways',
      url: 'https://aesthetxways.com',
    },
    customer: {
      '@type': 'Person',
      name: order?.customer?.name || order?.customerDetails?.fullName || 'Customer',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OrderTrackingClient initialOrder={order} orderId={decodedId} />
    </>
  );
}
