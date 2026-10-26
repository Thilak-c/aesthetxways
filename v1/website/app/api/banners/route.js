import { NextResponse } from 'next/server';
import { getBanners } from '@/lib/banners';

export async function GET() {
  try {
    const banners = await getBanners();
    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error('API banners route error:', error?.message || error);
    return NextResponse.json({ success: true, banners: [] });
  }
}
