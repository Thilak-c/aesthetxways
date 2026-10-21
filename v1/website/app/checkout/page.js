'use client';

import CartClient from '@/app/cart/CartClient';

export default function CheckoutPage() {
  return <CartClient initialStep="address" />;
}
