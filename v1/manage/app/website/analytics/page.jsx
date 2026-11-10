'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import {
  Search,
  Upload,
  Download,
  Eye,
  Package,
  ShoppingBag,
  ArrowRight,
  MoreHorizontal,
  ExternalLink,
  Layers,
  Sparkles,
  Compass,
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';

const getStorefrontUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://localhost:6002${cleanPath}`;
    }
  }
  return `https://aesthetxways.com${cleanPath}`;
};

export default function AnalyticsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // 'ALL' | 'product' | 'page' | 'category' | 'home'
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real-time view data from API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/views?limit=200')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success) {
          setDbData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load views analytics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return (
      dbData?.stats || {
        totalViews: 0,
        uniquePagesCount: 0,
        productViewsCount: 0,
        categoryViewsCount: 0,
        homeViewsCount: 0,
        checkoutViewsCount: 0,
        otherViewsCount: 0,
        productViewsPercentage: 0,
      }
    );
  }, [dbData]);

  // Traffic Distribution for Donut Chart
  const distribution = useMemo(() => {
    return (
      dbData?.trafficDistribution || [
        { name: 'Product Pages', shortName: 'Products', count: 0, percent: 50, color: '#111111', ringClass: 'bg-[#111111]' },
        { name: 'Home Page', shortName: 'Home', count: 0, percent: 25, color: '#4b5563', ringClass: 'bg-[#4b5563]' },
        { name: 'Checkout & Bag', shortName: 'Checkout', count: 0, percent: 15, color: '#9ca3af', ringClass: 'bg-[#9ca3af]' },
        { name: 'Categories & Other', shortName: 'Browse', count: 0, percent: 10, color: '#d1d5db', ringClass: 'bg-[#d1d5db]' },
      ]
    );
  }, [dbData]);

  // Daily Activity Bars (Mon - Sun)
  const dailyBars = useMemo(() => {
    const raw = dbData?.dailyViews || [
      { day: 'Mon', totalViews: 2, productViews: 1 },
      { day: 'Tue', totalViews: 3, productViews: 2 },
      { day: 'Wed', totalViews: 5, productViews: 3 },
      { day: 'Thu', totalViews: 4, productViews: 2 },
      { day: 'Fri', totalViews: Math.max(5, stats.totalViews), productViews: stats.productViewsCount },
    ];

    const xCoords = [55, 115, 175, 235, 295, 355, 415];
    const maxVal = Math.max(10, ...raw.map((d) => d.totalViews || 0));

    return raw.map((d, idx) => {
      const tot = d.totalViews || 0;
      const prod = d.productViews || 0;
      const x = xCoords[idx] || 55 + idx * 60;

      const totHeight = tot > 0 ? Math.max(16, Math.min(75, Math.round((tot / maxVal) * 75))) : 4;
      const prodHeight = prod > 0 ? Math.max(12, Math.min(60, Math.round((prod / maxVal) * 60))) : 0;

      return {
        ...d,
        x,
        val: tot >= 1000 ? `${(tot / 1000).toFixed(1)}k` : `${tot}`,
        totHeight,
        prodHeight,
      };
    });
  }, [dbData, stats]);

  // Scaled Y-Axis reference lines & numbers
  const yAxisLines = useMemo(() => {
    const maxVal = Math.max(10, ...dailyBars.map((b) => b.totalViews || 0));
    const step = Math.ceil(maxVal / 6) || 1;
    return [
      { y: 20, val: `${step * 6}` },
      { y: 50, val: `${step * 5}` },
      { y: 80, val: `${step * 4}` },
      { y: 110, val: `${step * 3}` },
      { y: 140, val: `${step * 2}` },
      { y: 170, val: `${step * 1}` },
    ];
  }, [dailyBars]);

  // Top products list
  const topProducts = useMemo(() => {
    return dbData?.topProducts || [];
  }, [dbData]);

  // All tracked pages list with search and type filter
  const filteredPages = useMemo(() => {
    const list = dbData?.views || [];
    return list.filter((p) => {
      const path = (p.path || '').toLowerCase();
      const title = (p.title || '').toLowerCase();
      const identifier = (p.identifier || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesSearch = !q || path.includes(q) || title.includes(q) || identifier.includes(q);

      let matchesType = true;
      if (selectedTypeFilter === 'product') {
        matchesType = p.type === 'product' || path.startsWith('/product/') || path.startsWith('/shop/');
      } else if (selectedTypeFilter === 'home') {
        matchesType = p.type === 'home' || path === '/';
      } else if (selectedTypeFilter === 'checkout') {
        matchesType = path.includes('checkout') || path.includes('bag') || path.includes('cart');
      } else if (selectedTypeFilter === 'category') {
        matchesType = p.type === 'category' || path.startsWith('/category/') || path.includes('/collections/');
      }

      return matchesSearch && matchesType;
    });
  }, [dbData, searchTerm, selectedTypeFilter]);

  // Export CSV handler
  const handleExportCSV = () => {
    const viewsList = dbData?.views || [];
    const headers = ['Doc ID', 'Page Type', 'Path', 'Title / Identifier', 'View Count', 'Last Viewed At'];
    const rows = viewsList.map((v) => [
      `"${v._id}"`,
      `"${v.type || 'page'}"`,
      `"${v.path || ''}"`,
      `"${(v.title || v.identifier || '').replace(/"/g, '""')}"`,
      v.count || v.views || 0,
      `"${v.lastViewedAt ? new Date(v.lastViewedAt).toISOString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aesthetxways_traffic_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Report handler
  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f4f7] px-4 py-6 sm:px-8 sm:py-8 font-sans select-none">
        {/* ========================================================= */}
        {/* TOP BAR / DASHBOARD HEADER ROW                            */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
          {/* Dashboard Title */}
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-semibold text-[#111111] tracking-tight">
              Page Views & Traffic Analytics
            </h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              Real-time customer engagement and store traffic tracking from MongoDB
            </p>
          </div>

          {/* Search Pill and Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Pill Search Input */}
            <div className="relative w-full sm:w-[280px] md:w-[320px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search page or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f3f4f6] text-[14px] text-[#111111] placeholder-neutral-400 pl-10 pr-4 py-2 rounded-full border border-neutral-200/50 outline-none focus:bg-white focus:border-neutral-300 transition-all font-normal"
              />
            </div>

            {/* Export CSV Pill Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#111111] text-[#111111] text-[13.5px] font-medium hover:bg-neutral-50 transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Download Report Pill Button */}
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#111111] text-[#111111] text-[13.5px] font-medium hover:bg-neutral-50 transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOP SECTION: 3 COLUMNS GRID                               */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* ------------------------------------------------------- */}
          {/* COLUMN 1 (LEFT, ~25%): 2 STACKED CARDS                  */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col gap-6 justify-between">
            {/* Card 1: Total Store Views */}
            <div className="bg-white rounded-[26px] p-6 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-[14px] text-neutral-500 font-normal">
                    Total Page Views
                  </p>
                  <div className="w-9 h-9 rounded-xl border border-neutral-200/80 flex items-center justify-center text-neutral-700 shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-[34px] sm:text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                    {stats.totalViews.toLocaleString('en-IN')}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-semibold">
                    Tracked
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-400 mt-2">
                  Across {stats.uniquePagesCount} tracked routes
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-100">
                <a
                  href="#page-audit-table"
                  className="flex items-center justify-between text-[14px] font-medium text-neutral-800 hover:text-black transition-colors group cursor-pointer"
                >
                  <span>View All Pages</span>
                  <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Card 2: Product Views */}
            <div className="bg-white rounded-[26px] p-6 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-[14px] text-neutral-500 font-normal">
                    Product Catalog Views
                  </p>
                  <div className="w-9 h-9 rounded-xl border border-neutral-200/80 flex items-center justify-center text-neutral-700 shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-[34px] sm:text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                    {stats.productViewsCount.toLocaleString('en-IN')}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-semibold">
                    {stats.productViewsPercentage}%
                    <TrendingUp className="w-2.5 h-2.5" />
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-400 mt-2">
                  High-intent product discovery
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-100">
                <a
                  href="#top-products-table"
                  className="flex items-center justify-between text-[14px] font-medium text-neutral-800 hover:text-black transition-colors group cursor-pointer"
                >
                  <span>Top Viewed Products</span>
                  <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLUMN 2 (CENTER, ~42%): VIEWS ACTIVITY BAR CHART       */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] text-neutral-500 font-normal">
                    Weekly Traffic & Visitor Pace
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[36px] sm:text-[40px] font-bold text-[#111111] tracking-tight leading-none">
                      {stats.totalViews.toLocaleString('en-IN')} Views
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-semibold">
                      Weekly
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full border border-neutral-200/80 flex items-center justify-center text-neutral-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Legend: Total Views (Black) vs Product Views (Striped) */}
              <div className="flex items-center justify-end gap-5 mt-4">
                <div className="flex items-center gap-2 text-[12px] text-neutral-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
                  <span>Product Views</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <span>Total Views</span>
                </div>
              </div>
            </div>

            {/* Hatched Bar Chart SVG */}
            <div className="w-full mt-4 h-[240px]">
              <svg
                viewBox="0 0 460 220"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Diagonal hatched stripe pattern for Total Views */}
                  <pattern
                    id="analyticsDiagonalHatch"
                    width="6"
                    height="6"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="#d4d4d8"
                      strokeWidth="2.2"
                    />
                  </pattern>
                </defs>

                {/* Y-Axis Reference lines & numbers */}
                {yAxisLines.map((row) => (
                  <g key={row.y}>
                    <text
                      x="32"
                      y={row.y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-neutral-400 font-normal"
                    >
                      {row.val}
                    </text>
                    <line
                      x1="45"
                      y1={row.y}
                      x2="455"
                      y2={row.y}
                      stroke="#f3f4f6"
                      strokeDasharray="2 2"
                    />
                  </g>
                ))}

                {/* Bars for Days */}
                {dailyBars.map((b) => {
                  const baseY = 175;
                  const revY = baseY - b.prodHeight;
                  const totY = revY - b.totHeight;

                  return (
                    <g key={b.day}>
                      {/* Top Striped/Hatched Bar */}
                      {b.totHeight > 0 && (
                        <rect
                          x={b.x - 17}
                          y={totY}
                          width="34"
                          height={b.totHeight}
                          rx="14"
                          fill="url(#analyticsDiagonalHatch)"
                          stroke="#e5e7eb"
                          strokeWidth="0.5"
                        />
                      )}

                      {/* Bottom Solid Black Bar */}
                      <rect
                        x={b.x - 17}
                        y={revY}
                        width="34"
                        height={b.prodHeight}
                        rx={b.prodHeight > 14 ? '14' : '3'}
                        fill="#111111"
                      />

                      {/* Number above solid black bar */}
                      <text
                        x={b.x}
                        y={totY - 5}
                        textAnchor="middle"
                        className="text-[9.5px] font-semibold fill-neutral-600"
                      >
                        {b.val}
                      </text>

                      {/* Day pill button on X-axis */}
                      <rect
                        x={b.x - 18}
                        y={186}
                        width="36"
                        height="18"
                        rx="9"
                        fill="#111111"
                      />
                      <text
                        x={b.x}
                        y={199}
                        textAnchor="middle"
                        className="text-[9.5px] fill-white font-medium"
                      >
                        {b.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLUMN 3 (RIGHT, ~33%): TRAFFIC DISTRIBUTION DONUT      */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            {/* Header: Title and Distribution Badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#111111] tracking-tight">
                Traffic Distribution
              </h3>
              <div className="px-3 py-1 rounded-full border border-neutral-200 text-[12px] font-medium text-neutral-700 bg-neutral-50/70 select-none">
                Real-time
              </div>
            </div>

            {/* Donut Chart Visual */}
            <div className="relative w-full my-4 flex items-center justify-center">
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#f3f4f6"
                    strokeWidth="14"
                  />
                  {/* Concentric / Arc Slices */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#111111"
                    strokeWidth="14"
                    strokeDasharray={`${(distribution[0]?.percent || 50) * 2.38} 238`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#4b5563"
                    strokeWidth="14"
                    strokeDasharray={`${(distribution[1]?.percent || 25) * 2.38} 238`}
                    strokeDashoffset={`-${(distribution[0]?.percent || 50) * 2.38}`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#9ca3af"
                    strokeWidth="14"
                    strokeDasharray={`${(distribution[2]?.percent || 15) * 2.38} 238`}
                    strokeDashoffset={`-${((distribution[0]?.percent || 50) + (distribution[1]?.percent || 25)) * 2.38}`}
                  />
                </svg>

                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10.5px] uppercase font-bold text-neutral-400 tracking-wider">
                    Total
                  </span>
                  <span className="text-[22px] font-bold text-[#111111] leading-tight">
                    {stats.totalViews}
                  </span>
                  <span className="text-[10px] text-neutral-500">Hits</span>
                </div>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-[12px]">
              {distribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-50/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-neutral-700 font-medium truncate">{item.shortName}</span>
                  </div>
                  <span className="font-bold text-[#111111] shrink-0 ml-1">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM SECTION: 2 DATA TABLES                             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 items-start">
          {/* ------------------------------------------------------- */}
          {/* TABLE 1 (LEFT, 7 COLS): TOP VIEWED PRODUCTS TABLE       */}
          {/* ------------------------------------------------------- */}
          <div
            id="top-products-table"
            className="lg:col-span-7 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#111111] tracking-tight">
                  Top Viewed Products
                </h3>
                <p className="text-[12.5px] text-neutral-500 mt-0.5">
                  Ranked by customer views and impressions
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Most Viewed
              </span>
            </div>

            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-[13.5px]">
                No product views recorded yet. Visit any product on the store to populate!
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {topProducts.slice(0, 7).map((prod, pIdx) => (
                  <div
                    key={prod.id || pIdx}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/70 rounded-xl px-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Number */}
                      <span className="text-[13px] font-bold text-neutral-400 w-4 text-center">
                        {pIdx + 1}
                      </span>

                      {/* Product Image */}
                      <a
                        href={getStorefrontUrl(`/product/${prod.slug}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200/60 shrink-0 flex items-center justify-center hover:opacity-85 transition-opacity"
                        title={`View ${prod.name} on aesthetxways.com`}
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </a>

                      {/* Product Name & Category */}
                      <div className="min-w-0">
                        <a
                          href={getStorefrontUrl(`/product/${prod.slug}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline block"
                          title={`View ${prod.name} on aesthetxways.com`}
                        >
                          <p className="text-[13.5px] font-semibold text-[#111111] truncate hover:text-black">
                            {prod.name}
                          </p>
                        </a>
                        <p className="text-[11.5px] text-neutral-400">
                          {prod.category} • ₹{prod.priceNumber.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Views Count Pill */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-[#111111] font-bold text-[12.5px]">
                          <Eye className="w-3.5 h-3.5 text-neutral-600" />
                          {prod.views}
                        </span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5">
                          {prod.shareOfTraffic}% of traffic
                        </span>
                      </div>

                      <a
                        href={getStorefrontUrl(`/product/${prod.slug}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-black hover:border-black transition-colors"
                        title="View Product Page on aesthetxways.com"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ------------------------------------------------------- */}
          {/* TABLE 2 (RIGHT, 5 COLS): ALL TRACKED PAGES AUDIT        */}
          {/* ------------------------------------------------------- */}
          <div
            id="page-audit-table"
            className="lg:col-span-5 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#111111] tracking-tight">
                  All Tracked Routes
                </h3>
                <p className="text-[12.5px] text-neutral-500 mt-0.5">
                  {filteredPages.length} active pages recorded
                </p>
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1">
                {['ALL', 'product', 'home', 'checkout'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTypeFilter(t)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      selectedTypeFilter === t
                        ? 'bg-[#111111] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {filteredPages.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-[13.5px]">
                No routes match your search.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-[460px] overflow-y-auto pr-1">
                {filteredPages.map((page, idx) => (
                  <div key={page._id || idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                          page.type === 'home'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : page.type === 'product'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : page.path?.includes('checkout')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {page.type || 'page'}
                        </span>
                        <a
                          href={getStorefrontUrl(page.path)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 group/route"
                          title={`Open ${page.path} on aesthetxways.com`}
                        >
                          <code className="text-[11.5px] font-mono text-neutral-800 font-semibold truncate max-w-[170px] group-hover/route:text-black">
                            {page.path}
                          </code>
                          <ExternalLink className="w-2.5 h-2.5 text-neutral-400 group-hover/route:text-neutral-700 shrink-0" />
                        </a>
                      </div>
                      <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">
                        {page.title || page.identifier}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-[13px] text-[#111111]">
                        {page.count || page.views}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        {page.lastViewedAt
                          ? new Date(page.lastViewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
