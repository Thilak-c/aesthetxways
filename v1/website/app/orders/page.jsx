import React from 'react';
import OrdersHubClient from '@/components/orders/OrdersHubClient';

export const metadata = {
  title: 'Track Orders & Deliveries | Aesthetx Ways',
  description:
    'Track live courier delivery status for your Aesthetx Ways orders. View real-time tracking, expected delivery dates, and package dispatch updates.',
  alternates: {
    canonical: 'https://aesthetxways.com/orders',
  },
  openGraph: {
    title: 'Track Orders & Deliveries | Aesthetx Ways',
    description: 'Track live courier delivery status for your Aesthetx Ways orders.',
    url: 'https://aesthetxways.com/orders',
    siteName: 'Aesthetx Ways',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Track Orders & Deliveries | Aesthetx Ways',
    description: 'Track live courier delivery status for your Aesthetx Ways orders.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function OrdersPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'Orders & Tracking | Aesthetx Ways',
    url: 'https://aesthetxways.com/orders',
    description: 'Track orders, delivery status, and review order payment breakdowns.',
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
      <OrdersHubClient />
    </>
  );
}
