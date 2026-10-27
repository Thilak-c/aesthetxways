"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

export default function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState("7d"); // '24h', '7d', '30d'
  const analyticsData = useQuery(api.analytics.getAnalyticsSummary, { period });
  const isLoading = analyticsData === undefined;
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shades = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];

  const showSkeleton = isLoading || !isMounted;

  // Render Recharts Funnel Area Graph
  const renderFunnelGraph = () => {
    if (showSkeleton) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white min-w-0 overflow-hidden">
          <div className="h-[180px] sm:h-[200px] w-full flex flex-col justify-between font-mono text-[9px] relative overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
            </div>
            
            {/* SVG area/line skeleton */}
            <div className="absolute inset-0 flex items-end pl-8 pr-4 pb-6">
              <svg className="w-full h-full text-zinc-100/70" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 0 80 Q 25 50 50 60 T 100 20 L 100 100 L 0 100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                />
                <path
                  d="M 0 80 Q 25 50 50 60 T 100 20"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </svg>
            </div>
            
            {/* Axes placeholders */}
            <div className="w-full h-full flex flex-col justify-between pb-6 pl-8 relative z-10">
              <div className="flex justify-between w-full">
                <div className="w-8 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-6 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-7 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-4 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
            </div>
            
            {/* Fake X-axis labels */}
            <div className="flex justify-between pl-8 pr-4 pt-2 border-t border-zinc-100 relative z-10 animate-pulse">
              <div className="w-12 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-16 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-12 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-14 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-12 h-2.5 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    if (!analyticsData || !analyticsData.funnel || Object.keys(analyticsData.funnel).length === 0) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white text-center py-8 font-mono text-xs text-zinc-400">
          No funnel data collected
        </div>
      );
    }

    const homepageCount = analyticsData.funnel.homepage || 1;

    const data = [
      { name: "Homepage", count: analyticsData.funnel.homepage || 0 },
      { name: "Product Pages", count: analyticsData.funnel.viewProduct || 0 },
      { name: "Cart Page", count: analyticsData.funnel.cart || 0 },
      { name: "Checkout", count: analyticsData.funnel.checkout || 0 },
      { name: "Purchases", count: analyticsData.funnel.purchase || 0 }
    ].map((item) => {
      const conversion = Math.round((item.count / homepageCount) * 100);
      return {
        ...item,
        "Conversion Rate": `${conversion}%`
      };
    });

    // Custom Tooltip component
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
          <div className="bg-white border border-zinc-150 p-2 font-mono text-[10px] text-zinc-800 shadow-xs">
            <p className="font-bold text-zinc-950">{dataPoint.name}</p>
            <p className="mt-1">Visits: {dataPoint.count.toLocaleString()}</p>
            <p>Overall Conversion: {dataPoint["Conversion Rate"]}</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white min-w-0 overflow-hidden">
        <div className="h-[180px] sm:h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart key={period} data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="funnelColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#a1a1aa" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(tick) => tick.toLocaleString()}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={1.5} 
                fillOpacity={1} 
                fill="url(#funnelColor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Recharts Hourly Traffic Graph
  const renderHourlyGraph = () => {
    if (showSkeleton) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white">
          <div className="h-[180px] w-full flex flex-col justify-between font-mono text-[9px] relative overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
            </div>
            
            {/* SVG area/line skeleton */}
            <div className="absolute inset-0 flex items-end pl-8 pr-4 pb-6">
              <svg className="w-full h-full text-zinc-100/60" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 0 90 Q 15 40 30 70 T 60 30 T 90 50 T 100 20 L 100 100 L 0 100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                />
                <path
                  d="M 0 90 Q 15 40 30 70 T 60 30 T 90 50 T 100 20"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </svg>
            </div>
            
            {/* Axes placeholders */}
            <div className="w-full h-full flex flex-col justify-between pb-6 pl-8 relative z-10">
              <div className="flex justify-between w-full">
                <div className="w-8 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-6 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-7 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
            </div>
            
            {/* Fake X-axis labels */}
            <div className="flex justify-between pl-8 pr-4 pt-2 border-t border-zinc-100 relative z-10 animate-pulse">
              <div className="w-6 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2.5 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    const data = analyticsData?.hourlyViews || [];
    if (data.length === 0) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white text-center py-8 font-mono text-xs text-zinc-400">
          No traffic data recorded
        </div>
      );
    }

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
          <div className="bg-white border border-zinc-150 p-2 font-mono text-[10px] text-zinc-800 shadow-xs">
            <p className="font-bold text-zinc-950">{dataPoint.hour}</p>
            <p className="mt-1">Visitors: {dataPoint.count.toLocaleString()}</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white min-w-0 overflow-hidden">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart key={period} data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="hourlyColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis 
                dataKey="hour" 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(tick) => tick.toLocaleString()}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#10b981" 
                strokeWidth={1.5} 
                fillOpacity={1} 
                fill="url(#hourlyColor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Reusable Donut Chart Component
  const renderDonutChart = (data, chartId) => {
    if (showSkeleton) {
      return (
        <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 font-mono text-xs bg-white flex-1 min-w-0 w-full overflow-hidden">
          <div className="relative w-[110px] h-[110px] shrink-0 flex items-center justify-center animate-pulse">
            <svg className="w-full h-full text-zinc-100" viewBox="0 0 36 36">
              <path
                className="text-zinc-100"
                stroke="currentColor"
                strokeWidth="4.5"
                fill="none"
                strokeDasharray="100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[7px] text-zinc-300 uppercase tracking-widest font-bold">Share</span>
            </div>
          </div>
          <div className="flex-1 w-full flex flex-col gap-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-zinc-50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-xs bg-zinc-200 shrink-0" />
                  <div className="w-16 h-3 bg-zinc-100 rounded-xs" />
                </div>
                <div className="w-10 h-3 bg-zinc-100 rounded-xs" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 mt-2 text-zinc-400 font-mono text-xs bg-white text-center py-8">
          No records collected
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

    // Segment data for the chart: Top 5 distinct segments + grouped "Others"
    const chartData = (() => {
      if (data.length <= 5) return data;
      const top5 = data.slice(0, 5);
      const othersValue = data.slice(5).reduce((sum, item) => sum + item.value, 0);
      return [...top5, { name: "Others", value: othersValue }];
    })();

    return (
      <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 font-mono text-xs bg-white flex-1 min-w-0 w-full overflow-hidden">
        {/* Recharts Pie Donut Chart */}
        <div className="relative w-[110px] h-[110px] shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart key={period} id={chartId}>
              <Pie
                id={`pie-${chartId}`}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={44}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} stroke="white" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value.toLocaleString(), "Views"]} contentStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[7px] text-zinc-400 uppercase tracking-widest font-bold">Share</span>
          </div>
        </div>

        {/* Legend list (Fully scrollable, showing all entries in the database) */}
        <div className="flex-1 w-full flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1">
          {data.map((item, idx) => {
            const percentage = Math.round((item.value / total) * 100);
            // First 5 elements get vivid chart colors, subsequent elements get neutral gray
            const bulletColor = idx < 5 ? shades[idx] : "#e4e4e7";

            return (
              <div key={idx} className="flex justify-between items-center py-0.5 border-b border-zinc-50">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: bulletColor }} />
                  <span className="text-zinc-700 font-semibold truncate">{item.name}</span>
                </div>
                <span className="text-zinc-900 font-bold shrink-0">
                  {item.value.toLocaleString()} <span className="text-zinc-400 font-normal ml-0.5">({percentage}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Reusable Bar Chart Component
  const renderBarChart = (data, chartId) => {
    if (showSkeleton) {
      return (
        <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white flex-1 min-w-0 w-full overflow-hidden">
          <div className="h-[140px] w-full flex flex-col justify-between font-mono text-[9px] relative overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
            </div>
            
            {/* Axis & Bars */}
            <div className="absolute inset-0 flex items-end pl-8 pr-4 pb-5 gap-4 justify-around animate-pulse">
              <div className="w-6 h-[40%] bg-zinc-100 rounded-t-xs" />
              <div className="w-6 h-[75%] bg-zinc-100 rounded-t-xs" />
              <div className="w-6 h-[50%] bg-zinc-100 rounded-t-xs" />
              <div className="w-6 h-[90%] bg-zinc-100 rounded-t-xs" />
              <div className="w-6 h-[30%] bg-zinc-100 rounded-t-xs" />
            </div>

            {/* Fake Y-axis values */}
            <div className="w-full h-full flex flex-col justify-between pb-5 pl-8 relative z-10 animate-pulse">
              <div className="w-6 h-2 bg-zinc-100 rounded-xs -ml-8" />
              <div className="w-4 h-2 bg-zinc-100 rounded-xs -ml-8" />
              <div className="w-5 h-2 bg-zinc-100 rounded-xs -ml-8" />
            </div>

            {/* Fake X-axis labels */}
            <div className="flex justify-around pl-8 pr-4 pt-1 border-t border-zinc-100 relative z-10 animate-pulse">
              <div className="w-8 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 mt-2 text-zinc-400 font-mono text-xs bg-white text-center py-8">
          No records collected
        </div>
      );
    }

    return (
      <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white flex-1 min-w-0 w-full overflow-hidden">
        <div className="h-[140px] w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart key={period} id={chartId} data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                dy={5}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(tick) => tick.toLocaleString()}
              />
              <Tooltip 
                formatter={(value) => [value.toLocaleString(), "Views"]} 
                contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} 
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Horizontal Bar Chart for Visited Pages (handles long path labels perfectly)
  const renderPagesChart = () => {
    if (showSkeleton) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white">
          <div className="h-[320px] w-full flex font-mono text-[9px] relative overflow-hidden p-2">
            {/* Grid lines (vertical) */}
            <div className="absolute inset-0 flex justify-between px-2 pl-36 pb-6 pointer-events-none">
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
            </div>
            
            <div className="w-full h-full flex flex-col justify-between pb-6 relative z-10 animate-pulse">
              {[
                { nameW: "w-20", barW: "w-[80%]" },
                { nameW: "w-28", barW: "w-[65%]" },
                { nameW: "w-16", barW: "w-[50%]" },
                { nameW: "w-24", barW: "w-[40%]" },
                { nameW: "w-32", barW: "w-[30%]" },
                { nameW: "w-12", barW: "w-[25%]" },
                { nameW: "w-20", barW: "w-[15%]" }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center gap-4 w-full h-6">
                  {/* Fake Y-Axis label */}
                  <div className={`h-2.5 bg-zinc-100 rounded-xs shrink-0 ${row.nameW}`} />
                  {/* Bar */}
                  <div className="flex-1 h-3 bg-zinc-100/60 rounded-r-xs flex items-center">
                    <div className={`h-3 bg-zinc-100 rounded-r-xs ${row.barW}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Fake X-Axis labels at the bottom */}
            <div className="absolute bottom-0 left-36 right-2 flex justify-between border-t border-zinc-100 pt-1.5 animate-pulse">
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    const data = analyticsData?.breakdowns?.pages || [];
    if (data.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 mt-2 text-zinc-400 font-mono text-xs bg-white text-center py-8">
          No page views recorded
        </div>
      );
    }

    // Set height dynamically: 26px per page, minimum 300px
    const chartHeight = Math.max(300, data.length * 26);

    return (
      <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white max-h-[450px] overflow-y-auto pr-2 min-w-0 overflow-hidden">
        <div style={{ height: `${chartHeight}px` }} className="w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart 
              key={period}
              data={data} 
              layout="vertical" 
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#71717a" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                width={130}
              />
              <Tooltip 
                formatter={(value) => [value.toLocaleString(), "Views"]} 
                contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} 
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Horizontal Bar Chart for Full Referrer URLs
  const renderReferrersFullChart = () => {
    if (showSkeleton) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white">
          <div className="h-[320px] w-full flex font-mono text-[9px] relative overflow-hidden p-2">
            {/* Grid lines (vertical) */}
            <div className="absolute inset-0 flex justify-between px-2 pl-36 pb-6 pointer-events-none">
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
            </div>
            
            <div className="w-full h-full flex flex-col justify-between pb-6 relative z-10 animate-pulse">
              {[
                { nameW: "w-20", barW: "w-[80%]" },
                { nameW: "w-28", barW: "w-[65%]" },
                { nameW: "w-16", barW: "w-[50%]" },
                { nameW: "w-24", barW: "w-[40%]" },
                { nameW: "w-32", barW: "w-[30%]" },
                { nameW: "w-12", barW: "w-[25%]" },
                { nameW: "w-20", barW: "w-[15%]" }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center gap-4 w-full h-6">
                  {/* Fake Y-Axis label */}
                  <div className={`h-2.5 bg-zinc-100 rounded-xs shrink-0 ${row.nameW}`} />
                  {/* Bar */}
                  <div className="flex-1 h-3 bg-zinc-100/60 rounded-r-xs flex items-center">
                    <div className={`h-3 bg-zinc-100 rounded-r-xs ${row.barW}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Fake X-Axis labels at the bottom */}
            <div className="absolute bottom-0 left-36 right-2 flex justify-between border-t border-zinc-100 pt-1.5 animate-pulse">
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    const data = analyticsData?.breakdowns?.referrersFull || [];
    if (data.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 mt-2 text-zinc-400 font-mono text-xs bg-white text-center py-8">
          No referrer URLs recorded
        </div>
      );
    }

    // Set height dynamically: 26px per item, minimum 300px
    const chartHeight = Math.max(300, data.length * 26);

    return (
      <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white max-h-[450px] overflow-y-auto pr-2 min-w-0 overflow-hidden">
        <div style={{ height: `${chartHeight}px` }} className="w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart 
              key={period}
              data={data} 
              layout="vertical" 
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#71717a" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                width={150}
              />
              <Tooltip 
                formatter={(value) => [value.toLocaleString(), "Views"]} 
                contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} 
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Recharts User Retention Graph
  const renderRetentionGraph = () => {
    if (showSkeleton) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white">
          <div className="h-[200px] w-full flex flex-col justify-between font-mono text-[9px] relative overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
              <div className="border-b border-zinc-50 w-full" />
            </div>
            
            {/* SVG area/line skeleton */}
            <div className="absolute inset-0 flex items-end pl-8 pr-4 pb-6">
              <svg className="w-full h-full text-zinc-100/70" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 0 10 Q 25 30 50 60 T 100 80 L 100 100 L 0 100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                />
                <path
                  d="M 0 10 Q 25 30 50 60 T 100 80"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              </svg>
            </div>
            
            {/* Axes placeholders */}
            <div className="w-full h-full flex flex-col justify-between pb-6 pl-8 relative z-10">
              <div className="flex justify-between w-full">
                <div className="w-8 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-6 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-7 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
              <div className="flex justify-between w-full">
                <div className="w-4 h-2 bg-zinc-100 animate-pulse rounded-xs -ml-8" />
              </div>
            </div>
            
            {/* Fake X-axis labels */}
            <div className="flex justify-between pl-8 pr-4 pt-2 border-t border-zinc-100 relative z-10 animate-pulse">
              <div className="w-8 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2.5 bg-zinc-100 rounded-xs" />
              <div className="w-8 h-2.5 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    const data = analyticsData?.retention || [];
    if (data.length === 0) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white text-center py-8 font-mono text-xs text-zinc-400">
          No active users currently (No retention data)
        </div>
      );
    }

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
          <div className="bg-white border border-zinc-150 p-2 font-mono text-[10px] text-zinc-800 shadow-xs">
            <p className="font-bold text-zinc-950">Duration: &gt;= {dataPoint.duration}</p>
            <p className="mt-1">Active Users: {dataPoint.users.toLocaleString()}</p>
            <p>Retention Rate: {dataPoint.percentage}%</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white min-w-0 overflow-hidden">
        <div className="h-[180px] sm:h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart key={period} data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="retentionColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis 
                dataKey="duration" 
                stroke="#a1a1aa" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(tick) => `${tick}%`}
                dx={-5}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#8b5cf6" 
                strokeWidth={1.5} 
                fillOpacity={1} 
                fill="url(#retentionColor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Horizontal Bar Chart for Active Session Cities
  const renderLiveCitiesChart = () => {
    if (showSkeleton) {
      return (
        <div className="w-full border border-zinc-100 rounded-sm p-4 mt-2 bg-white">
          <div className="h-[200px] w-full flex font-mono text-[9px] relative overflow-hidden p-2">
            {/* Grid lines (vertical) */}
            <div className="absolute inset-0 flex justify-between px-2 pl-28 pb-6 pointer-events-none">
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
              <div className="border-r border-zinc-50 h-full" />
            </div>
            
            <div className="w-full h-full flex flex-col justify-between pb-6 relative z-10 animate-pulse">
              {[
                { nameW: "w-16", barW: "w-[75%]" },
                { nameW: "w-20", barW: "w-[60%]" },
                { nameW: "w-12", barW: "w-[45%]" },
                { nameW: "w-24", barW: "w-[30%]" },
                { nameW: "w-16", barW: "w-[15%]" }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center gap-4 w-full h-6">
                  {/* Fake Y-Axis label */}
                  <div className={`h-2.5 bg-zinc-100 rounded-xs shrink-0 ${row.nameW}`} />
                  {/* Bar */}
                  <div className="flex-1 h-3 bg-zinc-100/60 rounded-r-xs flex items-center">
                    <div className={`h-3 bg-zinc-100 rounded-r-xs ${row.barW}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Fake X-Axis labels at the bottom */}
            <div className="absolute bottom-0 left-28 right-2 flex justify-between border-t border-zinc-100 pt-1.5 animate-pulse">
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
              <div className="w-6 h-2 bg-zinc-100 rounded-xs" />
            </div>
          </div>
        </div>
      );
    }

    const data = analyticsData?.liveCities || [];
    if (data.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 mt-2 text-zinc-400 font-mono text-xs bg-white text-center py-8">
          No live visitors in any cities currently
        </div>
      );
    }

    // Set height dynamically: 26px per item, minimum 200px
    const chartHeight = Math.max(200, data.length * 26);

    return (
      <div className="w-full border border-zinc-100 rounded-sm p-3 sm:p-4 mt-2 bg-white max-h-[300px] overflow-y-auto pr-2 min-w-0 overflow-hidden">
        <div style={{ height: `${chartHeight}px` }} className="w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart 
              key={period}
              data={data} 
              layout="vertical" 
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#a1a1aa" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#71717a" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                width={100}
              />
              <Tooltip 
                formatter={(value) => [value.toLocaleString(), "Active Sessions"]} 
                contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} 
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Prepare Chart Data
  const countryData = (analyticsData?.breakdowns?.countries || []).map((c) => ({
    name: c.name,
    value: c.count
  }));

  const cityData = (analyticsData?.breakdowns?.cities || []).map((c) => ({
    name: c.name,
    value: c.count
  }));

  const referrerData = (analyticsData?.breakdowns?.referrers || []).map((r) => ({
    name: r.name,
    value: r.count
  }));

  const referrerFullData = (analyticsData?.breakdowns?.referrersFull || []).map((r) => ({
    name: r.name,
    value: r.count
  }));

  const deviceData = (analyticsData?.breakdowns?.devices || []).map((d) => ({
    name: d.name,
    value: d.count
  }));

  const osData = (analyticsData?.breakdowns?.os || []).map((o) => ({
    name: o.name,
    value: o.count
  }));

  // Resolve State Data mapping city names to regions
  const stateData = (() => {
    const cityToState = {
      "Delhi": "Delhi",
      "Mumbai": "Maharashtra",
      "Patna": "Bihar",
      "Bangalore": "Karnataka",
      "Pune": "Maharashtra",
      "Kolkata": "West Bengal",
      "Hyderabad": "Telangana",
      "Chennai": "Tamil Nadu",
      "New York": "New York",
      "London": "England",
      "Toronto": "Ontario",
      "Sydney": "New South Wales"
    };
    const stateMap = {};
    (analyticsData?.breakdowns?.cities || []).forEach((c) => {
      const stateName = cityToState[c.name] || "Other";
      stateMap[stateName] = (stateMap[stateName] || 0) + c.count;
    });
    return Object.entries(stateMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto pt-12 lg:pt-0">
          
          <div className="flex flex-col gap-8">
            
            {/* Header & Main Minimalist Metrics */}
            <div className="border-b border-zinc-100 pb-5">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-bold text-zinc-900 font-sans">Analytics</h1>
                
                {/* Simple Period Filter */}
                {/* <div className="flex gap-4">
                  {['24h', '7d', '30d'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`text-xs font-medium transition-all ${
                        period === p 
                          ? "text-zinc-950 underline underline-offset-4 font-bold" 
                          : "text-zinc-400 hover:text-zinc-600"
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div> */}
              </div>

              {/* Minimalist Stats Row */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-xs text-zinc-500 font-mono">
                <div>
                  Views: {showSkeleton ? (
                    <span className="inline-block w-12 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{analyticsData?.metrics?.totalViews?.toLocaleString()}</span>
                  )}
                </div>
                <div>
                  Unique Visitors: {showSkeleton ? (
                    <span className="inline-block w-12 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{analyticsData?.metrics?.uniqueUsers?.toLocaleString()}</span>
                  )}
                </div>
                {/* <div>
                  Conversion: {showSkeleton ? (
                    <span className="inline-block w-10 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{analyticsData?.metrics?.conversionRate || "0.0"}%</span>
                  )}
                </div> */}
              </div>
            </div>

            {/* Line Funnel Conversion Graph */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Funnel Conversion Graph</h2>
              {renderFunnelGraph()}
            </div>

            {/* User Retention Curve */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">User Retention Over Time</h2>
              {renderRetentionGraph()}
            </div>

            {/* Hourly Traffic Graph */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Hourly Traffic Trend</h2>
              {renderHourlyGraph()}
            </div>

            {/* Country Donut Chart */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Country Distribution</h2>
              {renderDonutChart(countryData, "countries-donut")}
            </div>

            {/* Regional Donut Charts (State & City) */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Regional Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-zinc-400 font-mono block mb-1">State Share</span>
                  {renderDonutChart(stateData, "states-donut")}
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-mono block mb-1">City Share</span>
                  {renderDonutChart(cityData, "cities-donut")}
                </div>
              </div>
            </div>

            {/* Traffic Sources Bar Chart */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Traffic Sources</h2>
              {renderBarChart(referrerData, "referrers-bar")}
            </div>

            {/* Exact Referrer URLs Horizontal Bar Chart */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Exact Referrer URLs</h2>
              {renderReferrersFullChart()}
            </div>

            {/* Device Type & OS Bar Charts */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Device Distribution</h2>
                  {renderBarChart(deviceData, "devices-bar")}
                </div>
                <div>
                  <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Operating Systems</h2>
                  {renderBarChart(osData, "os-bar")}
                </div>
              </div>
            </div>

            {/* Active Session Cities */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Active Session Cities</h2>
              {renderLiveCitiesChart()}
            </div>

            {/* Visited Pages Bar Chart */}
            <div>
              <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Most Visited Pages</h2>
              {renderPagesChart()}
            </div>

          </div>
          
        </div>
      </main>
    </div>
  );
}
