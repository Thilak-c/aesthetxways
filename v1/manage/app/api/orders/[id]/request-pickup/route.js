import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { requestDelhiveryPickup, getDelhiveryLabelUrl } from '@/lib/delhivery';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';
import { sendOrderStatusEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request, context) {
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

    // 1. Request pickup from Delhivery Production
    const pickupResult = await requestDelhiveryPickup(waybill);
    if (!pickupResult.success) {
      return NextResponse.json({
        success: false,
        error: pickupResult.error || 'Failed to schedule pickup with Delhivery',
      }, { status: 400 });
    }

    // 2. Generate shipping label PDF link from Delhivery Production
    const labelUrl = getDelhiveryLabelUrl(waybill);

    // 3. Trigger Mock WhatsApp Notification
    const customer = order.customer || {};
    const customerPhone = customer.mobile || order.address?.mobile || '7033769997';
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Runner';

    const waResult = await sendMockWhatsAppMessage({
      phone: customerPhone,
      recipientName: customerName,
      template: 'PICKUP_SCHEDULED',
      orderId,
      courierName: order.delhivery?.courierName || order.shiprocket?.courierName || 'Delhivery Surface Express',
      awbCode: waybill || 'Pending',
      totalAmount: order.totalAmount,
    });

    // 4. Dispatch Pickup Scheduled Email via Hostinger SMTP
    let emailResult = null;
    if (customer.email) {
      try {
        emailResult = await sendOrderStatusEmail(order, 'PICKUP_SCHEDULED');
      } catch (emErr) {
        console.warn(`[Email Service] Failed sending pickup email for #${orderId}:`, emErr);
      }
    }

    const updateDoc = {
      fulfillmentStatus: 'pickup_scheduled',
      'delhivery.status': 'PICKUP_SCHEDULED',
      'delhivery.pickupToken': pickupResult.pickupToken,
      'delhivery.pickupScheduledDate': pickupResult.pickupScheduledDate,
      'delhivery.pickupScheduledAt': new Date(),
      'delhivery.labelUrl': labelUrl,
      // Backward compatibility fields
      'shiprocket.status': 'PICKUP_SCHEDULED',
      'shiprocket.pickupToken': pickupResult.pickupToken,
      'shiprocket.pickupScheduledDate': pickupResult.pickupScheduledDate,
      'shiprocket.pickupScheduledAt': new Date(),
      'shiprocket.labelUrl': labelUrl,
      updatedAt: new Date(),
    };

    const pushOps = { whatsappLogs: waResult };
    if (emailResult) {
      pushOps.emailLogs = {
        type: 'PICKUP_SCHEDULED',
        sentAt: new Date(),
        to: customer.email,
        pickupToken: pickupResult.pickupToken,
        success: emailResult.success !== false,
      };
    }

    await db.collection('orders').updateOne(
      { orderId },
      {
        $set: updateDoc,
        $push: pushOps,
      }
    );

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    return NextResponse.json({
      success: true,
      message: 'Delhivery pickup scheduled successfully & Email notification sent',
      pickupToken: pickupResult.pickupToken,
      pickupDate: pickupResult.pickupScheduledDate,
      labelUrl,
      whatsapp: waResult,
      email: emailResult,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Request Pickup API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to schedule pickup', details: error.message },
      { status: 500 }
    );
  }
}
