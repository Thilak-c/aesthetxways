import { NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  try {
    // Fetch products from Convex with a 2.5s timeout to gracefully fallback if Convex is offline
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Convex query timeout')), 2500)
    );
    let products = await Promise.race([
      convexClient.query('webStore:getAllProducts', { limit: 1000 }),
      timeoutPromise,
    ]);
    
    // Ensure we filter out hidden and deleted products (just in case they aren't by the query)
    products = products.filter(p => !p.isHidden && !p.isDeleted);
    
    // Apply Category filtering
    if (category && category !== 'All') {
      const normalizedCategory = category.toLowerCase().trim();
      products = products.filter(p => {
        const pCat = (p.category || '').toLowerCase().trim();
        if (normalizedCategory === 'apparel' || normalizedCategory === 'apparel / clothing') {
          return pCat === 'apparel' || pCat === 'apparel / clothing';
        }
        return pCat === normalizedCategory;
      });
    }
    
    // Apply Search Query filtering
    if (search) {
      const normalizedSearch = search.toLowerCase().trim();
      products = products.filter(p => 
        (p.name || '').toLowerCase().includes(normalizedSearch) || 
        (p.itemId || '').toLowerCase().includes(normalizedSearch) ||
        (p.description || '').toLowerCase().includes(normalizedSearch)
      );
    }
    
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Failed to fetch products from Convex, falling back to mock data:', error?.message || error);
    
    // Premium mock products for offline local testing
    const mockProducts = [
      {
        _id: "mock-dusty",
        itemId: "dusty-fade-baggy-jeans",
        name: "Dusty Fade Baggy Jeans / Unisex",
        mainImage: "/home/b1.webp",
        category: "apparel",
        price: 3200,
        inStock: true,
        color: "Vintage Grey",
        availableSizes: ["S", "M", "L", "XL"],
        sizeStock: { "S": 10, "M": 0, "L": 8, "XL": 4 }
      },
      {
        _id: "mock-black",
        itemId: "black-fade-baggy-jeans",
        name: "Black Fade Baggy Jeans / Unisex",
        mainImage: "/home/b2.webp",
        category: "apparel",
        price: 3000,
        inStock: true,
        color: "Faded Black",
        availableSizes: ["S", "M", "L", "XL"],
        sizeStock: { "S": 0, "M": 12, "L": 6, "XL": 3 }
      },
      {
        _id: "mock-glacier",
        itemId: "glacier-wash-baggy-jeans",
        name: "Glacier Wash Baggy Jeans / Unisex",
        mainImage: "/home/b3.webp",
        category: "apparel",
        price: 3400,
        inStock: true,
        color: "Glacier Blue",
        availableSizes: ["S", "M", "L", "XL"],
        sizeStock: { "S": 5, "M": 7, "L": 0, "XL": 2 }
      }
    ];
    
    // Apply client-side filters on mock products to keep search/filters working
    let filtered = [...mockProducts];
    if (category && category !== 'All') {
      const normalizedCategory = category.toLowerCase().trim();
      filtered = filtered.filter(p => p.category === normalizedCategory);
    }
    if (search) {
      const normalizedSearch = search.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(normalizedSearch) || 
        p.itemId.toLowerCase().includes(normalizedSearch)
      );
    }

    return NextResponse.json({ success: true, products: filtered });
  }
}
