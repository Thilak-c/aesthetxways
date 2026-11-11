'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  Printer,
  Receipt,
  User,
  Phone,
  Store,
  Percent,
} from 'lucide-react';

const SIZE_MAP = {
  S: '28',
  M: '30',
  L: '32',
  XL: '34',
  XXL: '36',
  XXXL: '38',
};

const STORE_BRANCHES = {
  patna: {
    name: 'AESTHETX WAYS (PATNA)',
    address: 'Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001',
    phone: '+91 70337 69997',
  },
  gaya: {
    name: 'AESTHETX WAYS (GAYA)',
    address: 'Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002',
    phone: '+91 70337 69997',
  },
};

export default function DigitalBillClient({ bill }) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!bill) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-6 text-center border border-neutral-300 shadow-sm space-y-4">
          <div className="inline-flex p-3 bg-neutral-100 text-neutral-600 rounded-full">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
              Invoice Not Found
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              We could not locate this digital receipt in our records. Please verify the bill number or contact store support.
            </p>
          </div>
          <Link
            href="/"
            className="block w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Visit Online Store
          </Link>
        </div>
      </div>
    );
  }

  const branchKey = String(bill.branch || 'patna').toLowerCase();
  const currentBranch = STORE_BRANCHES[branchKey] || STORE_BRANCHES.patna;

  const formatFullDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatFullTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Pricing calculations
  const subtotal = Number(bill.subtotal ?? bill.total ?? 0);
  const discountAmount = Number(bill.discountAmount ?? 0);
  const totalAmount = Number(bill.total ?? bill.grandTotal ?? 0);
  const totalQty = (bill.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  // Round off calculation:
  // If explicitly present in bill document, use it; otherwise compute total - (subtotal - discountAmount)
  const explicitRoundOff = bill.roundOff !== undefined && bill.roundOff !== null ? Number(bill.roundOff) : null;
  const computedRoundOff = explicitRoundOff !== null
    ? explicitRoundOff
    : Math.round((totalAmount - (subtotal - discountAmount)) * 100) / 100;
  const hasRoundOff = Math.abs(computedRoundOff) >= 0.01;
  const roundOffStr = computedRoundOff >= 0 ? `+₹${computedRoundOff.toFixed(2)}` : `-₹${Math.abs(computedRoundOff).toFixed(2)}`;

  // Tax calculations (Standard 18% inclusive GST)
  const netBeforeTax = Math.max(0, subtotal - discountAmount);
  const taxableValue = netBeforeTax > 0 ? netBeforeTax / 1.18 : 0;
  const totalTax = netBeforeTax > 0 ? netBeforeTax - taxableValue : 0;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  // Split payment details
  const isSplit = String(bill.paymentMethod || '').toLowerCase() === 'split';
  const splitDetails = bill.splitDetails || null;

  const pdfUrl = `/api/bills/${bill.billNumber}/pdf?download=1`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen  py-6 flex flex-col items-center select-none font-sans text-neutral-900 print:bg-white print:py-0 print:px-0">
      <div className="w-full max-w-md space-y-4">
        {/* 1. Header Brand Section */}
        <div className="text-center space-y-1 pt-2 pb-1">
          <div className="flex justify-center">
            {/* Vector Brand Logo */}
            <img src="/logo_t.svg" alt="Aesthetx Ways" className="h-12 w-auto object-contain" />
          </div>
          <div className="space-y-0.5 pt-1">
            <h1 className="text-2xl font-black uppercase text-neutral-950 tracking-wider">
              {currentBranch.name}
            </h1>
            <p className="text-[11px] text-neutral-500 max-w-[280px] mx-auto leading-normal">
              {currentBranch.address}
            </p>
            <p className="text-[10.5px] font-mono text-neutral-400">
              Support: {currentBranch.phone}
            </p>
          </div>
        </div>

        {/* 2. Amount & Action Row Bar (Same as Manage Page) */}
        <div className="bg-white rounded-none p-4 border border-slate-200/50 flex items-center justify-between gap-4 relative overflow-hidden">
          {/* Big background stamp watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <span className="inline-block border-2 border-dashed border-red-700 text-red-700 uppercase text-[56px] font-black leading-none px-4 py-2 rotate-[-10deg] select-none opacity-10 tracking-[0.2em]">
              <span style={{ marginRight: "-0.2em" }}>PAID</span>
            </span>
          </div>

          <div className="space-y-0.5 relative z-10">
            <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">Net Payable</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xl font-extrabold text-slate-950 font-poppins">₹{totalAmount.toLocaleString("en-IN")}</span>
              {discountAmount > 0 && (
                <span className="text-[8px] font-mono font-extrabold text-slate-500 bg-slate-50 px-1 py-0.5 rounded-none">
                  {bill.discount ? `${bill.discount}% OFF` : `₹${discountAmount} OFF`}
                </span>
              )}
            </div>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`Bill-${bill.billNumber}.pdf`}
            className="flex items-center gap-1.5 text-slate-950 hover:text-slate-900 rounded-none text-[10px] font-bold transition-transform duration-155 active:scale-95 cursor-pointer relative z-10 print:hidden"
          >
            <Download size={12} />
            <span>Invoice</span>
          </a>
        </div>

        {/* 3. Customer Personalized Hero Card */}
        <div className="bg-neutral-950 text-white p-4 sm:p-5 relative border border-neutral-900  overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 w-28 h-28 bg-neutral-800 rounded-full blur-2xl opacity-40 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div>
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Customer Receipt</div>
              <h2 className="text-base font-extrabold tracking-tight text-white mt-0.5">
                {bill.customerName ? bill.customerName.toUpperCase() : 'VALUED GUEST'}
              </h2>
              {bill.customerPhone && (
                <div className="text-xs font-mono text-neutral-300 mt-0.5 flex items-center gap-1.5">
                  <Phone size={11} className="text-neutral-400" />
                  <span>+91 {bill.customerPhone}</span>
                </div>
              )}
              {bill.customerEmail && (
                <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                  {bill.customerEmail}
                </div>
              )}
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-1.5">
                Thank you for shopping at AesthetX Ways. Your in-store purchase is authenticated and recorded.
              </p>
            </div>

            {/* Interactive 5-Star Experience Rating Widget */}
            <div className="pt-2.5 border-t border-neutral-800 space-y-1.5 print:hidden">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">
                How was your shopping experience?
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform active:scale-125 cursor-pointer focus:outline-none"
                    title={`Rate ${star} Stars`}
                  >
                    <Star
                      size={16}
                      className={`transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-600 hover:text-neutral-400'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-emerald-400 ml-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Thank you!
                    </span>
                    <a
                      href={branchKey === 'gaya'
                        ? 'https://search.google.com/local/writereview?placeid=ChIJ15OdAgAr8zkRvzNUY2o324E'
                        : 'https://search.google.com/local/writereview?placeid=ChIJZSX8QQBZ7TkRVKYOUyR8pTE'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold font-mono text-amber-300 underline hover:text-amber-200"
                    >
                      Review on Google ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Invoice Detailed Metadata Card */}
        <div className="bg-white p-4  space-y-3 ">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <FileText size={13} className="text-neutral-400" />
              <span>Bill Details</span>
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 text-neutral-700  rounded">
              {branchKey.toUpperCase()} STORE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-mono">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                Invoice Number
              </span>
              <span className="font-bold text-neutral-900">#{bill.billNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                Order Type
              </span>
              <span className="font-bold text-neutral-900">
                {bill.isOnlineOrder ? 'ONLINE ORDER' : 'POS WALK-IN'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                Date & Time
              </span>
              <span className="font-medium text-neutral-800">
                {formatFullDate(bill.createdAt)} · {formatFullTime(bill.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                Payment Method
              </span>
              <span className="font-bold text-neutral-900 uppercase">
                {isSplit ? 'SPLIT (CASH + UPI)' : (bill.paymentMethod || 'CASH')}
              </span>
            </div>
            {bill.createdBy && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                  Billed By
                </span>
                <span className="font-medium text-neutral-800">
                  {bill.createdBy}
                </span>
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">
                Status
              </span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={11} /> PAID
              </span>
            </div>
          </div>

          {/* Split Payment Breakdown pill if applicable */}
          {isSplit && splitDetails && (
            <div className="mt-2 pt-2 border-t border-neutral-100 bg-neutral-50 p-2.5 border border-neutral-200/70 text-xs font-mono space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                Split Payment Breakdown
              </span>
              <div className="flex justify-between text-neutral-700">
                <span>Cash Portion:</span>
                <span className="font-bold">₹{Number(splitDetails.cash || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Online / UPI Portion:</span>
                <span className="font-bold">₹{Number(splitDetails.online || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Itemized Goods Card */}
        <div className="bg-white p-4  space-y-3 ">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <ShoppingBag size={13} className="text-neutral-400" />
              <span>Purchased Merchandise</span>
            </h3>
            <span className="text-[10px] font-bold font-mono text-neutral-700  px-2 py-0.5 rounded">
              {totalQty} {totalQty === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="divide-y divide-neutral-100">
            {(bill.items || []).map((item, idx) => {
              const itemSize = item.size && item.size !== 'Standard' ? item.size : null;
              const numericSize = itemSize ? SIZE_MAP[itemSize] || null : null;
              const sizeLabel = itemSize ? (numericSize ? `${itemSize} (${numericSize})` : itemSize) : null;
              const qty = Number(item.quantity) || 1;
              const price = Number(item.price) || 0;

              return (
                <div key={idx} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate leading-snug">
                      {item.productName || item.name || 'Item'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {sizeLabel && (
                        <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
                          Size: {sizeLabel}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-neutral-500">
                        Qty: {qty}
                      </span>
                      {qty > 1 && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          (₹{price.toFixed(2)} ea)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-neutral-950 font-mono block">
                      ₹{(price * qty).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Comprehensive Pricing Breakdown Card */}
        <div className="bg-white p-4  space-y-2.5 text-xs s">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Receipt size={13} className="text-neutral-400" />
              <span>Bill Summary</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              Tax Inclusive
            </span>
          </div>

          <div className="space-y-1.5 font-mono">
            {/* Subtotal */}
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <span className="flex items-center gap-1">
                  <Percent size={11} /> Discount Applied
                </span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

         

            {/* Round Off */}
            <div className="flex justify-between text-neutral-600 border-t border-neutral-100 pt-1">
              <span>Round Off</span>
              <span className="font-semibold text-neutral-800">
                {computedRoundOff === 0 ? '₹0.00' : roundOffStr}
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2.5 border-t border-neutral-200 flex justify-between items-baseline font-mono">
            <span className="text-sm font-extrabold uppercase text-neutral-900 tracking-wide font-sans">
              Grand Total
            </span>
            <span className="text-xl font-black text-neutral-950">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 7. Exchange & Store Policy Accordion */}
        <div className="bg-white  rounded-xl overflow-hidden  print:hidden">
          <button
            type="button"
            onClick={() => setTermsOpen(!termsOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Info size={14} className="text-neutral-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Store Policy & Exchange Terms
              </span>
            </div>
            {termsOpen ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
          </button>

          {termsOpen && (
            <div className="p-4 pt-0 text-xs text-neutral-600 leading-relaxed space-y-2 border-t border-neutral-100">
              <p>• <strong>Digital E-Bill Validity:</strong> This dynamic digital receipt is valid proof of purchase across all Aesthetx Ways physical boutiques and online customer care.</p>
              <p>• <strong>7-Day In-Store Exchange:</strong> Merchandise in pristine, unworn condition with tags intact can be exchanged within 7 days at any Aesthetx Ways store.</p>
              <p>• <strong>Support Concierge:</strong> For exchange inquiries or personal styling assistance, call or WhatsApp <a href="tel:+917033769997" className="font-mono font-bold text-neutral-900 underline">+91 70337 69997</a>.</p>
            </div>
          )}
        </div>

        {/* 8. Footer Brand Link */}
        <div className="text-center space-y-2 pt-2 pb-8 font-mono text-xs print:hidden">
          <p className="text-neutral-600 font-medium">Thank you for choosing AesthetX Ways!</p>
          <div className="flex items-center justify-center gap-2">
            <a
              href="https://aesthetxways.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-neutral-900 font-bold hover:underline"
            >
              <span>aesthetxways.com</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
