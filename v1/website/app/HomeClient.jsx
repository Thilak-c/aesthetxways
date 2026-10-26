'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ShoppingBag, Search, ClipboardList, ChevronLeft, ChevronRight, ChevronDown, X, Plus } from 'lucide-react';
import { gsap } from 'gsap';
import { getCachedVideo, getCachedImage } from '@/lib/mediaCache';
import FallbackImage from '@/components/FallbackImage';
import Footer from '@/components/Footer';

// Standalone component to animate individual item on a stagger delay
function FlyingItem({ image, coords, index, total, onComplete }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      // Stagger delay based on index (160ms gap between each item)
      const delay = index * 0.16;

      // Calculate side-by-side offset at start so they don't overlap on lift-off (spacing: 44px)
      const offset = total > 1 ? (index - (total - 1) / 2) * 44 : 0;
      const startLeft = coords.startLeft + offset;

      gsap.set(ref.current, {
        top: coords.startTop,
        left: startLeft,
        scale: 0.1,
        opacity: 0,
        x: 0,
        y: 0
      });

      // Converge back to the menu button coordinates
      const deltaX = coords.endLeft - startLeft;
      const deltaY = coords.endTop - coords.startTop;

      const tl = gsap.timeline({
        delay: delay,
        onComplete: onComplete
      });

      // Phase 1: Lift-off/reveal from behind the Add to Bag button
      tl.to(ref.current, {
        duration: 0.22,
        scale: 1,
        opacity: 1,
        y: -30,
        ease: 'back.out(1.5)',
        onStart: () => {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30);
          }
        }
      });

      // Phase 2: Runway speed vector accelerating directly to the menu button
      tl.to(ref.current, {
        duration: 0.48,
        x: deltaX,
        y: deltaY - 30, // account for phase 1 lift-off translate offset
        scale: 0.1,
        opacity: 0.2,
        ease: 'power3.in',
        onComplete: () => {
          // Only trigger landing vibration feedback once (on the first arriving item)
          if (index === 0 && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(40);
          }
          // Dispatch event to increment menu count locally
          window.dispatchEvent(new Event('cart-updated'));
        }
      });
    }
  }, [coords, index, total, onComplete]);

  return (
    <FallbackImage
      ref={ref}
      src={image}
      alt="Flying Product"
      className="absolute z-35 object-cover rounded-full border border-white/20 shadow-[0_0_16px_5px_rgba(255,255,255,0.8),0_6px_12px_rgba(0,0,0,0.12)] pointer-events-none"
      style={{
        width: '56px',
        height: '56px',
        position: 'absolute'
      }}
      hideText={true}
      logoSize="w-5 h-5"
    />
  );
}

export default function HomeClient({ initialProducts = [], initialBanners = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [allProducts, setAllProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [banners, setBanners] = useState(initialBanners);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const searchInputRef = useRef(null);
  const sliderRef = useRef(null);
  const isScrollingRef = useRef(false);
  const ignoreNextScrollEffectRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  // Exciting Catalog States
  const [layoutView, setLayoutView] = useState('grid'); // 'grid' | 'focus'
  const [isChangingLayout, setIsChangingLayout] = useState(false);

  const handleLayoutChange = (newLayout) => {
    if (newLayout === layoutView || isChangingLayout) return;
    setIsChangingLayout(true);
    setTimeout(() => {
      setLayoutView(newLayout);
      setTimeout(() => {
        setIsChangingLayout(false);
      }, 150);
    }, 150);
  };

  const [sortBy, setSortBy] = useState('default'); // 'default' | 'low-to-high' | 'high-to-low'
  const [activeQuickAddProductId, setActiveQuickAddProductId] = useState(null);
  const [flyingItems, setFlyingItems] = useState([]);
  const [coords, setCoords] = useState({ startTop: 0, startLeft: 0, endTop: 0, endLeft: 0 });
  const [showToast, setShowToast] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFlyComplete = useCallback((itemId, index) => {
    setFlyingItems(prev => {
      const remaining = prev.filter(item => item.id !== itemId);
      if (index === 0) { // Since quick add is always 1 item
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      return remaining;
    });
  }, []);

  const handleQuickAddToCart = (product, selectedSize) => {
    if (typeof window !== 'undefined' && product) {
      const cart = JSON.parse(localStorage.getItem('aw_cart') || '[]');
      const existingIndex = cart.findIndex(
        (item) => item.productId === product.itemId && item.size === selectedSize
      );

      if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          productId: product.itemId,
          name: product.name,
          image: product.mainImage,
          price: product.price,
          size: selectedSize,
          quantity: 1,
          sizeDisplayType: product.sizeDisplayType || 'alpha',
        });
      }

      localStorage.setItem('aw_cart', JSON.stringify(cart));

      // Calculate coordinates dynamically relative to the mobile mockup container
      const btnEl = document.getElementById(`quick-add-${product.itemId}-${selectedSize}`);
      const menuEl = document.querySelector('nav a[href="/cart"]');
      const frameEl = document.getElementById('mobile-frame');

      if (btnEl && menuEl) {
        const btnRect = btnEl.getBoundingClientRect();
        const menuRect = menuEl.getBoundingClientRect();
        const frameRect = frameEl ? frameEl.getBoundingClientRect() : { top: 0, left: 0 };

        const startTop = btnRect.top - frameRect.top + btnRect.height / 2 - 28;
        const startLeft = btnRect.left - frameRect.left + btnRect.width / 2 - 28;
        const endTop = menuRect.top - frameRect.top + menuRect.height / 2 - 28;
        const endLeft = menuRect.left - frameRect.left + menuRect.width / 2 - 28;

        setCoords({ startTop, startLeft, endTop, endLeft });
      } else {
        // Fallback positioning
        setCoords({
          startTop: window.innerHeight - 100,
          startLeft: window.innerWidth / 2,
          endTop: window.innerHeight - 30,
          endLeft: window.innerWidth - 60
        });
      }

      // Hide the selector panel
      setActiveQuickAddProductId(null);

      // Spawn flying items
      const newItems = [{
        id: `${Date.now()}-0-${Math.random()}`,
        image: product.mainImage,
        index: 0
      }];
      setFlyingItems(newItems);
    }
  };

  // Fetch banners on mount if not provided by server
  useEffect(() => {
    if (banners && banners.length > 0) return;
    async function fetchBanners() {
      try {
        const res = await fetch('/api/banners');
        const data = await res.json();
        if (data.success && data.banners?.length > 0) {
          setBanners(data.banners);
        }
      } catch (err) {
        console.error('Failed to fetch banners:', err);
      }
    }
    fetchBanners();
  }, [banners]);

  // Autoplay hero banners
  useEffect(() => {
    const count = banners.length > 0 ? banners.length : 3;
    if (count <= 1 || isHovered || !autoplayEnabled) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % count);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners, isHovered, autoplayEnabled]);

  // Handle scroll snap manual swipes
  const handleScroll = () => {
    if (isScrollingRef.current) return;
    setAutoplayEnabled(false); // Stop autoplay once user interacts
    if (sliderRef.current) {
      const container = sliderRef.current;
      const width = container.clientWidth;
      if (width > 0) {
        const newIndex = Math.round(container.scrollLeft / width);
        if (newIndex !== currentBannerIndex && newIndex >= 0 && newIndex < (banners.length || 3)) {
          ignoreNextScrollEffectRef.current = true; // Mark as manual update to bypass scrollTo hijack
          setCurrentBannerIndex(newIndex);
        }
      }
    }
  };

  // Programmatic scroll animation when currentBannerIndex changes
  useEffect(() => {
    if (ignoreNextScrollEffectRef.current) {
      ignoreNextScrollEffectRef.current = false; // Reset and bypass scrollTo hijack
      return;
    }
    if (sliderRef.current) {
      const container = sliderRef.current;
      const scrollTarget = currentBannerIndex * container.clientWidth;
      if (Math.abs(container.scrollLeft - scrollTarget) > 10) {
        isScrollingRef.current = true;
        container.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        });
        const timer = setTimeout(() => {
          isScrollingRef.current = false;
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [currentBannerIndex]);

  // Reset tab title to home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "Aesthetx Ways | Home Page";
    }
  }, []);

  const initialFetchSkippedRef = useRef(initialProducts.length > 0);

  // Fetch all products once on mount (and when search changes)
  useEffect(() => {
    if (initialFetchSkippedRef.current && searchQuery === '') {
      initialFetchSkippedRef.current = false;
      return;
    }
    async function fetchProducts() {
      try {
        setLoading(true);
        const url = `/api/products?category=All&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const text = await res.text();
        if (!text || !text.trim()) return;
        const data = JSON.parse(text);
        if (data.success && Array.isArray(data.products)) {
          setAllProducts(data.products);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchQuery]);

  // Derive categories from fetched products and sort them with custom order (Caps at top, Shoes at bottom)
  const categories = (() => {
    const catSet = new Set();
    let hasUncategorized = false;
    allProducts.forEach(p => {
      if (p.category) {
        catSet.add(p.category);
      } else {
        hasUncategorized = true;
      }
    });

    const categoryOrder = [
      'cap',
      'caps',
      'headwear',
      'eyewear',
      'accessories',
      'apparel',
      'apparel / clothing',
      't-shirt',
      't-shirts',
      'pants',
      'socks',
      'shoes',
      'slides',
      'footwear'
    ];

    const getCategoryPriority = (catName) => {
      const norm = catName.toLowerCase().trim();
      const index = categoryOrder.indexOf(norm);
      return index !== -1 ? index : 999;
    };

    const sortedCats = Array.from(catSet).sort((a, b) => {
      const priorityA = getCategoryPriority(a);
      const priorityB = getCategoryPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.localeCompare(b);
    });

    if (hasUncategorized) {
      sortedCats.push('Uncategorized');
    }
    return ['All', ...sortedCats];
  })();

  // Filter products client-side - Always show all products
  useEffect(() => {
    setProducts(allProducts);
  }, [allProducts]);

  // Highlight active category tab on scroll
  useEffect(() => {
    if (loading || allProducts.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      if (isProgrammaticScrollRef.current) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const catName = sectionId.replace('category-section-', '');
          const matched = categories.find(
            (c) => c.toLowerCase().replace(/[^a-z0-9]/g, '-') === catName
          );
          if (matched) {
            setActiveCategory(matched);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    categories.filter(cat => cat !== 'All').forEach((cat) => {
      const id = `category-section-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, allProducts, categories]);

  // Derive sorted products based on active filters and sorting
  const sortedProducts = products.length > 0
    ? [...products].sort((a, b) => {
        if (sortBy === 'low-to-high') {
          return a.price - b.price;
        }
        if (sortBy === 'high-to-low') {
          return b.price - a.price;
        }
        return 0; // default
      })
    : [];

  // Load cart count
  useEffect(() => {
    function updateCartCount() {
      if (typeof window !== 'undefined') {
        const cart = JSON.parse(localStorage.getItem('aw_cart') || '[]');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      }
    }
    updateCartCount();
    // Listen to localstorage updates
    window.addEventListener('storage', updateCartCount);
    // Listen to custom cart updates
    window.addEventListener('cart-updated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  // Handle programmatic focus on search toggle
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else if (!searchOpen && searchInputRef.current) {
      searchInputRef.current?.blur();
    }
  }, [searchOpen]);

  // Premium helper to render product card cleanly and without code duplication
  const renderProductCard = (product) => {
    const hasAlternativeImage = product.otherImages && product.otherImages.length > 0;
    const altImageUrl = hasAlternativeImage
      ? getCachedImage(`${product.itemId}-other-0`, product.otherImages[0])
      : null;

    return (
      <Link key={product._id} href={`/product/${product.itemId}`} className="group flex flex-col relative">
        <div className="relative w-full aspect-[4/5] bg-zinc-50 overflow-hidden rounded-[2px] ">
          <FallbackImage
            src={getCachedImage(product.itemId, product.mainImage)}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.02] ${
              hasAlternativeImage ? 'group-hover:opacity-0' : ''
            }`}
          />
          {hasAlternativeImage && (
            <FallbackImage
              src={altImageUrl}
              alt={`${product.name} Alternate View`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700 ease-out pointer-events-none"
            />
          )}
          {product.inStock ? (
            <div className="absolute top-2 left-2 z-10 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-300">

            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-black text-white text-[7px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded-[1px] z-10">
              Out of Stock
            </div>
          )}

          {/* Quick Add '+' Button */}
          {product.inStock && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveQuickAddProductId(activeQuickAddProductId === product._id ? null : product._id);
              }}
              className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black text-white hover:bg-zinc-800 flex items-center justify-center shadow-lg transition-transform duration-300 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Quick add size"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Glassy Size Selector Panel */}
          {activeQuickAddProductId === product._id && product.availableSizes && (
            <div
              className="absolute inset-0 z-30 bg-zinc-950/85 backdrop-blur-md py-4 px-2.5 flex flex-col items-center justify-center animate-slide-up-fade"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <span className="text-[7.5px] uppercase tracking-[0.2em] text-zinc-300 font-bold mb-3">Quick Add Size</span>
              <div className="flex flex-wrap gap-2 justify-center w-full max-w-[90%]">
                {product.availableSizes.map((size) => {
                  const stock = product.sizeStock?.[size] || 0;
                  const hasStock = stock > 0;
                  return (
                    <button
                      key={size}
                      id={`quick-add-${product.itemId}-${size}`}
                      disabled={!hasStock}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickAddToCart(product, size);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                        !hasStock
                          ? 'border-zinc-800 text-zinc-600 line-through cursor-not-allowed'
                          : 'border-zinc-700 bg-white text-black hover:bg-zinc-100 cursor-pointer active:scale-90'
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveQuickAddProductId(null);
                }}
                className="text-[7.5px] text-zinc-400 hover:text-white uppercase tracking-widest font-bold mt-4 border-b border-zinc-700 pb-0.5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-2 flex flex-col flex-1">
          <h3 className="text-[10px] font-bold tracking-wide uppercase text-black line-clamp-1">
            {product.name}
          </h3>
          <span className="text-[8px] text-zinc-400 uppercase tracking-wider font-medium mt-0.5">
            {product.category}
          </span>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-semibold text-black">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {(product.listedPrice || product.originalPrice) && (product.listedPrice || product.originalPrice) > product.price && (
              <>
                <span className="text-[8.5px] text-zinc-400 line-through">
                  ₹{(product.listedPrice || product.originalPrice).toLocaleString('en-IN')}
                </span>
                <span className="text-[8.5px] font-bold text-[#008a00]">
                  {Math.round((((product.listedPrice || product.originalPrice) - product.price) / (product.listedPrice || product.originalPrice)) * 100)}% off
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col flex-1 bg-white">

      {/* Conditionally Render Search Bar with Smooth Slide/Fade Animation */}
      <div
        className={`px-4 flex flex-col justify-center bg-zinc-50 transition-all duration-300 ease-in-out origin-top overflow-hidden ${searchOpen
            ? 'h-[68px] opacity-100 py-2.5 border-b border-zinc-100 scale-y-100'
            : 'h-0 opacity-0 py-0 border-b-0 border-transparent scale-y-0 pointer-events-none'
          }`}
      >
        <div className="flex items-center gap-2 w-full">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full text-xs bg-transparent border-none outline-none py-0.5 text-black placeholder-zinc-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-black">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Popular / Trending Search Suggestions */}
        <div className="flex items-center gap-2 mt-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[7.5px] uppercase tracking-wider text-zinc-400 font-bold whitespace-nowrap">Trending:</span>
          {['Hoodie', 'Cargo', 'Oversized', 'Cap', 'Slides'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className={`text-[8.5px] px-2 py-0.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? 'bg-black text-white border-black font-semibold'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Category Scroll */}
      <nav className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-5 border-b border-zinc-100 bg-white">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              isProgrammaticScrollRef.current = true;
              if (cat === 'All') {
                document.getElementById('shop-content')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                const targetId = `category-section-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
              }
              setTimeout(() => {
                isProgrammaticScrollRef.current = false;
              }, 800);
            }}
            className={`text-[9px] tracking-wider uppercase font-semibold whitespace-nowrap pb-1 transition-all relative ${activeCategory === cat ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            {cat === 'Apparel / Clothing' ? 'Apparel' : cat}
            {activeCategory === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Hero Carousel - Shows single image at a time */}
      {(() => {
        const leftBanner = banners.find((b) => b.position === 'left') || {
          imageUrl: '/home/b1.webp',
          productLink: '#'
        };
        const rightTopBanner = banners.find((b) => b.position === 'right_top') || {
          imageUrl: '/home/b2.webp',
          productLink: '#'
        };
        const rightBottomBanner = banners.find((b) => b.position === 'right_bottom') || {
          imageUrl: '/home/b3.webp',
          productLink: '#'
        };

        const heroBanners = [leftBanner, rightTopBanner, rightBottomBanner];

        return (
          <div className="px-4 py-3">
            <div 
              className="w-full aspect-[4/5] relative overflow-hidden rounded-[2px] bg-zinc-50 group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setAutoplayEnabled(false)}
            >
              {/* Slides Wrapper for Scroll Snap */}
              <div
                ref={sliderRef}
                onScroll={handleScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth rounded-[2px]"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {heroBanners.map((banner, index) => {
                  return (
                    <Link
                      key={index}
                      href={banner.productLink}
                      className="w-full h-full flex-shrink-0 snap-start snap-always relative block"
                    >
                      <img
                        src={banner.imageUrl}
                        alt={`Hero Banner ${index + 1}`}
                        className="w-full h-full object-cover filter brightness-[0.98] group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                      />
                    </Link>
                  );
                })}
              </div>

              {/* Navigation Arrows */}
              {heroBanners.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setAutoplayEnabled(false);
                      setCurrentBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setAutoplayEnabled(false);
                      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 border border-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </>
              )}

              {/* Indicator Dots */}
              {heroBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {heroBanners.map((_, index) => {
                    const isActive = index === currentBannerIndex;
                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          setAutoplayEnabled(false);
                          setCurrentBannerIndex(index);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer border ${
                          isActive
                            ? 'w-5 bg-white border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                            : 'w-2 bg-white/20 backdrop-blur-md border-white/10 hover:bg-white/40'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Main Content Area */}
      <main id="shop-content" className="flex-1 px-4 pb-28">
        <div className="flex items-center justify-between py-2 mb-2">
          <span className="text-[9px] tracking-widest uppercase font-bold text-zinc-400">
            {activeCategory === 'All' ? 'ALL PRODUCTS' : `CATALOGUE / ${activeCategory.toUpperCase()}`}
          </span>
          <span className="text-[9px] text-zinc-400 font-medium">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className={`grid gap-x-3 transition-all duration-300 ${
            layoutView === 'grid' ? 'grid-cols-2 gap-y-6' : 'grid-cols-1 gap-y-10'
          }`}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col">
                <div className="relative w-full aspect-[4/5] bg-zinc-100 animate-pulse animate-shimmer rounded-[2px] border border-zinc-100/50" />
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="h-3 bg-zinc-100 animate-pulse animate-shimmer rounded-[1px] w-2/3" />
                  <div className="h-2 bg-zinc-50 animate-pulse animate-shimmer rounded-[1px] w-1/3" />
                  <div className="h-2.5 bg-zinc-100 animate-pulse animate-shimmer rounded-[1px] w-1/4 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-16 text-center">
            <div className="w-20 h-20 mb-5 overflow-hidden rounded-full border border-zinc-100 bg-zinc-50 flex items-center justify-center select-none">
              <video
                src="/n0-data.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover filter grayscale opacity-90"
              />
            </div>
            <span className="text-[10px] tracking-widest uppercase text-zinc-400">No products found</span>
          </div>
        ) : (
          /* Products Grid with Layout Toggling and Premium Swapping Hover Preview */
          // Group products by category and render each category in its own section
          categories.filter(cat => cat !== 'All').map((categoryName) => {
            // Filter products client-side by categoryName
            const categoryProducts = sortedProducts.filter(p => {
              const pCat = (p.category || '').toLowerCase().trim();
              const norm = categoryName.toLowerCase().trim();
              if (norm === 'uncategorized' && !pCat) {
                return true;
              }
              if (norm === 'apparel' || norm === 'apparel / clothing') {
                return pCat === 'apparel' || pCat === 'apparel / clothing';
              }
              return pCat === norm;
            });

            if (categoryProducts.length === 0) return null;

            return (
              <div 
                key={categoryName} 
                id={`category-section-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} 
                className="mb-14 last:mb-0 scroll-mt-16"
              >
                {/* Premium Divider & Section Header */}
                <div className="flex items-center justify-between py-2 mb-5 border-b border-zinc-100">
                  <h2 className="text-[11px] tracking-widest uppercase font-bold text-black font-lovelo-black">
                    {categoryName === 'Apparel / Clothing' ? 'APPAREL' : categoryName.toUpperCase()}
                  </h2>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">
                    {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className={`grid gap-x-3 transition-all duration-300 ease-in-out ${
                  layoutView === 'grid' ? 'grid-cols-2 gap-y-6' : 'grid-cols-1 gap-y-10'
                } ${isChangingLayout ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'} animate-slide-up-fade`}>
                  {categoryProducts.map(renderProductCard)}
                </div>
              </div>
            );
          })
        )}

        {/* End of Products Indicator */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col justify-center items-center py-12 text-center">
            <div className="w-16 h-16 mb-4 overflow-hidden rounded-full border border-zinc-100 bg-zinc-50 flex items-center justify-center select-none">
              <video
                src="/n0-data.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover filter grayscale opacity-80"
              />
            </div>
            <span className="text-[8px] tracking-[0.2em] uppercase text-zinc-400 font-medium">No more products to show</span>
          </div>
        )}
        <Footer />
      </main>

   
      {/* Premium Minimalist Sticky Toast Notification for Quick Add */}
      <div className="sticky top-12 left-0 right-0 z-50 h-0 w-full pointer-events-none px-4">
        <div
          className={`absolute left-4 right-4 bg-zinc-950 text-white px-4 py-3 flex items-center justify-between shadow-xl rounded-[2px] transition-all duration-500 ease-out pointer-events-auto ${showToast ? 'opacity-100 translate-y-2' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-[0.2em] uppercase font-bold">Added to Bag</span>
          </div>
          <Link href="/cart" className="text-[9px] tracking-[0.2em] uppercase font-bold text-white border-b border-white pb-0.5 hover:opacity-85 transition-opacity">
            View Bag &rarr;
          </Link>
        </div>
      </div>

      {/* Invisible blocker to prevent routing/clicks while flying */}
      {flyingItems.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className="absolute inset-0 z-99 cursor-default pointer-events-auto bg-transparent" />,
        document.getElementById('mobile-frame') || document.body
      )}

      {/* Flying Product Images */}
      {flyingItems.map((item) => typeof document !== 'undefined' && createPortal(
        <FlyingItem
          key={item.id}
          image={item.image}
          coords={coords}
          index={item.index}
          total={flyingItems.length}
          onComplete={() => handleFlyComplete(item.id, item.index)}
        />,
        document.getElementById('mobile-frame') || document.body
      ))}


    </div>
  );
}
