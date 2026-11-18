import { NextResponse } from 'next/server';
import { disconnectSession } from '@/lib/openwa';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { clientId } = await request.json().catch(() => ({}));
    const targetClientId = clientId || 'aesthetx-main';

    const result = await disconnectSession(targetClientId);
    return NextResponse.json({
      success: result.success,
      message: `Session ${targetClientId} disconnected.`,
    });
  } catch (error) {
    console.error('WhatsApp Proxy Disconnect Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
