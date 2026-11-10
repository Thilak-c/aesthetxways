import QRCode from "qrcode";
import toast from "react-hot-toast";

export const DEFAULT_STORE_SETTINGS = {
  storeName: "AESTHETX WAYS (PATNA)",
  logoText: "AESTHETX WAYS",
  storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
  gstin: "10AAACA0000A1Z5",
  phone: "+91 70337 69997",
  upiId: "7033769997@ptsbi",
  thankYouMessage: "Thank you for shopping with us!",
  websiteUrl: "aesthetxways.com",
};

export const STORE_BRANCHES = {
  patna: {
    id: "patna",
    name: "Patna Branch",
    storeName: "AESTHETX WAYS (PATNA)",
    storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "7033769997@ptsbi",
  },
  gaya: {
    id: "gaya",
    name: "Gaya Branch",
    storeName: "AESTHETX WAYS (GAYA)",
    storeAddress: "Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "7033769997@ptsbi",
  },
};

function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * 80mm Thermal Invoice Print Engine
 * Handles automatic layout formatting, items tabulation, totals calculation,
 * dynamic canvas UPI QR code generation, and browser thermal print trigger.
 */
export async function executeThermalReceiptPrint(billData, options = {}) {
  const storeSettings = { ...DEFAULT_STORE_SETTINGS, ...(options.storeSettings || {}) };

  const printWindow = window.open("", "_blank", "width=450,height=800");
  if (!printWindow) {
    toast.error("Please allow popups to enable bill printing!");
    return;
  }

  const items = billData.items || [];
  const billSubtotal = billData.subtotal ?? billData.total ?? 0;
  const billRoundOff = billData.roundOff ?? 0;
  const roundOffStr = billRoundOff >= 0 ? `+₹${billRoundOff.toFixed(2)}` : `-₹${Math.abs(billRoundOff).toFixed(2)}`;
  const formattedDate = new Date(billData.createdAt || Date.now()).toLocaleDateString("en-GB");
  const formattedTime = new Date(billData.createdAt || Date.now()).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
  const rawCashierLabel = billData.createdBy || options.cashierName || "POS Cashier";
  const cashierLabel = rawCashierLabel.replace(/\s*\([^)]*\)/g, "").trim();

  const storeTitle = billData.storeName || storeSettings.storeName;
  const storePhone = billData.storePhone || storeSettings.phone;
  const thankMsg = storeSettings.thankYouMessage || "Thank you for shopping with us!";
  const siteUrl = storeSettings.websiteUrl || "aesthetxways.com";

  // Dynamic UPI QR Code Generation
  const isSplit = String(billData.paymentMethod || "").toLowerCase() === "split";
  const splitOnlineAmount = isSplit && billData.splitDetails ? Number(billData.splitDetails.online || 0) : 0;
  const isUpiPayment = String(billData.paymentMethod || "").toLowerCase() === "upi";
  const shouldShowUpiQr = isUpiPayment || (isSplit && splitOnlineAmount > 0);
  const billFinalAmount = Number(billData.total ?? billData.grandTotal ?? 0);
  const upiTargetAmount = isSplit ? splitOnlineAmount : billFinalAmount;
  const upiAmountStr = upiTargetAmount.toFixed(2);
  const upiId = storeSettings.upiId || "7033769997@ptsbi";
  const payeeName = encodeURIComponent(storeTitle || "Aesthetx Ways");
  const upiNote = encodeURIComponent(`Bill ${billData.billNumber || ""}`.trim());
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
          color: { dark: "#000000", light: "#ffffff" },
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

          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.clip();

          const pad = 3;
          const logoW = radius * 2 - pad * 2;
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
        <title>Invoice #${billData.billNumber}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0 !important; 
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Inter, Roboto, Arial, sans-serif; 
            width: 72mm; 
            max-width: 72mm;
            margin: 0 auto; 
            padding: 6mm 2mm 8mm 2mm; 
            background: #fff; 
            color: #111; 
            font-size: 11px;
            line-height: 1.35;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
          }

          /* Clean consistent divider */
          .divider {
            border-top: 1px dashed #9ca3af;
            margin: 10px 0;
            height: 0;
          }

          /* Header */
          .header {
            text-align: center;
            margin-bottom: 14px;
          }
          .logo {
            width: 44px;
            height: auto;
            margin: 0 auto 8px auto;
            display: block;
          }
          .brand-title {
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #000;
            margin: 0 0 4px 0;
          }
          .brand-sub {
            font-size: 10.5px;
            color: #6b7280;
            margin: 2px 0;
            font-weight: 500;
          }

          /* Meta info */
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          .meta-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          .meta-label {
            color: #6b7280;
            font-weight: 500;
            width: 45%;
          }
          .meta-val {
            color: #111;
            font-weight: 600;
            text-align: right;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }

          /* Items Table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-table th {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            color: #6b7280;
            padding: 6px 0;
            border-top: 1px dashed #b5bac1;
            border-bottom: 1px dashed #b5bac1;
          }
          .items-table td {
            padding: 5px 0;
            font-size: 11px;
            vertical-align: top;
          }
          .item-name {
            font-weight: 600;
            color: #111;
            line-height: 1.3;
          }
          .item-size {
            font-size: 9.5px;
            color: #6b7280;
            font-weight: 500;
          }
          .align-left { text-align: left; }
          .align-center { text-align: center; }
          .align-right { text-align: right; }

          /* Totals */
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 2px;
          }
          .totals-table td {
            padding: 2.5px 0;
          }
          .total-label {
            text-align: right;
            color: #4b5563;
            font-weight: 500;
            padding-right: 12px;
          }
          .total-val {
            text-align: right;
            font-weight: 600;
            color: #111;
            width: 38%;
          }
          .grand-total-row td {
            padding: 8px 0;
            border-top: 1px dashed #b5bac1;
            border-bottom: 1px dashed #b5bac1;
          }
          .grand-total-label {
            font-size: 13.5px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #000;
            text-align: right;
            padding-right: 12px;
          }
          .grand-total-val {
            font-size: 15px;
            font-weight: 800;
            color: #000;
            text-align: right;
          }

          /* Split details */
          .split-row td {
            font-size: 10.5px;
            padding: 2px 0;
            color: #4b5563;
          }

          /* QR Code */
          .qr-container {
            text-align: center;
            margin: 12px 0 8px 0;
            padding-top: 10px;
            border-top: 1px dashed #b5bac1;
          }
          .qr-title {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #4b5563;
            margin-bottom: 6px;
          }
          .qr-img {
            width: 120px;
            height: 120px;
            margin: 0 auto;
            display: block;
          }
          .qr-amt {
            font-size: 13px;
            font-weight: 800;
            margin-top: 5px;
            color: #111;
          }
          .qr-upi {
            font-size: 9.5px;
            color: #6b7280;
            margin-top: 2px;
          }

          /* Footer */
          .footer {
            text-align: center;
            margin-top: 14px;
          }
          .footer-msg {
            font-size: 11px;
            font-weight: 600;
            color: #111;
            margin: 0 0 3px 0;
          }
          .footer-url {
            font-size: 10px;
            font-weight: 500;
            color: #6b7280;
            letter-spacing: 0.5px;
            margin: 0;
          }

          @media print { 
            @page {
              size: 80mm auto;
              margin: 0 !important;
            }
            html, body { 
              width: 72mm !important; 
              max-width: 72mm !important;
              margin: 0 auto !important; 
              padding: 4mm 2mm 8mm 2mm !important; 
              overflow: visible !important;
              height: auto !important;
            }
            /* Prevent unwanted page cuts through items, totals or QR code */
            tr, .meta-table, .totals-table, .qr-container, .header, .footer, .items-table {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* Enforce true high-density black for thermal printhead pins */
            body, .brand-title, .meta-val, .item-name, .grand-total-label, .grand-total-val, .total-val {
              color: #000 !important;
            }
            /* Strip default browser headers/footers */
            header, footer {
              display: none !important;
            }
          }
        </style>
      </head>
      <body onload="window.print(); setTimeout(function(){ window.close(); }, 500);">
        <!-- Store Header -->
        <div class="header">
          <img src="/logo_t.svg" alt="AESTHETX WAYS" class="logo" />
          <h1 class="brand-title">Aesthetx Ways</h1>
          <p class="brand-sub">${siteUrl}</p>
          ${storePhone ? `<p class="brand-sub">Support: ${storePhone}</p>` : ""}
        </div>

        <div class="divider"></div>

        <!-- Meta Details -->
        <table class="meta-table">
          <tr>
            <td class="meta-label">Invoice #</td>
            <td class="meta-val font-mono">${billData.billNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">Date & Time</td>
            <td class="meta-val font-mono">${formattedDate}, ${formattedTime}</td>
          </tr>
          <tr>
            <td class="meta-label">Customer</td>
            <td class="meta-val">${toTitleCase(billData.customerName || "Walk-in Guest")}</td>
          </tr>
          ${billData.customerPhone ? `
          <tr>
            <td class="meta-label">Phone</td>
            <td class="meta-val font-mono">${billData.customerPhone}</td>
          </tr>` : ""}
          ${billData.customerEmail ? `
          <tr>
            <td class="meta-label">Email</td>
            <td class="meta-val" style="font-size: 10px; word-break: break-all;">${billData.customerEmail}</td>
          </tr>` : ""}
       
        </table>

        <!-- Line Items -->
        <table class="items-table" style="margin-top: 8px;">
          <thead>
            <tr>
              <th class="align-left" style="width: 58%;">Item</th>
              <th class="align-center" style="width: 14%;">Qty</th>
              <th class="align-right" style="width: 28%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td class="align-left">
                  <div class="item-name">${toTitleCase(item.productName || item.name)}</div>
                  ${item.size && item.size !== "Standard" ? `<div class="item-size font-mono">Size: ${item.size}</div>` : ""}
                </td>
                <td class="align-center font-mono" style="font-weight: 600;">${item.quantity}</td>
                <td class="align-right font-mono" style="font-weight: 600;">₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider" style="margin-top: 0; margin-bottom: 6px;"></div>

        <!-- Totals Summary -->
        <table class="totals-table">
          <tr>
            <td class="total-label">Subtotal</td>
            <td class="total-val font-mono">₹${Number(billSubtotal).toFixed(2)}</td>
          </tr>
          ${Number(billData.discountAmount) > 0 ? `
          <tr>
            <td class="total-label">Discount ${billData.discountType === "flat" ? "" : `(${billData.discount}%)`}</td>
            <td class="total-val font-mono">-₹${Number(billData.discountAmount).toFixed(2)}</td>
          </tr>` : ""}
          ${Number(billData.tax) > 0 ? `
          <tr>
            <td class="total-label">Taxes / GST</td>
            <td class="total-val font-mono">+₹${Number(billData.tax).toFixed(2)}</td>
          </tr>` : ""}
          ${billRoundOff !== 0 ? `
          <tr>
            <td class="total-label">Round Off</td>
            <td class="total-val font-mono">${roundOffStr}</td>
          </tr>` : ""}
          
          <!-- Grand Total -->
          <tr class="grand-total-row">
            <td class="grand-total-label">Grand Total</td>
            <td class="grand-total-val font-mono">₹${billFinalAmount.toFixed(2)}</td>
          </tr>

          ${isSplit && billData.splitDetails ? `
          <tr class="split-row">
            <td class="total-label" style="padding-top: 6px;">Paid in Cash:</td>
            <td class="total-val font-mono" style="padding-top: 6px;">₹${Number(billData.splitDetails.cash || 0).toFixed(2)}</td>
          </tr>
          <tr class="split-row">
            <td class="total-label">Paid via Online / UPI:</td>
            <td class="total-val font-mono">₹${Number(billData.splitDetails.online || 0).toFixed(2)}</td>
          </tr>` : ""}
        </table>

        <!-- Dynamic UPI QR Code (if applicable) -->
        ${shouldShowUpiQr && upiTargetAmount > 0 && upiQrDataUrl ? `
        <div class="qr-container">
          <div class="qr-title">
            ${isSplit ? 'Scan to Pay Online Portion' : 'Scan to Pay via UPI'}
          </div>
          <div style="position: relative; display: inline-block; background: #fff;">
            <img src="${upiQrDataUrl}" alt="UPI QR" class="qr-img" />
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px; background: #fff; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 3px; box-sizing: border-box; box-shadow: 0 0 2px rgba(0,0,0,0.2);">
              <img src="/logo_t.svg" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
            </div>
          </div>
          <div class="qr-amt font-mono">₹${upiTargetAmount.toFixed(2)}</div>
          <div class="qr-upi font-mono">UPI: ${upiId}</div>
        </div>` : ""}

        <!-- Footer -->
        <div class="footer">
          <p class="footer-msg">${thankMsg}</p>
          <p class="footer-url">${siteUrl}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
}
