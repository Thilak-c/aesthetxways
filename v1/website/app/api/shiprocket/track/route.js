import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/mongodb';
import { trackShiprocketOrder } from '@/lib/shiprocket';

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
      if (order && order.shiprocket) {
        shiprocketOrderId = order.shiprocket.orderId;
        shipmentId = order.shiprocket.shipmentId;
        awbCode = order.shiprocket.awbCode;
      }
    }

    if (!shiprocketOrderId && !shipmentId && !awbCode) {
      return NextResponse.json(
        { error: 'Shiprocket Order ID, Shipment ID, or AWB is required.' },
        { status: 400 }
      );
    }

    const trackData = await trackShiprocketOrder({
      orderId: shiprocketOrderId,
      shipmentId,
      awbCode,
    });

    // Parse tracking info cleanly for front-end
    let trackInfo = null;
    let trackUrl = '';

    if (Array.isArray(trackData) && trackData[0]) {
      const firstKey = Object.keys(trackData[0])[0];
      const details = trackData[0][firstKey]?.tracking_data;
      if (details) {
        const shipmentTrack = details.shipment_track?.[0] || {};
        trackUrl = details.track_url || (shipmentTrack.awb_code ? `https://shiprocket.co/tracking/${shipmentTrack.awb_code}` : '');
        trackInfo = {
          currentStatus: shipmentTrack.current_status || details.error || 'Booked',
          courierName: shipmentTrack.courier_name || '',
          awbCode: shipmentTrack.awb_code || awbCode || '',
          edd: shipmentTrack.edd || '',
          origin: shipmentTrack.origin || '',
          destination: shipmentTrack.destination || '',
          activities: details.shipment_track_activities || [],
          trackUrl: trackUrl || (shiprocketOrderId ? `https://shiprocket.co/tracking/?order_id=${shiprocketOrderId}` : ''),
        };
      }
    } else if (trackData?.tracking_data) {
      const details = trackData.tracking_data;
      const shipmentTrack = details.shipment_track?.[0] || {};
      trackUrl = details.track_url || (shipmentTrack.awb_code ? `https://shiprocket.co/tracking/${shipmentTrack.awb_code}` : '');
      trackInfo = {
        currentStatus: shipmentTrack.current_status || 'In Transit',
        courierName: shipmentTrack.courier_name || '',
        awbCode: shipmentTrack.awb_code || awbCode || '',
        edd: shipmentTrack.edd || '',
        activities: details.shipment_track_activities || [],
        trackUrl: trackUrl || (shiprocketOrderId ? `https://shiprocket.co/tracking/?order_id=${shiprocketOrderId}` : ''),
      };
    }

    return NextResponse.json({
      success: true,
      data: trackInfo || {
        currentStatus: 'Order Confirmed & Booked on Shiprocket',
        trackUrl: awbCode
          ? `https://shiprocket.co/tracking/${awbCode}`
          : (shiprocketOrderId ? `https://shiprocket.co/tracking/?order_id=${shiprocketOrderId}` : 'https://shiprocket.co/tracking'),
        activities: [],
      },
      raw: trackData,
    });
  } catch (error) {
    console.error('Shiprocket track API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch live tracking details' },
      { status: 500 }
    );
  }
}
