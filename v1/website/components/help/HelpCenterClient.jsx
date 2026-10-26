'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TOPICS = [
  {
    id: 'checkout',
    title: 'Checkout and Payment',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
    faqs: [
      {
        q: 'Which payment methods are accepted?',
        a: 'We accept prepaid payments via UPI (Google Pay, PhonePe, Paytm, CRED), Credit/Debit Cards, Net Banking across 50+ Indian banks, EMI, and Cash on Delivery where serviceable.',
      },
      {
        q: 'Is my payment transaction secure?',
        a: 'Yes, 100%. All online payments are processed securely through Razorpay using bank-grade 256-bit encryption with PCI-DSS Level 1 compliance.',
      },
      {
        q: 'What if amount is debited but order failed?',
        a: 'If your payment was deducted without generating an order, bank auto-refunds are credited back to your original source within 24 to 48 hours.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping and Dispatch',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <rect x="1" y="4" width="15" height="12" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    faqs: [
      {
        q: 'How long does delivery take?',
        a: 'We dispatch all orders within 24–48 hours. Standard surface delivery across major Indian metro cities takes 2–4 business days, and 3–5 days for other regions.',
      },
      {
        q: 'How much are the shipping charges?',
        a: 'We charge ₹79 standard shipping on all orders, and ₹129 for orders above ₹2,499.',
      },
      {
        q: 'Which courier partner handles delivery?',
        a: 'We partner with leading national courier networks via Shiprocket (including BlueDart, Delhivery, DTDC, and Xpressbees).',
      },
    ],
  },
  {
    id: 'refunds',
    title: 'Refunds',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v1a5.5 5.5 0 0 1-5.5 5.5H11" />
      </svg>
    ),
    faqs: [
      {
        q: 'When will I receive my refund?',
        a: 'Once the returned item passes quality inspection at our warehouse, your refund is initiated within 3–5 business days to your original UPI or bank account.',
      },
      {
        q: 'How are COD orders refunded?',
        a: 'For Cash on Delivery orders, we issue an instant UPI refund link or request your bank transfer details to credit the full amount.',
      },
    ],
  },
  {
    id: 'warranty',
    title: 'Quality & Authenticity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    faqs: [
      {
        q: 'Are all Aesthetx Ways products authentic?',
        a: 'Yes, 100%. Every piece is designed, crafted, and rigorously tested for heavy-gsm luxury comfort and premium durability.',
      },
      {
        q: 'What is covered under the quality guarantee?',
        a: 'Our apparel and footwear are protected against manufacturing faults, stitching unraveling, and fabric defects.',
      },
    ],
  },
  {
    id: 'order-status',
    title: 'Order Status and Issues',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    faqs: [
      {
        q: 'How can I track my shipment?',
        a: 'You can track live courier dispatch and live transit status directly on your order tracking page (/order/[id]) with real-time Shiprocket AWB updates.',
      },
      {
        q: 'Can I cancel my order before dispatch?',
        a: 'Yes, if your order has not yet been collected by the courier partner, reach out to our team on WhatsApp or email support@aesthetxways.com to cancel it immediately.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns and Replacement',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <rect x="3" y="4" width="18" height="15" rx="2" />
        <path d="M8 10h4" />
        <path d="M12 10a4 4 0 0 1 4 4v1" />
        <polyline points="14 13 16 15 18 13" />
      </svg>
    ),
    faqs: [
      {
        q: 'What is the return window?',
        a: 'We offer an easy 7-day return and exchange policy from the delivery date. Items must be unworn, undamaged, with original tags intact.',
      },
      {
        q: 'Can I exchange for a different size?',
        a: 'Yes! Doorstep size exchanges are available if the required size is in stock. If unavailable, an instant return/refund is offered.',
      },
    ],
  },
  {
    id: 'others',
    title: 'Others',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#111111]">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    faqs: [
      {
        q: 'How should I wash and care for Aesthetx Ways garments?',
        a: 'Machine wash cold on gentle cycle inside out. Do not tumble dry hot. Iron inside out to protect premium prints and denim treatments.',
      },
      {
        q: 'Do you offer bulk or custom orders?',
        a: 'Yes, reach out via WhatsApp (+91 70337 69997) or email support@aesthetxways.com for collaboration or corporate inquiries.',
      },
    ],
  },
];

export default function HelpCenterClient() {
  const router = useRouter();

  // Topic Modal Animation States
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isTopicMounted, setIsTopicMounted] = useState(false);
  const [isTopicVisible, setIsTopicVisible] = useState(false);
  const topicTimerRef = useRef(null);

  // Contact Modal Animation States
  const [isContactMounted, setIsContactMounted] = useState(false);
  const [isContactVisible, setIsContactVisible] = useState(false);
  const contactTimerRef = useRef(null);

  const [trackingInput, setTrackingInput] = useState('');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const openTopicModal = (topic) => {
    if (topicTimerRef.current) clearTimeout(topicTimerRef.current);
    setSelectedTopic(topic);
    setIsTopicMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTopicVisible(true);
      });
    });
  };

  const closeTopicModal = () => {
    setIsTopicVisible(false);
    topicTimerRef.current = setTimeout(() => {
      setIsTopicMounted(false);
      setSelectedTopic(null);
    }, 320);
  };

  const openContactModal = () => {
    if (contactTimerRef.current) clearTimeout(contactTimerRef.current);
    setIsContactMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsContactVisible(true);
      });
    });
  };

  const closeContactModal = () => {
    setIsContactVisible(false);
    contactTimerRef.current = setTimeout(() => {
      setIsContactMounted(false);
    }, 320);
  };

  useEffect(() => {
    return () => {
      if (topicTimerRef.current) clearTimeout(topicTimerRef.current);
      if (contactTimerRef.current) clearTimeout(contactTimerRef.current);
    };
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    router.push(`/order/${encodeURIComponent(trackingInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-4 sm:pt-8">
      <div className="max-w-[480px] sm:max-w-[540px] mx-auto px-4 sm:px-6">
        
        {/* Top Navigation Row: Back Button */}
        <div className="pt-1 pb-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-10 h-10 -ml-2 flex items-center justify-center text-[#111111] hover:opacity-60 transition-opacity cursor-pointer rounded-full active:bg-neutral-100"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6">
              <path
                d="M21.0005 11.0243L5.41829 11.0243L10.9255 5.66654C11.0192 5.57598 11.0936 5.46824 11.1443 5.34953C11.1951 5.23082 11.2212 5.1035 11.2212 4.9749C11.2212 4.84631 11.1951 4.71898 11.1443 4.60028C11.0936 4.48157 11.0192 4.37383 10.9255 4.28327C10.7383 4.10184 10.4849 4 10.2209 4C9.95684 4 9.70351 4.10184 9.51624 4.28327L2.29985 11.3068C2.20541 11.397 2.13028 11.5046 2.07881 11.6233C2.02733 11.742 2.00055 11.8695 2 11.9984C2.00055 12.1273 2.02733 12.2548 2.07881 12.3735C2.13028 12.4922 2.20541 12.5998 2.29985 12.69L9.50625 19.7135C9.69446 19.8969 9.94972 20 10.2159 20C10.4821 20 10.7373 19.8969 10.9255 19.7135C11.1137 19.5301 11.2195 19.2813 11.2195 19.0219C11.2195 18.7625 11.1137 18.5137 10.9255 18.3302L5.42829 12.9725L21.0005 12.9725C21.2656 12.9725 21.5198 12.8699 21.7073 12.6872C21.8947 12.5045 22 12.2568 22 11.9984C22 11.74 21.8947 11.4923 21.7073 11.3096C21.5198 11.1269 21.2656 11.0243 21.0005 11.0243Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Title Header with Headset Support Icon */}
        <div className="flex items-center justify-between gap-4 pb-8">
          <h1
            className="text-[32px] sm:text-[36px] font-bold text-[#111111] tracking-tight leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Help center
          </h1>

          {/* Clean Headset Icon from exact SVG */}
          <div className="shrink-0 text-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 56 56" fill="none">
              <path
                d="M9.91726 23.8024C8.30612 23.8024 7.00003 25.1085 7.00002 26.7197L7.00001 31.9159C7 33.6206 8.38199 35.0026 10.0868 35.0026C11.7915 35.0026 13.1735 33.6206 13.1735 31.9159V20.629C13.1735 12.459 19.7966 5.83594 27.9666 5.83594C36.1366 5.83594 42.7596 12.459 42.7596 20.629V21.718V31.8824C42.7596 33.6056 44.1566 35.0026 45.8799 35.0026C47.6032 35.0026 49.0001 33.6056 49.0001 31.8824V26.9053C49.0001 25.182 47.6032 23.785 45.8799 23.785C44.1566 23.785 42.7596 25.182 42.7596 26.9053V28.3603"
                stroke="black"
                strokeWidth="2.33333"
                strokeLinecap="round"
              />
              <path
                d="M45.6337 35.1953C45.1118 40.4948 39.7168 47.2692 32.4491 47.8899"
                stroke="black"
                strokeWidth="2.33333"
                strokeLinecap="round"
              />
              <rect x="24.5" y="46.0078" width="8.36064" height="4.18057" rx="2.09028" stroke="black" strokeWidth="2.33333" />
              <path
                d="M20.9938 34.6016C23.7658 40.8169 32.4344 41.2235 35.776 35.295L36.1669 34.6016"
                stroke="black"
                strokeWidth="2.33333"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Browse Topics Section */}
        <section className="mb-10">
          <h2
            className="text-[17px] sm:text-[18px] font-bold text-[#111111] mb-3.5 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Browse Topics
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => openTopicModal(topic)}
                className="p-4 sm:p-5 border border-[#d1d5db] rounded-[14px] bg-white hover:border-black active:bg-neutral-50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[125px] sm:min-h-[135px]"
              >
                <div className="transition-transform duration-200 group-hover:scale-110">
                  {topic.icon}
                </div>
                <span className="text-[13px] sm:text-[14px] font-medium text-[#111111] mt-3 leading-snug">
                  {topic.title}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Need more help? Section */}
        <section className="pt-2">
          <h2
            className="text-[17px] sm:text-[18px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Need more help?
          </h2>

          <button
            type="button"
            onClick={openContactModal}
            className="w-full border border-[#d1d5db] rounded-[16px] p-4 flex items-center justify-between bg-white hover:border-black active:bg-neutral-50 transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 flex items-center justify-center text-[#111111]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <span className="text-[15px] sm:text-[16px] font-bold text-[#111111]">
                Get in touch
              </span>
            </div>

            <div className="text-[#111111] transition-transform group-hover:translate-x-1">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path
                  d="M9.06552 18.9989C8.9261 18.9997 8.78789 18.9726 8.65882 18.9191C8.52975 18.8656 8.41235 18.7867 8.31336 18.6871C8.21407 18.5871 8.13526 18.4682 8.08147 18.3371C8.02769 18.2061 8 18.0656 8 17.9236C8 17.7816 8.02769 17.6411 8.08147 17.5101C8.13526 17.379 8.21407 17.2601 8.31336 17.1601L13.3984 12.0093L8.31336 6.85852C8.11388 6.65033 8.00404 6.37022 8.00801 6.07983C8.01199 5.78944 8.12945 5.51254 8.33455 5.31005C8.53965 5.10756 8.8156 4.99607 9.10169 5.00011C9.38778 5.00414 9.66057 5.12337 9.86006 5.33156L15.6866 11.2458C15.7859 11.3458 15.8647 11.4647 15.9185 11.5958C15.9723 11.7268 16 11.8674 16 12.0093C16 12.1513 15.9723 12.2918 15.9185 12.4229C15.8647 12.5539 15.7859 12.6728 15.6866 12.7728L9.86006 18.6871C9.75609 18.792 9.63179 18.874 9.49503 18.9276C9.35826 18.9813 9.21201 19.0056 9.06552 18.9989Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </button>
        </section>

      </div>

      {/* TOPIC DETAIL MODAL */}
      {isTopicMounted && selectedTopic && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isTopicVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeTopicModal}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[520px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto max-h-[85vh] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isTopicVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{selectedTopic.icon}</div>
                <h2
                  className="text-[19px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {selectedTopic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeTopicModal}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-[#f0f0f0] py-4 space-y-4">
              {selectedTopic.faqs.map((faq, idx) => (
                <div key={idx} className="pt-3 first:pt-0">
                  <p className="text-[14.5px] font-bold text-[#111111] mb-1">
                    {faq.q}
                  </p>
                  <p className="text-[13.5px] text-[#707072] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#f0f0f0] flex flex-col gap-2.5">
              <a
                href={`https://wa.me/917033769997?text=Hi%20Aesthetx%20Ways,%20I%20have%20a%20question%20regarding%20${encodeURIComponent(selectedTopic.title)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Ask on WhatsApp</span>
                <span>↗</span>
              </a>
              <button
                type="button"
                onClick={closeTopicModal}
                className="w-full py-2.5 rounded-full border border-neutral-200 text-neutral-600 text-[13px] font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GET IN TOUCH MODAL */}
      {isContactMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isContactVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeContactModal}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[520px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto max-h-[85vh] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isContactVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f0f0]">
              <div>
                <h2
                  className="text-[19px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Contact Aesthetx Ways Support
                </h2>
                <p className="text-[12px] text-[#707072] mt-0.5">
                  Available Monday – Saturday, 10:00 AM – 7:00 PM IST
                </p>
              </div>
              <button
                type="button"
                onClick={closeContactModal}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Quick Track Order Input */}
            <form onSubmit={handleTrackSubmit} className="pt-4 pb-2">
              <label className="block text-[12px] font-bold text-[#707072] uppercase tracking-wider mb-1.5">
                Have an Order ID?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AW-17298371"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-[13px] border border-neutral-300 rounded-xl focus:outline-hidden focus:border-black font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-black text-white text-[13px] font-medium rounded-xl hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                >
                  Track ↗
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-3">
              <a
                href="https://wa.me/917033769997?text=Hi%20Aesthetx%20Ways,%20I%20need%20help%20with%20my%20order"
                target="_blank"
                rel="noreferrer"
                className="w-full p-4 rounded-2xl border border-neutral-200 hover:border-black flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                    💬
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#111111]">WhatsApp Concierge</p>
                    <p className="text-[12px] text-[#707072]">+91 70337 69997 • Average reply in 5 mins</p>
                  </div>
                </div>
                <span className="text-neutral-400 group-hover:text-black transition-colors">↗</span>
              </a>

              <a
                href="mailto:support@aesthetxways.com?subject=Customer%20Support%20Inquiry"
                className="w-full p-4 rounded-2xl border border-neutral-200 hover:border-black flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                    ✉️
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#111111]">Email Support</p>
                    <p className="text-[12px] text-[#707072]">support@aesthetxways.com</p>
                  </div>
                </div>
                <span className="text-neutral-400 group-hover:text-black transition-colors">↗</span>
              </a>
            </div>

            <div className="mt-5 pt-3 border-t border-[#f0f0f0]">
              <button
                type="button"
                onClick={closeContactModal}
                className="w-full py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[13px] font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
