"use client";

import { useMemo } from 'react';
import DottedMap from 'dotted-map';

export default function AnalyticsMap({ locations }) {
  const validLocations = locations?.filter(
    loc => typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  ) || [];

  const svgMap = useMemo(() => {
    // 1. Initialize the world dotted map (height defines resolution, 55 is perfect)
    const map = new DottedMap({ height: 55, grid: 'diagonal' });

    // 2. Add glowing pins for active visitor locations
    validLocations.forEach((loc) => {
      // Calculate scaling for the pin based on view counts
      const radiusScale = Math.max(0.4, Math.min(1.2, 0.4 + Math.log2(loc.count) * 0.15));
      map.addPin({
        lat: loc.latitude,
        lng: loc.longitude,
        svgOptions: { 
          color: '#f43f5e', // Glowing rose-500 red spots
          radius: radiusScale 
        }
      });
    });

    // 3. Generate the styled SVG string (transparent bg to blend with slate dashboard)
    return map.getSVG({
      radius: 0.16, // Map dot radius
      color: '#334155', // Slate-700 dots for landmasses
      shape: 'circle',
      backgroundColor: 'transparent',
    });
  }, [validLocations]);

  return (
    <div className="h-[350px] w-full rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative group">
      {/* Radial glow spots in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 left-12 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* SVG Map Container */}
      <div 
        className="w-full h-full flex items-center justify-center select-none dotted-map-svg-container [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full"
        dangerouslySetInnerHTML={{ __html: svgMap }}
      />
      
      {/* Floating map controls indicator */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider shadow-md flex items-center gap-2 select-none backdrop-blur-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span>{validLocations.length} Active Spots</span>
      </div>
    </div>
  );
}
