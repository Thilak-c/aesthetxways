"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { BarcodeInput } from "@/components/Barcode";
import QRCode from "qrcode";
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
  MessageCircle,
  Sparkles,
  Zap,
  RefreshCw,
  Lock,
  Shield,
  UserCheck2,
  ChevronDown,
  Users,
  UserPlus,
  Key,
  Check,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  ChevronUp,
  LogOut,
  Unlock,
  Settings,
  Sliders,
  FileCheck,
  Save,
  MapPin,
  MoreVertical,
  FileText as ReceiptIcon
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppRecoveryModal from "@/components/WhatsAppRecoveryModal";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "XXXL"];
const DEFAULT_CASHIERS = [
  { id: "usr-1", name: "Thilak", username: "ADMIN-01", pin: "1234", role: "admin", status: "active" },
  { id: "usr-2", name: "Prince", username: "MANAGER-01", pin: "7033769997", role: "admin", status: "active" },
  { id: "usr-3", name: "Rahul Kumar", username: "CASHIER-01", pin: "0000", role: "user", status: "active" },
  { id: "usr-4", name: "Anish Gupta", username: "CASHIER-02", pin: "1111", role: "user", status: "active" }
];

const STORE_BRANCHES = {
  patna: {
    id: "patna",
    name: "Patna Branch",
    storeName: "AESTHETX WAYS (PATNA)",
    storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "8008439762@ptsbi"
  },
  gaya: {
    id: "gaya",
    name: "Gaya Branch",
    storeName: "AESTHETX WAYS (GAYA)",
    storeAddress: "Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "8008439762@ptsbi"
  }
};

const DEFAULT_STORE_SETTINGS = {
  storeName: "AESTHETX WAYS (PATNA)",
  logoText: "AESTHETX WAYS",
  storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
  gstin: "10AAACA0000A1Z5",
  phone: "+91 70337 69997",
  upiId: "8008439762@ptsbi",
  thankYouMessage: "Thank you for shopping with us..!!",
  websiteUrl: "aesthetxways.com"
};

export default function NewBillingPage() {
  // Authentication & System State
  const [isInsysAuth, setIsInsysAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Store Branch Selection State & Multi-Location Management
  const [branches, setBranches] = useState(STORE_BRANCHES);
  const [activeBranch, setActiveBranch] = useState("patna");
  const [editingBranchId, setEditingBranchId] = useState("patna");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({
    name: "",
    storeName: "",
    storeAddress: "",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "8008439762@ptsbi"
  });

  // Registered Cashier & Staff Users
  const [registeredUsers, setRegisteredUsers] = useState(DEFAULT_CASHIERS);
  const [activeCashier, setActiveCashier] = useState(DEFAULT_CASHIERS[0]);
  const [showUserModal, setShowUserModal] = useState(false);

  // Store Billing & Thermal Receipt Settings State
  const [storeSettings, setStoreSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState("");

  // Generate live thermal receipt QR code for Settings modal preview based on currently editing location
  useEffect(() => {
    if (!showSettingsModal) return;
    const targetBranch = branches[editingBranchId] || branches.patna || DEFAULT_STORE_SETTINGS;
    const activeUpiId = targetBranch.upiId || storeSettings?.upiId || "8008439762@ptsbi";
    const storeTitle = targetBranch.storeName || storeSettings?.storeName || "Aesthetx Ways";
    const upiPayload = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(storeTitle)}&am=1978.20&cu=INR&tn=Sample%20Bill`;

    QRCode.toDataURL(upiPayload, {
      margin: 1,
      width: 160,
      errorCorrectionLevel: "H",
    })
      .then((url) => setPreviewQrDataUrl(url))
      .catch((err) => console.error("Error generating preview QR", err));
  }, [showSettingsModal, editingBranchId, branches, storeSettings?.upiId, storeSettings?.storeName]);

  // Header More Options Dropdown State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Close three dots more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  // PIN Lock & Authentication State
  const [selectedUserForPin, setSelectedUserForPin] = useState(DEFAULT_CASHIERS[0]);
  const [enteredPin, setEnteredPin] = useState("");
  const [showPinCode, setShowPinCode] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Role-Based Access Control State ("admin" vs "user")
  const [userRole, setUserRole] = useState("admin"); // "admin" (everything) or "user" (billing only)

  // Hover / Click Expand Product State
  const [expandedProductId, setExpandedProductId] = useState(null);

  // New Cashier Form State (Name, Role, PIN only)
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    pin: "",
    role: "user"
  });

  // Create new Cashier User handler
  const handleCreateNewUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim()) {
      toast.error("Please enter Full Name");
      return;
    }
    if (!newUserForm.pin.trim()) {
      toast.error("Please enter 4-digit PIN code");
      return;
    }

    const autoUsername = "STAFF-" + String(registeredUsers.length + 1).padStart(2, "0");

    const newUser = {
      id: "usr-" + Date.now(),
      name: newUserForm.name.trim(),
      username: autoUsername,
      pin: newUserForm.pin.trim(),
      role: newUserForm.role,
      status: "active"
    };

    const updated = [...registeredUsers, newUser];
    saveUsersToStorage(updated);
    setNewUserForm({ name: "", pin: "", role: "user" });
    toast.success(`Created Account: ${newUser.name} (PIN: ${newUser.pin})`);
  };

  // Save Store Billing Settings Handler
  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("pos_store_settings", JSON.stringify(storeSettings));
    toast.success("Saved Store Billing & Thermal Receipt Settings!");
  };

  // POS Layout & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });
  const [billNumber, setBillNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [splitPayment, setSplitPayment] = useState({ cash: "", online: "", lastEdited: "cash" });
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" | "flat"
  const [flatDiscount, setFlatDiscount] = useState(0);
  const [recoveryModalData, setRecoveryModalData] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // Navigation Tabs & Billing History States
  const [activeTab, setActiveTab] = useState("billing"); // "billing" | "history" | "billing_products" | "settings"
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // Quick Billing Product Form & Edit State (Asking Name & Price only)
  const [newBillingProductForm, setNewBillingProductForm] = useState({ name: "", price: "" });
  const [editingBillingProduct, setEditingBillingProduct] = useState(null);
  const [isSubmittingBillingProduct, setIsSubmittingBillingProduct] = useState(false);
  const [billingProductSearchQuery, setBillingProductSearchQuery] = useState("");

  // Load valid credentials from environment or defaults
  const VALID_CREDENTIALS = (() => {
    try {
      const envCreds = process.env.NEXT_PUBLIC_VALID_CREDENTIALS;
      if (envCreds) return JSON.parse(envCreds);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_VALID_CREDENTIALS:", e);
    }
    return [
      { adminId: "Aesthetx Ways", password: "aesthetx123" },
      { adminId: "Thilak", password: "8008439762" },
      { adminId: "Prince", password: "7033769997" }
    ];
  })();

  // Auth & Saved Role / Users / Store Settings verification
  useEffect(() => {
    // Always require PIN whenever billing desk opens or reloads (do not auto-authenticate from admin panel)
    setIsInsysAuth(false);

    const savedRole = localStorage.getItem("pos_user_role");
    if (savedRole === "user" || savedRole === "admin") {
      setUserRole(savedRole);
    }

    const savedUsers = localStorage.getItem("pos_registered_users");
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((u) => {
            if (u.name === "Admin Terminal") return DEFAULT_CASHIERS[0];
            return u;
          });
          setRegisteredUsers(cleaned);
          setActiveCashier(cleaned[0]);
          setSelectedUserForPin(cleaned[0]);
          localStorage.setItem("pos_registered_users", JSON.stringify(cleaned));
        }
      } catch (e) {
        console.error("Failed to parse saved cashier users", e);
      }
    } else {
      localStorage.setItem("pos_registered_users", JSON.stringify(DEFAULT_CASHIERS));
    }

    const savedBranches = localStorage.getItem("pos_branches");
    let currentBranches = STORE_BRANCHES;
    if (savedBranches) {
      try {
        const parsed = JSON.parse(savedBranches);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          currentBranches = { ...STORE_BRANCHES, ...parsed };
          setBranches(currentBranches);
        }
      } catch (e) {
        console.error("Failed to parse saved branches", e);
      }
    }

    const savedBranch = localStorage.getItem("pos_active_branch");
    const initialBranchKey = (savedBranch && currentBranches[savedBranch]) ? savedBranch : "patna";
    setActiveBranch(initialBranchKey);
    setEditingBranchId(initialBranchKey);
    const branchInfo = currentBranches[initialBranchKey] || currentBranches.patna;

    const savedStoreSettings = localStorage.getItem("pos_store_settings");
    if (savedStoreSettings) {
      try {
        const parsed = JSON.parse(savedStoreSettings);
        if (parsed && typeof parsed === "object") {
          const merged = { ...DEFAULT_STORE_SETTINGS, ...parsed };
          merged.storeAddress = branchInfo.storeAddress || merged.storeAddress;
          merged.storeName = branchInfo.storeName || merged.storeName;
          merged.phone = branchInfo.phone || merged.phone || "+91 70337 69997";
          merged.gstin = branchInfo.gstin || merged.gstin || "10AAACA0000A1Z5";
          merged.upiId = branchInfo.upiId || merged.upiId || "8008439762@ptsbi";
          setStoreSettings(merged);
          localStorage.setItem("pos_store_settings", JSON.stringify(merged));
        }
      } catch (e) {
        console.error("Failed to parse store settings", e);
      }
    } else {
      const initialSettings = {
        ...DEFAULT_STORE_SETTINGS,
        storeName: branchInfo.storeName,
        storeAddress: branchInfo.storeAddress,
        phone: branchInfo.phone || "+91 70337 69997",
        gstin: branchInfo.gstin || "10AAACA0000A1Z5",
        upiId: branchInfo.upiId || "8008439762@ptsbi"
      };
      setStoreSettings(initialSettings);
      localStorage.setItem("pos_store_settings", JSON.stringify(initialSettings));
    }

    // Auto-fetch saved branches and location fields from server so nothing has to be re-entered
    fetch("/api/pos-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.branches && Object.keys(data.branches).length > 0) {
          setBranches((prev) => {
            const merged = { ...STORE_BRANCHES, ...prev, ...data.branches };
            localStorage.setItem("pos_branches", JSON.stringify(merged));
            return merged;
          });
          const branchKey = data.activeBranch || initialBranchKey || "patna";
          const activeInfo = data.branches[branchKey] || data.branches.patna;
          if (activeInfo) {
            setStoreSettings((prev) => {
              const updated = {
                ...prev,
                storeName: activeInfo.storeName || prev.storeName,
                storeAddress: activeInfo.storeAddress || prev.storeAddress,
                phone: activeInfo.phone || prev.phone,
                gstin: activeInfo.gstin || prev.gstin,
                upiId: activeInfo.upiId || prev.upiId
              };
              localStorage.setItem("pos_store_settings", JSON.stringify(updated));
              return updated;
            });
          }
        }
      })
      .catch((err) => console.error("Error fetching POS settings from server", err));

    setAuthChecked(true);
  }, []);

  // Handle switching store branches (Patna, Gaya, or any added location)
  const handleBranchChange = (branchId) => {
    setActiveBranch(branchId);
    setEditingBranchId(branchId);
    localStorage.setItem("pos_active_branch", branchId);
    const branchInfo = branches[branchId] || STORE_BRANCHES.patna;
    const updatedSettings = {
      ...storeSettings,
      storeName: branchInfo.storeName,
      storeAddress: branchInfo.storeAddress,
      phone: branchInfo.phone || storeSettings.phone,
      gstin: branchInfo.gstin || storeSettings.gstin,
      upiId: branchInfo.upiId || storeSettings.upiId || "8008439762@ptsbi"
    };
    setStoreSettings(updatedSettings);
    localStorage.setItem("pos_store_settings", JSON.stringify(updatedSettings));
    saveBranchesToServer(branches, branchId);
  };

  // Update specific field for currently edited branch
  const updateBranchField = (branchId, field, value) => {
    let latestBranches;
    setBranches((prev) => {
      const current = prev[branchId] || STORE_BRANCHES[branchId] || {};
      const updated = {
        ...prev,
        [branchId]: {
          ...current,
          [field]: value
        }
      };
      latestBranches = updated;
      localStorage.setItem("pos_branches", JSON.stringify(updated));
      return updated;
    });

    if (branchId === activeBranch) {
      setStoreSettings((prev) => {
        const updated = {
          ...prev,
          [field]: value
        };
        localStorage.setItem("pos_store_settings", JSON.stringify(updated));
        return updated;
      });
    }

    // Debounced automatic server sync on any keystroke
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (latestBranches) {
        saveBranchesToServer(latestBranches, activeBranch);
      }
    }, 800);
  };

  // Add a new branch / location
  const handleAddNewLocation = (e) => {
    e.preventDefault();
    const locName = newLocationForm.name.trim();
    if (!locName) {
      toast.error("Please enter a location name (e.g. Ranchi)");
      return;
    }

    const locKey = locName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (branches[locKey]) {
      toast.error(`A location for "${locName}" already exists`);
      return;
    }

    const newBranch = {
      id: locKey,
      name: locName.endsWith("Branch") ? locName : `${locName} Branch`,
      storeName: newLocationForm.storeName.trim() || `AESTHETX WAYS (${locName.toUpperCase()})`,
      storeAddress: newLocationForm.storeAddress.trim() || `${locName}, Bihar`,
      phone: newLocationForm.phone.trim() || storeSettings.phone || "+91 70337 69997",
      gstin: newLocationForm.gstin.trim() || storeSettings.gstin || "10AAACA0000A1Z5",
      upiId: newLocationForm.upiId.trim() || storeSettings.upiId || "8008439762@ptsbi"
    };

    const updatedBranches = { ...branches, [locKey]: newBranch };
    setBranches(updatedBranches);
    localStorage.setItem("pos_branches", JSON.stringify(updatedBranches));
    setEditingBranchId(locKey);
    setShowAddLocation(false);
    setNewLocationForm({
      name: "",
      storeName: "",
      storeAddress: "",
      phone: storeSettings.phone || "+91 70337 69997",
      gstin: storeSettings.gstin || "10AAACA0000A1Z5",
      upiId: storeSettings.upiId || "8008439762@ptsbi"
    });
    saveBranchesToServer(updatedBranches, locKey);
    toast.success(`Created ${newBranch.name} in Convex database!`);
  };

  // Handle PIN Verification Submission (Just PIN!)
  const verifyPin = (pinToVerify) => {
    const trimmedPin = (pinToVerify !== undefined ? pinToVerify : enteredPin).trim();
    if (!trimmedPin) {
      toast.error("Please enter Security PIN code");
      return;
    }

    setIsVerifyingPin(true);
    setTimeout(() => {
      // Check if PIN matches an admin master PIN ("1234", "8008439762", "aesthetx123", "7033769997", "7033")
      const isAdminMasterPin = ["1234", "8008439762", "aesthetx123", "7033769997", "7033"].includes(trimmedPin);

      // Check if PIN matches any registered cashier user account
      const matchedUser = registeredUsers.find((u) => u.pin === trimmedPin);

      if (isAdminMasterPin || matchedUser) {
        const activeUser = matchedUser || registeredUsers.find((u) => u.role === "admin") || registeredUsers[0];
        const finalRole = (isAdminMasterPin || activeUser.role === "admin") ? "admin" : "user";

        setUserRole(finalRole);
        localStorage.setItem("pos_user_role", finalRole);
        setActiveCashier(activeUser);

        // Save auth to localStorage
        localStorage.setItem(
          "insys_auth",
          JSON.stringify({
            isLoggedIn: true,
            storeType: "website",
            loginTime: new Date().toISOString(),
            user: activeUser.name
          })
        );

        setIsInsysAuth(true);
        setEnteredPin("");

        if (finalRole === "admin") {
          toast.success(`Welcome ${activeUser.name}! ADMIN Mode Unlocked (Full Access)`);
        } else {
          setActiveTab("billing");
          setDiscount(0);
          toast.success(`Welcome ${activeUser.name}! CASHIER Mode Active (Generate Bills Only)`);
        }
      } else {
        toast.error("Invalid Security PIN Code");
        setEnteredPin("");
      }
      setIsVerifyingPin(false);
    }, 300);
  };

  const handleVerifyPinSubmit = (e) => {
    if (e) e.preventDefault();
    verifyPin(enteredPin);
  };

  // Lock Terminal Handler
  const handleLockTerminal = () => {
    setIsInsysAuth(false);
    setEnteredPin("");
    toast.success("Terminal Locked. Enter PIN to unlock.");
  };

  // Save registered users helper to Convex Cloud Database + LocalStorage
  const saveUsersToStorage = async (updatedUsers) => {
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("pos_registered_users", JSON.stringify(updatedUsers));

    // Save directly to Convex Cloud Database
    try {
      if (savePosUsersMutation) {
        await savePosUsersMutation({ usersJson: JSON.stringify(updatedUsers) });
      }
    } catch (e) {
      console.error("Failed to save staff users to Convex Cloud", e);
    }
  };

  // Delete Cashier User
  const handleDeleteUser = (userId) => {
    if (registeredUsers.length <= 1) {
      toast.error("Cannot delete the only remaining user account!");
      return;
    }
    const updated = registeredUsers.filter((u) => u.id !== userId);
    saveUsersToStorage(updated);
    if (activeCashier.id === userId) {
      setActiveCashier(updated[0]);
    }
    toast.success("Cashier account removed");
  };

  // Sync Role changes
  const toggleUserRole = (newRole) => {
    setUserRole(newRole);
    localStorage.setItem("pos_user_role", newRole);
    if (newRole === "user") {
      setActiveTab("billing");
      setDiscount(0);
      const cashierUser = registeredUsers.find((u) => u.role === "user") || registeredUsers[0];
      setActiveCashier(cashierUser);
      toast.success(`Switched to CASHIER Mode (${cashierUser.name})`);
    } else {
      const adminUser = registeredUsers.find((u) => u.role === "admin") || registeredUsers[0];
      setActiveCashier(adminUser);
      toast.success("Switched to ADMIN Mode (Full Access)");
    }
  };

  // Convex Queries & Mutations
  const products = useQuery(api.inventory.getWebsiteProductsForBilling, {});
  const createBill = useMutation(api.inventory.createWebsitePOSBill);
  const billsHistory = useQuery(api.inventory.getBillingHistory, { limit: 500 }) || [];
  const onlineOrders = useQuery(api.orders.getAllOrders, { limit: 500 }) || [];
  const allUsers = useQuery(api.users.getAllUsers, {}) || [];
  const cloudPosBranches = useQuery(api.siteSettings.getPosBranches, {});
  const savePosBranchesMutation = useMutation(api.siteSettings.savePosBranches);
  const cloudPosUsers = useQuery(api.siteSettings.getPosUsers, {});
  const savePosUsersMutation = useMutation(api.siteSettings.savePosUsers);

  // Sync Cloud POS Branches from Convex Database in real-time
  useEffect(() => {
    if (cloudPosBranches && cloudPosBranches.branches && Object.keys(cloudPosBranches.branches).length > 0) {
      setBranches((prev) => {
        const merged = { ...STORE_BRANCHES, ...prev, ...cloudPosBranches.branches };
        localStorage.setItem("pos_branches", JSON.stringify(merged));
        return merged;
      });
      const activeKey = cloudPosBranches.activeBranch || activeBranch || "patna";
      setActiveBranch(activeKey);
      setEditingBranchId(activeKey);
      const branchInfo = cloudPosBranches.branches[activeKey] || cloudPosBranches.branches.patna;
      if (branchInfo) {
        setStoreSettings((prev) => {
          const updated = {
            ...prev,
            storeName: branchInfo.storeName || prev.storeName,
            storeAddress: branchInfo.storeAddress || prev.storeAddress,
            phone: branchInfo.phone || prev.phone,
            gstin: branchInfo.gstin || prev.gstin,
            upiId: branchInfo.upiId || prev.upiId
          };
          localStorage.setItem("pos_store_settings", JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [cloudPosBranches]);

  // Sync Cloud POS Staff Users from Convex Database in real-time
  useEffect(() => {
    if (cloudPosUsers && Array.isArray(cloudPosUsers) && cloudPosUsers.length > 0) {
      setRegisteredUsers(cloudPosUsers);
      localStorage.setItem("pos_registered_users", JSON.stringify(cloudPosUsers));
    }
  }, [cloudPosUsers]);

  // Customer Lookup & Match States for POS Cart
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);
  const [showPreviousOrders, setShowPreviousOrders] = useState(false);
  const [hoveredBill, setHoveredBill] = useState(null);
  const previousOrdersRef = useRef(null);

  // Close customer dropdown & previous orders on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
      if (previousOrdersRef.current && !previousOrdersRef.current.contains(e.target)) {
        setShowPreviousOrders(false);
        setHoveredBill(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Aggregated Customer Directory (POS Bills + Online Orders + Registered Users)
  const customerDirectory = useMemo(() => {
    const map = new Map();

    const normalizePhone = (p) => {
      if (!p) return "";
      const digits = String(p).replace(/\D/g, "");
      return digits.length > 10 ? digits.slice(-10) : digits;
    };

    // 1. Process POS Bills History
    (billsHistory || []).forEach((bill) => {
      const phone = normalizePhone(bill.customerPhone);
      if (!phone || phone.length < 5) return;
      const amount = Number(bill.total) || 0;
      const name = (bill.customerName || "").trim();
      const date = bill.createdAt ? new Date(bill.createdAt).getTime() : 0;

      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: name || "Customer",
          purchasesCount: 1,
          totalWorth: amount,
          lastPurchaseDate: date,
        });
      } else {
        const item = map.get(phone);
        item.purchasesCount += 1;
        item.totalWorth += amount;
        if (name && (item.name === "Customer" || !item.name || date > item.lastPurchaseDate)) {
          item.name = name;
        }
        if (date > (item.lastPurchaseDate || 0)) {
          item.lastPurchaseDate = date;
        }
      }
    });

    // 2. Process Online Store Orders
    (onlineOrders || []).forEach((order) => {
      const phone = normalizePhone(order.shippingDetails?.phone || order.phone);
      if (!phone || phone.length < 5) return;
      const amount = Number(order.paymentDetails?.amount || order.orderTotal || order.total || 0);
      const name = (order.shippingDetails?.fullName || order.customerName || "").trim();
      const date = order._creationTime || (order.createdAt ? new Date(order.createdAt).getTime() : 0);

      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: name || "Customer",
          purchasesCount: 1,
          totalWorth: amount,
          lastPurchaseDate: date,
        });
      } else {
        const item = map.get(phone);
        item.purchasesCount += 1;
        item.totalWorth += amount;
        if (name && (item.name === "Customer" || !item.name)) {
          item.name = name;
        }
        if (date > (item.lastPurchaseDate || 0)) {
          item.lastPurchaseDate = date;
          if (name) item.name = name;
        }
      }
    });

    // 3. Process Registered Web Users
    (allUsers || []).forEach((user) => {
      const phone = normalizePhone(user.phoneNumber);
      if (!phone || phone.length < 5) return;
      const name = (user.name || "").trim();

      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: name || "Customer",
          purchasesCount: 0,
          totalWorth: 0,
          lastPurchaseDate: 0,
        });
      } else {
        const item = map.get(phone);
        if (name && (item.name === "Customer" || !item.name)) {
          item.name = name;
        }
      }
    });

    return Array.from(map.values());
  }, [billsHistory, onlineOrders, allUsers]);

  // Top 5 matching customers matching the typed phone number
  const matchingCustomers = useMemo(() => {
    const rawDigits = (customerInfo.phone || "").replace(/\D/g, "");
    if (!rawDigits) return [];

    return customerDirectory
      .filter((c) => {
        return c.phone.includes(rawDigits) || (c.name && c.name.toLowerCase().includes(customerInfo.phone.toLowerCase()));
      })
      .sort((a, b) => {
        // Priority 1: Prefix match on phone
        const aStarts = a.phone.startsWith(rawDigits);
        const bStarts = b.phone.startsWith(rawDigits);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // Priority 2: Frequent buyers (highest purchases count first)
        if (b.purchasesCount !== a.purchasesCount) {
          return b.purchasesCount - a.purchasesCount;
        }

        // Priority 3: Highest total spent / total worth
        return b.totalWorth - a.totalWorth;
      })
      .slice(0, 5);
  }, [customerDirectory, customerInfo.phone]);

  // Detected matching customer profile for the current phone
  const activeCustomerProfile = useMemo(() => {
    const rawDigits = (customerInfo.phone || "").replace(/\D/g, "");
    if (rawDigits.length !== 10) return null;
    return customerDirectory.find((c) => c.phone === rawDigits) || null;
  }, [customerDirectory, customerInfo.phone]);

  // Get all previous bills & orders for the active customer
  const activeCustomerOrders = useMemo(() => {
    const rawDigits = (customerInfo.phone || "").replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < 5) return [];

    const normalizePhone = (p) => {
      if (!p) return "";
      const digits = String(p).replace(/\D/g, "");
      return digits.length > 10 ? digits.slice(-10) : digits;
    };

    const target10 = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;
    const results = [];

    // 1. In-store POS Bills
    (billsHistory || []).forEach((bill) => {
      const p = normalizePhone(bill.customerPhone);
      if (p && p.includes(target10)) {
        const d = bill.createdAt ? new Date(bill.createdAt) : null;
        results.push({
          id: bill._id || bill.billNumber || Math.random().toString(),
          type: "pos",
          typeLabel: "Store POS",
          billNumber: bill.billNumber,
          date: d,
          dateStr: d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent",
          total: Number(bill.total) || 0,
          subtotal: Number(bill.subtotal) || Number(bill.total) || 0,
          discountAmount: Number(bill.discountAmount) || 0,
          tax: Number(bill.tax) || 0,
          paymentMethod: bill.paymentMethod || "cash",
          splitDetails: bill.splitDetails,
          customerName: bill.customerName || "Customer",
          customerPhone: bill.customerPhone,
          items: (bill.items || []).map((it) => ({
            name: it.productName || "Item",
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            size: it.size || "",
            image: it.productImage || "",
            itemId: it.itemId || it.productId || "",
          })),
        });
      }
    });

    // 2. Online Store Orders
    (onlineOrders || []).forEach((order) => {
      const p = normalizePhone(order.shippingDetails?.phone || order.phone);
      if (p && p.includes(target10)) {
        const d = order.createdAt ? new Date(order.createdAt) : order._creationTime ? new Date(order._creationTime) : null;
        results.push({
          id: order._id || order.orderNumber || Math.random().toString(),
          type: "online",
          typeLabel: "Web Order",
          billNumber: order.orderNumber,
          date: d,
          dateStr: d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent",
          total: Number(order.paymentDetails?.amount || order.orderTotal || order.total || 0),
          subtotal: Number(order.subtotal || order.paymentDetails?.amount || 0),
          discountAmount: Number(order.discountAmount || 0),
          tax: 0,
          paymentMethod: order.paymentDetails?.paymentMethod || "online",
          customerName: order.shippingDetails?.fullName || "Customer",
          customerPhone: order.shippingDetails?.phone || "",
          items: (order.items || []).map((it) => ({
            name: it.name || "Item",
            price: Number(it.price) || 0,
            quantity: Number(it.quantity) || 1,
            size: it.size || "",
            image: it.image || "",
            itemId: it.productId || "",
          })),
        });
      }
    });

    return results.sort((a, b) => {
      const tA = a.date ? a.date.getTime() : 0;
      const tB = b.date ? b.date.getTime() : 0;
      return tB - tA;
    });
  }, [billsHistory, onlineOrders, customerInfo.phone]);

  // Billing Products Queries & Mutations (Dedicated billing DB)
  const billingProductsData = useQuery(api.billingProducts.getBillingProducts, {}) || [];
  const createBillingProductMutation = useMutation(api.billingProducts.createBillingProduct);
  const updateBillingProductMutation = useMutation(api.billingProducts.updateBillingProduct);
  const deleteBillingProductMutation = useMutation(api.billingProducts.deleteBillingProduct);

  // POS Location & Store Settings Convex Persistence
  const saveBranchesToServer = async (branchesToSave, currentActiveBranch) => {
    try {
      if (savePosBranchesMutation) {
        await savePosBranchesMutation({
          branchesJson: JSON.stringify(branchesToSave),
          activeBranch: currentActiveBranch || activeBranch || "patna"
        });
      }
    } catch (e) {
      console.error("Failed to save branch settings to Convex", e);
    }
  };

  // Handler to Create or Update Billing Product (Asking Name & Price only)
  const handleSaveBillingProduct = async (e) => {
    e.preventDefault();
    if (!newBillingProductForm.name.trim()) {
      toast.error("Please enter product name");
      return;
    }
    const numPrice = parseFloat(newBillingProductForm.price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSubmittingBillingProduct(true);
    try {
      if (editingBillingProduct) {
        await updateBillingProductMutation({
          id: editingBillingProduct._id,
          name: newBillingProductForm.name,
          price: numPrice,
        });
        toast.success(`Updated "${newBillingProductForm.name}" successfully!`);
        setEditingBillingProduct(null);
      } else {
        await createBillingProductMutation({
          name: newBillingProductForm.name,
          price: numPrice,
          createdBy: activeCashier?.name || "Admin",
        });
        toast.success(`Added "${newBillingProductForm.name}" to Billing Products!`);
      }
      setNewBillingProductForm({ name: "", price: "" });
    } catch (err) {
      toast.error(err.message || "Failed to save billing product");
    } finally {
      setIsSubmittingBillingProduct(false);
    }
  };

  const handleStartEditBillingProduct = (bp) => {
    setEditingBillingProduct(bp);
    setNewBillingProductForm({ name: bp.name, price: bp.price.toString() });
  };

  const handleCancelEditBillingProduct = () => {
    setEditingBillingProduct(null);
    setNewBillingProductForm({ name: "", price: "" });
  };

  const handleDeleteBillingProduct = async (bpId, bpName) => {
    if (!confirm(`Are you sure you want to delete "${bpName}"?`)) return;
    try {
      await deleteBillingProductMutation({ id: bpId });
      toast.success(`Deleted "${bpName}"`);
      if (editingBillingProduct?._id === bpId) {
        handleCancelEditBillingProduct();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  // Handle adding custom billing product directly to cart (no size needed)
  const handleAddBillingProductToCart = (product, e) => {
    if (e) e.stopPropagation();
    const cartKey = `bp-${product._id}`;
    const existingIndex = cart.findIndex((item) => item.cartKey === cartKey);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          cartKey,
          productId: product._id,
          productName: product.name,
          productImage: null,
          itemId: product.itemId || "BP-0001",
          size: "",
          price: product.price || 0,
          quantity: 1,
          maxStock: 9999,
          isBillingProduct: true,
        }
      ]);
    }
  };

  // Filter billing history
  const filteredBills = billsHistory.filter((bill) => {
    const query = historySearchQuery.toLowerCase();
    return (
      bill.billNumber?.toLowerCase().includes(query) ||
      bill.customerName?.toLowerCase().includes(query) ||
      bill.customerPhone?.toLowerCase().includes(query) ||
      bill.createdBy?.toLowerCase().includes(query)
    );
  });

  // Filter custom billing products tab list
  const filteredBillingProductsList = billingProductsData.filter((bp) => {
    const query = billingProductSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      bp.name?.toLowerCase().includes(query) ||
      bp.itemId?.toLowerCase().includes(query)
    );
  });

  // Sync current clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate unique bill number on load
  useEffect(() => {
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setBillNumber(generated);
  }, []);

  // Combine quick billing products and main website catalog products for the main POS Billing tab
  // Requirements:
  // 1. Put Quick Items ON TOP of website items.
  // 2. If an item is completely out of stock, push it to the very bottom.
  const allProducts = [
    ...(billingProductsData || []).map((bp) => ({
      _id: bp._id,
      itemId: bp.itemId,
      name: bp.name,
      price: bp.price,
      category: bp.category || "Quick Billing",
      isBillingProduct: true,
      availableSizes: ["Standard"],
      sizeStock: { Standard: 9999 },
      totalAvailable: 9999,
      currentStock: 9999,
    })),
    ...(products || []),
  ];

  // Helper to calculate total stock count for sorting
  const getProductStockCount = (product) => {
    if (product.isBillingProduct) return 9999;
    if (product.sizeStock && typeof product.sizeStock === "object") {
      const vals = Object.values(product.sizeStock);
      if (vals.length > 0) {
        return vals.reduce((sum, qty) => sum + (Number(qty) || 0), 0);
      }
    }
    return Number(product.totalAvailable ?? product.currentStock ?? 0);
  };

  // Filter combined products by search query and sort
  const filteredProducts = allProducts
    .filter((product) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        product.name?.toLowerCase().includes(query) ||
        product.itemId?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aStock = getProductStockCount(a);
      const bStock = getProductStockCount(b);
      const aOutOfStock = aStock <= 0;
      const bOutOfStock = bStock <= 0;

      // 1. Completely out of stock products go to the very bottom
      if (aOutOfStock && !bOutOfStock) return 1;
      if (!aOutOfStock && bOutOfStock) return -1;

      // 2. Both in stock (or both out of stock): Quick items go on top of website items
      if (a.isBillingProduct && !b.isBillingProduct) return -1;
      if (!a.isBillingProduct && b.isBillingProduct) return 1;

      return 0;
    });

  // Handle adding product with specific size directly to cart
  const handleAddToCart = (product, size, e) => {
    if (e) e.stopPropagation();
    const availableStock = product.sizeStock?.[size] || 0;
    if (availableStock <= 0) {
      toast.error(`Size ${size} is out of stock!`);
      return;
    }

    const cartKey = `${product._id}-${size}`;
    const existingIndex = cart.findIndex((item) => item.cartKey === cartKey);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > availableStock) {
        toast.error(`Only ${availableStock} units available for size ${size}!`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          cartKey,
          productId: product._id,
          productName: product.name,
          productImage: product.mainImage || product.images?.[0] || null,
          itemId: product.itemId || "ITEM-001",
          size: size,
          price: product.price || 0,
          quantity: 1,
          maxStock: availableStock,
          sizeDisplayType: product.sizeDisplayType || "letter"
        }
      ]);
    }
  };

  // Quantity modification in Cart
  const updateQuantity = (cartKey, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartKey === cartKey) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              toast.error(`Maximum available stock reached (${item.maxStock})`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartKey !== cartKey));
  };

  // Billing Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const effectiveDiscount = discount;
  const effectiveFlatDiscount = flatDiscount;
  const discountAmount = discountType === "percentage"
    ? Math.round((subtotal * (effectiveDiscount / 100)) * 100) / 100
    : Math.min(subtotal, Math.max(0, effectiveFlatDiscount));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const cgst = 0;
  const sgst = 0;
  const tax = 0;
  const totalWithTax = taxableAmount;
  const grandTotal = Math.round(totalWithTax);
  const roundOff = Math.round((grandTotal - totalWithTax) * 100) / 100;

  // Keep split payment synchronized whenever grandTotal changes (discount applied/altered, cart modified)
  useEffect(() => {
    if (paymentMethod !== "split") return;

    if (grandTotal <= 0) {
      setSplitPayment({ cash: "", online: "", lastEdited: "cash" });
      return;
    }

    setSplitPayment((prev) => {
      // If neither was entered yet
      if ((prev.cash === "" || prev.cash === undefined) && (prev.online === "" || prev.online === undefined)) {
        return { cash: grandTotal, online: "", lastEdited: "cash" };
      }

      if (prev.lastEdited === "online") {
        const currentOnline = parseFloat(prev.online) || 0;
        if (currentOnline >= grandTotal) {
          return { cash: 0, online: grandTotal, lastEdited: "online" };
        }
        const remCash = Math.max(0, Math.round((grandTotal - currentOnline) * 100) / 100);
        return {
          cash: remCash,
          online: prev.online === "" ? "" : currentOnline,
          lastEdited: "online"
        };
      } else {
        // default: lastEdited was cash
        const currentCash = parseFloat(prev.cash) || 0;
        if (currentCash >= grandTotal) {
          return { cash: grandTotal, online: 0, lastEdited: "cash" };
        }
        const remOnline = Math.max(0, Math.round((grandTotal - currentCash) * 100) / 100);
        return {
          cash: prev.cash === "" ? "" : currentCash,
          online: remOnline,
          lastEdited: "cash"
        };
      }
    });
  }, [grandTotal, paymentMethod]);

  // Magnet Club & Restro Thermal Invoice Print Handler (80mm Thermal Receipt Engine)
  const executeMagnetRestroPrint = async (targetBill = null) => {
    const activeBillData = targetBill || {
      billNumber: billNumber,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      items: cart,
      subtotal: subtotal,
      discount: effectiveDiscount,
      discountAmount: discountAmount,
      discountType: discountType,
      cgst: cgst,
      sgst: sgst,
      tax: tax,
      total: grandTotal,
      roundOff: roundOff,
      paymentMethod: paymentMethod,
      splitDetails: paymentMethod === "split" ? {
        cash: parseFloat(splitPayment.cash) || 0,
        online: parseFloat(splitPayment.online) || 0
      } : undefined,
      createdBy: activeCashier ? activeCashier.name : "POS Cashier",
      createdAt: new Date().toISOString()
    };

    const printWindow = window.open("", "_blank", "width=450,height=800");
    if (!printWindow) {
      toast.error("Please allow popups to enable bill printing!");
      return;
    }

    const itemsQty = activeBillData.items.reduce((sum, i) => sum + i.quantity, 0);
    const billSubtotal = activeBillData.subtotal || activeBillData.total || 0;
    const billCgst = activeBillData.cgst ?? Math.round((billSubtotal * 0.025) * 100) / 100;
    const billSgst = activeBillData.sgst ?? Math.round((billSubtotal * 0.025) * 100) / 100;
    const billRoundOff = activeBillData.roundOff ?? 0;
    const roundOffStr = billRoundOff >= 0 ? `+₹${billRoundOff.toFixed(2)}` : `-₹${Math.abs(billRoundOff).toFixed(2)}`;
    const formattedDate = new Date(activeBillData.createdAt || Date.now()).toLocaleDateString("en-GB");
    const formattedTime = new Date(activeBillData.createdAt || Date.now()).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    const rawCashierLabel = activeBillData.createdBy || (activeCashier ? activeCashier.name : "POS Cashier");
    const cashierLabel = rawCashierLabel.replace(/\s*\([^)]*\)/g, "").trim();

    // Dynamic Store Branch Details (Patna vs Gaya)
    const currentBranch = STORE_BRANCHES[activeBranch] || STORE_BRANCHES.patna;
    const storeTitle = targetBill?.storeName || storeSettings?.storeName || currentBranch.storeName;
    const logoBadge = storeSettings?.logoText || "AESTHETX WAYS";
    const storeAddr = targetBill?.storeAddress || storeSettings?.storeAddress || currentBranch.storeAddress;
    const storeGstin = storeSettings?.gstin || "10AAACA0000A1Z5";
    const storePhone = storeSettings?.phone || "+91 70337 69997";
    const thankMsg = storeSettings?.thankYouMessage || "Thank you for shopping with us..!!";
    const siteUrl = storeSettings?.websiteUrl || "aesthetxways.com";

    // Dynamic UPI QR Code Generation (for UPI payment or Split payment with online portion)
    const isSplit = String(activeBillData.paymentMethod || "").toLowerCase() === "split";
    const splitOnlineAmount = isSplit && activeBillData.splitDetails ? Number(activeBillData.splitDetails.online || 0) : 0;
    const isUpiPayment = String(activeBillData.paymentMethod || "").toLowerCase() === "upi";
    const shouldShowUpiQr = isUpiPayment || (isSplit && splitOnlineAmount > 0);
    const billFinalAmount = Number(activeBillData.total ?? activeBillData.grandTotal ?? 0);
    const upiTargetAmount = isSplit ? splitOnlineAmount : billFinalAmount;
    const upiAmountStr = upiTargetAmount.toFixed(2);
    const upiId = storeSettings?.upiId || "8008439762@ptsbi";
    const payeeName = encodeURIComponent(storeTitle || "Aesthetx Ways");
    const upiNote = encodeURIComponent(`Bill ${activeBillData.billNumber || ""}`.trim());
    const upiPayload = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${upiAmountStr}&cu=INR&tn=${upiNote}`;

    let upiQrDataUrl = "";
    if (shouldShowUpiQr && upiTargetAmount > 0) {
      try {
        if (typeof document !== "undefined") {
          const canvas = document.createElement("canvas");
          await QRCode.toCanvas(canvas, upiPayload, {
            margin: 1,
            width: 240,
            errorCorrectionLevel: "H",
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });

          const ctx = canvas.getContext("2d");
          const size = canvas.width;

          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.src = "/logo_t.svg";

          await new Promise((resolve) => {
            if (logoImg.complete && logoImg.naturalWidth !== 0) {
              resolve();
            } else {
              logoImg.onload = resolve;
              logoImg.onerror = resolve;
              setTimeout(resolve, 300);
            }
          });

          if (logoImg.width > 0) {
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = Math.floor(size * 0.125);

            // Clean white circular background (no black boundary)
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.clip(); // circular clipping path

            // Draw logo centered inside the circle
            const pad = 3;
            const logoW = (radius * 2) - pad * 2;
            const aspect = (logoImg.naturalHeight || logoImg.height || 327) / (logoImg.naturalWidth || logoImg.width || 425);
            const logoH = logoW * aspect;
            const logoX = centerX - logoW / 2;
            const logoY = centerY - logoH / 2;
            ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
            ctx.restore();
          }

          upiQrDataUrl = canvas.toDataURL("image/png");
        }
      } catch (qrErr) {
        console.error("Failed to generate canvas QR with logo:", qrErr);
      }

      if (!upiQrDataUrl) {
        try {
          upiQrDataUrl = await QRCode.toDataURL(upiPayload, {
            margin: 1,
            width: 180,
            errorCorrectionLevel: "H",
          });
        } catch (err) {
          upiQrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=H&data=${encodeURIComponent(upiPayload)}`;
        }
      }
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Bill - #${activeBillData.billNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              width: 72mm; 
              margin: 0 auto; 
              padding: 6mm 2mm; 
              background: #fff; 
              color: #000; 
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .brand { text-align: center; margin-bottom: 10px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .brand-logo-text { display: inline-block; padding: 3px 12px; background: #000; color: #fff; font-size: 14px; font-weight: 900; border-radius: 4px; margin-bottom: 4px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
            .brand-name { font-size: 16px; font-weight: 900; letter-spacing: 1px; margin: 4px 0 2px 0; text-transform: uppercase; color: #000; }
            .brand-address, .brand-phone, .brand-gst { font-size: 11px; margin: 2px 0; color: #000; font-weight: 700; line-height: 1.4; }
            .brand-gst { font-size: 11px; font-weight: 900; }
            .metadata { font-size: 11px; border-bottom: 1.5px dashed #000; padding-bottom: 8px; margin-bottom: 10px; }
            .meta-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .meta-label { font-weight: 800; color: #000; }
            .meta-value { font-weight: 800; color: #000; }
            .meta-value.bold { font-size: 12px; font-weight: 900; }
            .font-mono { font-family: monospace; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .items-table th { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #000; border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 6px 0; }
            .items-table td { padding: 5px 0; font-size: 11px; font-weight: 700; vertical-align: top; color: #000; border-bottom: 0.5px dashed #000; }
            .align-left { text-align: left; }
            .align-center { text-align: center; }
            .align-right { text-align: right; }
            .totals-section { border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 8px 0; margin-bottom: 10px; }
            .grand-total-row td { border-top: 1.5px dashed #000; padding-top: 8px; font-weight: 900; }
            .receipt-footer { text-align: center; margin-top: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .payment-badge { display: inline-block; border: 2px solid #000; padding: 4px 14px; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; margin-bottom: 8px; text-transform: uppercase; border-radius: 4px; }
            .thank-you { font-size: 11px; font-weight: 700; font-style: italic; margin: 4px 0 2px 0; color: #000; }
            .website { font-size: 10px; font-weight: 800; margin: 4px 0 2px 0; color: #000; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4; }
            @media print { body { width: 72mm; margin: 0 auto; padding: 6mm 2mm; box-sizing: border-box; } }
          </style>
        </head>
        <body onload="window.print(); setTimeout(function(){ window.close(); }, 500);">
          <div class="brand">
            <img src="/logo_t.svg" alt="AESTHETX WAYS" style="width: 85px; height: auto; margin: 0 auto 6px auto; display: block;" />
            <h1 class="brand-name">${storeTitle}</h1>
            <p class="brand-address">${storeAddr}</p>
            <p class="brand-phone">Support: ${storePhone}</p>
          </div>
          
          <div class="metadata">
            <div class="meta-row">
              <span class="meta-label">Date & Time:</span>
              <span class="meta-value">${formattedDate} ${formattedTime}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Bill No.:</span>
              <span class="meta-value font-mono bold">${activeBillData.billNumber}</span>
            </div>
            ${activeBillData.customerName ? `
            <div class="meta-row">
              <span class="meta-label">Customer:</span>
              <span class="meta-value">${activeBillData.customerName}</span>
            </div>` : ''}
            ${activeBillData.customerPhone ? `
            <div class="meta-row">
              <span class="meta-label">Phone:</span>
              <span class="meta-value font-mono">${activeBillData.customerPhone}</span>
            </div>` : ''}
            <div class="meta-row">
              <span class="meta-label">Partner:</span>
              <span class="meta-value">${cashierLabel}</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th class="align-left" style="width: 8%;">#</th>
                <th class="align-left" style="width: 56%;">Item</th>
                <th class="align-center" style="width: 14%;">Qty</th>
                <th class="align-right" style="width: 22%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${activeBillData.items.map((item, idx) => `
                <tr>
                  <td class="align-left">${idx + 1}</td>
                  <td class="align-left">
                    ${item.productName || item.name} 
                    ${item.size && item.size !== "Standard" ? `<br/><span style="font-size: 9px; opacity: 0.8; font-family: monospace;">Size: ${item.size}</span>` : ''}
                  </td>
                  <td class="align-center">${item.quantity}</td>
                  <td class="align-right font-mono">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #000; font-weight: 700;">
              <tr>
                <td style="text-align: left; font-weight: 800; padding: 2px 0;">Total Qty: ${itemsQty}</td>
                <td style="text-align: right; width: 45%; padding: 2px 0;">Sub Total</td>
                <td style="text-align: right; width: 25%; padding: 2px 0;" class="font-mono">₹${billSubtotal.toFixed(2)}</td>
              </tr>
              ${activeBillData.discountAmount > 0 ? `
              <tr>
                <td></td>
                <td style="text-align: right; padding: 2px 0;">Discount (${activeBillData.discountType === "flat" ? "Flat" : `${activeBillData.discount}%`})</td>
                <td style="text-align: right; padding: 2px 0;" class="font-mono">-₹${activeBillData.discountAmount.toFixed(2)}</td>
              </tr>` : ''}
              ${billRoundOff !== 0 ? `
              <tr style="font-size: 10px;">
                <td></td>
                <td style="text-align: right; padding: 2px 0;">Round off</td>
                <td style="text-align: right; padding: 2px 0;" class="font-mono">${roundOffStr}</td>
              </tr>` : ''}
              <tr class="grand-total-row">
                <td colspan="2" style="text-align: right; font-weight: 900; font-size: 14px; padding-top: 6px; border-top: 1.5px dashed #000;">Grand Total</td>
                <td style="text-align: right; font-weight: 900; font-size: 14px; padding-top: 6px; border-top: 1.5px dashed #000;" class="font-mono">₹${billFinalAmount.toFixed(2)}</td>
              </tr>
              ${isSplit && activeBillData.splitDetails ? `
              <tr style="font-size: 11px; font-weight: 800; color: #111;">
                <td colspan="2" style="text-align: right; padding-top: 5px;">Paid in Cash:</td>
                <td style="text-align: right; padding-top: 5px;" class="font-mono">₹${Number(activeBillData.splitDetails.cash || 0).toFixed(2)}</td>
              </tr>
              <tr style="font-size: 11px; font-weight: 800; color: #111;">
                <td colspan="2" style="text-align: right; padding: 1px 0;">Paid via Online/UPI:</td>
                <td style="text-align: right; padding: 1px 0;" class="font-mono">₹${Number(activeBillData.splitDetails.online || 0).toFixed(2)}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Dynamic UPI QR Code Section -->
          ${shouldShowUpiQr && upiTargetAmount > 0 && upiQrDataUrl ? `
          <div style="text-align: center; margin: 8px 0 6px 0; border-bottom: 1.5px dashed #000; padding-bottom: 8px;">
            <div style="font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
              ${isSplit ? 'SCAN TO PAY ONLINE PORTION VIA UPI' : 'SCAN TO PAY VIA UPI'}
            </div>
            <div style="position: relative; display: inline-block; background: #fff;">
              <img src="${upiQrDataUrl}" alt="Scan to Pay via UPI" style="width: 125px; height: 125px; display: block; margin: 0 auto;" />
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; background: #fff; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box;">
                <img src="/logo_t.svg" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; display: block; margin: 0 auto;" />
              </div>
            </div>
            <div style="font-size: 13px; font-weight: 900; font-family: monospace; margin-top: 4px;">
              ₹${upiTargetAmount.toFixed(2)}
            </div>
            <div style="font-size: 9px; font-weight: 700; color: #222; font-family: monospace; margin-top: 2px; letter-spacing: 0.5px;">
              UPI ID: ${upiId}
            </div>
          </div>
          ` : ''}

          <div class="receipt-footer">
          
            <p class="thank-you">${thankMsg}</p>
            <p class="website">Visit Our Store Online<br/>${siteUrl}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Submit and Save Bill POS Transaction
  const handleProcessBillAndPrint = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty! Add products before billing.");
      return;
    }

    const cleanPhone = (customerInfo.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("Customer Phone Number is required!");
      return;
    }
    if (cleanPhone.length !== 10) {
      toast.error("Customer Phone Number must be exactly 10 digits!");
      return;
    }

    if (!customerInfo.name?.trim()) {
      toast.error("Customer Name is required!");
      return;
    }

    let finalSplitDetails = undefined;
    if (paymentMethod === "split") {
      const c = parseFloat(splitPayment.cash) || 0;
      const o = parseFloat(splitPayment.online) || 0;
      if (Math.abs((c + o) - grandTotal) > 0.01) {
        toast.error(`Split amounts (₹${(c + o).toFixed(2)}) must equal Grand Total (₹${grandTotal.toFixed(2)})`);
        return;
      }
      finalSplitDetails = { cash: c, online: o };
    }

    const cashierNameStr = activeCashier ? activeCashier.name : "POS Cashier";

    const toastId = toast.loading("Processing POS bill & updating stock...");
    try {
      const cleanItems = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage || undefined,
        itemId: item.itemId,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
        sizeDisplayType: item.sizeDisplayType || "letter"
      }));

      const result = await createBill({
        billNumber: String(Math.floor(Number(billNumber) || 100000)),
        items: cleanItems,
        customerName: customerInfo.name || undefined,
        customerPhone: customerInfo.phone || undefined,
        subtotal: subtotal,
        discount: discountType === "percentage" ? effectiveDiscount : (subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0),
        discountAmount: discountAmount,
        discountType: discountType,
        tax: tax,
        total: grandTotal,
        paymentMethod: paymentMethod,
        splitDetails: finalSplitDetails,
        createdBy: cashierNameStr
      });

      toast.success("Bill processed & inventory updated!", { id: toastId });

      // Trigger Thermal Invoice Print Window
      executeMagnetRestroPrint({
        billNumber: result.billNumber || billNumber,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart,
        subtotal: subtotal,
        discount: effectiveDiscount,
        discountAmount: discountAmount,
        discountType: discountType,
        cgst: cgst,
        sgst: sgst,
        tax: tax,
        total: grandTotal,
        roundOff: roundOff,
        paymentMethod: paymentMethod,
        splitDetails: finalSplitDetails,
        createdBy: cashierNameStr,
        createdAt: new Date().toISOString()
      });

      // Reset Form State for next customer
      setCart([]);
      setCustomerInfo({ name: "", phone: "" });
      setDiscount(0);
      setFlatDiscount(0);
      setDiscountType("percentage");
      setPaymentMethod("cash");
      setSplitPayment({ cash: "", online: "", lastEdited: "cash" });
      const nextBillNum = String(Math.floor(100000 + Math.random() * 900000));
      setBillNumber(nextBillNum);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process bill: " + (err.message || "Server Error"), { id: toastId });
    }
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen bg-white items-center justify-center font-mono text-xs text-zinc-500">
        Loading POS Billing System...
      </div>
    );
  }

  // If Terminal is Locked / Unauthenticated -> Show Inline User + PIN Verification Screen directly on the page
  if (!isInsysAuth) {
    return (
      <div className="flex h-screen bg-zinc-50/50 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            // className="w-full max-w-sm bg-white rounded-xs border border-zinc-200 p-6 shadow-xl font-mono text-xs"
          >
        

            {/* PIN Verification Form (Only PIN!) */}
            <form onSubmit={handleVerifyPinSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1.5">
                  Security PIN Code
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPinCode ? "text" : "password"}
                    maxLength={10}
                    required
                    autoFocus
                    placeholder="Enter PIN"
                    value={enteredPin}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEnteredPin(val);
                      if (val.trim().length === 4) {
                        verifyPin(val);
                      }
                    }}
                    className="w-full pl-9 pr-9 py-2 bg-zinc-50 border border-zinc-200 rounded-xs text-zinc-900 font-bold text-center tracking-widest text-sm focus:bg-white focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinCode(!showPinCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showPinCode ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {isVerifyingPin && (
                  <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-[11px] font-mono mt-2.5 animate-pulse">
                    <RefreshCw size={12} className="animate-spin text-zinc-700" />
                    <span>Verifying PIN...</span>
                  </div>
                )}
              </div>
            </form>

      
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50/50 overflow-hidden">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-zinc-150 px-4 py-2.5 flex items-center justify-between shrink-0">
          {/* Store Switcher: Patna vs Gaya + Any Added Locations */}
          <div className="flex items-center p-0.5 bg-zinc-100 rounded-md border border-zinc-200 font-mono text-xs">
            {Object.entries(branches).map(([bId, bData]) => {
              const displayName = (bData.name || bId).replace(/\s*Branch\s*/i, "");
              const isSelected = activeBranch === bId;
              return (
                <button
                  key={bId}
                  type="button"
                  onClick={() => handleBranchChange(bId)}
                  className={`px-3 py-1.5 rounded-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-zinc-950 text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                  }`}
                  title={`${bData.name || bId} Store`}
                >
                  <MapPin size={12} className={isSelected ? "text-emerald-400" : "text-zinc-400"} />
                  <span>{displayName}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side: desk, History, Product tabs + Three dots menu */}
          <div className="flex items-center gap-2.5">
            {/* Tab Switcher: desk vs History vs Product */}
            <div className="flex items-center p-0.5 bg-zinc-100 rounded-md border border-zinc-200 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("billing")}
                className={`px-3 py-1.5 rounded-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "billing"
                    ? "bg-white text-zinc-950 shadow-xs font-bold"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <ShoppingCart size={13} />
                <span>desk</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1.5 rounded-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "history"
                    ? "bg-white text-zinc-950 shadow-xs font-bold"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <History size={13} />
                <span>History</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("billing_products")}
                className={`px-3 py-1.5 rounded-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "billing_products"
                    ? "bg-white text-zinc-950 shadow-xs font-bold"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Package size={13} />
                <span>Product</span>
              </button>
            </div>

            {/* Three Dots Menu Button & Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className={`p-1.5 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                  showMoreMenu
                    ? "bg-zinc-200 border-zinc-300 text-zinc-950 shadow-inner"
                    : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-2xs"
                }`}
                title="Options"
                aria-label="More Options"
              >
                <MoreVertical size={16} />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1.5 w-44 bg-white rounded-md border border-zinc-200 shadow-lg py-1 z-50 font-mono text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowUserModal(true);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-left text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
                    >
                      <Users size={14} className="text-zinc-500" />
                      <span className="font-semibold">Manage User</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-left text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
                    >
                      <Settings size={14} className="text-zinc-500" />
                      <span className="font-semibold">Settings</span>
                    </button>

                    <div className="my-1 border-t border-zinc-150" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleLockTerminal();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Lock size={14} className="text-red-500" />
                      <span className="font-semibold">Lock</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Tab 1: Billing Desk (POS View) */}
        {activeTab === "billing" && (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Column: Inventory Search & Product Expandable List */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-150 bg-white">
              {/* Product Search Bar */}
              <div className="p-3 border-b border-zinc-150 bg-zinc-50/50 flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by product title, category, or Item ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xs text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Active Cashier Static Name Display */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase hidden lg:inline">Cashier:</span>
                  <span className="px-2.5 py-1 bg-white border border-zinc-200 rounded-xs text-[11px] font-bold text-zinc-900 shadow-2xs">
                    {activeCashier ? activeCashier.name : "Admin"}
                  </span>
                </div>
              </div>

              {/* Product Expandable List UI (No images upfront, expands on hover/click) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {products === undefined ? (
                  <div className="py-16 text-center font-mono text-xs text-zinc-400 flex flex-col items-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-zinc-400" />
                    <span>Syncing catalog products...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-16 text-center font-mono text-xs text-zinc-400">
                    No products found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const sizeStockTotal = product.sizeStock
                      ? Object.values(product.sizeStock).reduce((sum, qty) => sum + (Number(qty) || 0), 0)
                      : 0;
                    const totalStock = sizeStockTotal > 0 ? sizeStockTotal : (product.totalAvailable ?? product.currentStock ?? 0);
                    const hasStock = totalStock > 0;
                    const isExpanded = expandedProductId === product._id;

                    return (
                      <div
                        key={product._id}
                        onMouseEnter={() => {
                          if (!product.isBillingProduct) {
                            setExpandedProductId(product._id);
                          }
                        }}
                        onClick={(e) => {
                          if (product.isBillingProduct) {
                            handleAddBillingProductToCart(product, e);
                          } else {
                            setExpandedProductId(isExpanded ? null : product._id);
                          }
                        }}
                        className={` rounded-xs transition-all duration-150 font-mono text-xs cursor-pointer select-none ${
                          product.isBillingProduct
                            ? "hover:border hover:border-amber-400 hover:bg-amber-100/20 p-2.5 active:scale-[0.99] shadow-2xs"
                            : isExpanded
                            ? "bg-white border-zinc-900 shadow-md ring-1 ring-zinc-900/10 p-3"
                            : "bg-white border-zinc-200 hover:border-zinc-400 p-2.5 hover:bg-zinc-50/60"
                        } ${!hasStock ? "opacity-60 bg-zinc-50" : ""}`}
                      >
                        {/* Collapsed Compact Row Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${product.isBillingProduct ? "bg-amber-400 shadow-xs" : "bg-zinc-900"}`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-sans font-bold text-xs text-zinc-950 truncate flex items-center gap-2">
                                <span>{product.name}</span>
                                {product.isBillingProduct && (
                                  <span className=" text-[20px] font-mono rounded-xs font-bold ">
                                    ⚡
                                  </span>
                                )}
                              </h3>
                              {!product.isBillingProduct && (
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                                  <span>ID: {product.itemId || "N/A"}</span>
                                  {product.category && <span>• {product.category}</span>}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Stock status pill for website products only */}
                            {!product.isBillingProduct && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs border ${
                                hasStock
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}>
                                {hasStock ? `${totalStock} in stock` : "Out of Stock"}
                              </span>
                            )}

                            {/* Price */}
                            <span className="font-bold text-sm text-zinc-950">
                              ₹{product.price}
                            </span>

                            {!product.isBillingProduct && (
                              <div className="text-zinc-400">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded State: Reveals Product Image & Inline Sizes (Main store products only) */}
                        <AnimatePresence>
                          {isExpanded && !product.isBillingProduct && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-zinc-150 flex flex-col sm:flex-row gap-3 items-start"
                            >
                              {/* Product Thumbnail Image */}
                              <div className="w-20 h-20 bg-zinc-100 rounded-xs border border-zinc-200 overflow-hidden shrink-0">
                                {product.mainImage || product.images?.[0] ? (
                                  <img
                                    src={product.mainImage || product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                    <Package size={20} />
                                  </div>
                                )}
                              </div>

                              {/* Size Stock Selector Buttons */}
                              <div className="flex-1 w-full">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">
                                  Click size variant to add directly to cart:
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                  {SIZE_ORDER.map((size) => {
                                    const stock = product.sizeStock?.[size] || 0;
                                    const isAvailable = stock > 0;

                                    return (
                                      <button
                                        key={size}
                                        disabled={!isAvailable}
                                        onClick={(e) => handleAddToCart(product, size, e)}
                                        className={`py-1.5 px-2 rounded-xs border text-center transition-all flex flex-col items-center justify-center ${
                                          isAvailable
                                            ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 active:scale-95 cursor-pointer shadow-xs"
                                            : "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-50"
                                        }`}
                                      >
                                        <span className="font-bold text-xs">{size}</span>
                                        <span className={`text-[9px] mt-0.5 font-normal ${isAvailable ? "text-emerald-300 font-bold" : "text-red-400"}`}>
                                          {isAvailable ? `${stock} left` : "0"}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Live Shopping Cart & Billing Calculation (Expanded by 20%) */}
            <div className="w-96 md:w-[450px] lg:w-[490px] xl:w-[530px] bg-white border-l border-zinc-150 flex flex-col shrink-0">
              <div className="p-3.5 border-b border-zinc-150 bg-zinc-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-zinc-800" />
                  <h2 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                    Order Cart ({cart.length})
                  </h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] font-mono text-red-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Trash2 size={12} />
                    <span>Clear Cart</span>
                  </button>
                )}
              </div>

              {/* Customer Phone & Name Input with Top 5 Match Dropdown */}
              <div ref={customerDropdownRef} className="p-3.5 border-b border-zinc-150 bg-white relative text-xs font-mono shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-600 font-bold uppercase block mb-1">
                      Customer Phone <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        placeholder="10 digit phone *"
                        value={customerInfo.phone}
                        onFocus={() => {
                          if (customerInfo.phone.replace(/\D/g, "").length > 0) {
                            setShowCustomerDropdown(true);
                          }
                        }}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setCustomerInfo({ ...customerInfo, phone: digitsOnly });
                          setShowCustomerDropdown(true);
                        }}
                        className="w-full pl-7 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xs text-xs text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white font-bold font-mono transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 font-bold uppercase block mb-1">
                      Customer Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="Full name *"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full pl-7 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xs text-xs text-zinc-900 focus:outline-none focus:border-zinc-500 focus:bg-white font-bold transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Customer Recognized Banner with View Previous Orders Button */}
                {activeCustomerProfile && (
                  <div className="mt-2 py-1.5 rounded text-[10px] font-mono flex items-center justify-between gap-2 text-zinc-900 animate-in fade-in duration-150 ">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPreviousOrders((prev) => !prev);
                          setShowCustomerDropdown(false);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[10px] font-mono transition-all border border-zinc-900 cursor-pointer shadow-xs active:scale-95 shrink-0"
                      >
                        <History size={11} className="text-amber-400" />
                        <span>previous orders</span>
                        <motion.div
                          animate={{ rotate: showPreviousOrders ? 180 : 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <ChevronDown size={11} />
                        </motion.div>
                      </button>
                 
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0 rounded font-bold text-zinc-600 ">
                        {activeCustomerProfile.purchasesCount} {activeCustomerProfile.purchasesCount === 1 ? "purchase" : "purchases"}
                      </span>
                      <span className="px-1.5 py-0 rounded font-bold text-emerald-700 ">
                        ₹{activeCustomerProfile.totalWorth.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total worth
                      </span>
                    </div>
                  </div>
                )}

                {/* Animated Previous Orders & Bills Dropdown with Nested Hover Items */}
                <AnimatePresence>
                  {showPreviousOrders && (
                    <motion.div
                      ref={previousOrdersRef}
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute left-3 right-3 top-[calc(100%-2px)] z-50 bg-white border border-zinc-300 rounded-lg shadow-2xl text-xs font-mono"
                    >
                      {/* Header */}
                      <div className="bg-zinc-900 px-3 py-2 flex items-center justify-between text-[10px] font-mono text-zinc-200 rounded-t-lg">
                        <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-white">
                          <History size={12} className="text-amber-400" />
                          <span>Previous Orders ({activeCustomerOrders.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPreviousOrders(false);
                            setHoveredBill(null);
                          }}
                          className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Orders / Bills List */}
                      {activeCustomerOrders.length > 0 ? (
                        <div className="divide-y divide-zinc-100 max-h-[340px] overflow-y-auto relative rounded-b-lg">
                          {activeCustomerOrders.map((bill) => {
                            const isHovered = hoveredBill?.id === bill.id;

                            return (
                              <div
                                key={bill.id}
                                onMouseEnter={() => setHoveredBill(bill)}
                                className={`p-3 transition-all cursor-pointer relative group ${
                                  isHovered ? "bg-amber-50/90" : "hover:bg-zinc-50/90"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  {/* Left: Bill #, Date, Badges */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-zinc-950 text-xs">
                                        #{bill.billNumber}
                                      </span>
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded  ${
                                          bill.type === "pos"
                                            ? "text-amber-900 "
                                            : " text-blue-900 "
                                        }`}
                                      >
                                        {bill.typeLabel}
                                      </span>
                                      <span className="text-[9px] uppercase font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                                        {bill.paymentMethod === "split" && bill.splitDetails
                                          ? `SPLIT (₹${bill.splitDetails.cash} + ₹${bill.splitDetails.online})`
                                          : bill.paymentMethod}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-1">
                                      <Clock size={11} className="text-zinc-400" />
                                      <span>{bill.dateStr}</span>
                                    </div>
                                  </div>

                                  {/* Right: Items count, Total amount, Hover indicator */}
                                  <div className="text-right shrink-0">
                                    <div className="text-xs font-bold text-zinc-950 font-mono">
                                      ₹{bill.total.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[10px] text-zinc-600 font-bold mt-0.5 flex items-center justify-end gap-1">
                                      <span>{bill.items.length} {bill.items.length === 1 ? "item" : "items"}</span>
                                      <ChevronRight size={12} className={`text-zinc-400 transition-transform ${isHovered ? "translate-x-0.5 text-zinc-900" : ""}`} />
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-1.5 pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                                  {/* <span className="text-zinc-400">Hover to view items preview</span> */}
                                  {bill.discountAmount > 0 && (
                                    <span className="text-emerald-600 font-bold">
                                      Saved ₹{bill.discountAmount.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-zinc-500 text-[11px] font-mono">
                          No previous orders found for this customer.
                        </div>
                      )}

                      {/* Floating Nested Dropdown for Hovered Bill Items */}
                      <AnimatePresence>
                        {hoveredBill && (
                          <motion.div
                            initial={{ opacity: 0, x: 12, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 12, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            onMouseEnter={() => setHoveredBill(hoveredBill)}
                            onMouseLeave={() => setHoveredBill(null)}
                            className="absolute right-full mr-2 top-0 w-80 sm:w-88 bg-white border border-zinc-300 rounded-lg shadow-2xl overflow-hidden z-60 font-mono"
                          >
                            {/* Flyout Header */}
                            <div className="bg-zinc-900 p-2.5 flex items-center justify-between text-[10px] text-zinc-200">
                              <div className="flex items-center gap-1.5">
                                <Package size={13} className="text-amber-400" />
                                <span className="font-bold text-white uppercase tracking-wider">
                                  Bill #{hoveredBill.billNumber}
                                </span>
                              </div>
                              <span className="bg-white/10 text-zinc-200 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                {hoveredBill.items.length} {hoveredBill.items.length === 1 ? "Item" : "Items"}
                              </span>
                            </div>

                            {/* Flyout Items List */}
                            <div className="divide-y divide-zinc-100 max-h-[260px] overflow-y-auto p-1 bg-zinc-50/50">
                              {hoveredBill.items.length > 0 ? (
                                hoveredBill.items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-white rounded flex items-center justify-between gap-2.5 my-1 border border-zinc-100"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {it.image ? (
                                        <img
                                          src={it.image}
                                          alt={it.name}
                                          className="w-8 h-8 rounded object-cover border border-zinc-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 shrink-0">
                                          <ShoppingBag size={14} />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-zinc-900 truncate">
                                          {it.name}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mt-0.5">
                                          {it.size && (
                                            <span className="bg-zinc-100 border border-zinc-200 px-1 rounded font-bold text-zinc-700">
                                              Size: {it.size}
                                            </span>
                                          )}
                                          <span>Qty: {it.quantity}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <p className="text-[11px] font-bold text-zinc-900">
                                        ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                                      </p>
                                      {it.quantity > 1 && (
                                        <p className="text-[9px] text-zinc-400">
                                          ₹{it.price} each
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-center text-zinc-400 text-[10px]">
                                  No item details recorded
                                </div>
                              )}
                            </div>

                            {/* Flyout Summary Footer */}
                            <div className="bg-white p-2.5 border-t border-zinc-200 text-[10px] space-y-1">
                              <div className="flex justify-between text-zinc-500">
                                <span>Subtotal</span>
                                <span>₹{hoveredBill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                              </div>
                              {hoveredBill.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                  <span>Discount</span>
                                  <span>-₹{hoveredBill.discountAmount.toFixed(2)}</span>
                                </div>
                              )}
                              {hoveredBill.tax > 0 && (
                                <div className="flex justify-between text-zinc-500">
                                  <span>Tax / GST</span>
                                  <span>₹{hoveredBill.tax.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-zinc-950 pt-1 border-t border-zinc-100 text-xs">
                                <span>Total Paid</span>
                                <span>₹{hoveredBill.total.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="text-[9px] text-zinc-400 pt-0.5 flex items-center justify-between">
                                <span>Method: {hoveredBill.paymentMethod === "split" && hoveredBill.splitDetails ? `SPLIT (₹${hoveredBill.splitDetails.cash} Cash + ₹${hoveredBill.splitDetails.online} Online)` : hoveredBill.paymentMethod?.toUpperCase()}</span>
                                <span>{hoveredBill.dateStr}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Top 5 Matching Customers Dropdown */}
                {showCustomerDropdown && (customerInfo.phone || "").replace(/\D/g, "").length > 0 && (
                  <div className="absolute left-3 right-3 top-[calc(100%-2px)] z-50 bg-white border border-zinc-300 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-zinc-900 px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-200">
                      <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-white">
                        <Users size={12} />
                        <span>Matching Customers ({matchingCustomers.length})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomerDropdown(false)}
                        className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {matchingCustomers.length > 0 ? (
                      <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto">
                        {matchingCustomers.map((cust, idx) => {
                          const typedDigits = (customerInfo.phone || "").replace(/\D/g, "");
                          const phoneStr = cust.phone;
                          const matchIdx = phoneStr.indexOf(typedDigits);

                          return (
                            <div
                              key={cust.phone + idx}
                              onClick={() => {
                                setCustomerInfo({
                                  phone: cust.phone,
                                  name: cust.name && cust.name !== "Customer" ? cust.name : customerInfo.name
                                });
                                setShowCustomerDropdown(false);
                                toast.success(`Selected: ${cust.name || "Customer"} (${cust.phone})`, {
                                  icon: "👤",
                                  duration: 2000
                                });
                              }}
                              className="p-2.5 hover:bg-amber-50/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-zinc-900 truncate flex items-center gap-1.5">
                                    <span>{cust.name || "Customer"}</span>
                                    {cust.purchasesCount >= 3 && (
                                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1 rounded">
                                        Frequent
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                                    <Phone size={10} className="text-zinc-400 shrink-0" />
                                    <span>
                                      {matchIdx !== -1 ? (
                                        <>
                                          {phoneStr.slice(0, matchIdx)}
                                          <span className="font-black text-amber-800 bg-amber-200/90 px-0.5 rounded">
                                            {phoneStr.slice(matchIdx, matchIdx + typedDigits.length)}
                                          </span>
                                          {phoneStr.slice(matchIdx + typedDigits.length)}
                                        </>
                                      ) : (
                                        phoneStr
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  {/* Times customer has bought */}
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5  rounded text-[10px] font-bold font-mono">
                                    {/* <ShoppingBag size={10} /> */}
                                    <span>
                                      {cust.purchasesCount} {cust.purchasesCount === 1 ? "time" : "times"} bought
                                    </span>
                                  </span>

                                  {/* Total worth amount */}
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5  rounded text-[10px] font-bold font-mono">
                                    <span>
                                      ₹{cust.totalWorth.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total worth
                                    </span>
                                  </span>
                                </div>
                                <ChevronRight size={14} className="text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 transition-all ml-1 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-zinc-500 text-[11px] font-mono">
                        No previous customers matching &ldquo;{(customerInfo.phone || "").replace(/\D/g, "")}&rdquo;
                      </div>
                    )}
               
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-3 divide-y divide-zinc-100">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 font-mono text-xs text-zinc-400">
                    <ShoppingBag size={28} className="text-zinc-300 mb-2" />
                    <p className="font-semibold text-zinc-500">Cart is Empty</p>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px]">
                      Hover or click any product on the left and select a size to add items to cart.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.cartKey} className="py-2.5 flex items-center justify-between text-xs font-mono">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-sans font-medium text-zinc-900 truncate">{item.productName}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                          {item.isBillingProduct || !item.size ? (
                            <span className="px-1.5 py-0.2 bg-amber-100 border border-amber-300 rounded-xs font-bold text-amber-900 text-[9px]">
                              Quick Item
                            </span>
                          ) : (
                            <span className="px-1 bg-zinc-100 border border-zinc-200 rounded-xs font-bold text-zinc-800">
                              Size: {item.size}
                            </span>
                          )}
                          <span>₹{item.price} each</span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-zinc-200 rounded-xs bg-zinc-50">
                          <button
                            onClick={() => updateQuantity(item.cartKey, -1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 text-zinc-700 cursor-pointer transition-colors"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center font-bold text-zinc-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartKey, 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 text-zinc-700 cursor-pointer transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        <span className="w-16 text-right font-bold text-zinc-950 text-xs font-mono">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.cartKey)}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & Payment Method Controls */}
              <div className="p-3.5 border-t border-zinc-150 bg-zinc-50/50 space-y-3 shrink-0 font-mono text-xs">
                {/* Discount Controls (Flat & Percentage with Quick Animation) */}
                {/* Discount Control */}
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-zinc-600 text-[11px] font-medium shrink-0">
                    Discount:
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Mode Switcher Buttons: % vs ₹ */}
                    <div className="inline-flex p-0.5 bg-zinc-200/80 rounded-xs border border-zinc-300/80 gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (discountType !== "percentage") {
                            const converted = subtotal > 0 && flatDiscount > 0
                              ? Math.min(100, Math.round((flatDiscount / subtotal) * 1000) / 10)
                              : 0;
                            setDiscount(converted);
                            setDiscountType("percentage");
                          }
                        }}
                        className={`min-w-[24px] py-0.5 text-center rounded-xs text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
                          discountType === "percentage"
                            ? "bg-zinc-900 text-white font-bold shadow-xs"
                            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60"
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (discountType !== "flat") {
                            const converted = discountAmount > 0
                              ? Math.min(subtotal, Math.round(discountAmount * 100) / 100)
                              : 0;
                            setFlatDiscount(converted);
                            setDiscountType("flat");
                          }
                        }}
                        className={`min-w-[24px] py-0.5 text-center rounded-xs text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
                          discountType === "flat"
                            ? "bg-zinc-900 text-white font-bold shadow-xs"
                            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60"
                        }`}
                      >
                        ₹
                      </button>
                    </div>

                    {/* Simple aesthetic minimum field */}
                    <div className="relative flex items-center">
                      {discountType === "flat" && (
                        <span className="absolute left-2 text-[10px] text-zinc-400 font-mono pointer-events-none">₹</span>
                      )}
                      <input
                        type="number"
                        min="0"
                        max={discountType === "percentage" ? 100 : (subtotal > 0 ? subtotal : undefined)}
                        step="any"
                        placeholder="0"
                        value={
                          discountType === "percentage"
                            ? (discount > 0 ? discount : "")
                            : (flatDiscount > 0 ? flatDiscount : "")
                        }
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            if (discountType === "percentage") {
                              if (val <= 100) setDiscount(val);
                            } else {
                              const capped = subtotal > 0 ? Math.min(subtotal, val) : val;
                              setFlatDiscount(capped);
                            }
                          }
                        }}
                        className={`w-20 py-0.5 rounded-xs text-[11px] border font-mono focus:outline-none focus:border-zinc-900 transition-all ${
                          discountType === "flat" ? "pl-5 pr-2 text-right" : "pl-2 pr-5 text-left"
                        } ${
                          (discountType === "percentage" ? discount > 0 : flatDiscount > 0)
                            ? "bg-zinc-900 text-white border-zinc-900 font-bold placeholder:text-zinc-500"
                            : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300 placeholder:text-zinc-400"
                        }`}
                      />
                      {discountType === "percentage" && (
                        <span className="absolute right-2 text-[10px] text-zinc-400 font-mono pointer-events-none">%</span>
                      )}
                    </div>

                    {/* Clear Button */}
                    {(discountType === "percentage" ? effectiveDiscount > 0 : effectiveFlatDiscount > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscount(0);
                          setFlatDiscount(0);
                        }}
                        title="Clear discount"
                        className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-600 text-[10px] font-semibold uppercase">
                      Payment Method
                    </span>
                    {paymentMethod === "upi" && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                        <QrCode size={10} />
                        QR on Print: Active
                      </span>
                    )}
                    {paymentMethod === "split" && (parseFloat(splitPayment.online) || 0) > 0 && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                        <QrCode size={10} />
                        UPI: ₹{(parseFloat(splitPayment.online) || 0).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[10px]">
                    {[
                      { id: "cash", label: "CASH" },
                      { id: "upi", label: "UPI" },
                      { id: "card", label: "CARD" },
                      { id: "netbanking", label: "NET" },
                      { id: "split", label: "SPLIT" }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(pm.id);
                          if (pm.id === "split" && !splitPayment.cash && !splitPayment.online) {
                            setSplitPayment({ cash: grandTotal > 0 ? grandTotal : "", online: "", lastEdited: "cash" });
                          }
                        }}
                        className={`py-1 rounded-xs border font-bold transition-all text-center cursor-pointer ${
                          paymentMethod === pm.id
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>

                  {/* Animated Split Payment Breakdown Drawer */}
                  <AnimatePresence initial={false}>
                    {paymentMethod === "split" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden pt-2"
                      >
                        <div className="p-2.5 bg-white rounded-xs border border-zinc-200 shadow-2xs space-y-2 font-mono">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                            <span>Split Details</span>
                            {/* <span className="text-zinc-900 font-bold">Total: ₹{grandTotal.toFixed(2)}</span> */}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Cash Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-700 block">
                                Cash Portion:
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-2 text-[10px] text-zinc-400 font-mono pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={grandTotal}
                                  step="any"
                                  placeholder="0"
                                  value={splitPayment.cash}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (valStr === "") {
                                      setSplitPayment({
                                        cash: "",
                                        online: grandTotal > 0 ? grandTotal : "",
                                        lastEdited: "cash"
                                      });
                                      return;
                                    }
                                    const val = parseFloat(valStr);
                                    if (!isNaN(val) && val >= 0) {
                                      const cappedCash = Math.min(grandTotal, val);
                                      const remainingOnline = Math.max(0, Math.round((grandTotal - cappedCash) * 100) / 100);
                                      setSplitPayment({
                                        cash: val > grandTotal ? grandTotal : valStr,
                                        online: remainingOnline > 0 ? remainingOnline : 0,
                                        lastEdited: "cash"
                                      });
                                    }
                                  }}
                                  className="w-full pl-5 pr-2 py-1 rounded-xs text-[11px] font-mono border border-zinc-250 focus:outline-none focus:border-zinc-900 transition-all bg-zinc-50/60 focus:bg-white text-zinc-900 font-bold"
                                />
                              </div>
                            </div>

                            {/* Online / UPI Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <QrCode size={10} />
                                <span>Online (upi):</span>
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-2 text-[10px] text-zinc-400 font-mono pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={grandTotal}
                                  step="any"
                                  placeholder="0"
                                  value={splitPayment.online}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    if (valStr === "") {
                                      setSplitPayment({
                                        online: "",
                                        cash: grandTotal > 0 ? grandTotal : "",
                                        lastEdited: "online"
                                      });
                                      return;
                                    }
                                    const val = parseFloat(valStr);
                                    if (!isNaN(val) && val >= 0) {
                                      const cappedOnline = Math.min(grandTotal, val);
                                      const remainingCash = Math.max(0, Math.round((grandTotal - cappedOnline) * 100) / 100);
                                      setSplitPayment({
                                        online: val > grandTotal ? grandTotal : valStr,
                                        cash: remainingCash > 0 ? remainingCash : 0,
                                        lastEdited: "online"
                                      });
                                    }
                                  }}
                                  className="w-full pl-5 pr-2 py-1 rounded-xs text-[11px] font-mono border border-emerald-300 focus:outline-none focus:border-emerald-600 transition-all bg-emerald-50/40 focus:bg-white text-emerald-950 font-bold"
                                />
                              </div>
                            </div>
                          </div>

                      
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bill Math Summary Table */}
                <div className="pt-2 border-t border-zinc-200 space-y-1 text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <AnimatePresence initial={false}>
                    {discountAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex justify-between text-emerald-600 font-medium py-0.5">
                          <span>Discount ({discountType === "flat" ? "Flat" : `${effectiveDiscount}%`}):</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence initial={false}>
                    {roundOff !== 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex justify-between text-zinc-400 text-[10px] py-0.5">
                          <span>Round Off:</span>
                          <span>{roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between text-sm font-bold text-zinc-950 pt-1.5 border-t border-zinc-200">
                    <span>Grand Total:</span>
                    <span className="text-base text-zinc-950 font-mono">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* Split Summary Breakdown */}
                  {paymentMethod === "split" && (
                    <div className="pt-1.5 border-t border-dashed border-zinc-200 space-y-0.5 text-[10px]">
                      <div className="flex justify-between text-zinc-600">
                        <span>Paid Cash:</span>
                        <span className="font-mono">₹{(parseFloat(splitPayment.cash) || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <QrCode size={10} />
                          <span>Paid Online (UPI):</span>
                        </span>
                        <span className="font-mono">₹{(parseFloat(splitPayment.online) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Process & Print Magnet Restro Invoice Button */}
                <button
                  onClick={handleProcessBillAndPrint}
                  disabled={cart.length === 0}
                  className={`w-full py-2.5 px-4 rounded-xs text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    cart.length > 0
                      ? "bg-zinc-950 hover:bg-zinc-800 text-white cursor-pointer active:scale-[0.99]"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  <Printer size={15} />
                  <span>PROCESS & PRINT THERMAL INVOICE</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Billing History & Search */}
        {activeTab === "history" && (
          <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/50 font-mono">
            <div className="max-w-6xl mx-auto space-y-4">
              {/* History Search Header */}
              <div className="bg-white p-3 rounded-xs border border-zinc-150 shadow-xs flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search history by Bill #, Customer Name, Phone, or Cashier..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xs text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <div className="text-xs font-mono text-zinc-500">
                  Total Bills Recorded: <span className="font-bold text-zinc-900">{billsHistory.length}</span>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-xs border border-zinc-150 overflow-hidden shadow-xs">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-150 text-[10px] uppercase text-zinc-500">
                    <tr>
                      <th className="p-3">Bill Number</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Cashier Staff</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Grand Total</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-zinc-400">
                          No bill history matches your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => {
                        const itemsCount = (bill.items || []).reduce((sum, i) => sum + i.quantity, 0);
                        const formattedDate = new Date(bill.createdAt || bill._creationTime).toLocaleDateString("en-GB");
                        const formattedTime = new Date(bill.createdAt || bill._creationTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        });

                        return (
                          <tr key={bill._id} className="hover:bg-zinc-50 transition-colors">
                            <td className="p-3 font-bold text-zinc-950">{bill.billNumber}</td>
                            <td className="p-3 text-zinc-500 text-[11px]">
                              {formattedDate} {formattedTime}
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded-xs border border-zinc-200 text-[11px]">
                                {bill.createdBy || "POS Cashier"}
                              </span>
                            </td>
                            <td className="p-3">
                              {bill.customerName || bill.customerPhone ? (
                                <div>
                                  <div className="font-medium text-zinc-900">{bill.customerName || "Guest"}</div>
                                  <div className="text-[10px] text-zinc-400">{bill.customerPhone || "No Phone"}</div>
                                </div>
                              ) : (
                                <span className="text-zinc-400 italic">Walk-in Guest</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 rounded-xs text-[10px] font-bold uppercase border border-zinc-200">
                                {bill.paymentMethod || "cash"}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-zinc-950">₹{(bill.total || 0).toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => executeMagnetRestroPrint(bill)}
                                  className="px-2.5 py-1 bg-zinc-900 text-white rounded-xs text-[10px] font-mono hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
                                  title="Reprint Magnet Restro Thermal Bill"
                                >
                                  <Printer size={12} />
                                  <span>Reprint</span>
                                </button>
                                {bill.customerPhone && (
                                  <button
                                    onClick={() => setRecoveryModalData(bill)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xs text-[10px] font-mono flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                    title="Send WhatsApp Bill"
                                  >
                                    <MessageCircle size={12} />
                                    <span>WhatsApp</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Quick Billing Products Management (Asking Name & Price) */}
        {activeTab === "billing_products" && (
          <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/50 font-mono">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Info */}
              <div className="bg-white p-4 rounded-xs border border-zinc-150 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-zinc-950 font-sans tracking-tight flex items-center gap-2">
                    <Package size={16} className="text-amber-500" />
                    <span>Quick Billing Products Management</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Add products directly to the billing section asking only Name and Price.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-900 font-bold rounded-xs border border-amber-300">
                    {billingProductsData.length} Quick Products
                  </span>
                </div>
              </div>

              {/* Form & List Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Card: Add / Edit Product Form */}
                <div className="bg-white p-5 rounded-xs border border-zinc-150 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
                    <h3 className="font-sans font-bold text-sm text-zinc-900 flex items-center gap-2">
                      <Plus size={14} className="text-amber-500" />
                      <span>{editingBillingProduct ? "Edit Billing Product" : "Add Billing Product"}</span>
                    </h3>
                    {editingBillingProduct && (
                      <button
                        type="button"
                        onClick={handleCancelEditBillingProduct}
                        className="text-[10px] text-zinc-400 hover:text-zinc-600 hover:underline cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveBillingProduct} className="space-y-4 text-xs">
                    {/* Product Name Input */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1.5">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Gift Box Packaging, Alteration, Belt..."
                        value={newBillingProductForm.name}
                        onChange={(e) => setNewBillingProductForm({ ...newBillingProductForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400 transition-colors"
                      />
                    </div>

                    {/* Price Input */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1.5">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          value={newBillingProductForm.price}
                          onChange={(e) => setNewBillingProductForm({ ...newBillingProductForm, price: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xs text-zinc-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingBillingProduct}
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 rounded-xs font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs border border-amber-500/30"
                      >
                        {isSubmittingBillingProduct ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Saving Product...</span>
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            <span>{editingBillingProduct ? "Update Product" : "Save to Billing Section"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Card: Products Table / List */}
                <div className="lg:col-span-2 bg-white rounded-xs border border-zinc-150 shadow-2xs overflow-hidden flex flex-col">
                  {/* List Header Search */}
                  <div className="p-3 bg-zinc-50 border-b border-zinc-150 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search quick products by name or Item ID..."
                        value={billingProductSearchQuery}
                        onChange={(e) => setBillingProductSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xs text-xs font-mono text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Showing <span className="font-bold text-zinc-900">{filteredBillingProductsList.length}</span> items
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-zinc-100/70 border-b border-zinc-150 text-[10px] uppercase text-zinc-500">
                        <tr>
                          <th className="p-3">Item ID</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Price</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredBillingProductsList.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-12 text-center text-zinc-400">
                              No billing products found. Use the form to add a product asking only Name & Price!
                            </td>
                          </tr>
                        ) : (
                          filteredBillingProductsList.map((bp) => (
                            <tr key={bp._id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="p-3 text-zinc-500 font-bold">{bp.itemId}</td>
                              <td className="p-3">
                                <span className="font-sans font-bold text-zinc-950">{bp.name}</span>
                                <span className="ml-2 px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[9px] rounded-xs border border-amber-300 font-bold">
                                  Quick Item
                                </span>
                              </td>
                              <td className="p-3 font-bold text-zinc-950">₹{bp.price.toFixed(2)}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleStartEditBillingProduct(bp)}
                                    className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBillingProduct(bp._id, bp.name)}
                                    className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Admin User & Cashier Management Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xs border border-zinc-200 shadow-xl max-w-lg w-full p-5 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-zinc-800" />
                  <h3 className="font-sans font-bold text-sm text-zinc-950">POS Cashier User Management</h3>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Create New User Form (Name, Role, PIN only) */}
              <form onSubmit={handleCreateNewUser} className="bg-zinc-50 border border-zinc-200 rounded-xs p-3 mb-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-800 uppercase">
                  <UserPlus size={13} className="text-emerald-600" />
                  <span>Create New Staff Account</span>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full px-2.5 py-1 bg-white border border-zinc-200 rounded-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase block mb-1">Access Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-bold"
                    >
                      <option value="user">User (Cashier - Billing Only)</option>
                      <option value="admin">Admin (Supervisor - Full Access)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase block mb-1">4-Digit Security PIN</label>
                    <input
                      type="password"
                      required
                      maxLength={10}
                      placeholder="Pin"
                      value={newUserForm.pin}
                      onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value })}
                      className="w-full px-2.5 py-1 bg-white border border-zinc-200 rounded-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-bold font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xs text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Save & Register User Account
                </button>
              </form>

              {/* Registered Cashiers List */}
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">
                  Active POS Cashier Accounts ({registeredUsers.length}):
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {registeredUsers.map((usr) => (
                    <div
                      key={usr.id}
                      className="p-2 bg-white border border-zinc-200 rounded-xs flex items-center justify-between hover:border-zinc-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xs bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs">
                          {usr.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">{usr.name}</div>
                          <div className="text-[10px] text-zinc-400">
                            ID: <span className="font-mono text-zinc-600">{usr.username}</span> • Role:{" "}
                            <span className={usr.role === "admin" ? "text-emerald-600 font-bold" : "text-blue-600 font-bold"}>
                              {usr.role.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeCashier?.id === usr.id && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-xs border border-emerald-200">
                            ACTIVE NOW
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteUser(usr.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Cashier"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-150 mt-4 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-1.5 bg-zinc-900 text-white rounded-xs text-xs font-mono font-bold cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal: Bill Preview on Left, Editable Fields on Right */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-lg border border-zinc-200 shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-150 bg-zinc-50/70 shrink-0">
                <div className="flex items-center gap-2.5">
            
                  <div>
                    <h3 className="font-sans font-bold text-sm text-zinc-950">Store & Thermal Receipt Settings</h3>
                
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="text-zinc-400 hover:text-zinc-800 p-1.5 rounded-md hover:bg-zinc-200/60 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: 2 Columns */}
              {(() => {
                const currentEditingBranch = branches[editingBranchId] || branches.patna || DEFAULT_STORE_SETTINGS;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 flex-1 min-h-0 overflow-y-auto">
                    {/* Left Column: Live Thermal Bill Preview */}
                    <div className="md:col-span-5 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ReceiptIcon size={13} className="text-zinc-500" />
                          <span>Preview: {currentEditingBranch.name || editingBranchId.toUpperCase()}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200">
                          80mm Thermal
                        </span>
                      </div>

                      <div className="bg-zinc-100 rounded-md border border-zinc-200 p-3 flex-1 flex justify-center items-start overflow-y-auto max-h-[520px]">
                        {/* Realistic Thermal Paper Container */}
                        <div className="w-full max-w-[270px] bg-white rounded-xs shadow-md p-3.5 text-zinc-950 font-sans border-t-4 border-zinc-900 text-xs select-none">
                          {/* Brand Header */}
                          <div className="text-center">
                            <img
                              src="/logo_t.svg"
                              alt="Logo"
                              className="w-16 h-auto mx-auto mb-1.5 block"
                            />
                            <h4 className="font-black text-[13px] uppercase tracking-wider text-zinc-950">
                              {currentEditingBranch.storeName || "AESTHETX WAYS"}
                            </h4>
                            <p className="text-[10px] font-bold text-zinc-700 leading-tight mt-1 px-1">
                              {currentEditingBranch.storeAddress || "Kankarbagh Colony More, Patna, Bihar"}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-600 mt-0.5">
                              Support: {currentEditingBranch.phone || storeSettings.phone || "+91 70337 69997"}
                            </p>
                            <p className="text-[9px] font-black font-mono text-zinc-900 mt-0.5">
                              GSTIN: {currentEditingBranch.gstin || storeSettings.gstin || "10AAACA0000A1Z5"}
                            </p>
                          </div>

                          {/* Dashed Divider */}
                          <div className="my-2 border-b border-dashed border-zinc-400" />

                          {/* Meta Information */}
                          <div className="space-y-0.5 text-[10px] font-mono font-bold text-zinc-700">
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>21/09/2026 14:32</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bill No.:</span>
                              <span className="text-zinc-950">#AW-98421</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Customer:</span>
                              <span className="text-zinc-950">Walk-in Guest</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Partner:</span>
                              <span>{activeCashier?.name || "Staff"}</span>
                            </div>
                          </div>

                          {/* Dashed Divider */}
                          <div className="my-2 border-b border-dashed border-zinc-400" />

                          {/* Sample Items Table */}
                          <div className="text-[10px]">
                            <div className="flex justify-between font-black uppercase text-zinc-900 border-b border-dashed border-zinc-400 pb-1 mb-1 font-mono">
                              <span>Item</span>
                              <span>Qty</span>
                              <span>Amt</span>
                            </div>
                            <div className="space-y-1 font-medium">
                              <div className="flex justify-between items-start">
                                <div className="max-w-[150px] leading-tight">
                                  <span className="font-bold">Oversized Tee</span>
                                  <div className="text-[9px] text-zinc-500 font-mono">Size: L</div>
                                </div>
                                <span className="font-mono">1</span>
                                <span className="font-mono font-bold">₹899.00</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <div className="max-w-[150px] leading-tight">
                                  <span className="font-bold">Relaxed Cargo</span>
                                  <div className="text-[9px] text-zinc-500 font-mono">Size: 32</div>
                                </div>
                                <span className="font-mono">1</span>
                                <span className="font-mono font-bold">₹1,299.00</span>
                              </div>
                            </div>
                          </div>

                          {/* Dashed Divider */}
                          <div className="my-2 border-b border-dashed border-zinc-400" />

                          {/* Bill Calculation */}
                          <div className="space-y-0.5 text-[10px] font-bold">
                            <div className="flex justify-between text-zinc-600">
                              <span>Total Qty: 2</span>
                              <span>Subtotal: ₹2,198.00</span>
                            </div>
                            <div className="flex justify-between text-emerald-700">
                              <span>Discount (10%):</span>
                              <span>-₹219.80</span>
                            </div>
                            <div className="flex justify-between text-[13px] font-black text-zinc-950 border-t border-dashed border-zinc-400 pt-1 mt-1 font-mono">
                              <span>Grand Total:</span>
                              <span>₹1,978.20</span>
                            </div>
                          </div>

                          {/* Dashed Divider */}
                          <div className="my-2 border-b border-dashed border-zinc-400" />

                          {/* Dynamic UPI QR Code Preview */}
                          <div className="text-center my-1.5">
                            <div className="text-[9px] font-black tracking-wider uppercase text-zinc-900 mb-1">
                              SCAN TO PAY VIA UPI
                            </div>
                            <div className="relative inline-block bg-white p-1 rounded-xs border border-zinc-200">
                              {previewQrDataUrl ? (
                                <img
                                  src={previewQrDataUrl}
                                  alt="Scan to Pay via UPI"
                                  className="w-24 h-24 block mx-auto"
                                />
                              ) : (
                                <div className="w-24 h-24 bg-zinc-100 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                                  QR Code
                                </div>
                              )}
                              {/* Circular Logo in center of QR */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden shadow-2xs">
                                <img src="/logo_t.svg" alt="Logo" className="w-full h-full object-contain" />
                              </div>
                            </div>
                            <div className="text-xs font-black font-mono mt-1 text-zinc-950">
                              ₹1,978.20
                            </div>
                            <div className="text-[9px] font-bold font-mono text-zinc-700 mt-0.5 break-all">
                              UPI ID: {currentEditingBranch.upiId || storeSettings.upiId || "8008439762@ptsbi"}
                            </div>
                          </div>

                          {/* Dashed Divider */}
                          <div className="my-2 border-b border-dashed border-zinc-400" />

                          {/* Receipt Footer */}
                          <div className="text-center pt-0.5">
                            <div className="inline-block border border-zinc-950 px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-xs mb-1">
                              PAID VIA UPI
                            </div>
                            <p className="text-[10px] font-bold italic text-zinc-800 leading-tight">
                              "{storeSettings.thankYouMessage || "Thank you for shopping with us..!!"}"
                            </p>
                            <p className="text-[9px] font-bold text-zinc-600 mt-1 uppercase tracking-wider">
                              Visit Our Store Online<br />
                              <span className="font-mono text-zinc-950">{storeSettings.websiteUrl || "aesthetxways.com"}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Location Switcher & Editable Fields */}
                    <div className="md:col-span-7 flex flex-col justify-between">
                      {/* Location Switcher: Gaya vs Patna (Same as Navbar) */}
                      <div className="flex items-center p-0.5 bg-zinc-100 rounded-md border border-zinc-200 font-mono text-xs mb-3 w-fit">
                        <button
                          type="button"
                          onClick={() => setEditingBranchId("gaya")}
                          className={`px-3 py-1.5 rounded-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            editingBranchId === "gaya"
                              ? "bg-zinc-950 text-white shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                          }`}
                          title="Gaya Store"
                        >
                          <MapPin size={12} className={editingBranchId === "gaya" ? "text-emerald-400" : "text-zinc-400"} />
                          <span>Gaya</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBranchId("patna")}
                          className={`px-3 py-1.5 rounded-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            editingBranchId === "patna"
                              ? "bg-zinc-950 text-white shadow-xs"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                          }`}
                          title="Patna Store"
                        >
                          <MapPin size={12} className={editingBranchId === "patna" ? "text-emerald-400" : "text-zinc-400"} />
                          <span>Patna</span>
                        </button>
                      </div>

                      {/* Edit Location Fields */}
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          localStorage.setItem("pos_branches", JSON.stringify(branches));
                          const activeBranchInfo = branches[activeBranch] || branches.patna;
                          const merged = {
                            ...storeSettings,
                            storeName: activeBranchInfo.storeName,
                            storeAddress: activeBranchInfo.storeAddress,
                            phone: activeBranchInfo.phone,
                            gstin: activeBranchInfo.gstin,
                            upiId: activeBranchInfo.upiId,
                          };
                          setStoreSettings(merged);
                          localStorage.setItem("pos_store_settings", JSON.stringify(merged));
                          await saveBranchesToServer(branches, activeBranch);
                          setShowSettingsModal(false);
                          toast.success("Saved Location & Store Settings to Convex Database!");
                        }}
                        className="space-y-3 font-sans"
                      >
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Location Display Name */}
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                                Location Name
                              </label>
                              <input
                                type="text"
                                value={currentEditingBranch.name || ""}
                                onChange={(e) => updateBranchField(editingBranchId, "name", e.target.value)}
                                placeholder="e.g. Patna Branch"
                                className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all"
                              />
                            </div>

                            {/* Store / Brand Name on Bill */}
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                                Store Name on Bill
                              </label>
                              <input
                                type="text"
                                value={currentEditingBranch.storeName || ""}
                                onChange={(e) => updateBranchField(editingBranchId, "storeName", e.target.value)}
                                placeholder="e.g. AESTHETX WAYS (PATNA)"
                                className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Store Location / Address */}
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                              Location Address ({currentEditingBranch.name || editingBranchId})
                            </label>
                            <textarea
                              rows={2}
                              value={currentEditingBranch.storeAddress || ""}
                              onChange={(e) => updateBranchField(editingBranchId, "storeAddress", e.target.value)}
                              placeholder="e.g. Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001"
                              className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all resize-none"
                            />
                          </div>

                          {/* UPI ID Field for this location */}
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-zinc-900 uppercase tracking-wider">
                                UPI ID for {currentEditingBranch.name || editingBranchId}
                              </label>
                              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-xs border border-emerald-200">
                                Dynamic QR
                              </span>
                            </div>
                            <input
                              type="text"
                              value={currentEditingBranch.upiId || ""}
                              onChange={(e) => updateBranchField(editingBranchId, "upiId", e.target.value)}
                              placeholder="e.g. 8008439762@ptsbi"
                              className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-mono font-bold focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all text-zinc-900"
                            />
                            <p className="text-[10px] text-zinc-500 font-sans">
                              Dynamic QR printed for bills at this location will receive payments here.
                            </p>
                          </div>

                          {/* Support Phone & GSTIN */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                                Support Phone
                              </label>
                              <input
                                type="text"
                                value={currentEditingBranch.phone || storeSettings.phone || ""}
                                onChange={(e) => updateBranchField(editingBranchId, "phone", e.target.value)}
                                placeholder="e.g. +91 70337 69997"
                                className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                                GSTIN
                              </label>
                              <input
                                type="text"
                                value={currentEditingBranch.gstin || storeSettings.gstin || ""}
                                onChange={(e) => updateBranchField(editingBranchId, "gstin", e.target.value)}
                                placeholder="e.g. 10AAACA0000A1Z5"
                                className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Thank You Note & Website URL */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                                Thank You Note (Footer)
                              </label>
                              <input
                                type="text"
                                value={storeSettings.thankYouMessage || ""}
                                onChange={(e) => setStoreSettings({ ...storeSettings, thankYouMessage: e.target.value })}
                                placeholder="e.g. Thank you for shopping with us..!!"
                                className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
                                Website URL
                              </label>
                              <input
                                type="text"
                                value={storeSettings.websiteUrl || ""}
                                onChange={(e) => setStoreSettings({ ...storeSettings, websiteUrl: e.target.value })}
                                placeholder="e.g. aesthetxways.com"
                                className="w-full px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-mono font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 focus:outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Bottom Action Buttons */}
                          <div className="pt-3 flex items-center justify-between border-t border-zinc-150 mt-3">
                            <Link
                              href="/website/settings"
                              className="text-xs text-zinc-500 hover:text-zinc-950 underline flex items-center gap-1 font-mono font-medium"
                            >
                              <span>Full Website Settings</span>
                              <ArrowRight size={12} />
                            </Link>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowSettingsModal(false)}
                                className="px-3.5 py-1.5 border border-zinc-200 hover:bg-zinc-100 rounded-md text-xs font-mono font-medium text-zinc-700 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
                              >
                                Save Settings
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Recovery Modal */}
      {recoveryModalData && (
        <WhatsAppRecoveryModal
          bill={recoveryModalData}
          onClose={() => setRecoveryModalData(null)}
        />
      )}
    </div>
  );
}
