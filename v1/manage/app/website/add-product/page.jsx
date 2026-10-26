"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  Plus,
  X,
  Upload,
  CheckCircle2,
  Globe,
  ArrowLeft,
  Tag,
  DollarSign,
  Layers,
  Palette,
  Eye,
  IndianRupee,
  BadgeAlert,
  Percent,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { processImageForUpload } from "@/lib/imageHelper";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
const COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi", "Orange", "Purple", "Silver", "Golden", "Rose Gold", "Copper"];
const SIZE_MAP = {
  S: "28",
  M: "30",
  L: "32",
  XL: "34",
  XXL: "36",
  XXXL: "38"
};

const MAIN_CATEGORIES = [
  { value: "footwear", label: "Footwear" },
  { value: "apparel", label: "Apparel / Clothing" },
  { value: "headwear", label: "Headwear" },
  { value: "eyewear", label: "Eyewear" }
];

const CATEGORY_MAP = {
  footwear: ["Shoes", "boots", "sandals", "sneakers"],
  apparel: ["Shirts", "t-shirts", "jackets", "pants", "dresses", "socks"],
  headwear: ["Hats", "caps", "beanies"],
  eyewear: ["Glasses", "sunglasses"]
};

export default function WebsiteAddProduct() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingState, setUploadingState] = useState({ main: false, secondary: false });
  const [form, setForm] = useState({
    sku: "",
    name: "",
    mainCategory: "apparel",
    category: "",
    color: "",
    secondaryColor: "",
    sizes: [],
    sizeStock: {},
    costPrice: "",
    sellingPrice: "",
    listedPrice: "",
    description: "",
    mainImage: "",
    otherImages: [],
    sizeDisplayType: "alpha",
  });

  const addProduct = useMutation(api.products.addProduct);

  const toggleSize = (size) => {
    const has = form.sizes.includes(size);
    const sizes = has ? form.sizes.filter((s) => s !== size) : [...form.sizes, size];
    const sizeStock = { ...form.sizeStock };
    if (has) delete sizeStock[size];
    else sizeStock[size] = 0;
    setForm({ ...form, sizes, sizeStock });
  };

  const handleSizeDisplayTypeChange = (type) => {
    if (type === "free") {
      setForm({
        ...form,
        sizeDisplayType: "free",
        sizes: ["OS"],
        sizeStock: { OS: form.sizeStock["OS"] || 0 }
      });
    } else {
      const sizes = form.sizes.filter(s => s !== "OS");
      const sizeStock = { ...form.sizeStock };
      delete sizeStock["OS"];
      setForm({
        ...form,
        sizeDisplayType: type,
        sizes,
        sizeStock
      });
    }
  };

  const totalStock = Object.values(form.sizeStock).reduce((sum, q) => sum + (q || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Complete form validations
    if (!form.sku.trim()) return toast.error("Please enter a unique SKU ID / Item Code.");
    if (!form.name.trim()) return toast.error("Please enter the product Name.");
    if (!form.mainCategory) return toast.error("Please select a Main Category.");
    if (!form.category) return toast.error("Please select a specific Category.");
    if (!form.color) return toast.error("Please select a Primary Color.");
    if (!form.description.trim()) return toast.error("Please write a Product Description.");
    if (!form.mainImage) return toast.error("Please upload a Cover Picture.");
    if (form.sizes.length === 0) return toast.error("Please select at least one available size.");
    
    // Validate that all selected sizes have a valid stock count > 0
    for (const size of form.sizes) {
        const qty = form.sizeStock[size];
        if (qty === undefined || qty === null || isNaN(qty) || qty <= 0) {
            return toast.error(`Please enter a valid stock quantity (> 0) for Size ${size}.`);
        }
    }
    
    if (!form.costPrice || parseFloat(form.costPrice) <= 0) return toast.error("Please enter a valid Purchase Cost Price greater than 0.");
    if (!form.sellingPrice || parseFloat(form.sellingPrice) <= 0) return toast.error("Please enter a valid Store Selling Price greater than 0.");
    if (parseFloat(form.sellingPrice) < parseFloat(form.costPrice)) {
        return toast.error("Selling Price cannot be less than Purchase Cost Price.");
    }

    setLoading(true);
    try {
      await addProduct({
        itemId: form.sku,
        name: form.name,
        mainCategory: form.mainCategory || undefined,
        category: form.category || undefined,
        description: form.description || undefined,
        price: parseFloat(form.sellingPrice),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        listedPrice: form.listedPrice ? parseFloat(form.listedPrice) : undefined,
        mainImage: form.mainImage || "/placeholder.png",
        otherImages: form.otherImages.length > 0 ? form.otherImages : undefined,
        availableSizes: form.sizes,
        sizeStock: form.sizeStock,
        sizeDisplayType: form.sizeDisplayType,
        color: form.color || undefined,
        secondaryColor: form.secondaryColor || undefined,
      });
      setSuccess(true);
      toast.success("Product successfully added to catalog!");
    } catch (err) {
      toast.error(err.message || "Failed to save product details.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({
      sku: "",
      name: "",
      mainCategory: "footwear",
      category: "",
      color: "",
      secondaryColor: "",
      sizes: [],
      sizeStock: {},
      costPrice: "",
      sellingPrice: "",
      listedPrice: "",
      description: "",
      mainImage: "",
      otherImages: [],
      sizeDisplayType: "alpha",
    });
    setSuccess(false);
  };

  const uploadImage = async (file, isMain = true) => {
    if (isMain) setUploadingState(prev => ({ ...prev, main: true }));
    else setUploadingState(prev => ({ ...prev, secondary: true }));
    
    try {
      // Compress and process client-side (HEIC conversion + Canvas compression)
      const processedFile = await processImageForUpload(file);
      if (!processedFile) return;

      const fd = new FormData();
      fd.append("file", processedFile);

      toast.loading("Uploading photo content...", { id: "upload" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        if (isMain) setForm((f) => ({ ...f, mainImage: data.url }));
        else setForm((f) => ({ ...f, otherImages: [...f.otherImages, data.url] }));
        toast.success("Photo uploaded successfully!", { id: "upload" });
      } else {
        toast.error(data.error || "Upload process failed.", { id: "upload" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed - Verify backend systems are active.", { id: "upload" });
    } finally {
      if (isMain) setUploadingState(prev => ({ ...prev, main: false }));
      else setUploadingState(prev => ({ ...prev, secondary: false }));
    }
  };

  // Profit Calculations
  const cp = parseFloat(form.costPrice) || 0;
  const sp = parseFloat(form.sellingPrice) || 0;
  const profit = sp - cp;
  const profitPercentage = cp > 0 ? (profit / cp) * 100 : 0;

  if (success) {
    return (
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center max-w-md shadow-lg animate-fadeIn">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md shadow-slate-100">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Product Cataloged!</h2>
            <p className="text-slate-500 text-sm mt-2 mb-8 leading-relaxed">
              Your product has been registered successfully and is now active across your online digital storefront.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Catalog Another Product
              </button>
              <Link
                href="/website/products"
                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-600 transition-all"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 pt-12 lg:pt-0">
            <Link href="/website/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider mb-3">
              <ArrowLeft className="w-3.5 h-3.5" /> <span>Back to Catalog</span>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-500 tracking-widest text-[10px] font-bold uppercase mb-1">Website Store</p>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">Add New Product</h1>
                <p className="text-slate-500 text-sm mt-1">Catalog new products, load digital images, configure pricing, and scale sizing grids.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Basic Specifications */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Package className="w-4.5 h-4.5 text-slate-400" /> Basic Specifications
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Item SKU code *</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                      placeholder="e.g. AW-SNEAK-01"
                      className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Premium Leather Sneakers"
                      className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Main Category *</label>
                    <select
                      value={form.mainCategory}
                      onChange={(e) => setForm({ ...form, mainCategory: e.target.value, category: "" })}
                      className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none font-bold"
                      required
                    >
                      {MAIN_CATEGORIES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Store Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none font-bold"
                      required
                    >
                      <option value="">Select Category</option>
                      {(CATEGORY_MAP[form.mainCategory] || []).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Primary Color</label>
                    <select
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="">Select Color</option>
                      {COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Catalog Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Enter detailed description about fits, material quality, and styles..."
                      className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Size Grid & Inventory Stock */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-slate-400" /> Size Grid & Inventory Stock
                  </h3>
                  <span className="text-xs bg-slate-100 font-extrabold text-slate-700 px-3 py-1 rounded-xl shadow-sm border border-slate-200">
                    {totalStock} Item{totalStock !== 1 ? "s" : ""} Total
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Size Display System</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sizeDisplayType"
                          checked={form.sizeDisplayType === "alpha"}
                          onChange={() => handleSizeDisplayTypeChange("alpha")}
                          className="accent-slate-900 cursor-pointer"
                        />
                        Alpha (S, M, L, XL)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sizeDisplayType"
                          checked={form.sizeDisplayType === "numeric"}
                          onChange={() => handleSizeDisplayTypeChange("numeric")}
                          className="accent-slate-900 cursor-pointer"
                        />
                        Numeric (28, 30, 32, 34)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sizeDisplayType"
                          checked={form.sizeDisplayType === "free"}
                          onChange={() => handleSizeDisplayTypeChange("free")}
                          className="accent-slate-900 cursor-pointer"
                        />
                        One Size / Free Size
                      </label>
                    </div>
                  </div>

                  {form.sizeDisplayType !== "free" && (
                    <>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Select sizes to activate and enter exact stock quantities.
                      </p>
     
                      <div className="flex flex-wrap gap-2.5">
                        {SIZES.map((s) => {
                          const isActive = form.sizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSize(s)}
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                                isActive
                                  ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-100 scale-105"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {form.sizeDisplayType === "numeric" ? (SIZE_MAP[s] || s) : s}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
 
                  {form.sizes.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2 animate-fadeIn">
                      {form.sizes
                        .sort((a, b) => {
                          if (a === "OS") return -1;
                          if (b === "OS") return 1;
                          return SIZES.indexOf(a) - SIZES.indexOf(b);
                        })
                        .map((s) => (
                          <div key={s} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-2.5 text-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              {s === "OS" ? "One Size (OS)" : (form.sizeDisplayType === "numeric" ? (SIZE_MAP[s] || s) : s)}
                            </label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={form.sizeStock[s] === 0 ? "0" : (form.sizeStock[s] || "")}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  sizeStock: { ...form.sizeStock, [s]: parseInt(e.target.value) || 0 },
                                })
                              }
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-bold focus:outline-none"
                              placeholder="0"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Photo Media */}
            <div className="space-y-6">
              
              {/* Card 3: Pricing Analytics */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
                  <DollarSign className="w-4.5 h-4.5 text-slate-400" /> Pricing & Financials
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cost Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="number"
                        min="0"
                        value={form.costPrice}
                        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Selling Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.sellingPrice}
                        onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-extrabold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Listed Price / MRP (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input
                        type="number"
                        min="0"
                        value={form.listedPrice}
                        onChange={(e) => setForm({ ...form, listedPrice: e.target.value })}
                        placeholder="e.g. 2999"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-extrabold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Profit Margin Visualization Indicator */}
                  {cp > 0 && sp > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 animate-fadeIn">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Profit Margin</span>
                        <span className={`font-extrabold ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          ₹{profit.toFixed(0)} ({profitPercentage.toFixed(0)}%)
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${profit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{ width: `${Math.min(Math.max(profitPercentage, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Catalog Photos */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
                  <ImageIcon className="w-4.5 h-4.5 text-slate-400" /> Product Photos
                </h3>

                <div className="space-y-5">
                  
                  {/* Primary Photo Uploader */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Primary Cover Photo</label>
                    {form.mainImage ? (
                      <div className="w-full h-36 rounded-2xl overflow-hidden relative group border shadow-sm bg-slate-50">
                        <img src={form.mainImage} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, mainImage: "" })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white text-xs font-bold gap-1.5"
                        >
                          <X className="w-5 h-5" /> Remove Cover
                        </button>
                      </div>
                    ) : (
                      <label className="h-36 border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all">
                        {uploadingState.main ? (
                          <>
                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                            <span className="text-[10px] text-slate-400 mt-2">Uploading Photo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-300" />
                            <span className="text-[10px] text-slate-500 font-bold mt-2">Upload Main Image</span>
                            <span className="text-[8px] text-slate-400 mt-1">Accepts PNG, JPG, JPEG</span>
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
                  </div>

                  {/* Secondary Photos */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Secondary Gallery Images</label>
                    <div className="grid grid-cols-4 gap-2">
                      {form.otherImages.map((img, i) => (
                        <div key={i} className="w-full aspect-square rounded-xl overflow-hidden relative group border shadow-sm bg-slate-50">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, otherImages: form.otherImages.filter((_, j) => j !== i) })}
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {form.otherImages.length < 4 && (
                        <label className="aspect-square border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
                          {uploadingState.secondary ? (
                            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-slate-300" />
                              <span className="text-[8px] text-slate-400 mt-1">Add Detail</span>
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
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Form
                </button>
                
                <button
                  type="submit"
                  disabled={loading || uploadingState.main || uploadingState.secondary}
                  className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-2xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Catalog Entry...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Register Product</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
