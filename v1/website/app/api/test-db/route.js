import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Try to query products from Convex to verify the connection
    const products = await convexClient.query('webStore:getAllProducts', { limit: 1 });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Convex!',
      databaseConnected: true,
      productsFound: products.length,
    });
  } catch (error) {
    console.error('Convex connection or query failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Could not connect to Convex database.',
      },
      { status: 500 }
    );
  }
}
