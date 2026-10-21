"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getCachedImage } from '@/lib/mediaCache';
import FallbackImage from '@/components/FallbackImage';

export default function SuggestionBar({ category, customTitle, onItemClick, highlightRed, shake }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        // Add cache-busting timestamp to prevent aggressive Next.js routing cache
        const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        if (!text || !text.trim()) return;
        const data = JSON.parse(text);
        if (data.success && data.products) {
          let filtered = data.products;
          if (category) {
            const normCat = category.toLowerCase().trim();
            filtered = filtered.filter(p => {
              const pCat = (p.category || '').toLowerCase().trim();
              return pCat === normCat;
            });
          }
          // Shuffle and pick up to 8 random items
          const shuffled = [...filtered].sort(() => 0.5 - Math.random());
          setProducts(shuffled.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [category]);

  useEffect(() => {
    if (products.length === 0 || userInteracted) return;

    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId;
    let lastTime = performance.now();
    const speed = 30; // pixels per second

    const scroll = (time) => {
      if (userInteracted) return;

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Increment scrollLeft
      el.scrollLeft += speed * delta;

      // Wrap back to start of the first set if we've scrolled past the midpoint
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft -= el.scrollWidth / 2;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [products, userInteracted]);

  const handleInteraction = () => {
    setUserInteracted(true);
  };

  if (loading) {
    return (
      <div className="w-full py-6 border-t border-zinc-100 my-4 flex flex-col gap-2 bg-white">
        <span className="text-[8px] tracking-[0.2em] uppercase font-bold text-zinc-400 px-4">
          LOAD REFINEMENTS...
        </span>
        <div className="flex px-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[100px] pr-4 shrink-0 flex flex-col gap-1.5 animate-pulse">
              <div className="w-full aspect-[4/5] bg-zinc-100 rounded-[2px]" />
              <div className="h-2 bg-zinc-100 rounded-sm w-3/4" />
              <div className="h-2 bg-zinc-100 rounded-sm w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  // Duplicate items for seamless continuous looping in auto-scroll mode
  const scrollProducts = [...products, ...products];

  return (
    <div className="w-full py-6 border-t border-zinc-100 my-4 bg-white overflow-hidden relative flex flex-col gap-3">
      {/* Header section with uppercase tech styling */}
      <div className="px-4 flex justify-between items-center">
        <span className={`text-[9px] tracking-[0.2em] uppercase font-bold transition-all duration-300 ${
          highlightRed ? 'text-red-500 font-extrabold' : 'text-zinc-400'
        } ${shake ? 'animate-shake' : ''}`}>
          {customTitle || 'Suggested Additions'}
        </span>
        <span className="text-[7px] tracking-wider uppercase font-bold text-zinc-300">
          {userInteracted ? '[ Swipe to Browse ]' : '[ Auto Scrolling ]'}
        </span>
      </div>

      {/* Horizontal manual scroll area */}
      <div 
        ref={scrollRef}
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
        className="w-full overflow-x-auto scrollbar-hide py-1 -webkit-overflow-scrolling-touch"
      >
        <div className="flex gap-3 px-4 w-max">
          {scrollProducts.map((product, idx) => (
            <div key={`${product._id}-${idx}`} className="w-[110px] shrink-0">
              <Link 
                href={`/product/${product.itemId}`}
                onClick={(e) => {
                  if (onItemClick) {
                    onItemClick(product, e);
                  }
                }}
                className="flex flex-col gap-1.5 group cursor-pointer active:scale-[0.98] transition-transform duration-200"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-[4/5] bg-zinc-50 overflow-hidden rounded-[2px] border border-zinc-100 shrink-0">
                  <FallbackImage
                    src={getCachedImage(product.itemId, product.mainImage)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    logoSize="w-5 h-5"
                  />
                </div>

                {/* Product Details */}
                <div className="flex flex-col min-w-0">
                  <h4 className="text-[8px] font-bold tracking-wide uppercase text-zinc-900 line-clamp-1">
                    {product.name}
                  </h4>
                  <span className="text-[8.5px] font-semibold text-black mt-0.5">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
