"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  executeThermalReceiptPrint,
  DEFAULT_STORE_SETTINGS,
  STORE_BRANCHES,
} from "@/lib/thermal-printer";
import toast from "react-hot-toast";
import { Printer, ShoppingBag, Plus, RefreshCw, Sparkles, Search, Layers, Tag, Scan, ChevronDown, Trash2, X, Check, CreditCard, Banknote, Smartphone, FileText, Camera, QrCode, History, Lock, AlertTriangle, FileDown, Pencil } from "lucide-react";
import ThermalBillModal, {
  triggerDirectPdfPrint,
  triggerDirectPdfDownload,
  triggerAutoPrintAndDownload,
} from "@/components/billing/ThermalBillModal";

export default function BillingPage() {
  // Live MongoDB POS Data
  const [websiteProducts, setWebsiteProducts] = useState([]);
  const [quickProducts, setQuickProducts] = useState([]);
  const [billsHistory, setBillsHistory] = useState([]);
  const [isLoadingBillingData, setIsLoadingBillingData] = useState(true);

  // 80mm PDF Thermal Receipt Preview Modal state
  const [pdfPreviewBill, setPdfPreviewBill] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const fetchBillingData = async () => {
    try {
      setIsLoadingBillingData(true);
      const res = await fetch("/api/pos/billing");
      const data = await res.json();
      if (data.success) {
        setWebsiteProducts(data.websiteProducts || []);
        setQuickProducts(data.quickProducts || []);
        setBillsHistory(data.billsHistory || []);
      }
    } catch (err) {
      console.error("Failed to load MongoDB billing data:", err);
    } finally {
      setIsLoadingBillingData(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/pos-settings");
        const data = await res.json();
        if (data.success && data.branches) {
          setBranchesConfig(data.branches);
          if (data.whatsapp) setWhatsappConfig(data.whatsapp);
          const savedBranch = typeof window !== "undefined" ? localStorage.getItem("pos_branch") : null;
          const chosenBranch = savedBranch || data.activeBranch || "patna";
          setActiveBranch(chosenBranch);
        }
      } catch (err) {
        console.warn("Failed to load dynamic POS settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const createBill = async (billPayload) => {
    const res = await fetch("/api/pos/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(billPayload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to create bill in MongoDB");
    }
    // Refresh catalog and history in background
    fetchBillingData();
    return data;
  };

  // Unified items list: Name, Category, Price, availableSizes, etc.
  const allItems = useMemo(() => {
    const quick = (quickProducts || []).map((p) => ({
      id: `quick-${p._id || p.itemId}`,
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      category: p.category || "Quick Item",
      price: Number(p.price) || 0,
      isBillingProduct: true,
    }));
    const web = (websiteProducts || []).map((p) => ({
      id: `web-${p._id || p.itemId}`,
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      category: "Website Item",
      price: Number(p.price) || 0,
      availableSizes: p.availableSizes || [],
      sizeStock: p.sizeStock || {},
      isBillingProduct: false,
    }));
    return [...quick, ...web];
  }, [quickProducts, websiteProducts]);

  // Autocomplete dropdown state for cart rows
  const [activeDropdownRowId, setActiveDropdownRowId] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".autocomplete-cell")) {
        setActiveDropdownRowId(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to select an item from the autocomplete dropdown for a specific row
  const handleSelectItemForCartRow = (rowId, item) => {
    setCart((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const price = Number(item.price) || 0;
        const qty = Number(row.quantity) || 1;
        const baseAmount = price * qty;
        const discountAmount = Number(row.discountAmount) || 0;
        const finalAmount = Math.max(0, baseAmount - discountAmount);
        return {
          ...row,
          productId: item._id || item.itemId || item.id,
          itemId: item.itemId || item.productId || "",
          name: item.name,
          price: price,
          amount: finalAmount,
          size: (item.availableSizes && item.availableSizes.length > 0) ? item.availableSizes[0] : (row.size || "Standard"),
        };
      })
    );
    setActiveDropdownRowId(null);
  };

  // View toggle: "catalog" or "history"
  const [topSectionView, setTopSectionView] = useState("catalog");
  const [editingBill, setEditingBill] = useState(null);

  // Password confirmation modal state
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    billNumber: "",
    actionType: "", // "delete" | "edit-empty"
    payload: null,
  });
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  // Search filter for History table
  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return billsHistory;
    return billsHistory.filter((b) => {
      const bNum = String(b.billNumber || "").toLowerCase();
      const cName = String(b.customerName || "").toLowerCase();
      const cPhone = String(b.customerPhone || "").toLowerCase();
      const cEmail = String(b.customerEmail || "").toLowerCase();
      const itemsText = (b.items || [])
        .map((it) => `${it.productName || it.name || ""} ${it.size || ""}`)
        .join(" ")
        .toLowerCase();
      return bNum.includes(q) || cName.includes(q) || cPhone.includes(q) || cEmail.includes(q) || itemsText.includes(q);
    });
  }, [billsHistory, searchQuery]);

  // Active Store Location & Cashier State
  const [branchesConfig, setBranchesConfig] = useState(STORE_BRANCHES);
  const [whatsappConfig, setWhatsappConfig] = useState({ clientId: "7033769997" });
  const [activeBranch, setActiveBranch] = useState("patna");
  const [storeSettings, setStoreSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [activeCashier, setActiveCashier] = useState({ name: "Admin Cashier", id: "admin-1" });
  const currentBranch = branchesConfig[activeBranch] || branchesConfig.patna || STORE_BRANCHES.patna;

  useEffect(() => {
    const cur = branchesConfig[activeBranch] || branchesConfig.patna || STORE_BRANCHES[activeBranch] || STORE_BRANCHES.patna;
    if (cur) {
      setStoreSettings((prev) => ({ ...prev, ...cur }));
    }
  }, [activeBranch, branchesConfig]);

  // Core Billing & Transaction States
  const [billNumber, setBillNumber] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", email: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "upi" | "split"
  const [splitPayment, setSplitPayment] = useState({ cash: "", online: "", lastEdited: "cash" });

  // Invoice Footer Controls (Terms, Copies, Reference, Description, Round Off)
  const [termsTitle, setTermsTitle] = useState("Sale Invoice");
  const [termsText, setTermsText] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [roundOffActive, setRoundOffActive] = useState(false);
  const [manualRoundOff, setManualRoundOff] = useState(null);
  const [manualTotal, setManualTotal] = useState(null);
  const [descriptionText, setDescriptionText] = useState("");
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);

  // Add Item From Upper Table into Billing Cart (supports optional chosen size)
  const handleAddItemToCart = (item, chosenSize = null) => {
    const targetSize =
      chosenSize ||
      (item.availableSizes && item.availableSizes.length > 0
        ? item.availableSizes[0]
        : "Standard");

    const existing = cart.find(
      (p) => p.name === item.name && (p.size === targetSize || (!p.size && targetSize === "Standard"))
    );
    if (existing) {
      toast.success(`Incremented "${item.name}" (Qty: ${(Number(existing.quantity) || 1) + 1})`);
    } else {
      toast.success(`Added "${item.name}" (${targetSize}) to bill`);
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.name === item.name && (p.size === targetSize || (!p.size && targetSize === "Standard"))
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const row = updated[existingIdx];
        const newQty = (Number(row.quantity) || 1) + 1;
        const rawSubtotal = newQty * (Number(row.price) || 0);
        const newDiscountAmt = row.discountPercent > 0
          ? Math.round(((rawSubtotal * row.discountPercent) / 100) * 100) / 100
          : row.discountAmount;
        const net = Math.max(0, rawSubtotal - newDiscountAmt);
        const taxAmt = row.taxPercent > 0
          ? Math.round(((net * row.taxPercent) / 100) * 100) / 100
          : 0;
        updated[existingIdx] = {
          ...row,
          quantity: newQty,
          discountAmount: newDiscountAmt,
          taxAmount: taxAmt,
          amount: Math.round((net + taxAmt) * 100) / 100,
        };
        return updated;
      }

      const pPrice = Number(item.price) || 0;
      const newRow = {
        id: `row-${Date.now()}-${Math.random()}`,
        productId: item.id || `item-${Date.now()}`,
        name: item.name,
        quantity: 1,
        unit: "NONE",
        price: pPrice,
        priceWithTax: true,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        amount: pPrice,
        size: targetSize,
        sizeDisplayType: item.sizeDisplayType || "letter",
      };
      return [...prev, newRow];
    });
  };

  // Add Empty Row
  const handleAddEmptyRow = () => {
    const newRowId = `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newRow = {
      id: newRowId,
      productId: `manual-${Date.now()}`,
      name: "",
      quantity: 1,
      unit: "NONE",
      price: 0,
      priceWithTax: true,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      amount: 0,
    };
    setCart((prev) => [...prev, newRow]);
  };

  // Update specific field in row
  const handleUpdateRow = (id, field, value) => {
    if (field === "name") {
      if (String(value).trim().length >= 1) {
        setActiveDropdownRowId(id);
      } else {
        setActiveDropdownRowId(null);
      }
    }

    setCart((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        const qty = Number(field === "quantity" ? value : updated.quantity) || 0;
        const price = Number(field === "price" ? value : updated.price) || 0;
        const lineSubtotal = qty * price;

        let discPct = Number(updated.discountPercent) || 0;
        let discAmt = Number(updated.discountAmount) || 0;

        if (field === "discountPercent") {
          discPct = Math.max(0, Number(value) || 0);
          discAmt = lineSubtotal > 0 ? Math.round(((lineSubtotal * discPct) / 100) * 100) / 100 : 0;
          updated.discountPercent = discPct;
          updated.discountAmount = discAmt;
        } else if (field === "discountAmount") {
          discAmt = Math.max(0, Number(value) || 0);
          discPct = lineSubtotal > 0 ? Math.round(((discAmt / lineSubtotal) * 100) * 1000) / 1000 : 0;
          updated.discountPercent = discPct;
          updated.discountAmount = discAmt;
        } else if (field === "price" || field === "quantity") {
          if (discPct > 0) {
            discAmt = Math.round(((lineSubtotal * discPct) / 100) * 100) / 100;
            updated.discountAmount = discAmt;
          }
        }

        const netAfterDisc = Math.max(0, lineSubtotal - discAmt);
        const taxPct = Number(field === "taxPercent" ? value : updated.taxPercent) || 0;
        const taxAmt = taxPct > 0 ? Math.round(((netAfterDisc * taxPct) / 100) * 100) / 100 : 0;
        updated.taxAmount = taxAmt;

        updated.amount = Math.round((netAfterDisc + taxAmt) * 100) / 100;
        return updated;
      })
    );
  };

  // Delete row
  const handleDeleteRow = (id) => {
    setCart((prev) => prev.filter((r) => r.id !== id));
  };

  // Totals calculations across all cart rows
  const totals = useMemo(() => {
    const totalQty = cart.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const totalDiscount = cart.reduce((sum, r) => sum + (Number(r.discountAmount) || 0), 0);
    const totalTax = cart.reduce((sum, r) => sum + (Number(r.taxAmount) || 0), 0);
    const grandTotal = cart.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const subtotal = cart.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.price) || 0), 0);
    return {
      totalQty,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }, [cart]);

  // Backward compatible values for printing
  const subtotal = totals.subtotal;
  const discountAmount = totals.totalDiscount;
  const effectiveDiscount = subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0;
  const discountType = "flat";
  const tax = totals.totalTax;
  const cgst = Math.round((tax / 2) * 100) / 100;
  const sgst = Math.round((tax / 2) * 100) / 100;
  const rawGrandTotal = totals.grandTotal;
  // Round to nearest 10 so the last digit is always 0 (e.g. 1497 -> 1500, 6197 -> 6200)
  const roundedToTens = Math.round(rawGrandTotal / 10) * 10;
  const autoRoundOff = roundOffActive
    ? Math.round((roundedToTens - rawGrandTotal) * 100) / 100
    : 0;

  const currentRoundOff = roundOffActive
    ? (manualRoundOff !== null ? (typeof manualRoundOff === "number" ? manualRoundOff : parseFloat(manualRoundOff) || 0) : autoRoundOff)
    : 0;

  const currentPayableTotal = manualTotal !== null
    ? (typeof manualTotal === "number" ? manualTotal : parseFloat(manualTotal) || 0)
    : Math.max(0, Math.round((rawGrandTotal + currentRoundOff) * 100) / 100);

  const finalPayableTotal = currentPayableTotal;
  const roundOffAmount = currentRoundOff;
  const grandTotal = finalPayableTotal;
  const roundOff = roundOffAmount;

  // Manual handlers for Round Off and Total inputs
  const handleRoundOffInputChange = (val) => {
    if (val === "" || val === "-" || val === "+") {
      setManualRoundOff(val);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setManualRoundOff(num);
      const computed = Math.max(0, Math.round((rawGrandTotal + num) * 100) / 100);
      setManualTotal(computed);
      if (!roundOffActive) setRoundOffActive(true);
    }
  };

  const handleTotalInputChange = (val) => {
    if (val === "" || val === "-") {
      setManualTotal(val);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setManualTotal(num);
      const diff = Math.round((num - rawGrandTotal) * 100) / 100;
      setManualRoundOff(diff);
      if (!roundOffActive) setRoundOffActive(true);
    }
  };

  const handleToggleRoundOff = (checked) => {
    setRoundOffActive(checked);
    if (!checked) {
      setManualRoundOff(0);
      setManualTotal(rawGrandTotal);
    } else {
      setManualRoundOff(null);
      setManualTotal(null);
    }
  };

  // Reset manual overrides when cart item count changes
  useEffect(() => {
    setManualRoundOff(null);
    setManualTotal(null);
  }, [cart.length]);

  // Smart Synchronization: Payment Type & Cash/Online
  const handlePaymentTypeSelect = (val) => {
    setPaymentType(val);
    const mode = val.toLowerCase();
    if (mode.includes("upi")) {
      setPaymentMethod("upi");
      setSplitPayment({ cash: "0", online: String(finalPayableTotal), lastEdited: "online" });
    } else if (mode.includes("cash")) {
      setPaymentMethod("cash");
      setSplitPayment({ cash: String(finalPayableTotal), online: "0", lastEdited: "cash" });
    } else {
      setPaymentMethod("split");
    }
  };

  const handleCashChange = (val) => {
    if (val === "") {
      setSplitPayment({ cash: "", online: String(finalPayableTotal), lastEdited: "cash" });
      setPaymentType("UPI");
      setPaymentMethod("upi");
      return;
    }
    const num = Math.max(0, Math.min(finalPayableTotal, parseFloat(val) || 0));
    const remaining = Math.max(0, Math.round((finalPayableTotal - num) * 100) / 100);
    setSplitPayment({
      cash: val,
      online: remaining > 0 ? String(remaining) : "0",
      lastEdited: "cash",
    });

    if (num >= finalPayableTotal) {
      setPaymentType("Cash");
      setPaymentMethod("cash");
    } else if (num === 0) {
      setPaymentType("UPI");
      setPaymentMethod("upi");
    } else {
      setPaymentType("Split");
      setPaymentMethod("split");
    }
  };

  const handleOnlineChange = (val) => {
    if (val === "") {
      setSplitPayment({ cash: String(finalPayableTotal), online: "", lastEdited: "online" });
      setPaymentType("Cash");
      setPaymentMethod("cash");
      return;
    }
    const num = Math.max(0, Math.min(finalPayableTotal, parseFloat(val) || 0));
    const remaining = Math.max(0, Math.round((finalPayableTotal - num) * 100) / 100);
    setSplitPayment({
      cash: remaining > 0 ? String(remaining) : "0",
      online: val,
      lastEdited: "online",
    });

    if (num >= finalPayableTotal) {
      setPaymentType("UPI");
      setPaymentMethod("upi");
    } else if (num === 0) {
      setPaymentType("Cash");
      setPaymentMethod("cash");
    } else {
      setPaymentType("Split");
      setPaymentMethod("split");
    }
  };

  // Sync cash/online amounts whenever the final payable total changes (e.g. Round Off or Cart items)
  useEffect(() => {
    setSplitPayment((prev) => {
      const mode = (paymentType || "").toLowerCase();
      if (mode.includes("upi")) {
        return { cash: "0", online: String(finalPayableTotal), lastEdited: "online" };
      }
      if (mode.includes("cash")) {
        return { cash: String(finalPayableTotal), online: "0", lastEdited: "cash" };
      }

      // Split mode: keep whichever field was last edited and adjust the other
      const c = parseFloat(prev.cash) || 0;
      const o = parseFloat(prev.online) || 0;
      if (prev.lastEdited === "cash") {
        const remainingOnline = Math.max(0, Math.round((finalPayableTotal - c) * 100) / 100);
        return { ...prev, online: String(remainingOnline) };
      } else {
        const remainingCash = Math.max(0, Math.round((finalPayableTotal - o) * 100) / 100);
        return { ...prev, cash: String(remainingCash) };
      }
    });
  }, [finalPayableTotal, paymentType]);

  // Dynamic UPI QR code generation for the online portion
  const [upiQrUrl, setUpiQrUrl] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const onlineNum = Math.max(0, parseFloat(splitPayment.online) || 0);

  useEffect(() => {
    if (onlineNum > 0) {
      const upiId = storeSettings?.upiId || "aesthetxways07@okicici";
      const branchKey = String(activeBranch || storeSettings?.id || "patna").toLowerCase();
      const payeeName = branchKey === "gaya" ? "Aesthetx Ways Gaya" : "Aesthetx Ways Patna";
      const upiPayload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${onlineNum.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill ${billNumber}`)}`;
      QRCode.toDataURL(upiPayload, {
        width: 260,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((url) => setUpiQrUrl(url))
        .catch((err) => console.error("UPI QR Generation Error:", err));
    } else {
      setUpiQrUrl("");
    }
  }, [onlineNum, billNumber, storeSettings]);

  // 80mm POS Thermal Receipt Trigger (@react-pdf/renderer)
  const executeMagnetRestroPrint = async (targetBill = null) => {
    const targetBillNumber = targetBill?.billNumber || billNumber;
    if (!targetBillNumber) return;
    // Direct in-page print without opening modal popup
    triggerDirectPdfPrint(targetBillNumber);
  };

  // Date time formatter for history table
  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Load a bill from history into active cart and controls
  const handleLoadBillIntoEditor = (bill) => {
    const loadedRows = (bill.items || []).map((it, idx) => {
      const price = Number(it.price) || 0;
      const qty = Number(it.quantity) || 1;
      return {
        id: `row-${Date.now()}-${idx}`,
        productId: it.productId || it.itemId || `item-${idx}`,
        name: it.productName || it.name || "Item",
        quantity: qty,
        unit: "NONE",
        price: price,
        priceWithTax: true,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        amount: price * qty,
        size: it.size || "Standard",
        sizeDisplayType: it.sizeDisplayType || "letter",
      };
    });

    setCart(loadedRows);
    setBillNumber(String(bill.billNumber));
    setCustomerInfo({
      name: bill.customerName || "",
      phone: bill.customerPhone || "",
      email: bill.customerEmail || "",
    });
    setEditingBill(bill);
    if (bill.branch && (bill.branch === "patna" || bill.branch === "gaya")) {
      setActiveBranch(bill.branch);
    }

    if (bill.paymentMethod) {
      const pm = bill.paymentMethod.toLowerCase();
      if (pm.includes("upi")) {
        setPaymentType("UPI");
        setPaymentMethod("upi");
      } else if (pm.includes("split")) {
        setPaymentType("Split");
        setPaymentMethod("split");
        if (bill.splitDetails) {
          setSplitPayment({
            cash: String(bill.splitDetails.cash || 0),
            online: String(bill.splitDetails.online || 0),
            lastEdited: "cash",
          });
        }
      } else {
        setPaymentType("Cash");
        setPaymentMethod("cash");
      }
    }

    setTopSectionView("catalog");

    // Smooth scroll down to active billing cart section
    const scrollToCartSection = () => {
      const cartEl = document.getElementById("billing-cart-section");
      if (cartEl) {
        cartEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    setTimeout(scrollToCartSection, 80);
    setTimeout(scrollToCartSection, 250);
  };

  const handleExitEditMode = () => {
    setEditingBill(null);
    setCart([]);
    setCustomerInfo({ name: "", phone: "", email: "" });
    setPaymentMethod("cash");
    setPaymentType("Cash");
    setReferenceNo("");
    setDescriptionText("");
    setTermsText("");
    setSplitPayment({ cash: "", online: "", lastEdited: "cash" });
    setBillNumber(String(Math.floor(100000 + Math.random() * 900000)));
    setManualRoundOff(null);
    setManualTotal(null);
    setRoundOffActive(false);
  };

  // Trigger delete password prompt
  const handlePromptDeleteBill = (bill, e) => {
    e?.stopPropagation();
    setAuthModal({
      isOpen: true,
      title: "Authorize Bill Deletion",
      description: `Enter admin password to permanently delete Bill #${bill.billNumber} (${bill.customerName || "Walk-in"}).`,
      billNumber: bill.billNumber,
      actionType: "delete",
      payload: { billNumber: bill.billNumber },
    });
    setAuthPassword("");
    setAuthError("");
  };

  // Submit password authorization
  const handleConfirmAuth = async () => {
    const pwd = authPassword.trim();
    if (!pwd) {
      setAuthError("Password is required");
      return;
    }

    const toastId = toast.loading("Verifying admin authorization...");
    try {
      if (authModal.actionType === "delete") {
        const res = await fetch("/api/pos/billing", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billNumber: authModal.billNumber,
            adminPassword: pwd,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setAuthError(data.error || "Invalid admin password");
          toast.error(data.error || "Failed to delete bill", { id: toastId });
          return;
        }

        toast.success(`Bill #${authModal.billNumber} deleted successfully!`, { id: toastId });
        setAuthModal({ isOpen: false, title: "", description: "", billNumber: "", actionType: "", payload: null });
        if (editingBill?.billNumber === authModal.billNumber) {
          handleExitEditMode();
        }
        fetchBillingData();
      } else if (authModal.actionType === "edit" || authModal.actionType === "edit-empty") {
        const res = await fetch("/api/pos/billing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...authModal.payload,
            adminPassword: pwd,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setAuthError(data.error || "Invalid admin password");
          toast.error(data.error || "Failed to update bill", { id: toastId });
          return;
        }

        toast.success(`Bill #${authModal.billNumber} updated in MongoDB!`, { id: toastId });

        // Trigger thermal receipt print and download automatically without modal popup
        if (authModal.payload?.items?.length > 0) {
          triggerAutoPrintAndDownload(authModal.billNumber);
        }

        setAuthModal({ isOpen: false, title: "", description: "", billNumber: "", actionType: "", payload: null });
        handleExitEditMode();
        fetchBillingData();
      }
    } catch (err) {
      setAuthError(err.message || "Authorization failed");
      toast.error("Error: " + err.message, { id: toastId });
    }
  };

  // Process Bill Transaction and Trigger Print
  const handleProcessBillAndPrint = async () => {
    if (isSubmitting) return;

    // If in edit mode and the user emptied the whole section (cart is empty)
    if (editingBill && cart.length === 0) {
      setAuthModal({
        isOpen: true,
        title: "Confirm Empty Bill Update",
        description: `The cart is completely empty. Enter admin password to confirm clearing/updating Bill #${editingBill.billNumber}.`,
        billNumber: editingBill.billNumber,
        actionType: "edit-empty",
        payload: {
          billNumber: editingBill.billNumber,
          items: [],
          customerName: customerInfo.name?.trim() || "Walk-in Guest",
          customerPhone: (customerInfo.phone || "").replace(/\D/g, "") || undefined,
          customerEmail: customerInfo.email?.trim() || undefined,
          subtotal: 0,
          discount: 0,
          discountAmount: 0,
          tax: 0,
          total: 0,
          paymentMethod: paymentMethod,
          isEmptied: true,
        },
      });
      setAuthPassword("");
      setAuthError("");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty! Add products before billing.");
      return;
    }

    const trimmedName = customerInfo.name?.trim();
    if (!trimmedName) {
      toast.error("Customer Name is required!");
      return;
    }

    const cleanPhone = (customerInfo.phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error("Customer Phone Number is required (must be 10 digits)!");
      return;
    }

    const cleanEmail = (customerInfo.email || "").trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address or leave it empty!");
      return;
    }

    const finalCustomerName = trimmedName;

    const c = parseFloat(splitPayment.cash) || 0;
    const o = parseFloat(splitPayment.online) || 0;

    let computedPaymentMethod = paymentMethod;
    let finalSplitDetails = undefined;

    if (c > 0 && o > 0) {
      computedPaymentMethod = "split";
      if (Math.abs((c + o) - grandTotal) > 0.01) {
        toast.error(`Split amounts (₹${(c + o).toFixed(2)}) must equal Grand Total (₹${grandTotal.toFixed(2)})`);
        return;
      }
      finalSplitDetails = { cash: c, online: o };
    } else if (o > 0 && c === 0) {
      computedPaymentMethod = "upi";
    } else {
      computedPaymentMethod = "cash";
    }

    setIsSubmitting(true);
    const cashierNameStr = activeCashier ? activeCashier.name : "POS Cashier";
    const toastId = toast.loading("Processing POS bill in MongoDB & updating stock...");

    try {
      const cleanItems = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName || item.name,
        productImage: item.productImage || undefined,
        itemId: item.itemId || item.productId,
        size: item.size || "Standard",
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        sizeDisplayType: item.sizeDisplayType || "letter",
      }));

      let result;
      if (editingBill) {
        setIsSubmitting(false);
        toast.dismiss(toastId);
        setAuthModal({
          isOpen: true,
          title: "Authorize Bill Edit",
          description: `Enter admin password to save changes to Bill #${editingBill.billNumber} (${finalCustomerName}).`,
          billNumber: editingBill.billNumber,
          actionType: "edit",
          payload: {
            billNumber: editingBill.billNumber,
            items: cleanItems,
            customerName: finalCustomerName,
            customerPhone: cleanPhone || undefined,
            customerEmail: cleanEmail || undefined,
            subtotal,
            discount: effectiveDiscount,
            discountAmount,
            discountType,
            tax,
            roundOff: roundOffAmount,
            total: grandTotal,
            paymentMethod: computedPaymentMethod,
            splitDetails: finalSplitDetails,
            updatedBy: cashierNameStr,
            branch: activeBranch,
            storeName: currentBranch?.storeName,
            storeAddress: currentBranch?.storeAddress,
            storePhone: currentBranch?.phone,
            upiId: currentBranch?.upiId,
          },
        });
        setAuthPassword("");
        setAuthError("");
        return;
      }

      result = await createBill({
        billNumber: String(Math.floor(Number(billNumber) || 100000)),
        items: cleanItems,
        customerName: finalCustomerName,
        customerPhone: cleanPhone || undefined,
        customerEmail: cleanEmail || undefined,
        subtotal,
        discount: effectiveDiscount,
        discountAmount,
        discountType,
        tax,
        roundOff: roundOffAmount,
        total: grandTotal,
        paymentMethod: computedPaymentMethod,
        splitDetails: finalSplitDetails,
        createdBy: cashierNameStr,
        branch: activeBranch,
        storeName: currentBranch?.storeName,
        storeAddress: currentBranch?.storeAddress,
        storePhone: currentBranch?.phone,
        upiId: currentBranch?.upiId,
      });

      if (result?.emailSent) {
        toast.success(`Bill saved & confirmation email sent to ${cleanEmail}!`, { id: toastId });
      } else {
        toast.success("Bill saved to MongoDB & inventory updated!", { id: toastId });
      }

      const savedBillNumber = result?.billNumber || billNumber;

      // Automatically send WhatsApp digital bill link if customer phone is provided
      if (cleanPhone) {
        try {
          const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
          const prodBase = (process.env.NEXT_PUBLIC_APP_URL || "https://aesthetxways.com").replace(/\/+$/, "");
          const billPageUrl = isLocal
            ? `http://localhost:6002/bill/${savedBillNumber}`
            : `${prodBase}/bill/${savedBillNumber}`;
          const waMsg = `Hi ${finalCustomerName}, here is your digital receipt for Bill *#${savedBillNumber}* (₹${Number(grandTotal).toLocaleString('en-IN')}):

🔗 *View & Download Invoice:*
${billPageUrl}

✨ *Thank you for shopping at Aesthetx Ways!*`;

          const targetClientId = whatsappConfig.clientId || '7033769997';

          fetch('/api/whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: cleanPhone,
              message: waMsg,
              clientId: targetClientId,
            }),
          })
            .then(() => {
              // Send Google Store Review follow-up message after 1.5 seconds
              const branchReviewUrl = currentBranch?.reviewUrl || (String(activeBranch || "").toLowerCase() === "gaya"
                ? "https://search.google.com/local/writereview?placeid=ChIJ15OdAgAr8zkRvzNUY2o324E"
                : "https://search.google.com/local/writereview?placeid=ChIJZSX8QQBZ7TkRVKYOUyR8pTE");

              const branchName = currentBranch?.name?.replace(/ Branch/i, '') || (String(activeBranch || "").toLowerCase() === "gaya" ? "Gaya" : "Patna");

              const reviewMsg = `⭐ *How was your experience today?*

Hi ${finalCustomerName}, we'd love your feedback! Please take a quick moment to review our ${branchName} store on Google:

👉 ${branchReviewUrl}

Thank you for supporting Aesthetx Ways! ❤️`;

              setTimeout(() => {
                fetch('/api/whatsapp', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phone: cleanPhone,
                    message: reviewMsg,
                    clientId: targetClientId,
                  }),
                }).catch((rErr) => console.error('Failed to send review WhatsApp message:', rErr));
              }, 1500);
            })
            .catch((err) => console.error('Failed to send POS bill WhatsApp message:', err));
        } catch (waErr) {
          console.error('WhatsApp dispatch error:', waErr);
        }
      }

      // Automatically download PDF and trigger thermal print without opening modal popup
      triggerAutoPrintAndDownload(savedBillNumber);

      // Reset Form State for next customer
      setEditingBill(null);
      setCart([]);
      setCustomerInfo({ name: "", phone: "", email: "" });
      setPaymentMethod("cash");
      setPaymentType("Cash");
      setReferenceNo("");
      setDescriptionText("");
      setTermsText("");
      setSplitPayment({ cash: "", online: "", lastEdited: "cash" });
      setBillNumber(String(Math.floor(100000 + Math.random() * 900000)));
      setManualRoundOff(null);
      setManualTotal(null);
      setRoundOffActive(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process bill: " + (err.message || "Server Error"), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test Print Helper
  const handleTestPrint = () => {
    executeMagnetRestroPrint({
      billNumber: "SAMPLE-" + Math.floor(1000 + Math.random() * 9000),
      customerName: "Walk-in Guest",
      customerPhone: "9876543210",
      items: [
        { name: "Aesthetx Oversized Tee", quantity: 1, price: 1299, size: "L" },
        { name: "Cargo Pants Black", quantity: 1, price: 2499, size: "32" },
      ],
      subtotal: 3798,
      discount: 10,
      discountAmount: 379.8,
      discountType: "percentage",
      cgst: 85.45,
      sgst: 85.45,
      tax: 170.9,
      total: 3589,
      roundOff: -0.1,
      paymentMethod: "upi",
      createdBy: activeCashier?.name || "Cashier 01",
      createdAt: new Date().toISOString(),
      storeName: storeSettings?.storeName,
      storeAddress: storeSettings?.storeAddress,
      storePhone: storeSettings?.phone,
    });
  };

  return (
    <div
      className="w-full flex-1 flex flex-col text-[#111111] font-helvetica bg-white min-h-screen"
      style={{ fontFamily: "'Helvetica Now Text', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* TOP CONTROLS WRAPPER (Same header as Orders) */}
      <div className="px-4 md:px-5 xl:px-6 pt-6 pb-4">
        {/* TOP HEADER ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Title, Status Badge & Branch Switcher */}
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#111111] tracking-tight">
              Billing Desk
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-medium text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>

            {/* Branch Switcher: Patna / Gaya */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-200/80 border border-neutral-300/80 shadow-2xs select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveBranch("patna");
                  if (typeof window !== "undefined") localStorage.setItem("pos_branch", "patna");
                  toast.success("Active Store: Patna Branch");
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${activeBranch === "patna"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-neutral-600 hover:text-black"
                  }`}
              >
                Patna
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveBranch("gaya");
                  if (typeof window !== "undefined") localStorage.setItem("pos_branch", "gaya");
                  toast.success("Active Store: Gaya Branch");
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${activeBranch === "gaya"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-neutral-600 hover:text-black"
                  }`}
              >
                Gaya
              </button>
            </div>
          </div>

          {/* Center: Search Group */}
          <div className="flex-1 max-w-[500px]">
            <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs focus-within:border-[#111111] transition-all">
              <div className="flex items-center gap-2 px-3 flex-1">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    topSectionView === "catalog"
                      ? "Search by Item Name, Category..."
                      : "Search by Order ID, Customer, Phone, Item..."
                  }
                  className="w-full py-2 text-[13px] outline-none text-[#111111] placeholder:text-neutral-400 bg-transparent"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-2 text-neutral-400 hover:text-black text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right: Section View Switcher (Items Catalog vs Billing History) - Glass Tabs with Bottom Sliding Indicator */}
          <div className="relative flex items-center p-1 rounded-xl bg-neutral-200/60 backdrop-blur-md border border-neutral-300/80 shadow-2xs shrink-0 select-none">
            <button
              type="button"
              onClick={() => setTopSectionView("catalog")}
              className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer select-none ${topSectionView === "catalog"
                  ? "text-[#111111]"
                  : "text-neutral-500 hover:text-neutral-900"
                }`}
            >
              {topSectionView === "catalog" && (
                <motion.div
                  layoutId="activeCatalogHistoryTab"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-white/95 rounded-lg shadow-xs border border-black/5 -z-10 flex flex-col justify-end overflow-hidden"
                >
                  <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
                  <div className="w-full h-[2.5px] bg-[#111111] rounded-full" />
                </motion.div>
              )}
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Catalog</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${topSectionView === "catalog"
                    ? "bg-neutral-100 text-neutral-900 border border-neutral-200"
                    : "bg-neutral-200/70 text-neutral-500"
                  }`}
              >
                {allItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTopSectionView("history")}
              className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer select-none ${topSectionView === "history"
                  ? "text-[#111111]"
                  : "text-neutral-500 hover:text-neutral-900"
                }`}
            >
              {topSectionView === "history" && (
                <motion.div
                  layoutId="activeCatalogHistoryTab"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-white/95 rounded-lg shadow-xs border border-black/5 -z-10 flex flex-col justify-end overflow-hidden"
                >
                  <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
                  <div className="w-full h-[2.5px] bg-[#111111] rounded-full" />
                </motion.div>
              )}
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>History</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${topSectionView === "history"
                    ? "bg-neutral-100 text-neutral-900 border border-neutral-200"
                    : "bg-neutral-200/70 text-neutral-500"
                  }`}
              >
                {billsHistory.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Edge-to-Edge Scrollable Table Section */}
      <section
        className={`w-full overflow-y-auto overflow-x-auto border-t  border-neutral-300 relative ${topSectionView === "history" ? "flex-1 min-h-[72vh]" : "max-h-[30vh]"
          }`}
      >
        {topSectionView === "catalog" ? (
          <table className="w-full border-collapse border border-neutral-300 rounded-none text-sm">
            <thead className="sticky top-0 z-10 bg-[#e8f1f5] shadow-xs">
              <tr className="bg-[#e8f1f5] text-neutral-900 font-bold">
                <th className="border border-neutral-300 py-3.5 px-5 text-left font-bold tracking-tight">
                  Item Name
                </th>
                <th className="border border-neutral-300 py-3.5 px-5 text-center font-bold tracking-tight w-52">
                  Category
                </th>
                <th className="border border-neutral-300 py-3.5 px-5 pr-10 text-right font-bold tracking-tight w-44">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="border border-neutral-300 py-12 text-center text-neutral-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const patternMod = idx % 2;
                  const rowBg = patternMod === 0 ? "bg-white" : "bg-neutral-100";

                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => handleAddItemToCart(item)}
                      className={`${rowBg} hover:bg-neutral-200/80 transition-colors cursor-pointer select-none group`}
                      title="Click to add to billing cart"
                    >
                      <td className="border border-neutral-300 py-4 px-5 text-neutral-900 font-medium text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[14.5px] text-[#111111]">{item.name}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[11px] font-bold text-neutral-700 bg-neutral-200/90 border border-neutral-300 px-2 py-0.5 rounded shadow-2xs transition-opacity">
                            + Add
                          </span>
                        </div>
                      </td>
                      <td className="border border-neutral-300 py-4 px-5 text-neutral-700 text-center whitespace-nowrap text-sm font-medium">
                        {item.category}
                      </td>
                      <td className="border border-neutral-300 py-4 px-5 pr-10 text-neutral-950 font-bold text-right text-[15px]">
                        ₹{item.price.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse border border-neutral-300 rounded-none text-sm">
            <thead className="sticky top-0 z-10 bg-[#e8f1f5] shadow-xs">
              <tr className="bg-[#e8f1f5] text-neutral-900 font-bold">
                <th className="border border-neutral-300 py-3.5 px-5 text-left font-bold tracking-tight w-36">
                  Order ID
                </th>
                <th className="border border-neutral-300 py-3.5 px-5 text-left font-bold tracking-tight w-44">
                  Date & Time
                </th>
                <th className="border border-neutral-300 py-3.5 px-5 text-left font-bold tracking-tight w-48">
                  Customer Name
                </th>
                <th className="border border-neutral-300 py-3.5 px-5 text-left font-bold tracking-tight">
                  Items & All
                </th>
                <th className="border border-neutral-300 py-3.5 px-5 text-right font-bold tracking-tight w-36">
                  Price
                </th>
                <th className="border border-neutral-300 py-3.5 px-4 text-center font-bold tracking-tight w-32">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-neutral-300 py-12 text-center text-neutral-400">
                    No billing history records found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill, idx) => {
                  const patternMod = idx % 2;
                  const isEdited = Boolean(bill.isEdited || bill.updatedAt);
                  const isCurrent = editingBill?.billNumber === bill.billNumber;

                  const rowBg = isCurrent
                    ? "bg-amber-200/90 ring-2 ring-amber-500"
                    : isEdited
                      ? "bg-yellow-100/90 hover:bg-yellow-200/90"
                      : patternMod === 0
                        ? "bg-white hover:bg-neutral-200/80"
                        : "bg-neutral-100 hover:bg-neutral-200/80";

                  return (
                    <tr
                      key={bill._id || bill.billNumber || idx}
                      className={`${rowBg} transition-colors select-none group`}
                    >
                      <td className="border border-neutral-300 py-3.5 px-5 text-left align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded  ${isEdited
                                ? " text-yellow-950 "
                                : " text-neutral-900 "
                              }`}
                          >
                            #{bill.billNumber}
                          </span>

                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 text-neutral-600 ">
                            {bill.branch ? bill.branch.toUpperCase() : "PATNA"}
                          </span>
                        </div>
                      </td>
                      <td className="border border-neutral-300 py-3.5 px-5 text-left text-xs text-neutral-700 whitespace-nowrap font-medium align-top">
                        <div>{formatDateTime(bill.createdAt)}</div>
                        {isEdited && bill.updatedAt && (
                          <div className="text-[10px] text-amber-800 font-mono mt-0.5">
                            Rev: {formatDateTime(bill.updatedAt)}
                          </div>
                        )}
                      </td>
                      <td className="border border-neutral-300 py-3.5 px-5 text-left align-top">
                        <div className="text-xs font-semibold text-neutral-900 capitalize">
                          {bill.customerName || "Walk-in Guest"}
                        </div>
                        {bill.customerPhone && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {bill.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="border border-neutral-300 py-2.5 px-5 text-left align-top">
                        {bill.items && bill.items.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {bill.items.map((it, iIdx) => {
                              const title = it.productName || it.name || "Item";
                              const hasSize = it.size && it.size !== "Standard";
                              const qty = Number(it.quantity) || 1;
                              return (
                                <div key={iIdx} className="text-xs text-neutral-900 leading-snug">
                                  {title}
                                  {hasSize && ` (${it.size})`}
                                  {qty > 1 && ` x${qty}`}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-xs">No items listed</span>
                        )}
                      </td>
                      <td className="border border-neutral-300 py-3.5 px-5 text-right font-bold text-neutral-950 text-sm whitespace-nowrap align-top">
                        ₹{Number(bill.total || 0).toFixed(2)}
                      </td>
                      <td className="border border-neutral-300 py-3.5 px-4 text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadBillIntoEditor(bill);
                            }}
                            className="p-1.5 rounded hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors cursor-pointer"
                            title="Edit Bill in POS Counter"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              executeMagnetRestroPrint(bill);
                            }}
                            className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                            title="Print 80mm Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <a
                            href={bill.pdfUrl || `/api/pos/bills/${bill.billNumber}/pdf?download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`Bill-${bill.billNumber}.pdf`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                            title="Download PDF Receipt"
                          >
                            <FileDown className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handlePromptDeleteBill(bill, e)}
                            className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete bill (Admin password required)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* LOWER SECTION: MAIN BILLING SPREADSHEET CONTROLS (Only visible in Catalog / Billing view) */}
      {topSectionView === "catalog" && (
        <section id="billing-cart-section" className="w-full border-t-2 border-neutral-300 bg-white p-4 md:p-5 flex flex-col gap-4 scroll-mt-4">
          {/* Editing Bill Notice Banner */}
          {editingBill && (
            <div className="bg-white/50 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-neutral-900">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold tracking-tight">
                  EDITING INVOICE #{editingBill.billNumber}
                </span>
                <span className="text-amber-800">
                  — {editingBill.customerName || "Walk-in Guest"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleExitEditMode}
                className="px-2.5 py-1 rounded bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
              >
                Exit
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight uppercase text-neutral-700 flex items-center gap-1.5">
                <span>Active -  Cart</span>
                <motion.span
                  key={cart.length}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-neutral-500 font-medium normal-case"
                >

                </motion.span>
              </h2>

            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-neutral-400 hover:text-red-500 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>

          {/* 2-Tier Header Spreadsheet Table Matching Reference Design */}
          <div className="w-full overflow-x-auto lg:overflow-visible border border-neutral-300 bg-white relative z-30 ">
            <table className="w-full border-collapse text-xs relative z-30">
              <thead>
                {/* Row 1 Header */}
                <tr className="bg-[#f8fafc] text-neutral-700 text-center font-semibold border-b border-neutral-300">
                  <th rowSpan={2} className="border-r border-neutral-300 px-2.5 py-2 w-10 text-center">
                    <div className="flex items-center justify-center text-neutral-500">
                      <Scan className="w-4 h-4" />
                    </div>
                  </th>
                  <th rowSpan={2} className="border-r border-neutral-300 px-3 py-2 text-left min-w-[200px] font-semibold tracking-wider">
                    ITEM
                  </th>
                  <th rowSpan={2} className="border-r border-neutral-300 px-2 py-2 w-16 text-center font-semibold tracking-wider">
                    QTY
                  </th>
                  <th rowSpan={2} className="border-r border-neutral-300 px-2 py-2 w-24 text-center font-semibold tracking-wider">
                    UNIT
                  </th>
                  <th className="border-r border-neutral-300 px-2 py-1 text-center font-semibold tracking-wider w-32">
                    PRICE/UNIT
                  </th>
                  <th colSpan={2} className="border-r border-neutral-300 px-2 py-1 text-center font-semibold tracking-wider">
                    DISCOUNT
                  </th>
                  <th colSpan={2} className="border-r border-neutral-300 px-2 py-1 text-center font-semibold tracking-wider">
                    TAX
                  </th>
                  <th rowSpan={2} className="border-r border-neutral-300 px-3 py-2 text-right font-semibold tracking-wider w-28">
                    <div className="flex items-center justify-between gap-1">
                      <span>AMOUNT</span>
                      <button
                        type="button"
                        onClick={handleAddEmptyRow}
                        className="w-4 h-4 rounded-full border border-neutral-400 text-neutral-600 hover:border-black hover:text-black flex items-center justify-center text-xs cursor-pointer"
                        title="Add Row"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                  <th rowSpan={2} className="px-2 py-2 w-8 text-center text-neutral-400"></th>
                </tr>

                {/* Row 2 Sub-Header */}
                <tr className="bg-[#f8fafc] text-neutral-600 text-[11px] font-medium border-b border-neutral-300">
                  {/* Under PRICE/UNIT */}
                  <th className="border-r border-neutral-300 px-2 py-1 text-center font-normal">
                    <span className="inline-flex items-center gap-1 text-[11px] text-neutral-600 cursor-pointer">
                      With Tax <ChevronDown className="w-3 h-3" />
                    </span>
                  </th>
                  {/* Under DISCOUNT */}
                  <th className="border-r border-neutral-300 px-2 py-1 text-center w-20 font-normal">
                    %
                  </th>
                  <th className="border-r border-neutral-300 px-2 py-1 text-center w-24 font-normal">
                    AMOUNT
                  </th>
                  {/* Under TAX */}
                  <th className="border-r border-neutral-300 px-2 py-1 text-center w-24 font-normal">
                    %
                  </th>
                  <th className="border-r border-neutral-300 px-2 py-1 text-center w-24 font-normal">
                    AMOUNT
                  </th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence initial={false}>
                  {cart.length === 0 ? (
                    <motion.tr
                      key="empty-cart-row"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-neutral-300 h-[37px]"
                    >
                      <td colSpan={11} className="py-1.5 px-3 text-center text-neutral-400 text-xs font-normal">
                        Your cart is empty. Click any item above
                      </td>
                    </motion.tr>
                  ) : (
                    cart.map((row, idx) => {
                      const isDropdownActive = activeDropdownRowId === row.id;
                      return (
                        <motion.tr
                          key={row.id}
                          layout
                          initial={{ opacity: 0, y: -12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.15 } }}
                          transition={{
                            layout: { type: "spring", stiffness: 480, damping: 32 },
                            opacity: { duration: 0.18 },
                            y: { duration: 0.18 },
                          }}
                          style={{ zIndex: isDropdownActive ? 9999 : 1 }}
                          className={`hover:bg-neutral-50/70 transition-colors border-b border-neutral-300 ${isDropdownActive ? "relative z-[9999]" : "relative z-0"
                            }`}
                        >
                          {/* Index */}
                          <td className="border-r border-neutral-300 px-2 py-2 text-center text-neutral-500 font-medium">
                            {idx + 1}
                          </td>

                          {/* Item Name with Clean Auto-suggest Dropdown */}
                          <td
                            style={{ zIndex: isDropdownActive ? 99999 : 1 }}
                            className={`autocomplete-cell border-r border-neutral-300 px-3 py-1.5 ${isDropdownActive ? "relative z-[99999]" : "relative z-0"
                              }`}
                          >
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleUpdateRow(row.id, "name", e.target.value)}
                              onFocus={() => {
                                if (row.name?.trim().length >= 1) {
                                  setActiveDropdownRowId(row.id);
                                }
                              }}
                              placeholder="Item name"
                              className="w-full bg-transparent outline-none font-medium text-neutral-900"
                            />

                            {/* Auto-suggest Item Catalog Dropdown */}
                            {isDropdownActive && row.name?.trim().length >= 1 && (
                              <div
                                style={{ zIndex: 999999 }}
                                className="absolute top-full left-0 mt-1 z-[999999] w-[400px] bg-white border border-neutral-300 ] ring-1 ring-black/10 overflow-hidden"
                                onMouseDown={(e) => e.preventDefault()}
                              >


                                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                                  {(() => {
                                    const q = row.name.trim().toLowerCase();
                                    const matches = allItems.filter(
                                      (it) =>
                                        it.name.toLowerCase().includes(q) ||
                                        (it.category && it.category.toLowerCase().includes(q)) ||
                                        (it.itemId && it.itemId.toLowerCase().includes(q))
                                    );

                                    if (matches.length === 0) {
                                      return (
                                        <div className="p-4 text-center text-xs text-neutral-400">
                                          No items matching "{row.name}" found in catalog.
                                        </div>
                                      );
                                    }

                                    return matches.map((item) => (
                                      <div
                                        key={item.id}
                                        onClick={() => handleSelectItemForCartRow(row.id, item)}
                                        className="px-3 py-2.5 hover:bg-neutral-100 transition-colors cursor-pointer flex items-center justify-between group text-left"
                                      >
                                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                          <span className="text-xs font-semibold text-neutral-900 group-hover:text-black truncate">
                                            {item.name}
                                          </span>

                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-xs font-bold text-neutral-950">
                                            ₹{item.price.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-right">
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) => handleUpdateRow(row.id, "quantity", e.target.value)}
                              className="w-full bg-transparent outline-none text-right font-medium text-neutral-900"
                            />
                          </td>

                          {/* Unit */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-center">
                            <select
                              value={row.unit || "NONE"}
                              onChange={(e) => handleUpdateRow(row.id, "unit", e.target.value)}
                              className="bg-transparent text-neutral-700 outline-none cursor-pointer text-xs"
                            >
                              <option value="NONE">NONE</option>
                              <option value="PCS">PCS</option>
                              <option value="KG">KG</option>
                              <option value="BOX">BOX</option>
                              <option value="MTR">MTR</option>
                            </select>
                          </td>

                          {/* Price / Unit */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={row.price}
                              onChange={(e) => handleUpdateRow(row.id, "price", e.target.value)}
                              className="w-full bg-transparent outline-none text-right font-medium text-neutral-900"
                            />
                          </td>

                          {/* Discount % */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={row.discountPercent > 0 ? row.discountPercent : ""}
                              onChange={(e) => handleUpdateRow(row.id, "discountPercent", e.target.value)}
                              placeholder=""
                              className="w-full bg-transparent outline-none text-right text-neutral-700"
                            />
                          </td>

                          {/* Discount Amount */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={row.discountAmount > 0 ? row.discountAmount : ""}
                              onChange={(e) => handleUpdateRow(row.id, "discountAmount", e.target.value)}
                              placeholder=""
                              className="w-full bg-transparent outline-none text-right text-neutral-800 font-medium"
                            />
                          </td>

                          {/* Tax % Dropdown */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-center">
                            <select
                              value={row.taxPercent || 0}
                              onChange={(e) => handleUpdateRow(row.id, "taxPercent", Number(e.target.value))}
                              className="bg-transparent text-neutral-700 outline-none cursor-pointer text-xs"
                            >
                              <option value={0}>NONE</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </td>

                          {/* Tax Amount */}
                          <td className="border-r border-neutral-300 px-2 py-1.5 text-right text-neutral-700 font-medium">
                            {row.taxAmount > 0 ? row.taxAmount.toFixed(2) : ""}
                          </td>

                          {/* Line Amount */}
                          <td className="border-r border-neutral-300 px-3 py-1.5 text-right font-semibold text-neutral-900">
                            {Number(row.amount || 0).toFixed(2)}
                          </td>

                          {/* Delete Action */}
                          <td className="px-1.5 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title="Remove row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>

              {/* Footer Row (Matches reference design) */}
              <tfoot>
                <motion.tr
                  layout
                  transition={{ type: "spring", stiffness: 480, damping: 32 }}
                  className="bg-[#f8fafc] border-t border-neutral-300 font-semibold text-neutral-900"
                >
                  <td colSpan={2} className="border-r border-neutral-300 p-2.5">
                    <button
                      type="button"
                      onClick={handleAddEmptyRow}
                      className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-200 text-gray-600 text-xs font-semibold tracking-wider shadow-2xs transition-colors uppercase cursor-pointer"
                    >
                      ADD ROW
                    </button>
                  </td>
                  <td className="border-r border-neutral-300 px-2 py-2 text-right font-bold">
                    <motion.span
                      key={totals.totalQty}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block"
                    >
                      {totals.totalQty}
                    </motion.span>
                  </td>
                  <td className="border-r border-neutral-300 px-2 py-2 text-center text-neutral-500 font-medium text-xs">
                    TOTAL
                  </td>
                  <td className="border-r border-neutral-300 px-2 py-2 text-right text-neutral-700 font-medium"></td>
                  <td className="border-r border-neutral-300 px-2 py-2"></td>
                  <td className="border-r border-neutral-300 px-2 py-2 text-right font-bold text-neutral-900">
                    {totals.totalDiscount > 0 ? totals.totalDiscount.toFixed(2) : "0"}
                  </td>
                  <td className="border-r border-neutral-300 px-2 py-2"></td>
                  <td className="border-r border-neutral-300 px-2 py-2 text-right font-bold text-neutral-900">
                    {totals.totalTax > 0 ? totals.totalTax.toFixed(2) : "0"}
                  </td>
                  <td className="border-r border-neutral-300 px-3 py-2 text-right font-bold text-base text-neutral-950">
                    <motion.span
                      key={totals.grandTotal}
                      initial={{ opacity: 0.4, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block"
                    >
                      {totals.grandTotal.toFixed(2)}
                    </motion.span>
                  </td>
                  <td></td>
                </motion.tr>
              </tfoot>
            </table>
          </div>

          {/* INVOICE CONTROLS SECTION (Matching reference design) */}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 480, damping: 32 }}
            className="w-full bg-[#f1f5f9] border border-neutral-300 rounded p-4 flex flex-col gap-4"
          >
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              {/* Left: Terms & Conditions Card */}
              <div className="bg-white border border-neutral-300 rounded p-3.5 w-full lg:w-[280px] shrink-0 shadow-2xs">
                <h3 className="text-xs font-bold text-neutral-800 mb-2.5">
                  Terms & Conditions
                </h3>

                {/* Title Field */}
                <div className="relative border border-neutral-300 rounded px-2.5 pt-2 pb-1 bg-white mb-2.5 focus-within:border-blue-500">
                  <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-neutral-500 font-medium">
                    Title
                  </span>
                  <div className="flex items-center justify-between">
                    <select
                      value={termsTitle}
                      onChange={(e) => setTermsTitle(e.target.value)}
                      className="w-full text-xs text-neutral-800 bg-transparent outline-none cursor-pointer pr-1"
                    >
                      <option value="Sale Invoice">Sale Invoice</option>
                      <option value="Estimate / Quotation">Estimate / Quotation</option>
                      <option value="Delivery Challan">Delivery Challan</option>
                      <option value="Credit Note">Credit Note</option>
                    </select>
                  </div>
                </div>

                {/* Terms Textarea */}
                <textarea
                  rows={2}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  placeholder="Terms & Conditions..."
                  className="w-full border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 bg-white outline-none resize-none focus:border-blue-500 font-normal leading-relaxed"
                />
              </div>

              {/* Middle: Payment Type, Copies, Reference, Description, Image */}
              <div className="flex-1 flex flex-col gap-2.5 min-w-[280px]">
                {/* Row 1: Payment Method / Type & Cash + Online Two-Way Reflection */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Payment Method / Type Dropdown */}
                  <div className="relative border border-neutral-300 rounded px-2.5 pt-2 pb-1 bg-white min-w-[150px] focus-within:border-blue-500">
                    <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-neutral-500 font-medium">
                      Payment Type
                    </span>
                    <select
                      value={paymentType}
                      onChange={(e) => handlePaymentTypeSelect(e.target.value)}
                      className="w-full text-xs text-neutral-800 bg-transparent outline-none cursor-pointer pr-1"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Split">Split</option>
                      <option value="Bank Card">Bank Card</option>
                      <option value="prince kumar">prince kumar</option>
                    </select>
                  </div>

                  {/* Cash Field */}
                  <div className="relative border border-neutral-300 rounded px-2.5 pt-2 pb-1 bg-white w-28 focus-within:border-blue-500">
                    <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-neutral-500 font-medium">
                      Cash
                    </span>
                    <div className="flex items-center">
                      <span className="text-xs text-neutral-400 mr-1 font-medium">₹</span>
                      <input
                        type="number"
                        step="any"
                        value={splitPayment.cash}
                        onChange={(e) => handleCashChange(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-semibold text-neutral-900 bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Online Field */}
                  <div className="relative border border-neutral-300 rounded px-2.5 pt-2 pb-1 bg-white w-28 focus-within:border-blue-500">
                    <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-neutral-500 font-medium">
                      Online
                    </span>
                    <div className="flex items-center">
                      <span className="text-xs text-neutral-400 mr-1 font-medium">₹</span>
                      <input
                        type="number"
                        step="any"
                        value={splitPayment.online}
                        onChange={(e) => handleOnlineChange(e.target.value)}
                        placeholder="0"
                        className="w-full text-xs font-semibold text-neutral-900 bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Online QR Code Badge */}
                  {onlineNum > 0 && upiQrUrl && (
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-gray-300 bg-gray-50/90 hover:bg-gray-100 text-gray-700 text-xs font-semibold tracking-wide transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Click to view full UPI QR payment code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pay QR: ₹{onlineNum.toFixed(2)}</span>
                    </button>
                  )}
                </div>

                {/* Row 2: Reference No. & Quick Customer details */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Reference No."
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-40 border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 bg-white outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-36 border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 bg-white outline-none focus:border-blue-500 font-medium"
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit Phone *"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-32 border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 bg-white outline-none focus:border-blue-500 font-medium"
                  />
                  <input
                    type="email"
                    placeholder="Email (Optional)"
                    value={customerInfo.email || ""}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-44 border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 bg-white outline-none focus:border-blue-500 font-medium"
                  />
                </div>



                {/* Row 4: Action Buttons */}
                <div className="flex flex-col gap-2 pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowDescriptionInput((prev) => !prev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-semibold tracking-wider uppercase shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      <span>ADD DESCRIPTION</span>
                    </button>

                    <label className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-semibold tracking-wider uppercase shadow-2xs transition-colors cursor-pointer">
                      <Camera className="w-3.5 h-3.5 text-neutral-500" />
                      <span>ADD IMAGE</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            toast.success(`Attached image: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {showDescriptionInput && (
                    <textarea
                      rows={2}
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                      placeholder="Add invoice description / remarks..."
                      className="w-full max-w-[440px] border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 bg-white outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Right: Round Off & Total (Fully Editable) */}
              <div className="flex items-center gap-2.5 shrink-0 pt-1 self-start">
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={roundOffActive}
                    onChange={(e) => handleToggleRoundOff(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer accent-blue-600"
                  />
                  <span>Round Off</span>
                </label>

                <input
                  type="text"
                  value={
                    manualRoundOff !== null
                      ? manualRoundOff
                      : roundOffAmount > 0
                        ? `+${roundOffAmount.toFixed(2)}`
                        : roundOffAmount.toFixed(2)
                  }
                  onChange={(e) => handleRoundOffInputChange(e.target.value)}
                  placeholder="0.00"
                  className="w-16 border border-neutral-300 rounded px-1.5 py-1 text-xs text-center text-neutral-800 bg-white outline-none focus:border-blue-500 font-medium shadow-2xs"
                  title="Enter custom round off difference"
                />

                <span className="text-xs font-semibold text-neutral-800 ml-1">Total</span>

                <input
                  type="number"
                  step="any"
                  value={manualTotal !== null ? manualTotal : finalPayableTotal}
                  onChange={(e) => handleTotalInputChange(e.target.value)}
                  placeholder="0.00"
                  className="w-36 border border-neutral-300 rounded px-3 py-1 text-sm font-semibold text-right text-neutral-900 bg-white outline-none focus:border-blue-500 shadow-2xs"
                  title="Enter or edit final total amount"
                />
              </div>
            </div>
          </motion.div>

          {/* BOTTOM ACTION BAR */}
          <div className="w-full pt-1 flex items-center justify-end gap-2.5">
            {editingBill && (
              <button
                type="button"
                onClick={handleExitEditMode}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleProcessBillAndPrint}
              className={`px-8 py-2 rounded-lg text-xs font-bold tracking-wide shadow-sm transition-all cursor-pointer active:scale-[0.99] ${isSubmitting
                  ? "bg-neutral-400 text-white cursor-not-allowed opacity-70"
                  : editingBill
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-[#1976d2] hover:bg-blue-700 text-white"
                }`}
            >
              {isSubmitting ? "Processing..." : editingBill ? "Confirm Edit & Save Bill" : "Save"}
            </button>
          </div>
        </section>
      )}

      {/* UPI QR Code Payment Modal */}
      <AnimatePresence>
        {showQrModal && upiQrUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-neutral-200 flex flex-col items-center text-center relative"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-black p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg  flex items-center justify-center text-gray-600">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-neutral-800 tracking-tight">
                  Instant UPI Payment
                </span>
              </div>

              <div className="my-2">
                <img
                  src={upiQrUrl}
                  alt={`Scan to Pay ₹${onlineNum.toFixed(2)}`}
                  className="w-56 h-56 object-contain"
                />
                <div className=" px-3  text-[11px] font-mono text-neutral-600">
                  UPI ID: {storeSettings?.upiId || "aesthetxways07@okicici"}
                </div>
              </div>

              <div className="mt-2 text-center">
                <div className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                  ₹{onlineNum.toFixed(2)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="mt-4 w-full py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Done / Received
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Password Authorization Modal */}
      <AnimatePresence>
        {authModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-neutral-200 relative"
            >


              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                {authModal.description}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirmAuth();
                }}
                className="flex flex-col gap-3"
              >
                <div>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter admin password"
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-xs outline-none transition-all ${authError ? "border-red-500 bg-red-50/30" : "border-neutral-300 focus:border-neutral-900"
                      }`}
                  />
                  {authError && (
                    <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{authError}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModal({ isOpen: false, title: "", description: "", billNumber: "", actionType: "", payload: null });
                      setAuthPassword("");
                      setAuthError("");
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm Authorization
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 80mm POS Thermal Receipt Preview & Print Modal (@react-pdf/renderer) */}
      <ThermalBillModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        bill={pdfPreviewBill}
      />
    </div>
  );
}
