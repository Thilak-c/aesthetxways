# SEO and Server-Side Rendering Rule for SONU

## Core Principles
1. **Super-Optimized SEO & SSR**:
   - Every page and route added to SONU must leverage Next.js Server-Side Rendering (SSR) and Server Components wherever possible for instantaneous search engine indexing and optimal Core Web Vitals.
   - Use Next.js `generateMetadata` or static `export const metadata` on all route segments to inject rich metadata:
     - Descriptive, compelling `<title>` tags with brand and contextual specificity.
     - High-converting `<meta name="description">` (150-160 characters).
     - Full OpenGraph (`og:title`, `og:description`, `og:image`, `og:type`, `og:site_name`, `og:url`) and Twitter card tags (`summary_large_image`).
     - Canonical URLs and robots directives (`index, follow`).

2. **Contextual Footwear Keywords**:
   - Embed search keywords organically into copy, semantic heading tags (`<h1>`, `<h2>`, `<h3>`), image alt attributes, and metadata.
   - Core keyword clusters:
     - Premium small-run footwear / handcrafted sneakers.
     - Ergonomic foot support, durable soles, long-distance comfort, "for the long way home".
     - Minimalist luxury street footwear, everyday essentials, sustainable craftsmanship.
     - Direct-to-consumer order tracking, seamless checkout.

3. **Structured Data (JSON-LD)**:
   - Provide Schema.org structured data on relevant pages:
     - Product pages: `Product`, `Offer`, `AggregateRating`, `Brand`.
     - Brand / Store home: `Organization`, `Store`, `WebSite` with SearchAction.
     - Order tracking / help: `Order`, `FAQPage`.

4. **Semantic HTML & Accessibility**:
   - Strict heading hierarchy: exactly one `<h1>` per page.
   - Meaningful HTML5 tags (`<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`, `<figure>`).
   - Every image must have descriptive `alt` text incorporating brand and product context.
   - Zero layout shifts (CLS), optimized font loading via local WOFF2 with `font-display: swap`.
