import StoresClient from './StoresClient';

export const metadata = {
  title: "Aesthetx Ways | Store Locations in Patna & Gaya",
  description: "Visit Aesthetx Ways physical streetwear stores in Patna (Kankarbagh Colony More) and Gaya (Railway Station Campus). Browse oversized tees, hoodies, and baggy jeans in person.",
  openGraph: {
    title: "Aesthetx Ways | Store Locations in Patna & Gaya",
    description: "Visit Aesthetx Ways physical streetwear stores in Patna and Gaya. Find store hours, addresses, and directions.",
    url: "https://aesthetxways.com/stores",
    siteName: "Aesthetx Ways",
    type: "website",
  },
  alternates: {
    canonical: "/stores",
  },
};

export default function StoresPage() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ClothingStore",
        "@id": "https://aesthetxways.com/stores#patna",
        "name": "AESTHETX WAYS ( PATNA )",
        "telephone": "070337 69997",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Kankarbagh Colony More, Kankarbagh, Ghrounda",
          "addressLocality": "Patna",
          "addressRegion": "Bihar",
          "postalCode": "800001",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 25.5941,
          "longitude": 85.1376
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "10:30",
            "closes": "22:30"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "18"
        }
      },
      {
        "@type": "ClothingStore",
        "@id": "https://aesthetxways.com/stores#gaya",
        "name": "AESTHETX WAYS ( WAVES )",
        "telephone": "070337 69997",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Gaya Station Campus Rd, Gol Bagicha",
          "addressLocality": "Gaya",
          "addressRegion": "Bihar",
          "postalCode": "823002",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 24.7955,
          "longitude": 84.9994
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "10:30",
            "closes": "22:30"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.7",
          "reviewCount": "50"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <StoresClient />
    </>
  );
}
