'use client';

import React, { useEffect, useRef, useState, useId } from 'react';

/**
 * LiquidGlass - Authentic Apple-style liquid glass lens with real SVG displacement
 * refraction, chromatic aberration (RGB fringe), and multi-layer specular rim highlights.
 * Default values configured via Controls (useDialKit):
 * shape: "circle", scale: 3, aberration: 20, bevelDepth: 37, frost: 0, tint: 0
 */
export function LiquidGlass({
  children,
  className = '',
  shape = 'circle',
  radius = 999,
  scale = 3,
  strength = scale,
  aberration = 20,
  chromaticAberration = aberration,
  bevelDepth = 37,
  depth = bevelDepth,
  frost = 0,
  blur = frost,
  tint = 0,
  borderTint = 'rgba(255, 255, 255, 0.45)',
  ...props
}) {
  const containerRef = useRef(null);
  const filterId = useId().replace(/:/g, '');
  const [dimensions, setDimensions] = useState({ width: 380, height: 60 });
  const [supportsSvgFilter, setSupportsSvgFilter] = useState(false);

  useEffect(() => {
    // Check if browser supports backdrop-filter with SVG url()
    if (typeof window !== 'undefined') {
      const testEl = document.createElement('div');
      testEl.style.cssText = 'backdrop-filter: url(#test)';
      const supported =
        testEl.style.backdropFilter === 'url(#test)' ||
        testEl.style.backdropFilter === 'url("#test")';
      setSupportsSvgFilter(supported);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;
  const effectiveRadius = shape === 'circle' ? 999 : radius;
  // Intelligently clamp displacement and depth to element scale so distant page surroundings aren't pulled over the lens
  const maxOpticalScale = Math.max(16, Math.min(width, height) * 0.42);
  const effectiveStrength = Math.min(strength, maxOpticalScale);
  const effectiveAberration = Math.min(chromaticAberration, effectiveStrength * 0.35);
  const effectiveDepth = Math.min(depth, Math.max(2, Math.floor(Math.min(width, height) / 3.2)));
  const tintColor = typeof tint === 'number' ? `rgba(255, 255, 255, ${tint})` : tint;

  // Generate dynamic displacement map SVG vector data
  const displacementMapData = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradY" x1="0" x2="0" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#00FF00" />
          <stop offset="50%" stop-color="#808080" />
          <stop offset="100%" stop-color="#000000" />
        </linearGradient>
        <linearGradient id="gradX" x1="0%" x2="100%" y1="0" y2="0">
          <stop offset="0%" stop-color="#FF0000" />
          <stop offset="50%" stop-color="#808080" />
          <stop offset="100%" stop-color="#000000" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
      <g filter="blur(${Math.max(1, effectiveDepth / 3)}px)">
        <rect x="0" y="0" height="${height}" width="${width}" fill="url(#gradY)" style="mix-blend-mode: screen;" />
        <rect x="0" y="0" height="${height}" width="${width}" fill="url(#gradX)" style="mix-blend-mode: screen;" />
        <rect
          x="${effectiveDepth}"
          y="${effectiveDepth}"
          height="${Math.max(0, height - 2 * effectiveDepth)}"
          width="${Math.max(0, width - 2 * effectiveDepth)}"
          fill="#808080"
          rx="${Math.max(0, effectiveRadius - effectiveDepth)}"
          ry="${Math.max(0, effectiveRadius - effectiveDepth)}"
          filter="blur(${effectiveDepth}px)"
        />
      </g>
    </svg>
  `)}`;

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        borderRadius: `${effectiveRadius}px`,
      }}
      {...props}
    >
      {/* Hidden SVG Filter Definition for Refraction & Chromatic Aberration */}
      <svg
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-0 w-0"
        aria-hidden="true"
      >
        <defs>
          <filter id={`liquid-filter-${filterId}`} colorInterpolationFilters="sRGB">
            <feImage
              x="0"
              y="0"
              height={height}
              width={width}
              href={displacementMapData}
              result="dispMap"
            />
            {/* Red Channel Displacement */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale={effectiveStrength + effectiveAberration * 2}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedR"
            />
            <feColorMatrix
              in="displacedR"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="redOnly"
            />
            {/* Green Channel Displacement */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale={effectiveStrength + effectiveAberration}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedG"
            />
            <feColorMatrix
              in="displacedG"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="greenOnly"
            />
            {/* Blue Channel Displacement */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="dispMap"
              scale={effectiveStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedB"
            />
            <feColorMatrix
              in="displacedB"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blueOnly"
            />
            {/* Blend All Channels Together */}
            <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rgBlend" />
            <feBlend in="rgBlend" in2="blueOnly" mode="screen" result="fullChromatic" />
          </filter>
        </defs>
      </svg>

      {/* Optical Glass Layer with SVG Refraction + Frosted Fallback */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-300"
        style={{
          borderRadius: `${effectiveRadius}px`,
          backgroundColor: tintColor,
          backdropFilter: supportsSvgFilter
            ? `url(#liquid-filter-${filterId}) blur(${blur}px) saturate(190%) contrast(98%)`
            : `blur(${blur}px) saturate(190%) contrast(98%)`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(190%) contrast(98%)`,
          border: `1px solid ${borderTint}`,
          boxShadow: `
            0 24px 48px -12px rgba(0, 0, 0, 0.18),
            0 8px 18px -4px rgba(0, 0, 0, 0.08),
            inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.04),
            0 0 0 1px rgba(0, 0, 0, 0.04)
          `,
        }}
      />

      {/* Top Specular Sheen (Apple Light Rim) */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 z-10 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
        style={{ borderRadius: `${effectiveRadius}px` }}
      />

      {/* Content Layer */}
      <div className="relative z-20 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export default LiquidGlass;
