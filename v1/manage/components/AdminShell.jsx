'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidGlass } from '@/components/ui/liquid-glass';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Receipt,
  Settings,
  ExternalLink,
  Menu,
  X,
  Search,
  Bell,
  CheckCircle2,
  Database,
  ArrowUpRight,
  Plus,
  SlidersHorizontal,
  BarChart3,
  Eye,
  LogOut,
  UserCheck,
} from 'lucide-react';

function OrdersIcon({ className = 'w-6 h-6' }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        backgroundColor: 'currentColor',
        maskImage: 'url(/orders-icon.png)',
        WebkitMaskImage: 'url(/orders-icon.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden="true"
    />
  );
}

function ProductsIcon({ className = 'w-6 h-6' }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        backgroundColor: 'currentColor',
        maskImage: 'url(/products-icon.png)',
        WebkitMaskImage: 'url(/products-icon.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden="true"
    />
  );
}

function BillingIcon({ className = 'w-6 h-6' }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        backgroundColor: 'currentColor',
        maskImage: 'url(/billing-icon.png)',
        WebkitMaskImage: 'url(/billing-icon.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden="true"
    />
  );
}

function SettingsIcon({ className = 'w-6 h-6' }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        backgroundColor: 'currentColor',
        maskImage: 'url(/settings-icon.png)',
        WebkitMaskImage: 'url(/settings-icon.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden="true"
    />
  );
}

export default function AdminShell({ children, onNewProductClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbHealthy, setDbHealthy] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [user, setUser] = useState('Admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('insys_auth');
      if (stored) {
        try {
          const authData = JSON.parse(stored);
          if (authData.adminId) setUser(authData.adminId);
        } catch {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('insys_auth');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: 'Orders', href: '/website/orders', icon: OrdersIcon },
    { label: 'Products', href: '/website/products', icon: ProductsIcon },
    { label: 'Billing Desk', href: '/website/billing', icon: BillingIcon },
    { label: 'Analytics', href: '/website/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/website/settings', icon: SettingsIcon },
  ];

  const bottomNavItems = [
    { label: 'Orders', href: '/website/orders', icon: OrdersIcon },
    { label: 'Products', href: '/website/products', icon: ProductsIcon },
    { label: 'Billing', href: '/website/billing', icon: BillingIcon },
    { label: 'Settings', href: '/website/settings', icon: SettingsIcon },
  ];

  const isItemActive = (href) => {
    if (href === '/website/orders') return pathname.includes('/orders');
    if (href === '/website/products') return pathname.includes('/products');
    if (href === '/website/billing') return pathname.includes('/billing');
    if (href === '/website/settings') return pathname.includes('/settings');
    return pathname === href;
  };

  const currentActiveIndex = useMemo(() => {
    const idx = bottomNavItems.findIndex((item) => isItemActive(item.href));
    return idx >= 0 ? idx : 0;
  }, [pathname]);

  // Dynamic dimension & 1:1 finger tracking state for the liquid bubble
  const [activeTabDimensions, setActiveTabDimensions] = useState({ top: 8, left: 10, width: 80, height: 56 });
  const [bubbleX, setBubbleX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navRef = useRef(null);
  const itemRefs = useRef([]);
  const pointerStartRef = useRef(null);

  const updateActiveTabDimensions = (idx = currentActiveIndex) => {
    const el = itemRefs.current[idx];
    if (el) {
      setActiveTabDimensions({
        top: el.offsetTop,
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  };

  useEffect(() => {
    updateActiveTabDimensions(currentActiveIndex);
    const id = requestAnimationFrame(() => updateActiveTabDimensions(currentActiveIndex));
    return () => cancelAnimationFrame(id);
  }, [currentActiveIndex]);

  useEffect(() => {
    const handleResize = () => updateActiveTabDimensions(currentActiveIndex);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentActiveIndex]);

  const getIndexFromX = (clientX) => {
    // 1. Direct item bounding hit test
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          return i;
        }
      }
    }

    // 2. Continuous proportional zone across the capsule
    if (navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const relativeX = clientX - navRect.left;
      const fraction = Math.max(0, Math.min(0.999, relativeX / navRect.width));
      return Math.floor(fraction * bottomNavItems.length);
    }

    return 0;
  };

  const calculateBubbleX = (clientX) => {
    if (!navRef.current) return 10;
    const navRect = navRef.current.getBoundingClientRect();
    const bubbleW = activeTabDimensions.width || 80;
    const rawX = clientX - navRect.left - bubbleW / 2;
    const firstEl = itemRefs.current[0];
    const lastEl = itemRefs.current[itemRefs.current.length - 1];
    const minX = firstEl ? firstEl.offsetLeft : 10;
    const maxX = lastEl ? lastEl.offsetLeft : navRect.width - bubbleW - 10;
    return Math.max(minX, Math.min(maxX, rawX));
  };

  const handlePointerDown = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    const clampedX = calculateBubbleX(e.clientX);
    const idx = getIndexFromX(e.clientX);
    setBubbleX(clampedX);
    setHoveredIndex(idx);
  };

  const handlePointerMove = (e) => {
    if (!pointerStartRef.current) return;
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    if (deltaX > 2) {
      setIsDragging(true);
      const clampedX = calculateBubbleX(e.clientX);
      const newIndex = getIndexFromX(e.clientX);
      setBubbleX(clampedX);
      setHoveredIndex(newIndex);
    }
  };

  const handlePointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (pointerStartRef.current) {
      const finalIndex = hoveredIndex !== null ? hoveredIndex : currentActiveIndex;
      const target = bottomNavItems[finalIndex];
      if (target && !isItemActive(target.href)) {
        router.push(target.href);
      }
    }
    pointerStartRef.current = null;
    setIsDragging(false);
    setBubbleX(null);
    setHoveredIndex(null);
  };

  // Direct native mobile touch events for 1:1 finger tracking
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      pointerStartRef.current = { x: touch.clientX, y: touch.clientY };
      const clampedX = calculateBubbleX(touch.clientX);
      const idx = getIndexFromX(touch.clientX);
      setBubbleX(clampedX);
      setHoveredIndex(idx);
    }
  };

  const handleTouchMove = (e) => {
    if (!pointerStartRef.current || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - pointerStartRef.current.x);
    if (deltaX > 2) {
      setIsDragging(true);
      const clampedX = calculateBubbleX(touch.clientX);
      const newIndex = getIndexFromX(touch.clientX);
      setBubbleX(clampedX);
      setHoveredIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    if (pointerStartRef.current) {
      const finalIndex = hoveredIndex !== null ? hoveredIndex : currentActiveIndex;
      const target = bottomNavItems[finalIndex];
      if (target && !isItemActive(target.href)) {
        router.push(target.href);
      }
    }
    pointerStartRef.current = null;
    setIsDragging(false);
    setBubbleX(null);
    setHoveredIndex(null);
  };

  // Desktop Vertical Liquid Glass Dock state & continuous Y-axis tracking
  const [activeVerticalDimensions, setActiveVerticalDimensions] = useState({ top: 14, left: 6, width: 64, height: 72 });
  const [bubbleY, setBubbleY] = useState(null);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const [hoveredVerticalIndex, setHoveredVerticalIndex] = useState(null);
  const verticalNavRef = useRef(null);
  const verticalItemRefs = useRef([]);
  const verticalPointerStartRef = useRef(null);

  const updateVerticalTabDimensions = (idx = currentActiveIndex) => {
    const el = verticalItemRefs.current[idx];
    if (el) {
      setActiveVerticalDimensions({
        top: el.offsetTop,
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  };

  useEffect(() => {
    updateVerticalTabDimensions(currentActiveIndex);
    const id = requestAnimationFrame(() => updateVerticalTabDimensions(currentActiveIndex));
    return () => cancelAnimationFrame(id);
  }, [currentActiveIndex]);

  useEffect(() => {
    const handleResize = () => {
      updateActiveTabDimensions(currentActiveIndex);
      updateVerticalTabDimensions(currentActiveIndex);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentActiveIndex]);

  const getVerticalIndexFromY = (clientY) => {
    for (let i = 0; i < verticalItemRefs.current.length; i++) {
      const el = verticalItemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          return i;
        }
      }
    }
    if (verticalNavRef.current) {
      const navRect = verticalNavRef.current.getBoundingClientRect();
      const relativeY = clientY - navRect.top;
      const fraction = Math.max(0, Math.min(0.999, relativeY / navRect.height));
      return Math.floor(fraction * bottomNavItems.length);
    }
    return 0;
  };

  const calculateBubbleY = (clientY) => {
    if (!verticalNavRef.current) return 14;
    const navRect = verticalNavRef.current.getBoundingClientRect();
    const bubbleH = activeVerticalDimensions.height || 72;
    const rawY = clientY - navRect.top - bubbleH / 2;
    const firstEl = verticalItemRefs.current[0];
    const lastEl = verticalItemRefs.current[verticalItemRefs.current.length - 1];
    const minY = firstEl ? firstEl.offsetTop : 14;
    const maxY = lastEl ? lastEl.offsetTop : navRect.height - bubbleH - 14;
    return Math.max(minY, Math.min(maxY, rawY));
  };

  const handleVerticalPointerDown = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    verticalPointerStartRef.current = { x: e.clientX, y: e.clientY };
    const clampedY = calculateBubbleY(e.clientY);
    const idx = getVerticalIndexFromY(e.clientY);
    setBubbleY(clampedY);
    setHoveredVerticalIndex(idx);
  };

  const handleVerticalPointerMove = (e) => {
    if (!verticalPointerStartRef.current) return;
    const deltaY = Math.abs(e.clientY - verticalPointerStartRef.current.y);
    if (deltaY > 2) {
      setIsVerticalDragging(true);
      const clampedY = calculateBubbleY(e.clientY);
      const newIndex = getVerticalIndexFromY(e.clientY);
      setBubbleY(clampedY);
      setHoveredVerticalIndex(newIndex);
    }
  };

  const handleVerticalPointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (verticalPointerStartRef.current) {
      const finalIndex = hoveredVerticalIndex !== null ? hoveredVerticalIndex : currentActiveIndex;
      const target = bottomNavItems[finalIndex];
      if (target && !isItemActive(target.href)) {
        router.push(target.href);
      }
    }
    verticalPointerStartRef.current = null;
    setIsVerticalDragging(false);
    setBubbleY(null);
    setHoveredVerticalIndex(null);
  };

  const getPageTitle = () => {
    if (pathname.includes('/orders')) return 'Orders';
    if (pathname.includes('/products')) return 'Products';
    if (pathname.includes('/billing')) return 'Billing Desk';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Aesthetx Ways Admin';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans text-neutral-900">
      {/* Desktop Top-Left Corner Logo */}
      <div className="hidden md:flex fixed top-3 left-3.5 xl:left-5.5 z-40 w-[84px] items-center justify-center">
        <Link
          href="/website/orders"
          className="group flex items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
          title="Aesthetx Ways"
        >
          <img
            src="/logo_sq.png"
            alt="Aesthetx Ways Logo"
            className="w-20 h-20 object-contain mix-blend-multiply select-none pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle, black 60%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 95%)',
            }}
          />
        </Link>
      </div>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 h-16 bg-[#111111] text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 -ml-1.5 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold tracking-wider text-sm">Aesthetx Ways</span>
        </div>

        <a
          href="https://aesthetxways.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] text-white/70 hover:text-white"
        >
          <span>Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111111] border-b border-[#222222] px-4 py-3 space-y-1 z-40">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/website/orders' && pathname.includes('/orders'));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-white text-[#111111]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Vertical Liquid Glass Dock */}
      <div className="hidden md:flex fixed top-1/2 -translate-y-1/2 left-4 xl:left-6 z-50 pointer-events-none select-none">
        <LiquidGlass
          shape="circle"
          scale={33}
          aberration={20}
          bevelDepth={60}
          frost={2.4}
          tint={0.12}
          className="pointer-events-auto shadow-2xl"
        >
          <nav
            ref={verticalNavRef}
            role="navigation"
            aria-label="Desktop Vertical Navigation Dock"
            onPointerDown={handleVerticalPointerDown}
            onPointerMove={handleVerticalPointerMove}
            onPointerUp={handleVerticalPointerUp}
            onPointerCancel={handleVerticalPointerUp}
            className="relative flex flex-col items-center gap-2.5 p-2 py-3.5 rounded-[28px] select-none cursor-grab active:cursor-grabbing touch-none w-[76px]"
            style={{
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
            }}
          >
            {/* The Vertical Liquid Glass Bubble that tracks 1:1 vertically */}
            <motion.div
              initial={false}
              animate={{
                y: bubbleY !== null ? bubbleY : activeVerticalDimensions.top,
                x: activeVerticalDimensions.left,
                width: activeVerticalDimensions.width,
                height: activeVerticalDimensions.height,
              }}
              transition={
                bubbleY !== null
                  ? { type: 'tween', duration: 0 }
                  : { type: 'spring', stiffness: 500, damping: 36 }
              }
              style={{ position: 'absolute', top: 0, left: 0 }}
              className="rounded-2xl pointer-events-none z-20 overflow-hidden"
            >
              <LiquidGlass
                shape="circle"
                scale={3}
                aberration={20}
                bevelDepth={37}
                frost={0}
                tint={0}
                borderTint="rgba(255, 255, 255, 0.95)"
                className="w-full h-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.06),inset_0_1.5px_2px_0_rgba(255,255,255,1),inset_0_-1px_1px_0_rgba(0,0,0,0.05),0_0_16px_rgba(255,255,255,0.7)]"
              >
                {/* Micro liquid specular light arc */}
                <div className="absolute inset-x-2 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full" />
              </LiquidGlass>
            </motion.div>

            {bottomNavItems.map((item, idx) => {
              const Icon = item.icon;
              const active = (hoveredVerticalIndex !== null ? hoveredVerticalIndex : currentActiveIndex) === idx;

              return (
                <button
                  key={item.href}
                  type="button"
                  ref={(el) => {
                    verticalItemRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (!isVerticalDragging) {
                      router.push(item.href);
                    }
                  }}
                  title={item.label}
                  className={`relative z-10 flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 outline-none select-none touch-none cursor-pointer w-[64px] h-[72px] px-1 py-2 ${
                    active
                      ? 'text-[#111111] font-bold'
                      : 'text-[#48484a] hover:text-[#111111] hover:bg-white/10 font-medium'
                  }`}
                  style={{
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    userSelect: 'none',
                  }}
                >
                  <span className="flex flex-col items-center justify-center pointer-events-none gap-1 w-full">
                    <Icon className="w-7 h-7 shrink-0" />
                    <span className="text-[10.5px] leading-tight tracking-tight font-semibold text-center whitespace-nowrap">
                      {item.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </LiquidGlass>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-32">
        <main className="flex-1 w-full pb-24 md:pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full flex-1 flex flex-col min-w-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Floating Apple Liquid Glass Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none max-w-[95vw]">
        <LiquidGlass
          shape="circle"
          scale={33}
          aberration={20}
          bevelDepth={60}
          frost={2.4}
          tint={0.12}
          className="pointer-events-auto shadow-2xl"
        >
          <nav
            ref={navRef}
            role="navigation"
            aria-label="Bottom Navigation Bar"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative flex items-center gap-2 sm:gap-3.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-full select-none cursor-grab active:cursor-grabbing touch-none"
            style={{
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
            }}
          >
            {/* The Real Liquid Glass Bubble that directly follows your finger */}
            <motion.div
              initial={false}
              animate={{
                x: bubbleX !== null ? bubbleX : activeTabDimensions.left,
                y: activeTabDimensions.top,
                width: activeTabDimensions.width,
                height: activeTabDimensions.height,
              }}
              transition={
                bubbleX !== null
                  ? { type: 'tween', duration: 0 }
                  : { type: 'spring', stiffness: 500, damping: 36 }
              }
              style={{ position: 'absolute', top: 0, left: 0 }}
              className="rounded-2xl sm:rounded-full pointer-events-none z-20 overflow-hidden"
            >
              <LiquidGlass
                shape="circle"
                scale={3}
                aberration={20}
                bevelDepth={37}
                frost={0}
                tint={0}
                borderTint="rgba(255, 255, 255, 0.95)"
                className="w-full h-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.06),inset_0_1.5px_2px_0_rgba(255,255,255,1),inset_0_-1px_1px_0_rgba(0,0,0,0.05),0_0_16px_rgba(255,255,255,0.7)]"
              >
                {/* Micro liquid specular light arc */}
                <div className="absolute inset-x-3 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full" />
              </LiquidGlass>
            </motion.div>

            {bottomNavItems.map((item, idx) => {
              const Icon = item.icon;
              const active = (hoveredIndex !== null ? hoveredIndex : currentActiveIndex) === idx;

              return (
                <button
                  key={item.href}
                  type="button"
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (!isDragging) {
                      router.push(item.href);
                    }
                  }}
                  title={item.label}
                  className={`relative z-10 flex flex-col items-center justify-center rounded-2xl sm:rounded-full transition-colors duration-150 outline-none select-none touch-none cursor-pointer px-4 sm:px-6 py-2 sm:py-2.5 min-w-[74px] sm:min-w-[84px] ${
                    active
                      ? 'text-[#111111] font-bold'
                      : 'text-[#48484a] hover:text-[#111111] hover:bg-white/10 font-medium'
                  }`}
                  style={{
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    userSelect: 'none',
                  }}
                >
                  <span className="flex flex-col items-center justify-center pointer-events-none gap-1">
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="text-[10.5px] sm:text-[11px] leading-none tracking-tight font-semibold whitespace-nowrap">
                      {item.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </LiquidGlass>
      </div>
    </div>
  );
}
