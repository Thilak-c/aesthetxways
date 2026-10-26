import { convexClient } from './convex';

const MOCK_PRODUCTS = [
  {
    _id: "mock-dusty",
    itemId: "dusty-fade-baggy-jeans",
    name: "Dusty Fade Baggy Jeans / Unisex",
    mainImage: "/home/b1.webp",
    category: "apparel",
    price: 3200,
    listedPrice: 4000,
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
    listedPrice: 6000,
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
    listedPrice: 4250,
    inStock: true,
    color: "Glacier Blue",
    availableSizes: ["S", "M", "L", "XL"],
    sizeStock: { "S": 5, "M": 7, "L": 0, "XL": 2 }
  }
];

export async function getAllProducts({ category, search } = {}) {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Convex query timeout')), 2500)
    );
    let products = await Promise.race([
      convexClient.query('webStore:getAllProducts', { limit: 1000 }),
      timeoutPromise,
    ]);

    products = products.filter(p => !p.isHidden && !p.isDeleted);

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

    if (search) {
      const normalizedSearch = search.toLowerCase().trim();
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(normalizedSearch) ||
        (p.itemId || '').toLowerCase().includes(normalizedSearch) ||
        (p.description || '').toLowerCase().includes(normalizedSearch)
      );
    }

    return products;
  } catch (error) {
    console.error('Failed to fetch products from Convex, falling back to mock data:', error?.message || error);
    let filtered = [...MOCK_PRODUCTS];
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
    return filtered;
  }
}

export async function getProductById(id) {
  if (!id) return null;

  // 1. Fast direct query by itemId from Convex
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Convex single query timeout')), 1500)
    );
    const directProduct = await Promise.race([
      convexClient.query('webStore:getProductByItemId', { itemId: id }),
      timeoutPromise,
    ]);
    if (directProduct && !directProduct.isHidden && !directProduct.isDeleted) {
      return directProduct;
    }
  } catch (e) {
    // Fall back to catalog scan
  }

  // 2. Fallback scan for _id, slug, or normalized name
  const products = await getAllProducts();
  const lowerId = String(id).toLowerCase().trim();
  return products.find(p => 
    p.itemId === id || 
    p._id === id || 
    (p.itemId && String(p.itemId).toLowerCase() === lowerId) ||
    (p._id && String(p._id).toLowerCase() === lowerId) ||
    (p.name && (
      p.name.toLowerCase() === lowerId ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === lowerId
    ))
  ) || null;
}
