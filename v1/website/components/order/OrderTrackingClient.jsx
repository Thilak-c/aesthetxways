'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrderTrackingClient({ initialOrder, orderId }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Live Shiprocket Tracking State
  const [liveTrack, setLiveTrack] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fallback client-side fetch if server didn't find order in MongoDB
  useEffect(() => {
    if (order) return;
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setOrder(data.order);
            return;
          }
        }

        // Fallback: check localStorage for recently placed order
        if (typeof window !== 'undefined') {
          const storedOrders = JSON.parse(
            localStorage.getItem('aw_orders') || localStorage.getItem('sonu_orders') || '[]'
          );
          const match = storedOrders.find(
            (o) => o.orderId === orderId || o.orderNumber === orderId
          );
          if (match) {
            setOrder(match);
            return;
          }
        }

        setError('We could not find an order matching this reference ID.');
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Unable to load order details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, order]);

  // Fetch Live Shiprocket Tracking
  const fetchLiveTracking = async () => {
    if (!orderId) return;
    try {
      setTrackingLoading(true);
      const res = await fetch(`/api/shiprocket/track?orderId=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLiveTrack(json.data);
        }
      }
    } catch (e) {
      console.error('Tracking fetch error:', e);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (order?.shiprocket) {
      fetchLiveTracking();
    }
  }, [order]);

  const handleCopyId = () => {
    const idToCopy = order?.orderId || order?.orderNumber;
    if (!idToCopy) return;
    navigator.clipboard?.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format Order Date
  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Compute Expected Delivery Date
  const getExpectedDateDisplay = () => {
    if (liveTrack?.edd) return liveTrack.edd;
    if (order?.estimatedDelivery && typeof order.estimatedDelivery === 'string' && order.estimatedDelivery.length > 0) {
      return order.estimatedDelivery;
    }
    const baseDate = order?.placedAt || order?.createdAt ? new Date(order.placedAt || order.createdAt) : new Date();
    const edd = new Date(baseDate);
    edd.setDate(edd.getDate() + 3);
    return edd.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-['Helvetica_Now_Text',sans-serif] px-4 text-center">
        <div className="w-9 h-9 border-3 border-neutral-300 border-t-black rounded-full animate-spin mb-4" />
        <h2 className="text-[17px] font-bold text-[#111111]">Loading your order tracking...</h2>
        <p className="text-[13px] text-neutral-500 mt-1">Retrieving details and live courier status</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-['Helvetica_Now_Text',sans-serif] px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4 text-2xl">
          📦
        </div>
        <h1 className="text-[22px] font-bold text-[#111111]">Order Not Found</h1>
        <p className="text-[14px] text-neutral-500 mt-2 mb-6">
          {error || "We couldn't locate this order. Please verify your order ID or contact customer support."}
        </p>
        <Link
          href="/"
          className="px-8 py-3.5 rounded-full bg-black text-white text-[14px] font-medium hover:bg-neutral-800 transition-colors"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const customer = order.customer || order.customerDetails || {};
  const addr = customer.address && typeof customer.address === 'object' ? customer.address : (order.address || {});
  const items = order.items || [];
  const shiprocket = order.shiprocket || {};

  // Construct Full Address String
  const addressLine = typeof customer.address === 'string'
    ? customer.address
    : [
        addr.houseNo,
        addr.street || addr.roadArea,
        addr.landmark,
        addr.city,
        addr.state,
        addr.pincode ? `- ${addr.pincode}` : '',
      ]
        .filter(Boolean)
        .join(', ');

  // Direct Shiprocket Tracking URL
  const publicTrackingUrl =
    liveTrack?.trackUrl ||
    (shiprocket.awbCode ? `https://shiprocket.co/tracking/${shiprocket.awbCode}` : '') ||
    (shiprocket.orderId ? `https://shiprocket.co/tracking/?order_id=${shiprocket.orderId}` : 'https://shiprocket.co/tracking');

  // Tracking Progress Stage
  const currentFulfillment = (order.fulfillmentStatus || order.status || order.orderStatus || 'confirmed').toLowerCase();
  const isDelivered = currentFulfillment === 'delivered';
  const isShipped = isDelivered || currentFulfillment === 'shipped' || currentFulfillment === 'in_transit';
  const isPickupScheduled = isShipped || currentFulfillment === 'pickup_scheduled' || shiprocket.status === 'PICKUP_SCHEDULED';
  const isReadyToShip = isPickupScheduled || currentFulfillment === 'ready_to_ship' || !!shiprocket.awbCode;
  const isProcessing = isReadyToShip || currentFulfillment === 'processing' || currentFulfillment === 'confirmed' || currentFulfillment === 'pending';

  // Payment Breakdown
  const totalVal = Number(order.totalAmount || order.orderTotal || 0);
  const itemsTotal = items.reduce(
    (acc, it) => acc + (Number(it.priceNumber || it.price || 0) * (Number(it.quantity) || 1)),
    0
  );
  const shippingCharge = order.shippingFee !== undefined
    ? Number(order.shippingFee)
    : (itemsTotal > 2499 || totalVal > 2499 ? 129 : 79);
  const bagTotal = itemsTotal > 0 ? itemsTotal : Math.max(0, totalVal - shippingCharge);
  const paymentMethod = order.payment?.method || order.paymentMethod || 'upi';
  const isPartialCod = paymentMethod === 'partial_cod' || paymentMethod === 'cod';
  const advancePaid = isPartialCod ? Number(order.payment?.advancePaid ?? 200) : Number(totalVal);
  const balanceDue = isPartialCod ? Number(order.payment?.balanceDue ?? Math.max(0, totalVal - advancePaid)) : 0;
  const displayOrderId = order.orderId || order.orderNumber;

  return (
    <div className="min-h-screen font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-6 sm:pt-10">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Order Confirmation Banner */}
        <div className="bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]">
                Thank you, {customer.name || customer.fullName || 'Customer'}!
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                <span className="text-[13px] text-[#707072]">Order ID: {displayOrderId}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[11px] uppercase tracking-wider text-neutral-500 hover:text-black font-semibold px-2 py-0.5 rounded-md border border-neutral-200 hover:border-black transition-colors"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Expected Delivery Date Highlight */}
          <div className="pt-6">
            <div className="sm:p-5 font-['Helvetica_Now_Text_Medium',sans-serif] rounded-[18px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[12px] uppercase font-bold tracking-wider text-emerald-800">
                  Expected Delivery Date
                </p>
                <p className="text-[19px] sm:text-[22px] font-bold text-[#111111] mt-0.5 font-['Helvetica_Now_Text_Medium',sans-serif]">
                  {getExpectedDateDisplay()}
                </p>
              </div>
            </div>

            {/* 4-Step Progress Tracker */}
            <div className="mt-8 pt-2">
              <div className="relative">
                {/* Horizontal Progress Bar Line */}
                <div className="absolute top-[7px] left-[12.5%] right-[12.5%] h-[2px] bg-neutral-200 z-0" />
                <div
                  className="absolute top-[7px] left-[12.5%] h-[2px] bg-[#008C01] z-0 transition-all duration-500 ease-out"
                  style={{
                    width: isDelivered ? '75%' : isShipped ? '50%' : isProcessing ? '25%' : '0%',
                  }}
                />

                <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center relative z-10">
                  {/* Step 1: Confirmed */}
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#008C01] ring-4 ring-white mb-2 shadow-xs shrink-0" />
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Order Placed</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">Confirmed</p>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ring-4 ring-white mb-2 shadow-xs shrink-0 transition-colors ${
                        isProcessing ? 'bg-[#008C01]' : 'bg-neutral-200'
                      }`}
                    />
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Preparing</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">Quality Check</p>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ring-4 ring-white mb-2 shadow-xs shrink-0 transition-colors ${
                        isShipped ? 'bg-[#008C01]' : 'bg-neutral-200'
                      }`}
                    />
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Dispatched</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">In Transit</p>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ring-4 ring-white mb-2 shadow-xs shrink-0 transition-colors ${
                        isDelivered ? 'bg-[#008C01]' : 'bg-neutral-200'
                      }`}
                    />
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Delivered</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">To Doorstep</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shiprocket Live Tracking Card */}
        <div className="font-['Helvetica_Now_Text_Medium',sans-serif]">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div>
                <h2 className="text-[16px] font-bold text-[#111111]">Logistics Tracking</h2>
                <p className="text-[12px] text-neutral-400">Package dispatch & courier status</p>
              </div>
            </div>
          </div>

          <div className="py-3">
            <p className="text-[11px] text-neutral-500">Courier AWB Number</p>
            <p className="text-[14px] font-semibold text-[#111111] underline">
              {liveTrack?.awbCode || shiprocket.awbCode || 'Assigned at Dispatch'}
            </p>
          </div>
        </div>

        {/* Ordered Items Breakdown */}
        <div className="bg-white">
          <h2
            className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif] mb-6"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </h2>

          <div>
            {items.map((item, idx) => {
              const itemKey = `${item.id || item.slug || item.productId || idx}-${item.size}-${idx}`;
              const itemPrice = Number(item.priceNumber || item.price || 0);
              const productId = item.productId || item.itemId || item.id || item.slug || item._id;
              const productUrl = productId ? `/product/${productId}` : null;

              return (
                <div key={itemKey} className="border-b border-[#e5e5e5] pb-8 mb-8 last:border-b-0 last:mb-0">
                  <div className="flex gap-4 sm:gap-6 items-start">
                    {productUrl ? (
                      <Link
                        href={productUrl}
                        className="w-[135px] h-[135px] sm:w-[150px] sm:h-[150px] shrink-0 flex items-center justify-center overflow-hidden bg-neutral-50 rounded-2xl group hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <img
                          src={item.image || item.mainImage || '/Logo/Logo_Full.png'}
                          alt={item.name}
                          loading="eager"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/Logo/Logo_Full.png';
                          }}
                        />
                      </Link>
                    ) : (
                      <div className="w-[135px] h-[135px] sm:w-[150px] sm:h-[150px] shrink-0 flex items-center justify-center overflow-hidden bg-neutral-50 rounded-2xl">
                        <img
                          src={item.image || item.mainImage || '/Logo/Logo_Full.png'}
                          alt={item.name}
                          loading="eager"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/Logo/Logo_Full.png';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <p className="text-[17px] sm:text-[18px] font-bold text-[#111111] leading-none">
                        ₹ {itemPrice.toLocaleString('en-IN')}
                      </p>

                      <div className="block mt-1">
                        {productUrl ? (
                          <Link href={productUrl} className="group inline-block">
                            <h3
                              className="text-[16px] sm:text-[17px] font-bold text-[#111111] leading-snug group-hover:underline cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              {item.name}
                            </h3>
                          </Link>
                        ) : (
                          <h3
                            className="text-[16px] sm:text-[17px] font-bold text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                          >
                            {item.name}
                          </h3>
                        )}
                      </div>

                      <p className="text-[14px] text-[#707072] leading-normal mt-0.5">
                        {item.category || "Premium Apparel & Footwear"}
                      </p>

                      <p className="text-[14px] text-[#707072] leading-normal">
                        Usually ships in 1 day
                      </p>

                      <p className="text-[14px] text-[#707072] leading-normal">
                        7 Day Return
                      </p>

                      <div className="mt-1">
                        <span className="text-[14px] font-medium text-[#111111]">
                          Size {item.size || 'OS'}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[14px] text-[#707072] ml-2 font-normal">
                            (Qty: {item.quantity})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-[#e5e5e5] pt-6 mt-6 space-y-3.5 text-[15px] sm:text-[16px] text-[#111111]">
            <div className="flex items-center justify-between">
              <span>Bag Total</span>
              <span>₹ {bagTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Shipping Charges</span>
              <span className="font-medium text-[#111111]">₹ {shippingCharge}</span>
            </div>

            {isPartialCod && (
              <div className="flex items-center justify-between text-[#707072]">
                <span>Advance Paid Online</span>
                <span className="text-[#111111] font-medium">₹ {advancePaid.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[#e5e5e5] my-4" />

          {isPartialCod ? (
            <div className="flex items-center justify-between text-[17px] sm:text-[18px] font-bold text-[#111111]">
              <span className="flex items-center gap-2">
                <span>Due on Delivery</span>
              </span>
              <span>₹ {balanceDue.toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[17px] sm:text-[18px] font-bold text-[#111111]">
              <span>You Paid</span>
              <span>₹ {totalVal.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Delivery Address & Customer Details */}
        <div className="rounded-[24px]">
          <h2 className="text-[16px] font-bold text-[#111111] mb-3">
            Delivery Address
          </h2>
          <div className="text-[13.5px] text-neutral-700 space-y-1.5 leading-relaxed">
            <p className="text-[15px] font-bold text-[#111111]">
              {customer.name || customer.fullName || 'Customer'}
            </p>
            {(customer.mobile || customer.phone) && (
              <p className="text-neutral-600 font-medium">
                +91 {customer.mobile || customer.phone} {customer.email ? `• ${customer.email}` : ''}
              </p>
            )}
            <p className="text-neutral-600 pt-1">
              {addressLine || 'Shipping address recorded with order'}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium text-center transition-all shadow-sm"
          >
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-neutral-300 hover:border-black text-[14px] font-medium text-center transition-colors text-neutral-700 bg-white"
          >
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
