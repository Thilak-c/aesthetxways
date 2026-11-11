import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const GATEWAY_BASE = process.env.WHATSAPP_GATEWAY_URL || 'http://187.127.164.186:10000';
    const GATEWAY_URL = `${GATEWAY_BASE}/messages`;
    
    const response = await fetch(GATEWAY_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': process.env.WHATSAPP_API_KEY || 'Narzo50pro@gmail.com'
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { success: false, error: `Failed to fetch messages log: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('WhatsApp Proxy Messages Log Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
