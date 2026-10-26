import React from 'react';
import FavouritesClient from '@/components/favourites/FavouritesClient';
import { getAllProducts } from '@/lib/products';

export const metadata = {
  title: 'Favourites & Wishlist | Aesthetx Ways',
  description:
    'Review and manage your saved Aesthetx Ways items. Move your saved pieces to bag with one click.',
  keywords: [
    'Aesthetx Ways favourites',
    'wishlist',
    'streetwear saved',
    'apparel wishlist',
  ],
  alternates: {
    canonical: 'https://aesthetxways.com/favourites',
  },
  openGraph: {
    title: 'Favourites & Wishlist | Aesthetx Ways',
    description: 'Review and manage your saved pieces from Aesthetx Ways.',
    url: 'https://aesthetxways.com/favourites',
    siteName: 'Aesthetx Ways',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Favourites & Wishlist | Aesthetx Ways',
    description: 'Review and manage your saved pieces from Aesthetx Ways.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function FavouritesPage() {
  const products = await getAllProducts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Favourites | Aesthetx Ways',
    url: 'https://aesthetxways.com/favourites',
    description: 'Saved products and wishlist items.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Aesthetx Ways',
      url: 'https://aesthetxways.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FavouritesClient initialProducts={products} />
    </>
  );
}
