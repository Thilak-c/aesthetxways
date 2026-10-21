import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      items, 
      customerDetails, 
      paymentMethod, 
      orderTotal,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature 
    } = body;
    
    if (!items || !items.length || !customerDetails || !orderTotal) {
      return NextResponse.json({ success: false, message: 'Missing order details' }, { status: 400 });
    }

    // 1. Verify Razorpay payment signature
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
    
    // 2. Try validating stock and inserting order in Convex
    let orderNumber = `AW-${Date.now().toString().slice(-6)}`;
    let orderId = `ord_${Date.now()}`;

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
            amount: orderTotal,
            currency: 'INR',
            status: paymentMethod === 'COD' ? 'pending' : 'completed',
            paymentMethod: paymentMethod || 'COD',
            paidAt: Date.now(),
            paidBy: customerDetails.fullName,
            codCharge: paymentMethod === 'COD' ? 100 : undefined,
            remainingCOD: paymentMethod === 'COD' ? (orderTotal - 100) : undefined,
          },
          orderTotal: orderTotal,
          status: 'pending',
        }),
        mutationTimeout,
      ]);

      if (result && result.success) {
        orderNumber = result.orderNumber || orderNumber;
        orderId = result.orderId || orderId;
      }
    } catch (convexErr) {
      console.error('Convex order creation failed/timed out, saving to emergency fallback in MongoDB:', convexErr);
      try {
        const db = await getDb();
        await db.collection('orders').insertOne({
          orderNumber,
          orderId,
          items,
          customerDetails,
          paymentMethod,
          paymentDetails: {
            razorpayOrderId,
            razorpayPaymentId,
            amount: orderTotal,
            status: paymentMethod === 'COD' ? 'pending' : 'completed',
          },
          orderTotal,
          status: 'pending',
          isFallbackSaved: true,
          createdAt: new Date(),
        });
        console.log(`[Orders] Successfully saved emergency fallback order ${orderNumber} to MongoDB.`);
      } catch (dbErr) {
        console.error('CRITICAL: Emergency fallback to MongoDB also failed:', dbErr);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Order placed successfully!', 
      orderNumber,
      order: {
        orderNumber,
        items,
        customerDetails,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'pending' : 'paid',
        orderStatus: 'pending',
        orderTotal,
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
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json({ success: true, orders: [] });
    }

    let orders = [];

    // 1. Try Convex query
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

    // 2. Query MongoDB fallback
    try {
      const db = await getDb();
      const query = [];
      if (email) query.push({ 'customerDetails.email': email.toLowerCase().trim() });
      if (phone) query.push({ 'customerDetails.phone': phone.trim() });

      if (query.length > 0) {
        const mongoOrders = await db
          .collection('orders')
          .find({ $or: query })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();

        // Merge without duplicates by orderNumber
        const existingNumbers = new Set(orders.map((o) => o.orderNumber));
        for (const mo of mongoOrders) {
          if (!existingNumbers.has(mo.orderNumber)) {
            orders.push(mo);
          }
        }
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error('Failed to load orders:', err);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}
