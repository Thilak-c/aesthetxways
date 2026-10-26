import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// 1. Tiered Shipping & Grand Total logic
function calculateOrderTotals(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return { subtotal: 0, shippingCharge: 0, grandTotal: 0 };
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.priceNumber || item.price || 0);
    const qty = Math.max(1, Number(item.quantity || 1));
    return sum + (price * qty);
  }, 0);

  const shippingCharge = subtotal > 2499 ? 129 : 79;
  const grandTotal = subtotal + shippingCharge;

  return { subtotal, shippingCharge, grandTotal };
}

// 2. Razorpay Signature Verification logic
function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const genBuf = Buffer.from(generatedSignature, 'utf-8');
  const sigBuf = Buffer.from(signature, 'utf-8');

  return genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf);
}

// 3. Constant-time Token Verification
function verifyAuthToken(clientToken, email, secret) {
  if (!clientToken || typeof clientToken !== 'string') return false;
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase().trim())
    .digest('hex');

  const clientBuf = Buffer.from(clientToken, 'utf-8');
  const expectedBuf = Buffer.from(expectedToken, 'utf-8');

  return clientBuf.length === expectedBuf.length && crypto.timingSafeEqual(clientBuf, expectedBuf);
}

test('Shipping calculation: standard orders <= ₹2499 charge ₹79 shipping', () => {
  const items = [{ price: 1500, quantity: 1 }];
  const { subtotal, shippingCharge, grandTotal } = calculateOrderTotals(items);
  assert.equal(subtotal, 1500);
  assert.equal(shippingCharge, 79);
  assert.equal(grandTotal, 1579);
});

test('Shipping calculation: exactly ₹2499 charges ₹79 shipping', () => {
  const items = [{ price: 2499, quantity: 1 }];
  const { subtotal, shippingCharge, grandTotal } = calculateOrderTotals(items);
  assert.equal(subtotal, 2499);
  assert.equal(shippingCharge, 79);
  assert.equal(grandTotal, 2578);
});

test('Shipping calculation: orders above ₹2499 charge ₹129 shipping', () => {
  const items = [{ price: 3200, quantity: 1 }];
  const { subtotal, shippingCharge, grandTotal } = calculateOrderTotals(items);
  assert.equal(subtotal, 3200);
  assert.equal(shippingCharge, 129);
  assert.equal(grandTotal, 3329);
});

test('Shipping calculation: multi-item cart correctly accumulates quantities', () => {
  const items = [
    { price: 1000, quantity: 2 }, // 2000
    { price: 600, quantity: 1 },  // 600 -> total 2600
  ];
  const { subtotal, shippingCharge, grandTotal } = calculateOrderTotals(items);
  assert.equal(subtotal, 2600);
  assert.equal(shippingCharge, 129);
  assert.equal(grandTotal, 2729);
});

test('Razorpay verification: valid HMAC-SHA256 signature succeeds', () => {
  const secret = 'test_secret_key_123';
  const orderId = 'order_test_999';
  const paymentId = 'pay_test_888';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.equal(verifyRazorpaySignature(orderId, paymentId, validSignature, secret), true);
});

test('Razorpay verification: tampered signature fails', () => {
  const secret = 'test_secret_key_123';
  const orderId = 'order_test_999';
  const paymentId = 'pay_test_888';
  const fakeSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  assert.equal(verifyRazorpaySignature(orderId, paymentId, fakeSignature, secret), false);
});

test('Auth token verification: matches timing-safe hash', () => {
  const secret = 'jwt_secret_key';
  const email = 'customer@aesthetxways.com';
  const token = crypto.createHmac('sha256', secret).update(email).digest('hex');

  assert.equal(verifyAuthToken(token, email, secret), true);
  assert.equal(verifyAuthToken('invalid_token', email, secret), false);
});
