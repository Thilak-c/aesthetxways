import { NextResponse } from 'next/server';
import { getOpenWAStatus } from '@/lib/openwa';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'aesthetx-main';

    const status = await getOpenWAStatus(clientId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('WhatsApp Proxy Status Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
