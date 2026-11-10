import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import { getDb } from '@/lib/mongodb';
import { createDelhiveryShipment } from '@/lib/delhivery';
import { sendOrderConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      items, 
      customerDetails, 
      paymentMethod, 
      orderTotal,
      shippingFee,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature 
    } = body;
    
    if (!items || !items.length || !customerDetails || !orderTotal) {
      return NextResponse.json({ success: false, message: 'Missing order details' }, { status: 400 });
    }

    const isFullCOD = String(paymentMethod || '').toUpperCase() === 'COD' || String(paymentMethod || '').toLowerCase() === 'full_cod';
    const isPartialCOD = String(paymentMethod || '').toLowerCase() === 'partial_cod';

    // 1. Verify Razorpay payment signature for prepaid and partial COD orders
    if (!isFullCOD) {
      if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
          return NextResponse.json({ success: false, message: 'Razorpay key secret not configured on server' }, { status: 500 });
        }

        const generatedSignature = crypto
          .createHmac('sha256', secret)
          .update(razorpayOrderId + '|' + razorpayPaymentId)
          .digest('hex');

        if (generatedSignature !== razorpaySignature) {
          return NextResponse.json({ success: false, message: 'Payment verification failed: invalid signature' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ success: false, message: 'Payment verification failed: missing payment identifiers' }, { status: 400 });
      }
    }
    
    // 2. Try validating stock and inserting order in Convex
    const sixDigitId = Math.floor(100000 + Math.random() * 900000).toString();
    let orderNumber = sixDigitId;
    let orderId = sixDigitId;

    try {
      // Validate stock in Convex with timeout
      for (const item of items) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 2000)
          );
          const product = await Promise.race([
            convexClient.query('webStore:getProductByItemId', { itemId: item.productId }),
            timeoutPromise,
          ]);
          if (product?.sizeStock) {
            const currentQty = product.sizeStock[item.size] || 0;
            if (currentQty < item.quantity) {
              return NextResponse.json({ 
                success: false, 
                message: `Insufficient stock for ${item.name} (Size: ${item.size}). Only ${currentQty} left.` 
              }, { status: 400 });
            }
          }
        } catch (e) {
          // If product query fails or times out, proceed to avoid blocking paid order
        }
      }
      
      // Call Convex mutation with 3s timeout
      const mutationTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Convex mutation timeout')), 3000)
      );
      const result = await Promise.race([
        convexClient.mutation('orders:createOrder', {
          userId: 'guest',
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image || '',
            quantity: Number(item.quantity),
            size: item.size,
          })),
          shippingDetails: {
            fullName: customerDetails.fullName,
            email: customerDetails.email,
            phone: customerDetails.phone,
            flatNo: '',
            area: '',
            landmark: '',
            address: customerDetails.address,
            city: customerDetails.city,
            state: customerDetails.state,
            pincode: customerDetails.pincode,
            country: 'India',
          },
          paymentDetails: {
            razorpayOrderId,
            razorpayPaymentId,
            amount: Number(orderTotal),
            currency: 'INR',
            status: isPartialCOD ? 'partially_paid' : (isFullCOD ? 'pending' : 'completed'),
            paymentMethod: isPartialCOD ? 'partial_cod' : (isFullCOD ? 'COD' : paymentMethod || 'prepaid'),
            paidAt: Date.now(),
            paidBy: customerDetails.fullName,
            codCharge: isPartialCOD ? 200 : (isFullCOD ? 100 : undefined),
            advancePaid: isPartialCOD ? 200 : (isFullCOD ? 0 : Number(orderTotal)),
            remainingCOD: isPartialCOD ? Math.max(0, Number(orderTotal) - 200) : (isFullCOD ? Number(orderTotal) : undefined),
          },
          orderTotal: Number(orderTotal),
          status: 'pending',
        }),
        mutationTimeout,
      ]);

      // Enforce clean 6-digit random order number across all platforms
      orderNumber = sixDigitId;
      orderId = sixDigitId;
    } catch (convexErr) {
      console.warn('Convex order creation failed/timed out, saving directly to MongoDB:', convexErr?.message || convexErr);
    }

    // Always persist order to MongoDB with full Sonu admin schema compatibility
    try {
      const db = await getDb();
      const advancePaid = isPartialCOD ? 200 : (isFullCOD ? 0 : Number(orderTotal));
      const balanceDue = isPartialCOD ? Math.max(0, Number(orderTotal) - 200) : (isFullCOD ? Number(orderTotal) : 0);
      const dbPaymentMethod = isPartialCOD ? 'partial_cod' : (isFullCOD ? 'full_cod' : paymentMethod || 'prepaid');
      const dbPaymentStatus = isPartialCOD ? 'PARTIALLY_PAID' : (isFullCOD ? 'COD' : 'PAID');

      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            orderNumber,
            orderId,
            totalAmount: Number(orderTotal),
            orderTotal: Number(orderTotal),
            items: items.map((it) => ({
              id: it.productId,
              name: it.name,
              priceNumber: Number(it.price),
              quantity: Number(it.quantity),
              size: it.size,
              image: it.image || '',
            })),
            customer: {
              name: customerDetails.fullName || customerDetails.name,
              email: customerDetails.email,
              mobile: customerDetails.phone || customerDetails.mobile,
              address: {
                houseNo: customerDetails.houseNo || customerDetails.flatNo || '',
                flatNo: customerDetails.flatNo || customerDetails.houseNo || '',
                street: customerDetails.street || customerDetails.roadArea || '',
                roadArea: customerDetails.roadArea || customerDetails.street || '',
                landmark: customerDetails.landmark || '',
                city: customerDetails.city,
                state: customerDetails.state,
                pincode: customerDetails.pincode,
              },
            },
            shippingAddress: {
              fullName: customerDetails.fullName || customerDetails.name,
              name: customerDetails.fullName || customerDetails.name,
              houseNo: customerDetails.houseNo || customerDetails.flatNo || '',
              flatNo: customerDetails.flatNo || customerDetails.houseNo || '',
              street: customerDetails.street || customerDetails.roadArea || '',
              roadArea: customerDetails.roadArea || customerDetails.street || '',
              landmark: customerDetails.landmark || '',
              address: customerDetails.address || [customerDetails.houseNo, customerDetails.street].filter(Boolean).join(', '),
              city: customerDetails.city,
              state: customerDetails.state,
              pincode: customerDetails.pincode,
              mobile: customerDetails.phone || customerDetails.mobile,
              phone: customerDetails.phone || customerDetails.mobile,
              email: customerDetails.email,
            },
            address: {
              houseNo: customerDetails.houseNo || customerDetails.flatNo || '',
              flatNo: customerDetails.flatNo || customerDetails.houseNo || '',
              street: customerDetails.street || customerDetails.roadArea || '',
              roadArea: customerDetails.roadArea || customerDetails.street || '',
              landmark: customerDetails.landmark || '',
              address: customerDetails.address || [customerDetails.houseNo, customerDetails.street].filter(Boolean).join(', '),
              city: customerDetails.city,
              state: customerDetails.state,
              pincode: customerDetails.pincode,
              mobile: customerDetails.phone || customerDetails.mobile,
              phone: customerDetails.phone || customerDetails.mobile,
            },
            pricing: {
              finalTotal: Number(orderTotal),
              grandTotal: Number(orderTotal),
              subtotal: Number(orderTotal),
              shippingFee: shippingFee || (orderTotal > 2499 ? 129 : 79),
            },
            paymentMethod: dbPaymentMethod,
            paymentStatus: dbPaymentStatus,
            advancePaid,
            balanceDue,
            payment: {
              method: dbPaymentMethod,
              status: dbPaymentStatus,
              amount: Number(orderTotal),
              advancePaid,
              balanceDue,
              razorpayOrderId,
              razorpayPaymentId,
            },
            fulfillmentStatus: 'ready_to_ship',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`[Orders] Saved order ${orderId} to MongoDB.`);

      // Automatically manifest shipment on Delhivery Production so order immediately syncs to delivery app
      try {
        const orderForDelhivery = {
          orderId,
          orderNumber,
          customer: {
            name: customerDetails.fullName,
            email: customerDetails.email,
            mobile: customerDetails.phone,
          },
          shippingAddress: {
            fullName: customerDetails.fullName,
            houseNo: customerDetails.houseNo || customerDetails.flatNo || '',
            flatNo: customerDetails.flatNo || customerDetails.houseNo || '',
            street: customerDetails.street || customerDetails.roadArea || '',
            roadArea: customerDetails.roadArea || customerDetails.street || '',
            landmark: customerDetails.landmark || '',
            address: customerDetails.address || [customerDetails.houseNo, customerDetails.street].filter(Boolean).join(', '),
            city: customerDetails.city,
            state: customerDetails.state,
            pincode: customerDetails.pincode,
            phone: customerDetails.phone,
            mobile: customerDetails.phone,
          },
          pricing: {
            finalTotal: Number(orderTotal),
            grandTotal: Number(orderTotal),
          },
          totalAmount: Number(orderTotal),
          payment: {
            method: dbPaymentMethod,
            status: dbPaymentStatus,
            amount: Number(orderTotal),
            advancePaid,
            balanceDue,
          },
          items,
          createdAt: new Date(),
        };

        const dlvRes = await createDelhiveryShipment(orderForDelhivery);
        if (dlvRes && dlvRes.success && dlvRes.waybill) {
          const delhiveryData = {
            waybill: dlvRes.waybill,
            status: 'READY_TO_SHIP',
            courierName: 'Delhivery Surface Express',
            labelUrl: dlvRes.labelUrl,
            trackingUrl: dlvRes.trackingUrl,
            cost: dlvRes.cost,
            freight: dlvRes.freight,
            zone: dlvRes.zone,
            codCharge: dlvRes.codCharge,
            createdAt: new Date(),
          };

          await db.collection('orders').updateOne(
            { orderId },
            {
              $set: {
                delhivery: delhiveryData,
                shiprocket: {
                  orderId,
                  shipmentId: dlvRes.waybill,
                  awbCode: dlvRes.waybill,
                  status: 'READY_TO_SHIP',
                  courierName: 'Delhivery Surface Express',
                  labelUrl: dlvRes.labelUrl,
                  trackingUrl: dlvRes.trackingUrl,
                  channelId: 'DELHIVERY_B2C',
                },
                updatedAt: new Date(),
              },
            }
          );
          console.log(`[Delhivery] Successfully auto-manifested shipment ${dlvRes.waybill} for order #${orderId}`);
        } else {
          console.warn(`[Delhivery] Auto-manifest warning for order #${orderId}:`, dlvRes?.error);
        }
      } catch (dlvErr) {
        console.error('[Delhivery] Auto-manifest error:', dlvErr.message);
      }

      // Dispatch pixel-to-pixel order confirmation email to customer (Sonu template)
      try {
        if (customerDetails.email) {
          sendOrderConfirmationEmail({
            orderId,
            orderNumber,
            customer: {
              name: customerDetails.fullName || customerDetails.name,
              email: customerDetails.email,
              mobile: customerDetails.phone,
            },
            shippingAddress: {
              fullName: customerDetails.fullName,
              address: customerDetails.address,
              city: customerDetails.city,
              state: customerDetails.state,
              pincode: customerDetails.pincode,
            },
            items,
            totalAmount: Number(orderTotal),
            orderTotal: Number(orderTotal),
            payment: {
              method: dbPaymentMethod,
              advancePaid,
              balanceDue,
            },
            paymentMethod: dbPaymentMethod,
            delhivery: dlvRes?.waybill ? { waybill: dlvRes.waybill } : null,
            estimatedDelivery: customerDetails.deliveryEtd || '3-5 business days',
            createdAt: new Date(),
          }).catch((err) => console.error('[Order Route] Email dispatch error:', err));
        }
      } catch (emailErr) {
        console.error('[Order Route] Failed dispatching customer confirmation email:', emailErr);
      }
    } catch (dbErr) {
      console.error('Failed to save order to MongoDB:', dbErr);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Order placed successfully!', 
      orderNumber,
      order: {
        orderNumber,
        items,
        customerDetails,
        paymentMethod: isPartialCOD ? 'partial_cod' : (isFullCOD ? 'full_cod' : paymentMethod),
        paymentStatus: isPartialCOD ? 'PARTIALLY_PAID' : (isFullCOD ? 'pending' : 'paid'),
        orderStatus: 'ready_to_ship',
        orderTotal,
        advancePaid: isPartialCOD ? 200 : (isFullCOD ? 0 : Number(orderTotal)),
        balanceDue: isPartialCOD ? Math.max(0, Number(orderTotal) - 200) : (isFullCOD ? Number(orderTotal) : 0),
        _id: orderId,
      }
    });
  } catch (error) {
    console.error('Failed to process order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone') || searchParams.get('mobile');

    const db = await getDb();

    // 1. Single order query by orderId or orderNumber
    if (orderId) {
      let order = await db.collection('orders').findOne({
        $or: [{ orderId }, { orderNumber: orderId }],
      });

      if (!order && orderId.length === 24) {
        try {
          const { ObjectId } = await import('mongodb');
          order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
        } catch (e) {}
      }

      if (order) {
        return NextResponse.json({ success: true, order });
      }
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!email && !phone) {
      return NextResponse.json({ success: true, orders: [] });
    }

    let orders = [];

    // 2. Try Convex query
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2500)
      );
      const convexOrders = await Promise.race([
        convexClient.query('orders:getOrdersByUser', { 
          email: email?.toLowerCase().trim() || undefined,
          phone: phone?.trim() || undefined,
        }),
        timeoutPromise,
      ]);
      if (Array.isArray(convexOrders)) {
        orders = convexOrders;
      }
    } catch (e) {
      // ignore Convex timeout
    }

    // 3. Query MongoDB fallback
    try {
      const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
      const query = [];
      if (email) {
        query.push({ 'customerDetails.email': email.toLowerCase().trim() });
        query.push({ 'customer.email': email.toLowerCase().trim() });
      }
      if (phone) {
        query.push({ 'customerDetails.phone': phone.trim() });
        query.push({ 'customer.mobile': phone.trim() });
      }
      if (cleanPhone) {
        query.push({ 'customerDetails.phone': cleanPhone });
        query.push({ 'customerDetails.phone': `+91${cleanPhone}` });
        query.push({ 'customerDetails.phone': `91${cleanPhone}` });
        query.push({ 'customer.mobile': cleanPhone });
        query.push({ 'customer.mobile': `+91${cleanPhone}` });
        query.push({ 'customer.mobile': `91${cleanPhone}` });
        query.push({ 'address.mobile': cleanPhone });
        query.push({ 'address.phone': cleanPhone });
      }

      if (query.length > 0) {
        const mongoOrders = await db
          .collection('orders')
          .find({ $or: query })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();

        // Merge without duplicates by orderNumber or orderId
        const existingKeys = new Set(orders.map((o) => o.orderId || o.orderNumber));
        for (const mo of mongoOrders) {
          const key = mo.orderId || mo.orderNumber;
          if (!existingKeys.has(key)) {
            orders.push(mo);
            existingKeys.add(key);
          }
        }
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('Failed to load orders:', err);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}
