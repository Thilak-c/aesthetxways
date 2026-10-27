"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarcodeInput } from "@/components/Barcode";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    Printer,
    User,
    Phone,
    ShoppingBag,
    X,
    CreditCard,
    DollarSign,
    Percent,
    ArrowLeft,
    CheckCircle2,
    Layers,
    ChevronRight,
    QrCode,
    Store,
    Package,
    LayoutGrid,
    List,
    Clock,
    UserCheck,
    Cpu,
    BadgeCheck,
    History,
    ShoppingCart,
    Share2,
    FileDown,
    FileText,
    Smartphone,
    MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppRecoveryModal from "@/components/WhatsAppRecoveryModal";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "XXXL"];
const SIZE_MAP = {
  S: "28",
  M: "30",
  L: "32",
  XL: "34",
  XXL: "36",
  XXXL: "38"
};

export default function BillingPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/website/billing");
    }, [router]);
    return null;
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
    const [cart, setCart] = useState([]); 
    const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
    const [billNumber, setBillNumber] = useState("");
    const [logoBase64, setLogoBase64] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [discount, setDiscount] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null); 
    const [mobileCartOpen, setMobileCartOpen] = useState(false); // Bottom Drawer on Mobile
    const [scanPulse, setScanPulse] = useState(false);
    const [recoveryModalData, setRecoveryModalData] = useState(null);
    const [senderClientId, setSenderClientId] = useState("8008439762");
    const [currentTime, setCurrentTime] = useState("");

    // Tabs & Billing History states
    const [activeTab, setActiveTab] = useState("billing"); // "billing" or "history"
    const [historySearchQuery, setHistorySearchQuery] = useState("");
    const [selectedBill, setSelectedBill] = useState(null);

    const printRef = useRef(null);

    // Convex queries and mutations
    const products = useQuery(api.inventory.getWebsiteProductsForBilling, {});
    const createBill = useMutation(api.inventory.createWebsitePOSBill);
    const billsHistory = useQuery(api.inventory.getBillingHistory, { limit: 100 }) || [];

    // Filter billing history
    const filteredBills = billsHistory.filter((bill) => {
        const query = historySearchQuery.toLowerCase();
        return (
            bill.billNumber?.toLowerCase().includes(query) ||
            bill.customerName?.toLowerCase().includes(query) ||
            bill.customerPhone?.toLowerCase().includes(query)
        );
    });

    // Sync current clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        };
        updateClock();
        const interval = setInterval(updateClock, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load logo
    useEffect(() => {
        const loadLogo = async () => {
            try {
                const response = await fetch("/logo.png");
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setLogoBase64(reader.result);
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error("Failed to load logo:", error);
            }
        };
        loadLogo();
    }, []);

    // Generate bill number (simple 6-digit number)
    useEffect(() => {
        const num = Math.floor(100000 + Math.random() * 900000).toString();
        setBillNumber(num);
    }, []);

    // Filter products
    const filteredProducts = products?.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.itemId?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Get stock for a specific size
    const getSizeStock = (product, size) => {
        if (!product?.sizeStock) return 0;
        return product.sizeStock[size] ?? 0;
    };

    // Load external script helper
    const loadScript = (src) => new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('window not available'));
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.body.appendChild(s);
    });

    // Generate PDF from element, trigger download and upload to server
    const generatePdfAndUpload = async (element, outBillNumber) => {
        try {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

            const html2canvas = window.html2canvas || window.html2canvas?.default || window.html2canvas;
            const jspdfGlobal = window.jspdf || window.jspdf?.default || window.jspdf;
            const jsPDF = (jspdfGlobal && (jspdfGlobal.jsPDF || jspdfGlobal.default || jspdfGlobal)) || window.jsPDF || window.jsPDF?.default;

            if (!html2canvas) throw new Error('html2canvas not available');
            if (!jsPDF) throw new Error('jsPDF not available');

            // Ensure custom fonts are fully loaded in the parent window before snapshotting
            if (typeof window !== "undefined" && window.document?.fonts?.ready) {
                await window.document.fonts.ready;
            }

            // Create a clean isolated iframe to sandbox html2canvas and prevent oklch/lab color parsing crashes
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '3in';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.write(`
                <html>
                    <head>
                        <style>
                            @font-face {
                                font-family: 'Lovelo Black';
                                src: url('/font/Lovelo%20Black.otf') format('opentype');
                                font-weight: 900;
                                font-style: normal;
                            }
                             body {
                                font-family: 'Courier New', monospace;
                                width: calc(3in - 0.25in);
                                padding: 0.1in;
                                font-size: 10px;
                                color: #000;
                                background: white;
                                line-height: 1.3;
                            }
                            .font-lovelo {
                                font-family: 'Lovelo Black', 'Arial Black', sans-serif !important;
                                font-weight: 900 !important;
                                letter-spacing: 0.12em !important;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                            }
                            th, td {
                                vertical-align: top;
                            }
                            .size-pill {
                                font-family: 'Courier New', monospace !important;
                                font-weight: bold !important;
                                font-size: 9px !important;
                                color: #111 !important;
                            }
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .font-bold { font-weight: bold; }
                            .font-black { font-weight: 900; }
                            .font-mono { font-family: 'Courier New', monospace; }
                            .text-sm { font-size: 11px; }
                            .text-xs { font-size: 9px; }
                            .text-\[14px\] { font-size: 13px !important; }
                            .text-\[11px\] { font-size: 11px !important; }
                            .text-\[10px\] { font-size: 10px !important; }
                            .text-\[9px\] { font-size: 9px !important; }
                            .text-slate-400 { color: #888 !important; }
                            .text-slate-500 { color: #666 !important; }
                            .text-slate-600 { color: #444 !important; }
                            .text-slate-700 { color: #222 !important; }
                            .text-slate-800 { color: #000 !important; }
                            .text-slate-900 { color: #000 !important; }
                            .mb-6 { margin-bottom: 24px !important; }
                            .mb-5 { margin-bottom: 18px !important; }
                            .mb-4 { margin-bottom: 14px !important; }
                            .mb-2 { margin-bottom: 6px !important; }
                            .mb-1 { margin-bottom: 3px !important; }
                            .mt-1 { margin-top: 3px !important; }
                            .mt-2 { margin-top: 6px !important; }
                            .mt-3 { margin-top: 10px !important; }
                            .mt-3.5 { margin-top: 12px !important; }
                            .mt-5 { margin-top: 18px !important; }
                            .mt-6 { margin-top: 24px !important; }
                            .mt-8 { margin-top: 30px !important; }
                            .py-2.5 { padding-top: 8px !important; padding-bottom: 8px !important; }
                            .py-3 { padding-top: 10px !important; padding-bottom: 10px !important; }
                            .px-3 { padding-left: 8px !important; padding-right: 8px !important; }
                            .pr-2 { padding-right: 6px !important; }
                            .w-12 { width: 36px !important; min-width: 36px !important; }
                            .w-20 { width: 64px !important; min-width: 64px !important; }
                            .mx-auto { margin-left: auto; margin-right: auto; }
                            .w-auto { width: auto; }
                            .h-16 { height: 48px !important; }
                            .max-w-\[180px\] { max-width: 140px !important; }
                            img { display: block; margin: 0 auto 6px auto; max-height: 48px; width: auto; }
                            .bg-slate-50 { background: #fafafa !important; }
                            .bg-slate-100 { background: #e5e7eb !important; }
                            .ml-1\.5 { margin-left: 4px !important; }
                            .px-1\.5 { padding-left: 3px !important; padding-right: 3px !important; }
                            .py-0\.5 { padding-top: 1px !important; padding-bottom: 1px !important; }
                            .rounded { border-radius: 2px !important; }
                            .rounded-lg { border-radius: 4px !important; }
                        </style>
                    </head>
                    <body>
                        <div style="width: 100%;">
                            ${element.innerHTML}
                        </div>
                    </body>
                </html>
            `);
            iframeDoc.close();

            // Give resources/images a small moment to load in the hidden iframe
            await new Promise((resolve) => setTimeout(resolve, 300));
            
            // Strict check: Ensure iframe custom fonts are fully loaded
            if (iframe.contentWindow?.document?.fonts?.ready) {
                await iframe.contentWindow.document.fonts.ready;
            }

            const canvas = await html2canvas(iframeDoc.body, { scale: 2 });
            document.body.removeChild(iframe);
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({ unit: 'pt', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

            const blob = pdf.output('blob');

            try {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${outBillNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                toast.success('PDF invoice generated successfully');
            } catch (e) {
                console.warn('Download failed, opening in new tab', e);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }

            const reader = new FileReader();
            const pdfBase64 = await new Promise((res, rej) => {
                reader.onload = () => res(String(reader.result).split(',')[1]);
                reader.onerror = rej;
                reader.readAsDataURL(blob);
            });

            const saveRes = await fetch('/api/save-bill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billNumber: outBillNumber, pdfBase64 }),
            });
            if (!saveRes.ok) console.warn('Server save returned', await saveRes.text());

            return true;
        } catch (error) {
            console.error('PDF generation/upload failed:', error);
            toast.error('PDF generation failed: ' + (error?.message || error));
            return false;
        }
    };

    const getTotalStock = (product) => {
        if (!product?.sizeStock) return product?.currentStock ?? 0;
        return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    };

    const getCartQty = (productId, size) => {
        const item = cart.find(i => i._id === productId && i.size === size);
        return item?.quantity ?? 0;
    };

    const handleBarcodeScan = (barcode) => {
        if (!barcode) {
            toast.error("Scanned empty barcode");
            return;
        }

        // Trigger visual laser pulse feedback
        setScanPulse(true);
        setTimeout(() => setScanPulse(false), 900);

        const normalized = String(barcode).trim().replace(/[^\x20-\x7E]/g, "");
        const normalizeKey = (s) => String(s || "").trim().replace(/[^A-Za-z0-9]/g, "").toLowerCase();
        const lcKey = normalizeKey(normalized);

        const candidates = (products || []).map(p => {
            const pid = String(p.itemId || "");
            const pidKey = normalizeKey(pid);
            const exact = pidKey === lcKey && pidKey !== "";
            const contains = (pidKey && lcKey) ? (pidKey.includes(lcKey) || lcKey.includes(pidKey)) : false;
            return { product: p, pid, pidKey, exact, contains };
        }).filter(Boolean);

        const product = candidates.find(c => c.exact)?.product || candidates.find(c => c.contains)?.product;

        if (product) {
            if (product.availableSizes?.length > 0) {
                setSelectedProduct(product);
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("barcode-scan-success"));
                }
            } else {
                toast.error("Product has no sizes configured");
            }
            setSearchQuery("");
        } else {
            toast.error("Product not registered in website inventory");
        }
    };

    const openSizeSelector = (product) => {
        if (getTotalStock(product) <= 0) {
            toast.error("Product is out of stock");
            return;
        }
        setSelectedProduct(product);
    };

    const addToCartWithSize = (size) => {
        if (!selectedProduct || !size) return;
        
        const stock = getSizeStock(selectedProduct, size);
        const existing = cart.find(i => i._id === selectedProduct._id && i.size === size);
        const currentQty = existing?.quantity ?? 0;
        
        if (currentQty >= stock) {
            toast.error(`Only ${stock} available in size ${size}`);
            return;
        }
        
        if (existing) {
            setCart(prev => prev.map(item =>
                item._id === selectedProduct._id && item.size === size
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart(prev => [...prev, { ...selectedProduct, size, quantity: 1 }]);
        }
        
        setSelectedProduct(null);
    };

    const updateQuantity = (productId, size, delta) => {
        const product = products?.find(p => p._id === productId);
        const stock = getSizeStock(product, size);
        const existing = cart.find(item => item._id === productId && item.size === size);
        
        if (!existing) return;
        
        const newQty = existing.quantity + delta;
        
        if (newQty <= 0) {
            setCart(prev => prev.filter(item => !(item._id === productId && item.size === size)));
            return;
        }
        
        if (newQty > stock) {
            toast.error(`Only ${stock} available in size ${size}`);
            return;
        }
        
        setCart(prev => prev.map(item =>
            item._id === productId && item.size === size
                ? { ...item, quantity: newQty }
                : item
        ));
    };

    const removeFromCart = (productId, size) => {
        setCart(prev => prev.filter(item => !(item._id === productId && item.size === size)));
    };

    // Calculate totals (GST inclusive)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const baseAmount = afterDiscount / 1.18;
    const tax = afterDiscount - baseAmount;
    const total = afterDiscount;

    const sendWhatsAppNotification = async (
        outBillNumber, 
        currentCart, 
        currentCustomerInfo, 
        currentSubtotal, 
        currentDiscountAmount, 
        currentTotal, 
        currentPaymentMethod, 
        currentDiscount
    ) => {
        if (!currentCustomerInfo?.phone) return;

        try {
            const message = `Thanks you for ordering with AesthetXways! here's your E-bill:
manage.aesthetxways.com/${outBillNumber}

Grab exclusive deals on AW website
Aesthetxways.com`;

            const res = await fetch("/api/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: currentCustomerInfo.phone,
                    message: message,
                    clientId: "8008439762"
                })
            });

            const data = await res.json();
            if (data.success) {
                if (data.status === 'HOLD') {
                    toast.error("WhatsApp session offline! Scan to resume POS stream.", { id: "wa-hold-toast", duration: 4000 });
                    setRecoveryModalData({
                        clientId: data.clientId || "8008439762",
                        qrCode: data.qrBase64
                    });
                } else {
                    toast.success("WhatsApp receipt sent!");
                }
            } else {
                console.warn("WhatsApp notification error:", data.error);
                toast.error("WhatsApp alert failed.");
            }
        } catch (err) {
            console.error("Failed to trigger WhatsApp notify:", err);
        }
    };

    const handlePrint = () => {
        if (cart.length === 0) {
            toast.error("Invoice cart is empty");
            return;
        }
        
        for (const item of cart) {
            const product = products?.find(p => p._id === item._id);
            const stock = getSizeStock(product, item.size);
            if (stock < item.quantity) {
                toast.error(`${item.name} (Size ${item.size}): Only ${stock} left`);
                return;
            }
        }
        
        executePrint();
    };

    const executePrint = async () => {
        const printContent = printRef.current;
        const printWindow = window.open("", "", "width=450,height=800");
        
        // Ensure parent document fonts are ready
        if (typeof window !== "undefined" && window.document?.fonts?.ready) {
            await window.document.fonts.ready;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill - ${billNumber}</title>
                    <style>
                        @font-face {
                            font-family: 'Lovelo Black';
                            src: url('/font/Lovelo%20Black.otf') format('opentype');
                            font-weight: 900;
                            font-style: normal;
                        }
                        @page { size: 3in auto; margin: 0.1in; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Courier New', monospace;
                            width: calc(3in - 0.25in);
                            padding: 0.1in;
                            font-size: 15px; /* Increased from 12px for clear readability */
                            color: #000;
                            background: white;
                            line-height: 1.4;
                        }
                        .font-lovelo {
                            font-family: 'Lovelo Black', 'Arial Black', sans-serif !important;
                            font-weight: 900 !important;
                            letter-spacing: 0.15em !important;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            vertical-align: top;
                            border: none !important;
                        }
                        .size-pill {
                            font-family: 'Courier New', monospace !important;
                            font-weight: bold !important;
                            font-size: 14px !important;
                            color: #111 !important;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .font-black { font-weight: 900; }
                        .font-mono { font-family: 'Courier New', monospace; }
                        .text-sm { font-size: 16px; }
                        .text-xs { font-size: 14px; }
                        .text-slate-900, .text-slate-800 { color: #000 !important; }
                        .text-slate-700 { color: #111 !important; }
                        .text-slate-655, .text-slate-600 { color: #222 !important; }
                        .text-slate-500 { color: #555 !important; }
                        .text-slate-400 { color: #666 !important; }
                        .text-emerald-600 { color: #059669 !important; font-weight: bold; }
                        .text-white { color: #fff !important; }
                        .bg-slate-950 { background: #000 !important; color: #fff !important; }
                        .bg-white { background: #fff !important; }
                        .border-slate-900 { border-color: #000 !important; }
                        .border-slate-200 { border-color: #ccc !important; }
                        .border-slate-100 { border-color: #eee !important; }
                        .mb-6 { margin-bottom: 32px !important; }
                        .mb-5 { margin-bottom: 24px !important; }
                        .mb-4 { margin-bottom: 18px !important; }
                        .mb-2 { margin-bottom: 8px !important; }
                        .mb-1 { margin-bottom: 4px !important; }
                        .mb-0.5 { margin-bottom: 3px !important; }
                        .mt-1 { margin-top: 4px !important; }
                        .mt-2 { margin-top: 8px !important; }
                        .mt-2.5 { margin-top: 10px !important; }
                        .mt-3 { margin-top: 14px !important; }
                        .mt-3.5 { margin-top: 16px !important; }
                        .mt-5 { margin-top: 24px !important; }
                        .mt-6 { margin-top: 32px !important; }
                        .mt-8 { margin-top: 40px !important; }
                        .pt-1.5 { padding-top: 8px !important; }
                        .mt-1.5 { margin-top: 8px !important; }
                        .pt-3 { padding-top: 10px !important; }
                        .pt-4 { padding-top: 18px !important; }
                        .pb-4 { padding-bottom: 18px !important; }
                        .py-2 { padding-top: 8px !important; padding-bottom: 8px !important; }
                        .py-2.5 { padding-top: 12px !important; padding-bottom: 12px !important; }
                        .py-3 { padding-top: 15px !important; padding-bottom: 15px !important; }
                        .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
                        .pr-2 { padding-right: 10px !important; }
                        .p-6 { padding: 0 !important; border: none !important; box-shadow: none !important; }
                        .uppercase { text-transform: uppercase; }
                        .max-w-\[180px\] { max-width: 180px !important; }
                        .max-w-\[200px\] { max-width: 200px; }
                        .w-12 { width: 48px !important; min-width: 48px !important; }
                        .w-20 { width: 80px !important; min-width: 80px !important; }
                        .mx-auto { margin-left: auto; margin-right: auto; }
                        .w-auto { width: auto; }
                        .h-16 { height: 64px !important; }
                        .bg-slate-50 { background: #fafafa !important; }
                        .bg-slate-100 { background: #e5e7eb !important; }
                        .ml-1\.5 { margin-left: 6px !important; }
                        .px-1\.5 { padding-left: 4px !important; padding-right: 4px !important; }
                        .py-0\.5 { padding-top: 1px !important; padding-bottom: 1px !important; }
                        .rounded { border-radius: 2px !important; }
                        .rounded-lg { border-radius: 6px !important; }
                        img { display: block; margin: 0 auto 8px auto; max-height: 64px; width: auto; }
                        /* Force background colors and colors to print */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        @media print {
                            html, body { width: 3in; }
                        }
                    </style>
                </head>
                <body>
                    <div style="width: 100%;">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();

        // Let the fonts inside the print window load fully
        if (printWindow.document?.fonts?.ready) {
            await printWindow.document.fonts.ready;
        }

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 250);

        try {
            const res = await createBill({
                billNumber,
                items: cart.map(item => ({
                    productId: item._id,
                    productName: item.name,
                    productImage: item.mainImage || undefined,
                    itemId: item.itemId,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity,
                    sizeDisplayType: item.sizeDisplayType || "alpha",
                })),
                customerName: customerInfo.name || undefined,
                customerPhone: customerInfo.phone || undefined,
                subtotal,
                discount,
                discountAmount,
                tax,
                total,
                paymentMethod,
                createdBy: "billing",
            });

            if (!res || !res.success) {
                console.error("createBill unexpected response:", res);
                toast.error("Failed to save bill catalog logs.");
            } else {
                const outNumber = res?.billNumber || billNumber;
                generatePdfAndUpload(printContent, outNumber).catch(e => console.error(e));
                
                // Dispatch WhatsApp Notification (using pre-reset states)
                if (customerInfo.phone) {
                    sendWhatsAppNotification(
                        outNumber, 
                        cart, 
                        customerInfo, 
                        subtotal, 
                        discountAmount, 
                        total, 
                        paymentMethod, 
                        discount
                    );
                }
                
                toast.success("Bill printed & catalog stock updated!");
            }
        } catch (error) {
            console.error("Failed to save bill:", error);
            toast.error("Failed to save bill: " + (error?.message || error));
        }
        
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setPaymentMethod("cash");
        setDiscount(0);
        setMobileCartOpen(false);

        const num = Math.floor(100000 + Math.random() * 900000).toString();
        setBillNumber(num);
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FC]">
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
            <Sidebar />

            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
                    
                    {/* Header: Boutique Style Refined Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-6 mb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Retail Desk Terminal</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Point of Sale</h1>
                        </div>
                        {/* Dynamic boutique sliding tab switcher */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/40 shadow-inner max-w-xs w-full sm:w-auto self-end">
                            <button
                                type="button"
                                onClick={() => setActiveTab("billing")}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                    activeTab === "billing" 
                                        ? "bg-slate-950 text-white shadow-md shadow-slate-950/15" 
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <ShoppingCart size={13} />
                                <span>Billing Desk</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("history")}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                    activeTab === "history" 
                                        ? "bg-slate-950 text-white shadow-md shadow-slate-950/15" 
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <History size={13} />
                                <span>History</span>
                            </button>
                        </div>
                    </div>
                     
                    {activeTab === "billing" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* LEFT COLUMN: Search gateway + Catalog (Grid/Table switchable) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Search & Scan Terminal Dashboard */}
                            <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
                                {/* Decorative dynamic background glow */}
                                <div className="absolute -right-20 -top-20 w-52 h-52 bg-slate-800 rounded-full blur-3xl opacity-60 pointer-events-none" />
                                
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white/10 rounded-lg">
                                                <QrCode size={16} className="text-white animate-pulse" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Scanner & Search Hub</h3>
                                                <p className="text-[10px] text-slate-500">Scan product barcodes or input item names</p>
                                            </div>
                                        </div>

                                        {/* Grid / Table layout switcher */}
                                        <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1.5 border border-slate-700/60 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setViewMode("grid")}
                                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                                                title="Visual Grid view"
                                            >
                                                <LayoutGrid size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode("table")}
                                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                                                title="Condensed Table view"
                                            >
                                                <List size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2">
                                        {/* Barcode scan gate */}
                                        <div className="md:col-span-7 relative">
                                            <div className={`rounded-2xl border transition-all duration-300 ${scanPulse ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : "border-slate-800 bg-slate-950/80"}`}>
                                                <BarcodeInput onScan={handleBarcodeScan} />
                                            </div>
                                            {scanPulse && (
                                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                                    <span className="h-0.5 w-[90%] bg-emerald-500 animate-pulse absolute" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Manual item query search */}
                                        <div className="md:col-span-5 relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Manual search catalog..."
                                                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-slate-700 focus:outline-none rounded-2xl text-xs font-bold text-white focus:ring-1 focus:ring-slate-700 transition-all font-mono placeholder-slate-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Catalog shelf Container */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight font-poppins">
                                            {searchQuery ? `Matching Results for "${searchQuery}"` : "Shelf Inventory"}
                                        </h2>
                                        <p className="text-[10px] text-slate-400">Select product entries to configure checkout details</p>
                                    </div>
                                    <span className="text-[10px] font-extrabold bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-slate-600">
                                        {filteredProducts.length} Items Loaded
                                    </span>
                                </div>

                                {filteredProducts.length === 0 ? (
                                    <div className="py-16 text-center space-y-3">
                                        <div className="inline-flex p-4 rounded-full bg-slate-50 border text-slate-300">
                                            <Package size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-extrabold text-slate-800">No Inventory Hits</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Please check item codes or retry using query filters</p>
                                        </div>
                                    </div>
                                ) : viewMode === "grid" ? (
                                    /* PREMIUM GRID VIEW */
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
                                        {filteredProducts.map(product => {
                                            const totalStock = getTotalStock(product);
                                            const isOutOfStock = totalStock <= 0;
                                            return (
                                                <button
                                                    key={product._id}
                                                    onClick={() => !isOutOfStock && openSizeSelector(product)}
                                                    disabled={isOutOfStock}
                                                    className={`p-3 rounded-2xl text-left border flex flex-col justify-between h-auto transition-all duration-300 group cursor-pointer ${
                                                        isOutOfStock 
                                                            ? "bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed" 
                                                            : "bg-white border-slate-150/70 hover:border-slate-800 hover:shadow-md"
                                                    }`}
                                                >
                                                    <div className="w-full aspect-3/4 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden relative flex items-center justify-center shrink-0">
                                                        {product.mainImage ? (
                                                            <img src={product.mainImage} alt={product.name} className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300 p-1" />
                                                        ) : (
                                                            <ShoppingBag className="text-slate-300" size={18} />
                                                        )}
                                                        
                                                        {/* Visual stock gauges */}
                                                        {isOutOfStock ? (
                                                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
                                                                <span className="text-[8px] font-extrabold tracking-wider text-white bg-rose-600 px-2 py-0.5 rounded-full">DEPLETED</span>
                                                            </div>
                                                        ) : totalStock <= 5 ? (
                                                            <div className="absolute top-2 right-2">
                                                                <span className="text-[7px] font-extrabold tracking-wider text-white bg-amber-500 px-1.5 py-0.5 rounded-md">LOW STOCK</span>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-2.5 space-y-1">
                                                        <div className="flex items-start justify-between gap-1">
                                                            <p className="text-[11px] font-bold text-slate-800 truncate line-clamp-1 leading-tight flex-1">{product.name}</p>
                                                            <span className="text-[8px] font-extrabold text-slate-400 font-mono tracking-tighter uppercase shrink-0">{product.itemId}</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
                                                            <span className="text-xs font-extrabold text-slate-900">₹{product.price.toLocaleString("en-IN")}</span>
                                                            <span className={`text-[8px] font-mono font-extrabold uppercase ${totalStock <= 5 ? "text-amber-600 bg-amber-50 px-1 rounded" : "text-slate-400"}`}>
                                                                {totalStock} units left
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* SLEEK ROW-LEVEL TABLE VIEW */
                                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1.5 scrollbar-thin">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    <th className="pb-3 pl-2">Product</th>
                                                    <th className="pb-3 text-center">SKU / ItemID</th>
                                                    <th className="pb-3 text-center">Stock Level</th>
                                                    <th className="pb-3 text-right">Price</th>
                                                    <th className="pb-3 text-right pr-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredProducts.map(product => {
                                                    const totalStock = getTotalStock(product);
                                                    const isOutOfStock = totalStock <= 0;
                                                    return (
                                                        <tr key={product._id} className="group hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-3 pl-2 flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
                                                                    {product.mainImage ? (
                                                                        <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <ShoppingBag className="text-slate-350" size={14} />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-800 line-clamp-1">{product.name}</span>
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                <span className="text-[10px] font-mono font-bold text-slate-400">{product.itemId}</span>
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                {isOutOfStock ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider bg-rose-50 text-rose-600 border border-rose-100 uppercase">Depleted</span>
                                                                ) : totalStock <= 5 ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider bg-amber-50 text-amber-600 border border-amber-100 uppercase">{totalStock} Critical</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">{totalStock} Available</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                <span className="text-xs font-extrabold text-slate-900">₹{product.price.toLocaleString("en-IN")}</span>
                                                            </td>
                                                            <td className="py-3 text-right pr-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSizeSelector(product)}
                                                                    disabled={isOutOfStock}
                                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                                                                        isOutOfStock
                                                                            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                                                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-800 hover:bg-slate-900 hover:text-white"
                                                                    }`}
                                                                >
                                                                    Add
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DESKTOP COLUMN: Checkout Sidebar Panel (sticky) */}
                        <div className="hidden lg:block space-y-6 lg:sticky lg:top-4">
                            <CheckoutCard 
                                cart={cart}
                                customerInfo={customerInfo}
                                setCustomerInfo={setCustomerInfo}
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                                discount={discount}
                                setDiscount={setDiscount}
                                updateQuantity={updateQuantity}
                                removeFromCart={removeFromCart}
                                handlePrint={handlePrint}
                                subtotal={subtotal}
                                discountAmount={discountAmount}
                                tax={tax}
                                total={total}
                            />
                        </div>
                    </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6 animate-fadeIn">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-poppins">Saved Invoice Catalog</h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Search, reprint, or resend digital bills directly to guests</p>
                                </div>
                                
                                {/* Search Invoice Gateway */}
                                <div className="relative max-w-sm w-full">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search Bill #, Name, Phone..."
                                        value={historySearchQuery}
                                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/70 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            {filteredBills.length === 0 ? (
                                <div className="p-16 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                    <History className="w-10 h-10 mx-auto text-slate-300 mb-3 animate-pulse" />
                                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">No Saved Invoices Found</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                                        Check that your spelling or the 6-digit receipt number is correct, or register new sales inside the POS Desk.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Scrollable Bills List */}
                                    <div className="lg:col-span-1 space-y-3 max-h-[640px] overflow-y-auto pr-1">
                                        {filteredBills.map((billItem) => {
                                            const isSelected = selectedBill?._id === billItem._id;
                                            const dateStr = billItem.createdAt ? new Date(billItem.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "";
                                            const timeStr = billItem.createdAt ? new Date(billItem.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
                                            return (
                                                <button
                                                    key={billItem._id}
                                                    type="button"
                                                    onClick={() => setSelectedBill(billItem)}
                                                    className={`w-full text-left p-4 border rounded-2xl transition-all cursor-pointer flex flex-col gap-2.5 ${
                                                        isSelected 
                                                            ? "bg-slate-950 border-slate-950 text-white shadow-md shadow-slate-900/10" 
                                                            : "bg-white border-slate-200 hover:border-slate-400 text-slate-800 hover:bg-slate-50/30"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className={`text-xs font-mono font-extrabold ${isSelected ? "text-white" : "text-slate-900"}`}>
                                                            #{billItem.billNumber}
                                                        </span>
                                                        <span className={`text-[9px] font-mono ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                                                            {dateStr} · {timeStr}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className={`text-xs font-extrabold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                                                            {billItem.customerName ? billItem.customerName.toUpperCase() : "GUEST CLIENT"}
                                                        </div>
                                                        {billItem.customerPhone && (
                                                            <div className={`text-[9px] font-mono ${isSelected ? "text-slate-400" : "text-slate-450"}`}>
                                                                +91 {billItem.customerPhone}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center w-full pt-1.5 border-t border-slate-100/10 mt-0.5">
                                                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                                                            billItem.paymentMethod === "cash" 
                                                                ? isSelected ? "text-slate-300" : "text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5"
                                                                : isSelected ? "text-slate-300" : "text-blue-700 bg-blue-50 border border-blue-100/50 px-1.5 py-0.5"
                                                        }`}>
                                                            {billItem.paymentMethod}
                                                        </span>
                                                        <span className={`text-xs font-extrabold font-poppins ${isSelected ? "text-white" : "text-slate-955"}`}>
                                                            ₹{billItem.total.toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Selected Bill Detail view */}
                                    <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-200/40 p-5 space-y-5">
                                        {selectedBill ? (
                                            <div className="space-y-5">
                                                {/* Header Details */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-4">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Selected Invoice</span>
                                                        <h3 className="text-sm font-extrabold text-slate-955 font-mono mt-0.5">#{selectedBill.billNumber}</h3>
                                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            Processed on {new Date(selectedBill.createdAt).toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Action Buttons row */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/${selectedBill.billNumber}`, "_blank")}
                                                            className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                                                            title="View Guest Web receipt"
                                                        >
                                                            <BadgeCheck size={12} />
                                                            <span>Web Bill</span>
                                                        </button>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/uploads/bills/${selectedBill.billNumber}.pdf`, "_blank")}
                                                            className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                                                            title="Download PDF Invoice"
                                                        >
                                                            <FileDown size={12} />
                                                            <span>PDF</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!selectedBill.customerPhone) {
                                                                    toast.error("No customer phone number saved for this bill.");
                                                                    return;
                                                                }
                                                                toast.loading("Sending e-bill via WhatsApp...", { id: "resend-wa" });
                                                                try {
                                                                    await sendWhatsAppNotification(
                                                                        selectedBill.billNumber,
                                                                        selectedBill.items.map(item => ({
                                                                            productName: item.productName,
                                                                            size: item.size,
                                                                            price: item.price,
                                                                            quantity: item.quantity,
                                                                            sizeDisplayType: item.sizeDisplayType || "alpha"
                                                                        })),
                                                                        { name: selectedBill.customerName, phone: selectedBill.customerPhone },
                                                                        selectedBill.subtotal,
                                                                        selectedBill.discountAmount,
                                                                        selectedBill.total,
                                                                        selectedBill.paymentMethod,
                                                                        selectedBill.discount
                                                                    );
                                                                    toast.success("E-bill resent successfully!", { id: "resend-wa" });
                                                                } catch (e) {
                                                                    toast.error("Failed to resend: " + e.message, { id: "resend-wa" });
                                                                }
                                                            }}
                                                            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                                                            title="Resend WhatsApp Receipt"
                                                        >
                                                            <Share2 size={12} />
                                                            <span>Resend</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Customer Info Box */}
                                                <div className="bg-white border border-slate-200/50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                                                    <div>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Customer Name</span>
                                                        <span className="font-extrabold text-slate-900 uppercase font-poppins mt-0.5 block">
                                                            {selectedBill.customerName ? selectedBill.customerName : "WALK-IN VALUED GUEST"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Customer Contact</span>
                                                        <span className="font-mono font-extrabold text-slate-900 mt-0.5 block">
                                                            {selectedBill.customerPhone ? `+91 ${selectedBill.customerPhone}` : "NO CONTACT PROVIDED"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Payment Method</span>
                                                        <span className="font-extrabold text-slate-900 uppercase mt-0.5 block">
                                                            {selectedBill.paymentMethod}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Purchased Items List */}
                                                <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden">
                                                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                                                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-poppins">Purchased Items</span>
                                                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase bg-white border px-1.5 py-0.5">
                                                            {selectedBill.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0} Units
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="divide-y divide-slate-100 px-4 max-h-[220px] overflow-y-auto">
                                                        {selectedBill.items?.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between py-3 gap-3">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                                                                        {item.productImage ? (
                                                                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <ShoppingBag className="text-slate-300" size={14} />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[11px] font-bold text-slate-955 truncate leading-snug">{item.productName}</p>
                                                                        <span className="text-[8px] font-mono text-slate-450 uppercase mt-1 inline-block border bg-slate-50 px-1.5 py-0.5 rounded-lg">
                                                                            Size {item.size}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-[11px] font-extrabold text-slate-900 block">
                                                                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                                                    </span>
                                                                    <span className="text-[8px] font-mono text-slate-400 block mt-0.5">
                                                                        ₹{item.price.toLocaleString("en-IN")} x {item.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Transaction Receipt Cost Summary */}
                                                <div className="bg-white border border-slate-200/50 rounded-xl p-4 space-y-2 text-[11px] font-bold text-slate-700">
                                                    <div className="flex justify-between font-medium text-slate-450">
                                                        <span>Subtotal</span>
                                                        <span>₹{selectedBill.subtotal?.toLocaleString("en-IN")}</span>
                                                    </div>
                                                    {selectedBill.discountAmount > 0 && (
                                                        <div className="flex justify-between text-emerald-600">
                                                            <span>Discount ({selectedBill.discount}%)</span>
                                                            <span>-₹{selectedBill.discountAmount?.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-slate-950 text-sm font-extrabold pt-2 border-t border-slate-100 uppercase font-poppins">
                                                        <span>Net Paid Total</span>
                                                        <span>₹{selectedBill.total?.toLocaleString("en-IN")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                                                <FileText className="w-12 h-12 text-slate-300 mb-2.5 animate-bounce-slow" />
                                                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Select an Invoice to Audit</h3>
                                                <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed mt-1">
                                                    Choose any saved transaction receipt from the left sidebar to audit inventory details, reprint high-resolution PDF invoices, or resend e-bills.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* MOBILE FLOATING STICKY STATUS BAR & BOTTOM SHEET */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200/80 p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Net Payable</span>
                    <span className="text-lg font-extrabold text-slate-900">₹{total.toFixed(0)}</span>
                </div>
                <button
                    type="button"
                    onClick={() => setMobileCartOpen(true)}
                    className="flex items-center gap-2 px-5 py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer transition-transform duration-150 active:scale-95"
                >
                    <span>Checkout Drawer</span>
                    {cart.length > 0 && (
                        <span className="bg-white/20 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-extrabold">
                            {cart.length}
                        </span>
                    )}
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Mobile Bottom Checkout Sheet Overlay */}
            <AnimatePresence>
                {mobileCartOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden flex items-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileCartOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="bg-[#F8F9FC] w-full max-h-[92vh] rounded-t-[32px] shadow-2xl border-t border-slate-200/50 z-10 flex flex-col overflow-hidden"
                        >
                            {/* Drawer top drag handle & header */}
                            <div className="px-5 py-4 border-b border-slate-200/60 bg-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="text-slate-900" size={16} />
                                    <h3 className="font-extrabold text-slate-950 text-sm font-poppins">Invoice Desk</h3>
                                </div>
                                <button
                                    onClick={() => setMobileCartOpen(false)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    <X size={18} className="text-slate-600" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                                <CheckoutCard 
                                    cart={cart}
                                    customerInfo={customerInfo}
                                    setCustomerInfo={setCustomerInfo}
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                    discount={discount}
                                    setDiscount={setDiscount}
                                    updateQuantity={updateQuantity}
                                    removeFromCart={removeFromCart}
                                    handlePrint={handlePrint}
                                    subtotal={subtotal}
                                    discountAmount={discountAmount}
                                    tax={tax}
                                    total={total}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ALPHA/NUMERIC SIZE SELECTOR MODAL */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden z-10 flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-slate-600" />
                                    <h3 className="font-extrabold text-slate-800 text-xs tracking-tight font-poppins uppercase">Allocate Size Swatch</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                                        {selectedProduct.mainImage ? (
                                            <img src={selectedProduct.mainImage} alt={selectedProduct.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <ShoppingBag className="text-slate-300" size={14} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs tracking-tight">{selectedProduct.name}</p>
                                        <span className="text-[9px] font-mono font-extrabold text-slate-400 block mt-0.5">ITEM SKU: {selectedProduct.itemId}</span>
                                        <p className="text-xs font-extrabold text-slate-900 mt-1">₹{selectedProduct.price.toLocaleString("en-IN")}</p>
                                    </div>
                                </div>

                                {/* Sizes Grid Selector Swatches */}
                                <div className="grid grid-cols-3 gap-2.5 pt-2">
                                    {[...(selectedProduct.availableSizes || [])].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)).map(size => {
                                        const stock = getSizeStock(selectedProduct, size);
                                        const inCart = getCartQty(selectedProduct._id, size);
                                        const available = stock - inCart;
                                        const isDisabled = available <= 0;
                                        
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => !isDisabled && addToCartWithSize(size)}
                                                disabled={isDisabled}
                                                className={`py-3.5 rounded-2xl text-xs font-extrabold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                                                    isDisabled
                                                        ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-950 hover:bg-slate-950 hover:text-white hover:scale-[1.03] active:scale-95 shadow-sm"
                                                }`}
                                            >
                                                <span>{selectedProduct.sizeDisplayType === "numeric" ? (SIZE_MAP[size] || size) : size}</span>
                                                <span className={`text-[8px] font-bold mt-0.5 block ${isDisabled ? "text-rose-350" : "text-slate-400 group-hover:text-white"}`}>
                                                    {available > 0 ? `${available} left` : "SOLD OUT"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hidden Printed Receipt Node (Always mounted offscreen for immediate printing) */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "3in" }}>
                <div ref={printRef} style={{ width: "100%", background: "#fff", color: "#000" }}>
                    {/* Super clean elegant header with logo */}
                    <div className="text-center" style={{ display: 'block', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <img src={logoBase64 || "/logo.png"} alt="Aesthetx Ways" className="h-16 w-auto max-w-[180px] object-contain" style={{ display: 'block', margin: '0 auto' }} />
                        </div>
                        <h2 className="text-[14px] font-lovelo uppercase text-slate-900 mt-1" style={{ marginBottom: '4px' }}>AESTHETX WAYS</h2>
                        <p className="text-[9px] font-mono text-slate-500" style={{ maxWidth: '220px', margin: '0 auto 6px auto', lineHeight: '1.3' }}>
                            Kankarbagh Colony More, Kankarbagh,<br />Ghrounda, Patna, Bihar 800001
                        </p>
                        
                        <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '4px 0', textAlign: 'center', userSelect: 'none' }}>
                            ----------------------------------------
                        </div>
                        
                        <table className="w-full text-[9px] font-mono text-slate-500 uppercase" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td className="text-left" style={{ padding: '2px 0' }}>DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td className="text-right" style={{ padding: '2px 0' }}>TIME: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '4px 0', textAlign: 'center', userSelect: 'none' }}>
                            ----------------------------------------
                        </div>
                    </div>

                    {/* Customer profile (rendered conditionally only if present) */}
                    {(customerInfo.name || customerInfo.phone) && (
                        <div className="text-[10px] font-mono text-left" style={{ display: 'block', marginBottom: '8px' }}>
                            <p className="font-bold text-slate-500 uppercase tracking-widest text-[8px]" style={{ marginBottom: '4px' }}>Customer Profile</p>
                            <table className="w-full text-[10px] font-mono text-slate-800" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    {customerInfo.name && (
                                        <tr>
                                            <td className="text-left text-slate-500 uppercase" style={{ padding: '2px 0' }}>Name:</td>
                                            <td className="text-right font-bold text-slate-900 uppercase" style={{ padding: '2px 0' }}>{customerInfo.name}</td>
                                        </tr>
                                    )}
                                    {customerInfo.phone && (
                                        <tr>
                                            <td className="text-left text-slate-500 uppercase" style={{ padding: '2px 0' }}>Contact:</td>
                                            <td className="text-right font-bold text-slate-900" style={{ padding: '2px 0' }}>{customerInfo.phone}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '4px 0', textAlign: 'center', userSelect: 'none' }}>
                                ----------------------------------------
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ marginBottom: '8px' }}>
                        <table className="w-full text-[10px] font-mono text-slate-800" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th className="text-left font-bold uppercase tracking-wider text-slate-500" style={{ padding: '4px 0', borderBottom: '1px solid #000' }}>Item</th>
                                    <th className="text-center font-bold w-12 uppercase tracking-wider text-slate-500" style={{ padding: '4px 0', borderBottom: '1px solid #000' }}>Qty</th>
                                    <th className="text-right font-bold w-20 uppercase tracking-wider text-slate-500" style={{ padding: '4px 0', borderBottom: '1px solid #000' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Elegant gap between header line and first item row */}
                                <tr>
                                    <td colSpan="3" style={{ height: '8px', padding: 0 }}></td>
                                </tr>
                                {cart.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td className="pr-2" style={{ padding: '6px 0' }}>
                                            <p className="font-bold text-slate-900" style={{ margin: 0, lineHeight: '1.3' }}>
                                                {item.name} <span className="size-pill">({item.sizeDisplayType === "numeric" ? (SIZE_MAP[item.size] || item.size) : item.size})</span>
                                            </p>
                                        </td>
                                        <td className="text-center text-slate-700" style={{ padding: '6px 0' }}>{item.quantity}</td>
                                        <td className="text-right font-bold text-slate-900" style={{ padding: '6px 0' }}>₹{(item.price * item.quantity).toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Calculations Breakdown (No GST) */}
                    <div style={{ marginTop: '8px' }}>
                        <table className="w-full text-[10px] font-mono text-slate-800" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td className="text-left text-slate-550" style={{ padding: '3px 0' }}>Subtotal</td>
                                    <td className="text-right font-bold text-slate-900" style={{ padding: '3px 0' }}>₹{subtotal.toFixed(0)}</td>
                                </tr>
                                {discount > 0 && (
                                    <tr>
                                        <td className="text-left text-emerald-600 font-bold" style={{ padding: '3px 0' }}>Discount ({discount}%)</td>
                                        <td className="text-right text-emerald-600 font-bold" style={{ padding: '3px 0' }}>-₹{discountAmount.toFixed(0)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td colSpan="3" style={{ padding: '2px 0' }}>
                                        <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '4px 0', textAlign: 'center', userSelect: 'none' }}>
                                            ========================================
                                        </div>
                                        <table className="w-full text-xs font-black text-slate-900 uppercase tracking-widest" style={{ borderCollapse: 'collapse' }}>
                                            <tbody>
                                                <tr>
                                                    <td className="text-left font-black" style={{ padding: '2px 0' }}>TOTAL AMOUNT</td>
                                                    <td className="text-right font-black" style={{ padding: '2px 0' }}>₹{total.toFixed(0)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '4px 0', textAlign: 'center', userSelect: 'none' }}>
                                            ========================================
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Method */}
                    <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#fafafa', border: '1px solid #eee', borderRadius: '4px', textAlign: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#555', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        Paid via: {paymentMethod.toUpperCase()}
                    </div>

                    {/* Dynamic UPI QR Code Section */}
                    <div style={{ marginTop: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0', fontFamily: 'monospace' }}>SCAN TO PAY VIA UPI</p>
                        <div style={{ position: 'relative', display: 'inline-block', background: '#fff' }}>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=H&data=${encodeURIComponent(`upi://pay?pa=8008439762@ptsbi&pn=Aesthetx%20Ways&am=${Number(total || 0).toFixed(2)}&cu=INR`)}`} 
                                alt="UPI QR" 
                                style={{ width: '100px', height: '100px', display: 'block', margin: '0 auto' }} 
                            />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '26px', height: '26px', background: '#fff', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', boxSizing: 'border-box' }}>
                                <img src="/logo_t.svg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', margin: 0 }} />
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', fontWeight: 900, fontFamily: 'monospace', margin: '3px 0 0 0' }}>₹{Number(total || 0).toFixed(0)}</p>
                        <p style={{ fontSize: '8px', fontWeight: 700, color: '#444', fontFamily: 'monospace', margin: '1px 0 0 0' }}>UPI ID: 8008439762@ptsbi</p>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '16px', textAlign: 'center', fontFamily: 'monospace' }}>
                        <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '6px 0', textAlign: 'center', userSelect: 'none' }}>
                            ----------------------------------------
                        </div>
                        <p className="text-[10px] font-bold text-slate-800" style={{ margin: 0 }}>Thank you for shopping with us!</p>
                        <p className="text-[11px] text-black font-bold mt-1 tracking-wider" style={{ margin: '4px 0 0 0' }}>AesthetXways.com</p>
                        <div className="font-mono text-slate-400 text-[10px]" style={{ margin: '6px 0', textAlign: 'center', userSelect: 'none' }}>
                            ----------------------------------------
                        </div>
                    </div>
                </div>
            </div>

            {recoveryModalData && (
                <WhatsAppRecoveryModal
                    clientId={recoveryModalData.clientId}
                    initialQr={recoveryModalData.qrCode}
                    onClose={() => setRecoveryModalData(null)}
                    onConnected={() => {
                        toast.success("WhatsApp linked successfully! POS stream resumed.");
                        setRecoveryModalData(null);
                    }}
                />
            )}
        </div>
    );
}

// SUITE: CHECKOUT PANEL COMPONENT WIDGET
function CheckoutCard({
    cart,
    customerInfo,
    setCustomerInfo,
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,
    updateQuantity,
    removeFromCart,
    handlePrint,
    subtotal,
    discountAmount,
    tax,
    total
}) {
    return (
        <div className="space-y-6">
            {/* Customer specs segment */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User size={15} className="text-slate-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-750 font-poppins">Customer Details</h3>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            placeholder="Full name..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none transition-all placeholder-slate-400 text-slate-800"
                        />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            placeholder="Mobile phone..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none transition-all placeholder-slate-400 text-slate-800"
                        />
                    </div>
                </div>
            </div>

            {/* Terms of Payment selectors */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CreditCard size={15} className="text-slate-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-750 font-poppins">Payment Terms</h3>
                </div>

                <div className="bg-slate-50 p-1.5 rounded-2xl flex items-center border border-slate-200/60 shadow-inner">
                    {["cash", "card", "upi"].map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold tracking-widest uppercase transition-all cursor-pointer ${
                                paymentMethod === method
                                    ? "bg-slate-950 text-white shadow-md border border-slate-800"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            {/* Discounter controllers */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Percent size={15} className="text-slate-400" />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-750 font-poppins">Discount Rate</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setDiscount(discount === 10 ? 0 : 10)}
                        className={`py-3 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                            discount === 10
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                    >
                        10% VIP Disc.
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const input = prompt("Enter custom discount percentage (0-100):", String(discount));
                            if (input === null) return;
                            const n = Number(input);
                            if (Number.isFinite(n) && n >= 0 && n <= 100) {
                                setDiscount(n);
                            } else {
                                toast.error("Invalid discount range");
                            }
                        }}
                        className={`py-3 px-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer truncate ${
                            discount !== 10 && discount > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                    >
                        Custom: {discount !== 10 && discount > 0 ? `${discount}%` : "0%"}
                    </button>
                </div>
            </div>

            {/* Cart Allocation visualizer */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={15} className="text-slate-400" />
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-750 font-poppins">Selected Goods</h3>
                    </div>
                    <span className="text-[10px] font-extrabold font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">{cart.length} unique</span>
                </div>

                {cart.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                        <div className="inline-flex p-3 rounded-full bg-slate-50 border text-slate-350">
                            <ShoppingBag size={18} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold font-poppins">Desk cart is empty</p>
                    </div>
                ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                        {cart.map((item, idx) => (
                            <div key={`${item._id}-${item.size}-${idx}`} className="flex items-center gap-3 p-2 bg-[#F8F9FC]/80 rounded-2xl border border-slate-150/40">
                                <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shrink-0 border border-slate-200/50 flex items-center justify-center">
                                    {item.mainImage ? (
                                        <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag className="text-slate-300" size={14} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                                    <p className="text-[9px] font-extrabold text-slate-400 mt-0.5">SIZE {item.sizeDisplayType === "numeric" ? (SIZE_MAP[item.size] || item.size) : item.size} • ₹{item.price.toLocaleString("en-IN")}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(item._id, item.size, -1)}
                                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-4 text-center text-xs font-mono font-bold text-slate-900">{item.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(item._id, item.size, 1)}
                                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                                    >
                                        <Plus size={11} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item._id, item.size)}
                                        className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg ml-0.5 cursor-pointer"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mathematical calculations breakdown */}
                {cart.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-bold">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-emerald-700 font-extrabold bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                                <span>Disc. ({discount}%)</span>
                                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-slate-400 text-[10px] font-medium leading-normal">
                            <span>Incl. GST (18%)</span>
                            <span>₹{tax.toLocaleString("en-IN")}</span>
                        </div>
                        
                        <div className="flex justify-between text-lg font-extrabold pt-3.5 border-t border-slate-100 text-slate-950 font-poppins">
                            <span>Net Price</span>
                            <span>₹{total.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Execute bill drawer generator button */}
            <button
                type="button"
                onClick={handlePrint}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-slate-950/10 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform duration-150 active:scale-99"
            >
                <Printer size={15} />
                <span>PROCESS & PRINT THERMAL INVOICE</span>
            </button>
        </div>
    );
}
