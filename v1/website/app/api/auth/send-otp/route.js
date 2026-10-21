import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { convexClient } from '@/lib/convex';
import crypto from 'crypto';

// In-memory rate limiting: max 3 requests per 10 minutes per email
const otpRateLimitMap = new Map();

function isRateLimited(email) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const history = otpRateLimitMap.get(email) || [];
  const recent = history.filter((ts) => now - ts < windowMs);
  if (recent.length >= 3) {
    return true;
  }
  recent.push(now);
  otpRateLimitMap.set(email, recent);
  return false;
}

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.toLowerCase().trim();

    // Email regex validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Rate limit check
    if (isRateLimited(emailTrimmed)) {
      return NextResponse.json(
        { success: false, message: 'Too many OTP requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes ISO string

    // Save OTP to Convex
    await convexClient.mutation('auth:generateEmailOtp', {
      email: emailTrimmed,
      otp,
      expiresAt,
    });

    const mailOptions = {
      // from: `AesthetX Ways <${process.env.EMAIL_USER}>`,
      from: `AesthetXways <${process.env.EMAIL_USER}>`,
      to: emailTrimmed,
      subject: 'Email Verification OTP - Aesthetx Ways',
      html: `
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f8f9fa;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8f9fa">
            <tr>
              <td align="center" style="padding: 30px 15px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td align="center" style="padding: 40px 40px 10px 40px; background:#ffffff">
                      <img src="https://manage.aesthetxways.com/logo.png" alt="Aesthetx Ways Logo" style="width: 70px; height: auto; display: block;" />
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 40px 40px 40px; background:#ffffff">
                      <h2 style="color:#111111; margin-bottom:25px; font-size:22px; text-align:center;">Verify Your Email Address</h2>
                      <p style="color:#555555; line-height:1.7; margin-bottom:35px; font-size:15px; text-align:center;">
                        To complete your secure sign-in at <strong>AesthetX Ways</strong>, please use the verification code below:
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f9fa; border:2px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.05); margin-bottom:35px;">
                        <tr>
                          <td style="padding:25px; text-align:center;">
                            <div style="font-size:36px; font-weight:bold; color:#111111; letter-spacing:10px; font-family: monospace; text-align:center; padding-left:10px;">
                              ${otp}
                            </div>
                            <p style="color:#777777; font-size:14px; margin:12px 0 0 0;">
                              Enter this code in the verification screen
                            </p>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6; border:1px solid #d1d5db; border-radius:8px; margin-bottom:30px;">
                        <tr>
                          <td style="padding:15px; font-size:14px; color:#111111;">
                            <strong>Important:</strong> This verification code is valid for exactly 5 minutes.
                          </td>
                        </tr>
                      </table>
                      <p style="color:#777777; font-size:14px; margin:0; text-align:center;">
                        If you did not request this login code, please disregard this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#111111; color:#ffffff; text-align:center; padding:20px;">
                      <p style="margin:0; font-size:12px; opacity:0.8;">
                        AesthetX Ways - Premium Fashion & Lifestyle Store
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
