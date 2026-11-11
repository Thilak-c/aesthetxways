import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ConvexProvider } from "../convexClient";
import AuthWrapper from "@/components/AuthWrapper";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Aesthetx Ways",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} font-inter antialiased`}>
        <ConvexProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </ConvexProvider>
      </body>
    </html>
  );
}
