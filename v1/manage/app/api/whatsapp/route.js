import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/openwa';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { phone, message, mediaUrl, clientId } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing phone or message body' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage({
      clientId: clientId || 'aesthetx-main',
      phone,
      message,
      mediaUrl,
    });

    return NextResponse.json({
      success: true,
      status: 'SENT',
      message: 'Message dispatched successfully via OpenWA',
      messageId: result.messageId,
      clientId,
    });
  } catch (error) {
    console.error('WhatsApp Proxy Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
