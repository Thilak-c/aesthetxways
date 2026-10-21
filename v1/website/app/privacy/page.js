import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Aesthetx Ways India',
  description:
    'Read the official Privacy Policy for Aesthetx Ways in India. Learn how we collect, protect, and process your personal information under the Digital Personal Data Protection Act (DPDPA).',
  keywords: [
    'Aesthetx Ways privacy policy',
    'fashion and apparel privacy policy india',
    'DPDP Act 2023 compliance',
    'customer data protection',
    'data fiduciary india',
    'grievance redressal policy',
  ],
  alternates: {
    canonical: 'https://aesthetxways.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Aesthetx Ways India',
    description:
      'Official Data Protection, Privacy, and Customer Grievance Redressal Policy for Aesthetx Ways.',
    url: 'https://aesthetxways.com/privacy',
    siteName: 'Aesthetx Ways',
    images: ['/logo_t.svg'],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy — Aesthetx Ways',
    description:
      'Official Data Protection and Privacy Policy for Aesthetx Ways in India.',
    images: ['/logo_t.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://aesthetxways.com/privacy#webpage',
        url: 'https://aesthetxways.com/privacy',
        name: 'Privacy Policy | Aesthetx Ways India',
        description:
          'Official Privacy and Data Protection Policy for Aesthetx Ways in India under the Digital Personal Data Protection Act of 2023.',
        publisher: {
          '@id': 'https://aesthetxways.com/#organization',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://aesthetxways.com/privacy#breadcrumb',
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
            name: 'Privacy Policy',
            item: 'https://aesthetxways.com/privacy',
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
          contactType: 'Privacy & Customer Support',
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
            <span className="text-[#111111] font-medium">Privacy Policy</span>
          </nav>
        </div>

        {/* Main Content Article */}
        <main className="max-w-[880px] mx-auto px-6 py-10 sm:py-16">
          <header className="mb-10 pb-6 border-b border-[#e5e5e5]">
            <h1
              className="text-[28px] sm:text-[38px] font-bold text-[#111111] tracking-tight leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              AESTHETX WAYS PRIVACY POLICY
            </h1>
            <p className="text-[14px] text-[#707072] mt-2">
              Updated October 2026 • In compliance with the Digital Personal Data Protection Act of 2023
            </p>
          </header>

          <div className="space-y-8 text-[15px] sm:text-[16px] text-[#222222] leading-relaxed">
            {/* Preamble */}
            <section className="space-y-4">
              <p>
                This <strong className="text-[#111111]">Privacy Policy</strong> outlines{' '}
                <strong className="text-[#111111]">Aesthetx Ways</strong>’s approach
                to Data Protection and Privacy to fulfill its obligations under the{' '}
                <strong className="text-[#111111]">applicable laws and regulations in India</strong>
                , including, but not limited to, the Digital Personal Data Protection Act of 2023
                (DPDPA), the Information Technology Act of 2000, and related rules. This Privacy Policy
                describes the personal data collected, stored, and processed when you interact through{' '}
                <Link href="/" className="text-[#111111] underline hover:text-[#707072] transition-colors">
                  aesthetxways.com
                </Link>{' '}
                or mobile touchpoints (collectively defined as the “
                <strong className="text-[#111111]">Platform</strong>”).
              </p>
              <p>
                By providing consent when registering an account, entering mobile information, or
                browsing our Platform, you expressly agree to be bound by this Privacy Policy and agree
                to be governed by the laws of India. If you do not consent, you may choose not to
                provide certain information, though you may not be able to use certain features or
                order products on our Platform.
              </p>
              <p>
                Throughout this document, “we”, “us”, “our”, “ours”, “Aesthetx Ways” refer to{' '}
                <strong className="text-[#111111]">Aesthetx Ways</strong>. Wherever we
                have said “you” or “your” or “Customer”, this refers to YOU as the Data Principal.
              </p>
            </section>

            {/* Who We Are */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                WHO WE ARE
              </h2>
              <p className="mb-3">
                <strong className="text-[#111111]">Aesthetx Ways</strong> is an Indian brand operating
                premier lifestyle, streetwear, and fashion stores with its primary retail flagship at Gaya Station Campus
                Rd, Gol Bagicha, Gaya, Bihar – 823002, India.
              </p>
              <p className="mb-3">
                Aesthetx Ways designs, markets, and fulfills curated luxury apparel, footwear, headwear,
                and lifestyle merchandise directly to consumers with delivery addresses within India.
              </p>
            </section>

            {/* Roles We Play */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                ROLES WE PLAY
              </h2>
              <p>
                We play the role of a <strong className="text-[#111111]">Data Fiduciary</strong> when we
                determine the purpose and means of collecting and processing Personal Information about
                you. When handling fulfillment via authorized logistics providers or payment
                aggregators under our strict instruction, those partners act as Data Processors bound by
                confidentiality agreements.
              </p>
            </section>

            {/* Our Commitment */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                OUR COMMITMENT
              </h2>
              <p>
                We are committed to treating data privacy with utmost seriousness. We apply the principle
                of data minimisation: collecting only the minimum information necessary to provide an
                elevated, secure shopping experience, fulfill orders, and maintain reliable customer
                support.
              </p>
            </section>

            {/* Personal Information Gathered */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                PERSONAL INFORMATION GATHERED BY US
              </h2>
              <p className="mb-3">
                The information we gather from you is used to authenticate you, manage your cart, process
                payments, deliver products, communicate order statuses, provide customer service, and
                personalize your shopping experience.
              </p>

              <h3 className="text-[17px] font-bold text-[#111111] mt-4 mb-2">Information You Give Us:</h3>
              <p className="mb-2">We store information you provide while interacting with our Platform:</p>
              <ul className="list-disc pl-6 space-y-1.5 mb-4">
                <li>
                  <strong className="text-[#111111]">Contact Details:</strong> Name, email address,
                  telephone / mobile number, shipping address, and billing address.
                </li>
                <li>
                  <strong className="text-[#111111]">Size & Apparel Preferences:</strong> Sizing
                  choices, colorway selections, and order history.
                </li>
                <li>
                  <strong className="text-[#111111]">Payment Data:</strong> Payment method identifiers
                  processed via tokenized PCI-DSS compliant payment gateways (we never store raw CVV or
                  card PINs).
                </li>
                <li>
                  <strong className="text-[#111111]">Communications:</strong> Notes and emails submitted
                  to Customer Care.
                </li>
              </ul>

              <h3 className="text-[17px] font-bold text-[#111111] mt-4 mb-2">
                Information We Collect Automatically:
              </h3>
              <p className="mb-2">
                When you browse our Platform, certain data is automatically transmitted by your web browser:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mb-4">
                <li>Device identifier, IP address, operating system, and browser version.</li>
                <li>Referring URLs, pages viewed, time spent, and interaction telemetry.</li>
                <li>Session cookies used to keep your shopping bag persistent across navigation.</li>
              </ul>
            </section>

            {/* Purposes of Gathering Personal Information */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                PURPOSES OF PROCESSING YOUR PERSONAL INFORMATION
              </h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong className="text-[#111111]">Order Fulfillment:</strong> To prepare, dispatch,
                  track, and deliver your orders and process 14-day returns or exchanges.
                </li>
                <li>
                  <strong className="text-[#111111]">Customer Support:</strong> To resolve order
                  queries, respond to feedback, and provide sizing consultations.
                </li>
                <li>
                  <strong className="text-[#111111]">Service Improvements:</strong> To monitor system
                  uptime, optimize page load performance, and refine product categorization.
                </li>
                <li>
                  <strong className="text-[#111111]">Security & Fraud Prevention:</strong> To detect,
                  prevent, and investigate unauthorized transactions, spam, or abusive behavior.
                </li>
                <li>
                  <strong className="text-[#111111]">Legal Compliance:</strong> To comply with tax laws
                  (GST invoices), judicial orders, and statutory record-keeping mandates under Indian law.
                </li>
              </ul>
            </section>

            {/* Sharing & Disclosure */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                DISCLOSURE OF PERSONAL INFORMATION
              </h2>
              <p className="mb-3">
                We do not sell, rent, or trade your personal information. We disclose information only to
                vetted third-party service providers who assist us in operating our Platform and servicing
                your orders:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong className="text-[#111111]">Logistics & Courier Partners:</strong> To print
                  shipping labels and deliver packages to your doorstep with digital OTP verification.
                </li>
                <li>
                  <strong className="text-[#111111]">Payment Processors:</strong> To authenticate UPI,
                  NetBanking, and credit/debit card transactions over secure encrypted channels.
                </li>
                <li>
                  <strong className="text-[#111111]">Cloud & Database Infrastructure:</strong> Secure,
                  monitored hosting environments with strict access controls.
                </li>
                <li>
                  <strong className="text-[#111111]">Statutory & Regulatory Bodies:</strong> Where
                  mandated by applicable law, court order, or governmental authorities.
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                DATA SECURITY
              </h2>
              <p className="mb-3">
                We implement comprehensive physical, technical, and administrative safeguards to protect
                your personal data against unauthorized access, alteration, loss, or disclosure. All web
                traffic is strictly encrypted in transit using industry-standard Transport Layer Security
                (TLS/HTTPS).
              </p>
              <p>
                Our payment checkout conforms to PCI-DSS standards, ensuring your payment credentials are
                never accessible in raw format.
              </p>
            </section>

            {/* Retention and Disposal */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                RETENTION AND DISPOSAL OF DATA
              </h2>
              <p>
                We retain your Personal Information only for as long as is necessary to fulfill the purposes
                outlined in this Privacy Policy, satisfy legal and accounting requirements (e.g., GST
                invoicing rules), or resolve disputes. Once personal data is no longer required, we take
                reasonable steps to permanently delete or de-identify it.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                CHILDREN’S PRIVACY
              </h2>
              <p>
                Our Platform is designed exclusively for adults (18 years or older). We do not knowingly
                collect or solicit Personal Information from minors. If you believe a minor has provided us
                with personal data without parental consent, please contact our Grievance Officer immediately
                at{' '}
                <a
                  href="mailto:support@aesthetxways.com"
                  className="text-[#111111] underline hover:text-[#707072]"
                >
                  support@aesthetxways.com
                </a>
                , and we will delete the data from our records.
              </p>
            </section>

            {/* Your Rights as a Customer */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                YOUR RIGHTS UNDER INDIAN LAW
              </h2>
              <p className="mb-2">
                Under the Digital Personal Data Protection Act of 2023, you have specific rights as a Data
                Principal:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mb-3">
                <li>
                  <strong className="text-[#111111]">Right to Access:</strong> You may request a summary
                  of personal data processed by us and the third parties with whom it has been shared.
                </li>
                <li>
                  <strong className="text-[#111111]">Right to Correction & Erasure:</strong> You can
                  request correction of inaccurate information or deletion of data no longer needed.
                </li>
                <li>
                  <strong className="text-[#111111]">Right to Grievance Redressal:</strong> You have the
                  right to prompt redressal of any concerns via our dedicated Grievance Officer.
                </li>
                <li>
                  <strong className="text-[#111111]">Right to Nominate:</strong> You have the right to
                  nominate an individual to exercise your rights in the event of death or incapacity.
                </li>
              </ul>
            </section>

            {/* Cookies Policy */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                COOKIES AND SIMILAR TECHNOLOGIES
              </h2>
              <p className="mb-3">
                Cookies are small text files placed on your browser to support essential site functions:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  <strong className="text-[#111111]">Strictly Necessary Cookies:</strong> Required to maintain
                  your active bag items, authenticate login sessions, and secure checkout.
                </li>
                <li>
                  <strong className="text-[#111111]">Functional Cookies:</strong> Remember your selected size
                  preferences and unit choices (e.g., UK sizes or inch/cm toggles).
                </li>
                <li>
                  <strong className="text-[#111111]">Performance Cookies:</strong> Aggregated, anonymous
                  telemetry used to optimize page speed and storefront reliability.
                </li>
              </ul>
              <p className="text-[14px] text-[#707072]">
                You can manage cookie settings directly through your web browser preferences. Note that
                disabling strictly necessary cookies may impair bag and checkout functionality.
              </p>
            </section>

            {/* Customer Grievance Redressal Policy */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                CUSTOMER GRIEVANCE REDRESSAL POLICY
              </h2>
              <p className="mb-3">
                Customer satisfaction is integral to Aesthetx Ways’s founding principles. We believe that
                transparent, prompt grievance resolution is vital to our relationship with you:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mb-4">
                <li>Customers shall be treated with courtesy and fairness at all times.</li>
                <li>Inquiries and grievances are recorded with a unique tracking ticket.</li>
                <li>Effective resolutions are delivered within statutory timeframes.</li>
              </ul>

              {/* Fraud Warning Callout */}
              <div className="bg-[#fff9e6] border border-[#f0c040] p-4 sm:p-5 rounded-xl my-4 text-[14px] text-[#553c00] space-y-2">
                <p className="font-bold flex items-center gap-2 text-[#735100]">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Important Security Notice – Beware of Fraud:
                </p>
                <p>
                  Aesthetx Ways representatives will <strong className="text-[#553c00]">NEVER</strong> ask for your
                  OTP, CVV, Card Number, ATM PIN, or NetBanking password over phone, SMS, WhatsApp, or
                  email. We never call asking you to download remote desktop apps or transfer money for
                  lottery prizes.
                </p>
              </div>

              {/* Grievance Officer Details Box */}
              <div className="bg-[#f8f8f8] p-5 sm:p-6 rounded-2xl border border-neutral-200/80 my-4 space-y-3">
                <h3 className="text-[15px] font-bold text-[#111111] uppercase tracking-wider">
                  Contact Our Grievance Officer:
                </h3>
                <p className="text-[13px] text-[#707072]">
                  In accordance with the Information Technology Act, 2000 and Consumer Protection
                  (E-Commerce) Rules, 2020:
                </p>
                <ul className="space-y-1.5 text-[14px] text-[#333333]">
                  <li>
                    <strong className="text-[#111111]">Grievance / Nodal Officer:</strong> Customer Experience Lead
                  </li>
                  <li>
                    <strong className="text-[#111111]">Designation:</strong> Head of Customer Relations & Privacy
                  </li>
                  <li>
                    <strong className="text-[#111111]">Corporate Office:</strong> Aesthetx Ways, Gaya Station
                    Campus Rd, Gol Bagicha, Gaya, Bihar, PIN – 823002
                  </li>
                  <li>
                    <strong className="text-[#111111]">Email:</strong>{' '}
                    <a
                      href="mailto:support@aesthetxways.com"
                      className="text-[#111111] underline hover:text-[#707072]"
                    >
                      support@aesthetxways.com
                    </a>
                  </li>
                  <li>
                    <strong className="text-[#111111]">Dedicated Helpline:</strong> +91 70337 69997 (Monday to
                    Saturday, 10:00 AM – 7:00 PM IST)
                  </li>
                </ul>
              </div>
            </section>

            {/* Notification of Changes */}
            <section className="pt-4 border-t border-[#f0f0f0]">
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#111111] mb-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                NOTIFICATION OF CHANGES
              </h2>
              <p>
                We keep our Privacy Policy under regular review to ensure it remains compliant with changing
                laws and technological developments. Any revisions will be published directly on this page
                with an updated effective date.
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
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-[14px] text-[#707072] hover:text-[#111111] underline transition-colors"
              >
                Terms and Conditions
              </Link>
              <Link
                href="/#fresh-drops"
                className="px-6 py-2.5 rounded-full bg-[#111111] text-white hover:bg-black text-[14px] font-medium transition-all"
              >
                Explore Fresh Drops
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
