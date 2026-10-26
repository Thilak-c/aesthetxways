'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LoginModal({ isOpen, onClose, initialStep = 'mobile' }) {
  // Step: 'mobile' | 'otp' | 'details' | 'email-otp' | 'success' | 'delivery-address'
  const [step, setStep] = useState(initialStep);

  // Verification Settings controlled from Admin Panel
  const [authSettings, setAuthSettings] = useState({
    enableNumberVerification: false,
    enableEmailVerification: false,
    loaded: false,
  });

  // Step 1: Mobile
  const [mobileNumber, setMobileNumber] = useState('');
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const mobileInputRef = useRef(null);

  // Step 2: Mobile OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [otpVerifyState, setOtpVerifyState] = useState('idle'); // 'idle' | 'verified'

  // Step 3: Details ("Almost there!") - 100% VH full-screen overlay
  const [detailsSlideIn, setDetailsSlideIn] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preference, setPreference] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(true);

  // Email verification state
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sentEmailCode, setSentEmailCode] = useState('');
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [emailTimer, setEmailTimer] = useState(30);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  // Step 5 Welcome & Step 6 Delivery Address Transition States
  const [isWelcomeFadingOut, setIsWelcomeFadingOut] = useState(false);
  const [isDeliveryAddressVisible, setIsDeliveryAddressVisible] = useState(false);
  const [addressSlideIn, setAddressSlideIn] = useState(false);

  // Address Form States matching User's Exact Design
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

  // Focused state for each field in Step 3
  const [focusedField, setFocusedField] = useState(null);
  const [isPrefDropdownOpen, setIsPrefDropdownOpen] = useState(false);
  const prefContainerRef = useRef(null);
  const firstNameInputRef = useRef(null);

  // Modal mount/visibility animation
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closeTimerRef = useRef(null);

  // Manage mount/unmount and smooth animation with dynamic settings
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current);
      // Pre-fill existing user info if available in localStorage
      try {
        const storedMobile = (localStorage.getItem('aw_user_mobile') || localStorage.getItem('sonu_user_mobile')) || '';
        const storedName = (localStorage.getItem('aw_user_name') || localStorage.getItem('sonu_user_name')) || '';
        const storedEmail = (localStorage.getItem('aw_user_email') || localStorage.getItem('sonu_user_email')) || '';
        if (storedMobile) setMobileNumber(storedMobile);
        if (storedEmail) setEmail(storedEmail);
        if (storedName) {
          const parts = storedName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
      } catch (e) {}

      const applyStep = () => {
        if (initialStep === 'delivery-address') {
          setStep('delivery-address');
          setIsDeliveryAddressVisible(true);
          setAddressSlideIn(true);
          try {
            const stored = (localStorage.getItem('aw_shipping_address') || localStorage.getItem('sonu_shipping_address'));
            if (stored) {
              const parsed = JSON.parse(stored);
              setAddrPincode(parsed.pincode || '');
              setAddrHouseNo(parsed.houseNo || '');
              setAddrRoadArea(parsed.roadArea || parsed.street || '');
              setAddrName(parsed.name || '');
              setAddrMobile(parsed.mobile || '');
              setDetectedCity(parsed.city || '');
              setDetectedState(parsed.state || '');
              setDeliveryEtd(parsed.deliveryEtd || '');
              setPincodeServiceable(true);
            }
          } catch (e) {}
        } else {
          // Always ask for the phone number first
          setStep('mobile');
        }
        setIsMounted(true);
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      };

      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          const numVer = data?.enableNumberVerification === true;
          const emailVer = data?.enableEmailVerification === true;
          setAuthSettings({
            enableNumberVerification: numVer,
            enableEmailVerification: emailVer,
            loaded: true,
          });
          applyStep();
        })
        .catch(() => {
          applyStep();
        });
    } else {
      setIsVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setIsMounted(false);
        setStep('mobile');
        setOtp(['', '', '', '', '', '']);
        setOtpVerifyState('idle');
        setDetailsSlideIn(false);
        setFocusedField(null);
        setIsPrefDropdownOpen(false);
        setIsSendingEmail(false);
        setEmailError('');
        setSentEmailCode('');
        setEmailOtp(['', '', '', '', '', '']);
        setEmailOtpError('');
        setEmailSentNotice(false);
        setIsWelcomeFadingOut(false);
        setIsDeliveryAddressVisible(false);
        setAddressSlideIn(false);
        setAddrPincode('');
        setIsPincodeFocused(false);
        setIsPincodeLoading(false);
        setDetectedCity('');
        setDetectedState('');
        setPincodeServiceable(null);
        setDeliveryEtd('');
        setAddrHouseNo('');
        setAddrRoadArea('');
        setAddrName('');
        setAddrMobile('');
        setAddrFocusedField(null);
        setAddrErrors({ houseNo: false, roadArea: false, pincode: false });
      }, 300);
    }

    return () => clearTimeout(closeTimerRef.current);
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key listener & click outside dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isPrefDropdownOpen) {
          setIsPrefDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e) => {
      if (prefContainerRef.current && !prefContainerRef.current.contains(e.target)) {
        setIsPrefDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isPrefDropdownOpen, onClose]);

  // Timer countdown when on Mobile OTP step
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Timer countdown when on Email OTP step
  useEffect(() => {
    let interval = null;
    if (step === 'email-otp' && emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => {
          if (prev <= 1) {
            setEmailSentNotice(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, emailTimer]);

  // Automatically open keyboard when "Almost there" or "Verify your email" opens
  useEffect(() => {
    if (step === 'details') {
      const timer = setTimeout(() => {
        firstNameInputRef.current?.focus();
        setFocusedField('firstName');
      }, 200);
      return () => clearTimeout(timer);
    }

    if (step === 'email-otp') {
      const timer = setTimeout(() => {
        const firstInput = document.getElementById('email-otp-input-0');
        firstInput?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!isMounted) return null;

  // Validation
  const isMobileValid = mobileNumber.length === 10;
  const isOtpValid = otp.join('').length === 6;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isDetailsValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    preference.length > 0 &&
    dob.length === 10 &&
    isEmailValid &&
    agreed;
  const isEmailOtpValid = emailOtp.join('').length === 6;
  const isAddrValid =
    addrHouseNo.trim().length > 0 &&
    addrRoadArea.trim().length > 0 &&
    addrPincode.replace(/\D/g, '').length === 6;

  // Handlers
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
  };

  const handleMobileSubmit = async (e) => {
    e?.preventDefault();
    if (!isMobileValid || isCheckingUser) return;

    if (authSettings.enableNumberVerification) {
      setStep('otp');
      setTimer(30);
      return;
    }

    // Number verification disabled by Admin:
    // Look up customer in MongoDB database using phone number as unique identifier
    setIsCheckingUser(true);
    try {
      const res = await fetch(`/api/user/sync?mobile=${mobileNumber.trim()}`);
      const data = await res.json();

      if (data.success && data.user) {
        const user = data.user;
        const hasAddress = Boolean(
          user.primaryAddress &&
          user.primaryAddress.houseNo &&
          user.primaryAddress.pincode
        );
        const hasDetails = Boolean(
          (user.name || user.firstName) && user.email
        );

        // Pre-populate state
        if (user.firstName) setFirstName(user.firstName);
        if (user.lastName) setLastName(user.lastName);
        if (user.name && !user.firstName) {
          const parts = user.name.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        if (user.email) setEmail(user.email);
        if (user.preference) setPreference(user.preference);
        if (user.dob) setDob(user.dob);

        // If user already has full data (personal info + address):
        // Auto-load it and open Select Address page directly!
        if (hasAddress) {
          const addr = user.primaryAddress;
          setAddrPincode(addr.pincode || '');
          setAddrHouseNo(addr.houseNo || '');
          setAddrRoadArea(addr.street || addr.roadArea || '');
          setDetectedCity(addr.city || '');
          setDetectedState(addr.state || '');
          setPincodeServiceable(true);
          const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';
          setAddrName(fullName);
          setAddrMobile(mobileNumber.trim());

          const shippingAddress = {
            firstName: user.firstName || fullName.split(' ')[0] || 'Valued',
            lastName: user.lastName || fullName.split(' ').slice(1).join(' ') || 'Customer',
            name: fullName,
            mobile: mobileNumber.trim(),
            houseNo: addr.houseNo || '',
            street: addr.street || addr.roadArea || '',
            roadArea: addr.street || addr.roadArea || '',
            landmark: addr.landmark || '',
            addressLine1: `${addr.houseNo || ''}, ${addr.street || addr.roadArea || ''}`,
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            isPrimary: true,
          };

          // Save everything into localStorage for the active session
          localStorage.setItem('sonu_user_mobile', mobileNumber.trim());
          localStorage.setItem('sonu_user_name', fullName);
        localStorage.setItem('aw_user_name', fullName);
          localStorage.setItem('sonu_user_email', user.email || '');
        localStorage.setItem('aw_user_email', user.email || '');
          localStorage.setItem('sonu_shipping_address', JSON.stringify(shippingAddress));
          localStorage.setItem('sonu_user_profile', JSON.stringify(user));

          // Notify checkout page
          window.dispatchEvent(new Event('auth-changed'));
          window.dispatchEvent(new Event('address-updated'));

          // Close modal: customer lands directly on the Select Address & Pay page!
          setIsCheckingUser(false);
          onClose();
          return;
        }

        // If user has details but no address saved:
        if (hasDetails) {
          localStorage.setItem('sonu_user_mobile', mobileNumber.trim());
          localStorage.setItem('sonu_user_name', user.name || `${user.firstName} ${user.lastName}`.trim());
          localStorage.setItem('sonu_user_email', user.email || '');
        localStorage.setItem('aw_user_email', user.email || '');
          window.dispatchEvent(new Event('auth-changed'));

          handleTransitionToDeliveryAddress(100);
          setIsCheckingUser(false);
          return;
        }
      }

      // Customer does not have an entry (or incomplete data):
      // Open personal details page ("Almost there!")
      localStorage.setItem('sonu_user_mobile', mobileNumber.trim());
      setStep('details');
      setDetailsSlideIn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDetailsSlideIn(true);
        });
      });
      setTimeout(() => {
        firstNameInputRef.current?.focus();
        setFocusedField('firstName');
      }, 200);
    } catch (err) {
      console.error('Customer lookup error:', err);
      setStep('details');
      setDetailsSlideIn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDetailsSlideIn(true);
        });
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Verify mobile OTP: Shows green tick "Verified", checks database, then proceeds
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isOtpValid || otpVerifyState !== 'idle') return;

    setOtpVerifyState('verified');

    try {
      const res = await fetch(`/api/user/sync?mobile=${mobileNumber.trim()}`);
      const data = await res.json();

      if (data.success && data.user) {
        const user = data.user;
        const hasAddress = Boolean(
          user.primaryAddress &&
          user.primaryAddress.houseNo &&
          user.primaryAddress.pincode
        );
        const hasDetails = Boolean(
          (user.name || user.firstName) && user.email
        );

        if (user.firstName) setFirstName(user.firstName);
        if (user.lastName) setLastName(user.lastName);
        if (user.name && !user.firstName) {
          const parts = user.name.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        if (user.email) setEmail(user.email);
        if (user.preference) setPreference(user.preference);
        if (user.dob) setDob(user.dob);

        if (hasAddress) {
          const addr = user.primaryAddress;
          setAddrPincode(addr.pincode || '');
          setAddrHouseNo(addr.houseNo || '');
          setAddrRoadArea(addr.street || addr.roadArea || '');
          setDetectedCity(addr.city || '');
          setDetectedState(addr.state || '');
          setPincodeServiceable(true);
          const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';
          setAddrName(fullName);
          setAddrMobile(mobileNumber.trim());

          const shippingAddress = {
            firstName: user.firstName || fullName.split(' ')[0] || 'Valued',
            lastName: user.lastName || fullName.split(' ').slice(1).join(' ') || 'Customer',
            name: fullName,
            mobile: mobileNumber.trim(),
            houseNo: addr.houseNo || '',
            street: addr.street || addr.roadArea || '',
            roadArea: addr.street || addr.roadArea || '',
            landmark: addr.landmark || '',
            addressLine1: `${addr.houseNo || ''}, ${addr.street || addr.roadArea || ''}`,
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            isPrimary: true,
          };

          localStorage.setItem('sonu_user_mobile', mobileNumber.trim());
          localStorage.setItem('sonu_user_name', fullName);
        localStorage.setItem('aw_user_name', fullName);
          localStorage.setItem('sonu_user_email', user.email || '');
        localStorage.setItem('aw_user_email', user.email || '');
          localStorage.setItem('sonu_shipping_address', JSON.stringify(shippingAddress));
          localStorage.setItem('sonu_user_profile', JSON.stringify(user));

          window.dispatchEvent(new Event('auth-changed'));
          window.dispatchEvent(new Event('address-updated'));

          setTimeout(() => {
            setOtpVerifyState('idle');
            onClose();
          }, 350);
          return;
        }

        if (hasDetails) {
          localStorage.setItem('sonu_user_mobile', mobileNumber.trim());
          localStorage.setItem('sonu_user_name', user.name || `${user.firstName} ${user.lastName}`.trim());
          localStorage.setItem('sonu_user_email', user.email || '');
        localStorage.setItem('aw_user_email', user.email || '');
          window.dispatchEvent(new Event('auth-changed'));

          setTimeout(() => {
            setOtpVerifyState('idle');
            handleTransitionToDeliveryAddress(100);
          }, 350);
          return;
        }
      }

      // New user after OTP: open details
      setTimeout(() => {
        setStep('details');
        setDetailsSlideIn(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setDetailsSlideIn(true);
          });
        });
        setTimeout(() => {
          firstNameInputRef.current?.focus();
          setFocusedField('firstName');
        }, 200);
        setTimeout(() => {
          setOtpVerifyState('idle');
        }, 500);
      }, 400);
    } catch (err) {
      setTimeout(() => {
        setStep('details');
        setDetailsSlideIn(true);
        setOtpVerifyState('idle');
      }, 400);
    }
  };

  const handleDobChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    setDob(formatted);
  };

  // Triggered when user submits the "Almost there!" details form
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!isDetailsValid || isSendingEmail) return;

    // If Email Verification is DISABLED by Admin: Skip email OTP and jump directly to Delivery Address
    if (!authSettings.enableEmailVerification) {
      const userProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preference,
        dob,
        email: email.trim(),
        mobile: mobileNumber,
        isEmailVerified: false,
      };

      try {
        localStorage.setItem('sonu_user_mobile', mobileNumber);
        localStorage.setItem('aw_user_mobile', mobileNumber);
        localStorage.setItem('sonu_user_name', `${userProfile.firstName} ${userProfile.lastName}`.trim());
        localStorage.setItem('aw_user_name', `${userProfile.firstName} ${userProfile.lastName}`.trim());
        localStorage.setItem('sonu_user_email', userProfile.email);
        localStorage.setItem('aw_user_email', userProfile.email);
        localStorage.setItem('sonu_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('aw_user_profile', JSON.stringify(userProfile));
        window.dispatchEvent(new Event('auth-changed'));

        // Sync user profile to MongoDB in background
        fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userProfile),
        }).catch((e) => console.error('[MongoDB] User profile sync error:', e));
      } catch (err) {}

      // Transition smoothly and directly to Delivery Address
      handleTransitionToDeliveryAddress(100);
      return;
    }

    // Otherwise, Email Verification is ENABLED: send email OTP
    setIsSendingEmail(true);
    setEmailError('');

    try {
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: firstName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      setSentEmailCode(data.code || '');
      setEmailOtp(['', '', '', '', '', '']);
      setEmailTimer(30);
      setEmailOtpError('');
      setStep('email-otp');

      setTimeout(() => {
        document.getElementById('email-otp-input-0')?.focus();
      }, 150);
    } catch (err) {
      setEmailError(err.message || 'Unable to send verification email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Resend email verification code - instantly displays "Sent"
  const handleResendEmailOtp = () => {
    if (emailTimer > 0) return;

    // 1. Instant optimistic feedback with 0ms delay
    setEmailSentNotice(true);
    setEmailTimer(30);
    setEmailOtpError('');

    // 2. Dispatch background request to send new code
    fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        name: firstName.trim(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.code) {
          setSentEmailCode(data.code);
        } else if (!data.success) {
          setEmailOtpError(data.error || 'Failed to resend code.');
        }
      })
      .catch(() => {
        setEmailOtpError('Failed to resend code. Please try again.');
      });
  };

  // Fetch delivery estimate from Shiprocket API
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
        setDetectedCity('');
        setDetectedState('');
        setDeliveryEtd('');
        setPincodeServiceable(false);
      }
    } catch (err) {
      console.error('Shiprocket serviceability error:', err);
      setDetectedCity('');
      setDetectedState('');
      setDeliveryEtd('');
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

  // Transition from "Welcome to Aesthetx Ways." or Details -> Slide up Delivery Address
  const handleTransitionToDeliveryAddress = (delay = 450) => {
    clearTimeout(closeTimerRef.current);
    // 1. Smoothly fade out the welcome message
    setIsWelcomeFadingOut(true);

    // 2. Mount Delivery Address and slide up with identical incoming animation
    setTimeout(() => {
      setIsDeliveryAddressVisible(true);
      setStep('delivery-address');
      setAddressSlideIn(false);

      // Autofill Name and Mobile from user profile or stored session
      const storedName = typeof window !== 'undefined' ? (localStorage.getItem('aw_user_name') || localStorage.getItem('sonu_user_name')) : '';
      const computedName = `${firstName} ${lastName}`.trim();
      setAddrName(computedName || storedName || '');

      const storedMobile = typeof window !== 'undefined' ? (localStorage.getItem('aw_user_mobile') || localStorage.getItem('sonu_user_mobile')) : '';
      setAddrMobile(mobileNumber || storedMobile || '');

      // Check Shiprocket ETD for default/entered pincode
      if (addrPincode.length === 6) {
        fetchShiprocketEtd(addrPincode);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAddressSlideIn(true);
        });
      });
    }, delay);
  };

  // Complete profile saving after email code verification (Dev mode: accepts any 6-digit OTP)
  const handleVerifyEmailOtp = (e, otpDigits = null) => {
    if (e) e.preventDefault();
    const entered = (otpDigits || emailOtp).join('');
    if (entered.length !== 6) return;

    // Dev mode: Any random 6-digit OTP verifies successfully

    const userProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preference,
      dob,
      email: email.trim(),
      mobile: mobileNumber,
      isEmailVerified: true,
    };

    try {
      localStorage.setItem('sonu_user_mobile', mobileNumber);
        localStorage.setItem('aw_user_mobile', mobileNumber);
      localStorage.setItem('sonu_user_name', `${userProfile.firstName} ${userProfile.lastName}`.trim());
      localStorage.setItem('sonu_user_email', userProfile.email);
        localStorage.setItem('aw_user_email', userProfile.email);
      localStorage.setItem('sonu_user_profile', JSON.stringify(userProfile));
      window.dispatchEvent(new Event('auth-changed'));

      // Sync user profile to MongoDB
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      }).catch((e) => console.error('[MongoDB] User profile sync error:', e));
    } catch (err) {
      // storage unavailable
    }

    setStep('success');
    setIsWelcomeFadingOut(false);

    // Smoothly fade out "Welcome to Aesthetx Ways." after 2s and slide up Delivery Address
    closeTimerRef.current = setTimeout(() => {
      handleTransitionToDeliveryAddress();
    }, 2000);
  };

  // Save Delivery Address and finalize onboarding
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

    const finalName = addrName.trim() || `${firstName} ${lastName}`.trim() || 'Valued Customer';
    const finalMobile = addrMobile.trim() || mobileNumber;

    const shippingAddress = {
      firstName: firstName.trim() || finalName.split(' ')[0] || 'Valued',
      lastName: lastName.trim() || finalName.split(' ').slice(1).join(' ') || 'Customer',
      name: finalName,
      mobile: finalMobile,
      email: email.trim(),
      pincode: addrPincode.trim(),
      city: detectedCity || '',
      state: detectedState || '',
      houseNo: addrHouseNo.trim(),
      street: addrRoadArea.trim(),
      roadArea: addrRoadArea.trim(),
      landmark: '',
      addressLine1: `${addrHouseNo.trim()}, ${addrRoadArea.trim()}`,
      deliveryEtd: deliveryEtd,
      isPrimary: true,
    };

    try {
      localStorage.setItem('sonu_shipping_address', JSON.stringify(shippingAddress));
      localStorage.setItem('aw_shipping_address', JSON.stringify(shippingAddress));
      localStorage.setItem('sonu_user_name', finalName);
      localStorage.setItem('aw_user_name', finalName);
      if (finalMobile) {
        localStorage.setItem('sonu_user_mobile', finalMobile);
        localStorage.setItem('aw_user_mobile', finalMobile);
      }
      window.dispatchEvent(new Event('auth-changed'));
      window.dispatchEvent(new Event('address-updated'));

      // Sync delivery address & full profile to MongoDB
      const storedEmail = typeof window !== 'undefined' ? (localStorage.getItem('aw_user_email') || localStorage.getItem('sonu_user_email')) || '' : '';
      let storedProfile = {};
      try {
        storedProfile = JSON.parse(localStorage.getItem('sonu_user_profile') || '{}');
      } catch (e) {}

      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim() || storedProfile.firstName || '',
          lastName: lastName.trim() || storedProfile.lastName || '',
          name: finalName,
          mobile: finalMobile,
          email: storedEmail,
          preference: preference || storedProfile.preference || '',
          dob: dob || storedProfile.dob || '',
          address: shippingAddress,
        }),
      }).catch((e) => console.error('[MongoDB] Address sync error:', e));
    } catch (err) {
      // storage unavailable
    }

    // Smoothly slide down before closing
    setAddressSlideIn(false);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const isMobileFloating = isMobileFocused || mobileNumber.length > 0;
  const isOnboardingFullScreen =
    step === 'details' ||
    step === 'email-otp' ||
    step === 'success' ||
    step === 'delivery-address';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none font-['Helvetica_Now_Text',sans-serif]">
      {/* Dark Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 1. INITIAL MODAL BOX (STEP 1: Mobile & STEP 2: Phone OTP) */}
      <div
        className={`relative w-full max-w-[440px] max-h-[92vh] overflow-x-hidden overflow-y-auto bg-white rounded-t-[28px] sm:rounded-[24px] px-6 sm:px-8 pt-7 pb-8 shadow-2xl z-10 transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-8 opacity-0 sm:scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Account verification and profile"
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer z-20"
          aria-label="Close modal"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            role="img"
            className="w-5 h-5"
            fill="none"
          >
            <path
              stroke="#111111"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.75 5.25L5.25 18.75m0-13.5l13.5 13.5"
            />
          </svg>
        </button>

        {/* STEP 1: MOBILE NUMBER */}
        {step === 'mobile' && (
          <div>
            {/* Centered Brand Logo */}
            <div className="flex items-center justify-center gap-2.5 pt-1 pb-1">
              <img
                src="/logo_t.svg"
                alt="Aesthetx Ways Logo"
                className="h-7 sm:h-8 w-auto object-contain"
                loading="eager"
                fetchPriority="high"
              />
              <span className="text-[17px] sm:text-[19px] font-black tracking-widest uppercase text-[#111111]" style={{ fontFamily: "var(--font-lovelo-black), 'Helvetica Now Text Medium', sans-serif" }}>
                AESTHETX WAYS
              </span>
            </div>

            {/* Header: Log in to your account */}
            <h2
              className="text-[22px] sm:text-[24px] font-bold text-[#111111] text-center mt-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Log in to your account
            </h2>

            {/* Subtitle */}
            <p className="text-[14px] sm:text-[15px] text-[#707072] text-center mt-1.5 leading-normal">
              Get personalised picks & faster checkout
            </p>

            {/* Input Form */}
            <form onSubmit={handleMobileSubmit} className="mt-6">
              {/* Rounded Rectangle Input Field with Notched Outline Floating Label */}
              <div
                onClick={() => mobileInputRef.current?.focus()}
                className={`relative w-full h-[54px] sm:h-[56px] px-4 rounded-[8px] border transition-colors cursor-text bg-white flex items-center ${
                  isMobileFloating ? 'border-[#111111]' : 'border-[#8d8d8d]'
                }`}
              >
                {/* Floating Notched Label */}
                <span
                  className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                    isMobileFloating
                      ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
                      : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                  }`}
                  style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                >
                  Enter 10-digit mobile no.
                </span>

                {/* Input row containing +91 and Enter mobile no. placeholder */}
                <div
                  className={`flex items-center w-full transition-opacity duration-150 ${
                    isMobileFloating ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <span
                    className="text-[15px] sm:text-[16px] text-[#111111] font-normal select-none pr-2 shrink-0"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  >
                    +91
                  </span>
                  <input
                    ref={mobileInputRef}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel-national"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    onFocus={() => setIsMobileFocused(true)}
                    onBlur={() => setIsMobileFocused(false)}
                    placeholder="Enter mobile no."
                    maxLength={10}
                    className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] placeholder-[#8d8d8d] font-normal outline-none p-0 tracking-normal"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  />
                </div>
              </div>

              {/* Continue / Get OTP Button */}
              <button
                type="submit"
                disabled={!isMobileValid || isCheckingUser}
                className={`w-full py-3.5 sm:py-4 rounded-full mt-5 text-[15px] sm:text-[16px] font-medium transition-all flex items-center justify-center gap-2 ${
                  isMobileValid && !isCheckingUser
                    ? 'bg-[#111111] hover:bg-black text-white cursor-pointer active:scale-[0.99] shadow-sm'
                    : 'bg-[#e5e5e5] text-[#707072] cursor-not-allowed'
                }`}
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {isCheckingUser ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Continuing...</span>
                  </>
                ) : authSettings.enableNumberVerification ? (
                  'Get OTP'
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            {/* Disclaimer & Policy Links */}
            <p 
              className="text-center text-[13px] sm:text-[14px] text-[#707072] mt-6 leading-relaxed max-w-[340px] mx-auto font-['Helvetica_Now_Text',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              By entering this site, you agree to the{' '}
              <Link
                href="/terms"
                onClick={onClose}
                className="underline font-medium text-[#000000] hover:text-neutral-700 transition-colors"
                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
              >
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                onClick={onClose}
                className="underline font-medium text-[#000000] hover:text-neutral-700 transition-colors"
                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        )}

        {/* STEP 2: MOBILE OTP VERIFICATION (Zero movement, stays in place) */}
        {(step === 'otp' || (isOnboardingFullScreen && authSettings.enableNumberVerification)) && (
          <div>
            {/* Centered Brand Logo */}
            <div className="flex items-center justify-center gap-2.5 pt-1 pb-1">
              <img
                src="/logo_t.svg"
                alt="Aesthetx Ways Logo"
                className="h-7 sm:h-8 w-auto object-contain"
                loading="eager"
                fetchPriority="high"
              />
              <span className="text-[17px] sm:text-[19px] font-black tracking-widest uppercase text-[#111111]" style={{ fontFamily: "var(--font-lovelo-black), 'Helvetica Now Text Medium', sans-serif" }}>
                AESTHETX WAYS
              </span>
            </div>

            <h2
              className="text-[22px] sm:text-[24px] font-bold text-[#111111] text-center mt-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Verify with OTP
            </h2>
            <p className="text-[14px] text-[#707072] text-center mt-1">
              Sent to +91 {mobileNumber}{' '}
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="text-[#111111] font-medium underline ml-1 cursor-pointer"
              >
                Edit
              </button>
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-6">
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const next = [...otp];
                      next[idx] = val;
                      setOtp(next);
                      if (val && idx < 5) {
                        document.getElementById(`otp-input-${idx + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                        document.getElementById(`otp-input-${idx - 1}`)?.focus();
                      }
                    }}
                    className="w-11 h-12 sm:w-12 sm:h-13 text-center border border-[#8d8d8d] focus:border-[#111111] rounded-lg text-[18px] font-bold outline-none"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={!isOtpValid || otpVerifyState !== 'idle'}
                className={`w-full py-3.5 sm:py-4 rounded-full mt-6 text-[15px] sm:text-[16px] font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-sm ${
                  otpVerifyState === 'verified'
                    ? 'bg-[#008a00] text-white scale-[1.01]'
                    : isOtpValid
                    ? 'bg-[#111111] hover:bg-black text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-[#e5e5e5] text-[#707072] cursor-not-allowed'
                }`}
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {otpVerifyState === 'verified' ? (
                  <>
                    <svg
                      className="w-5 h-5 text-white animate-scaleCheck"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Verified</span>
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <div className="text-center mt-4">
                {timer > 0 ? (
                  <p className="text-[13px] text-[#707072]">
                    Resend OTP in <span className="font-medium text-[#111111]">{timer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTimer(30)}
                    className="text-[13px] font-medium text-[#111111] underline cursor-pointer"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. 100% VH FULL-SCREEN OVERLAY FOR ONBOARDING (Almost There, Email OTP, Welcome, Delivery Address) */}
      {isOnboardingFullScreen && (
        <div
          className={`fixed inset-0 z-50 w-full h-[100dvh] bg-white overflow-y-auto px-6 sm:px-8 py-8 flex flex-col justify-start sm:justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            detailsSlideIn ? 'translate-y-0' : 'translate-y-full'
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Top-Right Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer z-30"
            aria-label="Close modal"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              role="img"
              className="w-5 h-5"
              fill="none"
            >
              <path
                stroke="#111111"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.75 5.25L5.25 18.75m0-13.5l13.5 13.5"
              />
            </svg>
          </button>

          <div className="w-full max-w-[440px] mx-auto my-auto py-2">
            {/* STEP 3: "Almost there!" DETAILS COLLECTION */}
            {step === 'details' && (
              <div>
                {/* Centered Brand Logo */}
                <div className="flex items-center justify-center gap-2.5 pt-1 pb-1">
                  <img
                    src="/logo_t.svg"
                    alt="Aesthetx Ways Logo"
                    className="h-7 sm:h-8 w-auto object-contain"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <span className="text-[17px] sm:text-[19px] font-black tracking-widest uppercase text-[#111111]" style={{ fontFamily: "var(--font-lovelo-black), 'Helvetica Now Text Medium', sans-serif" }}>
                    AESTHETX WAYS
                  </span>
                </div>

                {/* Header: Almost there! */}
                <h2
                  className="text-[22px] sm:text-[24px] font-bold text-[#111111] text-center mt-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Almost there!
                </h2>

                {/* Subtitle */}
                <p className="text-[14px] sm:text-[15px] text-[#707072] text-center mt-1.5 leading-normal max-w-[320px] mx-auto">
                  A few details will help us personalise your experience.
                </p>

                {/* Form Fields with Notched Outline Floating Label Animation */}
                <form onSubmit={handleSaveDetails} className="mt-6 space-y-3.5 sm:space-y-4">
                  {/* 1. First Name* */}
                  <div
                    className={`relative w-full h-[52px] sm:h-[54px] px-4 rounded-[8px] border transition-colors cursor-text bg-white flex items-center ${
                      focusedField === 'firstName' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                    }`}
                  >
                    <span
                      className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                        focusedField === 'firstName' || firstName.length > 0
                          ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
                          : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                      }`}
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      First Name*
                    </span>
                    <input
                      ref={firstNameInputRef}
                      autoFocus
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] font-normal outline-none p-0"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                  </div>

                  {/* 2. Last Name* */}
                  <div
                    className={`relative w-full h-[52px] sm:h-[54px] px-4 rounded-[8px] border transition-colors cursor-text bg-white flex items-center ${
                      focusedField === 'lastName' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                    }`}
                  >
                    <span
                      className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                        focusedField === 'lastName' || lastName.length > 0
                          ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
                          : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                      }`}
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      Last Name*
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] font-normal outline-none p-0"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                  </div>

                  {/* 3. Shopping Preference* (Dropdown with arrow) */}
                  <div ref={prefContainerRef} className="relative">
                    <div
                      onClick={() => setIsPrefDropdownOpen((prev) => !prev)}
                      className={`relative w-full h-[52px] sm:h-[54px] px-4 rounded-[8px] border transition-colors cursor-pointer bg-white flex items-center justify-between ${
                        isPrefDropdownOpen || focusedField === 'preference' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                      }`}
                    >
                      <span
                        className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                          preference.length > 0 || isPrefDropdownOpen
                            ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
                            : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                        }`}
                        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                      >
                        Shopping Preference*
                      </span>

                      {/* Display selected preference */}
                      <span
                        className={`text-[15px] sm:text-[16px] text-[#111111] font-normal ${
                          preference ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                      >
                        {preference}
                      </span>

                      {/* Solid Caret Arrow strictly matching Nike screenshot */}
                      <svg
                        className={`w-3.5 h-3.5 text-[#111111] transition-transform duration-200 shrink-0 ${
                          isPrefDropdownOpen ? 'rotate-180' : ''
                        }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    </div>

                    {/* Dropdown Options Menu */}
                    {isPrefDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-[10px] shadow-lg py-1.5 z-30">
                        {["Men's", "Women's", "Unisex / All"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setPreference(option);
                              setIsPrefDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-[14px] sm:text-[15px] transition-colors cursor-pointer ${
                              preference === option
                                ? 'bg-[#f5f5f5] text-[#111111] font-medium'
                                : 'text-[#222222] hover:bg-[#fafafa]'
                            }`}
                            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Date of Birth (DD-MM-YYYY)* with Calendar Icon */}
                  <div
                    className={`relative w-full h-[52px] sm:h-[54px] px-4 rounded-[8px] border transition-colors cursor-text bg-white flex items-center justify-between ${
                      focusedField === 'dob' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                    }`}
                  >
                    <span
                      className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                        focusedField === 'dob' || dob.length > 0
                          ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
                          : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                      }`}
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      Date of Birth (DD-MM-YYYY)*
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dob}
                      onChange={handleDobChange}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={focusedField === 'dob' ? 'DD-MM-YYYY' : ''}
                      maxLength={10}
                      className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] placeholder-[#c4c4c4] font-normal outline-none p-0"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                    {/* Calendar Icon matching Nike screenshot */}
                    <svg
                      className="w-5 h-5 text-[#707072] shrink-0 ml-2 pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>

                  {/* 5. Email Address* */}
                  <div
                    className={`relative w-full h-[52px] sm:h-[54px] px-4 rounded-[8px] border transition-colors cursor-text bg-white flex items-center ${
                      focusedField === 'email' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                    }`}
                  >
                    <span
                      className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
                        focusedField === 'email' || email.length > 0
                          ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
                          : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] text-[#707072]'
                      }`}
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      Email Address*
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] font-normal outline-none p-0"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                  </div>

                  {/* Checkbox: Terms & Privacy strictly matching screenshot */}
                  <div className="flex items-start gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAgreed((prev) => !prev)}
                      className={`w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                        agreed
                          ? 'bg-[#111111] text-white border border-[#111111]'
                          : 'bg-white border-2 border-[#8d8d8d]'
                      }`}
                      aria-label="Agree to terms and conditions"
                    >
                      {agreed && (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <p
                      className="text-[13px] sm:text-[14px] text-[#222222] leading-snug font-['Helvetica_Now_Text',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      By entering this site, you agree to the{' '}
                      <Link
                        href="/terms"
                        onClick={onClose}
                        className="underline font-bold text-[#111111] hover:text-black transition-colors"
                      >
                        Terms & Conditions
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy"
                        onClick={onClose}
                        className="underline font-bold text-[#111111] hover:text-black transition-colors"
                      >
                        Privacy Policy
                      </Link>
                    </p>
                  </div>

                  {/* Error message if email sending fails */}
                  {emailError && (
                    <p className="text-[13px] text-[#d32f2f] text-center mt-2 leading-tight">
                      {emailError}
                    </p>
                  )}

                  {/* Action Button: Verify Email or Continue */}
                  <button
                    type="submit"
                    disabled={!isDetailsValid || isSendingEmail}
                    className={`w-full py-3.5 sm:py-4 rounded-full mt-4 text-[15px] sm:text-[16px] font-medium transition-all flex items-center justify-center gap-2 ${
                      isDetailsValid && !isSendingEmail
                        ? 'bg-[#111111] hover:bg-black text-white cursor-pointer active:scale-[0.99] shadow-sm'
                        : 'bg-[#e5e5e5] text-[#707072] cursor-not-allowed'
                    }`}
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {isSendingEmail ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Sending verification email...</span>
                      </>
                    ) : authSettings.enableEmailVerification ? (
                      'Verify Email'
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: EMAIL OTP VERIFICATION */}
            {step === 'email-otp' && (
              <div>
                {/* Centered Brand Logo */}
                <div className="flex items-center justify-center gap-2.5 pt-1 pb-1">
                  <img
                    src="/logo_t.svg"
                    alt="Aesthetx Ways Logo"
                    className="h-7 sm:h-8 w-auto object-contain"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <span className="text-[17px] sm:text-[19px] font-black tracking-widest uppercase text-[#111111]" style={{ fontFamily: "var(--font-lovelo-black), 'Helvetica Now Text Medium', sans-serif" }}>
                    AESTHETX WAYS
                  </span>
                </div>

                <h2
                  className="text-[22px] sm:text-[24px] font-bold text-[#111111] text-center mt-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Verify your email
                </h2>
                <p className="text-[14px] text-[#707072] text-center mt-1 leading-normal max-w-[340px] mx-auto">
                  Sent to <strong className="text-[#111111]">{email}</strong>{' '}
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-[#111111] font-medium underline ml-1 cursor-pointer"
                  >
                    Edit
                  </button>
                </p>

                <form onSubmit={handleVerifyEmailOtp} className="mt-6">
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {emailOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`email-otp-input-${idx}`}
                        autoFocus={idx === 0}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(-1);
                          const next = [...emailOtp];
                          next[idx] = val;
                          setEmailOtp(next);
                          setEmailOtpError('');
                          if (val && idx < 5) {
                            document.getElementById(`email-otp-input-${idx + 1}`)?.focus();
                          }
                          if (val && idx === 5 && next.every((d) => d !== '')) {
                            handleVerifyEmailOtp(null, next);
                          }
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                          if (pasted) {
                            e.preventDefault();
                            const next = [...emailOtp];
                            for (let i = 0; i < 6; i++) {
                              next[i] = pasted[i] || '';
                            }
                            setEmailOtp(next);
                            setEmailOtpError('');
                            const lastIdx = Math.min(pasted.length - 1, 5);
                            document.getElementById(`email-otp-input-${Math.min(lastIdx + 1, 5)}`)?.focus();
                            if (pasted.length === 6) {
                              handleVerifyEmailOtp(null, next);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !emailOtp[idx] && idx > 0) {
                            document.getElementById(`email-otp-input-${idx - 1}`)?.focus();
                          }
                        }}
                        className="w-11 h-12 sm:w-12 sm:h-13 text-center border border-[#8d8d8d] focus:border-[#111111] rounded-lg text-[18px] font-bold outline-none"
                      />
                    ))}
                  </div>

                  {emailOtpError && (
                    <p className="text-[13px] text-[#d32f2f] text-center mt-3">
                      {emailOtpError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!isEmailOtpValid}
                    className={`w-full py-3.5 sm:py-4 rounded-full mt-6 text-[15px] sm:text-[16px] font-medium transition-all ${
                      isEmailOtpValid
                        ? 'bg-[#111111] hover:bg-black text-white cursor-pointer shadow-sm active:scale-[0.99]'
                        : 'bg-[#e5e5e5] text-[#707072] cursor-not-allowed'
                    }`}
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Verify & Complete
                  </button>

                  <div className="text-center mt-4">
                    {emailSentNotice ? (
                      <div className="space-y-1">
                        <p className="text-[13px] text-[#008a00] font-medium flex items-center justify-center gap-1.5">
                          <svg
                            className="w-4 h-4 text-[#008a00]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Sent</span>
                        </p>
                        {emailTimer > 0 && (
                          <p className="text-[12px] text-[#707072]">
                            Resend code in <span className="font-medium text-[#111111]">{emailTimer}s</span>
                          </p>
                        )}
                      </div>
                    ) : emailTimer > 0 ? (
                      <p className="text-[13px] text-[#707072]">
                        Resend code in <span className="font-medium text-[#111111]">{emailTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendEmailOtp}
                        className="text-[13px] font-medium text-[#111111] underline cursor-pointer"
                      >
                        Resend verification code
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* STEP 5: SUCCESS STATE ("Welcome to Aesthetx Ways.") */}
            {step === 'success' && (
              <div
                className={`transition-opacity duration-500 ease-out ${
                  isWelcomeFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                {/* Centered Brand Logo at top */}
                <div className="flex items-center justify-center gap-2.5 pt-1 pb-1">
                  <img
                    src="/logo_t.svg"
                    alt="Aesthetx Ways Logo"
                    className="h-7 sm:h-8 w-auto object-contain"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <span className="text-[17px] sm:text-[19px] font-black tracking-widest uppercase text-[#111111]" style={{ fontFamily: "var(--font-lovelo-black), 'Helvetica Now Text Medium', sans-serif" }}>
                    AESTHETX WAYS
                  </span>
                </div>

                {/* Header: Welcome to Aesthetx Ways. */}
                <h2
                  className="text-[22px] sm:text-[24px] font-bold text-[#111111] text-center mt-3 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Welcome to Aesthetx Ways.
                </h2>

                {/* Subtitle */}
                <p className="text-[14px] sm:text-[15px] text-[#707072] text-center mt-1.5 leading-normal">
                  Your email has been verified. Welcome aboard{firstName ? `, ${firstName}` : ''}!
                </p>

                {/* Continue action smoothly triggers transition to Delivery Address */}
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={handleTransitionToDeliveryAddress}
                    className="w-full py-3.5 sm:py-4 rounded-full text-[15px] sm:text-[16px] font-medium bg-[#111111] hover:bg-black text-white cursor-pointer shadow-sm active:scale-[0.99] transition-all font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STEP 6: DELIVERY ADDRESS FULL-SCREEN SHEET (Matching User Screenshot Strictly) */}
      {(step === 'delivery-address' || isDeliveryAddressVisible) && (
        <div
          className={`fixed inset-0 z-[60] w-full h-[100dvh] bg-white overflow-y-auto px-5 sm:px-8 py-6 flex flex-col justify-start transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            addressSlideIn ? 'translate-y-0' : 'translate-y-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Add New Address"
        >
          <div className="w-full max-w-[440px] mx-auto flex-1 flex flex-col justify-between">
            {/* Top Content Block */}
            <div>
              {/* Header: Left Arrow & Title */}
              <div className="flex items-center gap-3 pb-5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddressSlideIn(false);
                    setTimeout(() => {
                      onClose();
                    }, 400);
                  }}
                  className="p-1 -ml-1 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
                  aria-label="Back"
                >
                  <svg
                    className="w-5 h-5 text-[#111111]"
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
                <h2
                  className="text-[19px] sm:text-[20px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Add New Address
                </h2>
              </div>

              {/* Location Card: Auto-detected or Skeleton Animation */}
              <div className="bg-[#f5f5f5] rounded-[12px] p-4 mb-4 transition-all">
                {isPincodeLoading || (isPincodeFocused && addrPincode.length > 0 && addrPincode.length < 6) ? (
                  <div className="animate-pulse space-y-2 py-0.5">
                    <div className="h-5 bg-[#e2e2e5] rounded w-36" />
                    <div className="h-3.5 bg-[#e2e2e5] rounded w-48" />
                  </div>
                ) : detectedCity ? (
                  <div>
                    <h3
                      className="text-[16px] sm:text-[17px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {detectedCity}{detectedState ? `, ${detectedState}` : ''}
                    </h3>
                    <p className="text-[13px] text-[#707072] mt-0.5 font-['Helvetica_Now_Text',sans-serif]">
                      Location auto-detected
                    </p>
                  </div>
                ) : pincodeServiceable === false ? (
                  <div>
                    <h3
                      className="text-[16px] sm:text-[17px] font-bold text-[#e53935] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      Delivery Not Available
                    </h3>
                    <p className="text-[13px] text-[#707072] mt-0.5 font-['Helvetica_Now_Text',sans-serif]">
                      {addrPincode ? `PIN code ${addrPincode} is not serviceable` : 'Invalid PIN code'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3
                      className="text-[16px] sm:text-[17px] font-bold text-[#707072] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      Enter PIN code
                    </h3>
                    <p className="text-[13px] text-[#8d8d8d] mt-0.5 font-['Helvetica_Now_Text',sans-serif]">
                      Location will be auto-detected
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveDeliveryAddress} className="space-y-4">
                {/* 1. Pincode Input */}
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
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
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
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                  </div>

                  {/* Shiprocket Delivery Expected Date */}
                
                </div>

                {/* 2. House/ Flat/ Office No. */}
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
                          : 'top-1/2 -translate-y-1/2 left-4 text-[15px] sm:text-[16px] ' + (addrErrors.houseNo ? 'text-[#e53935]' : 'text-[#707072]')
                      }`}
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      House/ Flat/ Office No.
                    </span>
                    <input
                      type="text"
                      value={addrHouseNo}
                      onChange={(e) => {
                        setAddrHouseNo(e.target.value);
                        if (e.target.value.trim()) {
                          setAddrErrors((prev) => ({ ...prev, houseNo: false }));
                        }
                      }}
                      onFocus={() => setAddrFocusedField('houseNo')}
                      onBlur={() => {
                        setAddrFocusedField(null);
                        if (!addrHouseNo.trim()) {
                          setAddrErrors((prev) => ({ ...prev, houseNo: true }));
                        }
                      }}
                      className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                  </div>
                  {addrErrors.houseNo && (
                    <p className="text-[13px] text-[#e53935] mt-1.5 px-1 font-['Helvetica_Now_Text',sans-serif]">
                      House/ Flat/ Office No. is required
                    </p>
                  )}
                </div>

                {/* 3. Road Name/ Area /Colony */}
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
                      rows={3}
                      value={addrRoadArea}
                      onChange={(e) => {
                        setAddrRoadArea(e.target.value);
                        if (e.target.value.trim()) {
                          setAddrErrors((prev) => ({ ...prev, roadArea: false }));
                        }
                      }}
                      onFocus={() => setAddrFocusedField('roadArea')}
                      onBlur={() => {
                        setAddrFocusedField(null);
                        if (!addrRoadArea.trim()) {
                          setAddrErrors((prev) => ({ ...prev, roadArea: true }));
                        }
                      }}
                      placeholder="Road Name/ Area /Colony"
                      className="w-full bg-transparent text-[15px] sm:text-[16px] text-[#111111] placeholder-[#707072] font-normal outline-none resize-none leading-relaxed"
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    />
                  </div>
                  {addrErrors.roadArea && (
                    <p className="text-[13px] text-[#e53935] mt-1.5 px-1 font-['Helvetica_Now_Text',sans-serif]">
                      Road Name/ Area /Colony is required
                    </p>
                  )}
                </div>

                {/* Primary Address Note & Divider */}
                <div className="pt-1">
                  <p className="text-[13.5px] text-[#707072] leading-normal font-['Helvetica_Now_Text',sans-serif]">
                    This will be saved as your primary address.
                  </p>
                  <div className="border-b border-[#e5e5e5] my-4" />
                </div>

                {/* 4. Name (Autofilled) */}
                <div
                  className={`relative w-full h-[54px] px-4 rounded-[10px] border transition-colors cursor-text bg-white flex items-center ${
                    addrFocusedField === 'name' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                  }`}
                >
                  <span
                    className="absolute -top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10 select-none"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  >
                    Name
                  </span>
                  <input
                    type="text"
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    onFocus={() => setAddrFocusedField('name')}
                    onBlur={() => setAddrFocusedField(null)}
                    placeholder="Name"
                    className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  />
                </div>

                {/* 5. Mobile Number (Autofilled) */}
                <div
                  className={`relative w-full h-[54px] px-4 rounded-[10px] border transition-colors cursor-text bg-white flex items-center ${
                    addrFocusedField === 'mobile' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                  }`}
                >
                  <span
                    className="absolute -top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10 select-none"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  >
                    Mobile Number
                  </span>
                  <input
                    type="tel"
                    value={addrMobile}
                    onChange={(e) => setAddrMobile(e.target.value)}
                    onFocus={() => setAddrFocusedField('mobile')}
                    onBlur={() => setAddrFocusedField(null)}
                    placeholder="Mobile Number"
                    className="w-full bg-transparent text-[16px] text-[#111111] font-normal outline-none p-0"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  />
                </div>

                {/* Save Address & Pay Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-full text-[16px] font-medium bg-[#111111] hover:bg-black text-white cursor-pointer active:scale-[0.99] transition-all shadow-sm font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Save Address & Pay
                  </button>
                </div>
              </form>
            </div>

            {/* Footer: powered by Flowify Agency */}
            <div className="text-center pt-5 pb-3">
              <p
                className="text-[12px] text-[#8d8d8d] tracking-wide font-normal font-['Helvetica_Now_Text',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
              >
                powered by Flowify Agency
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
