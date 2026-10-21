'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, ChevronDown } from 'lucide-react';
import SuggestionBar from '@/components/SuggestionBar';
import { addToCart } from '@/components/cart/cartStore';

const SIZE_MAP = {
  S: '28',
  M: '30',
  L: '32',
  XL: '34',
  XXL: '36',
  XXXL: '38',
  s: '28',
  m: '30',
  l: '32',
  xl: '34',
  xxl: '36',
  xxxl: '38',
};

const getDisplaySize = (size, sizeDisplayType) => {
  if (!size) return 'OS';
  if (sizeDisplayType === 'numeric' && SIZE_MAP[size]) {
    return SIZE_MAP[size];
  }
  return size;
};

export default function OrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [reorderingId, setReorderingId] = useState(null);

  // Load orders from local storage and backend API
  useEffect(() => {
    let active = true;

    async function loadAllOrders() {
      let initialOrders = [];
      let savedEmail = '';
      let savedPhone = '';

      try {
        const storedOrders = JSON.parse(
          localStorage.getItem('aw_orders') || localStorage.getItem('sonu_orders') || '[]'
        );
        if (Array.isArray(storedOrders)) initialOrders = storedOrders;

        const addr = JSON.parse(localStorage.getItem('aw_shipping_address') || '{}');
        savedEmail = addr.email || '';
        savedPhone = addr.phone || '';
      } catch {
        // ignore
      }

      if (active) {
        setOrders(initialOrders);
        if (!savedEmail && !savedPhone) setLoading(false);
      }

      if (savedEmail || savedPhone) {
        try {
          const query = new URLSearchParams();
          if (savedEmail) query.set('email', savedEmail);
          if (savedPhone) query.set('phone', savedPhone);

          const res = await fetch(`/api/orders?${query.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.orders) && active) {
              const orderMap = new Map();
              data.orders.forEach((o) => {
                const key = o.orderNumber || o._id || o.id;
                if (key) orderMap.set(key, o);
              });
              initialOrders.forEach((o) => {
                const key = o.orderNumber || o._id || o.id;
                if (key && !orderMap.has(key)) orderMap.set(key, o);
              });
              setOrders(Array.from(orderMap.values()));
            }
          }
        } catch (err) {
          console.error('Failed to sync orders from backend:', err);
        } finally {
          if (active) setLoading(false);
        }
      }
    }

    loadAllOrders();
    return () => {
      active = false;
    };
  }, []);

  // Dynamic document title
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Aesthetx Ways | Orders';
    }
  }, []);

  const handleCopyOrderId = (id) => {
    if (!id) return;
    try {
      navigator.clipboard.writeText(id);
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch {
      // fallback
    }
  };

  const toggleOrderDetails = (idx) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleBuyAgain = (order, idx) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(idx);
    order.items.forEach((item) => {
      addToCart({
        id: item.productId || item.id,
        productId: item.productId || item.id,
        name: item.name,
        price: item.priceNumber || item.price,
        size: item.size || 'OS',
        image: item.image || item.mainImage,
        quantity: item.quantity || 1,
      });
    });
    setTimeout(() => {
      setReorderingId(null);
      router.push('/cart');
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] flex flex-col justify-center items-center py-32">
        <div className="w-7 h-7 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] text-[#707072] mt-4 font-normal tracking-wide">
          Loading your orders...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24">
      {/* Top Sticky Header */}


      {/* Main Container */}
      <main className="max-w-[540px] mx-auto px-5 sm:px-6 pt-6 sm:pt-8">
        {orders.length === 0 ? (
          /* EMPTY ORDERS SCREEN */
          <div className="min-h-[62vh] flex flex-col items-center justify-center px-4 text-center select-none">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#111111] mb-5 shadow-sm">
              <svg
                className="w-7 h-7 stroke-[1.75]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h1
              className="text-[24px] sm:text-[26px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              No orders yet
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#707072] mt-2 mb-8 font-normal leading-relaxed max-w-[320px]">
              When you place orders, you can track their status and delivery details right here.
            </p>
            <Link
              href="/"
              className="w-full max-w-[260px] py-3.5 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[15px] font-medium text-center transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* ORDERS LIST SCREEN */
          <div>
            {/* Centered Orders Header matching Cart style */}
            <div className="text-center">
              <h1
                className="text-[26px] sm:text-[28px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Order History
              </h1>
              <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1 font-normal">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} placed
              </p>
            </div>

            {/* Top Divider Line matching Cart style */}
            <div className="mt-6 border-t border-[#e5e5e5] mb-7" />

            {/* List of Orders */}
            <div className="space-y-6">
              {orders.map((order, idx) => {
                const orderId = order.orderNumber || order.orderId || `AW-${idx + 1001}`;
                const orderDate = order.date || order.placedAt;
                const formattedDate = orderDate
                  ? new Date(orderDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Recent order';

                const totalAmount = Number(
                  order.total ?? order.totalAmount ?? order.amount ?? order.orderTotal ?? 0
                );
                const isExpanded = !!expandedOrders[idx];
                const orderAddress = order.address || order.customerDetails || order.shippingDetails;
                const itemsCount = (order.items || []).reduce(
                  (sum, it) => sum + (Number(it.quantity) || 1),
                  0
                );
                const isCopied = copiedOrderId === orderId;

                return (
                  <div
                    key={`${orderId}-${idx}`}
                    className="rounded-[18px] p-2 sm:p-6 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-5 transition-all"
                  >
                    {/* Top Row: Order ID, Date & Status Pill */}
                    <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#f0f0f0]">
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className="text-[15px] sm:text-[16px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                          >
                            Order #{orderId}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderId(orderId)}
                            className="text-[#707072] hover:text-[#111111] transition-colors p-1 -m-1"
                            title="Copy Order ID"
                            aria-label="Copy Order ID"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#008a00]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[12.5px] text-[#707072] mt-0.5 font-normal">
                          Placed on {formattedDate}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold text-[#008a00]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#008a00]" />
                        <span>{order.status || 'Confirmed'}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                      {(order.items || []).map((item, itemIdx) => {
                        const itemPrice = Number(item.priceNumber || item.price || 0);
                        const itemQty = Number(item.quantity || 1);
                        const displaySize = getDisplaySize(
                          item.size,
                          item.sizeDisplayType
                        );

                        return (
                          <div
                            key={itemIdx}
                            className="flex items-center gap-3.5 sm:gap-4"
                          >
                            {/* Product Image Thumbnail */}
                            <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-[10px] bg-[#fafafa] border border-[#f0f0f0] shrink-0 overflow-hidden flex items-center justify-center p-1">
                              <img
                                src={item.image || '/home/b1.webp'}
                                alt={item.name}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[14.5px] sm:text-[15px] font-medium text-[#111111] leading-snug truncate font-['Helvetica_Now_Text_Medium',sans-serif]"
                                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                              >
                                {item.name}
                              </p>
                              <p className="text-[12.5px] text-[#707072] mt-0.5">
                                Size: {displaySize} • Qty: {itemQty}
                              </p>
                              <p className="text-[14px] font-bold text-[#111111] mt-1">
                                ₹{(itemPrice * itemQty).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Details Accordion */}
                    <div className=" pt-3">
                      <button
                        type="button"
                        onClick={() => toggleOrderDetails(idx)}
                        className="w-full flex items-center justify-between text-left text-[13.5px] font-medium text-[#111111] hover:text-[#707072] transition-colors py-1 cursor-pointer select-none"
                      >
                        <span>Delivery & Payment Information</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#707072] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="pt-3 pb-1 space-y-3 text-[13px] text-[#707072] leading-relaxed">
                          {/* Delivery Address */}
                          {orderAddress && (
                            <div className="bg-[#fafafa] p-3.5 rounded-[12px] border border-[#f0f0f0]">
                              <p className="text-[12px] uppercase tracking-wider font-semibold text-[#111111] mb-1">
                                Shipping Address
                              </p>
                              <p className="font-medium text-[#111111]">
                                {orderAddress.fullName || orderAddress.name || orderAddress.firstName || 'Customer'}
                              </p>
                              <p className="text-[12.5px]">
                                {[
                                  orderAddress.houseNo,
                                  orderAddress.street || orderAddress.roadArea || orderAddress.address,
                                  orderAddress.city,
                                  orderAddress.pincode,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                              {(orderAddress.phone || orderAddress.mobile) && (
                                <p className="text-[12.5px] mt-0.5">
                                  Contact: +91-{orderAddress.phone || orderAddress.mobile}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Payment & Delivery ETA */}
                          <div className="flex items-center justify-between text-[12.5px] px-1">
                            <span>Estimated Delivery:</span>
                            <span className="font-medium text-[#111111]">
                              {order.estimatedDelivery || '3-5 business days'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[12.5px] px-1">
                            <span>Payment Method:</span>
                            <span className="font-medium text-[#111111]">
                              {order.paymentMethod || 'Prepaid (Online)'}
                            </span>
                          </div>

                          {order.razorpayPaymentId && (
                            <div className="flex items-center justify-between text-[12.5px] px-1">
                              <span>Transaction ID:</span>
                              <span className="font-mono text-[11.5px] text-[#111111]">
                                {order.razorpayPaymentId}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Summary & Actions */}
                    <div className=" pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
                      <div>
                        <p className="text-[12px] text-[#707072]">
                          Total Paid ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
                        </p>
                        <p
                          className="text-[18px] sm:text-[19px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleBuyAgain(order, idx)}
                          disabled={reorderingId === idx}
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13.5px] font-medium transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                          {reorderingId === idx ? 'Adding...' : 'Buy Again'}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push('/')}
                          className="px-4 py-2.5 rounded-full border border-[#e5e5e5] text-[#111111] text-[13.5px] font-medium hover:border-[#111111] transition-colors cursor-pointer"
                        >
                          Shop More
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
