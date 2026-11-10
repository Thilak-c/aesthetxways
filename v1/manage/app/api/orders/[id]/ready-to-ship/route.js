import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { assignDelhiveryAWB } from '@/lib/delhivery';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';
import { sendShippingNotificationEmail } from '@/lib/email';

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

    let shipmentId = order.delhivery?.waybill || order.shiprocket?.shipmentId;

    // Call Delhivery Production to generate real AWB & manifest
    const awbResult = await assignDelhiveryAWB(order);
    if (!awbResult.success) {
      return NextResponse.json(
        {
          error: awbResult.error || 'Failed to manifest shipment on Delhivery',
          details: awbResult.error,
        },
        { status: 400 }
      );
    }
    shipmentId = awbResult.awbCode;

    // Trigger WhatsApp notification if customer phone exists
    const customer = order.customer || {};
    const customerPhone = customer.mobile || order.address?.mobile || '';
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Runner';

    let waResult = null;
    if (customerPhone) {
      waResult = await sendMockWhatsAppMessage({
        phone: customerPhone,
        recipientName: customerName,
        template: 'READY_TO_SHIP',
        orderId,
        courierName: awbResult.courierName,
        awbCode: awbResult.awbCode,
        totalAmount: order.totalAmount,
      });
    }

    // Dispatch Shipping Notification Email via Hostinger SMTP
    let emailResult = null;
    if (customer.email) {
      try {
        emailResult = await sendShippingNotificationEmail(order, awbResult.awbCode, awbResult.courierName);
      } catch (emErr) {
        console.warn(`[Email Service] Failed sending shipping email for #${orderId}:`, emErr);
      }
    }

    const updateDoc = {
      fulfillmentStatus: 'ready_to_ship',
      'delhivery.waybill': awbResult.awbCode,
      'delhivery.status': 'READY_TO_SHIP',
      'delhivery.courierName': awbResult.courierName,
      'delhivery.routingCode': awbResult.routingCode,
      'delhivery.labelUrl': awbResult.labelUrl,
      'delhivery.trackingUrl': awbResult.trackingUrl,
      'delhivery.awbAssignedAt': new Date(),
      // Backward compatibility fields
      'shiprocket.shipmentId': shipmentId,
      'shiprocket.status': 'READY_TO_SHIP',
      'shiprocket.awbCode': awbResult.awbCode,
      'shiprocket.courierName': awbResult.courierName,
      'shiprocket.courierCompanyId': awbResult.courierCompanyId,
      'shiprocket.routingCode': awbResult.routingCode,
      'shiprocket.labelUrl': awbResult.labelUrl,
      'shiprocket.awbAssignedAt': new Date(),
      'shiprocket.isSimulated': false,
      updatedAt: new Date(),
    };

    const pushOps = { whatsappLogs: waResult };
    if (emailResult) {
      pushOps.emailLogs = {
        type: 'READY_TO_SHIP',
        sentAt: new Date(),
        to: customer.email,
        awbCode: awbResult.awbCode,
        courier: awbResult.courierName,
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
      message: 'Order marked as Ready to Ship, AWB assigned, and Email & Notification sent',
      awbCode: awbResult.awbCode,
      courierName: awbResult.courierName,
      whatsapp: waResult,
      email: emailResult,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Ready To Ship API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to assign AWB', details: error.message },
      { status: 500 }
    );
  }
}
