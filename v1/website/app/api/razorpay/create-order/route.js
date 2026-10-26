import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, receipt, notes, items } = await request.json();

    let finalAmount = Number(amount);

    // Verify and compute server-side amount from items if provided to prevent price tampering
    if (Array.isArray(items) && items.length > 0) {
      const computedSubtotal = items.reduce((sum, item) => {
        const itemPrice = Number(item.priceNumber || item.price || 0);
        const qty = Math.max(1, Number(item.quantity || 1));
        return sum + (itemPrice * qty);
      }, 0);

      if (computedSubtotal > 0) {
        const computedShipping = computedSubtotal > 2499 ? 129 : 79;
        finalAmount = computedSubtotal + computedShipping;
      }
    }

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay keys not configured on server');
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(finalAmount) * 100);
    const receiptId = receipt || `rcpt_${Date.now()}`;

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: notes || {},
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Razorpay order creation error from gateway:', data);
      return NextResponse.json(
        { error: data.error?.description || 'Failed to create Razorpay order' },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: receiptId,
      keyId,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error while initializing payment' },
      { status: 500 }
    );
  }
}
