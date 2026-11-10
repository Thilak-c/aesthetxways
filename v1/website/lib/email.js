import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'support@sonushoe.in',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'Narzo50pro@',
  },
});

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
    domain.endsWith('.localhost')
  );
}

/**
 * Send an email verification OTP code to the user
 */
export async function sendVerificationEmail({ to, name, code }) {
  const from = process.env.EMAIL_FROM || `"Aesthetx Ways" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'support@sonushoe.in'}>`;
  const otp = code || '123456';

  const mailOptions = {
    from,
    to,
    subject: `${otp} is your Aesthetx Ways verification code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111827; padding: 20px 0;">
        <p style="margin: 0 0 20px 0;">We received a request to verify this email address for your Aesthetx Ways account.</p>
        <p style="margin: 0 0 20px 0;">Enter this verification code:</p>
        <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; letter-spacing: 0.15em; font-family: monospace; color: #111827;">${otp}</p>
        <p style="margin: 0 0 20px 0;">This code is valid for 5 minutes. Don't share this code with anyone. Aesthetx Ways will never ask you for your verification code.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

/**
 * Send Pixel-to-Pixel Order Confirmation Email (Copied directly from Sonu structure)
 */
export async function sendOrderConfirmationEmail(order) {
  if (!order) return null;

  const customer = order.customer || order.customerDetails || {};
  const to = customer.email || order.shippingAddress?.email || order.email;
  if (!to || isReservedTestEmail(to)) {
    console.log(`[Email Service] Skipped sending to test or empty email: ${to}`);
    return null;
  }

  const orderId = order.orderNumber || order.orderId;
  const customerName = customer.name || customer.fullName || 'Customer';
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.totalAmount || order.orderTotal || 0);
  const isPartialCod = order.payment?.method === 'partial_cod' || String(order.paymentMethod || '').toLowerCase() === 'partial_cod';
  const advancePaid = isPartialCod ? Number(order.payment?.advancePaid ?? 200) : total;
  const balanceDue = isPartialCod ? Math.max(0, total - advancePaid) : 0;

  // Compute Expected Delivery Date (Default 3-4 days from placement)
  const baseDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const edd = new Date(baseDate);
  edd.setDate(edd.getDate() + 3);
  const expectedDateDisplay = order.estimatedDelivery || edd.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const awbCode = order.delhivery?.waybill || order.shiprocket?.awbCode;
  const isAwbAssigned = Boolean(
    awbCode &&
    typeof awbCode === 'string' &&
    awbCode.trim() !== '' &&
    !awbCode.toLowerCase().includes('pending')
  );

  const itemsHtmlArray = [];
  const billItemsHtmlArray = [];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const itemPrice = Number(it.priceNumber || it.price || 0);
    const itemQty = Number(it.quantity || 1);
    const itemTotal = itemPrice * itemQty;
    const itemImg = it.image || 'https://aesthetxways.com/logo.png';

    const imgTag = `<img src="${itemImg}" alt="${it.name || 'Product'}" style="width: 130px; height: 130px; object-fit: contain; display: block; border: 0;" />`;

    itemsHtmlArray.push(`
      <tr>
        <td style="padding-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="130" style="vertical-align: top;">
                <div style="width: 130px; height: 130px; background-color: #f5f5f5; border-radius: 8px; overflow: hidden; text-align: center;">
                  ${imgTag}
                </div>
              </td>
              <td style="vertical-align: top; padding-left: 16px;">
                <div style="font-size: 18px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; margin-bottom: 2px; line-height: 1.2;">
                  ₹ ${itemPrice.toLocaleString('en-IN')}
                </div>
                <div style="font-size: 16px; font-weight: 500; font-family: 'Helvetica Now Text Medium', sans-serif; color: #111111; margin-bottom: 4px; line-height: 1.2;">
                  ${it.name || 'Aesthetx Ways Apparel'}
                </div>
                <div style="font-size: 13.5px; color: #707072; margin-bottom: 2px;">
                  Premium Streetwear Edition
                </div>
                <div style="font-size: 13.5px; color: #707072; margin-bottom: 2px;">
                  Usually ships in 1-2 days
                </div>
                <div style="font-size: 13.5px; color: #707072; margin-bottom: 6px;">
                  Easy Exchange & Return
                </div>
                <div style="font-size: 14px; font-weight: 500; color: #111111;">
                  Size ${it.size || 'OS'}${itemQty > 1 ? ` (Qty: ${itemQty})` : ''}
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
          ${it.name || 'Product'}${itemQty > 1 ? ` (${itemQty}x)` : ''}
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Order Confirmation #${orderId}</title>
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
                    <span style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: #707072; text-transform: uppercase;">CONFIRMED</span>
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
                Order ID: <strong>#${orderId}</strong>
              </div>
            </td>
          </tr>

          <!-- EXPECTED DELIVERY DATE -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 28px; background-color: #ffffff;">
              <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
                EXPECTED DELIVERY DATE
              </div>
              <div style="font-size: 22px; font-weight: 600; color: #111111; letter-spacing: -0.02em;">
                ${expectedDateDisplay}
              </div>
            </td>
          </tr>

          <!-- 4-STEP TRACKER -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 32px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Col 1: Order Placed -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${emptyCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr><td bgcolor="#008C01" style="width: 14px; height: 14px; background-color: #008C01; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 2: Preparing -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr><td bgcolor="#e5e5e5" style="width: 14px; height: 14px; background-color: #e5e5e5; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 3: Dispatched -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr><td bgcolor="#e5e5e5" style="width: 14px; height: 14px; background-color: #e5e5e5; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                          </table>
                        </td>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Col 4: Delivered -->
                  <td width="25%" style="vertical-align: middle; padding: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 14px;">
                      <tr>
                        <td width="50%" style="vertical-align: middle; padding: 0;">${lineCell}</td>
                        <td align="center" width="14" style="vertical-align: middle; padding: 0;">
                          <table cellpadding="0" cellspacing="0" border="0" width="14" height="14">
                            <tr><td bgcolor="#e5e5e5" style="width: 14px; height: 14px; background-color: #e5e5e5; border-radius: 50%; font-size: 0; line-height: 0;">&nbsp;</td></tr>
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
                    <div style="font-size: 11.5px; font-weight: 600; color: #111111; line-height: 1.2;">Order Placed</div>
                    <div style="font-size: 10px; color: #707072; margin-top: 2px;">Confirmed</div>
                  </td>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div style="font-size: 11.5px; font-weight: 600; color: #111111; line-height: 1.2;">Preparing</div>
                    <div style="font-size: 10px; color: #707072; margin-top: 2px;">Quality Check</div>
                  </td>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div style="font-size: 11.5px; font-weight: 600; color: #111111; line-height: 1.2;">Dispatched</div>
                    <div style="font-size: 10px; color: #707072; margin-top: 2px;">In Transit</div>
                  </td>
                  <td width="25%" align="center" style="padding-top: 8px; vertical-align: top;">
                    <div style="font-size: 11.5px; font-weight: 600; color: #111111; line-height: 1.2;">Delivered</div>
                    <div style="font-size: 10px; color: #707072; margin-top: 2px;">To Doorstep</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- LOGISTICS TRACKING -->
          <tr>
            <td bgcolor="#ffffff" style="padding-bottom: 24px; background-color: #ffffff;">
              <div style="font-size: 16px; font-weight: 600; color: #111111; margin-bottom: 2px;">
                Logistics Tracking
              </div>
              <div style="font-size: 12.5px; color: #8d8d8d; margin-bottom: 14px;">
                Courier: Delhivery Surface Express
              </div>
              <div style="font-size: 11.5px; color: #111111; margin-bottom: 3px;">
                Courier AWB Number
              </div>
              ${isAwbAssigned ? `
              <div style="font-size: 15px; font-weight: 600; margin-top: 2px;">
                <a href="https://www.delhivery.com/track/package/${awbCode}" target="_blank" rel="noopener noreferrer" style="color: #111111; text-decoration: underline; font-weight: 600;">
                  ${awbCode}
                </a>
              </div>` : `
              <div style="font-size: 13px; color: #707072;">
                Assigned upon dispatch
              </div>`}
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

          <!-- PRODUCT CARDS -->
          ${itemsHtmlArray.join('')}

          <!-- BILL BREAKDOWN -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #e5e5e5; padding-top: 18px; padding-bottom: 12px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${billItemsHtmlArray.join('')}
                <tr>
                  <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">Sub Total</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 600; color: #111111; padding-bottom: 12px;">₹ ${total.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="font-size: 14.5px; color: #111111; padding-bottom: 12px;">Shipping Charges</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 600; color: #0d8240; padding-bottom: 12px;">Free</td>
                </tr>
                ${isPartialCod ? `
                <tr>
                  <td style="font-size: 14.5px; font-weight: 600; color: #008a00; padding-bottom: 14px;">Total Paid</td>
                  <td align="right" style="font-size: 14.5px; font-weight: 700; color: #008a00; padding-bottom: 14px;">₹ ${advancePaid.toLocaleString('en-IN')}</td>
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
                  <td style="font-size: 17px; font-weight: 600; color: #111111;">
                    ${isPartialCod ? 'Remaining' : 'Total Paid'}
                  </td>
                  <td align="right" style="font-size: 18px; font-weight: 700; color: #111111;">
                    ₹ ${(isPartialCod ? balanceDue : total).toLocaleString('en-IN')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#ffffff" style="border-top: 1px solid #f0f0f0; padding-top: 24px; text-align: center; color: #888888; font-size: 12px;">
              <p style="margin: 0 0 6px;">Need help with your order? Reach our team at support@aesthetxways.com or +91 7033769997.</p>
              <p style="margin: 0;">Aesthetx Ways • Patna, Bihar, India</p>
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
    subject: `Order Confirmed: #${orderId} — Aesthetx Ways`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent order confirmation for #${orderId} to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, to };
  } catch (err) {
    console.error('[Email Service] Failed to send order confirmation email:', err);
    return { success: false, error: err.message };
  }
}
