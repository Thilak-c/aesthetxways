import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { clientId } = await request.json();
    const targetClientId = clientId || '7033769997';

    const GATEWAY_URL = 'http://localhost:10000/disconnect';
    
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.WHATSAPP_API_KEY || 'Narzo50pro@gmail.com'
      },
      body: JSON.stringify({ clientId: targetClientId })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to disconnect session via gateway' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: data.message });

  } catch (error) {
    console.error('WhatsApp Proxy Disconnect Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
