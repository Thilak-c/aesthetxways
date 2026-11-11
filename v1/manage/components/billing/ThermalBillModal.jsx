"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import { Printer, Download, X, FileText, CheckCircle2 } from "lucide-react";
import AesthetxThermalBill from "./AesthetxThermalBill";

// Dynamically import PDFViewer with SSR disabled to prevent hydration errors
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[520px] text-neutral-400 gap-3">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Generating 80mm Thermal Receipt PDF...</span>
      </div>
    ),
  }
);

/**
 * Silent / In-page iframe print trigger (bypasses browser popup blockers completely)
 */
export function triggerDirectPdfPrint(billNumber) {
  if (!billNumber || typeof window === "undefined") return;

  const pdfUrl = `/api/pos/bills/${billNumber}/pdf`;
  let iframe = document.getElementById("thermal-pdf-print-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "thermal-pdf-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);
  }

  iframe.src = pdfUrl;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(pdfUrl, "_blank");
    }
  };
}

/**
 * Direct silent download trigger for bill PDF (no modal popup needed)
 */
export function triggerDirectPdfDownload(billNumber) {
  if (!billNumber || typeof window === "undefined") return;
  const a = document.createElement("a");
  a.href = `/api/pos/bills/${billNumber}/pdf?download=1`;
  a.download = `Bill-${billNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 300);
}

/**
 * Automatic combined direct print and PDF download without asking or opening popups
 */
export function triggerAutoPrintAndDownload(billNumber) {
  if (!billNumber || typeof window === "undefined") return;
  // 1. Trigger instant download
  triggerDirectPdfDownload(billNumber);
  // 2. Trigger silent in-page print dialog
  setTimeout(() => {
    triggerDirectPdfPrint(billNumber);
  }, 250);
}

export default function ThermalBillModal({
  isOpen,
  onClose,
  bill,
  autoPrint = false,
}) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!bill || !isOpen) return;

    const grandTotal = Number(bill.total ?? bill.grandTotal ?? 0);
    const isSplit = String(bill.paymentMethod || "").toLowerCase() === "split";
    const upiTargetAmount = isSplit && bill.splitDetails?.online ? Number(bill.splitDetails.online) : grandTotal;
    const branchKey = String(bill.branch || "patna").toLowerCase();
    const upiId = bill.upiId || "aesthetxways07@okicici";
    const payeeName = encodeURIComponent(branchKey === "gaya" ? "Aesthetx Ways Gaya" : "Aesthetx Ways Patna");
    const upiNote = encodeURIComponent(`Bill ${bill.billNumber || ""}`.trim());
    const upiPayload = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${upiTargetAmount.toFixed(2)}&cu=INR&tn=${upiNote}`;

    QRCode.toDataURL(upiPayload, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.warn("Failed to generate QR in modal:", err));

    if (autoPrint && bill.billNumber) {
      triggerDirectPdfPrint(bill.billNumber);
    }
  }, [bill, isOpen, autoPrint]);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    triggerDirectPdfPrint(bill.billNumber);
    setTimeout(() => setIsPrinting(false), 1200);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `/api/pos/bills/${bill.billNumber}/pdf`;
    a.download = `Bill-${bill.billNumber}.pdf`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-900 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
             
            
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? "Printing..." : "Print"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div className="flex-1 bg-neutral-100 p-2 sm:p-3 overflow-hidden flex items-center justify-center">
          <div className="w-full h-[520px] rounded-xl overflow-hidden shadow-inner border border-neutral-300/80 bg-white">
            <PDFViewer
              width="100%"
              height="100%"
              showToolbar={false}
              className="border-none w-full h-full"
            >
              <AesthetxThermalBill bill={bill} qrCodeDataUrl={qrCodeDataUrl} />
            </PDFViewer>
          </div>
        </div>

     
      </div>
    </div>
  );
}

