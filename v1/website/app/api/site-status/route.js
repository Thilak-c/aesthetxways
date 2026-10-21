import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';

export async function GET() {
  try {
    const result = await convexClient.query('siteSettings:getSiteStatus', {});
    return NextResponse.json({
      success: true,
      status: result?.status || 'open',
      message: result?.message || '',
    });
  } catch (error) {
   
    // Default to open if there's an error (don't block the site)
    return NextResponse.json({
      success: true,
      status: 'open',
      message: '',
    });
  }
}
