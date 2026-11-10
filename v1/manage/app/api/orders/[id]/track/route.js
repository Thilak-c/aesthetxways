import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { trackDelhiveryOrder } from '@/lib/delhivery';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = await initDb();
    const order = await db.collection('orders').findOne({ orderId });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const waybill = order.delhivery?.waybill || order.shiprocket?.awbCode || order.shiprocket?.shipmentId;

    if (!waybill) {
      return NextResponse.json(
        { error: 'No tracking parameters found' },
        { status: 400 }
      );
    }

    const trackingData = await trackDelhiveryOrder({
      waybill,
      orderId,
    });

    // Auto-sync status with Delhivery live status
    const currentTrackStatus = trackingData?.tracking_data?.shipment_track?.[0]?.status;
    if (currentTrackStatus) {
      const norm = String(currentTrackStatus).toUpperCase();
      let syncedStatus = null;
      if (norm === 'DELIVERED') {
        syncedStatus = 'delivered';
      } else if (norm.includes('TRANSIT') || norm.includes('DISPATCH') || norm.includes('OUT FOR DELIVERY')) {
        syncedStatus = 'in_transit';
      } else if (norm === 'MANIFESTED' || norm === 'UD') {
        if (order.fulfillmentStatus !== 'pickup_scheduled') {
          syncedStatus = 'ready_to_ship';
        }
      }

      if (syncedStatus && syncedStatus !== order.fulfillmentStatus) {
        await db.collection('orders').updateOne(
          { orderId },
          { $set: { fulfillmentStatus: syncedStatus, 'delhivery.status': norm, updatedAt: new Date() } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      tracking: trackingData,
    });
  } catch (error) {
    console.error('[Track Order API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tracking', details: error.message },
      { status: 500 }
    );
  }
}
