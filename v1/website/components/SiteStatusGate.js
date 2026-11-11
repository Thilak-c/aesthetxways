'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SiteStatusGate({ children }) {
  const pathname = usePathname();
  const [siteStatus, setSiteStatus] = useState('open');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [bypassed, setBypassed] = useState(false);
  const [bypassChecked, setBypassChecked] = useState(false);

  // Check bypass key on client mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('bypasskey');
    if (key === 'Narzo50pro@gmail.com') {
      sessionStorage.setItem('aw_bypass', 'true');
      setBypassed(true);
    } else if (sessionStorage.getItem('aw_bypass') === 'true') {
      setBypassed(true);
    }
    setBypassChecked(true);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/site-status');
      const data = await res.json();
      if (data.success) {
        setSiteStatus(data.status);
        setStatusMessage(data.message || '');
      }
    } catch (err) {
      console.error('Site status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show children while loading, if bypass active, if open, if on bill page, or if bypass hasn't been checked yet
  if (pathname?.startsWith('/bill') || loading || !bypassChecked || siteStatus === 'open' || bypassed) {
    return children;
  }

  const isClosed = siteStatus === 'closed';
  const isMaintenance = siteStatus === 'maintenance';

  return (
    <div className="absolute inset-0 z-[999] bg-white flex flex-col items-center justify-center text-center px-6 select-none">
      <div className="flex  gap-2 mb-6">
        <img
          src="/logo_t.svg"
          alt="Aesthetx Ways"
          className="w-6 h-6 object-contain opacity-80 filter grayscale"
        />
        <span className="font-lovelo-black mt-[10px] text-sm tracking-wider text-black leading-none pt-0.5">AESTHETX WAYS</span>
      </div>

      {/* Status Icon */}
      <div className="w-[200px] h-[200px] flex items-center justify-center mb-4">
        {isClosed ? (
          <img src="/status/closed.svg" alt="Closed" className="w-[170px] h-[170px] object-contain" />
        ) : (
          <img src="/status/main.svg" alt="Maintenance" className="w-[170px] h-[170px] object-contain" />
        )}
      </div>

      {/* Title */}
      <h1 className="text-[11px] tracking-[0.25em] uppercase font-bold text-black mb-2">
        {isClosed ? 'Store Closed' : 'Under Maintenance'}
      </h1>

      {/* Message */}
      <p className="text-[9px] text-zinc-400 max-w-[220px] leading-relaxed">
        {statusMessage || (
          isClosed
            ? "We're currently closed. Please check back later."
            : "We're making improvements. We'll be back shortly."
        )}
      </p>

      {/* Animated pulse dot */}
      <div className="mt-8 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          isClosed ? 'bg-red-400' : 'bg-yellow-400'
        }`} />
        <span className="text-[7px] tracking-[0.2em] uppercase text-zinc-400 font-medium">
          {isClosed ? 'Offline' : 'Working on it'}
        </span>
      </div>
    </div>
  );
}
