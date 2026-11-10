import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || '7033769997';

    const GATEWAY_URL = `http://localhost:10000/status?clientId=${clientId}`;
    const API_KEY = process.env.WHATSAPP_API_KEY || 'Narzo50pro@gmail.com';

    let response = await fetch(GATEWAY_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (response.status === 404) {
      // Auto-register session if not active or initialized in gateway memory
      console.log(`[Next.js API] Client session ${clientId} not found on gateway. Triggering auto-registration...`);
      const registerRes = await fetch('http://localhost:10000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ clientId })
      });

      if (registerRes.ok) {
        // Stagger briefly and fetch updated state
        await new Promise(resolve => setTimeout(resolve, 800));
        response = await fetch(GATEWAY_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-API-Key': API_KEY
          },
          next: { revalidate: 0 }
        });
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { success: false, error: `WhatsApp Gateway connection error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('WhatsApp Proxy Status Route Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
