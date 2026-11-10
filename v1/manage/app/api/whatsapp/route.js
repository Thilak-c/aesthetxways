import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone, message, clientId } = await request.json();

    // Basic Validation
    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing phone or message body' },
        { status: 400 }
      );
    }

    // Normalize phone number (strip non-digits, ensure country code 91 if it's 10-digit Indian number)
    let cleanedPhone = String(phone).replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }

    const GATEWAY_URL = 'http://localhost:10000/send';
    
    // Forward payload to the WhatsApp Gateway securely
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.WHATSAPP_API_KEY || 'Narzo50pro@gmail.com'
      },
      body: JSON.stringify({
        clientId: clientId || '7033769997', // Target active client account
        number: cleanedPhone,
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to dispatch via Gateway' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      status: data.status || 'SENT', // 'SENT' or 'HOLD'
      message: data.message,
      state: data.state,
      qrCodeAvailable: data.qrCodeAvailable || false,
      qrBase64: data.qrBase64 || null,
      clientId: data.clientId,
      messageId: data.data?.messageId || data.messageId
    });

  } catch (error) {
    console.error('WhatsApp Proxy Route Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
