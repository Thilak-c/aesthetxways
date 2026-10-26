import ProductClient from './ProductClient';
import { getProductById, getAllProducts } from '@/lib/products';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: 'Product Not Found | Aesthetx Ways',
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} | Aesthetx Ways`;
  const description = product.description || `Shop ${product.name} at Aesthetx Ways. Premium oversized luxury streetwear. Fast pan-India delivery.`;
  const image = product.mainImage || '/logo.png';
  const url = `https://aesthetxways.com/product/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Aesthetx Ways',
      images: [
        {
          url: image,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `/product/${id}`,
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const [product, allCatalog] = await Promise.all([
    getProductById(id),
    getAllProducts(),
  ]);

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.mainImage ? [product.mainImage] : [],
    description: product.description || `${product.name} - Luxury streetwear from Aesthetx Ways`,
    sku: product.itemId || id,
    brand: {
      '@type': 'Brand',
      name: 'Aesthetx Ways',
    },
    offers: {
      '@type': 'Offer',
      price: product.price || 0,
      priceCurrency: 'INR',
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://aesthetxways.com/product/${id}`,
      seller: {
        '@type': 'Organization',
        name: 'Aesthetx Ways',
      },
    },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient id={id} initialProduct={product} initialCatalog={allCatalog} />
    </>
  );
}
