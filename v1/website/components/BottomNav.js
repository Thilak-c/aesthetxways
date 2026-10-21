'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState(null);

  const overlayRef = useRef(null);
  const loaderRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Helper to determine if a route is active
  const isActive = (path) => {
    if (path === '/') {
      // Highlight shop tab on homepage and details page
      return pathname === '/' || pathname.startsWith('/product/');
    }
    return pathname === path;
  };

  const handleTabClick = (e, path) => {
    if (pathname === path || isTransitioning) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setTargetPath(path);
    setIsTransitioning(true);
  };

  // Disable body and frame scrolling when transitioning
  useEffect(() => {
    const frame = document.getElementById('mobile-frame');
    if (isTransitioning) {
      if (frame) frame.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      if (frame) frame.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      if (frame) frame.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isTransitioning]);

  // 1. Reveal-up animation when transition starts (using clipPath so content stays centered)
  useEffect(() => {
    if (isTransitioning && targetPath) {
      // Calculate the clip start: show only bottom 49px of viewport
      const viewportHeight = window.innerHeight;
      const clipTop = ((viewportHeight - 49) / viewportHeight) * 100;

      // Reset values
      gsap.set(progressBarRef.current, { width: '0%' });
      gsap.set(loaderRef.current, { opacity: 0, scale: 0.95 });
      // Overlay stays at inset-0, only clip changes — content is always centered
      gsap.set(overlayRef.current, { clipPath: `inset(${clipTop}% 0 0 0)` });

      const tl = gsap.timeline({
        onComplete: () => {
          router.push(targetPath);
        }
      });

      // Reveal upward by removing the clip
      tl.to(overlayRef.current, {
        clipPath: 'inset(0% 0 0 0)',
        duration: 0.45,
        ease: 'power3.inOut'
      });

      // Fade in loader content (logo + progress bar + text)
      tl.to(loaderRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.2)'
      }, '-=0.3');

      // Animate progress line to 100%
      tl.to(progressBarRef.current, {
        width: '100%',
        duration: 0.8,
        ease: 'power2.inOut'
      });
    }
  }, [isTransitioning, targetPath, router]);

  // 2. Slide-down animation when routing is complete and page matches targetPath
  useEffect(() => {
    if (isTransitioning && targetPath && pathname === targetPath) {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsTransitioning(false);
          setTargetPath(null);
        }
      });

      // Fade out loader content
      tl.to(loaderRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: 'power2.in'
      });

      // Clip away downward
      tl.to(overlayRef.current, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.4,
        ease: 'power3.inOut'
      });
    }
  }, [pathname, isTransitioning, targetPath]);

  // Hide BottomNav on Cart and Checkout pages so it doesn't overlap the Proceed to Buy / Pay button
  if (pathname === '/cart' || pathname === '/checkout') {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-45 bg-white border-t border-zinc-100 max-w-[430px] mx-auto shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-around py-3">
          <Link 
            href="/" 
            onClick={(e) => handleTabClick(e, '/')}
            className={`flex flex-col items-center gap-0.5 ${
              isActive('/') ? 'text-black' : 'text-zinc-400 hover:text-black transition-colors'
            }`}
          >
            <span className="text-[9px] tracking-widest uppercase font-bold">Shop</span>
            <span className={`w-1 h-1 rounded-full ${isActive('/') ? 'bg-black' : 'bg-transparent'}`}></span>
          </Link>
          <Link 
            href="/stores" 
            onClick={(e) => handleTabClick(e, '/stores')}
            className={`flex flex-col items-center gap-0.5 ${
              isActive('/stores') ? 'text-black' : 'text-zinc-400 hover:text-black transition-colors'
            }`}
          >
            <span className="text-[9px] tracking-widest uppercase font-bold">Stores</span>
            <span className={`w-1 h-1 rounded-full ${isActive('/stores') ? 'bg-black' : 'bg-transparent'}`}></span>
          </Link>
          <Link 
            href="/cart" 
            onClick={(e) => handleTabClick(e, '/cart')}
            className={`flex flex-col items-center gap-0.5 ${
              isActive('/cart') ? 'text-black' : 'text-zinc-400 hover:text-black transition-colors'
            }`}
          >
            <span className="text-[9px] tracking-widest uppercase font-bold">Bag</span>
            <span className={`w-1 h-1 rounded-full ${isActive('/cart') ? 'bg-black' : 'bg-transparent'}`}></span>
          </Link>
          <Link 
            href="/orders" 
            onClick={(e) => handleTabClick(e, '/orders')}
            className={`flex flex-col items-center gap-0.5 ${
              isActive('/orders') ? 'text-black' : 'text-zinc-400 hover:text-black transition-colors'
            }`}
          >
            <span className="text-[9px] tracking-widest uppercase font-bold">Orders</span>
            <span className={`w-1 h-1 rounded-full ${isActive('/orders') ? 'bg-black' : 'bg-transparent'}`}></span>
          </Link>
        </div>
      </nav>

      {/* Transition Overlay — stays at inset-0, uses clipPath to reveal */}
      {mounted && isTransitioning && createPortal(
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col items-center justify-center select-none max-w-[430px] mx-auto"
          style={{ clipPath: 'inset(100% 0 0 0)' }}
        >
          <div 
            ref={loaderRef}
            className="flex flex-col items-center gap-4 opacity-0 scale-95"
          >
            {/* Minimalist Watermark Logo — centered */}
            <img 
              src="/logo_t.svg" 
              alt="Logo" 
              className="w-14 h-14 object-contain opacity-80 filter grayscale"
            />
            {/* Tech Loading Progress Bar */}
            <div className="w-24 h-px bg-zinc-100 relative overflow-hidden mt-1">
              <div 
                ref={progressBarRef}
                className="absolute left-0 top-0 bottom-0 bg-black"
                style={{ width: '0%' }}
              />
            </div>
            {/* Micro-text */}
            <span className="text-[7.5px] tracking-widest uppercase text-zinc-400 mt-2 font-medium">
              Loading refinement...
            </span>
          </div>
        </div>,
        document.getElementById('mobile-frame') || document.body
      )}
    </>
  );
}
