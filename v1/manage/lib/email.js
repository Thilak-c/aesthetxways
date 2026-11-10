import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'support@aesthetxways.com',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
  },
});

const DEFAULT_FROM = process.env.EMAIL_FROM || '"Aesthetx Ways" <support@aesthetxways.com>';

export function isReservedTestEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  const domain = lower.split('@')[1] || '';
  return (
    domain.endsWith('example.com') ||
    domain.endsWith('example.org') ||
    domain.endsWith('example.net') ||
    domain.endsWith('.test') ||
    domain.endsWith('.invalid') ||
    domain.endsWith('.localhost') ||
    domain.endsWith('test.com')
  );
}

/**
 * Send Pixel-to-Pixel Order Confirmation Email (Matching Storefront Order Tracking Page)
 */
export async function sendOrderConfirmationEmail(order) {
  if (!order || !order.customer?.email) return null;

  const orderId = order.orderId;
  const to = order.customer.email;
  if (isReservedTestEmail(to)) {
    console.log(`[Email Service] Mock mode: Skipped sending to test domain ${to}`);
    return { messageId: `mock_${Date.now()}` };
  }
  const customerName = order.customer.name || `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Customer';
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.totalAmount || 0);
  const isPartialCod = order.payment?.method === 'partial_cod' || order.payment?.method === 'cod';
  const advancePaid = isPartialCod ? Number(order.payment?.advancePaid ?? 200) : total;
  const balanceDue = isPartialCod ? Math.max(0, total - advancePaid) : 0;

  // Compute Expected Delivery Date (Default 3 days from placement)
  const baseDate = order.placedAt ? new Date(order.placedAt) : new Date();
  const edd = new Date(baseDate);
  edd.setDate(edd.getDate() + 3);
  const expectedDateDisplay = order.estimatedDelivery && order.estimatedDelivery.includes('Oct')
    ? order.estimatedDelivery
    : edd.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const awbCode = order.delhivery?.waybill || order.shiprocket?.awbCode;
  const isAwbAssigned = Boolean(
    awbCode &&
    typeof awbCode === 'string' &&
    awbCode.trim() !== '' &&
    !awbCode.toLowerCase().includes('pending') &&
    !awbCode.toLowerCase().includes('assigned')
  );

  const attachments = [];

  // 1. Process Logo Attachment
  try {
    const logoCandidates = [
      path.resolve('../public/Logo/sonu-shoes-email-logo.png'),
      path.resolve('./public/Logo/sonu-shoes-email-logo.png'),
      path.resolve('../public/Logo/SONU_Shoes_Minimalist_Logo-removebg-preview.png'),
      path.resolve('./public/Logo/SONU_Shoes_Minimalist_Logo-removebg-preview.png'),
    ];
    const logoPath = logoCandidates.find(p => fs.existsSync(p));
    if (logoPath) {
      const logoBuf = await sharp(logoPath).resize({ height: 70 }).png().toBuffer();
      attachments.push({
        filename: 'sonu-logo.png',
        content: logoBuf,
        cid: 'sonu_logo',
        contentType: 'image/png',
      });
    }
  } catch (err) {
    console.warn('[Email Service] Could not attach logo:', err.message);
  }

  // 2. Process Items and Product Images
  const itemsHtmlArray = [];
  const billItemsHtmlArray = [];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const itemPrice = Number(it.priceNumber || 15000);
    const itemQty = Number(it.quantity || 1);
    const itemTotal = itemPrice * itemQty;
    const cidName = `product_${idx}`;

    let hasAttachedImg = false;
    if (it.image) {
      try {
        let localPath = '';
        const baseUploadsDir = path.join(process.cwd(), '..', 'uploads');
        const basePublicDir = path.join(process.cwd(), '..', 'public');

        if (it.image.startsWith('http://') || it.image.startsWith('https://')) {
          try {
            const res = await fetch(it.image);
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const productBuf = await sharp(Buffer.from(arrayBuf))
                .resize(260, 260, { fit: 'contain', background: '#f5f5f5' })
                .png()
                .toBuffer();
              attachments.push({
                filename: `product-${idx}.png`,
                content: productBuf,
                cid: cidName,
                contentType: 'image/png',
              });
              hasAttachedImg = true;
            }
          } catch (fetchErr) {
            console.warn('[Email Service] Remote image fetch error:', fetchErr.message);
          }
        } else if (it.image.startsWith('/api/uploads/') || it.image.startsWith('/uploads/')) {
          const raw = it.image.replace('/api/uploads/', '').replace('/uploads/', '');
          localPath = path.join(baseUploadsDir, raw);
        } else if (it.image.startsWith('/images/')) {
          localPath = path.join(basePublicDir, 'images', path.basename(it.image));
        }

        if (localPath && fs.existsSync(localPath)) {
          const productBuf = await sharp(localPath)
            .resize(260, 260, { fit: 'contain', background: '#f5f5f5' })
            .png()
            .toBuffer();
          attachments.push({
            filename: `product-${idx}.png`,
            content: productBuf,
            cid: cidName,
            contentType: 'image/png',
          });
          hasAttachedImg = true;
        }
      } catch (imgErr) {
        console.warn(`[Email Service] Could not convert product image for ${it.name}:`, imgErr.message);
      }
    }

    const imgTag = hasAttachedImg
      ? `<img src="cid:${cidName}" alt="${it.name}" style="width: 130px; height: 130px; object-fit: contain; display: block; border: 0;" />`
      : `<div style="font-size: 32px; line-height: 130px; text-align: center;">👟</div>`;

    itemsHtmlArray.push(`
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="130" style="vertical-align: top;">
                <div style="width: 130px; height: 130px; background-color: #f5f5f5; border-radius: 4px; overflow: hidden; text-align: center;">
                  ${imgTag}
                </div>
              </td>
              <td style="vertical-align: top; padding-left: 16px;">
                <div style="font-size: 18px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; margin-bottom: 2px; line-height: 1.2;">
                  ₹ ${itemPrice.toLocaleString('en-IN')}
                </div>
                <div style="font-size: 16px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; margin-bottom: 4px; line-height: 1.2;">
                  ${it.name || 'Footwear'}
                </div>
                <div style="font-size: 13.5px; color: #707072; margin-bottom: 2px;">
                  ${it.category || "Women's Road Running Shoes"}
                </div>
                <div style="font-size: 13.5px; color: #707072; margin-bottom: 2px;">
                  Usually ships in 1 day
                </div>
                <div style="font-size: 13.5px; color: #707072; margin-bottom: 6px;">
                  7 Day Return
                </div>
                <div style="font-size: 14px; font-weight: 500; color: #111111;">
                  Size ${it.size || 'UK 6'}${itemQty > 1 ? ` (Qty: ${itemQty})` : ''}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `);

    billItemsHtmlArray.push(`
      <tr>
        <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">
          ${it.name || 'Footwear'}${itemQty > 1 ? ` (${itemQty}x)` : ''}
        </td>
        <td align="right" style="font-size: 14.5px; font-weight: 500; color: #111111; padding-bottom: 12px;">
          ₹ ${itemTotal.toLocaleString('en-IN')}
        </td>
      </tr>
    `);
  }

  const lineCell = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
      <tr><td style="height: 6px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
      <tr><td bgcolor="#e5e5e5" style="height: 2px; background-color: #e5e5e5; font-size: 0; line-height: 0;"></td></tr>
      <tr><td style="height: 6px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  `;

  const emptyCell = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
      <tr><td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  `;

  const html = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Order Confirmation #${orderId}</title>
  <style>
    @font-face {
      font-family: 'Helvetica Now Text';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('https://manage.sonushoe.in/Font/HelveticaNowText.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Helvetica Now Text';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('https://manage.sonushoe.in/Font/HelveticaNowTextMedium.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Helvetica Now Text Medium';
      font-style: normal;
      font-weight: 400 500;
      font-display: swap;
      src: url('https://manage.sonushoe.in/Font/HelveticaNowTextMedium.woff2') format('woff2');
    }
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    * {
      font-family: 'Helvetica Now Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    }
    h1, h2, h3, h4, h5, h6, strong, b {
      font-weight: 500 !important;
      font-family: 'Helvetica Now Text Medium', sans-serif !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      background: #ffffff !important;
      color: #111111 !important;
      color-scheme: light !important;
      font-family: 'Helvetica Now Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    }
    table, td, div, p, span, h1, h2, a {
      color-scheme: light !important;
      font-family: 'Helvetica Now Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-bg, .email-card, table, td {
        background-color: #ffffff !important;
        background: #ffffff !important;
      }
      h1, h2, .force-black {
        color: #111111 !important;
      }
      .force-gray {
        color: #707072 !important;
      }
    }
    [data-ogsc] body, [data-ogsc] .email-bg, [data-ogsc] table, [data-ogsc] td {
      background-color: #ffffff !important;
      background: #ffffff !important;
    }
    [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] p, [data-ogsc] span {
      color: #111111 !important;
    }
  </style>
</head>
<body bgcolor="#ffffff" class="email-bg" style="margin: 0; padding: 0; background-color: #ffffff; background: #ffffff; font-family: 'Helvetica Now Text', 'Helvetica Now Text Medium', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" class="email-bg" style="background-color: #ffffff; background: #ffffff;">
    <tr>
      <td align="center" bgcolor="#ffffff" style="padding: 24px 16px; background-color: #ffffff; background: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" class="email-card" style="max-width: 480px; background-color: #ffffff; background: #ffffff; text-align: left; font-family: 'Helvetica Now Text', 'Helvetica Now Text Medium', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          
          <!-- TOP NAVBAR: SONU Shoes Logo on Left, Hamburger on Right (No Search, No Bag) -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 28px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <img src="https://aesthetxways.com/logo.png" alt="Aesthetx Ways" style="height: 32px; width: auto; max-width: 140px; display: block; border: 0;" />
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 20px;">
                      <tr><td bgcolor="#111111" style="height: 2px; background-color: #111111; font-size: 0; line-height: 0;"></td></tr>
                      <tr><td style="height: 4px; font-size: 0; line-height: 0;"></td></tr>
                      <tr><td bgcolor="#111111" style="height: 2px; background-color: #111111; font-size: 0; line-height: 0;"></td></tr>
                      <tr><td style="height: 4px; font-size: 0; line-height: 0;"></td></tr>
                      <tr><td bgcolor="#111111" style="height: 2px; background-color: #111111; font-size: 0; line-height: 0;"></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- THANK YOU HEADING -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 24px; background-color: #ffffff;">
              <h1 class="force-black" style="font-size: 26px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; margin: 0 0 6px; letter-spacing: -0.02em; line-height: 1.2;">
                Thank you, ${customerName}!
              </h1>
              <div class="force-gray" style="font-size: 13.5px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #707072; margin: 0;">
                Order ID: ${orderId}
              </div>
            </td>
          </tr>

          <!-- EXPECTED DELIVERY DATE -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 28px; background-color: #ffffff;">
              <div style="font-size: 12px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #047857; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
                EXPECTED DELIVERY DATE
              </div>
              <div class="force-black" style="font-size: 22px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; letter-spacing: -0.02em;">
                ${expectedDateDisplay}
              </div>
            </td>
          </tr>

          <!-- 4-STEP TRACKER (WITH EXACT VERTICAL CENTER LINE ALIGNMENT) -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 32px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Dots & Centered Connecting Lines Row -->
                <tr>
                  <!-- Col 1: Order Placed (Green Dot) -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${emptyCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr>
                              <td bgcolor="#008C01" style="width: 14px; height: 14px; background-color: #008C01; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 2: Preparing (Grey Dot) -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr>
                              <td bgcolor="#e5e5e5" style="width: 14px; height: 14px; background-color: #e5e5e5; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 3: Dispatched (Grey Dot) -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr>
                              <td bgcolor="#e5e5e5" style="width: 14px; height: 14px; background-color: #e5e5e5; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 4: Delivered (Grey Dot) -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr>
                              <td bgcolor="#e5e5e5" style="width: 14px; height: 14px; background-color: #e5e5e5; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${emptyCell}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Labels Row -->
                <tr>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div class="force-black" style="font-size: 11.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; line-height: 1.2;">Order Placed</div>
                    <div class="force-gray" style="font-size: 10px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #707072; margin-top: 2px;">Confirmed</div>
                  </td>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div class="force-black" style="font-size: 11.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; line-height: 1.2;">Preparing</div>
                    <div class="force-gray" style="font-size: 10px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #707072; margin-top: 2px;">Quality Check</div>
                  </td>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div class="force-black" style="font-size: 11.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; line-height: 1.2;">Dispatched</div>
                    <div class="force-gray" style="font-size: 10px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #707072; margin-top: 2px;">In Transit</div>
                  </td>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div class="force-black" style="font-size: 11.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; line-height: 1.2;">Delivered</div>
                    <div class="force-gray" style="font-size: 10px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #707072; margin-top: 2px;">To Doorstep</div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- LOGISTICS TRACKING -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 24px; background-color: #ffffff;">
              <div class="force-black" style="font-size: 16px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; margin-bottom: 2px;">
                Logistics Tracking
              </div>
              <div style="font-size: 12.5px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #8d8d8d; margin-bottom: 14px;">
                Package dispatch & courier status
              </div>
              <div class="force-black" style="font-size: 11.5px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #111111; margin-bottom: 3px;">
                Courier AWB Number
              </div>
              ${isAwbAssigned ? `
              <div class="force-black" style="font-size: 15px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; margin-top: 2px;">
                <a href="https://www.delhivery.com/track/package/${awbCode}" target="_blank" rel="noopener noreferrer" style="color: #111111; text-decoration: underline; font-weight: 500;">
                  ${awbCode}
                </a>
              </div>` : `
              <div class="force-gray" style="font-size: 13px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #707072; text-decoration: none;">
                Assigned upon dispatch
              </div>`}
            </td>
          </tr>

          <!-- ITEMS COUNT HEADING -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 16px; background-color: #ffffff;">
              <div class="force-black" style="font-size: 20px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111;">
                ${items.length} ${items.length === 1 ? 'item' : 'items'}
              </div>
            </td>
          </tr>

          <!-- PRODUCT CARDS -->
          ${itemsHtmlArray.join('')}

          <!-- BILL BREAKDOWN -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #e5e5e5; padding-top: 18px; padding-bottom: 12px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${billItemsHtmlArray.join('')}
                <tr>
                  <td class="force-black" style="font-size: 14.5px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #111111; padding-bottom: 12px;">Sub Total</td>
                  <td align="right" class="force-black" style="font-size: 14.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; padding-bottom: 12px;">₹ ${total.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td class="force-black" style="font-size: 14.5px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #111111; padding-bottom: 12px;">Shipping Charges</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #0d8240; padding-bottom: 12px;">Free</td>
                </tr>
                ${isPartialCod ? `
                <tr>
                  <td class="force-black" style="font-size: 14.5px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #008a00; padding-bottom: 14px;">Total Paid</td>
                  <td align="right" class="force-black" style="font-size: 14.5px; font-weight: 700; font-family: 'Helvetica Now Text Medium', sans-serif; color: #008a00; padding-bottom: 14px;">₹ ${advancePaid.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- REMAINING / TOTAL -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #e5e5e5; padding-top: 16px; padding-bottom: 32px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="force-black" style="font-size: 17px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111;">
                    ${isPartialCod ? 'Remaining' : 'Total Paid'}
                  </td>
                  <td align="right" class="force-black" style="font-size: 18px; font-weight: 700; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111;">
                    ₹ ${(isPartialCod ? balanceDue : total).toLocaleString('en-IN')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: `Order Confirmed: #${orderId} — Aesthetx Ways`,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent pixel-to-pixel order confirmation for #${orderId} to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, to };
  } catch (err) {
    console.error('[Email Service] Failed to send order confirmation email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send Shipping / AWB Notification Email
 */
export async function sendShippingNotificationEmail(order, awbCode, courierName) {
  if (!order || !order.customer?.email) return null;

  const orderId = order.orderId;
  const to = order.customer.email;
  if (isReservedTestEmail(to)) {
    console.log(`[Email Service] Mock mode: Skipped sending to test domain ${to}`);
    return { messageId: `mock_${Date.now()}` };
  }
  const name = order.customer.name || 'Valued Customer';
  const courier = courierName || order.delhivery?.courierName || order.shiprocket?.courierName || 'Delhivery Surface Express';
  const awb = awbCode || order.delhivery?.waybill || order.shiprocket?.awbCode || 'Pending';

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: `Your order #${orderId} is Ready to Ship! — Sonu Shoe`,
    html: `
      <div style="max-width: 500px; margin: 0 auto; font-family: 'Helvetica Now Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111111; padding: 28px 16px; background: #ffffff;">
        <img src="https://aesthetxways.com/logo.png" alt="Aesthetx Ways" style="height: 28px; width: auto; max-width: 140px; display: block; border: 0; margin-bottom: 16px;" />
        <p style="font-size: 14px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #555555; line-height: 1.5; margin: 0 0 20px;">
          Hi ${name}, your order <span style="font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif;">#${orderId}</span> has been boxed and assigned to <span style="font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif;">${courier}</span> (AWB: <a href="https://www.delhivery.com/track/package/${awb}" target="_blank" rel="noopener noreferrer" style="color: #111111; text-decoration: underline; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif;">${awb}</a>).
        </p>
      </div>
    `,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[Email Service] Failed to send shipping notification email:', err);
    return null;
  }
}

/**
 * Send Generic Order Status Update Email
 */
export async function sendOrderStatusEmail(order, template = 'ORDER_CONFIRMED') {
  if (!order || !order.customer?.email) return null;

  if (template === 'ORDER_CONFIRMED') {
    return sendOrderConfirmationEmail(order);
  }

  const orderId = order.orderId;
  const to = order.customer.email;
  if (isReservedTestEmail(to)) {
    console.log(`[Email Service] Mock mode: Skipped sending to test domain ${to}`);
    return { messageId: `mock_${Date.now()}` };
  }
  const name = order.customer.name || 'Valued Customer';

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: `Order Update #${orderId}: ${template} — Sonu Shoe`,
    html: `
      <div style="max-width: 500px; margin: 0 auto; font-family: 'Helvetica Now Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111111; padding: 28px 16px; background: #ffffff;">
        <img src="https://aesthetxways.com/logo.png" alt="Aesthetx Ways" style="height: 28px; width: auto; max-width: 140px; display: block; border: 0; margin-bottom: 16px;" />
        <p style="font-size: 14px; font-weight: 400; font-family: 'Helvetica Now Text', sans-serif; color: #555555; line-height: 1.5; margin: 0 0 20px;">
          Hi ${name}, your order <span style="font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif;">#${orderId}</span> status has been updated to: <span style="font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif;">${template}</span>.
        </p>
      </div>
    `,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[Email Service] Failed to send order status email:', err);
    return null;
  }
}

/**
 * Send In-Store POS Bill Confirmation Email
 * Matches storefront order confirmation:
 * - Thank you, [Customer Name]
 * - Order ID: #[Bill Number]
 * - DELIVERED ON: Today's date
 * - 3-step progress bar (Order Placed -> Preparing -> Delivered, all green)
 * - No logistics tracking or AWB number
 * - Items without image
 * - Matching bill breakdown
 */
export async function sendPOSBillConfirmationEmail(bill) {
  if (!bill) return null;
  const to = bill.customerEmail ? String(bill.customerEmail).trim() : null;
  if (!to || isReservedTestEmail(to)) {
    console.log(`[Email Service] Skipped POS bill email for empty or test email: ${to}`);
    return null;
  }

  const billNumber = bill.billNumber || 'POS';
  const customerName = bill.customerName || 'Valued Guest';
  const items = Array.isArray(bill.items) ? bill.items : [];
  const total = Number(bill.total || 0);
  const subtotal = Number(bill.subtotal || total);
  const discountAmount = Number(bill.discountAmount || 0);
  const tax = Number(bill.tax || 0);
  const paymentMethod = String(bill.paymentMethod || 'cash').toUpperCase();

  const purchaseDate = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const deliveredDateDisplay = purchaseDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const greenDot = `
    <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
      <tr><td bgcolor="#008C01" style="width: 14px; height: 14px; background-color: #008C01; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  `;

  const greenLine = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
      <tr><td style="height: 6px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
      <tr><td bgcolor="#008C01" style="height: 2px; background-color: #008C01; font-size: 0; line-height: 0;"></td></tr>
      <tr><td style="height: 6px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  `;

  const emptyCell = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
      <tr><td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
    </table>
  `;

  const itemsHtmlArray = [];
  const billItemsHtmlArray = [];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const itemPrice = Number(it.price || 0);
    const itemQty = Number(it.quantity || 1);
    const itemTotal = itemPrice * itemQty;

    itemsHtmlArray.push(`
      <tr>
        <td style="padding-bottom: 16px; border-bottom: 1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: top;">
                <div style="font-size: 15.5px; font-weight: 600; color: #111111; margin-bottom: 3px; line-height: 1.3;">
                  ${it.productName || it.name || 'Aesthetx Ways Apparel'}
                </div>
                <div style="font-size: 13px; color: #707072; margin-bottom: 3px;">
                  Size: <strong>${it.size || 'Standard'}</strong>${itemQty > 1 ? ` • Qty: <strong>${itemQty}</strong>` : ''}
                </div>
         
              </td>
              <td align="right" style="vertical-align: top; padding-left: 12px; white-space: nowrap;">
                <div style="font-size: 16px; font-weight: 600; color: #111111;">
                  ₹ ${itemTotal.toLocaleString('en-IN')}
                </div>
                ${itemQty > 1 ? `<div style="font-size: 12px; color: #707072; margin-top: 2px;">₹ ${itemPrice.toLocaleString('en-IN')} each</div>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height: 14px;"></td></tr>
    `);

    billItemsHtmlArray.push(`
      <tr>
        <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">
          ${it.productName || it.name || 'Item'}${itemQty > 1 ? ` (${itemQty}x)` : ''}
        </td>
        <td align="right" style="font-size: 14.5px; font-weight: 500; color: #111111; padding-bottom: 12px;">
          ₹ ${itemTotal.toLocaleString('en-IN')}
        </td>
      </tr>
    `);
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Receipt Confirmed #${billNumber}</title>
  <style>
    * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; }
    h1, h2, h3, strong, b { font-weight: 600 !important; }
    body { margin: 0; padding: 0; background-color: #ffffff; color: #111111; }
  </style>
</head>
<body bgcolor="#ffffff" style="margin: 0; padding: 0; background-color: #ffffff; color: #111111;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
    <tr>
      <td align="center" bgcolor="#ffffff" style="padding: 24px 16px; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width: 480px; background-color: #ffffff; text-align: left;">
          
          <!-- TOP NAVBAR: Aesthetx Ways Logo -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 28px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <img src="https://aesthetxways.com/logo.png" alt="Aesthetx Ways" style="height: 32px; width: auto; max-width: 140px; display: block; border: 0;" />
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: #047857; text-transform: uppercase;">IN-STORE PURCHASE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- THANK YOU HEADING -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 24px; background-color: #ffffff;">
              <h1 style="font-size: 26px; font-weight: 600; color: #111111; margin: 0 0 6px; letter-spacing: -0.02em; line-height: 1.2;">
                Thank you, ${customerName}!
              </h1>
              <div style="font-size: 13.5px; color: #707072; margin: 0;">
                Order ID: <strong>#${billNumber}</strong>
              </div>
            </td>
          </tr>

          <!-- DELIVERED ON DATE -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 28px; background-color: #ffffff;">
              <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
                DELIVERED ON
              </div>
              <div style="font-size: 22px; font-weight: 600; color: #111111; letter-spacing: -0.02em;">
                ${deliveredDateDisplay}
              </div>
            </td>
          </tr>

          <!-- 3-STEP TRACKER: Order Placed -> Preparing -> Delivered -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 32px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Col 1: Order Placed -->
                  <td width="33.33%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${emptyCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">${greenDot}</td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${greenLine}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 2: Preparing -->
                  <td width="33.33%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${greenLine}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">${greenDot}</td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${greenLine}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 3: Delivered -->
                  <td width="33.33%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${greenLine}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">${greenDot}</td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${emptyCell}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Labels Row -->
                <tr>
                  <td width="33.33%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div style="font-size: 11.5px; font-weight: 600; color: #111111; line-height: 1.2;">Order Placed</div>
                    <div style="font-size: 10px; color: #707072; margin-top: 2px;">Confirmed</div>
                  </td>
                  <td width="33.33%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div style="font-size: 11.5px; font-weight: 600; color: #111111; line-height: 1.2;">Preparing</div>
                    <div style="font-size: 10px; color: #707072; margin-top: 2px;">Packed</div>
                  </td>
                  <td width="33.33%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div style="font-size: 11.5px; font-weight: 600; color: #047857; line-height: 1.2;">Delivered</div>
                    <div style="font-size: 10px; color: #047857; font-weight: 600; margin-top: 2px;">Handed Over</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMS COUNT HEADING -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 16px; background-color: #ffffff;">
              <div style="font-size: 20px; font-weight: 600; color: #111111;">
                ${items.length} ${items.length === 1 ? 'item' : 'items'}
              </div>
            </td>
          </tr>

          <!-- ITEMS CARDS (WITHOUT IMAGE) -->
          ${itemsHtmlArray.join('')}

          <!-- BILL BREAKDOWN -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #e5e5e5; padding-top: 18px; padding-bottom: 12px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${billItemsHtmlArray.join('')}
                <tr>
                  <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">Sub Total</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 600; color: #111111; padding-bottom: 12px;">₹ ${subtotal.toLocaleString('en-IN')}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="font-size: 14.5px; color: #0d8240; padding-bottom: 12px;">Discount</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 600; color: #0d8240; padding-bottom: 12px;">- ₹ ${discountAmount.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                ${tax > 0 ? `
                <tr>
                  <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">Tax</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 600; color: #111111; padding-bottom: 12px;">₹ ${tax.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">Payment Method</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 600; color: #111111; text-transform: uppercase; padding-bottom: 12px;">${paymentMethod}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TOTAL PAID -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #e5e5e5; padding-top: 16px; padding-bottom: 32px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 17px; font-weight: 600; color: #111111;">
                    Total Paid
                  </td>
                  <td align="right" style="font-size: 18px; font-weight: 700; color: #111111;">
                    ₹ ${total.toLocaleString('en-IN')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #f0f0f0; padding-top: 24px; text-align: center; color: #888888; font-size: 12px;">
              <p style="margin: 0 0 6px;">Need help with your purchase? Reach our store at support@aesthetxways.com or +91 7033769997.</p>
              <p style="margin: 0;">Aesthetx Ways • In-store Purchase</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const from = process.env.EMAIL_FROM || '"Aesthetx Ways" <support@sonushoe.in>';

  const mailOptions = {
    from,
    to,
    subject: `Order Confirmed: #${billNumber} — Aesthetx Ways`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent POS bill confirmation for #${billNumber} to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, to };
  } catch (err) {
    console.error('[Email Service] Failed to send POS bill confirmation email:', err);
    return { success: false, error: err.message };
  }
}
