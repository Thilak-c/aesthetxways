'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LoginModal from '@/components/auth/LoginModal';

export default function OrdersHubClient() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userMobile, setUserMobile] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Helper to extract clean 10-digit mobile
  const getCleanMobile = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  // Helper to verify if an order is linked to a target mobile number
  const isOrderLinkedToMobile = (order, targetMobile) => {
    if (!order || !targetMobile) return false;
    const cleanTarget = getCleanMobile(targetMobile);
    const orderMobiles = [
      order.customer?.mobile,
      order.customerDetails?.phone,
      order.address?.mobile,
      order.address?.phone,
      order.shippingAddress?.mobile,
      order.mobile,
    ].filter(Boolean);

    return orderMobiles.some((m) => getCleanMobile(m) === cleanTarget);
  };

  // Fetch orders for clean mobile number
  const fetchOrdersForMobile = useCallback(async (mobile) => {
    const cleanMobile = getCleanMobile(mobile);
    if (!cleanMobile) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let matched = [];

    // 1. Check local storage
    try {
      const raw = localStorage.getItem('aw_orders') || localStorage.getItem('sonu_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          matched = parsed.filter((o) => isOrderLinkedToMobile(o, cleanMobile));
        }
      }
    } catch (e) {
      console.error('Failed to parse local orders', e);
    }

    // 2. Fetch from MongoDB API
    try {
      const res = await fetch(`/api/orders?mobile=${encodeURIComponent(cleanMobile)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const map = new Map();
          data.orders.forEach((o) => map.set(o.orderId || o.orderNumber, o));
          matched.forEach((o) => {
            const key = o.orderId || o.orderNumber;
            if (!map.has(key)) map.set(key, o);
          });
          matched = Array.from(map.values());
        }
      }
    } catch (err) {
      console.error('Failed to fetch mobile orders', err);
    }

    // Sort newest first
    matched.sort((a, b) => {
      const dateA = new Date(a.placedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.placedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    setOrders(matched);
    setIsLoading(false);
  }, []);

  // Check login & phone number on mount
  useEffect(() => {
    const checkPhoneAndLoad = () => {
      let storedMobile = '';
      try {
        storedMobile =
          localStorage.getItem('aw_user_mobile') ||
          localStorage.getItem('sonu_user_mobile') ||
          '';
        if (!storedMobile) {
          const prof = JSON.parse(
            localStorage.getItem('aw_user_profile') ||
              localStorage.getItem('sonu_user_profile') ||
              '{}'
          );
          storedMobile = prof.mobile || prof.phone || '';
        }
        if (!storedMobile) {
          const shippingAddr = JSON.parse(
            localStorage.getItem('aw_shipping_address') ||
              localStorage.getItem('sonu_shipping_address') ||
              '{}'
          );
          storedMobile = shippingAddr.phone || shippingAddr.mobile || '';
        }
      } catch (e) {}

      if (storedMobile) {
        const clean = getCleanMobile(storedMobile);
        setUserMobile(clean);
        fetchOrdersForMobile(clean);
      } else {
        // Check if there are any orders in local storage anyway
        try {
          const localRaw =
            localStorage.getItem('aw_orders') || localStorage.getItem('sonu_orders');
          if (localRaw) {
            const parsed = JSON.parse(localRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOrders(parsed);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {}

        setUserMobile('');
        setOrders([]);
        setIsLoading(false);
        setIsLoginOpen(true);
      }
    };

    checkPhoneAndLoad();

    window.addEventListener('auth-changed', checkPhoneAndLoad);
    window.addEventListener('storage', checkPhoneAndLoad);
    return () => {
      window.removeEventListener('auth-changed', checkPhoneAndLoad);
      window.removeEventListener('storage', checkPhoneAndLoad);
    };
  }, [fetchOrdersForMobile]);

  // Handle Login Modal close / completion
  const handleLoginClose = () => {
    setIsLoginOpen(false);
    let storedMobile = '';
    try {
      storedMobile =
        localStorage.getItem('aw_user_mobile') ||
        localStorage.getItem('sonu_user_mobile') ||
        '';
      if (!storedMobile) {
        const prof = JSON.parse(
          localStorage.getItem('aw_user_profile') ||
            localStorage.getItem('sonu_user_profile') ||
            '{}'
        );
        storedMobile = prof.mobile || prof.phone || '';
      }
    } catch (e) {}

    if (storedMobile) {
      const clean = getCleanMobile(storedMobile);
      setUserMobile(clean);
      fetchOrdersForMobile(clean);
    }
  };

  // Format date helper: e.g. "Oct 5"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      return `${month} ${day}`;
    } catch (e) {
      return '';
    }
  };

  // Calculate expected delivery date for undelivered products
  const getDeliveryInfo = (order) => {
    let expected = null;
    if (order.expectedDelivery) {
      const d = new Date(order.expectedDelivery);
      if (!isNaN(d.getTime())) expected = d;
    }
    if (!expected && order.shipment?.expectedDelivery) {
      const d = new Date(order.shipment.expectedDelivery);
      if (!isNaN(d.getTime())) expected = d;
    }

    const base = new Date(order.placedAt || order.createdAt || Date.now());
    if (!expected) {
      expected = new Date(base);
      expected.setDate(expected.getDate() + 4);
    }

    const now = new Date();
    if (now.getTime() > expected.getTime()) {
      const delayed = new Date(now);
      delayed.setDate(delayed.getDate() + 2);
      return { targetDate: delayed };
    }

    return { targetDate: expected };
  };

  // Status headline: "Delivered on Oct 8" or "Coming on Oct 5"
  const getStatusHeadline = (order) => {
    const status = (order.shipment?.status || order.status || order.orderStatus || '').toUpperCase();

    if (status === 'DELIVERED') {
      const deliveredRaw =
        order.deliveryDate || order.deliveredAt || order.placedAt || order.createdAt || new Date();
      return `Delivered on ${formatDate(deliveredRaw)}`;
    }

    if (status === 'CANCELLED') {
      const cancelledRaw =
        order.cancelledAt || order.placedAt || order.createdAt || new Date();
      return `Cancelled on ${formatDate(cancelledRaw)}`;
    }

    const { targetDate } = getDeliveryInfo(order);
    return `Coming on ${formatDate(targetDate)}`;
  };

  // Subtitle: e.g. "Product Name & more (2 items)"
  const getItemSubtitle = (order) => {
    const items = order.items || [];
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const firstName = items[0]?.name || 'Item';
    const itemLabel = totalQty === 1 ? '1 item' : `${totalQty} items`;

    if (items.length > 1) {
      return `${firstName} & more (${itemLabel})`;
    }
    return `${firstName} (${itemLabel})`;
  };

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-2 sm:pt-4">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">
        {/* Centered Orders Header matching the Bag design */}
        <div className="text-center pt-2 mb-6">
          <h1
            className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Orders
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#707072] font-normal">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
          <div className="border-t border-[#e5e5e5] mt-6" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px] text-[#707072]">Loading orders...</p>
          </div>
        )}

        {/* Not Logged In State */}
        {!userMobile && !isLoading && orders.length === 0 && (
          <div className="py-16 text-center max-w-[420px] mx-auto space-y-4">
            <p className="text-[15px] text-[#707072]">
              Please log in with your mobile number to view your order history.
            </p>
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              Log In to View Orders
            </button>
          </div>
        )}

        {/* Empty Orders State */}
        {userMobile && !isLoading && orders.length === 0 && (
          <div className="py-20 text-center max-w-[420px] mx-auto space-y-4">
            <p className="text-[16px] text-[#707072]">Your order history is empty.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-[#cccccc] hover:border-black text-[14px] font-medium text-[#111111] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Order History List */}
        {!isLoading && orders.length > 0 && (
          <div className="divide-y divide-[#e5e5e5]">
            {orders.map((order) => {
              const firstItem = order.items?.[0] || {};
              const headline = getStatusHeadline(order);
              const subtitle = getItemSubtitle(order);
              const targetOrderId = order.orderId || order.orderNumber;

              return (
                <Link
                  key={targetOrderId || order._id}
                  href={`/order/${targetOrderId}`}
                  className="flex items-center justify-between py-4 sm:py-5 hover:bg-neutral-50/70 transition-colors rounded-xl px-2 -mx-2 group cursor-pointer"
                >
                  {/* Left Side: Product Image & Details */}
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {order.items && order.items.length > 1 ? (
                      <div className="relative w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] shrink-0">
                        {order.items.length > 2 && (
                          <div className="absolute top-0 right-0 w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] bg-[#e9e9e9] rounded-[13px] sm:rounded-[15px] border border-white shadow-xs p-1.5 overflow-hidden flex items-center justify-center rotate-[7deg] translate-x-1.5 -translate-y-0.5">
                            <img
                              src={
                                order.items[2]?.image ||
                                order.items[2]?.mainImage ||
                                '/logo.png'
                              }
                              alt=""
                              className="w-full h-full object-contain opacity-65"
                              onError={(e) => {
                                e.currentTarget.src = '/logo.png';
                              }}
                            />
                          </div>
                        )}

                        <div className="absolute top-0.5 right-0.5 w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] bg-[#ededed] rounded-[14px] sm:rounded-[16px] border border-white shadow-xs p-1.5 overflow-hidden flex items-center justify-center rotate-[3.5deg] translate-x-0.5 -translate-y-0.5">
                          <img
                            src={
                              order.items[1]?.image ||
                              order.items[1]?.mainImage ||
                              '/logo.png'
                            }
                            alt=""
                            className="w-full h-full object-contain opacity-80"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>

                        <div className="absolute bottom-0 left-0 w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] bg-[#f4f4f4] rounded-[14px] sm:rounded-[16px] border-2 border-white shadow-sm p-1.5 overflow-hidden flex items-center justify-center -rotate-[2deg]">
                          <img
                            src={firstItem.image || firstItem.mainImage || '/logo.png'}
                            alt={firstItem.name || 'Order item'}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        </div>

                        <span className="absolute -bottom-1 -right-1 bg-[#111111] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-full shadow-xs border border-white z-10 leading-none">
                          +{order.items.length - 1}
                        </span>
                      </div>
                    ) : (
                      <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] bg-[#f4f4f4] rounded-[16px] sm:rounded-[18px] flex items-center justify-center p-2 shrink-0 overflow-hidden">
                        <img
                          src={firstItem.image || firstItem.mainImage || '/logo.png'}
                          alt={firstItem.name || 'Order item'}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2
                        className="text-[15px] sm:text-[16.5px] font-bold text-[#111111] truncate tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        {headline}
                      </h2>
                      <p className="text-[13px] sm:text-[14px] text-[#707072] mt-0.5 truncate font-normal">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Far Right: Chevron Icon */}
                  <div className="shrink-0 pl-3">
                    <svg
                      className="w-5 h-5 text-[#111111] group-hover:translate-x-0.5 transition-transform"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleLoginClose}
        initialStep="mobile"
      />
    </div>
  );
}
