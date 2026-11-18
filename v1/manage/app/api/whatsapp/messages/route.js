import { NextResponse } from 'next/server';
import { getMessageLogs } from '@/lib/openwa';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'aesthetx-main';

    const logs = await getMessageLogs(clientId, 50);
    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error) {
    console.error('WhatsApp Proxy Messages Error:', error);
    return NextResponse.json({
      success: false,
      logs: [],
      error: error.message,
    });
  }
}
