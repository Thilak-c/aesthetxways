'use client';

import React from 'react';

/**
 * Calculates delivery address quality score based on Indian logistics standards:
 * - PIN Code: +30%
 * - House / Flat / Door No: +25%
 * - Street / Locality / Road Area: +25%
 * - City / Town: +20%
 * Total = 100%
 */
export function calculateAddressScore(addr, fullAddress = '') {
  const raw = typeof addr === 'object' && addr !== null ? addr : {};
  const full = typeof addr === 'string' ? addr : (fullAddress || '');

  let score = 0;
  const breakdown = {
    pincode: false,
    houseNo: false,
    street: false,
    city: false,
  };

  // 1. PIN Code (+30%)
  const pin = String(raw.pincode || raw.pinCode || raw.pin || '').trim();
  const hasValidPin = /^\d{6}$/.test(pin) || /\b[1-9][0-9]{5}\b/.test(full);
  if (hasValidPin) {
    score += 30;
    breakdown.pincode = true;
  }

  // 2. House / Flat / Door No. (+25%)
  const house = String(raw.houseNo || raw.flatNo || raw.doorNo || raw.building || '').trim();
  const hasHouse =
    house.length > 0 ||
    /(?:flat|house|door|plot|block|bldg|no\.?|#)\s*[\w\d\-\/]+/i.test(full) ||
    /^\s*\d+[\w\s,\-\/]/.test(full);
  if (hasHouse) {
    score += 25;
    breakdown.houseNo = true;
  }

  // 3. Street / Locality / Road Area (+25%)
  const street = String(
    raw.street || raw.roadArea || raw.area || raw.locality || raw.landmark || raw.address || ''
  ).trim();
  const hasStreet =
    street.length >= 3 ||
    (full.length >= 10 && (breakdown.houseNo ? full.length > house.length + 5 : true));
  if (hasStreet) {
    score += 25;
    breakdown.street = true;
  }

  // 4. City / Town (+20%)
  const city = String(raw.city || raw.town || raw.district || '').trim();
  const hasCity = city.length >= 2 || (raw.state && raw.state.length >= 2);
  if (hasCity) {
    score += 20;
    breakdown.city = true;
  }

  // Visual tiers: Green (100%), Amber (50-75%), Red (< 40%)
  let color = 'emerald';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let ringColor = '#10b981'; // emerald-500
  let label = '100% Complete — Minimal courier RTO risk';

  if (score < 40) {
    color = 'rose';
    badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
    ringColor = '#f43f5e'; // rose-500
    label = 'Incomplete Address / Bad PIN — Call customer before dispatch';
  } else if (score < 100) {
    color = 'amber';
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
    ringColor = '#f59e0b'; // amber-500
    label = 'Partial Details — Check missing house or road name';
  }

  return {
    score,
    breakdown,
    color,
    badgeBg,
    ringColor,
    label,
  };
}

/**
 * AddressScorePieChart: Circular SVG donut pie chart showing address quality percentage
 */
export default function AddressScorePieChart({
  addr,
  fullAddress,
  size = 20,
  showLabel = true,
  showTooltip = true,
}) {
  const { score, breakdown, badgeBg, ringColor, label } = calculateAddressScore(addr, fullAddress);

  // SVG ring geometry
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative group/score inline-flex items-center gap-1.5 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      {/* SVG Pie Chart / Radial Ring */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
        title={`Address Score: ${score}%`}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

