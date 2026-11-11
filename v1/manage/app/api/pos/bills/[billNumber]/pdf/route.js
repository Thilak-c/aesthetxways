import { NextResponse } from "next/server";
import React from "react";
import ReactPDF, { renderToStream, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { initDb } from "@/lib/mongodb";
import AesthetxThermalBill from "@/components/billing/AesthetxThermalBill";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const db = await initDb();
    const resolvedParams = await params;
    const billNumber = resolvedParams?.billNumber ? String(resolvedParams.billNumber) : "";

    if (!billNumber) {
      return NextResponse.json(
        { success: false, error: "Bill number is required" },
        { status: 400 }
      );
    }

    const bill = await db.collection("bills").findOne({ billNumber });

    if (!bill) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    // Generate Dynamic UPI QR Code Data URL
    const isSplit = String(bill.paymentMethod || "").toLowerCase() === "split";
    const grandTotal = Number(bill.total ?? bill.grandTotal ?? 0);
    const upiTargetAmount = isSplit && bill.splitDetails?.online ? Number(bill.splitDetails.online) : grandTotal;
    const branchKey = String(bill.branch || "patna").toLowerCase();

    let dynamicUpi = bill.upiId;
    let dynamicAddress = bill.storeAddress;
    let dynamicPhone = bill.storePhone;
    let dynamicStoreName = bill.storeName;

    try {
      const branchesDoc = await db.collection("siteSettings").findOne({ key: "posBranches" });
      if (branchesDoc?.value) {
        const parsed = typeof branchesDoc.value === "string" ? JSON.parse(branchesDoc.value) : branchesDoc.value;
        const branchConfig = parsed?.branches?.[branchKey];
        if (branchConfig) {
          if (!dynamicUpi && branchConfig.upiId) dynamicUpi = branchConfig.upiId;
          if (!dynamicAddress && branchConfig.storeAddress) dynamicAddress = branchConfig.storeAddress;
          if (!dynamicPhone && branchConfig.phone) dynamicPhone = branchConfig.phone;
          if (!dynamicStoreName && branchConfig.storeName) dynamicStoreName = branchConfig.storeName;
        }
      }
    } catch {}

    const upiId = dynamicUpi || "aesthetxways07@okicici";
    const payeeName = encodeURIComponent(branchKey === "gaya" ? "Aesthetx Ways Gaya" : "Aesthetx Ways Patna");
    const upiNote = encodeURIComponent(`Bill ${bill.billNumber || ""}`.trim());
    const upiPayload = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${upiTargetAmount.toFixed(2)}&cu=INR&tn=${upiNote}`;

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(upiPayload, {
        margin: 1,
        width: 180,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch (qrErr) {
      console.warn("Failed to generate QR data url for PDF:", qrErr);
    }

    const billToRender = {
      ...bill,
      upiId,
      storeAddress: dynamicAddress || bill.storeAddress,
      storePhone: dynamicPhone || bill.storePhone,
      storeName: dynamicStoreName || bill.storeName,
    };

    const element = <AesthetxThermalBill bill={billToRender} qrCodeDataUrl={qrCodeDataUrl} />;

    // Use renderToBuffer or renderToStream
    const renderFn = renderToBuffer || ReactPDF?.renderToBuffer;
    let pdfBuffer;
    if (renderFn) {
      pdfBuffer = await renderFn(element);
    } else {
      const streamFn = renderToStream || ReactPDF?.renderToStream;
      const stream = await streamFn(element);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      pdfBuffer = Buffer.concat(chunks);
    }

    const searchParams = request.nextUrl.searchParams;
    const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true";
    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="Bill-${billNumber}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("[API /api/pos/bills/[billNumber]/pdf GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
