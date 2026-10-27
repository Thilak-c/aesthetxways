"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  Search,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  Upload,
  Copy,
  ChevronRight,
  IndianRupee,
  Layers,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { processImageForUpload } from "@/lib/imageHelper";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
const SIZE_MAP = {
  S: "28",
  M: "30",
  L: "32",
  XL: "34",
  XXL: "36",
  XXXL: "38"
};
const DEFAULT_COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi", "Orange", "Purple", "Silver", "Golden", "Rose Gold", "Copper"];

const DEFAULT_CATEGORY_MAP = {
  footwear: ["Shoes", "boots", "sandals", "sneakers"],
  apparel: ["Shirts", "t-shirts", "Waffle T-shirt", "jackets", "pants", "jeans", "dresses", "socks", "jersey", "jerseys"],
  headwear: ["Hats", "caps", "beanies"],
  eyewear: ["Glasses", "sunglasses"]
};

export default function WebsiteProducts() {
  const catalogConfig = useQuery(api.siteSettings.getCatalogConfig);
  const COLORS = catalogConfig?.colors || DEFAULT_COLORS;
  const CATEGORY_MAP = catalogConfig?.categoryMap || DEFAULT_CATEGORY_MAP;
  const MAIN_CATEGORIES = [
    { value: "all", label: "ALL CATEGORIES" },
    ...(catalogConfig?.mainCategories || [
      { value: "footwear", label: "Footwear" },
      { value: "apparel", label: "Apparel / Clothing" },
      { value: "headwear", label: "Headwear" },
      { value: "eyewear", label: "Eyewear" }
    ]).map((m) => ({ value: m.value, label: m.label.toUpperCase() }))
  ];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); 
  const [activeSubTab, setActiveSubTab] = useState("all"); 
  const [sortBy, setSortBy] = useState("sku_asc");
  const [visibleCount, setVisibleCount] = useState(15);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [uploadingState, setUploadingState] = useState({ main: false, secondary: false });

  // Reset visible count when filters or search change
  useEffect(() => {
    setVisibleCount(15);
  }, [search, filter, activeTab, activeSubTab, sortBy]);

  // Fetch website inventory
  const products = useQuery(api.products.getProductsForWebsiteList);
  const updateProductFull = useMutation(api.products.updateProductFull);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const toggleHideProduct = useMutation(api.products.toggleHideProduct);

  const handleToggleHide = async (p, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await toggleHideProduct({ productId: p._id });
      if (res.isHidden) {
        toast.success(`"${p.name}" is now HIDDEN from the website.`);
      } else {
        toast.success(`"${p.name}" is now VISIBLE on the website.`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to change product visibility.");
    }
  };

  let filtered = products || [];
  if (search) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const matchesName = p.name?.toLowerCase().includes(s);
      let matchesSku = false;
      const itemId = p.itemId?.toLowerCase() || "";
      if (itemId.includes(s)) {
        const parts = itemId.split('-');
        const suffix = parts[parts.length - 1];
        if (suffix && suffix.includes(s)) {
          matchesSku = true;
        } else {
          const parsedS = parseInt(s, 10);
          const parsedSuffix = parseInt(suffix, 10);
          if (!isNaN(parsedS) && !isNaN(parsedSuffix) && parsedS === parsedSuffix) {
            matchesSku = true;
          } else if (/[a-zA-Z\-]/.test(s)) {
            matchesSku = true;
          }
        }
      }
      return matchesName || matchesSku;
    });
  }

  // Apply Category Tab Filtering
  if (activeTab !== "all") {
    filtered = filtered.filter(p => p.mainCategory?.toLowerCase() === activeTab.toLowerCase());
    if (activeSubTab !== "all") {
      filtered = filtered.filter(p => p.category?.toLowerCase() === activeSubTab.toLowerCase());
    }
  }

  if (filter === "in") filtered = filtered.filter((p) => (p.currentStock || p.totalAvailable || 0) > 10);
  if (filter === "low") filtered = filtered.filter((p) => (p.currentStock || p.totalAvailable || 0) > 0 && (p.currentStock || p.totalAvailable || 0) <= 10);
  if (filter === "out") filtered = filtered.filter((p) => (p.currentStock || p.totalAvailable || 0) === 0);
  if (filter === "hidden") filtered = filtered.filter((p) => p.isHidden);
  if (filter === "visible") filtered = filtered.filter((p) => !p.isHidden);

  // Apply sorting options
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "sku_asc") {
      return (a.itemId || "").localeCompare(b.itemId || "", undefined, { numeric: true, sensitivity: "base" });
    }
    if (sortBy === "sku_desc") {
      return (b.itemId || "").localeCompare(a.itemId || "", undefined, { numeric: true, sensitivity: "base" });
    }
    if (sortBy === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "name_desc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (sortBy === "price_desc") {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === "price_asc") {
      return (a.price || 0) - (b.price || 0);
    }
    const stockA = a.currentStock || a.totalAvailable || 0;
    const stockB = b.currentStock || b.totalAvailable || 0;
    if (sortBy === "stock_desc") {
      return stockB - stockA;
    }
    if (sortBy === "stock_asc") {
      return stockA - stockB;
    }
    return 0;
  });

  useEffect(() => {
    if (visibleCount >= filtered.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 15, filtered.length));
      }
    }, { threshold: 0.1 });
    
    const target = document.getElementById("website-load-more-trigger");
    if (target) observer.observe(target);
    
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const visibleProducts = filtered.slice(0, visibleCount);

  // Fetch full details only when editing
  const handleEdit = async (p) => {
    setLoadingProduct(true);
    try {
      const res = await fetch(`/api/get-product?id=${p._id}`);
      const fullProduct = await res.json();
      if (fullProduct.error) {
        toast.error("Failed to fetch product details.");
        return;
      }
      setEditing(fullProduct);
      setEditForm({
        name: fullProduct.name,
        mainCategory: fullProduct.mainCategory || "footwear",
        category: fullProduct.category || "",
        description: fullProduct.description || "",
        mainImage: fullProduct.mainImage || "",
        otherImages: fullProduct.otherImages || [],
        price: fullProduct.price,
        costPrice: fullProduct.costPrice || 0,
        listedPrice: fullProduct.listedPrice?.toString() || fullProduct.originalPrice?.toString() || "",
        color: fullProduct.color || "",
        secondaryColor: fullProduct.secondaryColor || "",
        sizes: fullProduct.availableSizes || [],
        sizeStock: fullProduct.sizeStock || {},
        sizeDisplayType: fullProduct.sizeDisplayType || "alpha",
        isTopSeller: fullProduct.isTopSeller || false,
      });
    } catch (err) {
      toast.error("Error loading product.");
    } finally {
      setLoadingProduct(false);
    }
  };

  const toggleSize = (size) => {
    const has = editForm.sizes.includes(size);
    const sizes = has ? editForm.sizes.filter((s) => s !== size) : [...editForm.sizes, size];
    const sizeStock = { ...editForm.sizeStock };
    if (has) delete sizeStock[size];
    else sizeStock[size] = 0;
    setEditForm({ ...editForm, sizes, sizeStock });
  };

  const handleSizeDisplayTypeChange = (type) => {
    if (type === "free") {
      setEditForm({
        ...editForm,
        sizeDisplayType: "free",
        sizes: ["OS"],
        sizeStock: { OS: editForm.sizeStock?.["OS"] || 0 }
      });
    } else {
      const sizes = (editForm.sizes || []).filter(s => s !== "OS");
      const sizeStock = { ...(editForm.sizeStock || {}) };
      delete sizeStock["OS"];
      setEditForm({
        ...editForm,
        sizeDisplayType: type,
        sizes,
        sizeStock
      });
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editForm.name || !editForm.price) return toast.error("Product name and selling price are required.");
    if (editForm.sizes.length === 0) return toast.error("Please configure at least one active size.");

    try {
      await updateProductFull({
        id: editing._id,
        name: editForm.name,
        mainCategory: editForm.mainCategory || "footwear",
        category: editForm.category || undefined,
        description: editForm.description || undefined,
        mainImage: editForm.mainImage || "/placeholder.png",
        otherImages: editForm.otherImages.length > 0 ? editForm.otherImages : undefined,
        price: parseFloat(editForm.price),
        costPrice: editForm.costPrice ? parseFloat(editForm.costPrice) : undefined,
        listedPrice: editForm.listedPrice ? parseFloat(editForm.listedPrice) : undefined,
        color: editForm.color || undefined,
        secondaryColor: editForm.secondaryColor || undefined,
        availableSizes: editForm.sizes,
        sizeStock: editForm.sizeStock,
        sizeDisplayType: editForm.sizeDisplayType,
        isTopSeller: editForm.isTopSeller || false,
      });
      toast.success("Product successfully updated!");
      setEditing(null);
    } catch (err) {
      toast.error(err.message || "Failed to update product details.");
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Are you sure you want to permanently delete "${p.name}"?`)) return;

    try {
      await deleteProduct({ _id: p._id });
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete product.");
    }
  };

  const uploadImage = async (file, isMain = true) => {
    if (isMain) setUploadingState(prev => ({ ...prev, main: true }));
    else setUploadingState(prev => ({ ...prev, secondary: true }));

    try {
      const processedFile = await processImageForUpload(file);
      if (!processedFile) return;

      const fd = new FormData();
      fd.append("file", processedFile);

      toast.loading("Uploading photo content...", { id: "upload" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        if (isMain) setEditForm((f) => ({ ...f, mainImage: data.url }));
        else setEditForm((f) => ({ ...f, otherImages: [...f.otherImages, data.url] }));
        toast.success("Photo uploaded successfully!", { id: "upload" });
      } else {
        toast.error("Upload failed.", { id: "upload" });
      }
    } catch {
      toast.error("Upload failed.", { id: "upload" });
    } finally {
      if (isMain) setUploadingState(prev => ({ ...prev, main: false }));
      else setUploadingState(prev => ({ ...prev, secondary: false }));
    }
  };

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

  const totalStock = Object.values(editForm.sizeStock || {}).reduce((sum, q) => sum + (q || 0), 0);
  const loading = products === undefined;

  const cp = parseFloat(editForm.costPrice) || 0;
  const sp = parseFloat(editForm.price) || 0;
  const profit = sp - cp;
  const profitPercentage = cp > 0 ? (profit / cp) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto pt-12 lg:pt-0">
          
          <div className="flex flex-col gap-6">
            
            {/* Header & Minimalist Metrics (The Analytics Way) */}
            <div className="border-b border-zinc-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-base font-bold text-zinc-900 font-sans">Products</h1>
                
                {/* Minimalist Main Category Filter (Right Side) */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] sm:text-xs">
                  {MAIN_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setActiveTab(cat.value); setActiveSubTab("all"); }}
                      className={`font-medium transition-all ${
                        activeTab === cat.value 
                          ? "text-zinc-950 underline underline-offset-4 font-bold" 
                          : "text-zinc-400 hover:text-zinc-650"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimalist Stats Row */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-xs text-zinc-500 font-mono">
                <div>
                  Catalog Items: {loading ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{products?.length || 0}</span>
                  )}
                </div>
                <div>
                  Healthy Stock: {loading ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{products?.filter(p => (p.currentStock || p.totalAvailable || 0) > 10).length || 0}</span>
                  )}
                </div>
                <div>
                  Low Stock: {loading ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{products?.filter(p => {
                      const st = p.currentStock || p.totalAvailable || 0;
                      return st > 0 && st <= 10;
                    }).length || 0}</span>
                  )}
                </div>
                <div>
                  Depleted: {loading ? (
                    <span className="inline-block w-8 h-3 bg-zinc-100 animate-pulse rounded-xs align-middle" />
                  ) : (
                    <span className="text-zinc-950 font-bold">{products?.filter(p => (p.currentStock || p.totalAvailable || 0) === 0).length || 0}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-category selection tabs */}
            {activeTab !== "all" && CATEGORY_MAP[activeTab] && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 font-mono border-b border-zinc-100 pb-3 -mt-2">
                <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider">Sub-categories:</span>
                {[
                  { id: "all", label: "ALL" },
                  ...CATEGORY_MAP[activeTab].map(sub => ({ id: sub.toLowerCase(), label: sub.toUpperCase() }))
                ].map((subItem) => {
                  const isActive = activeSubTab === subItem.id;
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveSubTab(subItem.id)}
                      className={`transition-all ${
                        isActive 
                          ? "text-zinc-950 font-bold underline underline-offset-2" 
                          : "hover:text-zinc-600"
                      }`}
                    >
                      {subItem.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search, Filter, Sort and Actions Minimalist Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between font-mono text-xs mt-1">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by SKU or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs focus:outline-none transition-all text-xs font-sans"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-start md:justify-end">
                {/* Stock Quick Filters */}
                <div className="flex gap-4 items-center">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "visible", label: "Visible" },
                    { id: "hidden", label: "Hidden" },
                    { id: "in", label: "Healthy" },
                    { id: "low", label: "Low" },
                    { id: "out", label: "Depleted" }
                  ].map((btn) => {
                    const isActive = filter === btn.id;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => setFilter(btn.id)}
                        className={`transition-all ${
                          isActive 
                            ? "text-zinc-950 font-bold underline underline-offset-2" 
                            : "text-zinc-400 hover:text-zinc-600"
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-zinc-950 font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="sku_asc">SKU Asc</option>
                    <option value="sku_desc">SKU Desc</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="price_desc">Price High-Low</option>
                    <option value="price_asc">Price Low-High</option>
                    <option value="stock_desc">Stock High-Low</option>
                    <option value="stock_asc">Stock Low-High</option>
                  </select>
                </div>

                {/* Add product outline link */}
                <Link
                  href="/website/add-product"
                  className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xs text-xs font-bold transition-all flex items-center gap-1 font-sans"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </Link>
              </div>
            </div>

            {/* Catalog Grid Table (Minimalist style) */}
            <div className="w-full border border-zinc-100 rounded-sm overflow-hidden bg-white mt-2">
              {loading ? (
                <div className="py-24 text-center font-mono text-xs text-zinc-400">
                  <div className="w-6 h-6 border border-zinc-300 border-t-zinc-950 rounded-full animate-spin mx-auto mb-3" />
                  Retrieving catalog records...
                </div>
              ) : filtered.length === 0 ? (
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
                  <span>No matching products in this filter.</span>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-400 font-bold text-[9px] uppercase tracking-wider">
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-center">Stock</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {visibleProducts.map((p) => {
                          const stockVal = p.currentStock || p.totalAvailable || 0;
                          const isOutOfStock = stockVal === 0;
                          const isLowStock = stockVal > 0 && stockVal <= 10;
                          
                          return (
                            <tr key={p._id} className="hover:bg-zinc-50/30 transition-colors">
                              {/* Product name & visual */}
                              <td className="px-4 py-3 font-sans">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xs overflow-hidden flex items-center justify-center shrink-0">
                                    {p.mainImage ? (
                                      <img src={p.mainImage} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-4 h-4 text-zinc-300" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span 
                                        className="font-bold text-zinc-950 hover:underline cursor-pointer text-xs"
                                        onClick={() => handleEdit(p)}
                                      >
                                        {p.name}
                                      </span>
                                      {p.isHidden && (
                                        <span className="px-1.5 py-0.2 rounded-xs bg-purple-50 text-purple-700 text-[8px] font-bold font-mono border border-purple-200 uppercase tracking-wider">
                                          Hidden
                                        </span>
                                      )}
                                      {p.isTopSeller && (
                                        <span className="px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 text-[8px] font-bold border border-amber-200 uppercase tracking-wider">
                                          Top Seller
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* SKU */}
                              <td className="px-4 py-3 text-zinc-500 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span>{p.itemId}</span>
                                  <button
                                    onClick={() => copyToClipboard(p.itemId, "SKU")}
                                    className="text-zinc-350 hover:text-zinc-650 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="px-4 py-3 text-zinc-500">
                                {p.category || "-"}
                              </td>

                              {/* Price */}
                              <td className="px-4 py-3 text-right font-extrabold text-zinc-950">
                                <div>₹{p.price?.toLocaleString("en-IN")}</div>
                                {(p.listedPrice || p.originalPrice) && (p.listedPrice || p.originalPrice) > p.price && (
                                  <div className="text-[10px] text-zinc-400 line-through font-normal">
                                    ₹{(p.listedPrice || p.originalPrice)?.toLocaleString("en-IN")}
                                  </div>
                                )}
                              </td>

                              {/* Stock */}
                              <td className="px-4 py-3 text-center">
                                <span className={`font-bold ${isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-500" : "text-zinc-950"}`}>
                                  {stockVal}
                                </span>
                              </td>

                              {/* Status dot */}
                              <td className="px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                    isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-emerald-600"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                                    <span>{isOutOfStock ? "Depleted" : isLowStock ? "Low" : "In Stock"}</span>
                                  </span>
                                  {p.isHidden ? (
                                    <span className="text-[9px] font-mono text-purple-700 font-bold flex items-center gap-0.5 bg-purple-50 px-1 py-0.2 rounded-xs border border-purple-200">
                                      <EyeOff size={9} /> Hidden
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-1 py-0.2 rounded-xs border border-emerald-200">
                                      <Eye size={9} /> Visible
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={(e) => handleToggleHide(p, e)}
                                    className={`p-1.5 rounded-sm transition-colors cursor-pointer border ${
                                      p.isHidden
                                        ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950"
                                    }`}
                                    title={p.isHidden ? "Unhide product on website" : "Hide product from website"}
                                  >
                                    {p.isHidden ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                                  </button>
                                  <button
                                    onClick={() => handleEdit(p)}
                                    disabled={loadingProduct}
                                    className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 rounded-sm transition-colors cursor-pointer"
                                  >
                                    {loadingProduct ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Edit2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p)}
                                    className="p-1.5 hover:bg-red-50 text-zinc-500 hover:text-red-650 rounded-sm transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Product Cards (Decluttered, Simple) */}
                  <div className="md:hidden divide-y divide-zinc-50">
                    {visibleProducts.map((p) => {
                      const stockVal = p.currentStock || p.totalAvailable || 0;
                      const isOutOfStock = stockVal === 0;
                      const isLowStock = stockVal > 0 && stockVal <= 10;
                      return (
                        <div key={p._id} className="p-4 flex items-start gap-3">
                          <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                            {p.mainImage ? (
                              <img src={p.mainImage} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-zinc-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-zinc-950 text-xs truncate cursor-pointer hover:underline flex items-center gap-1.5" onClick={() => handleEdit(p)}>
                                  <span>{p.name}</span>
                                  {p.isHidden && (
                                    <span className="px-1 py-0.2 bg-purple-50 text-purple-700 text-[8px] font-mono rounded-xs border border-purple-200">Hidden</span>
                                  )}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-mono">
                                  <span>{p.itemId}</span>
                                  {p.category && <span>· {p.category}</span>}
                                </div>
                              </div>
                              <span className="font-bold text-zinc-950 text-xs whitespace-nowrap">₹{p.price?.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                                isOutOfStock ? "text-red-600"
                                : isLowStock ? "text-amber-600"
                                : "text-emerald-600"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                                {isOutOfStock ? "Depleted" : isLowStock ? "Low" : "In Stock"} ({stockVal})
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => handleToggleHide(p, e)}
                                  className={`p-1 rounded-sm border ${
                                    p.isHidden ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                                  }`}
                                  title={p.isHidden ? "Unhide product" : "Hide product"}
                                >
                                  {p.isHidden ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                                </button>
                                <button onClick={() => handleEdit(p)} disabled={loadingProduct} className="p-1 text-zinc-400 hover:text-zinc-950 cursor-pointer disabled:opacity-50"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(p)} className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {visibleCount < filtered.length && (
                    <div id="website-load-more-trigger" className="h-14 flex items-center justify-center my-4">
                      <div className="w-5 h-5 border border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Product Editor Modal (Minimalist Redesign) */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-sm shadow-xl max-w-xl w-full border border-zinc-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Product Editor</span>
                  <h2 className="text-sm font-bold text-zinc-950 tracking-tight">SKU #{editing.itemId}</h2>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="p-1.5 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-950 rounded-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs">
                
                {/* Section: Basic Info */}
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[9px] font-mono">
                    Specifications
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Product Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs font-sans text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Main Category *</label>
                      <select
                        value={editForm.mainCategory || "footwear"}
                        onChange={(e) => setEditForm({ ...editForm, mainCategory: e.target.value, category: "" })}
                        className="w-full px-2 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs text-xs focus:outline-none cursor-pointer"
                      >
                        {MAIN_CATEGORIES.filter(m => m.value !== "all").map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Store Category *</label>
                      <select
                        value={
                          (CATEGORY_MAP[editForm.mainCategory || "footwear"] || []).find(
                            (c) => c.toLowerCase() === (editForm.category || "").toLowerCase()
                          ) || editForm.category || ""
                        }
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {(CATEGORY_MAP[editForm.mainCategory || "footwear"] || []).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {editForm.category && !(CATEGORY_MAP[editForm.mainCategory || "footwear"] || []).some(
                          (c) => c.toLowerCase() === editForm.category.toLowerCase()
                        ) && (
                          <option value={editForm.category}>{editForm.category}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Color</label>
                      <select
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Color</option>
                        {COLORS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs text-xs focus:outline-none resize-none font-sans"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="editIsTopSeller"
                        checked={editForm.isTopSeller || false}
                        onChange={(e) => setEditForm({ ...editForm, isTopSeller: e.target.checked })}
                        className="w-3.5 h-3.5 accent-zinc-950 cursor-pointer"
                      />
                      <label htmlFor="editIsTopSeller" className="font-bold text-zinc-700 cursor-pointer select-none">
                        Mark as Top Seller on Web Storefront
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section: Photos */}
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[9px] font-mono flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Media Catalog</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {editForm.mainImage ? (
                      <div className="w-14 h-14 rounded-xs overflow-hidden relative group border border-zinc-150 bg-white">
                        <img src={editForm.mainImage} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, mainImage: "" })}
                          className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-zinc-950 text-white text-[7px] text-center font-bold font-mono">COVER</span>
                      </div>
                    ) : (
                      <label className="w-14 h-14 border border-dashed border-zinc-200 hover:border-zinc-400 rounded-xs flex flex-col items-center justify-center cursor-pointer bg-white">
                        {uploadingState.main ? (
                          <RefreshCw className="w-3.5 h-3.5 text-zinc-950 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-zinc-300" />
                            <span className="text-[7px] text-zinc-400 font-bold font-mono mt-0.5">COVER</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingState.main}
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], true)}
                        />
                      </label>
                    )}

                    {editForm.otherImages?.map((img, i) => (
                      <div key={i} className="w-14 h-14 rounded-xs overflow-hidden relative group border border-zinc-150 bg-white">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, otherImages: editForm.otherImages.filter((_, j) => j !== i) })}
                          className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {(editForm.otherImages?.length || 0) < 4 && (
                      <label className="w-14 h-14 border border-dashed border-zinc-200 hover:border-zinc-400 rounded-xs flex flex-col items-center justify-center cursor-pointer bg-white">
                        {uploadingState.secondary ? (
                          <RefreshCw className="w-3.5 h-3.5 text-zinc-950 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-zinc-300" />
                            <span className="text-[7px] text-zinc-400 font-bold font-mono mt-0.5">DETAIL</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingState.secondary}
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], false)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Section: Pricing */}
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[9px] font-mono flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Financials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Cost Price (₹)</label>
                      <input
                        type="number"
                        value={editForm.costPrice}
                        onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Listed Price / MRP (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2999"
                        value={editForm.listedPrice || ""}
                        onChange={(e) => setEditForm({ ...editForm, listedPrice: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 rounded-xs focus:outline-none"
                      />
                    </div>

                    {cp > 0 && sp > 0 && (
                      <div className="col-span-1 sm:col-span-3 py-2 border-t border-b border-dashed border-zinc-100 flex items-center justify-between text-zinc-500 font-mono">
                        <span>Projected Margin / markup</span>
                        <span className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          ₹{profit.toFixed(0)} ({profitPercentage.toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Sizes & Quantities */}
                <div className="space-y-4">
                  <div className="border-b border-zinc-100 pb-1.5 font-bold text-zinc-900 uppercase tracking-wider text-[9px] font-mono flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Sizes & Quantities</span>
                    </div>
                    <span className="text-zinc-500 font-bold">
                      {totalStock} TOTAL
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1.5 font-mono">Size Grid System</label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-1.5 text-zinc-700 cursor-pointer">
                          <input
                            type="radio"
                            name="editSizeDisplayType"
                            checked={editForm.sizeDisplayType === "alpha"}
                            onChange={() => handleSizeDisplayTypeChange("alpha")}
                            className="accent-zinc-950 cursor-pointer"
                          />
                          Alpha (S, M, L)
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-700 cursor-pointer">
                          <input
                            type="radio"
                            name="editSizeDisplayType"
                            checked={editForm.sizeDisplayType === "numeric"}
                            onChange={() => handleSizeDisplayTypeChange("numeric")}
                            className="accent-zinc-950 cursor-pointer"
                          />
                          Numeric (28, 30, 32)
                        </label>
                        <label className="flex items-center gap-1.5 text-zinc-700 cursor-pointer">
                          <input
                            type="radio"
                            name="editSizeDisplayType"
                            checked={editForm.sizeDisplayType === "free"}
                            onChange={() => handleSizeDisplayTypeChange("free")}
                            className="accent-zinc-950 cursor-pointer"
                          />
                          Free / One Size
                        </label>
                      </div>
                    </div>

                    {editForm.sizeDisplayType !== "free" && (
                      <div className="flex flex-wrap gap-1.5">
                        {SIZES.map((s) => {
                          const isActive = editForm.sizes?.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSize(s)}
                              className={`w-9 h-9 border rounded-xs text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                                isActive
                                  ? "bg-zinc-950 border-zinc-950 text-white shadow-xs"
                                  : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-350 hover:bg-zinc-50"
                              }`}
                            >
                              {editForm.sizeDisplayType === "numeric" ? (SIZE_MAP[s] || s) : s}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {editForm.sizes?.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 font-mono">
                        {editForm.sizes
                          .sort((a, b) => {
                            if (a === "OS") return -1;
                            if (b === "OS") return 1;
                            return SIZES.indexOf(a) - SIZES.indexOf(b);
                          })
                          .map((s) => (
                            <div key={s} className="bg-zinc-50/50 border border-zinc-150 rounded-xs p-1.5 text-center">
                              <label className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">
                                {s === "OS" ? "OS" : (editForm.sizeDisplayType === "numeric" ? (SIZE_MAP[s] || s) : s)}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.sizeStock?.[s] === 0 ? "0" : (editForm.sizeStock?.[s] || "")}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    sizeStock: { ...editForm.sizeStock, [s]: parseInt(e.target.value) || 0 },
                                  })
                                }
                                className="w-full px-1 py-0.5 bg-white border border-zinc-200 rounded-xs text-center text-xs font-bold focus:outline-none focus:border-zinc-950"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit footer */}
                <div className="flex gap-2 pt-4 border-t border-zinc-100 font-sans">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex-1 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xs text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xs text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
