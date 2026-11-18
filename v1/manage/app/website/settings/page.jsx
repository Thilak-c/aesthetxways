"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Smartphone,
  MessageSquare,
  QrCode,
  MapPin,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Power,
  Wrench,
  Phone,
  Building2,
  Sparkles,
  Send,
  Copy,
  Check,
  Globe,
  Sliders,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_BRANCHES = {
  patna: {
    id: "patna",
    name: "Patna Branch",
    storeName: "AESTHETX WAYS (PATNA)",
    storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJZSX8QQBZ7TkRVKYOUyR8pTE",
  },
  gaya: {
    id: "gaya",
    name: "Gaya Branch",
    storeName: "AESTHETX WAYS (GAYA)",
    storeAddress: "Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ15OdAgAr8zkRvzNUY2o324E",
  },
};

export default function WebsiteSettings() {
  // Store branches & POS Settings
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [activeBranch, setActiveBranch] = useState("patna");
  const [whatsappClientId, setWhatsappClientId] = useState("7033769997");

  // WhatsApp Live Gateway State
  const [waStatus, setWaStatus] = useState({
    loading: true,
    state: "INITIALIZING",
    authenticated: false,
    clientInfo: null,
    qrBase64: null,
    qrCodeAvailable: false,
    error: null,
  });
  const [isRefreshingWa, setIsRefreshingWa] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showPairNew, setShowPairNew] = useState(false);
  const [newNumberInput, setNewNumberInput] = useState("");

  // WhatsApp Dual Linking (QR vs Phone Pairing Code)
  const [waLinkMode, setWaLinkMode] = useState("qr"); // "qr" or "phone"
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState(null);
  const [isRequestingPairingCode, setIsRequestingPairingCode] = useState(false);

  const handleRequestPairingCode = async (e) => {
    e?.preventDefault();
    const phoneToPair = pairingPhone || newNumberInput || whatsappClientId;
    if (!phoneToPair || phoneToPair.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setIsRequestingPairingCode(true);
    toast.loading("Generating 8-character pairing code from OpenWA...", { id: "wa-pair" });
    try {
      const res = await fetch("/api/whatsapp/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: whatsappClientId, phone: phoneToPair })
      });
      const data = await res.json();
      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
        toast.success(`Pairing code received: ${data.pairingCode}`, { id: "wa-pair", duration: 8000 });
        fetchWhatsAppStatus(whatsappClientId, true);
      } else {
        toast.error(data.error || "Failed to generate pairing code", { id: "wa-pair" });
      }
    } catch (err) {
      toast.error(err.message || "Failed to contact gateway", { id: "wa-pair" });
    } finally {
      setIsRequestingPairingCode(false);
    }
  };

  // Test Message Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "✨ Test notification from Aesthetx Ways Management POS."
  );
  const [isSendingTest, setIsSendingTest] = useState(false);

  // General Settings & Copy state
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(null);

  // Convex site status
  const siteStatus = useQuery(api.siteSettings.getSiteStatus);
  const setSiteStatusMutation = useMutation(api.siteSettings.setSiteStatus);
  const [customMessage, setCustomMessage] = useState("");
  const currentStatus = siteStatus?.status || "open";

  useEffect(() => {
    if (siteStatus?.message) {
      setCustomMessage(siteStatus.message);
    }
  }, [siteStatus]);

  // Load Settings from MongoDB on mount
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/pos-settings");
      const data = await res.json();
      if (data.success) {
        if (data.branches) setBranches(data.branches);
        if (data.activeBranch) setActiveBranch(data.activeBranch);
        if (data.whatsapp?.clientId) setWhatsappClientId(data.whatsapp.clientId);
      }
    } catch (err) {
      console.error("Failed to load settings from MongoDB:", err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Fetch WhatsApp Gateway Status
  const fetchWhatsAppStatus = useCallback(
    async (targetId = whatsappClientId, isSilent = false) => {
      if (!targetId) return;
      if (!isSilent) {
        setWaStatus((prev) => ({ ...prev, loading: true }));
      }
      try {
        const res = await fetch(
          `/api/whatsapp/status?clientId=${encodeURIComponent(targetId)}&_t=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          }
        );
        const data = await res.json();
        if (data.success) {
          const nextState = data.state || "DISCONNECTED";
          const nextAuthenticated = Boolean(data.authenticated);
          const nextQrAvailable = Boolean(data.qrCodeAvailable);
          const nextQrBase64 = data.qrBase64 || null;
          const nextClientInfo = data.clientInfo || null;

          setWaStatus((prev) => {
            // Check if status changed to prevent redundant re-renders
            if (
              !prev.loading &&
              prev.state === nextState &&
              prev.authenticated === nextAuthenticated &&
              prev.qrCodeAvailable === nextQrAvailable &&
              prev.qrBase64 === nextQrBase64 &&
              prev.clientInfo?.number === nextClientInfo?.number &&
              prev.clientInfo?.pushname === nextClientInfo?.pushname
            ) {
              return prev;
            }

            return {
              loading: false,
              state: nextState,
              authenticated: nextAuthenticated,
              clientInfo: nextClientInfo,
              qrBase64: nextQrBase64,
              qrCodeAvailable: nextQrAvailable,
              error: null,
            };
          });

          // Reset pairing code display once successfully linked
          if (nextState === "READY") {
            setPairingCode(null);
          }
        } else {
          setWaStatus((prev) => {
            if (!prev.loading && prev.state === "DISCONNECTED" && prev.error === data.error) {
              return prev;
            }
            return {
              ...prev,
              loading: false,
              state: "DISCONNECTED",
              authenticated: false,
              error: data.error || "Gateway unreachable",
            };
          });
        }
      } catch (err) {
        setWaStatus((prev) => {
          if (!prev.loading && prev.state === "DISCONNECTED") return prev;
          return {
            ...prev,
            loading: false,
            state: "DISCONNECTED",
            authenticated: false,
            error: "Connection timeout to gateway",
          };
        });
      }
    },
    [whatsappClientId]
  );

  // Continuous live auto-update polling (every 3 seconds)
  // Ensures all states (READY, DISCONNECTED, QR_REQUIRED, INITIALIZING, phone pairing code)
  // auto-update in real time without having to click refresh or reload the page.
  useEffect(() => {
    // Initial fetch (shows initial loading state)
    fetchWhatsAppStatus(whatsappClientId, false);

    // Continuous background poll every 3 seconds (silent, no layout flicker)
    const interval = setInterval(() => {
      fetchWhatsAppStatus(whatsappClientId, true);
    }, 3000);

    // Immediate update when user refocuses or returns to tab
    const handleFocus = () => {
      fetchWhatsAppStatus(whatsappClientId, true);
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [whatsappClientId, fetchWhatsAppStatus]);

  // Manual Refresh WhatsApp
  const handleRefreshWhatsApp = async () => {
    setIsRefreshingWa(true);
    await fetchWhatsAppStatus(whatsappClientId);
    setIsRefreshingWa(false);
    toast.success("WhatsApp status refreshed");
  };

  // Disconnect / Purge Session
  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to delete this WhatsApp connection? This will disconnect the current number and allow you to pair a new one.`)) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/whatsapp/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: whatsappClientId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("WhatsApp connection deleted! You can now link a new number.");
        setPairingCode(null);
        setShowPairNew(true);
        setWaStatus({
          loading: true,
          state: "INITIALIZING",
          authenticated: false,
          clientInfo: null,
          qrBase64: null,
          qrCodeAvailable: false,
          error: null,
        });
        await fetchWhatsAppStatus(whatsappClientId, false);
      } else {
        toast.error(data.error || "Failed to disconnect session");
      }
    } catch (err) {
      toast.error("Failed to disconnect WhatsApp gateway session");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Switch or Pair New Number
  const handlePairNewSession = async (e) => {
    e.preventDefault();
    const cleanNumber = newNumberInput.replace(/\D/g, "").slice(-10);
    if (cleanNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setWhatsappClientId(cleanNumber);
    setShowPairNew(false);
    setNewNumberInput("");
    setWaStatus({
      loading: true,
      state: "INITIALIZING",
      authenticated: false,
      clientInfo: null,
      qrBase64: null,
      qrCodeAvailable: false,
      error: null,
    });

    try {
      await fetch("/api/pos-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp: { clientId: cleanNumber, phone: `+91${cleanNumber}` },
        }),
      });
      toast.success(`Switching to WhatsApp account ${cleanNumber}...`);
      setTimeout(() => {
        fetchWhatsAppStatus(cleanNumber);
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  };

  // Send Test Message
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    const clean = testPhone.replace(/\D/g, "");
    if (!clean || clean.length < 10) {
      toast.error("Enter a valid 10-digit recipient phone number");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clean,
          message: testMessage,
          clientId: whatsappClientId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Test WhatsApp message sent to ${clean}!`);
        setShowTestModal(false);
      } else {
        toast.error(data.error || "Failed to send test message");
      }
    } catch (err) {
      toast.error("Error sending test message");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Save All Settings
  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        branches,
        activeBranch,
        whatsapp: {
          clientId: whatsappClientId,
          phone: `+91${whatsappClientId}`,
        },
      };

      const res = await fetch("/api/pos-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Settings saved successfully to MongoDB!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Convex Site Status Update
  const handleSetStatus = async (status) => {
    try {
      await setSiteStatusMutation({ status, message: customMessage });
      toast.success(`Website status set to ${status.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to update website status");
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(key);
    setTimeout(() => setCopiedUpi(null), 2000);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex-1 p-4 lg:p-8 bg-[#fafafa] text-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-7">
      

        {/* ======================================================== */}
        {/* SECTION 1: Registered WhatsApp Account & Live Pairing   */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
             
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    Registered WhatsApp Account
                  </h2>
                
                </div>
               
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRefreshWhatsApp}
                disabled={isRefreshingWa}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                title="Refresh Status"
              >
                <RefreshCw size={13} className={isRefreshingWa ? "animate-spin text-gray-500" : "text-gray-500"} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTestModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Send size={13} />
                <span>Send Test</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (waStatus.state === "READY") {
                    handleDisconnect();
                  } else {
                    setShowPairNew(!showPairNew);
                  }
                }}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Delete Connection or Change Phone Number"
              >
                <Trash2 size={13} className={isDisconnecting ? "animate-spin text-rose-600" : "text-rose-600"} />
                <span>
                  {isDisconnecting
                    ? "Disconnecting..."
                    : waStatus.state === "READY"
                    ? "Delete Connection"
                    : showPairNew
                    ? "Close"
                    : "Change Number"}
                </span>
              </button>
            </div>
          </div>

          {/* Active Session Card (White Theme) */}
          <div className="grid gap-6 items-start">
            <div className="space-y-4">
           

              {/* Pair New Number Form Collapse */}
              {showPairNew && (
                <form
                  onSubmit={handlePairNewSession}
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone size={15} className="text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Provision New WhatsApp Session
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNumberInput}
                      onChange={(e) => setNewNumberInput(e.target.value)}
                      placeholder="e.g. 7033769997"
                      maxLength={10}
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Initialize & Pair
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Entering a new 10-digit number will switch the gateway session and present a live QR code if not already linked.
                  </p>
                </form>
              )}
            </div>

            {/* WhatsApp Device Pairing Card (Dual Mode: QR Code / Phone Pairing Code) */}
            <div className="lg:col-span-5 bg-[#fcfdfd] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[300px] shadow-xs">
              {waStatus.state === "READY" ? (
                <div className="space-y-4 py-4 w-full">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Session Is Live & Authenticated</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                      WhatsApp gateway is actively monitoring and ready to dispatch receipts from{" "}
                      <span className="font-mono text-emerald-700 font-bold">
                        {waStatus.clientInfo?.number ? `+${waStatus.clientInfo.number}` : `+${whatsappClientId}`}
                      </span>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowTestModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Send size={12} className="text-emerald-600" /> Send Test Invoice Ping
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Delete connection to pair a different WhatsApp number"
                    >
                      <Trash2 size={12} className={isDisconnecting ? "animate-spin text-rose-600" : "text-rose-600"} />
                      <span>{isDisconnecting ? "Deleting..." : "Delete Connection / Change Number"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  {/* Mode Selector Tabs */}
                  <div className="flex bg-gray-100 p-1 rounded-lg max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => setWaLinkMode("qr")}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                        waLinkMode === "qr"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Scan QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaLinkMode("phone")}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                        waLinkMode === "phone"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Phone Code
                    </button>
                  </div>

                  {waLinkMode === "qr" ? (
                    waStatus.qrBase64 ? (
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl inline-block shadow-md border border-gray-200 mx-auto">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={waStatus.qrBase64}
                            alt="WhatsApp QR Code"
                            className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-800 text-sm flex items-center justify-center gap-1.5">
                            <QrCode size={15} />
                            Scan to Link WhatsApp
                          </h4>
                          <p className="text-[11px] text-gray-600 max-w-xs mx-auto mt-1 leading-relaxed">
                            1. Open WhatsApp on your phone<br />
                            2. Tap <strong>Linked Devices → Link a device</strong><br />
                            3. Scan this QR code
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[11px] text-gray-500">
                          <RefreshCw size={11} className="animate-spin text-amber-600" />
                          <span>Auto-checking pairing status every 3s...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-6">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                          <QrCode size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            {waStatus.state === "INITIALIZING" ? "Initializing OpenWA Gateway..." : "Session Inactive"}
                          </h4>
                          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                            {waStatus.state === "INITIALIZING"
                              ? "Connecting to WhatsApp engine. QR code will appear in seconds..."
                              : "Click below to generate a new live QR code."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            toast.loading("Requesting live QR code...", { id: "wa-gen-qr" });
                            fetchWhatsAppStatus(whatsappClientId, false).then(() => {
                              toast.dismiss("wa-gen-qr");
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                        >
                          <RefreshCw size={12} />
                          Generate QR Code
                        </button>
                      </div>
                    )
                  ) : (
                    /* Phone Number 8-digit Pairing Code Option */
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-left space-y-3 shadow-2xs">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Link via 8-Digit Pairing Code</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                          Link without scanning a QR code. OpenWA generates an 8-character pairing code to type into WhatsApp.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Phone Number</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={pairingPhone || newNumberInput || whatsappClientId}
                            onChange={(e) => setPairingPhone(e.target.value)}
                            placeholder="e.g. 918008439762"
                            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-900 focus:outline-none focus:bg-white focus:border-gray-900"
                          />
                          <button
                            type="button"
                            onClick={handleRequestPairingCode}
                            disabled={isRequestingPairingCode}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isRequestingPairingCode ? "Generating..." : "Get Code"}
                          </button>
                        </div>
                      </div>

                      {pairingCode && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1.5">
                          <span className="text-[9px] font-bold uppercase text-emerald-800 tracking-wider block">Your 8-Digit WhatsApp Pairing Code</span>
                          <div className="font-mono text-xl font-black text-emerald-700 tracking-widest bg-white py-1 px-3 rounded-md inline-block border border-emerald-200 shadow-2xs">
                            {pairingCode.length === 8 ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}` : pairingCode}
                          </div>
                          <p className="text-[10px] text-emerald-800 leading-normal">
                            1. Open WhatsApp &rarr; <strong>Settings</strong> &rarr; <strong>Linked Devices</strong><br />
                            2. Tap <strong>Link a device</strong> &rarr; <strong>Link with phone number instead</strong><br />
                            3. Enter this code on your phone
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: Store Branches & UPI Routing Configuration    */}
        {/* ======================================================== */}
        <div className="space-y-4">
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PATNA BRANCH CARD */}
            <div
              className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-xs ${activeBranch === "patna"
                  ? "border-gray-400 ring-2 ring-gray-900/5"
                  : "border-gray-200"
                }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold font-mono text-xs">
                    PT
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Patna Store</h3>
                    <p className="text-[11px] text-gray-400 font-mono">Flagship Store</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                    ID: patna
                  </span>
                  {activeBranch === "patna" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active POS
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Store Name */}
                <div>
                  <label className="text-gray-600 font-semibold mb-1 block">Store Display Name</label>
                  <input
                    type="text"
                    value={branches.patna?.storeName || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        patna: { ...branches.patna, storeName: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {/* Primary UPI ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-800 font-bold flex items-center gap-1">
                      <CreditCard size={12} className="text-emerald-600" />
                      UPI ID (POS QR Routing)
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(branches.patna?.upiId, "patna")}
                      className="text-[10px] font-mono text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUpi === "patna" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={branches.patna?.upiId || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        patna: { ...branches.patna, upiId: e.target.value },
                      })
                    }
                    placeholder="aesthetxways07@okicici"
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg px-3 py-2 text-emerald-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Dynamic UPI QR codes on Patna receipts will route customer payments to this VPA.
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-gray-600 font-semibold mb-1 block flex items-center gap-1">
                    <Phone size={12} className="text-gray-400" />
                    Store Phone Number
                  </label>
                  <input
                    type="text"
                    value={branches.patna?.phone || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        patna: { ...branches.patna, phone: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-gray-600 font-semibold mb-1 block flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    Store Address
                  </label>
                  <textarea
                    rows={2}
                    value={branches.patna?.storeAddress || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        patna: { ...branches.patna, storeAddress: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs resize-none focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {/* Google Review URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-600 font-semibold">Google Review Link</label>
                    {branches.patna?.reviewUrl && (
                      <a
                        href={branches.patna.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-gray-500 hover:text-gray-900 flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={branches.patna?.reviewUrl || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        patna: { ...branches.patna, reviewUrl: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono text-[11px] focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 truncate"
                  />
                </div>
              </div>
            </div>

            {/* GAYA BRANCH CARD */}
            <div
              className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all shadow-xs ${activeBranch === "gaya"
                  ? "border-gray-400 ring-2 ring-gray-900/5"
                  : "border-gray-200"
                }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold font-mono text-xs">
                    GY
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Gaya Store</h3>
                    <p className="text-[11px] text-gray-400 font-mono">Branch Store</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                    ID: gaya
                  </span>
                  {activeBranch === "gaya" && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active POS
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Store Name */}
                <div>
                  <label className="text-gray-600 font-semibold mb-1 block">Store Display Name</label>
                  <input
                    type="text"
                    value={branches.gaya?.storeName || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        gaya: { ...branches.gaya, storeName: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {/* Primary UPI ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-800 font-bold flex items-center gap-1">
                      <CreditCard size={12} className="text-emerald-600" />
                      UPI ID (POS QR Routing)
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(branches.gaya?.upiId, "gaya")}
                      className="text-[10px] font-mono text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUpi === "gaya" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={branches.gaya?.upiId || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        gaya: { ...branches.gaya, upiId: e.target.value },
                      })
                    }
                    placeholder="aesthetxways07@okicici"
                    className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg px-3 py-2 text-emerald-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Dynamic UPI QR codes on Gaya receipts will route customer payments to this VPA.
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-gray-600 font-semibold mb-1 block flex items-center gap-1">
                    <Phone size={12} className="text-gray-400" />
                    Store Phone Number
                  </label>
                  <input
                    type="text"
                    value={branches.gaya?.phone || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        gaya: { ...branches.gaya, phone: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-gray-600 font-semibold mb-1 block flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    Store Address
                  </label>
                  <textarea
                    rows={2}
                    value={branches.gaya?.storeAddress || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        gaya: { ...branches.gaya, storeAddress: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-xs resize-none focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                {/* Google Review URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-600 font-semibold">Google Review Link</label>
                    {branches.gaya?.reviewUrl && (
                      <a
                        href={branches.gaya.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-gray-500 hover:text-gray-900 flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={branches.gaya?.reviewUrl || ""}
                    onChange={(e) =>
                      setBranches({
                        ...branches,
                        gaya: { ...branches.gaya, reviewUrl: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono text-[11px] focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 truncate"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: Online Storefront Status (Convex Gateway)    */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gray-100 text-gray-700 rounded-lg">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Online Storefront Operations</h3>
                <p className="text-xs text-gray-500">Controls consumer access at aesthetxways.com</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${currentStatus === "open"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : currentStatus === "maintenance"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
            >
              ● {currentStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleSetStatus("open")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${currentStatus === "open"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
            >
              <ShieldCheck size={16} />
              <span>Store Open</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetStatus("maintenance")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${currentStatus === "maintenance"
                  ? "border-amber-500 bg-amber-50 text-amber-800 shadow-xs"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
            >
              <Wrench size={16} />
              <span>Maintenance</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetStatus("closed")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${currentStatus === "closed"
                  ? "border-red-500 bg-red-50 text-red-800 shadow-xs"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
            >
              <Power size={16} />
              <span>Store Closed</span>
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-600 font-semibold mb-1 block">
              Custom Maintenance Message (Banner Overlay)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. We are restocking new winter drops! Check back at 6:00 PM."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
              <button
                type="button"
                onClick={() => handleSetStatus(currentStatus)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Update Banner
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <Info size={14} className="text-gray-400" />
            <span>Changes persist immediately to MongoDB & POS Billing engine.</span>
          </div>

          <button
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gray-900 text-white hover:bg-black transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TEST MESSAGE MODAL (White Theme)                         */}
      {/* ======================================================== */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Send Test WhatsApp Message</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 font-semibold mb-1 block">
                  Recipient Phone Number (10 Digits)
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-gray-900 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900">
                  <span className="px-3 py-2 text-xs font-mono text-gray-500 bg-gray-100 border-r border-gray-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="flex-1 px-3 py-2 text-sm font-mono text-gray-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-semibold mb-1 block">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-900 resize-none focus:bg-white focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 font-mono"
                />
              </div>

              <div className="text-[11px] text-gray-500 font-mono">
                Dispatched via gateway session: <strong>{whatsappClientId}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSendingTest ? "Sending..." : "Dispatch Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
