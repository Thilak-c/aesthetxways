"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Package } from "lucide-react";

export default function AuthWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const isPublicReceipt = pathname && 
      pathname !== "/" && 
      pathname !== "/login" && 
      !pathname.startsWith("/website") && 
      !pathname.startsWith("/barcode") && 
      !pathname.startsWith("/api");

    // Skip auth check on login page, public E-bill paths, and Billing page (which handles inline PIN auth)
    if (pathname === "/login" || pathname === "/website/billing" || pathname === "/website/Bill-offline" || isPublicReceipt) {
      setIsChecking(false);
      return;
    }

    // Check auth from localStorage
    const authData = localStorage.getItem("insys_auth");
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Must have both isLoggedIn AND storeType selected
        if (parsed.isLoggedIn && parsed.storeType) {
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
      } catch (e) {
        // Invalid auth data
      }
    }

    // Not authenticated, redirect to login
    router.push("/login");
  }, [pathname, router]);

  // Show loading while checking auth
  const isPublicReceipt = pathname && 
    pathname !== "/" && 
    pathname !== "/login" && 
    !pathname.startsWith("/website") && 
    !pathname.startsWith("/barcode") && 
    !pathname.startsWith("/api");

  if (isChecking && pathname !== "/login" && !isPublicReceipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 animate-bounce p-2 ">
            <img src="/logo.png" alt="Aesthetx Ways Logo" className="w-12 h-12 object-contain" />
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // On login page, billing desk (inline PIN auth), or public E-bill paths, just render children
  if (pathname === "/login" || pathname === "/website/billing" || pathname === "/website/Bill-offline" || isPublicReceipt) {
    return children;
  }

  // Authenticated, render children
  if (isAuthenticated) {
    return children;
  }

  // Fallback loading
  return null;
}
