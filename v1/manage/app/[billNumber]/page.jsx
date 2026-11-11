"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
    Download, 
    ShoppingBag, 
    ExternalLink, 
    Phone, 
    ChevronDown, 
    ChevronUp,
    ShieldCheck,
    Info,
    Store,
    Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SIZE_MAP = {
  S: "28",
  M: "30",
  L: "32",
  XL: "34",
  XXL: "36",
  XXXL: "38"
};

export default function DigitalBillPage() {
    const params = useParams();
    const router = useRouter();
    const billNumber = params?.billNumber ? String(params.billNumber) : "";
    
    // Fetch bill details from MongoDB
    const [bill, setBill] = useState(undefined);

    useEffect(() => {
        if (!billNumber) return;
        fetch(`/api/pos/bills/${billNumber}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.bill) {
                    setBill(data.bill);
                } else {
                    setBill(null);
                }
            })
            .catch((err) => {
                console.error("Failed to load bill from MongoDB:", err);
                setBill(null);
            });
    }, [billNumber]);
    
    // UI Accordion States
    const [taxOpen, setTaxOpen] = useState(true);
    const [termsOpen, setTermsOpen] = useState(false);
    
    // Interactive Rating States
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    // Dynamic date parsing
    const formatFullDate = (isoString) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatFullTime = (isoString) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    // Dynamic PDF url
    const pdfUrl = bill?.pdfUrl || `/api/pos/bills/${billNumber}/pdf?download=1`;

    // Calculate tax breakdown (18% inclusive)
    const subtotal = bill?.subtotal ?? 0;
    const discountAmount = bill?.discountAmount ?? 0;
    const taxableAmount = (subtotal - discountAmount) / 1.18;
    const totalTax = (subtotal - discountAmount) - taxableAmount;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    const totalQty = bill?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;

    // Loading State Skeleton with Sharp Corners and No Shadow
    if (bill === undefined) {
        return (
            <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-3">
                <div className="w-full max-w-sm bg-white rounded-none p-5 border border-slate-150 space-y-4">
                    <div className="h-8 w-20 bg-slate-100 rounded-none mx-auto animate-pulse" />
                    <div className="h-12 w-12 bg-slate-100 rounded-none mx-auto animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-100 rounded-none w-3/4 mx-auto animate-pulse" />
                        <div className="h-2 bg-slate-100 rounded-none w-1/2 mx-auto animate-pulse" />
                    </div>
                    <div className="h-20 bg-[#F8F9FC] rounded-none animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-10 bg-slate-50 rounded-none animate-pulse" />
                        <div className="h-10 bg-slate-50 rounded-none animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    // PDF Fallback Screen if Invoice not registered in Convex (e.g. legacy invoice or error)
    if (bill === null) {
        return (
            <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-3">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25 }}
                    className="w-full max-w-sm bg-white rounded-none p-5 text-center border border-slate-200 space-y-4"
                >
                    <div className="inline-flex p-3 rounded-none bg-slate-50 text-slate-700 border border-slate-200">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="text-xs font-extrabold text-slate-900 tracking-tight font-poppins uppercase">Digital Record Not Synced</h3>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                            This receipt is not cached in our cloud datastore, but the static invoice is safe. Click below to view and download the PDF.
                        </p>
                    </div>
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-none text-xs font-extrabold transition-all cursor-pointer transform duration-150 active:scale-99"
                    >
                        <Download size={14} />
                        <span>OPEN & DOWNLOAD PDF INVOICE</span>
                    </a>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-none text-[9px] font-extrabold uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
                    >
                        Back to Store Desk
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFBFD] py-4 px-3 flex flex-col items-center select-none font-inter text-slate-900">
            <style dangerouslySetInnerHTML={{ __html: `
                @font-face {
                    font-family: 'Lovelo Black';
                    src: url('/font/Lovelo%20Black.otf') format('opentype');
                    font-weight: 900;
                    font-style: normal;
                }
                .font-lovelo {
                    font-family: 'Lovelo Black', 'Arial Black', sans-serif !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.15em !important;
                }
            `}} />

            <div className="w-full max-w-sm space-y-4">
                
                {/* 1. Header Boutique Logo Brand */}
                <div className="text-center space-y-1 mb-0.5">
                    <div className="flex justify-center">
                        <img src="/logo_t.svg" alt="AesthetX Ways" className="h-12 w-auto object-contain" />
                    </div>
                    <div className="space-y-0.5">
                        <h1 className="text-[25px] font-lovelo uppercase text-slate-955 mt-3 leading-none">
                            {bill?.branch && String(bill.branch).toLowerCase() === 'gaya' ? 'AESTHETX WAYS (GAYA)' : 'AESTHETX WAYS (PATNA)'}
                        </h1>
                        <p className="text-[9px] font-mono text-slate-400 max-w-[240px] mx-auto leading-normal">
                            {bill?.branch && String(bill.branch).toLowerCase() === 'gaya'
                                ? 'Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002'
                                : 'Kankarbagh Colony More, Kankarbagh, Ghrounda, Patna, Bihar 800001'}
                        </p>
                    </div>
                </div>

                {/* 3. Amount & Action Row Bar (Flat, Sharp) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, delay: 0.05 }}
                    className="bg-white rounded-none p-4 border border-slate-200/50 flex items-center justify-between gap-4 relative overflow-hidden"
                >
                    {/* Big background stamp watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                        <span className="inline-block border-2 border-dashed border-red-700 text-red-700 uppercase text-[56px] font-black leading-none px-4 py-2 rotate-[-10deg] select-none opacity-10 tracking-[0.2em]">
                                <span style={{ marginRight: "-0.2em" }}>PAID</span>
                        </span>
                    </div>

                    <div className="space-y-0.5 relative z-10">
                        <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">Net Payable</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xl font-extrabold text-slate-955 font-poppins">₹{bill.total.toLocaleString("en-IN")}</span>
                          
                            {bill.discount > 0 && (
                                <span className="text-[8px] font-mono font-extrabold text-slate-500 bg-slate-50 px-1 py-0.5 rounded-none">
                                    {bill.discount}% OFF
                                </span>
                            )}
                        </div>
                    </div>

                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5  text-slate-950 hover:text-slate-900 rounded-none text-[10px] font-bold transition-transform duration-155 active:scale-95 cursor-pointer relative z-10"
                    >
                        <Download size={12} />
                        <span>Invoice</span>
                    </a>
                </motion.div>

                {/* 2. Customer Personalized Hero Card (Charcoal Black, Brutalist Sharp Design) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, delay: 0.1 }}
                    className="overflow-hidden bg-slate-950 text-white rounded-none p-4 relative border border-slate-900"
                >
                    {/* Brand white/gray vector overlays */}
                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-slate-800 rounded-full blur-2xl opacity-40 pointer-events-none" />
                    <div className="absolute left-0 top-0 w-16 h-16 bg-slate-850 rounded-full blur-xl opacity-35 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-3">
                    
                        <div className="space-y-0.5">
                            <h2 className="text-sm font-extrabold tracking-tight font-poppins text-white">
                                Hi, {bill.customerName ? bill.customerName.toUpperCase() : "VALUED GUEST"}
                                  <div className="flex text-sm font-extrabold items-center gap-1">
                                    <span className="font-thin text-xs">+91 {bill.customerPhone}</span>
                                </div>
                            </h2>
                            <p className="text-[10px] text-slate-300 leading-normal font-medium">
                                Thank you for shopping at AesthetX Ways. Your transaction was processed successfully.
                            </p>
                        </div>

                        {/* Interactive 5-Star Experience Rating Widget */}
                        <div className="pt-2.5 border-t border-slate-900 space-y-2">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">create the experience.</span>
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-all cursor-pointer focus:outline-none"
                                        title={`Rate ${star} Stars`}
                                    >
                                        <Star 
                                            size={14} 
                                            className={`transition-all duration-150 ${
                                                star <= (hoverRating || rating)
                                                    ? "fill-white text-white scale-110" 
                                                    : "text-slate-300 hover:text-slate-600"
                                            }`} 
                                        />
                                    </button>
                                ))}
                                {rating > 0 && (
                                    <div className="flex items-center gap-2 ml-1">
                                        <motion.span 
                                            initial={{ opacity: 0, x: -4 }} 
                                            animate={{ opacity: 1, x: 0 }} 
                                            className="text-[9px] font-mono text-emerald-400 font-bold"
                                        >
                                            Thank you!
                                        </motion.span>
                                        <a
                                            href={String(bill?.branch || '').toLowerCase() === 'gaya'
                                                ? 'https://search.google.com/local/writereview?placeid=ChIJ15OdAgAr8zkRvzNUY2o324E'
                                                : 'https://search.google.com/local/writereview?placeid=ChIJZSX8QQBZ7TkRVKYOUyR8pTE'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-mono font-bold text-amber-300 underline hover:text-amber-200"
                                        >
                                            Review on Google ↗
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* 4. Invoice Detailed Metadata Card (Flat, Sharp) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, delay: 0.15 }}
                    className=" rounded-none p-4  space-y-3"
                >
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        {/* <Store size={12} className="text-slate-400" /> */}
                        <h3 className="text-[9px] font-extrabold  tracking-wider text-slate-500 font-poppins">Bill Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10px] font-mono">
                        <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">Invoice Number</span>
                            <span className="font-bold text-slate-955 break-all">{billNumber}</span>
                        </div>
                        <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">Invoice Type</span>
                            <span className="font-bold text-slate-955">POS WALK-IN</span>
                        </div>
                        <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">Date & Time</span>
                            <span className="font-bold text-slate-955">
                                {formatFullDate(bill.createdAt)} <span className="opacity-60">·</span> {formatFullTime(bill.createdAt)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">Payment Method</span>
                            <span className="font-bold text-slate-955 uppercase">{bill.paymentMethod}</span>
                        </div>
                    </div>
                </motion.div>

                {/* 5. Itemized Shopping List Card (Flat, Sharp) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, delay: 0.2 }}
                    className="rounded-none p-4 space-y-3"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                            {/* <ShoppingBag size={12} className="text-slate-400" /> */}
                            <h3 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 font-poppins">Selected Goods</h3>
                        </div>
                        <span className="text-[8px] font-extrabold font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-none">
                            {totalQty} {totalQty === 1 ? "unit" : "units"}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {bill.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                <div className="w-10 h-10 bg-slate-50 rounded-none overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                                    {item.productImage ? (
                                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag className="text-slate-350" size={14} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-950 truncate leading-snug">{item.productName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[8px] font-mono font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded-none">
                                            SIZE {item.sizeDisplayType === "numeric" ? (SIZE_MAP[item.size] || item.size) : item.size}
                                        </span>
                                        <span className="text-[8px] font-mono text-slate-400">
                                            Qty: {item.quantity}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-extrabold text-slate-955 block">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                                    <span className="text-[8px] font-mono text-slate-450 block mt-0.5">₹{item.price.toLocaleString("en-IN")} each</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 7. Calculations Accounting Table (Flat, Sharp) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, delay: 0.3 }}
                    className="bg-white rounded-none p-4 border border-slate-200/50 space-y-3"
                >
                    <div className="space-y-2 text-[10px] font-bold text-slate-800">
                        <div className="flex justify-between text-slate-500 font-medium border-b border-slate-100 pb-2">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>
                        
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-slate-900 font-extrabold bg-slate-50 p-2 rounded-none border border-slate-200/50">
                                <span>Total Discount Applied</span>
                                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-sm font-extrabold pt-1.5 text-slate-955 font-poppins uppercase tracking-wide">
                            <span>Amount Paid</span>
                            <span>₹{bill.total.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </motion.div>

                {/* 8. Terms & Conditions Accordion (Flat, Sharp) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, delay: 0.35 }}
                    className="bg-white rounded-none border border-slate-200/50 overflow-hidden"
                >
                    <button
                        onClick={() => setTermsOpen(!termsOpen)}
                        className="w-full flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors shrink-0 cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5">
                            <Info size={12} className="text-slate-400" />
                            <h3 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 font-poppins">Terms & Conditions</h3>
                        </div>
                        {termsOpen ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                    </button>

                    <AnimatePresence initial={false}>
                        {termsOpen && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-2 text-[9px] text-slate-550 leading-relaxed space-y-1.5 font-mono uppercase">
                                    <p>1. Invoice is dynamic and serves as a valid digital E-bill proof of purchase.</p>
                                    <p>2. Items in original unused condition with tags intact can be exchanged within 7 days of checkout at the Boutique Retail Desk.</p>
                                    {/* <p>3. Tax is computed at standard Indian GST regulations (18% inclusive on luxury garments).</p> */}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* 9. Footer & Watermarks */}
                <div className="text-center space-y-4 pt-3 pb-8 font-mono">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-extrabold text-slate-900">Thank you for visiting AesthetX Ways!</p>
                        <p className="text-[8px] text-slate-400 font-bold">Please come again.</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 text-[10px]">
                        <a href="https://aesthetxways.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1">
                            <span>aesthetxways.com</span>
                            <ExternalLink size={10} className="opacity-60" />
                        </a>
                    </div>

                    <div className="text-[7px] text-slate-350 tracking-wider uppercase font-bold">
                        Powered by aesthetXways.com
                    </div>
                </div>

            </div>
        </div>
    );
}
