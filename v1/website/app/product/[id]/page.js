'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ChevronDown, RotateCcw, Truck, X } from 'lucide-react';
import { addToCart, getCartItems } from '@/components/cart/cartStore';
import FallbackImage from '@/components/FallbackImage';
import Footer from '@/components/Footer';

const SIZE_MAP = {
  S: '28',
  M: '30',
  L: '32',
  XL: '34',
  XXL: '36',
  XXXL: '38',
};

const getDisplaySize = (size, sizeDisplayType) => {
  if (sizeDisplayType === 'numeric' && SIZE_MAP[size]) {
    return SIZE_MAP[size];
  }
  return size;
};

const SIZE_CHART = [
  { size: 'S / 28', inLength: '28', cmLength: '71', us: '28', eu: '44' },
  { size: 'M / 30', inLength: '30', cmLength: '76', us: '30', eu: '46' },
  { size: 'L / 32', inLength: '32', cmLength: '81', us: '32', eu: '48' },
  { size: 'XL / 34', inLength: '34', cmLength: '86', us: '34', eu: '50' },
  { size: 'XXL / 36', inLength: '36', cmLength: '91', us: '36', eu: '52' },
];

export default function ProductPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [product, setProduct] = useState(null);
  const [allCatalog, setAllCatalog] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isFavourite, setIsFavourite] = useState(false);
  const [wishlistMap, setWishlistMap] = useState({});

  // Delivery & Pincode State
  const [deliveryPincode, setDeliveryPincode] = useState('800013');
  const [deliveryCity, setDeliveryCity] = useState('PATNA');
  const [isPincodeMounted, setIsPincodeMounted] = useState(false);
  const [isPincodeVisible, setIsPincodeVisible] = useState(false);
  const [inputPincode, setInputPincode] = useState('');
  const pincodeTimerRef = useRef(null);

  // Accordion State
  const [isVendorDetailsOpen, setIsVendorDetailsOpen] = useState(false);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState(false);

  // Modals State with Pop-out Animation
  const [isProductDetailsMounted, setIsProductDetailsMounted] = useState(false);
  const [isProductDetailsVisible, setIsProductDetailsVisible] = useState(false);
  const productDetailsTimerRef = useRef(null);

  const [isKnowMoreMounted, setIsKnowMoreMounted] = useState(false);
  const [isKnowMoreVisible, setIsKnowMoreVisible] = useState(false);
  const [knowMoreType, setKnowMoreType] = useState('return'); // 'return' | 'delivery'
  const knowMoreTimerRef = useRef(null);

  // Added to Bag / Select Size Drawer state (matching Sonu exact design)
  const [isBagModalMounted, setIsBagModalMounted] = useState(false);
  const [isBagModalVisible, setIsBagModalVisible] = useState(false);
  const [isBagBackdropVisible, setIsBagBackdropVisible] = useState(false);
  const [bagModalMode, setBagModalMode] = useState('added-to-bag'); // 'added-to-bag' | 'select-size'
  const bagTimerRef = useRef(null);

  // Size Guide Modal state
  const [isModalMounted, setIsModalMounted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'

  // Load saved shipping address and wishlist from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('aw_shipping_address') || localStorage.getItem('sonu_shipping_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.pincode) setDeliveryPincode(parsed.pincode);
          if (parsed.city) setDeliveryCity(parsed.city.toUpperCase());
        }
        const savedWishlist = localStorage.getItem('aw_wishlist');
        if (savedWishlist) setWishlistMap(JSON.parse(savedWishlist));
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch product data and full catalog
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products`);
        if (!res.ok) return;
        const text = await res.text();
        if (!text || !text.trim()) return;
        const data = JSON.parse(text);
        if (data.success && Array.isArray(data.products)) {
          setAllCatalog(data.products);
          const found = data.products.find((p) => p.itemId === id);
          if (found) {
            setProduct(found);

            // Auto-select size if product has only one size or OS (and is in stock)
            if (found.availableSizes && found.availableSizes.length === 1) {
              const onlySize = found.availableSizes[0];
              const inStock = found.sizeStock && typeof found.sizeStock === 'object' && onlySize in found.sizeStock
                ? Number(found.sizeStock[onlySize] || 0) > 0
                : (found.inStock !== false);
              if (inStock) setSelectedSize(onlySize);
            } else if (found.category?.toLowerCase() === 'socks' && found.availableSizes?.includes('OS')) {
              setSelectedSize('OS');
            } else if (!found.availableSizes || found.availableSizes.length === 0) {
              setSelectedSize('OS');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // Maintain Recently Viewed in localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('aw_recently_viewed') || '[]');
        if (Array.isArray(stored)) {
          setRecentlyViewed(stored.filter((it) => it.itemId !== id));
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    try {
      const stored = JSON.parse(localStorage.getItem('aw_recently_viewed') || '[]');
      const filtered = Array.isArray(stored) ? stored.filter((it) => it.itemId !== product.itemId) : [];
      filtered.unshift({
        itemId: product.itemId,
        name: product.name,
        category: product.category || 'Apparel',
        price: product.price,
        originalPrice: product.originalPrice || Math.round(product.price * 1.25),
        mainImage: product.mainImage,
        color: product.color,
      });
      localStorage.setItem('aw_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
    } catch {
      // ignore
    }
  }, [product]);

  // Wishlist helper
  const toggleCardWishlist = (itemId) => {
    setWishlistMap((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem('aw_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const deliveryDateFormatted = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  })();

  // Sync cart count
  useEffect(() => {
    const syncCount = () => {
      const items = getCartItems();
      const count = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      setCartCount(count);
    };
    syncCount();
    window.addEventListener('cart-updated', syncCount);
    window.addEventListener('storage', syncCount);
    return () => {
      window.removeEventListener('cart-updated', syncCount);
      window.removeEventListener('storage', syncCount);
    };
  }, []);

  const hasMultipleSizes = Boolean(product?.availableSizes && product.availableSizes.length > 1);

  const checkSizeHasStock = (sz) => {
    if (!product) return false;
    if (product.inStock === false) return false;
    if (product.sizeStock && typeof product.sizeStock === 'object') {
      if (sz in product.sizeStock) {
        return Number(product.sizeStock[sz] || 0) > 0;
      }
    }
    return true;
  };

  // Drawer handlers
  const openBagModal = (mode = 'added-to-bag') => {
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    setBagModalMode(mode);
    setIsBagModalMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsBagBackdropVisible(true);
        setIsBagModalVisible(true);
      });
    });
  };

  const closeBagModal = () => {
    setIsBagBackdropVisible(false);
    setIsBagModalVisible(false);
    bagTimerRef.current = setTimeout(() => {
      setIsBagModalMounted(false);
    }, 320);
  };

  const openSizeGuide = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsModalMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalVisible(true);
      });
    });
  };

  const closeSizeGuide = () => {
    setIsModalVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setIsModalMounted(false);
    }, 320);
  };

  // Animated pop-out handlers for Know More
  const openKnowMore = (type) => {
    if (knowMoreTimerRef.current) clearTimeout(knowMoreTimerRef.current);
    setKnowMoreType(type);
    setIsKnowMoreMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsKnowMoreVisible(true);
      });
    });
  };

  const closeKnowMore = () => {
    setIsKnowMoreVisible(false);
    knowMoreTimerRef.current = setTimeout(() => {
      setIsKnowMoreMounted(false);
    }, 320);
  };

  // Animated pop-out handlers for Product Details
  const openProductDetails = () => {
    if (productDetailsTimerRef.current) clearTimeout(productDetailsTimerRef.current);
    setIsProductDetailsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsProductDetailsVisible(true);
      });
    });
  };

  const closeProductDetails = () => {
    setIsProductDetailsVisible(false);
    productDetailsTimerRef.current = setTimeout(() => {
      setIsProductDetailsMounted(false);
    }, 320);
  };

  // Animated pop-out handlers for Pincode
  const openPincodeModal = () => {
    if (pincodeTimerRef.current) clearTimeout(pincodeTimerRef.current);
    setInputPincode(deliveryPincode);
    setIsPincodeMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPincodeVisible(true);
      });
    });
  };

  const closePincodeModal = () => {
    setIsPincodeVisible(false);
    pincodeTimerRef.current = setTimeout(() => {
      setIsPincodeMounted(false);
    }, 320);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalMounted) closeSizeGuide();
        if (isBagModalMounted) closeBagModal();
        if (isKnowMoreMounted) closeKnowMore();
        if (isProductDetailsMounted) closeProductDetails();
        if (isPincodeMounted) closePincodeModal();
      }
    };
    const anyModalOpen =
      isModalMounted ||
      isBagModalMounted ||
      isKnowMoreMounted ||
      isProductDetailsMounted ||
      isPincodeMounted;

    if (anyModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
      if (knowMoreTimerRef.current) clearTimeout(knowMoreTimerRef.current);
      if (productDetailsTimerRef.current) clearTimeout(productDetailsTimerRef.current);
      if (pincodeTimerRef.current) clearTimeout(pincodeTimerRef.current);
    };
  }, [
    isModalMounted,
    isBagModalMounted,
    isKnowMoreMounted,
    isProductDetailsMounted,
    isPincodeMounted,
  ]);

  // Add to Bag handler
  const handleAddToBag = () => {
    if (!product) return;

    if (product.inStock === false) {
      alert('This product is currently out of stock.');
      return;
    }

    const effectiveSize = selectedSize || (!hasMultipleSizes ? (product.availableSizes?.[0] || 'OS') : null);

    if (!effectiveSize && hasMultipleSizes) {
      openBagModal('select-size');
      return;
    }

    if (effectiveSize && !checkSizeHasStock(effectiveSize)) {
      openBagModal('select-size');
      return;
    }

    addToCart({
      id: product.itemId,
      productId: product.itemId,
      name: product.name,
      category: product.category,
      price: product.price,
      priceNumber: product.price,
      size: effectiveSize || 'OS',
      quantity: quantity,
      image: product.mainImage,
      sizeDisplayType: product.sizeDisplayType || 'alpha',
    });

    openBagModal('added-to-bag');
  };

  const handleSelectSizeInDrawer = (sz) => {
    if (!checkSizeHasStock(sz)) return;

    setSelectedSize(sz);
    addToCart({
      id: product.itemId,
      productId: product.itemId,
      name: product.name,
      category: product.category,
      price: product.price,
      priceNumber: product.price,
      size: sz,
      quantity: quantity,
      image: product.mainImage,
      sizeDisplayType: product.sizeDisplayType || 'alpha',
    });

    setIsBagModalVisible(false);
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    bagTimerRef.current = setTimeout(() => {
      setBagModalMode('added-to-bag');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsBagModalVisible(true);
        });
      });
    }, 320);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-white min-h-[70vh] justify-center items-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-1 flex-col bg-white justify-center items-center py-32 text-center px-4 font-['Helvetica_Now_Text',sans-serif]">
        <h1 className="text-[20px] font-medium text-[#111111] mb-3">Product not found</h1>
        <Link href="/" className="px-6 py-2.5 bg-[#111111] text-white rounded-full text-[14px]">
          Back to Shop
        </Link>
      </div>
    );
  }

  const productImages = [
    product.mainImage,
    ...(product.otherImages || []),
  ].filter(Boolean);

  const activeImage = productImages[currentImageIndex] || product.mainImage;

  return (
    <div className="w-full bg-white select-none font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24">
      {/* Main Container */}
      <div className="w-full max-w-[540px] md:max-w-[800px] mx-auto px-4 sm:px-6 pt-10 sm:pt-6">
        {/* Top Header Block matching Sonu exact design */}
        <div className="flex flex-col text-left mb-4">
          <span className="text-[#c83200] text-[14px] sm:text-[15px] font-medium leading-none mb-1.5">
            Just In
          </span>

          <h1
            className="text-[22px] sm:text-[26px] font-medium text-[#111111] tracking-tight leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {product.name}
          </h1>

          <p className="text-[15px] sm:text-[16px] text-[#707072] mt-0.5 leading-tight">
            {product.category || 'Apparel'}
          </p>

          <p
            className="text-[18px] sm:text-[20px] font-bold text-[#111111] mt-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            ₹{product.price.toLocaleString('en-IN')}
          </p>

          <p className="text-[13px] text-[#707072] mt-0.5">
            Inclusive of all taxes
          </p>
        </div>

        {/* Product Hero Image Area */}
        <div className="w-full bg-[] rounded-xl flex items-center justify-center p-0 sm:p-0 min-h-[340px] sm:min-h-[440px] relative overflow-hidden group">
          <FallbackImage
            src={activeImage}
            alt={product.name}
            className="w-full h-auto max-h-[380px] object-contain transition-transform duration-500 group-hover:scale-105"
            logoSize="w-8 h-8"
          />

          {/* Arrows */}
          {productImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-opacity opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % productImages.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-opacity opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Carousel Pagination Dots */}
        {productImages.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-3.5">
            {productImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImageIndex(idx)}
                className={`transition-all rounded-full ${
                  currentImageIndex === idx ? 'w-5 h-2 bg-[#111111]' : 'w-2 h-2 bg-[#d2d2d2] hover:bg-[#8d8d8d]'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails Row */}
        {productImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2.5 my-3">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentImageIndex(idx)}
                className={`aspect-square bg-[#f5f5f5] rounded-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all ${
                  currentImageIndex === idx
                    ? 'border-2 border-[#111111] shadow-xs'
                    : 'border border-transparent hover:border-neutral-300'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply" />
              </button>
            ))}
          </div>
        )}

        {/* Size Selection Section (Only shown if product has multiple sizes) */}
        {hasMultipleSizes && (
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] font-medium text-[#111111]">
                Select Size
              </span>

              {/* Size Guide Button with Sonu Exact SVG */}
              <button
                type="button"
                onClick={openSizeGuide}
                className="flex items-center gap-1.5 text-[14px] font-medium text-[#111111] hover:text-[#707072] transition-colors cursor-pointer"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 24 24"
                  role="img"
                  width="20px"
                  height="20px"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    stroke="#111111"
                    strokeWidth="1.5"
                    d="M21.75 10.5v6.75a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V10.5m3.308-2.25h12.885"
                  />
                  <path
                    stroke="#111111"
                    strokeWidth="1.5"
                    d="M15.79 5.599l2.652 2.65-2.652 2.653M8.21 5.599l-2.652 2.65 2.652 2.653M17.25 19v-2.5M12 19v-2.5M6.75 19v-2.5"
                  />
                </svg>
                <span>Size Guide</span>
              </button>
            </div>

            {/* Size Buttons Grid */}
            <div className="grid grid-cols-4 gap-2.5">
              {product.availableSizes?.map((size) => {
                const hasStock = checkSizeHasStock(size);
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!hasStock}
                    onClick={() => {
                      if (!hasStock) return;
                      setSelectedSize(size);
                    }}
                    className={`py-3.5 rounded-[8px] text-[15px] font-medium transition-all ${
                      !hasStock
                        ? 'border border-neutral-200 text-neutral-300 line-through cursor-not-allowed bg-neutral-50 select-none'
                        : isSelected
                        ? 'border-2 border-[#111111] bg-white text-[#111111] shadow-xs cursor-pointer'
                        : 'border border-neutral-300 bg-white text-[#111111] hover:border-[#111111] cursor-pointer'
                    }`}
                  >
                    {getDisplaySize(size, product.sizeDisplayType)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA Buttons Block matching Sonu */}
        <div className="mt-8 flex flex-col gap-3">
          {/* Add to Bag */}
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={!product.inStock}
            className={`w-full py-4 rounded-full text-white text-[16px] font-medium transition-all shadow-md active:scale-[0.99] cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif] ${
              !product.inStock ? 'bg-neutral-300 cursor-not-allowed' : 'bg-[#111111] hover:bg-black'
            }`}
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {!product.inStock ? 'Out of Stock' : 'Add to Bag'}
          </button>

          {/* Favourite Button with Heart Outline */}
          <button
            type="button"
            onClick={() => setIsFavourite(!isFavourite)}
            className="w-full py-4 rounded-full border border-neutral-300 hover:border-[#111111] bg-white text-[#111111] text-[16px] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Favourite</span>
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavourite ? 'fill-rose-500 text-rose-500' : 'text-[#111111]'
              }`}
            />
          </button>
        </div>

        {/* 1. Description & Style Block (strictly matching Image 1) */}
        <div className="mt-8">
          <p className="text-[15px] sm:text-[15.5px] leading-[1.6] text-[#111111] font-normal">
            {product.description ||
              'Designed for athletes who run and lift, the Hybrid RN takes you from sprints to squats without missing a beat. A forefoot Air Zoom unit pairs with ReactX foam to give you the responsive cushioning your runs need. The wide outsole features both sticky and high-abrasion rubber for stability and grip during dynamic movements.'}
          </p>

          {/* Bullet Points */}
          <div className="mt-5 space-y-1 text-[14.5px] sm:text-[15px] text-[#111111] leading-relaxed">
            <p>
              • Colour Shown: {product.color || 'White|Laser Crimson|Football Grey|Metallic Silver'}
            </p>
            <p>• Style: {product.itemId || 'IO3815-102'}</p>
          </div>

          {/* View Product Details Link */}
          <button
            type="button"
            onClick={openProductDetails}
            className="mt-5 text-[15px] font-medium text-[#111111] underline underline-offset-4 decoration-1 hover:text-[#707072] active:scale-[0.98] transition-transform cursor-pointer inline-block"
          >
            View Product Details
          </button>
        </div>

        {/* 2. Delivery & Address Box (strictly matching Image 1) */}
        <div className="mt-8 pt-6">
          <h3
            className="text-[16px] sm:text-[17px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Delivery by {deliveryDateFormatted}
          </h3>
          <div className="flex items-center justify-between mt-1 text-[14px]">
            <span className="text-[#707072]">
              To {deliveryPincode}, {deliveryCity}
            </span>
            <button
              type="button"
              onClick={openPincodeModal}
              className="font-medium text-[#111111] underline hover:text-[#707072] active:scale-[0.98] transition-transform cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* Delivery Perks with Interactive Popping/Clicking */}
          <div className="mt-5 space-y-3">
            {/* Perk 1: 14-day return and size exchange */}
            <div
              onClick={() => openKnowMore('return')}
              className="flex items-center justify-between group cursor-pointer py-1.5 -my-1 px-2.5 -mx-2.5 rounded-[12px] hover:bg-[#f6f6f6] active:scale-[0.985] transition-all select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f2f2f2] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                  <RotateCcw className="w-4 h-4 text-[#111111] stroke-[2]" />
                </div>
                <span className="text-[14px] text-[#111111] font-normal group-hover:text-black">
                  14-day return and size exchange
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openKnowMore('return');
                }}
                className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
              >
                Know More
              </button>
            </div>

            {/* Perk 2: Free delivery available */}
            <div
              onClick={() => openKnowMore('delivery')}
              className="flex items-center justify-between group cursor-pointer py-1.5 -my-1 px-2.5 -mx-2.5 rounded-[12px] hover:bg-[#f6f6f6] active:scale-[0.985] transition-all select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f2f2f2] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                  <Truck className="w-4 h-4 text-[#111111] stroke-[2]" />
                </div>
                <span className="text-[14px] text-[#111111] font-normal group-hover:text-black">
                  Free delivery available
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openKnowMore('delivery');
                }}
                className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
              >
                Know More
              </button>
            </div>
          </div>
        </div>

        {/* 3. Accordions (strictly matching Image 1) */}
        {/* Accordion 1: Vendor Details */}
        <div className="border-t border-[#e5e5e5] mt-7">
          <button
            type="button"
            onClick={() => setIsVendorDetailsOpen(!isVendorDetailsOpen)}
            className="w-full py-5 flex items-center justify-between text-left cursor-pointer select-none group"
            aria-expanded={isVendorDetailsOpen}
          >
            <span
              className="text-[19px] sm:text-[18px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Vendor Details
            </span>
            <ChevronDown
              className={`w-5 h-5 text-[#111111] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isVendorDetailsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isVendorDetailsOpen
                ? 'grid-rows-[1fr] opacity-100 pb-5'
                : 'grid-rows-[0fr] opacity-0 pb-0'
            }`}
          >
            <div className="overflow-hidden space-y-3 text-[14px]">
              <div>
                <p className="text-[13px] text-[rgba(0,19,37,0.64)] leading-tight">Sold By</p>
                <p className="text-[15px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5">Aesthetx Way</p>
              </div>
              <div>
                <p className="text-[13px] text-[rgba(0,19,37,0.64)] leading-tight">Country Of Origin</p>
                <p className="text-[15px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5">India</p>
              </div>
              <div>
                <p className="text-[13px] text-[rgba(0,19,37,0.64)] leading-tight">Name Of Manufacturer/ Packer/ Importer</p>
                <p className="text-[15px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5">Aesthetx Way</p>
              </div>
              <div>
                <p className="text-[13px] text-[rgba(0,19,37,0.64)] leading-tight">Address Of Manufacturer/ Packer/ Importer</p>
                <p className="text-[15px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5 leading-[22px]">
                  Aesthetx Way Gaya Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion 2: Return And Exchange Policy */}
        <div className="border-t border-[#e5e5e5]">
          <button
            type="button"
            onClick={() => setIsReturnPolicyOpen(!isReturnPolicyOpen)}
            className="w-full py-5 flex items-center justify-between text-left cursor-pointer select-none group"
            aria-expanded={isReturnPolicyOpen}
          >
            <span
              className="text-[19px] sm:text-[18px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Return And Exchange Policy
            </span>
            <ChevronDown
              className={`w-5 h-5 text-[#111111] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isReturnPolicyOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <div
            className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isReturnPolicyOpen
                ? 'grid-rows-[1fr] opacity-100 pb-5'
                : 'grid-rows-[0fr] opacity-0 pb-0'
            }`}
          >
            <div className="overflow-hidden text-[14.5px] leading-[22px] text-[rgba(0,19,37,0.92)]">
              <p>
                This product is eligible for returns or replacement. Please initiate returns/replacements from the &apos;My Orders&apos; section in the App within 14 days of delivery. Kindly ensure the product is in its original condition with all tags attached.
              </p>
            </div>
          </div>
        </div>

        {/* Thin divider before carousels */}
        <div className="border-t border-[#e5e5e5] mb-2" />

        {/* 4. Section 1: More From {Category} (strictly matching Image 2) */}
        <div className="mt-7">
          <h3
            className="text-[20px] sm:text-[22px] font-bold text-[#111111] tracking-tight mb-4 font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {product.category?.toLowerCase() === 'apparel' || !product.category
              ? 'More From Women Training And Gym'
              : `More From ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}`}
          </h3>

          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6">
            {(allCatalog.filter((p) => p.itemId !== product.itemId).length >= 2
              ? allCatalog.filter((p) => p.itemId !== product.itemId)
              : allCatalog
            ).map((item, idx) => {
              const isFav = wishlistMap[item.itemId];
              const hasDiscount = idx % 2 === 1;
              const originalPrice = item.originalPrice || Math.round(item.price * 1.25);

              return (
                <div
                  key={`more-${item.itemId}-${idx}`}
                  onClick={() => router.push(`/product/${item.itemId}`)}
                  className="w-[220px] sm:w-[240px] shrink-0 snap-start select-none cursor-pointer group"
                >
                  {/* Image Container with floating heart button */}
                  <div className="aspect-[4/5] b rounded-[4px] relative p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.mainImage || item.image || '/home/b1.webp'}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleCardWishlist(item.itemId);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-[#111111] hover:bg-neutral-50 transition-colors"
                      aria-label="Save to Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-[#111111]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="pt-2.5">
                    <h4
                      className="text-[15px] sm:text-[16px] font-medium text-[#111111] leading-tight line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {item.name}
                    </h4>
                    <p className="text-[13px] sm:text-[13.5px] text-[#707072] mt-0.5 line-clamp-1">
                      {idx % 2 === 0 ? "Women's Workout Shoes" : "Women's Training Shoes"}
                    </p>
                    {hasDiscount ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[15px] sm:text-[16px]">
                        <span className="font-bold text-[#111111]">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[13px] text-[#707072] line-through">
                          ₹{originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[13px] font-bold text-[#008a00]">
                          20% off
                        </span>
                      </div>
                    ) : (
                      <p className="text-[15px] sm:text-[16px] font-bold text-[#111111] mt-1.5">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Section 2: Recently Viewed (strictly matching Image 2) */}
        <div className="mt-8 mb-6">
          <h3
            className="text-[20px] sm:text-[22px] font-bold text-[#111111] tracking-tight mb-4 font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Recently Viewed
          </h3>

          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6">
            {(recentlyViewed.length >= 2
              ? recentlyViewed
              : allCatalog.filter((p) => p.itemId !== product.itemId)
            ).map((item, idx) => {
              const isFav = wishlistMap[item.itemId];

              return (
                <div
                  key={`rv-${item.itemId}-${idx}`}
                  onClick={() => router.push(`/product/${item.itemId}`)}
                  className="w-[220px] sm:w-[240px] shrink-0 snap-start select-none cursor-pointer group"
                >
                  {/* Image Container with floating heart button */}
                  <div className="aspect-[4/5] rounded-[4px] relative p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.mainImage || item.image || '/home/b2.webp'}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleCardWishlist(item.itemId);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-[#111111] hover:bg-neutral-50 transition-colors"
                      aria-label="Save to Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-[#111111]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Details with Just In Badge */}
                  <div className="pt-2.5">
                    <span className="text-[#c83200] text-[13px] font-medium leading-none block mb-1">
                      Just In
                    </span>
                    <h4
                      className="text-[15px] sm:text-[16px] font-medium text-[#111111] leading-tight line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {item.name}
                    </h4>
                    <p className="text-[15px] sm:text-[16px] font-bold text-[#111111] mt-1">
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal 1: View Product Details Modal (Popping out animation) */}
      {isProductDetailsMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isProductDetailsVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeProductDetails}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[520px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto max-h-[85vh] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isProductDetailsVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h2
                className="text-[19px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Product Details
              </h2>
              <button
                type="button"
                onClick={closeProductDetails}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-4 text-[14px] text-[#111111] leading-relaxed">
              <p>
                {product.description ||
                  'Designed for athletes who run and lift, this signature piece takes you from sprints to squats without missing a beat.'}
              </p>
              <div className="pt-2 border-t border-[#f0f0f0] space-y-2.5 text-[13.5px]">
                <p>
                  <strong className="font-semibold text-[#111111]">Color:</strong>{' '}
                  {product.color || 'White|Laser Crimson|Football Grey|Metallic Silver'}
                </p>
                <p>
                  <strong className="font-semibold text-[#111111]">Style Code:</strong>{' '}
                  {product.itemId || 'IO3815-102'}
                </p>
                <p>
                  <strong className="font-semibold text-[#111111]">Fit & Sizing:</strong>{' '}
                  Regular athletic fit designed for optimal movement.
                </p>
                <p>
                  <strong className="font-semibold text-[#111111]">Fabric & Care:</strong>{' '}
                  100% Cotton / Polyester Performance blend. Machine wash cold.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#f0f0f0]">
              <button
                type="button"
                onClick={closeProductDetails}
                className="w-full py-3.5 rounded-full bg-[#111111] text-white text-[15px] font-medium hover:bg-black active:scale-[0.99] transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Know More Modal (Popping out animation for Return & Exchange / Free Delivery) */}
      {isKnowMoreMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isKnowMoreVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeKnowMore}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[520px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 max-h-[88vh] overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isKnowMoreVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button Row */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[24px] font-bold text-[rgba(0,19,37,0.92)] tracking-tight">
                {knowMoreType === 'return' ? 'Return & Exchange' : 'Delivery Details'}
              </h1>
              <button
                type="button"
                aria-label="Close sheet"
                onClick={closeKnowMore}
                className="w-10 h-10 rounded-full bg-[#f3f4f6]/80 hover:bg-[#e5e7eb] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M20.6907 3.30935C20.5934 3.21133 20.4778 3.13352 20.3503 3.08043C20.2229 3.02734 20.0862 3 19.9481 3C19.8101 3 19.6734 3.02734 19.5459 3.08043C19.4185 3.13352 19.3028 3.21133 19.2056 3.30935L12 10.5254L4.79439 3.30935C4.69688 3.21184 4.58112 3.13449 4.45372 3.08172C4.32632 3.02895 4.18977 3.00178 4.05187 3.00178C3.91397 3.00178 3.77742 3.02895 3.65002 3.08172C3.52262 3.13449 3.40686 3.21184 3.30935 3.30935C3.11242 3.50628 3.00178 3.77337 3.00178 4.05187C3.00178 4.33037 3.11242 4.59746 3.30935 4.79439L10.5254 12L3.30935 19.2056C3.21133 19.3028 3.13352 19.4185 3.08043 19.5459C3.02734 19.6734 3 19.8101 3 19.9481C3 20.0862 3.02734 20.2229 3.08043 20.3503C3.13352 20.4778 3.21133 20.5934 3.30935 20.6907C3.40657 20.7887 3.52224 20.8665 3.64968 20.9196C3.77712 20.9727 3.91381 21 4.05187 21C4.18993 21 4.32662 20.9727 4.45406 20.9196C4.5815 20.8665 4.69717 20.7887 4.79439 20.6907L12 13.4746L19.2056 20.6907C19.3028 20.7887 19.4185 20.8665 19.5459 20.9196C19.6734 20.9727 19.8101 21 19.9481 21C20.0862 21 20.2229 20.9727 20.3503 20.9196C20.4778 20.8665 20.5934 20.7887 20.6907 20.6907C20.7887 20.5934 20.8665 20.4778 20.9196 20.3503C20.9727 20.2229 21 20.0862 21 19.9481C21 19.8101 20.9727 19.6734 20.9196 19.5459C20.8665 19.4185 20.7887 19.3028 20.6907 19.2056L13.4746 12L20.6907 4.79439C20.7887 4.69717 20.8665 4.5815 20.9196 4.45406C20.9727 4.32662 21 4.18993 21 4.05187C21 3.91381 20.9727 3.77712 20.9196 3.64968C20.8665 3.52224 20.7887 3.40657 20.6907 3.30935Z"
                    fill="#001325"
                    fillOpacity="0.92"
                  />
                </svg>
              </button>
            </div>

            {knowMoreType === 'return' ? (
              <div className="flex items-start gap-3 sm:gap-4 mt-2">
                <div className="shrink-0 pt-0.5">
                  <img
                    src="https://images-static.nykaa.com/fashion-images/media/Return.png"
                    width={45}
                    height={45}
                    alt="Return & Exchange"
                    className="w-[42px] h-[42px] sm:w-[45px] sm:h-[45px] object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <ol className="list-decimal pl-4.5 space-y-4 text-[14px] leading-[20px] text-[rgba(0,19,37,0.92)] tracking-[0.2px]">
                    <li>
                      Most Aesthetx Way products are eligible for returns or exchanges and can be requested within 14 days of delivery from the My Orders section on our website. Requests after this window will not be accepted. For select high-heat products, eligibility may vary and will be specified on the product page.
                    </li>
                    <li>
                      Items must be unused, unworn, unwashed, and returned in original condition with all tags, packaging, brand box, invoice, and accessories intact. Products showing signs of use or alteration will not be eligible.
                    </li>
                    <li>
                      If you receive a defective or incorrect product, please contact Customer Service immediately with product images at{' '}
                      <a href="mailto:support@aesthetxways.com" className="underline hover:opacity-80">
                        support@aesthetxways.com
                      </a>
                      {' '}.
                    </li>
                    <li>
                      Once a request is placed, our logistics partner will arrange a free pickup within the return window. Size exchanges can be requested via My Orders or by emailing{' '}
                      <a href="mailto:support@aesthetxways.com" className="underline hover:opacity-80">
                        support@aesthetxways.com
                      </a>
                      {' '}; if the requested size is unavailable, a return will be offered instead.
                    </li>
                    <li>
                      For approved returns, refunds are initiated within 5–7 working days after pickup.
                    </li>
                  </ol>
                  <p className="mt-5 text-[14px] leading-[20px] text-[rgba(0,19,37,0.92)] tracking-[0.2px]">
                    If you need any additional help, our Customer Service team is always here for you at{' '}
                    <a href="mailto:support@aesthetxways.com" className="underline hover:opacity-80">
                      support@aesthetxways.com
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 sm:gap-4 mt-2">
                  <div className="shrink-0 pt-0.5">
                    <img
                      src="https://images-static.nykaa.com/fashion-images/media/Shipping.png"
                      width={35}
                      height={36}
                      alt="Delivery"
                      className="w-[35px] h-[36px] object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3.5 text-[14px] leading-[20px] text-[rgba(0,19,37,0.92)] tracking-[0.2px]">
                    <p>
                      We offer free shipping on all orders across India, with no minimum order value and no additional delivery, platform, or hidden charges.
                    </p>
                    <p>
                      Orders are typically processed within 3-5 business days. Delivery timelines may vary based on location, product availability, and other factors. If your order includes multiple items, they may be shipped separately.
                    </p>
                    <p>
                      Estimated delivery dates shown at checkout are indicative and may be impacted by factors beyond our control, such as extreme weather, public holidays, or logistical constraints. While we aim to meet these timelines, delays may occur, and we’ll keep you informed if your order is affected.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[rgba(0,19,37,0.16)] pt-5 mt-5">
                  <h3 className="text-[14px] font-semibold tracking-[0.15px] text-[rgba(0,19,37,0.64)] uppercase leading-[20px] mb-3">
                    Cancellation Policy
                  </h3>
                  <div className="space-y-3.5 text-[14px] leading-[20px] text-[rgba(0,19,37,0.92)] tracking-[0.2px]">
                    <p>
                      You can cancel your order directly from the My Orders section before the item is shipped. Once an order has been processed and shipped, cancellation is not possible. In such cases, you can initiate a return after delivery through our returns process.
                    </p>
                    <p>
                      For cancelled orders, refunds are processed within 5 business days from the date of cancellation.
                    </p>
                    <p>
                      If you need any assistance, our Customer Service team is always here for you at{' '}
                      <a href="mailto:support@aesthetxways.com" className="underline hover:opacity-80">
                        support@aesthetxways.com
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Change Pincode Modal (Popping out animation) */}
      {isPincodeMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isPincodeVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closePincodeModal}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isPincodeVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3
                className="text-[17px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Check Delivery Pincode
              </h3>
              <button
                type="button"
                onClick={closePincodeModal}
                className="w-8 h-8 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputPincode}
                  onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 px-4 py-3 rounded-[12px] border border-[#e5e5e5] text-[15px] text-[#111111] outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inputPincode.length === 6) {
                      setDeliveryPincode(inputPincode);
                      closePincodeModal();
                    }
                  }}
                  className="px-5 py-3 rounded-[12px] bg-[#111111] text-white text-[14px] font-medium hover:bg-black active:scale-[0.98] transition-all cursor-pointer"
                >
                  Check
                </button>
              </div>
              <p className="text-[12.5px] text-[#707072]">
                Enter your delivery pincode to check real-time serviceability and delivery timeline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Added to Bag / Select Size Drawer matching Sonu design strictly */}
      {isBagModalMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Blacked-out backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isBagBackdropVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeBagModal}
          />

          {/* Drawer Sheet */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[540px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isBagModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95 sm:opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {bagModalMode === 'select-size' ? (
              /* Flow A: Select Size Drawer */
              <div>
                <div className="flex items-center justify-between">
                  <h2
                    className="text-[22px] sm:text-[24px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Select Size
                  </h2>
                  <button
                    type="button"
                    onClick={closeBagModal}
                    className="w-9 h-9 rounded-full hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Summary */}
                <div className="mt-4 flex items-center gap-3.5 pb-4 border-b border-neutral-100">
                  <div className="w-[64px] h-[64px] rounded-lg flex items-center justify-center shrink-0">
                    <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-medium text-[#111111] leading-tight">{product.name}</h3>
                    <p className="text-[14px] text-[#707072] mt-0.5">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Size Grid Options */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] text-[#707072]">Choose your size to add to bag</span>
                    <button
                      type="button"
                      onClick={() => {
                        closeBagModal();
                        setTimeout(() => openSizeGuide(), 320);
                      }}
                      className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {product.availableSizes?.map((size) => {
                      const hasStock = checkSizeHasStock(size);
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!hasStock}
                          onClick={() => {
                            if (!hasStock) return;
                            handleSelectSizeInDrawer(size);
                          }}
                          className={`py-3 rounded-[8px] text-[15px] font-medium transition-all ${
                            !hasStock
                              ? 'border border-neutral-200 text-neutral-300 line-through cursor-not-allowed bg-neutral-50 select-none'
                              : isSelected
                              ? 'border-2 border-[#111111] bg-white text-[#111111] shadow-xs cursor-pointer active:scale-95'
                              : 'border border-neutral-300 hover:border-[#111111] hover:bg-neutral-50 bg-white text-[#111111] cursor-pointer active:scale-95'
                          }`}
                        >
                          {getDisplaySize(size, product.sizeDisplayType)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Flow B: Added to Bag Confirmation Drawer */
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#008a00] flex items-center justify-center shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h2
                      className="text-[22px] sm:text-[24px] font-medium text-[#111111] tracking-tight leading-none font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      Added to Bag
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeBagModal}
                    className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] bg-[#f5f5f5] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={activeImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>

                  <div className="flex flex-col text-left">
                    <h3
                      className="text-[17px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                      {product.category || 'Apparel'} ({selectedSize || 'OS'})
                    </p>
                    <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                      Size {selectedSize || 'OS'}
                    </p>
                    <p
                      className="text-[17px] font-medium text-[#111111] mt-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[13px] text-[#707072] mt-0.5">Inclusive of all taxes</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/cart"
                    onClick={closeBagModal}
                    className="w-full py-4 rounded-full bg-[#111111] hover:bg-black text-white text-[16px] font-medium text-center transition-all block shadow-md active:scale-[0.99] cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    View Bag ({cartCount})
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Size Guide Modal matching Sonu exact design (compact & refined) */}
      {isModalMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isModalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSizeGuide}
          />

          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[560px] max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-[22px] sm:rounded-[20px] shadow-2xl z-50 px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-[20px] sm:text-[22px] font-medium text-[#111111] tracking-tight leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Size Guide
                </h2>
                <p className="text-[13px] text-[#707072] mt-0.5">{product.name}</p>
              </div>

              <button
                type="button"
                onClick={closeSizeGuide}
                className="w-8 h-8 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-[13px] sm:text-[13.5px] text-[#111111] font-normal mt-4 mb-2.5">
              Below are product&apos;s physical dimensions
            </p>

            {/* in / cm Pill Switcher */}
            <div className="mb-4">
              <div className="relative inline-flex items-center bg-[#f5f5f5] rounded-full p-0.5 h-[34px]">
                <div
                  className={`absolute top-0.5 bottom-0.5 w-[42px] rounded-full bg-white border border-[#111111] shadow-xs transition-all duration-300 ease-in-out ${
                    unit === 'in' ? 'left-0.5' : 'left-[44px]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`relative z-10 w-[42px] h-[28px] flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer ${
                    unit === 'in' ? 'text-[#111111]' : 'text-[#707072]'
                  }`}
                >
                  in
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`relative z-10 w-[42px] h-[28px] flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer ${
                    unit === 'cm' ? 'text-[#111111]' : 'text-[#707072]'
                  }`}
                >
                  cm
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto border border-[#e5e5e5] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="py-2.5 px-3 font-medium text-[#111111] bg-white border-r border-[#e5e5e5] align-top text-[12.5px] sm:text-[13px]">Size</th>
                    <th className="py-2.5 px-3 font-medium text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] align-top text-[12.5px] sm:text-[13px]">Waist / Length</th>
                    <th className="py-2.5 px-3 font-medium text-[#111111] bg-white border-r border-[#e5e5e5] align-top text-[12.5px] sm:text-[13px]">US Size</th>
                    <th className="py-2.5 px-3 font-medium text-[#111111] bg-[#fafafa] align-top text-[12.5px] sm:text-[13px]">EU Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {SIZE_CHART.map((row) => (
                    <tr key={row.size}>
                      <td className="py-2.5 px-3 font-bold text-[#111111] bg-white border-r border-[#e5e5e5] text-[13px] sm:text-[13.5px]">{row.size}</td>
                      <td className="py-2.5 px-3 font-normal text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] text-[13px] sm:text-[13.5px]">
                        {unit === 'in' ? `${row.inLength} in` : `${row.cmLength} cm`}
                      </td>
                      <td className="py-2.5 px-3 font-normal text-[#111111] bg-white border-r border-[#e5e5e5] text-[13px] sm:text-[13.5px]">{row.us}</td>
                      <td className="py-2.5 px-3 font-normal text-[#111111] bg-[#fafafa] text-[13px] sm:text-[13.5px]">{row.eu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
