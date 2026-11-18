import { NextResponse } from 'next/server';
import { getPairingCode } from '@/lib/openwa';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { clientId, phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required to request pairing code' },
        { status: 400 }
      );
    }

    const data = await getPairingCode(clientId || 'aesthetx-main', phone);

    return NextResponse.json({
      success: true,
      pairingCode: data.pairingCode,
      status: data.status,
      sessionId: data.sessionId,
    });
  } catch (error) {
    console.error('WhatsApp Pairing Code Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
