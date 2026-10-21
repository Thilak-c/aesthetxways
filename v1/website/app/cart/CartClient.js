'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  updateItemSize,
  clearCart,
} from '@/components/cart/cartStore';

const SIZE_MAP = {
  S: 'S / 28',
  M: 'M / 30',
  L: 'L / 32',
  XL: 'XL / 34',
  XXL: 'XXL / 36',
  '28': 'S / 28',
  '30': 'M / 30',
  '32': 'L / 32',
  '34': 'XL / 34',
  '36': 'XXL / 36',
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

export default function CartClient({ initialStep = 'bag' }) {
  const router = useRouter();

  // Steps: 'bag' | 'address' | 'payment' | 'confirmation'
  const [checkoutStep, setCheckoutStep] = useState(initialStep);
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);

  const goToStep = (newStep, callback) => {
    setIsStepTransitioning(true);
    setTimeout(() => {
      setCheckoutStep(newStep);
      window.scrollTo({ top: 0 });
      if (typeof callback === 'function') callback();
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsStepTransitioning(false);
        }, 30);
      });
    }, 250);
  };
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wishlist, setWishlist] = useState({});
  const [productsCatalog, setProductsCatalog] = useState([]);

  // Change Size Modal State
  const [sizeModalItem, setSizeModalItem] = useState(null);
  const [isSizeModalMounted, setIsSizeModalMounted] = useState(false);
  const [isSizeModalVisible, setIsSizeModalVisible] = useState(false);
  const [isSizeBackdropVisible, setIsSizeBackdropVisible] = useState(false);
  const sizeTimerRef = useRef(null);

  // Size Guide Modal State
  const [isSizeGuideMounted, setIsSizeGuideMounted] = useState(false);
  const [isSizeGuideVisible, setIsSizeGuideVisible] = useState(false);
  const [sizeGuideUnit, setSizeGuideUnit] = useState('in'); // 'in' | 'cm'
  const sizeGuideTimerRef = useRef(null);

  // Fetch product catalog to determine available sizes accurately
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const text = await res.text();
        if (!text || !text.trim()) return;
        const data = JSON.parse(text);
        if (isMounted && data?.success && Array.isArray(data.products)) {
          setProductsCatalog(data.products);
        }
      } catch (e) {
        // Silently handle if request was aborted or invalid json
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const getProductForCartItem = (item) => {
    if (!item) return null;
    const pId = item.productId || item.id || item._id;
    return productsCatalog.find(
      (p) => p.itemId === pId || p._id === pId || p.id === pId
    );
  };

  const getAvailableSizesForItem = (item) => {
    if (!item) return ['OS'];
    const prod = getProductForCartItem(item);
    if (prod?.availableSizes && Array.isArray(prod.availableSizes) && prod.availableSizes.length > 0) {
      return prod.availableSizes;
    }
    if (item.availableSizes && Array.isArray(item.availableSizes) && item.availableSizes.length > 0) {
      return item.availableSizes;
    }
    const cat = (item.category || prod?.category || '').toLowerCase();
    const name = (item.name || prod?.name || '').toLowerCase();
    const sz = (item.size || '').toUpperCase();
    if (
      cat.includes('cap') ||
      name.includes('cap') ||
      cat.includes('hat') ||
      name.includes('hat') ||
      cat.includes('headwear') ||
      cat.includes('eyewear') ||
      cat.includes('access') ||
      sz === 'OS' ||
      sz === 'ONE SIZE' ||
      sz === 'FREE SIZE' ||
      sz === 'REGULAR'
    ) {
      return [item.size || 'OS'];
    }
    if (['S', 'M', 'L', 'XL', 'XXL'].includes(item.size)) {
      return ['S', 'M', 'L', 'XL', 'XXL'];
    }
    return [item.size || 'OS'];
  };

  const itemHasMultipleSizes = (item) => {
    if (!item) return false;
    const prod = getProductForCartItem(item);
    const cat = (item.category || prod?.category || '').toLowerCase();
    const name = (item.name || prod?.name || '').toLowerCase();
    const sz = (item.size || '').toUpperCase();
    if (
      cat.includes('cap') ||
      name.includes('cap') ||
      cat.includes('hat') ||
      name.includes('hat') ||
      cat.includes('headwear') ||
      sz === 'OS' ||
      sz === 'ONE SIZE' ||
      sz === 'FREE SIZE' ||
      sz === 'REGULAR'
    ) {
      return false;
    }
    const sizes = getAvailableSizesForItem(item);
    return sizes && sizes.length > 1;
  };

  const handleOpenChangeSize = (item) => {
    setSizeModalItem(item);
    setIsSizeModalMounted(true);
    if (sizeTimerRef.current) clearTimeout(sizeTimerRef.current);
    sizeTimerRef.current = setTimeout(() => {
      setIsSizeBackdropVisible(true);
      setIsSizeModalVisible(true);
    }, 20);
  };

  const handleCloseChangeSize = () => {
    setIsSizeBackdropVisible(false);
    setIsSizeModalVisible(false);
    if (sizeTimerRef.current) clearTimeout(sizeTimerRef.current);
    sizeTimerRef.current = setTimeout(() => {
      setIsSizeModalMounted(false);
      setSizeModalItem(null);
    }, 300);
  };

  const handleSelectNewSize = (newSize) => {
    if (!sizeModalItem) return;
    const prod = getProductForCartItem(sizeModalItem);
    if (prod?.sizeStock && typeof prod.sizeStock === 'object' && newSize in prod.sizeStock) {
      if (Number(prod.sizeStock[newSize] || 0) <= 0) {
        alert(`Size ${newSize} is currently out of stock.`);
        return;
      }
    }
    const oldSize = sizeModalItem.size;
    const itemId = sizeModalItem.id || sizeModalItem.productId;
    updateItemSize(itemId, oldSize, newSize);
    setCartItems(getCartItems());
    handleCloseChangeSize();
  };

  const handleOpenSizeGuide = () => {
    setIsSizeGuideMounted(true);
    if (sizeGuideTimerRef.current) clearTimeout(sizeGuideTimerRef.current);
    sizeGuideTimerRef.current = setTimeout(() => {
      setIsSizeGuideVisible(true);
    }, 20);
  };

  const handleCloseSizeGuide = () => {
    setIsSizeGuideVisible(false);
    if (sizeGuideTimerRef.current) clearTimeout(sizeGuideTimerRef.current);
    sizeGuideTimerRef.current = setTimeout(() => {
      setIsSizeGuideMounted(false);
    }, 300);
  };

  // Shipping Address Form State
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    name: '',
    mobile: '',
    email: '',
    pincode: '',
    houseNo: '',
    street: '',
    roadArea: '',
    landmark: '',
    city: '',
    state: 'Maharashtra',
    deliveryEtd: '',
  });

  // Address Sheet modal state with smooth slide-up animation from below
  const [isAddressSheetMounted, setIsAddressSheetMounted] = useState(false);
  const [isAddressSheetVisible, setIsAddressSheetVisible] = useState(false);
  const addressSheetTimerRef = useRef(null);

  const openAddressSheet = () => {
    if (addressSheetTimerRef.current) clearTimeout(addressSheetTimerRef.current);
    setIsAddressSheetMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAddressSheetVisible(true);
      });
    });
  };

  const closeAddressSheet = () => {
    setIsAddressSheetVisible(false);
    addressSheetTimerRef.current = setTimeout(() => {
      setIsAddressSheetMounted(false);
    }, 320);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAddressSheetMounted) {
        closeAddressSheet();
      }
    };
    if (isAddressSheetMounted) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (addressSheetTimerRef.current) clearTimeout(addressSheetTimerRef.current);
    };
  }, [isAddressSheetMounted]);

  const [addrPincode, setAddrPincode] = useState('');
  const [isPincodeFocused, setIsPincodeFocused] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [detectedCity, setDetectedCity] = useState('');
  const [detectedState, setDetectedState] = useState('');
  const [pincodeServiceable, setPincodeServiceable] = useState(null);
  const [deliveryEtd, setDeliveryEtd] = useState('');
  const [addrHouseNo, setAddrHouseNo] = useState('');
  const [addrRoadArea, setAddrRoadArea] = useState('');
  const [addrName, setAddrName] = useState('');
  const [addrMobile, setAddrMobile] = useState('');
  const [addrFocusedField, setAddrFocusedField] = useState(null);
  const [addrErrors, setAddrErrors] = useState({ houseNo: false, roadArea: false, pincode: false });

  // Accordion states in Address / Payment steps
  const [isDeliveryEstimateOpen, setIsDeliveryEstimateOpen] = useState(false);
  const [isPriceDetailsOpen, setIsPriceDetailsOpen] = useState(true);
  const [isPaymentPriceDetailsOpen, setIsPaymentPriceDetailsOpen] = useState(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'emi'
  const [selectedPaymentAccordion, setSelectedPaymentAccordion] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'other'
  const [selectedBank, setSelectedBank] = useState('AXIS');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Sync cart & profile on mount
  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCartItems());
      setIsLoaded(true);
    };

    const loadUserProfile = () => {
      try {
        const storedAddress = localStorage.getItem('sonu_shipping_address') || localStorage.getItem('aw_shipping_address');
        if (storedAddress) {
          try {
            const parsed = JSON.parse(storedAddress);
            setAddress((prev) => ({
              ...prev,
              ...parsed,
              name: parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || prev.name,
              landmark: parsed.landmark || '',
              houseNo: parsed.houseNo || '',
              street: parsed.street || parsed.roadArea || '',
              roadArea: parsed.roadArea || parsed.street || '',
              city: parsed.city || '',
              state: parsed.state || prev.state || 'Maharashtra',
              pincode: parsed.pincode || '',
              mobile: parsed.mobile || prev.mobile || '',
              email: parsed.email || prev.email || '',
              deliveryEtd: parsed.deliveryEtd || prev.deliveryEtd || '',
            }));
            setAddrPincode(parsed.pincode || '');
            setAddrHouseNo(parsed.houseNo || '');
            setAddrRoadArea(parsed.roadArea || parsed.street || '');
            setAddrName(parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || '');
            setAddrMobile(parsed.mobile || '');
            setDetectedCity(parsed.city || '');
            setDetectedState(parsed.state || '');
            setDeliveryEtd(parsed.deliveryEtd || '');
          } catch (e) {
            console.error('Error parsing stored address:', e);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    syncCart();
    loadUserProfile();

    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener('cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  // Update dynamic document title
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (checkoutStep === 'bag') {
        document.title = 'Bag | Aesthetx Ways';
      } else if (checkoutStep === 'address' || checkoutStep === 'payment') {
        document.title = 'Checkout | Aesthetx Ways';
      } else if (checkoutStep === 'confirmation') {
        document.title = 'Order Confirmed | Aesthetx Ways';
      }
    }
  }, [checkoutStep]);

  const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.priceNumber || item.price || 0) * (item.quantity || 1),
    0
  );

  const toggleWishlist = (key) => {
    setWishlist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Real-time Shiprocket / Postal PIN lookup
  const fetchShiprocketEtd = async (code) => {
    setIsPincodeLoading(true);
    try {
      const res = await fetch(`/api/shiprocket/serviceability?pincode=${code}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.deliverable) {
          setDetectedCity(json.data.city || '');
          setDetectedState(json.data.state || '');
          setDeliveryEtd(json.data.etd || (json.data.estimatedDays ? `In ${json.data.estimatedDays} days` : ''));
          setPincodeServiceable(true);
        } else {
          setDetectedCity(json.data.city || '');
          setDetectedState(json.data.state || '');
          setDeliveryEtd('');
          setPincodeServiceable(false);
        }
      } else {
        // Fallback to Postal API
        const postRes = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        if (postRes.ok) {
          const postData = await postRes.json();
          const po = postData?.[0]?.PostOffice?.[0];
          if (po) {
            setDetectedCity(po.District || po.Block || '');
            setDetectedState(po.State || '');
            setDeliveryEtd('3-5 business days');
            setPincodeServiceable(true);
          } else {
            setPincodeServiceable(false);
          }
        } else {
          setPincodeServiceable(false);
        }
      }
    } catch (err) {
      console.error('Shiprocket serviceability error:', err);
      setPincodeServiceable(false);
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAddrPincode(val);
    setAddrErrors((prev) => ({ ...prev, pincode: false }));

    if (val.length === 6) {
      fetchShiprocketEtd(val);
    } else {
      setDeliveryEtd('');
      setDetectedCity('');
      setDetectedState('');
      setPincodeServiceable(null);
    }
  };

  const hasSavedAddress = () => {
    if (address?.pincode && (address?.houseNo || address?.street || address?.roadArea)) {
      return true;
    }
    try {
      const stored = typeof window !== 'undefined' ? (localStorage.getItem('aw_shipping_address') || localStorage.getItem('sonu_shipping_address')) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.pincode && (parsed?.houseNo || parsed?.street || parsed?.roadArea)) {
          return true;
        }
      }
    } catch (err) {}
    return false;
  };

  const handleSaveDeliveryAddress = (e) => {
    e?.preventDefault();
    const errors = {
      pincode: !addrPincode || addrPincode.length !== 6,
      houseNo: !addrHouseNo.trim(),
      roadArea: !addrRoadArea.trim(),
    };

    if (errors.pincode || errors.houseNo || errors.roadArea) {
      setAddrErrors(errors);
      return;
    }

    const finalName = addrName.trim() || address.name || 'Valued Customer';
    const finalMobile = addrMobile.trim() || address.mobile || '8008439762';

    const shippingAddress = {
      firstName: finalName.split(' ')[0] || 'Valued',
      lastName: finalName.split(' ').slice(1).join(' ') || 'Customer',
      name: finalName,
      mobile: finalMobile,
      email: address.email || 'customer@aesthetxways.com',
      pincode: addrPincode.trim(),
      city: detectedCity || address.city || 'PATNA',
      state: detectedState || address.state || 'Bihar',
      houseNo: addrHouseNo.trim(),
      street: addrRoadArea.trim(),
      roadArea: addrRoadArea.trim(),
      landmark: '',
      deliveryEtd: deliveryEtd || '3-5 business days',
    };

    try {
      localStorage.setItem('aw_shipping_address', JSON.stringify(shippingAddress));
      localStorage.setItem('sonu_shipping_address', JSON.stringify(shippingAddress));
      localStorage.setItem('aw_user_mobile', finalMobile);
      localStorage.setItem('sonu_user_mobile', finalMobile);
      localStorage.setItem('aw_user_name', finalName);
      localStorage.setItem('sonu_user_name', finalName);
    } catch (err) {
      console.error('Error saving address to localStorage:', err);
    }

    setAddress(shippingAddress);
    closeAddressSheet();

    // First time flow: directly open payment options without opening "Select address and pay"
    goToStep('payment');
  };

  // Step 1: "Proceed to Pay" in Bag
  const handleProceedToBuy = () => {
    if (cartItems.length === 0) return;

    if (hasSavedAddress()) {
      // From second time: directly move to "Select address and pay" with smooth fade
      goToStep('address');
    } else {
      // First time: stay in bag and open delivery address modal with slide-up animation
      openAddressSheet();
    }
  };

  // Step 2 -> Step 3: Proceed to Payment (Directly opens "Select payment option")
  const handleProceedToPayment = (e) => {
    e?.preventDefault();

    // Verify stock for all items in bag before proceeding
    for (const item of cartItems) {
      const prod = getProductForCartItem(item);
      if (prod) {
        if (prod.inStock === false) {
          alert(`"${item.name}" is currently out of stock. Please remove it from your bag to proceed.`);
          return;
        }
        if (prod.sizeStock && typeof prod.sizeStock === 'object' && item.size in prod.sizeStock) {
          if (Number(prod.sizeStock[item.size] || 0) <= 0) {
            alert(`Size "${item.size}" of "${item.name}" is currently out of stock. Please change the size or remove it from your bag to proceed.`);
            return;
          }
        }
      }
    }

    let currentAddress = address;
    if (!currentAddress?.pincode) {
      try {
        const stored = typeof window !== 'undefined' ? (localStorage.getItem('aw_shipping_address') || localStorage.getItem('sonu_shipping_address')) : null;
        if (stored) {
          currentAddress = JSON.parse(stored);
          setAddress(currentAddress);
        }
      } catch (err) {
        console.error('Error retrieving address from localStorage:', err);
      }
    }

    if (!currentAddress?.pincode) {
      openAddressSheet();
      return;
    }

    goToStep('payment');
  };

  // Helper to load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 3 -> Step 4: Open Razorpay Gateway & Complete Order
  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Could not load payment gateway. Please check your internet connection.');
        setIsPlacingOrder(false);
        return;
      }

      // 1. Create order on backend via Razorpay Orders API
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          items: cartItems,
          notes: {
            customerName: address.name || 'Customer',
            customerEmail: address.email || '',
            contact: address.mobile || '',
            address: `${address.houseNo || ''}, ${address.street || address.roadArea || ''}, ${address.city || ''} - ${address.pincode || ''}`,
            method: paymentMethod,
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || (!orderData.orderId && !orderData.id)) {
        throw new Error(orderData.error || orderData.message || 'Failed to create payment order');
      }

      const orderId = orderData.orderId || orderData.id;
      const displayName = address.name || 'Customer';
      const displayContact = (address.mobile || '8008439762').replace(/\D/g, '').slice(-10);

      // Sequence blocks to always show full detailed payment options (exact from Sonu)
      const sequenceMap = {
        card: ['block.cards', 'block.upi', 'block.netbanking', 'block.wallets_emi'],
        netbanking: ['block.netbanking', 'block.cards', 'block.upi', 'block.wallets_emi'],
        emi: ['block.wallets_emi', 'block.cards', 'block.upi', 'block.netbanking'],
        upi: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets_emi'],
      };
      const activeSequence = sequenceMap[paymentMethod] || sequenceMap.card;

      // 2. Configure and open Razorpay modal with full options (exact from Sonu)
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ToeynJ0XXfrtyp',
        amount: orderData.amount || Math.round(subtotal * 100),
        currency: orderData.currency || 'INR',
        name: 'AESTHETX WAYS',
        description: `Order Payment (${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'})`,
        image: '/logo_t.svg',
        order_id: orderId,
        one_click_checkout: false,
        remember_customer: false,
        prefill: {
          name: displayName,
          email: address.email || '',
          contact: displayContact,
        },
        notes: {
          contact: displayContact,
          address: `${address.houseNo || ''}, ${address.street || address.roadArea || ''}, ${address.city || ''} - ${address.pincode || ''}`,
          method: paymentMethod,
        },
        config: {
          display: {
            blocks: {
              cards: {
                name: 'Cards (Credit / Debit)',
                instruments: [{ method: 'card' }],
              },
              upi: {
                name: 'UPI / QR (Google Pay, PhonePe, Paytm)',
                instruments: [{ method: 'upi' }],
              },
              netbanking: {
                name: 'Net Banking (All Indian Banks)',
                instruments: [{ method: 'netbanking' }],
              },
              wallets_emi: {
                name: 'Wallets & EMI Options',
                instruments: [
                  { method: 'wallet' },
                  { method: 'emi' },
                  { method: 'paylater' },
                ],
              },
            },
            sequence: activeSequence,
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: '#111111',
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsPlacingOrder(false);
          },
        },
        handler: async function (response) {
          const placedOrderId = `AW-IN-${Math.floor(100000 + Math.random() * 900000)}`;
          const confirmedData = {
            orderId: placedOrderId,
            orderNumber: placedOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
            items: [...cartItems],
            totalAmount: subtotal,
            address: { ...address },
            paymentMethod,
            placedAt: new Date().toISOString(),
            estimatedDelivery: address.deliveryEtd || '3-5 business days',
          };

          // Save confirmed order to backend
          try {
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: cartItems.map((item) => ({
                  productId: item.productId || item.id,
                  name: item.name,
                  price: item.priceNumber || item.price,
                  quantity: item.quantity || 1,
                  size: item.size || 'OS',
                  image: item.image || item.mainImage,
                })),
                customerDetails: {
                  fullName: displayName,
                  email: address.email || 'customer@aesthetxways.com',
                  phone: displayContact,
                  address: `${address.houseNo || ''}, ${address.street || address.roadArea || ''}`,
                  city: address.city || 'PATNA',
                  state: address.state || 'Maharashtra',
                  pincode: address.pincode || '800013',
                },
                paymentMethod,
                orderTotal: subtotal,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
          } catch (dbErr) {
            console.error('Order save error:', dbErr);
          }

          // Save in localStorage for past orders view
          try {
            const pastOrders = JSON.parse(localStorage.getItem('aw_orders') || localStorage.getItem('sonu_orders') || '[]');
            pastOrders.unshift(confirmedData);
            localStorage.setItem('aw_orders', JSON.stringify(pastOrders));
            localStorage.setItem('sonu_orders', JSON.stringify(pastOrders));
          } catch (err) {
            // ignore
          }

          setConfirmedOrder(confirmedData);
          setIsPlacingOrder(false);
          goToStep('confirmation', () => {
            clearCart();
          });
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        setIsPlacingOrder(false);
        alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setIsPlacingOrder(false);
      alert(err.message || 'Payment could not be initialized. Please try again.');
    }
  };

  // Loading spinner
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] bg-white">
        <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // STEP 4: ORDER SUCCESS / CONFIRMATION
  if (checkoutStep === 'confirmation' && confirmedOrder) {
    return (
      <div className={`w-full max-w-[580px] mx-auto px-5 sm:px-6 pt-8 pb-16 font-['Helvetica_Now_Text',sans-serif] text-[#111111] bg-white min-h-[80vh] transition-opacity duration-300 ease-out ${
        isStepTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
        {/* Success Icon */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#008a00] flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <svg
              className="w-8 h-8"
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
          <h1
            className="text-[26px] sm:text-[30px] font-bold tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Thank you for your order!
          </h1>
          <p className="text-[14px] text-[#707072] mt-1.5 font-normal">
            Order ID: <strong className="text-[#111111] font-semibold">{confirmedOrder.orderId}</strong>
          </p>
        </div>

        {/* Order Details Card */}
        <div className=" rounded-[16px] p-2 mt-8 bg-white  space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
            <div>
              <p className="text-[13px] text-[#707072]">Estimated Delivery</p>
              <p className="text-[15px] font-bold text-[#111111] mt-0.5">{confirmedOrder.estimatedDelivery}</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-[#707072]">Total Paid</p>
              <p className="text-[16px] font-bold text-[#008a00] mt-0.5">₹{confirmedOrder.totalAmount?.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <p className="text-[13px] text-[#707072]">Delivery Address</p>
            <p className="text-[14px] font-medium text-[#111111] mt-1">
              {confirmedOrder.address?.name || confirmedOrder.address?.firstName}
            </p>
            <p className="text-[13px] text-[#707072] leading-relaxed">
              {confirmedOrder.address?.houseNo}, {confirmedOrder.address?.street || confirmedOrder.address?.roadArea}, {confirmedOrder.address?.city} - {confirmedOrder.address?.pincode}
            </p>
          </div>

          <div className="pt-3 border-t border-[#f0f0f0]">
            <p className="text-[13px] text-[#707072] mb-3">Items Purchased ({confirmedOrder.items?.length})</p>
            <div className="space-y-3">
              {confirmedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-[#111111] truncate">{item.name}</p>
                    <p className="text-[12px] text-[#707072]">Size: {item.size} • Qty: {item.quantity}</p>
                  </div>
                  <p className="text-[14px] font-bold text-[#111111]">₹{((item.priceNumber || item.price) * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-4 rounded-full bg-[#111111] hover:bg-black text-white text-[16px] font-medium text-center transition-all shadow-sm"
          >
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="w-full py-3.5 rounded-full border border-[#111111] text-[#111111] text-[15px] font-medium text-center hover:bg-[#fafafa] transition-colors"
          >
            View Your Orders
          </Link>
        </div>
      </div>
    );
  }

  // EMPTY BAG SCREEN (When cart has 0 items)
  if (cartItems.length === 0 && checkoutStep !== 'confirmation') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center select-none font-['Helvetica_Now_Text',sans-serif] bg-white">
        <div className="max-w-[440px] mx-auto flex flex-col items-center">
          <h1
            className="text-[26px] sm:text-[30px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Your bag is empty.
          </h1>
          <p
            className="text-[15px] sm:text-[16px] text-[#707072] mt-2 sm:mt-2.5 mb-8 font-normal font-['Helvetica_Now_Text',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
          >
            When you add products, they&apos;ll appear here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-10 sm:px-12 py-3.5 sm:py-4 bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[15px] sm:text-[16px] font-medium rounded-full transition-all shadow-sm font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  // STEP 2: SELECT ADDRESS & PAY (SONU EXACT DESIGN MATCH)
  if (checkoutStep === 'address') {
    const displayName =
      address.name ||
      `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
      'Customer';
    const displayMobile = address.mobile || '';
    const displayPincode = address.pincode || '';
    const displayHouse = address.houseNo || '';
    const displayStreet = address.street || address.roadArea || '';
    const displayLandmark = address.landmark || '';
    const displayAddressLine = [displayHouse, displayStreet, displayLandmark].filter(Boolean).join(', ') || 'Address on file';
    const displayCity = (address.city || '').toUpperCase();
    const displayCityStatePin = displayCity ? `${displayCity} - ${displayPincode}` : displayPincode;

    return (
      <div className={`min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] transition-opacity duration-300 ease-out ${
        isStepTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-[#f0f0f0]">
          <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 h-14 flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => goToStep('bag')}
              className="w-9 h-9 -ml-1.5 flex items-center justify-center text-[#111111] hover:text-[#707072] cursor-pointer transition-colors"
              aria-label="Back to Bag"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-[18px] sm:text-[19px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Select Address & Pay
            </h1>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 pt-4 pb-32 sm:pb-36 space-y-5">
          {/* 1. Address Summary Card */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 sm:p-5 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <h2
              className="text-[15px] sm:text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Deliver to {displayName}, {displayPincode}
            </h2>

            <div className="text-[13px] sm:text-[13.5px] text-[#707072] mt-2 space-y-0.5 leading-relaxed font-['Helvetica_Now_Text',sans-serif]">
              <p className="line-clamp-2">{displayAddressLine}...</p>
              <p>{displayCityStatePin}</p>
              <p>+91-{displayMobile}</p>
            </div>

            <button
              type="button"
              onClick={() => openAddressSheet()}
              className="w-full py-3 mt-4 rounded-full border border-[#111111] text-[14px] font-medium text-[#111111] bg-white hover:bg-[#f7f7f7] active:scale-[0.99] transition-all cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Change or Add Address
            </button>
          </div>

          {/* 2. Offers for you */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <h2
                className="text-[16px] sm:text-[17px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Offers for you
              </h2>
              <button
                type="button"
                className="text-[13px] font-medium text-[#111111] hover:underline cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                View all
              </button>
            </div>

            <div className="border border-[#e5e5e5] rounded-[14px] p-4 bg-white flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <div>
                <p className="text-[12.5px] font-medium leading-none">
                  <span className="text-[#008a00] font-semibold">Cashback</span>{' '}
                  <span className="text-[#707072]">HDFC EMI Bank Of...</span>
                </p>
                <p
                  className="text-[14px] sm:text-[14.5px] font-bold text-[#111111] mt-1.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  10% off upto ₹1,500 ...
                </p>
              </div>
              <div className="flex flex-col items-end text-[11.5px] text-[#707072] shrink-0 pl-3">
                <span className="leading-tight">1 of 1</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111] mt-1" />
              </div>
            </div>
          </div>

          {/* 3. Order Information */}
          <div>
            <h2
              className="text-[16px] sm:text-[17px] font-bold text-[#111111] pb-2.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Order Information
            </h2>

            <div className="space-y-3">
              {/* Accordion 1: Delivery Estimate */}
              <div className="border border-[#e5e5e5] rounded-[14px] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => setIsDeliveryEstimateOpen(!isDeliveryEstimateOpen)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
                >
                  <span
                    className="text-[15px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Delivery Estimate
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                      isDeliveryEstimateOpen ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isDeliveryEstimateOpen && (
                  <div className="px-4 pb-1 pt-1 border-t border-[#f0f0f0] text-[13px] text-[#707072] space-y-0">
                    <div className="flex items-center gap-0 text-[#111111]">
                     
                      <span>
                        Expected delivery by{' '}
                        <strong className="font-semibold text-[#111111]">
                          {address.deliveryEtd || '3-5 business days'}
                        </strong>
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8d8d8d] ">
                      Standard surface shipping across India via Shiprocket
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Price Details */}
              <div className="border border-[#e5e5e5] rounded-[14px] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => setIsPriceDetailsOpen(!isPriceDetailsOpen)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
                >
                  <span
                    className="text-[15px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Price Details
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                      isPriceDetailsOpen ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>

                {isPriceDetailsOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#f0f0f0] space-y-2.5 text-[13.5px]">
                    <div className="flex justify-between items-center text-[#707072]">
                      <span>Bag Total</span>
                      <span className="text-[#111111] font-medium">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#707072]">
                      <span className="flex items-center gap-1.5">
                        Shipping Charges
                        <svg
                          className="w-3.5 h-3.5 text-[#8d8d8d]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="line-through text-[#8d8d8d]">₹99</span>
                        <span className="text-[#008a00] font-medium">Free</span>
                      </span>
                    </div>
                    <div className="border-b border-[#f0f0f0] my-2" />
                    <div className="flex justify-between items-center text-[15px] font-bold text-[#111111]">
                      <span
                        className="font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        You Pay
                      </span>
                      <span
                        className="font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Footer Note */}
          <div className="pt-2 pb-6">
            <p
              className="text-center text-[12.5px] text-[#8d8d8d] font-normal font-['Helvetica_Now_Text',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              Powered by Flowify Agency
            </p>
          </div>
        </div>

        {/* Fixed Bottom Bar: Proceed to Pay */}
        <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-[#e5e5e5] h-[84px] sm:h-[88px] flex items-center px-4 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-opacity duration-300 ease-out ${
          isStepTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="max-w-[480px] sm:max-w-[500px] mx-auto w-full">
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Proceed to Pay
            </button>
          </div>
        </div>

        {/* Address Sheet Modal (No Login Step) */}
        {renderAddressSheet()}
      </div>
    );
  }

  // STEP 3: PAYMENT METHOD SELECTION (SONU EXACT DESIGN MATCH)
  if (checkoutStep === 'payment') {
    const popularBanks = [
      { id: 'AXIS', name: 'AXIS', icon: '/images/payments/bank-axis.svg' },
      { id: 'HDFC', name: 'HDFC', icon: '/images/payments/bank-hdfc.svg' },
      { id: 'ICICI', name: 'ICICI', icon: '/images/payments/bank-icici.svg' },
      { id: 'KOTAK', name: 'KOTAK', icon: '/images/payments/bank-kotak.svg' },
      { id: 'SBI', name: 'SBI', icon: '/images/payments/bank-sbi.svg' },
      { id: 'YES', name: 'YES', icon: '/images/payments/bank-yes.svg' },
      { id: 'Other', name: 'Other Bank', icon: '/images/payments/bank-other.svg' },
    ];

    return (
      <div className={`min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] transition-opacity duration-300 ease-out ${
        isStepTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-[#f0f0f0]">
          <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 h-14 flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => goToStep('address')}
              className="w-9 h-9 -ml-1.5 flex items-center justify-center text-[#111111] hover:text-[#707072] cursor-pointer transition-colors"
              aria-label="Back to Address"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-[18px] sm:text-[19px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Select payment option
            </h1>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 pt-5 pb-24 space-y-3.5">
          {/* Option 1: UPI */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('upi');
                setSelectedPaymentAccordion(selectedPaymentAccordion === 'upi' ? '' : 'upi');
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/upi.svg"
                    alt="UPI"
                    className="w-6 h-6 object-contain"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    UPI
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Google Pay, PhonePe, Paytm & more
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'upi' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
              />
            </div>

            {selectedPaymentAccordion === 'upi' && (
              <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
                {/* 4 UPI Apps Grid */}
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {/* Google Pay */}
                  <div
                    onClick={() => setSelectedUpiApp('gpay')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'gpay'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/googlePay.svg"
                        alt="Google Pay"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      Google Pay
                    </p>
                  </div>

                  {/* PhonePe */}
                  <div
                    onClick={() => setSelectedUpiApp('phonepe')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'phonepe'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/phonePe.svg"
                        alt="PhonePe"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      PhonePe
                    </p>
                  </div>

                  {/* Paytm */}
                  <div
                    onClick={() => setSelectedUpiApp('paytm')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'paytm'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/paytm.svg"
                        alt="Paytm"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      Paytm
                    </p>
                  </div>

                  {/* Other UPI */}
                  <div
                    onClick={() => setSelectedUpiApp('other')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'other'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/otherUpi.svg"
                        alt="Other UPI"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      Other UPI
                    </p>
                  </div>
                </div>

                {/* Optional input when Other UPI is selected */}
                {selectedUpiApp === 'other' && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g. mobile@okhdfcbank)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                    />
                  </div>
                )}

                {/* Pay Button */}
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-5 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 2: Credit/ Debit Card */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('card');
                setSelectedPaymentAccordion(selectedPaymentAccordion === 'card' ? '' : 'card');
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/card.svg"
                    alt="Credit/ Debit Card"
                    className="w-6 h-6 object-contain"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Credit/ Debit Card
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Visa, Mastercard, Rupay & more
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'card' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
              />
            </div>

            {selectedPaymentAccordion === 'card' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-3">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM / YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                />

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 3: Net Banking */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('netbanking');
                setSelectedPaymentAccordion(selectedPaymentAccordion === 'netbanking' ? '' : 'netbanking');
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/netbanking.svg"
                    alt="Net Banking"
                    className="w-6 h-6 object-contain"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Net Banking
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Pay through your favourite bank
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'netbanking' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
              />
            </div>

            {selectedPaymentAccordion === 'netbanking' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-3">
                <div className="space-y-1.5 pt-1">
                  {popularBanks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBank(b.id)}
                      className={`flex items-center justify-between p-3 rounded-[10px] cursor-pointer transition-colors ${
                        selectedBank === b.id
                          ? 'bg-[#f7f7f7] border border-[#111111]'
                          : 'hover:bg-[#fafafa] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={b.icon}
                          alt={b.name}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-[14px] font-medium text-[#111111]">
                          {b.name}
                        </span>
                      </div>
                      <img
                        src={
                          selectedBank === b.id
                            ? '/images/payments/radio-selected.svg'
                            : '/images/payments/radio-unselected.svg'
                        }
                        alt=""
                        className="w-5 h-5 shrink-0"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 4: EMI */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('emi');
                setSelectedPaymentAccordion(selectedPaymentAccordion === 'emi' ? '' : 'emi');
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/emi.svg"
                    alt="EMI"
                    className="w-6 h-6 object-contain"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    EMI
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Easy Installment Options
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'emi' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
              />
            </div>

            {selectedPaymentAccordion === 'emi' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-4">
                <div className="p-3 bg-[#e8f5e9] rounded-[10px] text-[13px] text-[#008a00] font-medium flex items-center gap-2">
                  <span>10% Instant Discount up to ₹1,500 on HDFC CC EMI</span>
                </div>
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Price Details Accordion */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 sm:p-5 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => setIsPaymentPriceDetailsOpen(!isPaymentPriceDetailsOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <p
                className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Price Details
              </p>
              <img
                src={isPaymentPriceDetailsOpen ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
              />
            </div>

            {isPaymentPriceDetailsOpen && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-3.5">
                <div className="flex items-center justify-between text-[14px] text-[#707072]">
                  <span>Bag Total</span>
                  <span className="text-[#111111] font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-[14px] text-[#707072]">
                  <span className="flex items-center gap-1.5">
                    Shipping Charges
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#8d8d8d] text-[10px] text-[#8d8d8d]">
                      i
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="line-through text-[#8d8d8d] text-[13px]">₹99</span>
                    <span className="text-[#059669]">Free</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
                  <span
                    className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    You Pay
                  </span>
                  <span
                    className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="w-full border-t border-[#e5e5e5] mt-10 pt-6 pb-14 text-center">
          <p className="text-[13px] text-[#707072] font-normal tracking-wide">
            Powered by Flowify Agency
          </p>
        </div>
      </div>
    );
  }

  // STEP 1: ACTIVE BAG SCREEN (EXACT SONU DESIGN - NO CARRY BAG UPSELL - NO LOGIN STEP)
  return (
    <>
      <div className={`w-full max-w-[540px] mx-auto px-5 sm:px-6 pt-6 sm:pt-10 pb-32 font-['Helvetica_Now_Text',sans-serif] select-none text-[#111111] bg-white min-h-screen transition-opacity duration-300 ease-out ${
        isStepTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
      {/* Centered Bag Header */}
      <div className="text-center">
        <h1
          className="text-[26px] sm:text-[28px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Bag
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1 font-normal font-['Helvetica_Now_Text',sans-serif]">
          {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'} | ₹ {subtotal.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Top Divider Line */}
      <div className=" mt-6 border-t border-[#e5e5e5] mb-7" />

      {/* Bag Items List */}
      <div className="space-y-8">
        {cartItems.map((item, idx) => {
          const itemKey = `${item.id || item.productId}-${item.size}-${idx}`;
          const isFavourited = wishlist[itemKey];

          return (
            <div key={itemKey}>
              {/* Product Info Row */}
              <div className="flex gap-4 sm:gap-5 items-start">
                {/* Square Product Image */}
                <div className="w-[124px] h-[124px] sm:w-[136px] sm:h-[136px]  shrink-0 flex items-center justify-center rounded-[2px] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Details Column */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[17px] sm:text-[18px] font-bold text-[#111111] leading-none">
                    ₹ {(item.priceNumber || item.price || 0).toLocaleString('en-IN')}
                  </p>

                  <h2
                    className="text-[16px] sm:text-[17px] font-medium text-[#111111] mt-1.5 leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {item.name}
                  </h2>

                  <p className="text-[14px] text-[#707072] mt-1 leading-normal">
                    {item.category || 'Apparel'}{itemHasMultipleSizes(item) ? ` (${item.size})` : ''}
                  </p>

                  <p className="text-[14px] text-[#707072] mt-0.5 leading-normal">14 Day Return</p>

                  {/* Underlined Size selector - only shown for products with multiple sizes (hidden for caps & single-size items) */}
                  {itemHasMultipleSizes(item) && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenChangeSize(item)}
                        className="text-[14px] font-medium text-[#111111] underline underline-offset-4 decoration-1 hover:text-[#707072] cursor-pointer transition-colors"
                      >
                        Size {getDisplaySize(item.size, item.sizeDisplayType || getProductForCartItem(item)?.sizeDisplayType)}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Pill + Wishlist Action Row */}
              <div className="mt-3.5 flex items-center gap-2.5">
                <div className="inline-flex items-center border border-[#e5e5e5] rounded-full h-10 px-3.5 bg-white">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id || item.productId, item.size)}
                    className="p-1 text-[#111111] hover:text-[#707072] transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 24 24"
                      role="img"
                      width="24px"
                      height="24px"
                      fill="none"
                    >
                      <path
                        stroke="currentColor"
                        strokeMiterlimit="10"
                        strokeWidth="1.5"
                        d="M13.75 10v7m-3.5-7v7m-3.5-8.5V17c0 1.24 1.01 2.25 2.25 2.25h6c1.24 0 2.25-1.01 2.25-2.25V7.75h2.25m-10-3h3.75c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H4.5"
                      />
                    </svg>
                  </button>

                  <span className="px-3.5 text-[15px] font-medium text-[#111111] min-w-[28px] text-center">
                    {item.quantity || 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.id || item.productId, item.size, 1)}
                    className="p-1 text-[#111111] hover:text-[#707072] text-[18px] font-normal transition-colors cursor-pointer leading-none flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleWishlist(itemKey)}
                  className={`w-10 h-10 rounded-full border border-[#e5e5e5] flex items-center justify-center transition-colors cursor-pointer hover:bg-neutral-50 ${
                    isFavourited ? 'bg-neutral-50 text-red-500' : 'text-[#111111]'
                  }`}
                  aria-label={isFavourited ? 'Remove from favourites' : 'Save to favourites'}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px]"
                    fill={isFavourited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              {/* Urgency Badge */}
              <div className="mt-3 flex items-center gap-1.5 text-[#b07800] text-[14px]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Only 1 left.</span>
              </div>

              {/* Divider between items */}
              <div className="border-t border-[#e5e5e5] mt-6" />
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <section className="pt-8 pb-32" aria-label="Order Summary">
        <h2 className="text-[22px] sm:text-[24px] font-bold text-[#111111] mb-5 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]" style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}>
          Summary
        </h2>

        <div className="space-y-3.5 text-[15px] sm:text-[16px] text-[#111111]">
          <div className="flex items-center justify-between">
            <span>Bag Total</span>
            <span>₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Sub Total</span>
            <span>₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Shipping Charges</span>
            <span className="text-[#0d8240] font-normal">Free</span>
          </div>
        </div>

        <div className="border-t border-[#e5e5e5] my-4" />

        <div className="flex items-center justify-between text-[18px] sm:text-[19px] font-bold text-[#111111]">
          <span>You Pay</span>
          <span>₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="border-t border-[#e5e5e5] mt-4 mb-4" />
      </section>
      </div>

      {/* Fixed Bottom Bar: Proceed to Pay */}
      <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-[#e5e5e5] h-[84px] sm:h-[88px] flex items-center px-5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-opacity duration-300 ease-out ${
        isStepTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="max-w-[540px] mx-auto w-full">
          <button
            type="button"
            onClick={handleProceedToBuy}
            className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Proceed to Pay
          </button>
        </div>
      </div>

      {/* Address Sheet Modal */}
      {renderAddressSheet()}

      {/* Select Size Drawer Modal (Matching product detail page design) */}
      {renderChangeSizeDrawer()}

      {/* Size Guide Modal (Matching product detail page design) */}
      {renderSizeGuideModal()}
    </>
  );

  // Reusable Address Sheet Modal with smooth slide-up animation from below
  function renderAddressSheet() {
    if (!isAddressSheetMounted) return null;

    return (
      <div className="fixed inset-0 z-[200] overflow-hidden select-none font-['Helvetica_Now_Text',sans-serif]">
        {/* Dark Backdrop with smooth fade in/out */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
            isAddressSheetVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeAddressSheet}
        />

        {/* Modal / Bottom Sheet with smooth slide up & slide down animation */}
        <div
          className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[500px] max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-[24px] shadow-2xl z-[210] p-6 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isAddressSheetVisible
              ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
              : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
            <h2
              className="text-[19px] sm:text-[20px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Delivery Address
            </h2>
            <button
              type="button"
              onClick={closeAddressSheet}
              className="w-8 h-8 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Location Status Card */}
          <div className="bg-[#f5f5f5] rounded-[12px] p-4 my-4 transition-all">
            {isPincodeLoading ? (
              <div className="animate-pulse space-y-2 py-0.5">
                <div className="h-5 bg-[#e2e2e5] rounded w-36" />
                <div className="h-3.5 bg-[#e2e2e5] rounded w-48" />
              </div>
            ) : detectedCity ? (
              <div>
                <h3 className="text-[16px] font-bold text-[#111111] leading-tight">
                  {detectedCity}{detectedState ? `, ${detectedState}` : ''}
                </h3>
                <p className="text-[13px] text-[#707072] mt-0.5">
                  Location auto-detected
                </p>
              </div>
            ) : pincodeServiceable === false ? (
              <div>
                <h3 className="text-[16px] font-bold text-[#e53935] leading-tight">
                  Delivery Not Available
                </h3>
                <p className="text-[13px] text-[#707072] mt-0.5">
                  PIN code {addrPincode} is not serviceable
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-[16px] font-bold text-[#707072] leading-tight">
                  Enter PIN code
                </h3>
                <p className="text-[13px] text-[#8d8d8d] mt-0.5">
                  Location will be auto-detected
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveDeliveryAddress} className="space-y-4">
            {/* Pincode */}
            <div>
              <div
                className={`relative w-full h-[54px] px-4 rounded-[10px] border transition-colors cursor-text bg-white flex items-center ${
                  addrErrors.pincode
                    ? 'border-[#e53935]'
                    : addrFocusedField === 'pincode'
                    ? 'border-[#111111]'
                    : 'border-[#8d8d8d]'
                }`}
              >
                <span
                  className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                    addrFocusedField === 'pincode' || addrPincode.length > 0
                      ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] font-normal leading-none z-10 ' + (addrErrors.pincode ? 'text-[#e53935]' : 'text-[#111111]')
                      : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                  }`}
                >
                  Pincode
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={addrPincode}
                  onChange={handlePincodeChange}
                  onFocus={() => {
                    setAddrFocusedField('pincode');
                    setIsPincodeFocused(true);
                  }}
                  onBlur={() => {
                    setAddrFocusedField(null);
                    setIsPincodeFocused(false);
                    if (!addrPincode || addrPincode.length !== 6) {
                      setAddrErrors((prev) => ({ ...prev, pincode: true }));
                    }
                  }}
                  className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0 tracking-wide"
                />
              </div>

              {deliveryEtd ? (
                <div className="flex items-center gap-2 mt-2 px-1 text-[13px] text-[#111111]">
                  <span>
                    Expected delivery by <strong className="font-semibold text-[#111111]">{deliveryEtd}</strong>
                  </span>
                </div>
              ) : null}
            </div>

            {/* House / Flat / Office No */}
            <div>
              <div
                className={`relative w-full h-[54px] px-4 rounded-[10px] border transition-colors cursor-text bg-white flex items-center ${
                  addrErrors.houseNo
                    ? 'border-[#e53935]'
                    : addrFocusedField === 'houseNo'
                    ? 'border-[#111111]'
                    : 'border-[#8d8d8d]'
                }`}
              >
                <span
                  className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                    addrFocusedField === 'houseNo' || addrHouseNo.length > 0
                      ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] font-normal leading-none z-10 ' + (addrErrors.houseNo ? 'text-[#e53935]' : 'text-[#111111]')
                      : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                  }`}
                >
                  House/ Flat/ Office No.
                </span>
                <input
                  type="text"
                  value={addrHouseNo}
                  onChange={(e) => {
                    setAddrHouseNo(e.target.value);
                    if (e.target.value.trim()) setAddrErrors((prev) => ({ ...prev, houseNo: false }));
                  }}
                  onFocus={() => setAddrFocusedField('houseNo')}
                  onBlur={() => setAddrFocusedField(null)}
                  className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0"
                />
              </div>
              {addrErrors.houseNo && (
                <p className="text-[13px] text-[#e53935] mt-1.5 px-1">
                  House/ Flat/ Office No. is required
                </p>
              )}
            </div>

            {/* Road Name / Area / Colony */}
            <div>
              <div
                className={`relative w-full rounded-[10px] border transition-colors cursor-text bg-white p-3.5 ${
                  addrErrors.roadArea
                    ? 'border-[#e53935]'
                    : addrFocusedField === 'roadArea'
                    ? 'border-[#111111]'
                    : 'border-[#8d8d8d]'
                }`}
              >
                <textarea
                  rows={2}
                  value={addrRoadArea}
                  onChange={(e) => {
                    setAddrRoadArea(e.target.value);
                    if (e.target.value.trim()) setAddrErrors((prev) => ({ ...prev, roadArea: false }));
                  }}
                  onFocus={() => setAddrFocusedField('roadArea')}
                  onBlur={() => setAddrFocusedField(null)}
                  placeholder="Road Name/ Area /Colony"
                  className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] placeholder-[#707072] font-normal outline-none resize-none leading-relaxed"
                />
              </div>
              {addrErrors.roadArea && (
                <p className="text-[13px] text-[#e53935] mt-1.5 px-1">
                  Road Name/ Area /Colony is required
                </p>
              )}
            </div>

            {/* Name */}
            <div
              className={`relative w-full h-[54px] px-4 rounded-[10px] border transition-colors cursor-text bg-white flex items-center ${
                addrFocusedField === 'name' ? 'border-[#111111]' : 'border-[#8d8d8d]'
              }`}
            >
              <span className="absolute -top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10 select-none">
                Name
              </span>
              <input
                type="text"
                value={addrName}
                onChange={(e) => setAddrName(e.target.value)}
                onFocus={() => setAddrFocusedField('name')}
                onBlur={() => setAddrFocusedField(null)}
                placeholder="Full Name"
                className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0"
              />
            </div>

            {/* Mobile Number */}
            <div
              className={`relative w-full h-[54px] px-4 rounded-[10px] border transition-colors cursor-text bg-white flex items-center ${
                addrFocusedField === 'mobile' ? 'border-[#111111]' : 'border-[#8d8d8d]'
              }`}
            >
              <span className="absolute -top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10 select-none">
                Mobile Number
              </span>
              <input
                type="tel"
                value={addrMobile}
                onChange={(e) => setAddrMobile(e.target.value)}
                onFocus={() => setAddrFocusedField('mobile')}
                onBlur={() => setAddrFocusedField(null)}
                placeholder="10-digit mobile number"
                className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0"
              />
            </div>

            {/* Save Address Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 rounded-full text-[16px] font-medium bg-[#111111] hover:bg-black text-white cursor-pointer active:scale-[0.99] transition-all shadow-sm font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Save Address & Proceed
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Reusable Select Size Drawer (matching product detail page exact design)
  function renderChangeSizeDrawer() {
    if (!isSizeModalMounted) return null;
    const prod = sizeModalItem ? getProductForCartItem(sizeModalItem) : null;
    const availableSizes = sizeModalItem ? getAvailableSizesForItem(sizeModalItem) : [];

    return (
      <div className="fixed inset-0 z-[200] overflow-hidden select-none font-['Helvetica_Now_Text',sans-serif]">
        {/* Blacked-out backdrop overlay */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
            isSizeBackdropVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleCloseChangeSize}
        />

        {/* Drawer Sheet */}
        <div
          className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[540px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-[210] p-6 sm:p-7 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSizeModalVisible
              ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
              : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95 sm:opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
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
                onClick={handleCloseChangeSize}
                className="w-9 h-9 rounded-full hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Product Summary */}
            {sizeModalItem && (
              <div className="mt-4 flex items-center gap-3.5 pb-4 border-b border-neutral-100">
                <div className="w-[64px] h-[64px] rounded-lg bg-[#f5f5f5] flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={sizeModalItem.image}
                    alt={sizeModalItem.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                <div>
                  <h3
                    className="text-[16px] font-medium text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {sizeModalItem.name}
                  </h3>
                  <p className="text-[14px] text-[#707072] mt-0.5">
                    ₹ {(sizeModalItem.priceNumber || sizeModalItem.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            {/* Size Grid Options */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] text-[#707072]">Choose your size</span>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseChangeSize();
                    setTimeout(() => handleOpenSizeGuide(), 320);
                  }}
                  className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {availableSizes.map((sz) => {
                  const isCurrent = sizeModalItem?.size === sz;
                  const hasStock = prod
                    ? (prod.inStock !== false && (prod.sizeStock && typeof prod.sizeStock === 'object' && sz in prod.sizeStock ? Number(prod.sizeStock[sz] || 0) > 0 : true))
                    : true;

                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={!hasStock}
                      onClick={() => {
                        if (!hasStock) return;
                        handleSelectNewSize(sz);
                      }}
                      className={`py-3 rounded-[8px] text-[15px] font-medium transition-all ${
                        !hasStock
                          ? 'border border-neutral-200 text-neutral-300 line-through cursor-not-allowed bg-neutral-50 select-none'
                          : isCurrent
                          ? 'border-2 border-[#111111] bg-[#111111] text-white shadow-xs cursor-pointer'
                          : 'border border-neutral-300 hover:border-[#111111] hover:bg-neutral-50 bg-white text-[#111111] cursor-pointer active:scale-95'
                      }`}
                    >
                      {getDisplaySize(sz, sizeModalItem?.sizeDisplayType || prod?.sizeDisplayType)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Size Guide Modal matching product detail page
  function renderSizeGuideModal() {
    if (!isSizeGuideMounted) return null;

    return (
      <div className="fixed inset-0 z-[220] overflow-hidden select-none font-['Helvetica_Now_Text',sans-serif]">
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
            isSizeGuideVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleCloseSizeGuide}
        />

        <div
          className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[560px] max-h-[90vh] sm:max-h-[85vh] bg-white rounded-t-[22px] sm:rounded-[20px] shadow-2xl z-[230] px-5 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isSizeGuideVisible
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
              <p className="text-[13px] text-[#707072] mt-0.5">
                {sizeModalItem?.name || 'Apparel'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseSizeGuide}
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
                  sizeGuideUnit === 'in' ? 'left-0.5' : 'left-[44px]'
                }`}
              />
              <button
                type="button"
                onClick={() => setSizeGuideUnit('in')}
                className={`relative z-10 w-[42px] h-[28px] flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer ${
                  sizeGuideUnit === 'in' ? 'text-[#111111]' : 'text-[#707072]'
                }`}
              >
                in
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideUnit('cm')}
                className={`relative z-10 w-[42px] h-[28px] flex items-center justify-center text-[13px] font-medium transition-colors cursor-pointer ${
                  sizeGuideUnit === 'cm' ? 'text-[#111111]' : 'text-[#707072]'
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
                      {sizeGuideUnit === 'in' ? `${row.inLength} in` : `${row.cmLength} cm`}
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
    );
  }
}
