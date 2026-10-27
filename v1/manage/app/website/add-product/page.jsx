"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  Package,
  Plus,
  X,
  Upload,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Layers,
  IndianRupee,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
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

const DEFAULT_MAIN_CATEGORIES = [
  { value: "footwear", label: "Footwear" },
  { value: "apparel", label: "Apparel / Clothing" },
  { value: "headwear", label: "Headwear" },
  { value: "eyewear", label: "Eyewear" }
];

const DEFAULT_CATEGORY_MAP = {
  footwear: ["Shoes", "boots", "sandals", "sneakers"],
  apparel: ["Shirts", "t-shirts", "Waffle T-shirt", "jackets", "pants", "jeans", "dresses", "socks", "jersey", "jerseys"],
  headwear: ["Hats", "caps", "beanies"],
  eyewear: ["Glasses", "sunglasses"]
};

const DEFAULT_COLORS = ["Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi", "Orange", "Purple", "Silver", "Golden", "Rose Gold", "Copper"];

export default function WebsiteAddProduct() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingState, setUploadingState] = useState({ main: false, secondary: false });

  // Dynamic catalog taxonomy from database
  const catalogConfig = useQuery(api.siteSettings.getCatalogConfig);
  const addStoreCategoryMut = useMutation(api.siteSettings.addStoreCategory);
  const removeStoreCategoryMut = useMutation(api.siteSettings.removeStoreCategory);
  const addMainCategoryMut = useMutation(api.siteSettings.addMainCategory);
  const removeMainCategoryMut = useMutation(api.siteSettings.removeMainCategory);
  const addColorMut = useMutation(api.siteSettings.addColor);
  const removeColorMut = useMutation(api.siteSettings.removeColor);

  const mainCategories = catalogConfig?.mainCategories || DEFAULT_MAIN_CATEGORIES;
  const categoryMap = catalogConfig?.categoryMap || DEFAULT_CATEGORY_MAP;
  const colors = catalogConfig?.colors || DEFAULT_COLORS;

  const [manageModal, setManageModal] = useState(null); // 'storeCategory' | 'mainCategory' | 'color'
  const [newItemInput, setNewItemInput] = useState("");
  const [newMainCategoryLabel, setNewMainCategoryLabel] = useState("");
  const [submittingManage, setSubmittingManage] = useState(false);

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

  const handleAddStoreCategory = async (e) => {
    e?.preventDefault();
    const val = newItemInput.trim();
    if (!val) return toast.error("Category name is required");
    setSubmittingManage(true);
    try {
      await addStoreCategoryMut({ mainCategory: form.mainCategory, category: val });
      setForm((prev) => ({ ...prev, category: val }));
      setNewItemInput("");
      toast.success(`Category "${val}" saved to database`);
    } catch (err) {
      toast.error(err.message || "Failed to add category");
    } finally {
      setSubmittingManage(false);
    }
  };

  const handleRemoveStoreCategory = async (cat) => {
    try {
      await removeStoreCategoryMut({ mainCategory: form.mainCategory, category: cat });
      if (form.category === cat) {
        setForm((prev) => ({ ...prev, category: "" }));
      }
      toast.success(`Category "${cat}" removed`);
    } catch (err) {
      toast.error(err.message || "Failed to remove category");
    }
  };

  const handleAddMainCategory = async (e) => {
    e?.preventDefault();
    const label = newMainCategoryLabel.trim();
    if (!label) return toast.error("Main category name is required");
    const value = label.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
    setSubmittingManage(true);
    try {
      await addMainCategoryMut({ value, label });
      setForm((prev) => ({ ...prev, mainCategory: value, category: "" }));
      setNewMainCategoryLabel("");
      toast.success(`Main category "${label}" saved to database`);
    } catch (err) {
      toast.error(err.message || "Failed to add main category");
    } finally {
      setSubmittingManage(false);
    }
  };

  const handleRemoveMainCategory = async (val) => {
    try {
      await removeMainCategoryMut({ value: val });
      if (form.mainCategory === val) {
        setForm((prev) => ({ ...prev, mainCategory: mainCategories[0]?.value || "apparel", category: "" }));
      }
      toast.success("Main category removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove main category");
    }
  };

  const handleAddColor = async (e) => {
    e?.preventDefault();
    const val = newItemInput.trim();
    if (!val) return toast.error("Color name is required");
    setSubmittingManage(true);
    try {
      await addColorMut({ color: val });
      setForm((prev) => ({ ...prev, color: val }));
      setNewItemInput("");
      toast.success(`Color "${val}" saved to database`);
    } catch (err) {
      toast.error(err.message || "Failed to add color");
    } finally {
      setSubmittingManage(false);
    }
  };

  const handleRemoveColor = async (clr) => {
    try {
      await removeColorMut({ color: clr });
      if (form.color === clr) {
        setForm((prev) => ({ ...prev, color: "" }));
      }
      toast.success(`Color "${clr}" removed`);
    } catch (err) {
      toast.error(err.message || "Failed to remove color");
    }
  };

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
    setSuccess(false);
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

  const cp = parseFloat(form.costPrice) || 0;
  const sp = parseFloat(form.sellingPrice) || 0;
  const profit = sp - cp;
  const profitPercentage = cp > 0 ? (profit / cp) * 100 : 0;

  if (success) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="bg-white rounded-sm p-8 border border-zinc-100 text-center max-w-md font-mono text-xs">
            <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">Product Cataloged!</h2>
            <p className="text-zinc-550 text-[11px] mb-6 leading-relaxed font-sans">
              Your product has been registered successfully and is now active across your online digital storefront.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xs font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors"
              >
                Catalog Another
              </button>
              <Link
                href="/website/products"
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xs font-bold text-zinc-650 uppercase tracking-wider text-[10px] transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto pt-12 lg:pt-0">
          
          {/* Header */}
          <div className="border-b border-zinc-100 pb-5 mb-6">
            <Link href="/website/products" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-950 transition-colors uppercase tracking-wider mb-2 font-mono">
              <ArrowLeft className="w-3 h-3" /> <span>Back to Catalog</span>
            </Link>
            <div>
              <p className="text-[10px] font-mono font-bold text-zinc-455 uppercase tracking-widest mb-1">Website Store</p>
              <h1 className="text-base font-bold text-zinc-900 font-sans">Add Product</h1>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Catalog new products, load digital images, configure pricing, and scale sizing grids.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Basic Specifications */}
              <div className="bg-white rounded-sm border border-zinc-100 p-3 sm:p-4 space-y-4">
                <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider flex items-center gap-2 border-b border-zinc-50 pb-2.5 font-mono">
                  <Package className="w-3.5 h-3.5 text-zinc-400" /> Basic Specifications
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Item SKU code *</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                      placeholder="e.g. AW-SNEAK-01"
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 font-sans">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Premium Leather Sneakers"
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs text-xs font-sans"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Main Category *</label>
                      <button
                        type="button"
                        onClick={() => { setManageModal("mainCategory"); setNewMainCategoryLabel(""); }}
                        className="text-[9px] text-zinc-500 hover:text-zinc-950 font-bold font-mono flex items-center gap-0.5 transition-colors cursor-pointer"
                        title="Add or remove main categories"
                      >
                        <Plus className="w-2.5 h-2.5" /> Manage
                      </button>
                    </div>
                    <select
                      value={form.mainCategory}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_NEW__") {
                          setManageModal("mainCategory");
                          setNewMainCategoryLabel("");
                          return;
                        }
                        setForm({ ...form, mainCategory: e.target.value, category: "" });
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs font-bold text-xs cursor-pointer"
                      required
                    >
                      {mainCategories.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      <option value="__ADD_NEW__" className="text-zinc-400 font-normal">+ Add Main Category...</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Store Category *</label>
                      <button
                        type="button"
                        onClick={() => { setManageModal("storeCategory"); setNewItemInput(""); }}
                        className="text-[9px] text-zinc-500 hover:text-zinc-950 font-bold font-mono flex items-center gap-0.5 transition-colors cursor-pointer"
                        title="Add or remove store categories"
                      >
                        <Plus className="w-2.5 h-2.5" /> Manage
                      </button>
                    </div>
                    <select
                      value={form.category}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_NEW__") {
                          setManageModal("storeCategory");
                          setNewItemInput("");
                          return;
                        }
                        setForm({ ...form, category: e.target.value });
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs font-bold text-xs cursor-pointer"
                      required
                    >
                      <option value="">Select Category</option>
                      {(categoryMap[form.mainCategory] || []).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__ADD_NEW__" className="text-zinc-400 font-normal">+ Add Store Category...</option>
                    </select>
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Primary Color</label>
                      <button
                        type="button"
                        onClick={() => { setManageModal("color"); setNewItemInput(""); }}
                        className="text-[9px] text-zinc-500 hover:text-zinc-950 font-bold font-mono flex items-center gap-0.5 transition-colors cursor-pointer"
                        title="Add or remove colors"
                      >
                        <Plus className="w-2.5 h-2.5" /> Manage
                      </button>
                    </div>
                    <select
                      value={form.color}
                      onChange={(e) => {
                        if (e.target.value === "__ADD_NEW__") {
                          setManageModal("color");
                          setNewItemInput("");
                          return;
                        }
                        setForm({ ...form, color: e.target.value });
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs text-xs cursor-pointer"
                    >
                      <option value="">Select Color</option>
                      {colors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__ADD_NEW__" className="text-zinc-400 font-normal">+ Add Color...</option>
                    </select>
                  </div>

                  <div className="col-span-1 sm:col-span-2 font-sans">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1 font-mono">Catalog Description *</label>
                    <textarea
                      value={form.description}
                      required
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Enter detailed description about fits, material quality, and styles..."
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Size Grid & Inventory Stock */}
              <div className="bg-white rounded-sm border border-zinc-100 p-3 sm:p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-50 pb-2.5">
                  <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" /> Size Grid & Stock
                  </h3>
                  <span className="text-[9px] font-mono font-bold bg-zinc-50 text-zinc-800 px-2 py-0.5 border border-zinc-200 rounded-xs">
                    {totalStock} UNITS TOTAL
                  </span>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Size Display System</label>
                    <div className="flex flex-wrap gap-4 font-sans text-xs text-zinc-700">
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="sizeDisplayType"
                          checked={form.sizeDisplayType === "alpha"}
                          onChange={() => handleSizeDisplayTypeChange("alpha")}
                          className="accent-zinc-955 cursor-pointer"
                        />
                        Alpha (S, M, L)
                      </label>
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="sizeDisplayType"
                          checked={form.sizeDisplayType === "numeric"}
                          onChange={() => handleSizeDisplayTypeChange("numeric")}
                          className="accent-zinc-955 cursor-pointer"
                        />
                        Numeric (28, 30, 32)
                      </label>
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="sizeDisplayType"
                          checked={form.sizeDisplayType === "free"}
                          onChange={() => handleSizeDisplayTypeChange("free")}
                          className="accent-zinc-955 cursor-pointer"
                        />
                        One Size (OS)
                      </label>
                    </div>
                  </div>

                  {form.sizeDisplayType !== "free" && (
                    <>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                        Select sizes to activate and enter exact stock quantities.
                      </p>
     
                      <div className="flex flex-wrap gap-2">
                        {SIZES.map((s) => {
                          const isActive = form.sizes.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSize(s)}
                              className={`w-9 h-9 border text-xs font-bold transition-all flex items-center justify-center rounded-xs cursor-pointer ${
                                isActive
                                  ? "bg-zinc-950 border-zinc-950 text-white"
                                  : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-450 hover:bg-zinc-50"
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
                    <div className="grid grid-cols-3 gap-2 pt-2 animate-fadeIn">
                      {form.sizes
                        .sort((a, b) => {
                          if (a === "OS") return -1;
                          if (b === "OS") return 1;
                          return SIZES.indexOf(a) - SIZES.indexOf(b);
                        })
                        .map((s) => (
                          <div key={s} className="bg-zinc-50/50 border border-zinc-100 rounded-xs p-2 text-center">
                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">
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
                              className="w-full px-2 py-1 bg-white border border-zinc-200 rounded-xs text-center text-xs font-bold focus:outline-none focus:border-zinc-950 font-mono"
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
              <div className="bg-white rounded-sm border border-zinc-100 p-3 sm:p-4 space-y-4">
                <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider flex items-center gap-2 border-b border-zinc-50 pb-2.5 font-mono">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" /> Pricing & Financials
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Cost Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3 h-3" />
                      <input
                        type="number"
                        min="0"
                        value={form.costPrice}
                        onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Selling Price (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3 h-3" />
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.sellingPrice}
                        onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs font-extrabold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">Listed Price / MRP (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3 h-3" />
                      <input
                        type="number"
                        min="0"
                        value={form.listedPrice}
                        onChange={(e) => setForm({ ...form, listedPrice: e.target.value })}
                        placeholder="e.g. 2999"
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 focus:border-zinc-950 focus:outline-none rounded-xs font-extrabold text-xs"
                      />
                    </div>
                  </div>

                  {/* Profit Margin Visualization Indicator */}
                  {cp > 0 && sp > 0 && (
                    <div className="p-3 bg-zinc-50 border border-zinc-150 rounded-xs space-y-2 animate-fadeIn font-mono">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-zinc-400 uppercase">Margin</span>
                        <span className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          ₹{profit.toFixed(0)} ({profitPercentage.toFixed(0)}%)
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-1 bg-zinc-200 overflow-hidden">
                        <div
                          className={`h-full ${profit >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(Math.max(profitPercentage, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Catalog Photos */}
              <div className="bg-white rounded-sm border border-zinc-100 p-3 sm:p-4 space-y-4">
                <h3 className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider flex items-center gap-2 border-b border-zinc-50 pb-2.5 font-mono">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> Product Photos
                </h3>

                <div className="space-y-4 text-xs font-mono">
                  
                  {/* Primary Photo Uploader */}
                  <div>
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Primary Cover Photo</label>
                    {form.mainImage ? (
                      <div className="w-full h-32 rounded-xs overflow-hidden relative group border border-zinc-200 bg-zinc-50">
                        <img src={form.mainImage} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, mainImage: "" })}
                          className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white text-[10px] font-bold gap-1 uppercase tracking-wider font-mono"
                        >
                          <X className="w-4 h-4" /> Remove Cover
                        </button>
                      </div>
                    ) : (
                      <label className="h-32 border border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-all">
                        {uploadingState.main ? (
                          <>
                            <RefreshCw className="w-5 h-5 text-zinc-950 animate-spin" />
                            <span className="text-[9px] text-zinc-400 mt-2">Uploading Photo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-zinc-350" />
                            <span className="text-[9px] text-zinc-400 font-bold mt-2 uppercase tracking-wider">Upload Cover</span>
                            <span className="text-[8px] text-zinc-300 mt-1 font-sans">PNG, JPG, JPEG</span>
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
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Secondary Gallery Images</label>
                    <div className="grid grid-cols-4 gap-2">
                      {form.otherImages.map((img, i) => (
                        <div key={i} className="w-full aspect-square rounded-xs overflow-hidden relative group border border-zinc-200 bg-zinc-50">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, otherImages: form.otherImages.filter((_, j) => j !== i) })}
                            className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {form.otherImages.length < 4 && (
                        <label className="aspect-square border border-dashed border-zinc-200 hover:border-zinc-450 hover:bg-slate-50/50 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-all">
                          {uploadingState.secondary ? (
                            <RefreshCw className="w-4 h-4 text-zinc-950 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-zinc-350" />
                              <span className="text-[8px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">Add Detail</span>
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
              <div className="flex gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-550 rounded-xs font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                >
                  Reset Form
                </button>
                
                <button
                  type="submit"
                  disabled={loading || uploadingState.main || uploadingState.secondary}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 text-white rounded-xs font-bold uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Catalog Entry...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Product</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>
      </main>

      {/* Database Taxonomy Manager Modal */}
      {manageModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-sm shadow-xl max-w-md w-full p-5 space-y-4 font-mono animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400">Database Taxonomy</p>
                <h3 className="text-sm font-bold text-zinc-900 font-sans">
                  {manageModal === "storeCategory" && `Manage Store Categories (${mainCategories.find((m) => m.value === form.mainCategory)?.label || form.mainCategory})`}
                  {manageModal === "mainCategory" && "Manage Main Categories"}
                  {manageModal === "color" && "Manage Colors"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManageModal(null);
                  setNewItemInput("");
                  setNewMainCategoryLabel("");
                }}
                className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Store Category Manager */}
            {manageModal === "storeCategory" && (
              <>
                <form onSubmit={handleAddStoreCategory} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    placeholder="New category (e.g. Hoodies, Oversized Tee...)"
                    className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-xs text-xs focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingManage || !newItemInput.trim()}
                    className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase text-zinc-400">Current Categories (Click × to remove)</p>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-zinc-50 border border-zinc-150 rounded-xs">
                    {(categoryMap[form.mainCategory] || []).length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">No categories saved yet for this main category.</p>
                    ) : (
                      (categoryMap[form.mainCategory] || []).map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded-xs text-xs font-medium text-zinc-800"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStoreCategory(cat)}
                            className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                            title={`Delete ${cat}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Main Category Manager */}
            {manageModal === "mainCategory" && (
              <>
                <form onSubmit={handleAddMainCategory} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newMainCategoryLabel}
                    onChange={(e) => setNewMainCategoryLabel(e.target.value)}
                    placeholder="New main category (e.g. Accessories)"
                    className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-xs text-xs focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingManage || !newMainCategoryLabel.trim()}
                    className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase text-zinc-400">Current Main Categories</p>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-zinc-50 border border-zinc-150 rounded-xs">
                    {mainCategories.map((m) => (
                      <div
                        key={m.value}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-zinc-200 rounded-xs text-xs text-zinc-800"
                      >
                        <div>
                          <span className="font-bold">{m.label}</span>
                          <span className="text-[10px] text-zinc-400 ml-2 font-mono">({m.value})</span>
                        </div>
                        {mainCategories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMainCategory(m.value)}
                            className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                            title={`Delete ${m.label}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Color Manager */}
            {manageModal === "color" && (
              <>
                <form onSubmit={handleAddColor} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    placeholder="New color (e.g. Olive, Lavender...)"
                    className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-xs text-xs focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingManage || !newItemInput.trim()}
                    className="px-3 py-1.5 bg-zinc-950 text-white text-xs font-bold rounded-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase text-zinc-400">Current Colors (Click × to remove)</p>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-zinc-50 border border-zinc-150 rounded-xs">
                    {colors.map((clr) => (
                      <span
                        key={clr}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded-xs text-xs font-medium text-zinc-800"
                      >
                        <span>{clr}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(clr)}
                          className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                          title={`Delete ${clr}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setManageModal(null);
                  setNewItemInput("");
                  setNewMainCategoryLabel("");
                }}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
