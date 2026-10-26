import { getAllProducts } from '@/lib/products';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aesthetxways.com';
  const now = new Date();

  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    const products = await getAllProducts();
    const productRoutes = products
      .filter((p) => p && p.itemId)
      .map((product) => ({
        url: `${baseUrl}/product/${product.itemId}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap product entries:', error);
    return staticRoutes;
  }
}
