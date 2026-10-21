'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink, 
  Compass, 
  Star, 
  Share2, 
  Navigation,
  Check
} from 'lucide-react';
import Footer from '@/components/Footer';

const STORES = [
  {
    id: 'patna',
    name: 'AESTHETX WAYS ( PATNA )',
    type: 'Clothing store in Patna, Bihar',
    address: 'Kankarbagh Colony More, Kankarbagh, Ghrounda, Patna, Bihar 800001',
    phone: '070337 69997',
    rating: '4.8',
    reviewsCount: '18',
    coordinates: '25.5941° N, 85.1376° E',
    transitInfo: '17 mins travel time from Patna Junction',
    details: 'Located at Kankarbagh Colony More, near critical city transit nodes.',
    hours: [
      { day: 'Monday', time: '10:30 am – 10:30 pm' },
      { day: 'Tuesday', time: '10:30 am – 10:30 pm' },
      { day: 'Wednesday', time: '10:30 am – 10:30 pm' },
      { day: 'Thursday', time: '10:30 am – 10:30 pm' },
      { day: 'Friday', time: '10:30 am – 10:30 pm' },
      { day: 'Saturday', time: '10:30 am – 10:30 pm' },
      { day: 'Sunday', time: '10:30 am – 10:30 pm' }
    ],
    directionsUrl: 'https://maps.google.com/?q=AESTHETX+WAYS+Kankarbagh+Colony+More+Kankarbagh+Ghrounda+Patna+Bihar+800001'
  },
  {
    id: 'gaya',
    name: 'AESTHETX WAYS ( WAVES )',
    type: 'Clothing store in Gaya, Bihar',
    address: 'Located in: Gaya Railway station\nR232+WF4, Gaya Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002',
    phone: '070337 69997',
    rating: '4.7',
    reviewsCount: '50',
    coordinates: '24.7955° N, 84.9994° E',
    transitInfo: 'Located inside Gaya Railway Station Campus',
    details: 'Located in the Railway Station Campus block. Quick transit streetwear hub.',
    hours: [
      { day: 'Monday', time: '10:30 am – 10:30 pm' },
      { day: 'Tuesday', time: '10:30 am – 10:30 pm' },
      { day: 'Wednesday', time: '10:30 am – 10:30 pm' },
      { day: 'Thursday', time: '10:30 am – 10:30 pm' },
      { day: 'Friday', time: '10:30 am – 10:30 pm' },
      { day: 'Saturday', time: '10:30 am – 10:30 pm' },
      { day: 'Sunday', time: '10:30 am – 10:30 pm' }
    ],
    directionsUrl: 'https://maps.google.com/?q=Aesthetx+Ways+Gaya+Railway+station+Gaya+Station+Campus+Rd+Gol+Bagicha+Gaya+Bihar+823002'
  }
];

export default function StoresClient() {
  const router = useRouter();
  const [activeStoreId, setActiveStoreId] = useState('patna');
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [todayName, setTodayName] = useState('');
  const [copied, setCopied] = useState(false);

  const activeStore = STORES.find(s => s.id === activeStoreId) || STORES[0];

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const totalMinutes = currentHour * 60 + currentMinute;
      
      const openTime = 10 * 60 + 30;  // 10:30 AM
      const closeTime = 22 * 60 + 30; // 10:30 PM
      
      setIsOpenNow(totalMinutes >= openTime && totalMinutes < closeTime);
      setTodayName(now.toLocaleDateString('en-US', { weekday: 'long' }));
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Set dynamic browser tab title (fallback for client side router updates)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "Aesthetx Ways | Stores";
    }
  }, []);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${activeStore.name} - ${activeStore.address}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white relative pb-20 min-h-[90vh]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-zinc-950 hover:text-black p-1">
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
        <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-zinc-400">Retail Grid</span>
        <div className="w-6 h-6"></div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="font-lovelo-black text-xl tracking-widest text-zinc-900 leading-none">
            AesthetXways Stores
          </h1>
          <p className="text-[8px] tracking-[0.2em] uppercase text-zinc-400 font-semibold mt-2.5 max-w-[300px] leading-relaxed">
            VISIT OUR PHYSICAL STORES AND EXPERIENCE THE STREETWEAR DROP-CENTER FIRSTHAND.
          </p>
        </div>

        {/* Store Tabs Switcher */}
        <div className="flex bg-zinc-100 p-0.5 rounded-[3px] border border-zinc-200/40 shadow-inner w-full mb-6">
          {STORES.map((store) => (
            <button
              key={store.id}
              onClick={() => setActiveStoreId(store.id)}
              className={`flex-1 text-center py-2.5 text-[9px] tracking-widest uppercase font-bold transition-all duration-200 rounded-[2px] cursor-pointer ${
                activeStoreId === store.id
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {store.id === 'patna' ? 'Patna' : 'Gaya'}
            </button>
          ))}
        </div>

        {/* Store Map Location Image */}
        <div className="relative w-full aspect-video bg-zinc-950 border border-zinc-100 rounded-[2px] overflow-hidden shadow-md group mb-2">
          <img 
            src={activeStoreId === 'patna' ? '/map-patna.png' : '/map-gaya.png'} 
            alt={`${activeStore.name} Map Location`} 
            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-out filter brightness-[0.92] hover:brightness-100"
          />
          {/* Coordinates watermark overlay */}
          <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs px-2 py-1 rounded-[1px] border border-zinc-800 text-right pointer-events-none select-none">
            <span className="text-[6px] font-mono text-zinc-500 block uppercase leading-none">Coordinates</span>
            <span className="text-[7.5px] font-mono text-emerald-400 font-bold block mt-0.5 leading-none">
              {activeStore.coordinates}
            </span>
          </div>
        </div>

        {/* Transit details block */}
        <div className="flex items-center gap-1.5 px-1 mb-4 text-[8px] uppercase tracking-wider text-zinc-400 font-bold">
          <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full shrink-0" />
          <span>{activeStore.transitInfo}</span>
        </div>

        {/* Action Panel: Directions, Call, Share */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <a
            href={activeStore.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-2.5 border border-zinc-200 rounded-[2px] bg-black text-white hover:bg-zinc-900 transition-all text-center gap-1 cursor-pointer select-none active:scale-[0.98]"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[8px] tracking-widest uppercase font-bold">Directions</span>
          </a>

          <a
            href={`tel:${activeStore.phone.replace(/\s+/g, '')}`}
            className="flex flex-col items-center justify-center py-2.5 border border-zinc-250 rounded-[2px] bg-zinc-50 hover:bg-zinc-100 text-zinc-900 transition-all text-center gap-1 cursor-pointer select-none active:scale-[0.98]"
          >
            <Phone className="w-3.5 h-3.5 text-zinc-700" />
            <span className="text-[8px] tracking-widest uppercase font-bold text-zinc-700">Call Store</span>
          </a>

          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center py-2.5 border border-zinc-250 rounded-[2px] bg-zinc-50 hover:bg-zinc-100 text-zinc-900 transition-all text-center gap-1 cursor-pointer select-none active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-scale-in" />
                <span className="text-[8px] tracking-widest uppercase font-bold text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-700" />
                <span className="text-[8px] tracking-widest uppercase font-bold text-zinc-700">Share info</span>
              </>
            )}
          </button>
        </div>

        {/* Detailed Info Cards Grid */}
        <div className="flex flex-col gap-5">
          
          {/* Card 1: Store Information */}
          <div className="border border-zinc-100 bg-zinc-50/50 rounded-[2px] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-[10px] font-bold text-zinc-900 uppercase">
                  {activeStore.name}
                </h3>
                <span className="text-[8px] text-zinc-400 uppercase tracking-wider font-semibold">
                  {activeStore.type}
                </span>
              </div>
              <span className={`text-[7.5px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-[1px] ${
                isOpenNow ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                {isOpenNow ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              
              {/* Reviews rating */}
              <div className="flex items-center gap-1.5 text-zinc-700">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                  <span className="text-[9.5px] font-bold text-zinc-900">{activeStore.rating}</span>
                </div>
                <span className="text-[8px] text-zinc-400 font-semibold uppercase tracking-wider">
                  ({activeStore.reviewsCount} Google reviews)
                </span>
              </div>

              {/* Location Address */}
              <div className="flex gap-2 items-start mt-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <div className="text-[9.5px] text-zinc-600 leading-normal font-medium whitespace-pre-line">
                  {activeStore.address}
                </div>
              </div>

              {/* Phone Line */}
              <div className="flex gap-2 items-center mt-1">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-[9.5px] text-zinc-600 font-mono font-bold">
                  {activeStore.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Operating Hours */}
          <div className="border border-zinc-100 bg-zinc-50/50 rounded-[2px] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-[10px] font-bold text-zinc-900 uppercase">
                Opening Hours
              </h3>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {activeStore.hours.map((item, idx) => {
                const isToday = item.day === todayName;
                return (
                  <div 
                    key={idx} 
                    className={`flex justify-between items-center text-[9px] ${
                      isToday 
                        ? 'text-black font-bold border-l-2 border-black pl-2' 
                        : 'text-zinc-500 font-medium'
                    }`}
                  >
                    <span className="uppercase tracking-wider">{item.day}</span>
                    <span className="font-mono text-[9px] uppercase tracking-normal">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Global CSS animations */}
      <style jsx global>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(250px); }
        }
        .animate-scan {
          animation: scan-line 5s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
