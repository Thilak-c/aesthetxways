import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-white px-6 pb-24 sm:pb-8 pt-4 font-['Helvetica_Now_Text',sans-serif]">
      <div className="max-w-[1440px] mx-auto flex flex-col items-start gap-2.5 text-[12px] sm:text-[13px] text-[#707072] leading-tight">
        <p>© 2026 Aesthetx Ways. All rights reserved</p>
        <p>Powered by Flowify Agency</p>
        <Link
          href="/orders"
          className="hover:text-[#111111] transition-colors"
        >
          Orders & Tracking
        </Link>
        <Link
          href="/favourites"
          className="hover:text-[#111111] transition-colors"
        >
          Favourites
        </Link>
        <Link
          href="/help-center"
          className="hover:text-[#111111] transition-colors"
        >
          Help Center & FAQs
        </Link>
        <Link
          href="/terms"
          className="hover:text-[#111111] transition-colors"
        >
          Terms of Use
        </Link>
        <Link
          href="/privacy"
          className="hover:text-[#111111] transition-colors"
        >
          Aesthetx Ways Privacy Policy
        </Link>
        {/* <Link
          href="#"
          className="hover:text-[#111111] transition-colors"
        >
          Store Claim Policy
        </Link> */}
      </div>
    </footer>
  );
}
