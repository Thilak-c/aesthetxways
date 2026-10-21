import { Geist, Geist_Mono, Moirai_One, Oi } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SplashWrapper from "@/components/SplashWrapper";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AgentationWrapper from "@/components/AgentationWrapper";
import SiteStatusGate from "@/components/SiteStatusGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const moiraiOne = Moirai_One({
  weight: "400",
  variable: "--font-moirai",
  subsets: ["latin"],
});

const oi = Oi({
  weight: "400",
  variable: "--font-oi",
  subsets: ["latin"],
});

const loveloBlack = localFont({
  src: "../public/home/Lovelo Black.otf",
  variable: "--font-lovelo-black",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://aesthetxways.com'),
  title: "Aesthetx Ways | Home Page",
  description: "Sleek, minimalistic clothing, footwear, headwear, and eyewear.",
};

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'Stores', ariaLabel: 'Go to store locations page', link: '/stores' },
  { label: 'Bag', ariaLabel: 'Go to cart page', link: '/cart' },
  { label: 'Orders', ariaLabel: 'Go to orders page', link: '/orders' }
];

const socialItems = [
  { label: 'Instagram', link: 'https://instagram.com' }
];

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${moiraiOne.variable} ${oi.variable} ${loveloBlack.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.location.hostname.indexOf('trycloudflare.com') !== -1) {
                  var OrigWS = window.WebSocket;
                  window.WebSocket = function(url, protocols) {
                    if (typeof url === 'string' && url.indexOf('_next/webpack-hmr') !== -1) {
                      var dummy = new EventTarget();
                      dummy.readyState = 3;
                      dummy.close = function() {};
                      dummy.send = function() {};
                      setTimeout(function() {
                        if (dummy.onclose) dummy.onclose(new CloseEvent('close'));
                      }, 0);
                      return dummy;
                    }
                    return new OrigWS(url, protocols);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-zinc-100 sm:bg-zinc-950 sm:flex sm:justify-center sm:items-center text-zinc-950 font-sans p-0 sm:p-6 sm:overflow-hidden relative">
        {/* Premium Luxury Tech Glow Backdrop - Visible on Desktop only */}
        {/* <div className="hidden sm:block absolute inset-0  pointer-events-none z-0" /> */}
        {/* <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" /> */}

        {/* Premium Mobile Phone Mock Frame Shell */}
        <div
          id="phone-mock-shell"
          className="relative w-full max-w-[430px] min-h-screen sm:min-h-0 h-auto sm:h-[880px] sm:max-h-[92vh] bg-white sm:rounded-[52px] flex flex-col sm:overflow-hidden sm:transition-all sm:duration-500 z-10"
        >


          {/* Main Mobile App Container */}
          <div id="mobile-frame" className="w-full flex-1 flex flex-col relative bg-white pb-12">
            <SiteStatusGate>
              <SplashWrapper>
                <Header />
                {children}
                <BottomNav />
              </SplashWrapper>
            </SiteStatusGate>
          </div>

        </div>
        {/* <AgentationWrapper /> */}
      </body>
    </html>
  );
}
