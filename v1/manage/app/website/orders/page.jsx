"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Search,
  Eye,
  IndianRupee,
  Copy,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Calendar,
  X,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area
} from "recharts";

const statusInfo = {
  pending: { label: "Pending", textClass: "text-amber-600", dotClass: "bg-amber-500" },
  confirmed: { label: "Confirmed", textClass: "text-blue-600", dotClass: "bg-blue-500" },
  shipped: { label: "Shipped", textClass: "text-purple-600", dotClass: "bg-purple-500" },
  delivered: { label: "Delivered", textClass: "text-emerald-600", dotClass: "bg-emerald-500" },
  cancelled: { label: "Cancelled", textClass: "text-red-600", dotClass: "bg-red-500" }
};

const statusIcons = {
  pending: Clock,
  confirmed: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle
};

const shades = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function WebsiteOrdersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [customTrackingMsg, setCustomTrackingMsg] = useState("");
  const [customTrackingLoc, setCustomTrackingLoc] = useState("");
  const [customTrackingStatus, setCustomTrackingStatus] = useState("processing");
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
  const [isInsysAuth, setIsInsysAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("insys_auth");
    if (auth) {
      const authData = JSON.parse(auth);
      setIsInsysAuth(authData.isLoggedIn);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch orders with optional filters
  const orders = useQuery(api.orders.getOrdersWithFilters, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    searchQuery: debouncedSearch || undefined,
    limit: 100
  });

  // Fetch real-time statistics
  const stats = useQuery(api.orders.getOrderStats) || {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    todayOrders: 0
  };

  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const addDeliveryUpdate = useMutation(api.orders.addDeliveryUpdate);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: {
        background: "#18181b",
        color: "#fff",
        fontSize: "11px",
        fontFamily: "monospace",
        borderRadius: "4px",
      }
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateStatus({ orderId, status: newStatus, updatedBy: "Admin Portal" });
      toast.success(`Order status updated to ${newStatus}`);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAddTrackingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !customTrackingMsg.trim()) return;

    setIsSubmittingTracking(true);
    try {
      const res = await addDeliveryUpdate({
        orderId: selectedOrder._id,
        status: customTrackingStatus,
        message: customTrackingMsg,
        location: customTrackingLoc || undefined,
        updatedBy: "Admin"
      });

      if (res.success) {
        toast.success("Delivery update logged successfully!");
        setCustomTrackingMsg("");
        setCustomTrackingLoc("");
        setSelectedOrder(prev => ({
          ...prev,
          status: customTrackingStatus,
          deliveryDetails: [
            ...(prev.deliveryDetails || []),
            res.deliveryUpdate
          ]
        }));
      }
    } catch (err) {
      toast.error(`Error adding update: ${err.message}`);
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const handleOpenDrawer = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Group cities data
  const cityData = (() => {
    const counts = {};
    (orders || []).forEach((order) => {
      const city = order.shippingDetails?.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })();

  // Group top products data
  const productData = (() => {
    const counts = {};
    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.name || "Unknown Product";
        counts[name] = (counts[name] || 0) + (item.quantity || 1);
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })();

  // Group chronological trend data (lifetime)
  const trendData = (() => {
    if (!orders || orders.length === 0) return [];

    const counts = {};
    (orders || []).forEach((order) => {
      const date = new Date(order.createdAt);
      date.setMinutes(0, 0, 0); // truncate to start of hour
      const hourStart = date.getTime();
      counts[hourStart] = (counts[hourStart] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([timestampStr, count]) => {
        const timestamp = parseInt(timestampStr);
        const date = new Date(timestamp);
        const formatted = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "numeric",
          hour12: true
        });
        return {
          timeLabel: formatted,
          timestamp,
          count
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  })();

  const renderCitiesChart = () => {
    if (!orders || orders.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 text-zinc-400 font-mono text-[11px] bg-white text-center py-10 flex-1">
          No order location data
        </div>
      );
    }
    return (
      <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 bg-white flex-1 min-w-0 w-full overflow-hidden">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Order Locations (Cities)</h3>
        <div className="h-[140px] w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart key={`${statusFilter}-${debouncedSearch}`} data={cityData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} dy={5} />
              <YAxis stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Orders"]} contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {cityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderProductsChart = () => {
    if (!orders || orders.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 text-zinc-400 font-mono text-[11px] bg-white text-center py-10 flex-1">
          No product sales data
        </div>
      );
    }

    return (
      <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 bg-white flex-1 min-w-0 w-full overflow-hidden">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Top Products (Units Sold)</h3>
        <div className="h-[140px] w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart key={`${statusFilter}-${debouncedSearch}`} data={productData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} dy={5} tickFormatter={(name) => name.length > 8 ? name.substring(0, 8) + ".." : name} />
              <YAxis stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Units"]} contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    if (!orders || orders.length === 0) {
      return (
        <div className="border border-zinc-100 rounded-sm p-4 text-zinc-400 font-mono text-[11px] bg-white text-center py-10 flex-1">
          No order trend data
        </div>
      );
    }
    return (
      <div className="border border-zinc-100 rounded-sm p-3 sm:p-4 bg-white flex-1 min-w-0 w-full overflow-hidden">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Order Trend (Lifetime)</h3>
        <div className="h-[140px] w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart key={`${statusFilter}-${debouncedSearch}`} data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="orderTrendColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#a1a1aa" fontSize={8} tickLine={false} axisLine={false} dy={5} minTickGap={20} />
              <YAxis stroke="#a1a1aa" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Orders"]} contentStyle={{ fontSize: '9px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#orderTrendColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (!isInsysAuth) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm p-6 bg-white rounded-sm border border-zinc-100">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3 animate-pulse" />
            <h2 className="text-sm font-bold text-zinc-950 mb-1 font-mono uppercase tracking-wider">Authentication Required</h2>
            <p className="text-zinc-500 mb-5 text-xs">Please log in to your inventory system account to manage website orders.</p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-zinc-950 text-white rounded-xs font-semibold hover:bg-zinc-800 transition-colors text-xs font-mono uppercase tracking-wider"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto pt-12 lg:pt-0">
          
          <div className="flex flex-col gap-6">
            
            {/* Header & Minimalist Metrics (The Analytics Way) */}
            <div className="border-b border-zinc-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-base font-bold text-zinc-900 font-sans">Orders</h1>
                
                {/* Minimalist Status Filter (Top-Right) */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] sm:text-xs">
                  {[
                    { id: "all", label: "ALL" },
                    { id: "pending", label: "PENDING" },
                    { id: "confirmed", label: "CONFIRMED" },
                    { id: "shipped", label: "SHIPPED" },
                    { id: "delivered", label: "DELIVERED" },
                    { id: "cancelled", label: "CANCELLED" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setStatusFilter(btn.id)}
                      className={`font-medium transition-all ${
                        statusFilter === btn.id 
                          ? "text-zinc-950 underline underline-offset-4 font-bold" 
                          : "text-zinc-400 hover:text-zinc-650"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimalist Stats Row */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-xs text-zinc-500 font-mono">
                <div>
                  Total Orders: {orders === undefined ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{stats.total || 0}</span>
                  )}
                </div>
                <div>
                  Pending: {orders === undefined ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{stats.pending || 0}</span>
                  )}
                </div>
                <div>
                  Confirmed: {orders === undefined ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{stats.confirmed || 0}</span>
                  )}
                </div>
                <div>
                  In Transit: {orders === undefined ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{stats.shipped || 0}</span>
                  )}
                </div>
                <div>
                  Total Sales: {orders === undefined ? (
                    <span className="inline-block w-16 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Charts Grid */}
            {orders === undefined ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-zinc-100 rounded-sm p-4 bg-white h-[180px] flex items-center justify-center font-mono text-xs text-zinc-400">
                    <div className="w-5 h-5 border border-zinc-300 border-t-zinc-950 rounded-full animate-spin mr-2" />
                    Loading dashboard charts...
                  </div>
                  <div className="border border-zinc-100 rounded-sm p-4 bg-white h-[180px] flex items-center justify-center font-mono text-xs text-zinc-400">
                    <div className="w-5 h-5 border border-zinc-300 border-t-zinc-950 rounded-full animate-spin mr-2" />
                    Loading dashboard charts...
                  </div>
                </div>
                <div className="border border-zinc-100 rounded-sm p-4 bg-white h-[180px] flex items-center justify-center font-mono text-xs text-zinc-400">
                  <div className="w-5 h-5 border border-zinc-300 border-t-zinc-950 rounded-full animate-spin mr-2" />
                  Loading dashboard charts...
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderCitiesChart()}
                  {renderProductsChart()}
                </div>
                {renderTrendChart()}
              </div>
            )}

            {/* Search Input Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between font-mono text-xs mt-1">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search Order ID, Client, Pincode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs focus:outline-none transition-all text-xs font-sans"
                />
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="w-full border border-zinc-100 rounded-sm overflow-hidden bg-white mt-2">
              {!orders ? (
                <div className="py-24 text-center font-mono text-xs text-zinc-400">
                  <div className="w-6 h-6 border border-zinc-300 border-t-zinc-950 rounded-full animate-spin mx-auto mb-3" />
                  Synchronizing with system database...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-24 text-center font-mono text-xs text-zinc-400 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 mb-4 overflow-hidden rounded-full border border-zinc-100 bg-zinc-50 flex items-center justify-center select-none shrink-0">
                    <video 
                      src="/n0-data.mp4" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover filter grayscale opacity-90"
                    />
                  </div>
                  <span>No orders found in this filter.</span>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 font-bold text-[9px] uppercase tracking-wider">
                          <th className="px-4 py-3">Order Number</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Items</th>
                          <th className="px-4 py-3 text-right">Payment</th>
                          <th className="px-4 py-3 text-center">Fulfillment</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {orders.map((order) => {
                          const conf = statusInfo[order.status] || statusInfo.pending;
                          return (
                            <tr key={order._id} className="hover:bg-zinc-50/30 transition-colors">
                              {/* Order number & Date */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span 
                                    className="font-bold text-zinc-950 hover:underline cursor-pointer"
                                    onClick={() => handleOpenDrawer(order)}
                                  >
                                    {order.orderNumber}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(order.orderNumber, "Order ID")}
                                    className="text-zinc-350 hover:text-zinc-650 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-zinc-450 block mt-0.5 font-sans">
                                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </td>

                              {/* Customer */}
                              <td className="px-4 py-3 font-sans">
                                <div className="font-bold text-zinc-950">{order.shippingDetails?.fullName}</div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">{order.shippingDetails?.city}, {order.shippingDetails?.state}</div>
                              </td>

                              {/* Items */}
                              <td className="px-4 py-3 font-sans">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2.5 overflow-hidden">
                                    {order.items?.slice(0, 3).map((item, idx) => (
                                      <img
                                        key={idx}
                                        src={item.image}
                                        alt={item.name}
                                        className="inline-block h-7 w-7 rounded-sm ring-1 ring-white object-cover bg-zinc-50 border border-zinc-100"
                                      />
                                    ))}
                                  </div>
                                  <div className="text-[11px]">
                                    <span className="font-bold text-zinc-800">{order.items?.length || 0} items</span>
                                    <span className="text-[9px] text-zinc-400 block font-mono">
                                      QTY: {order.items?.reduce((sum, item) => sum + item.quantity, 0)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Payment details */}
                              <td className="px-4 py-3 text-right">
                                {order.paymentDetails?.paymentMethod?.toLowerCase() === "cod" ? (
                                  <div className="space-y-0.5 font-mono text-[11px]">
                                    <div className="font-extrabold text-zinc-950">₹{order.orderTotal?.toLocaleString("en-IN")}</div>
                                    <div className="text-[9px] text-emerald-600">Paid upfront: ₹{(order.paymentDetails?.codCharge || 100).toLocaleString("en-IN")}</div>
                                    <div className="text-[9px] text-amber-700 font-bold">Due: ₹{(order.paymentDetails?.remainingCOD || (order.orderTotal - 100)).toLocaleString("en-IN")}</div>
                                    <span className="inline-block text-[8px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded-sm uppercase tracking-wider font-sans mt-0.5">COD Split</span>
                                  </div>
                                ) : (
                                  <div className="font-mono">
                                    <div className="font-extrabold text-zinc-950">₹{order.orderTotal?.toLocaleString("en-IN")}</div>
                                    <span className="inline-block text-[8px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 rounded-sm uppercase tracking-wider font-sans mt-0.5">
                                      {order.paymentDetails?.paymentMethod || "prepaid"}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Fulfillment status */}
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${conf.textClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`} />
                                  <span>{conf.label}</span>
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right font-sans">
                                <div className="flex items-center justify-end gap-2">
                                  <select
                                    value={order.status}
                                    disabled={updatingOrderId === order._id}
                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                    className="px-1.5 py-1 bg-white border border-zinc-200 hover:border-zinc-950 rounded-xs text-[10px] font-semibold focus:outline-none cursor-pointer"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>

                                  <button
                                    onClick={() => handleOpenDrawer(order)}
                                    className="p-1 text-zinc-400 hover:text-zinc-950 transition-colors"
                                    title="View details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Order Cards */}
                  <div className="md:hidden divide-y divide-zinc-50">
                    {orders.map((order) => {
                      const conf = statusInfo[order.status] || statusInfo.pending;
                      return (
                        <div key={order._id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-950 text-xs cursor-pointer" onClick={() => handleOpenDrawer(order)}>
                                  {order.orderNumber}
                                </span>
                                <button onClick={() => copyToClipboard(order.orderNumber, "Order ID")} className="text-zinc-350"><Copy className="w-3 h-3" /></button>
                              </div>
                              <span className="text-[10px] text-zinc-400 block mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${conf.textClass}`}>
                              <span className={`w-1 h-1 rounded-full ${conf.dotClass}`} />
                              {conf.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-zinc-950">{order.shippingDetails?.fullName}</p>
                              <p className="text-[10px] text-zinc-400">{order.shippingDetails?.city}, {order.shippingDetails?.state}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-zinc-950">₹{order.orderTotal?.toLocaleString("en-IN")}</p>
                              <p className="text-[8px] text-zinc-400 uppercase">{order.paymentDetails?.paymentMethod || "prepaid"}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex -space-x-1.5 overflow-hidden items-center">
                              {order.items?.slice(0, 3).map((item, idx) => (
                                <img key={idx} src={item.image} alt={item.name} className="inline-block w-6 h-6 rounded-sm ring-1 ring-white object-cover bg-zinc-50" />
                              ))}
                              <span className="text-[10px] text-zinc-405 ml-2 font-sans">{order.items?.length} items</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <select value={order.status} disabled={updatingOrderId === order._id} onChange={(e) => handleStatusChange(order._id, e.target.value)} className="px-1 py-0.5 bg-white border border-zinc-200 rounded-xs text-[10px] font-semibold focus:outline-none cursor-pointer">
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button onClick={() => handleOpenDrawer(order)} className="p-1 text-zinc-400 hover:text-zinc-950"><Eye className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Sliding Sheet Drawer (Minimalist style) */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay backdrop */}
          <div
            onClick={handleCloseDrawer}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-lg bg-white shadow-xl flex flex-col h-full border-l border-zinc-100">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Order Sheet</span>
                  <h2 className="text-sm font-bold text-zinc-950 tracking-tight">Order #{selectedOrder.orderNumber}</h2>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-950 rounded-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs">
                
                {/* Status Indicator Banner */}
                <div className={`p-4 border rounded-xs flex items-center justify-between bg-zinc-50/50 border-zinc-150`}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white border border-zinc-100 rounded-xs">
                      {(() => {
                        const Icon = statusIcons[selectedOrder.status] || Clock;
                        return <Icon className="w-4 h-4 text-zinc-700" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider font-mono">Pipeline Status</p>
                      <p className="text-xs font-bold capitalize mt-0.5 text-zinc-900">{selectedOrder.status}</p>
                    </div>
                  </div>

                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="px-2 py-1 bg-white border border-zinc-200 rounded-xs text-[10px] font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Grid: Client & Settlement */}
                <div className="grid grid-cols-1 gap-4 font-mono">
                  {/* Customer Info */}
                  <div className="bg-zinc-50/30 border border-zinc-100 rounded-xs p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-zinc-900 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-100 pb-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Customer</span>
                    </div>
                    <div className="space-y-2 text-zinc-650">
                      <div>
                        <span className="text-zinc-400 text-[10px]">Name</span>
                        <span className="block font-bold text-zinc-950 font-sans">{selectedOrder.shippingDetails?.fullName}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px]">Email</span>
                        <a href={`mailto:${selectedOrder.shippingDetails?.email}`} className="block text-blue-600 hover:underline">
                          {selectedOrder.shippingDetails?.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px]">Phone</span>
                        <a href={`tel:${selectedOrder.shippingDetails?.phone}`} className="block text-zinc-950 font-bold hover:underline">
                          {selectedOrder.shippingDetails?.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-zinc-50/30 border border-zinc-100 rounded-xs p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-zinc-900 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-100 pb-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Financials</span>
                    </div>
                    <div className="space-y-2 text-zinc-650">
                      <div>
                        <span className="text-zinc-400 text-[10px]">Settlement</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                          selectedOrder.paymentDetails?.status === "completed" || selectedOrder.paymentDetails?.status === "paid"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}>
                          {selectedOrder.paymentDetails?.status || "pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px]">Gateway Method</span>
                        <span className="block font-bold text-zinc-950 uppercase">{selectedOrder.paymentDetails?.paymentMethod || "cod"}</span>
                      </div>
                      {selectedOrder.paymentDetails?.paymentMethod?.toLowerCase() === "cod" ? (
                        <div className="space-y-1.5 pt-1.5 border-t border-dashed border-zinc-100">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Paid Upfront</span>
                            <span className="font-bold text-emerald-600">₹{selectedOrder.paymentDetails?.codCharge?.toLocaleString("en-IN") || "100.00"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">COD Remaining</span>
                            <span className="font-bold text-amber-700">₹{selectedOrder.paymentDetails?.remainingCOD?.toLocaleString("en-IN") || (selectedOrder.orderTotal - 100).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed border-zinc-100 pt-1.5 font-bold text-zinc-950">
                            <span>Grand Total</span>
                            <span>₹{selectedOrder.orderTotal?.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between pt-1 border-t border-dashed border-zinc-100 font-bold text-zinc-950">
                          <span>Total Paid</span>
                          <span>₹{selectedOrder.orderTotal?.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-zinc-50/30 border border-zinc-100 rounded-xs p-3 sm:p-4 space-y-3 font-sans">
                  <div className="flex items-center gap-1.5 text-zinc-900 font-bold uppercase tracking-wider text-[9px] border-b border-zinc-100 pb-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Shipping Destination</span>
                  </div>
                  <div className="text-xs text-zinc-600 space-y-1.5">
                    <p className="text-zinc-950 font-bold">{selectedOrder.shippingDetails?.fullName}</p>
                    <p className="leading-relaxed">
                      {selectedOrder.shippingDetails?.flatNo && `${selectedOrder.shippingDetails?.flatNo}, `}
                      {selectedOrder.shippingDetails?.area && `${selectedOrder.shippingDetails?.area}, `}
                      {selectedOrder.shippingDetails?.landmark && `Near ${selectedOrder.shippingDetails?.landmark}, `}
                      {selectedOrder.shippingDetails?.address}
                    </p>
                    <p className="font-bold text-zinc-950 font-mono">
                      {selectedOrder.shippingDetails?.city}, {selectedOrder.shippingDetails?.state} - {selectedOrder.shippingDetails?.pincode}
                    </p>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div>
                  <div className="border-b border-zinc-100 pb-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[9px] font-mono flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Ordered Items ({selectedOrder.items?.length})</span>
                    </div>
                  </div>

                  <div className="space-y-2 font-mono">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-zinc-50/30 border border-zinc-100 p-2.5 rounded-xs">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xs object-cover bg-white border border-zinc-150"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-950 text-xs truncate font-sans">{item.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                            <span className="bg-white border border-zinc-200 px-1 rounded-xs">SIZE: {item.size}</span>
                            <span>QTY: {item.quantity}</span>
                            <span>PRICE: ₹{item.price}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-950">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics Integration (Shiprocket) */}
                {selectedOrder.shiprocketDetails?.awbCode && (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-150 rounded-xs flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-[8px] text-blue-500 font-bold uppercase tracking-wider">Shiprocket Logistic</p>
                        <p className="text-xs text-zinc-950 font-bold">AWB: {selectedOrder.shiprocketDetails.awbCode}</p>
                      </div>
                    </div>
                    <a
                      href={selectedOrder.shiprocketDetails.trackingUrl || `https://shiprocket.co/tracking/${selectedOrder.shiprocketDetails.awbCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xs text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer font-sans"
                    >
                      <span>Track</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Delivery updates logs */}
                <div className="border-t border-zinc-100 pt-5 font-mono">
                  <h3 className="text-zinc-900 font-bold uppercase tracking-wider text-[9px] mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Fulfillment Logs</span>
                  </h3>

                  <div className="relative pl-4 border-l border-zinc-150 space-y-4 ml-2">
                    {selectedOrder.deliveryDetails?.map((detail, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-4 -translate-x-1/2 top-1 bg-white p-0.5 rounded-full border border-zinc-950">
                          <CheckCircle2 className="w-2.5 h-2.5 text-zinc-950" />
                        </span>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-zinc-950 capitalize">
                              {detail.status?.replace("_", " ")}
                            </span>
                            <span className="text-[9px] text-zinc-400">
                              {new Date(detail.timestamp).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="text-zinc-500 mt-0.5 font-sans leading-normal">{detail.message}</p>
                          {detail.location && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-zinc-50 text-zinc-500 rounded-xs text-[9px] border border-zinc-150">
                              <MapPin className="w-2 h-2" />
                              <span>{detail.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {(!selectedOrder.deliveryDetails || selectedOrder.deliveryDetails.length === 0) && (
                      <div className="text-zinc-400 italic py-1 pl-1">
                        No updates logged yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Log Delivery Update Form */}
                <div className="border-t border-zinc-100 pt-5 font-mono">
                  <h3 className="text-zinc-900 font-bold uppercase tracking-wider text-[9px] mb-3">Add Log Entry</h3>
                  <form onSubmit={handleAddTrackingUpdate} className="space-y-3 bg-zinc-50/50 p-3 sm:p-4 border border-zinc-150 rounded-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Status Step</label>
                        <select
                          value={customTrackingStatus}
                          onChange={(e) => setCustomTrackingStatus(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-xs text-[11px] focus:outline-none focus:border-zinc-950 cursor-pointer"
                        >
                          <option value="processing">Processing</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out For Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Hub Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Delhi Hub"
                          value={customTrackingLoc}
                          onChange={(e) => setCustomTrackingLoc(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-xs text-[11px] focus:outline-none focus:border-zinc-950 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Update Message</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Package arrived at local sorting office."
                        value={customTrackingMsg}
                        onChange={(e) => setCustomTrackingMsg(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-xs text-[11px] focus:outline-none focus:border-zinc-950 font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingTracking || !customTrackingMsg.trim()}
                      className="w-full py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1 font-sans uppercase tracking-wider text-[10px]"
                    >
                      {isSubmittingTracking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Logging...</span>
                        </>
                      ) : (
                        <span>Log Progress</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
