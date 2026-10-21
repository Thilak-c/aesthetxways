import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
});

/**
 * Send an email verification OTP code to the user
 */
export async function sendVerificationEmail({ to, name, code }) {
  const from = process.env.EMAIL_FROM || `"Aesthetx Ways" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;
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
