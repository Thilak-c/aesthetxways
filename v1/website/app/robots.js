export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aesthetxways.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/cart',
          '/checkout',
          '/orders',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
