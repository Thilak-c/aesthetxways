import CartClient from '@/app/cart/CartClient';

export const metadata = {
  title: "Aesthetx Ways | Checkout",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CartClient initialStep="address" />;
}
