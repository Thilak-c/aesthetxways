import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions of Sale – India | Aesthetx Ways',
  description:
    'Read the official Terms and Conditions of Sale and Terms of Use for Aesthetx Ways in India. Understand our ordering, shipping, 14-day returns, and consumer policies.',
  keywords: [
    'Aesthetx Ways terms and conditions',
    'terms of sale india',
    'luxury apparel and streetwear',
    'curated drops',
    'returns policy',
  ],
  alternates: {
    canonical: 'https://aesthetxways.com/terms',
  },
  openGraph: {
    title: 'Terms and Conditions of Sale – India | Aesthetx Ways',
    description:
      'Official Terms and Conditions of Sale and Website Terms of Use for Aesthetx Ways in India.',
    url: 'https://aesthetxways.com/terms',
    siteName: 'Aesthetx Ways',
    images: ['/logo_t.svg'],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms and Conditions — Aesthetx Ways India',
    description:
      'Official Terms and Conditions of Sale and Website Terms of Use for Aesthetx Ways in India.',
    images: ['/logo_t.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://aesthetxways.com/terms#webpage',
        url: 'https://aesthetxways.com/terms',
        name: 'Terms and Conditions of Sale – India | Aesthetx Ways',
        description:
          'Official Terms and Conditions of Sale and Website Terms of Use for Aesthetx Ways in India.',
        publisher: {
          '@id': 'https://aesthetxways.com/#organization',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://aesthetxways.com/terms#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://aesthetxways.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Terms and Conditions',
            item: 'https://aesthetxways.com/terms',
          },
        ],
      },
      {
        '@type': 'Organization',
        '@id': 'https://aesthetxways.com/#organization',
        name: 'Aesthetx Ways',
        url: 'https://aesthetxways.com',
        logo: 'https://aesthetxways.com/logo_t.svg',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91 70337 69997',
          contactType: 'Customer Service',
          email: 'support@aesthetxways.com',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
      },
    ],
  };

  return (
    <>
      {/* Schema.org SSR JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        {/* Breadcrumb Bar */}
        <div className="border-b border-[#e5e5e5]">
          <nav
            aria-label="Breadcrumb"
            className="max-w-[880px] mx-auto px-6 py-3.5 text-[13px] text-[#707072] flex items-center gap-2"
          >
            <Link href="/" className="hover:text-[#111111] transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#111111] font-medium">Terms and Conditions</span>
          </nav>
        </div>

        {/* Main Content Article */}
        <main className="max-w-[880px] mx-auto px-6 py-10 sm:py-16">
          <header className="mb-10 pb-6 border-b border-[#e5e5e5]">
            <h1
              className="text-[28px] sm:text-[38px] font-bold text-[#111111] tracking-tight leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Terms and Conditions of Sale – India
            </h1>
            <p className="text-[14px] text-[#707072] mt-2">
              Effective Date: October 2026 • Last updated: October 2026
            </p>
          </header>

          <div className="space-y-8 text-[15px] sm:text-[16px] text-[#222222] leading-relaxed">
            {/* Preamble */}
            <section className="space-y-4">
              <p>
                This page provides you information about Aesthetx Ways (“
                <strong className="text-[#111111]">Aesthetx Ways</strong>”, “
                <strong className="text-[#111111]">Retailer</strong>”, “
                <strong className="text-[#111111]">we</strong>”, “
                <strong className="text-[#111111]">our</strong>” and/or “
                <strong className="text-[#111111]">us</strong>”), and the terms and conditions
                (the “<strong className="text-[#111111]">Terms</strong>”) on which we sell
                curated luxury apparel, footwear, streetwear collections, and
                related products in accordance with section 2.1 below (“
                <strong className="text-[#111111]">Products</strong>”) through the website{' '}
                <Link href="/" className="text-[#111111] underline hover:text-[#707072] transition-colors">
                  aesthetxways.com
                </Link>{' '}
                (“<strong className="text-[#111111]">our site</strong>”/“
                <strong className="text-[#111111]">Site</strong>”) to you. These Terms will apply
                to any contract between us for the sale of Products to you (“
                <strong className="text-[#111111]">Contract</strong>”). Before using our site,
                please read these Terms carefully and make sure that you understand them.
              </p>
              <p>
                Please note that before placing an order or making a payment you will be asked to
                agree to these Terms. If you refuse to accept these Terms, you will not be able to
                order any Products from our site or make any payments related thereto.
              </p>
              <p>
                You should view, read and print a copy of these Terms or save them to your computer
                for future reference. We may amend these Terms from time to time as set out below.
                Every time you wish to order Products or use our site, please check these Terms to
                ensure you understand the terms which will apply at that time.
              </p>
            </section>

            {/* 1. Information About Us */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                1. INFORMATION ABOUT US
              </h2>
              <p className="mb-3">
                1.1 The Retailer is Aesthetx Ways, having its flagship retail presence at Gaya Station Campus
                Rd, Gol Bagicha, Gaya, Bihar, PIN – 823002, India. Retailer is engaged in the business of
                curating, retailing, and delivering premium fashion, apparel, and lifestyle merchandise (“Business”)
                through its e-commerce storefront and physical brand locations.
              </p>
              <p className="mb-3">
                1.2 Aesthetx Ways operates this Site and sells Products on the Site directly to consumers with
                a verified delivery address in India.
              </p>
              <p className="font-semibold text-[#111111] mt-4 mb-2">1.3 Contacting Us</p>
              <p className="mb-3">
                If you wish to contact us for any reason, including customer care assistance, order
                inquiries, feedback, or grievances, please do so using the contact details below:
              </p>

              {/* Contact Box */}
              <div className="bg-[#f8f8f8] p-5 sm:p-6 rounded-2xl border border-neutral-200/80 my-4 space-y-4">
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Customer Care:
                  </h3>
                  <ul className="space-y-1 text-[14px] text-[#333333]">
                    <li>
                      Email:{' '}
                      <a
                        href="mailto:support@aesthetxways.com"
                        className="text-[#111111] underline hover:text-[#707072]"
                      >
                        support@aesthetxways.com
                      </a>
                    </li>
                    <li>Support Helpline: +91 70337 69997</li>
                    <li>Operational Hours: Monday to Saturday (10:00 AM – 7:00 PM IST)</li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <h3 className="text-[15px] font-bold text-[#111111] uppercase tracking-wider mb-1.5">
                    Grievance Officer:
                  </h3>
                  <p className="text-[13px] text-[#707072] mb-2">
                    In accordance with the Information Technology Act, 2000 and the Consumer
                    Protection (E-Commerce) Rules, 2020:
                  </p>
                  <ul className="space-y-1 text-[14px] text-[#333333]">
                    <li>Designation: Head of Customer Relations & Grievances</li>
                    <li>
                      Address: Aesthetx Ways, Gaya Station Campus Rd, Gol Bagicha, Gaya, Bihar, PIN – 823002
                    </li>
                    <li>
                      Email:{' '}
                      <a
                        href="mailto:support@aesthetxways.com"
                        className="text-[#111111] underline hover:text-[#707072]"
                      >
                        support@aesthetxways.com
                      </a>
                    </li>
                    <li>Helpline: +91 70337 69997 (Mon – Sat, 10:00 AM – 7:00 PM IST)</li>
                  </ul>
                </div>
              </div>

              <p className="mt-3">
                1.4 If we have to contact you or provide notice in writing, we will do so via email
                or telephone/SMS using the contact details you provided during order placement.
              </p>
            </section>

            {/* 2. How the Contract is Formed */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                2. HOW THE CONTRACT IS FORMED BETWEEN YOU AND US
              </h2>
              <p className="mb-3">
                2.1 We exclusively sell Products to end-users and consumers with a valid delivery
                address within the Republic of India. End-users are individuals who purchase merchandise
                for personal wear and enjoyment, and not for commercial resale or redistribution. We
                reserve the right to decline or cancel bulk orders or orders suspected of intended
                unauthorized resale.
              </p>
              <p className="mb-3">
                2.2 By submitting an order through our Site, you acknowledge that your transaction is
                directly with Aesthetx Ways. Upon verification of payment information
                and order validity, we will fulfill your order at the pricing and terms agreed upon
                submission.
              </p>
              <p className="mb-3">
                2.3 Our Site guides you through each step needed to select footwear sizing, colorway,
                review your bag, provide delivery information, and complete payment. Please review
                your order details carefully before submitting.
              </p>
              <p className="mb-3">
                2.4 After you place an order, you will receive an automated email acknowledging that
                we have received your order details. The legal Contract between us is officially
                formed only when you receive our formal Order Confirmation email.
              </p>
              <p className="mb-3">
                2.5 When your handcrafted footwear has been packaged and handed over to our verified
                logistics carrier, you will receive an email containing your Dispatch Confirmation and
                courier tracking number.
              </p>
              <p className="mb-3">
                2.6 If we are unable to supply a Product (e.g., due to small-run batch constraints,
                stock exhaustion, or a pricing error on the Site), we will promptly notify you by
                email. If payment was already collected, the full amount—including any applicable
                delivery charges—will be refunded to your original payment method without delay.
              </p>
              <p className="mb-3">
                2.7 You warrant that all information provided during checkout is authentic and
                accurate. We and our banking partners reserve the right to verify credit/debit card
                authenticity to prevent fraudulent transactions.
              </p>
              <p className="mb-3">
                2.8 Products made available on this Site are strictly intended for non-commercial
                personal use. Commercial reselling or unauthorized redistribution is prohibited.
              </p>
            </section>

            {/* 3. Terms of Use of Our Site */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                3. TERMS OF USE OF OUR SITE
              </h2>
              <p className="mb-3">
                3.1 By accessing or using this website, you indicate that you accept these Terms of
                Use and agree to abide by them. If you do not agree, please discontinue using this
                Site immediately.
              </p>
              <p className="mb-3">
                3.2 We do not warrant that our Site or any content on it will always be available or
                uninterrupted. We reserve the right to modify, suspend, or withdraw any feature of
                the Site without prior notice.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  You are responsible for making all necessary technical arrangements to access our
                  Site via your device and network connection.
                </li>
                <li>
                  We may revise these Terms periodically. Any updates will be published on this page
                  and apply to future visits and orders.
                </li>
              </ul>
              <p className="mb-3">
                3.3 Minors (under the age of 18) may only use this Site under the supervision and
                with the consent of a parent or legal guardian, in accordance with Indian law.
              </p>
              <p className="mb-3">
                3.4 You must not misuse our Site by knowingly introducing viruses, Trojans, worms, or
                other harmful code; attempting unauthorized server access; or scraping content
                without written consent.
              </p>
              <p className="mb-3">
                3.5 <strong className="text-[#111111]">Intellectual Property Rights:</strong> All
                designs, trademarks, brand logos, typography, product models, photography, graphics,
                software, and text on this Site are the exclusive intellectual property of Aesthetx Ways
                and protected by applicable copyright, trademark, and design laws in
                India.
              </p>
            </section>

            {/* 4. Payment Authorization */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                4. WHAT YOU AUTHORISE US TO DO
              </h2>
              <p className="mb-3">
                4.1 By placing an order, you authorise us and our certified payment gateway partners
                (e.g., UPI, RuPay, Visa, Mastercard, NetBanking) to process payments, refunds, and
                adjustments for your transactions, and charge your selected payment method.
              </p>
              <p className="mb-3">
                4.2 You warrant that you are legally authorized to utilize the payment instrument
                provided and that sufficient credit or balance is available to complete the purchase.
              </p>
            </section>

            {/* 5. Shipping and Delivery */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                5. SHIPPING AND DELIVERY
              </h2>
              <p className="mb-3">
                5.1 Your Dispatch Confirmation email will contain real-time carrier tracking details.
                We provide complimentary carbon-neutral standard delivery on all domestic footwear
                orders.
              </p>
              <p className="mb-3">
                5.2 If no recipient is available at the delivery address, our courier partner will
                attempt delivery up to three (3) times and leave a delivery attempt notice before
                returning the package to the fulfillment hub.
              </p>
              <p className="mb-3">
                5.3 Delivery of an order is deemed complete when our partner hands over the shipment
                to the address provided or security desk with digital OTP/signature verification.
              </p>
              <p className="mb-3">
                5.4 Except in cases of Events Outside Our Control (see Section 9), all domestic orders
                will be delivered within standard logistics timelines, not exceeding 45 (forty-five)
                days from the order confirmation date. If delivery cannot be fulfilled within this
                window, you may cancel the order and receive a 100% full refund without deduction.
              </p>
              <p className="mb-3">
                5.5 Where Cash on Delivery (COD) is available, payments must be made in Indian Rupees
                (INR). Delivery may be withheld if payment is not tendered upon arrival.
              </p>
            </section>

            {/* 6. Returns & 14-Day Policy */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                6. 14-DAY HASSLE-FREE RETURNS
              </h2>
              <p className="mb-3">
                6.1 We provide a 14-day return window from the date of delivery. You can initiate a
                return online through your account or by contacting{' '}
                <a
                  href="mailto:support@aesthetxways.com"
                  className="text-[#111111] underline hover:text-[#707072]"
                >
                  support@aesthetxways.com
                </a>
                .
              </p>
              <p className="mb-3">
                6.2 Returned merchandise must be in brand-new, unworn condition with all original tags,
                packaging, brand boxes, and invoices intact. Items showing signs of wear or damage will
                not pass inspection.
              </p>
              <p className="mb-3">
                6.3 All returns undergo doorstep Quality Check (QC) by our logistics partner prior to
                pickup. Once the return passes inspection and is marked “Picked Up”, your refund will
                be credited to your original payment method within standard banking timelines.
              </p>
              <p className="mb-3">
                6.4 For COD orders, refunds are processed via secure NEFT/UPI bank transfer upon
                verification of the customer’s bank account details.
              </p>
            </section>

            {/* 7. Faulty Merchandise */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                7. FAULTY MERCHANDISE
              </h2>
              <p className="mb-3">
                7.1 Every Aesthetx Ways product is thoroughly inspected before dispatch. If you
                receive merchandise with a manufacturing defect or non-conformance, notify us within 14
                days of delivery with photos of the issue.
              </p>
              <p className="mb-3">
                7.2 Upon verification, we will arrange complimentary courier pickup and offer your
                choice of an immediate replacement or a 100% full refund back to your original
                payment instrument.
              </p>
            </section>

            {/* 8. Representations and Warranties */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                8. REPRESENTATIONS, WARRANTIES & LIMITATION OF LIABILITY
              </h2>
              <p className="mb-3 uppercase font-semibold text-[13px] tracking-wide text-[#555555]">
                Disclaimer of Warranty & Limitation of Liability
              </p>
              <p className="mb-3 text-[14px] leading-relaxed text-[#444444]">
                THE SITE AND ITS CONTENTS ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS. TO THE
                MAXIMUM EXTENT PERMITTED BY APPLICABLE INDIAN LAW, AESTHETX WAYS
                DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="mb-3 text-[14px] leading-relaxed text-[#444444]">
                IN NO EVENT SHALL AESTHETX WAYS, ITS DIRECTORS, OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR
                ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM
                YOUR USE OF THE SITE OR PURCHASED MERCHANDISE. OUR TOTAL AGGREGATE LIABILITY ARISING
                FROM ANY ORDER OR CONTRACT SHALL NOT EXCEED THE ACTUAL AMOUNT PAID BY YOU FOR THE
                PRODUCT IN QUESTION.
              </p>
            </section>

            {/* 9. Events Outside Our Control */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                9. EVENTS OUTSIDE OUR CONTROL (FORCE MAJEURE)
              </h2>
              <p className="mb-3">
                9.1 We will not be liable for any failure or delay in performance caused by acts or
                events beyond our reasonable control, including natural disasters, severe weather,
                civil unrest, governmental lockdowns, strikes, telecommunication outages, or freight
                disruptions.
              </p>
              <p className="mb-3">
                9.2 If a force majeure event extends beyond 30 consecutive days from your order date,
                you are entitled to cancel the Contract with a full refund.
              </p>
            </section>

            {/* 10. Limited Drops & Exclusive Collections */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                10. LIMITED DROPS & EXCLUSIVE COLLECTIONS
              </h2>
              <p className="mb-3">
                10.1 Aesthetx Ways releases exclusive capsule collections and limited-batch runs. Fulfilling
                curated drop orders is contingent upon material availability and production capacities.
                Lead times and dispatch schedules are communicated directly on the product detail pages.
              </p>
            </section>

            {/* 11 & 12. Breaches & Liability */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                11. BREACHES OF THESE TERMS
              </h2>
              <p className="mb-3">
                Without prejudice to our other legal remedies, if you violate these Terms, we reserve
                the right to suspend your account, block IP access, cancel pending unverified orders,
                and, if warranted, report fraudulent activities to appropriate law enforcement
                authorities.
              </p>
            </section>

            {/* 13. Governing Law & Jurisdiction */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                12. GOVERNING LAW & JURISDICTION
              </h2>
              <p className="mb-3">
                These Terms and any Contract for the purchase of Products shall be governed by and
                construed in accordance with the laws of the Republic of India. In the event of any
                unresolved dispute, the competent courts at Mumbai, Maharashtra shall have exclusive
                jurisdiction.
              </p>
            </section>

            {/* 14. Other Important Terms */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-4 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                13. OTHER IMPORTANT PROVISIONS
              </h2>
              <p className="mb-3">
                13.1 <strong className="text-[#111111]">Severability:</strong> Each clause of these
                Terms operates separately. If any court determines that any provision is unlawful or
                unenforceable, the remaining clauses will continue in full force and effect.
              </p>
              <p className="mb-3">
                13.2 <strong className="text-[#111111]">Privacy:</strong> We process your personal
                information strictly in accordance with our{' '}
                <Link
                  href="/terms"
                  className="text-[#111111] underline hover:text-[#707072] transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="mb-3">
                13.3 <strong className="text-[#111111]">Consumer Rights:</strong> As a valued
                consumer, you are entitled to all statutory protections under the Consumer Protection
                Act, 2019. Nothing in these Terms derogates from your fundamental statutory rights.
              </p>
            </section>
          </div>

          {/* Bottom Back to Home CTA */}
          <div className="mt-12 pt-8 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-[#111111] hover:text-[#707072] transition-colors"
            >
              <span>← Back to Home</span>
            </Link>
            <Link
              href="/#fresh-drops"
              className="px-6 py-3 rounded-full bg-[#111111] text-white hover:bg-black text-[14px] font-medium transition-all"
            >
              Explore Fresh Drops
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
