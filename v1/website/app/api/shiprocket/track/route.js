import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/mongodb';
import { trackDelhiveryOrder } from '@/lib/delhivery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    let shiprocketOrderId = searchParams.get('shiprocketOrderId');
    let shipmentId = searchParams.get('shipmentId');
    let awbCode = searchParams.get('awbCode');

    const db = await initDb();

    if (orderId && (!shiprocketOrderId && !shipmentId && !awbCode)) {
      const order = await db.collection('orders').findOne({
        $or: [{ orderId }, { orderNumber: orderId }],
      });
      if (order) {
        awbCode = order.delhivery?.waybill || order.shiprocket?.awbCode || order.shiprocket?.shipmentId;
        shipmentId = order.delhivery?.waybill || order.shiprocket?.shipmentId;
        shiprocketOrderId = order.orderId;
      }
    }

    if (!shiprocketOrderId && !shipmentId && !awbCode) {
      return NextResponse.json(
        { error: 'Order ID, Shipment ID, or AWB is required.' },
        { status: 400 }
      );
    }

    const waybill = awbCode || shipmentId;
    const trackData = await trackDelhiveryOrder({
      waybill,
      orderId,
    });

    const dlvTrackUrl = waybill ? `https://www.delhivery.com/track/package/${waybill}` : 'https://www.delhivery.com';
    let trackInfo = null;

    if (trackData?.tracking_data) {
      const details = trackData.tracking_data;
      const shipmentTrack = details.shipment_track?.[0] || {};
      trackInfo = {
        currentStatus: shipmentTrack.current_status || 'In Transit',
        courierName: shipmentTrack.courier_name || 'Delhivery Surface Express',
        awbCode: shipmentTrack.awb_code || waybill || '',
        edd: shipmentTrack.edd || '3-5 Business Days',
        origin: shipmentTrack.origin || 'Patna Hub',
        destination: shipmentTrack.destination || '',
        activities: details.shipment_track_activities || [],
        trackUrl: dlvTrackUrl,
      };
    }

    return NextResponse.json({
      success: true,
      data: trackInfo || {
        currentStatus: 'Order Confirmed - Preparing for Dispatch',
        trackUrl: dlvTrackUrl,
        courierName: 'Delhivery Surface Express',
        awbCode: waybill || '',
        activities: [],
      },
      raw: trackData,
    });
  } catch (error) {
    console.error('Delhivery track API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch live tracking details' },
      { status: 500 }
    );
  }
}
