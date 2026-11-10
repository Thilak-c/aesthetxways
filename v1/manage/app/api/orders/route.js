import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { createDelhiveryShipment, getDelhiveryRate } from '@/lib/delhivery';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const db = await initDb();
    const filter = {
      // Exclude abandoned checkout payment drafts
      'payment.status': { $ne: 'PENDING_PAYMENT' },
    };

    if (status && status !== 'all') {
      if (status === 'pending') {
        filter.$or = [
          { fulfillmentStatus: 'pending' },
          { fulfillmentStatus: 'unfulfilled' },
          { fulfillmentStatus: null },
          { fulfillmentStatus: { $exists: false } },
        ];
      } else {
        filter.fulfillmentStatus = status;
      }
    }

    if (query) {
      const q = query.trim();
      filter.$or = [
        { orderId: { $regex: q, $options: 'i' } },
        { orderNumber: { $regex: q, $options: 'i' } },
        { legacyOrderId: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.mobile': { $regex: q, $options: 'i' } },
        { 'customer.email': { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await db
      .collection('orders')
      .find(filter)
      .limit(200)
      .toArray();

    // Strict descending sort so newest orders are always at the top
    orders.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.created_at || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.created_at || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    // Populate live real Delhivery courier cost from server if not already stored
    await Promise.all(
      orders.map(async (ord) => {
        if (!ord.delhivery) ord.delhivery = {};
        if (!ord.delhivery.cost) {
          const destPin = ord.shippingAddress?.pincode || ord.address?.pincode || ord.customer?.address?.pincode;
          if (destPin) {
            const method = (ord.paymentMethod || ord.payment?.method || '').toLowerCase();
            const isPartial = method === 'partial_cod' || (Number(ord.payment?.advancePaid ?? ord.advancePaid) > 0 && Number(ord.payment?.advancePaid ?? ord.advancePaid) < Number(ord.orderTotal || ord.totalAmount));
            const isFullCod = method === 'full_cod' || method === 'cod';
            const isCod = isPartial || isFullCod;
            const codAmt = isPartial ? Number(ord.payment?.balanceDue ?? ord.balanceDue ?? 0) : (isFullCod ? Number(ord.orderTotal || ord.totalAmount || 0) : 0);
            const totalUnits = (ord.items || []).reduce((s, it) => s + (Number(it.quantity) || 1), 0) || 1;
            const orderWeight = (ord.items || []).reduce((s, it) => {
              const itemW = Number(it.weight || it.shipping?.weight || 450);
              return s + (itemW * (Number(it.quantity) || 1));
            }, 0) || (totalUnits * 450);
            try {
              const rate = await Promise.race([
                getDelhiveryRate({
                  destPincode: destPin,
                  originPincode: ord.pickupLocation === 'gaya' ? '823001' : '800001',
                  weightGrams: orderWeight,
                  paymentMode: isCod ? 'COD' : 'Prepaid',
                  codAmount: codAmt,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Delhivery rate timeout')), 1200)),
              ]);
              if (rate) {
                ord.delhivery.cost = rate.totalCost;
                ord.delhivery.freight = rate.freight;
                ord.delhivery.zone = rate.zone;
                ord.delhivery.codCharge = rate.codCharge;
                // Cache into MongoDB so subsequent requests load instantaneously
                db.collection('orders').updateOne(
                  { orderId: ord.orderId },
                  {
                    $set: {
                      'delhivery.cost': rate.totalCost,
                      'delhivery.freight': rate.freight,
                      'delhivery.zone': rate.zone,
                      'delhivery.codCharge': rate.codCharge,
                    },
                  }
                ).catch(() => {});
              }
            } catch {}
          }
        }
      })
    );

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[Admin Orders GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders from MongoDB', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const db = await initDb();

    // 1. If an actual order payload with items is provided (e.g. cloned order or custom order creation)
    if (Array.isArray(body.items) && body.items.length > 0) {
      const orderId = body.orderId || Math.floor(100000 + Math.random() * 900000).toString();
      const newOrder = {
        orderId,
        customer: body.customer || {},
        address: body.address || body.shippingAddress || body.customer?.address || {},
        shippingAddress: body.shippingAddress || body.address || body.customer?.address || {},
        items: body.items,
        totalAmount: Number(body.totalAmount) || 0,
        payment: body.payment || {
          method: 'prepaid',
          status: 'PAID',
          advancePaid: Number(body.totalAmount) || 0,
          balanceDue: 0,
        },
        fulfillmentStatus: body.fulfillmentStatus || 'new',
        tags: Array.isArray(body.tags) ? body.tags : [],
        shiprocket: body.shiprocket || {
          status: 'NEW',
        },
        internalNote: body.internalNote || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('orders').insertOne(newOrder);

      return NextResponse.json({
        success: true,
        message: `Order #${orderId} created successfully`,
        order: newOrder,
      });
    }

    // 2. Otherwise: Quick Test Order Generator
    const sixDigitId = Math.floor(100000 + Math.random() * 900000).toString();
    const orderId = body.orderId || sixDigitId;
    const mockNames = ['Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Malhotra'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    const isPartialCod = Math.random() > 0.5;
    const testOrder = {
      orderId,
      customer: {
        name: body.customerName || randomName,
        email: body.customerEmail || `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
        mobile: body.customerMobile || randomMobile,
        address: {
          houseNo: 'Flat 402, Lotus Arcade',
          street: 'Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      },
      items: [
        {
          id: 'drop-hybrid-women',
          name: 'Sonu Hybrid RN v1 - Road Edition',
          size: 'UK 8',
          quantity: 1,
          priceNumber: 13995,
          colorway: 'Grey / Vibrant Green',
          image: '/images/test/1e462d9Nike-IV2476-200_1.avif',
        },
      ],
      totalAmount: 13995,
      payment: {
        method: isPartialCod ? 'partial_cod' : 'prepaid',
        status: isPartialCod ? 'PARTIALLY_PAID' : 'PAID',
        advancePaid: isPartialCod ? 200 : 13995,
        balanceDue: isPartialCod ? 13795 : 0,
      },
      fulfillmentStatus: 'ready_to_ship',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Register shipment on Delhivery Production
    const dlvData = await createDelhiveryShipment(testOrder);
    testOrder.delhivery = {
      waybill: dlvData.waybill,
      status: 'READY_TO_SHIP',
      courierName: 'Delhivery Surface Express',
      labelUrl: dlvData.labelUrl,
      trackingUrl: dlvData.trackingUrl,
      createdAt: new Date(),
    };
    testOrder.shiprocket = {
      orderId: testOrder.orderId,
      shipmentId: dlvData.waybill,
      awbCode: dlvData.waybill,
      status: 'READY_TO_SHIP',
      courierName: 'Delhivery Surface Express',
      labelUrl: dlvData.labelUrl,
      trackingUrl: dlvData.trackingUrl,
      channelId: 'DELHIVERY_B2C',
      isSimulated: false,
      createdAt: new Date(),
    };

    // Trigger mock WhatsApp Order Confirmed
    const waLog = await sendMockWhatsAppMessage({
      phone: testOrder.customer.mobile,
      recipientName: testOrder.customer.name,
      template: 'ORDER_CONFIRMED',
      orderId: testOrder.orderId,
      totalAmount: testOrder.totalAmount,
    });
    testOrder.whatsappLogs = [waLog];

    await db.collection('orders').insertOne(testOrder);

    return NextResponse.json({
      success: true,
      message: `Test order #${orderId} created successfully`,
      order: testOrder,
    });
  } catch (error) {
    console.error('[Admin Orders POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      fulfillmentStatus,
      status,
      customer,
      address,
      shippingAddress,
      items,
      payment,
      internalNote,
      remark,
      trackingNumber,
      delhivery,
      shiprocket,
      pickupLocation,
      pickupAddress,
      tags,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const db = await initDb();
    const updateFields = {
      updatedAt: new Date(),
    };

    if (fulfillmentStatus !== undefined) updateFields.fulfillmentStatus = fulfillmentStatus;
    if (status !== undefined) updateFields.status = status;
    if (customer !== undefined) updateFields.customer = customer;
    if (address !== undefined) updateFields.address = address;
    if (shippingAddress !== undefined) updateFields.shippingAddress = shippingAddress;
    if (items !== undefined) updateFields.items = items;
    if (payment !== undefined) updateFields.payment = payment;
    if (internalNote !== undefined) updateFields.internalNote = internalNote;
    if (remark !== undefined) updateFields.remark = remark;
    if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;
    if (delhivery !== undefined) updateFields.delhivery = delhivery;
    if (shiprocket !== undefined) updateFields.shiprocket = shiprocket;
    if (pickupLocation !== undefined) updateFields.pickupLocation = pickupLocation;
    if (pickupAddress !== undefined) updateFields.pickupAddress = pickupAddress;
    if (tags !== undefined) updateFields.tags = tags;

    const result = await db.collection('orders').updateOne(
      { orderId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Admin Orders PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update order in MongoDB', details: error.message },
      { status: 500 }
    );
  }
}
