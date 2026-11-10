import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';
import { sendOrderStatusEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request, context) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    const template = body.template || 'ORDER_CONFIRMED';

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = await initDb();
    const order = await db.collection('orders').findOne({ orderId });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const customer = order.customer || {};
    const customerPhone = customer.mobile || order.address?.mobile || '7033769997';
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Runner';

    // 1. Send Real Email via Hostinger SMTP
    let emailResult = null;
    if (customer.email) {
      try {
        emailResult = await sendOrderStatusEmail(order, template);
      } catch (emErr) {
        console.warn(`[Email Service] Failed sending order status email for #${orderId}:`, emErr);
      }
    }

    // 2. Mock WhatsApp (pending Meta Business Verification)
    const waResult = await sendMockWhatsAppMessage({
      phone: customerPhone,
      recipientName: customerName,
      template,
      orderId,
      courierName: order.delhivery?.courierName || order.shiprocket?.courierName || 'Delhivery Surface Express',
      awbCode: order.delhivery?.waybill || order.shiprocket?.awbCode || 'Pending',
      totalAmount: order.totalAmount,
    });

    const pushOps = { whatsappLogs: waResult };
    if (emailResult) {
      pushOps.emailLogs = {
        type: template,
        sentAt: new Date(),
        to: customer.email,
        success: emailResult.success !== false,
      };
    }

    await db.collection('orders').updateOne(
      { orderId },
      {
        $push: pushOps,
        $set: { updatedAt: new Date() },
      }
    );

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    const emailNote = customer.email ? ` & Real Email sent to ${customer.email}` : '';

    return NextResponse.json({
      success: true,
      message: `Notification [${template}] dispatched: WhatsApp (Mock)${emailNote}`,
      whatsapp: waResult,
      email: emailResult,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Notification API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch notification', details: error.message },
      { status: 500 }
    );
  }
}


