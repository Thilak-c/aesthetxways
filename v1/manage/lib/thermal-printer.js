import QRCode from "qrcode";
import toast from "react-hot-toast";

export const STORE_BRANCHES = {
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

export const DEFAULT_STORE_SETTINGS = {
  storeName: "AESTHETX WAYS (PATNA)",
  logoText: "AESTHETX WAYS",
  storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
  gstin: "10AAACA0000A1Z5",
  phone: "+91 70337 69997",
  thankYouMessage: "Thank you for shopping with us..!!",
  websiteUrl: "aesthetxways.com",
  upiId: "aesthetxways07@okicici",
};

/**
 * 80mm/72mm Thermal Receipt Printing Engine
 * Copied directly from original 2-day-old billing codebase.
 */
export async function executeThermalReceiptPrint(activeBillData, options = {}) {
  const branchKey = String(activeBillData.branch || options.branch || options.storeSettings?.id || "patna").toLowerCase();
  const currentBranch = STORE_BRANCHES[branchKey] || STORE_BRANCHES.patna;
  const storeSettings = { ...DEFAULT_STORE_SETTINGS, ...currentBranch, ...(options.storeSettings || {}) };

  const printWindow = window.open("", "_blank", "width=450,height=800");
  if (!printWindow) {
    toast.error("Please allow popups to enable bill printing!");
    return;
  }

  const itemsQty = (activeBillData.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const billSubtotal = Number(activeBillData.subtotal ?? activeBillData.total ?? 0);
  const billRoundOff = Number(activeBillData.roundOff ?? 0);
  const roundOffStr = billRoundOff >= 0 ? `+₹${billRoundOff.toFixed(2)}` : `-₹${Math.abs(billRoundOff).toFixed(2)}`;
  const formattedDate = new Date(activeBillData.createdAt || Date.now()).toLocaleDateString("en-GB");
  const formattedTime = new Date(activeBillData.createdAt || Date.now()).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
  const rawCashierLabel = activeBillData.createdBy || options.cashierName || "POS Cashier";
  const cashierLabel = rawCashierLabel.replace(/\s*\([^)]*\)/g, "").trim();

  // Dynamic Store Branch Details (Patna vs Gaya)
  const storeTitle = activeBillData.storeName || storeSettings.storeName;
  const storeAddr = activeBillData.storeAddress || storeSettings.storeAddress;
  const storePhone = activeBillData.storePhone || storeSettings.phone;
  const thankMsg = storeSettings.thankYouMessage || "Thank you for shopping with us..!!";
  const siteUrl = storeSettings.websiteUrl || "aesthetxways.com";

  // Dynamic UPI QR Code Generation (for UPI payment or Split payment with online portion)
  const isSplit = String(activeBillData.paymentMethod || "").toLowerCase() === "split";
  const splitOnlineAmount = isSplit && activeBillData.splitDetails ? Number(activeBillData.splitDetails.online || 0) : 0;
  const isUpiPayment = String(activeBillData.paymentMethod || "").toLowerCase() === "upi";
  const shouldShowUpiQr = isUpiPayment || (isSplit && splitOnlineAmount > 0);
  const billFinalAmount = Number(activeBillData.total ?? activeBillData.grandTotal ?? 0);
  const upiTargetAmount = isSplit ? splitOnlineAmount : billFinalAmount;
  const upiAmountStr = upiTargetAmount.toFixed(2);
  const upiId = storeSettings.upiId || "aesthetxways07@okicici";
  const payeeName = encodeURIComponent(branchKey === "gaya" ? "Aesthetx Ways Gaya" : "Aesthetx Ways Patna");
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
          @page { 
            size: 80mm auto; 
            margin: 0 !important; 
          }
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            width: 72mm; 
            margin: 0 auto !important; 
            padding: 0 2mm 6mm 2mm !important; 
            background: #fff; 
            color: #000; 
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .brand { 
            text-align: center; 
            margin-top: 0 !important; 
            padding-top: 0 !important; 
            margin-bottom: 10px; 
            border-bottom: 2px dashed #000; 
            padding-bottom: 10px; 
          }
          .brand img { 
            width: 85px; 
            height: auto; 
            margin: 0 auto 4px auto !important; 
            display: block; 
          }
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
          @media print { 
            @page { 
              size: 80mm auto; 
              margin: 0 !important; 
            }
            html, body { 
              width: 72mm !important; 
              margin: 0 auto !important; 
              padding: 0 2mm 4mm 2mm !important; 
              box-sizing: border-box !important; 
            } 
          }
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
            ${(activeBillData.items || []).map((item, idx) => `
              <tr>
                <td class="align-left">${idx + 1}</td>
                <td class="align-left">
                  ${item.productName || item.name} 
                  ${item.size && item.size !== "Standard" ? `<br/><span style="font-size: 9px; opacity: 0.8; font-family: monospace;">Size: ${item.size}</span>` : ''}
                </td>
                <td class="align-center">${item.quantity || 1}</td>
                <td class="align-right font-mono">₹${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}</td>
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
            ${Number(activeBillData.discountAmount) > 0 ? `
            <tr>
              <td></td>
              <td style="text-align: right; padding: 2px 0;">Discount (${activeBillData.discountType === "flat" ? "Flat" : `${activeBillData.discount}%`})</td>
              <td style="text-align: right; padding: 2px 0;" class="font-mono">-₹${Number(activeBillData.discountAmount).toFixed(2)}</td>
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
}

export default executeThermalReceiptPrint;
