import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const rawParam = resolvedParams?.billNumber || '';
    const billNumber = decodeURIComponent(String(rawParam)).trim();
    const isDownload = request.nextUrl.searchParams.get('download') === '1';

    if (!billNumber) {
      return NextResponse.json({ success: false, error: 'Bill number is required' }, { status: 400 });
    }

    const host = request.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    const backendBase = isLocal
      ? 'http://127.0.0.1:6001'
      : (process.env.INSYS_INTERNAL_URL || process.env.NEXT_PUBLIC_INSYS_URL || 'https://manage.aesthetxways.com');

    const targetUrl = `${backendBase}/api/pos/bills/${encodeURIComponent(billNumber)}/pdf${isDownload ? '?download=1' : ''}`;

    const upstreamRes = await fetch(targetUrl, {
      cache: 'no-store',
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => 'Upstream PDF fetch failed');
      return new Response(errText, {
        status: upstreamRes.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const pdfBuffer = await upstreamRes.arrayBuffer();
    const disposition = isDownload ? 'attachment' : 'inline';

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="Bill-${billNumber}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('[API /api/bills/[billNumber]/pdf GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
