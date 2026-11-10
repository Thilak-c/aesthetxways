import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { recheckRazorpayPayment, fetchRazorpayOrderPayments, getRazorpayCredentials } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = await initDb();
    const order = await db.collection('orders').findOne({
      $or: [{ orderId: id }, { _id: id }],
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    let paymentId = order.payment?.razorpayPaymentId;
    const razorpayOrderId = order.payment?.razorpayOrderId || order.razorpayOrderId;
    const isCod = order.payment?.method === 'full_cod' || order.payment?.method === 'cod';

    if (isCod) {
      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        isCod: true,
        message: 'This is a Full Cash on Delivery order. No online Razorpay transaction exists.',
        comparison: {
          paymentMethod: 'full_cod',
          expectedAmount: order.totalAmount,
          advancePaid: 0,
          balanceDue: order.totalAmount,
          status: order.payment?.status || 'PENDING_COD',
        },
      });
    }

    // If paymentId is missing but razorpayOrderId exists, attempt to find completed payment from Razorpay
    if (!paymentId && razorpayOrderId) {
      try {
        const orderPayments = await fetchRazorpayOrderPayments(razorpayOrderId);
        const capturedOrAuth = orderPayments.items?.find(
          (p) => p.status === 'captured' || p.status === 'authorized'
        );
        if (capturedOrAuth) {
          paymentId = capturedOrAuth.id;
          // Sync discovered payment back to database
          await db.collection('orders').updateOne(
            { $or: [{ orderId: id }, { _id: id }] },
            {
              $set: {
                'payment.razorpayPaymentId': paymentId,
                'payment.status': capturedOrAuth.status === 'captured' ? 'PAID' : 'AUTHORIZED',
                'payment.method': capturedOrAuth.method || order.payment?.method,
                'payment.gatewayMode': orderPayments.gatewayMode || 'live',
                'payment.updatedAt': new Date(),
              },
            }
          );
        } else if (orderPayments.items && orderPayments.items.length > 0) {
          const latestPayment = orderPayments.items[0];
          return NextResponse.json({
            success: false,
            orderId: order.orderId,
            error: `Razorpay payment failed or not captured (Status: ${latestPayment.status}). Reason: ${latestPayment.error_description || 'Customer cancelled or transaction declined'}`,
            gatewayStatus: latestPayment.status.toUpperCase(),
          }, { status: 400 });
        } else {
          return NextResponse.json({
            success: false,
            orderId: order.orderId,
            error: `Customer opened checkout on Razorpay (Order ${razorpayOrderId}) but did not complete the transaction.`,
            gatewayStatus: 'ABANDONED',
          }, { status: 400 });
        }
      } catch (orderFetchErr) {
        console.warn(`[Admin Recheck] Could not fetch order payments for ${razorpayOrderId}:`, orderFetchErr.message);
      }
    }

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        orderId: order.orderId,
        hasPaymentId: false,
        error: 'No Razorpay payment transaction exists for this order.',
        comparison: {
          databaseStatus: order.payment?.status || 'PENDING',
          method: order.payment?.method,
          expectedAmount: order.totalAmount,
          advancePaid: order.payment?.advancePaid || 0,
          razorpayOrderId: razorpayOrderId || 'None',
          gatewayStatus: 'NOT_FOUND',
        },
      });
    }

    // Expected amount in paise
    const isPartialCod = order.payment?.method === 'partial_cod';
    const expectedAmount = isPartialCod
      ? Number(order.payment?.advancePaid || 200)
      : Number(order.orderTotal ?? order.pricing?.finalTotal ?? order.paymentDetails?.amount ?? order.totalAmount ?? order.amount ?? 0);
    const expectedAmountInPaise = Math.round(expectedAmount * 100);

    // Call live Razorpay API
    let liveCheck;
    try {
      liveCheck = await recheckRazorpayPayment(
        paymentId,
        expectedAmountInPaise,
        razorpayOrderId
      );
    } catch (rzpErr) {
      console.error(`[Admin Recheck] Razorpay API query failed for ${paymentId}:`, rzpErr.message);
      return NextResponse.json({
        success: false,
        orderId: order.orderId,
        paymentId,
        error: `Razorpay API error: ${rzpErr.message}`,
        gatewayStatus: 'QUERY_FAILED',
      }, { status: 502 });
    }

    // Compute Status and Amount Diff
    const diff = {
      orderId: order.orderId,
      paymentId,
      razorpayOrderId,
      gatewayMode: liveCheck.mode, // 'live' | 'test'
      isLiveAccount: liveCheck.mode === 'live',
      gatewayStatus: liveCheck.status, // 'captured' | 'failed' | 'authorized'
      isCaptured: liveCheck.captured,
      currency: liveCheck.currency,
      method: liveCheck.method,
      acquirerRrn: liveCheck.rrn,
      upiVpa: liveCheck.vpa,
      bank: liveCheck.bank,
      card: liveCheck.card,
      amounts: {
        databaseExpected: expectedAmount,
        gatewayCollected: liveCheck.amount,
        difference: Number((liveCheck.amount - expectedAmount).toFixed(2)),
        isExactMatch: liveCheck.amount === expectedAmount,
      },
      statusComparison: {
        databasePaymentStatus: order.payment?.status,
        liveGatewayStatus: liveCheck.status?.toUpperCase(),
        matches:
          (order.payment?.status === 'PAID' && liveCheck.status === 'captured') ||
          (order.payment?.status === 'PARTIALLY_PAID' && liveCheck.status === 'captured') ||
          (order.payment?.status === 'PAYMENT_FAILED' && liveCheck.status === 'failed'),
      },
      fee: liveCheck.fee,
      tax: liveCheck.tax,
      netSettlement: Number((liveCheck.amount - liveCheck.fee).toFixed(2)),
      paidAt: liveCheck.createdAt,
    };

    // Auto-sync database with live Razorpay status if payment is captured
    if (liveCheck.captured) {
      const syncedStatus = isPartialCod ? 'PARTIALLY_PAID' : 'PAID';
      await db.collection('orders').updateOne(
        { orderId: order.orderId },
        {
          $set: {
            'payment.status': syncedStatus,
            'payment.amountCaptured': liveCheck.amount,
            'payment.gatewayMode': liveCheck.mode,
            'payment.acquirerRrn': liveCheck.rrn,
            'payment.lastRecheckedAt': new Date(),
            updatedAt: new Date(),
          },
          $push: {
            paymentHistory: {
              event: 'ADMIN_RECHECK_SYNC',
              status: syncedStatus,
              gatewayStatus: liveCheck.status,
              gatewayMode: liveCheck.mode,
              amount: liveCheck.amount,
              rrn: liveCheck.rrn,
              timestamp: new Date(),
              note: `Admin rechecked with Razorpay API. Status: ${liveCheck.status.toUpperCase()}, Amount: ₹${liveCheck.amount}`,
            },
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      diff,
      paymentHistory: order.paymentHistory || [],
    });
  } catch (error) {
    console.error('[Admin Recheck Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while rechecking payment' },
      { status: 500 }
    );
  }
}

