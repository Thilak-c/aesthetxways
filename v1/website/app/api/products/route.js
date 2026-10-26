import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/products';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  try {
    const products = await getAllProducts({ category, search });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('API products route error:', error?.message || error);
    return NextResponse.json({ success: false, products: [] }, { status: 500 });
  }
}
