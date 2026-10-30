import HomeClient from './HomeClient';
import { getAllProducts } from '@/lib/products';
import { getBanners } from '@/lib/banners';

export const metadata = {
  title: "Aesthetx Ways | Streetwear Brand",
  description: "Explore Aesthetx Ways' collection of oversized hoodies, baggy jeans, graphic tees, and streetwear accessories.",
  openGraph: {
    title: "Aesthetx Ways | Streetwear Brand",
    description: "Explore Aesthetx Ways' collection of oversized hoodies, baggy jeans, graphic tees, and streetwear accessories.",
    url: "https://aesthetxways.com",
    siteName: "Aesthetx Ways",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [initialProducts, initialBanners] = await Promise.all([
    getAllProducts(),
    getBanners(),
  ]);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aesthetx Ways",
    "url": "https://aesthetxways.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://aesthetxways.com/?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aesthetx Ways",
    "url": "https://aesthetxways.com",
    "logo": "https://aesthetxways.com/logo.png",
    "sameAs": [
      "https://instagram.com/aesthetxways",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <HomeClient initialProducts={initialProducts} initialBanners={initialBanners} />
    </>
  );
}
