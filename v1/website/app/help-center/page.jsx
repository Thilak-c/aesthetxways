import React from 'react';
import HelpCenterClient from '@/components/help/HelpCenterClient';

export const metadata = {
  title: 'Help Center & Customer Support | Aesthetx Ways',
  description:
    'Need help with your Aesthetx Ways streetwear or footwear order? Browse topics including order tracking, shipping, returns, refunds, quality guarantee, and connect with customer support.',
  keywords: [
    'Aesthetx Ways help center',
    'customer support',
    'luxury streetwear returns',
    'order tracking',
    'customer service',
    'shipping information',
  ],
  alternates: {
    canonical: '/help-center',
  },
  openGraph: {
    title: 'Help Center & Customer Support | Aesthetx Ways',
    description:
      'Browse topics including order tracking, shipping, returns, refunds, quality guarantee, and connect with customer support.',
    url: '/help-center',
    siteName: 'Aesthetx Ways',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center & Customer Support | Aesthetx Ways',
    description:
      'Browse topics including order tracking, shipping, returns, refunds, quality guarantee, and connect with customer support.',
  },
};

export default function HelpCenterPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I track my Aesthetx Ways order?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can track live courier dispatch and expected delivery directly at /order/[id] with real-time Shiprocket AWB status.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the return and exchange policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer an easy 7-day hassle-free return and doorstep size exchange policy across India for all unused items with tags intact.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does delivery take and what are the charges?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Orders are dispatched within 24–48 hours. Standard delivery is ₹79 on all orders, and ₹129 for orders above ₹2,499. Transit takes 2–4 business days for metro cities.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I contact customer support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Reach out on WhatsApp at +91 70337 69997 or email support@aesthetxways.com.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HelpCenterClient />
    </>
  );
}
