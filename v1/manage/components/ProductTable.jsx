"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Save,
  X,
  Package,
  Barcode as BarcodeIcon,
  Edit2,
  Plus,
  Trash2,
  Upload,
  Copy,
  Printer,
  ChevronRight,
  IndianRupee,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import Barcode from "@/components/Barcode";
import Dropdown from "@/components/Dropdown";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { processImageForUpload } from "@/lib/imageHelper";

const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
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

export default function ProductTable({ products }) {
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showBarcodeId, setShowBarcodeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState({ main: false, secondary: false });

  // Fetch full product data only when editing
  const editingProduct = useQuery(
    api.offStore.getProduct,
    editingProductId ? { id: editingProductId } : "skip"
  );

  const updateProduct = useMutation(api.offStore.updateProduct);
  const moveToTrash = useMutation(api.offStore.moveToTrash);

  const getTotalStock = (product) => {
    if (product.sizeStock) {
      return Object.values(product.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    }
    return product.currentStock ?? 0;
  };

  const handleSave = async () => {
    if (!editingProductId) return;
    if (!editForm.name || !editForm.price) return toast.error("Product name and selling price are required.");
    if (editForm.sizes?.length === 0) return toast.error("Please configure at least one active size.");

    setIsSaving(true);
    try {
      await updateProduct({
        id: editingProductId,
        name: editForm.name,
        mainCategory: editForm.mainCategory || "footwear",
        category: editForm.category,
        description: editForm.description,
        mainImage: editForm.mainImage || "/placeholder.png",
        otherImages: editForm.otherImages.length > 0 ? editForm.otherImages : undefined,
        price: parseFloat(editForm.price) || 0,
        costPrice: parseFloat(editForm.costPrice) || 0,
        listedPrice: editForm.listedPrice ? parseFloat(editForm.listedPrice) : undefined,
        color: editForm.color,
        secondaryColor: editForm.secondaryColor,
        availableSizes: editForm.sizes,
        sizeStock: editForm.sizeStock,
        sizeDisplayType: editForm.sizeDisplayType,
      });
      toast.success("Product successfully updated!");
      closeModal();
    } catch (error) {
      toast.error(error.message || "Failed to update product details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Are you sure you want to permanently move "${product.name}" to trash?`)) return;
    try {
      await moveToTrash({ id: product._id });
      toast.success("Product successfully moved to trash!");
    } catch (error) {
      toast.error(error.message || "Failed to delete product.");
    }
  };

  const printLabel = (itemId) => {
    if (!itemId) return;
    try {
      const inline = document.querySelector(`svg[data-item="${itemId}"]`);
      if (inline && inline.outerHTML) {
        const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Label</title><style>@page{size:50mm 25mm;margin:0}html,body{margin:0;padding:0}body{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center}.label{width:40mm}</style></head><body><div class="label">${inline.outerHTML}</div><script>setTimeout(()=>{window.print();setTimeout(()=>window.close(),200)},200);</script></body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) alert('Please allow popups to print barcode');
        return;
      }
    } catch (e) {}
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Label</title><style>@page{size:50mm 25mm;margin:0}html,body{margin:0;padding:0;background:#fff}body{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center}.label{width:50mm;height:25mm;display:flex;align-items:center;justify-content:center;box-sizing:border-box}.label svg{width:100%;height:auto;display:block}</style></head><body><div class="label"><svg id="barcode"></svg></div><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><script>try{JsBarcode(document.getElementById('barcode'),${JSON.stringify(itemId)},{format:'CODE128',displayValue:true,font:'monospace',fontOptions:'bold',fontSize:12,textMargin:4,margin:0,lineColor:'#000000',height:60,width:1.8});}catch(e){console.error(e);}setTimeout(()=>{window.print();setTimeout(()=>window.close(),200);},300);</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) alert('Please allow popups to print barcode');
  };

  const startEditing = (product) => {
    setEditingProductId(product._id);
  };

  // Populate form when full product data is loaded
  const populateForm = () => {
    if (editingProduct && Object.keys(editForm).length === 0) {
      setEditForm({
        name: editingProduct.name || "",
        mainCategory: editingProduct.mainCategory || "footwear",
        category: editingProduct.category || "",
        description: editingProduct.description || "",
        mainImage: editingProduct.mainImage || "",
        otherImages: editingProduct.otherImages || [],
        price: editingProduct.price?.toString() || "",
        costPrice: editingProduct.costPrice?.toString() || "",
        listedPrice: editingProduct.listedPrice?.toString() || editingProduct.originalPrice?.toString() || "",
        color: editingProduct.color || "",
        secondaryColor: editingProduct.secondaryColor || "",
        sizes: editingProduct.availableSizes || [],
        sizeStock: editingProduct.sizeStock || {},
        sizeDisplayType: editingProduct.sizeDisplayType || "alpha",
      });
    }
  };

  if (editingProduct && Object.keys(editForm).length === 0) {
    populateForm();
  }

  const closeModal = () => {
    setEditingProductId(null);
    setEditForm({});
  };

  const toggleSize = (size) => {
    const newSizes = editForm.sizes.includes(size)
      ? editForm.sizes.filter(s => s !== size)
      : [...editForm.sizes, size];
    
    const newSizeStock = { ...editForm.sizeStock };
    if (!editForm.sizes.includes(size)) {
      newSizeStock[size] = 0;
    } else {
      delete newSizeStock[size];
    }
    
    setEditForm({ ...editForm, sizes: newSizes, sizeStock: newSizeStock });
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

  const updateSizeQty = (size, value) => {
    setEditForm({
      ...editForm,
      sizeStock: { ...editForm.sizeStock, [size]: Math.max(0, parseInt(value) || 0) }
    });
  };

  const calculateTotalStock = () => {
    return Object.values(editForm.sizeStock || {}).reduce((sum, qty) => sum + (qty || 0), 0);
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
      if (data.success) {
        if (isMain) setEditForm((f) => ({ ...f, mainImage: data.url }));
        else setEditForm((f) => ({ ...f, otherImages: [...(f.otherImages || []), data.url] }));
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
        background: "#0f172a",
        color: "#fff",
        borderRadius: "10px",
      }
    });
  };

  // Drawer Price Calculations
  const cp = parseFloat(editForm.costPrice) || 0;
  const sp = parseFloat(editForm.price) || 0;
  const profit = sp - cp;
  const profitPercentage = cp > 0 ? (profit / cp) * 100 : 0;

  if (!products?.length) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/60 shadow-sm">
        <div className="w-14 h-14 bg-slate-50 border rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-700">No Products Found</h3>
        <p className="text-slate-500 text-xs mt-1">Try adjusting your queries or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Mobile Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {products.map((product) => {
            const stockVal = getTotalStock(product);
            const isOutOfStock = stockVal === 0;
            const isLowStock = stockVal > 0 && stockVal <= 10;
            const sizes = product.availableSizes || [];
            const sizeStock = product.sizeStock || {};

            return (
              <div key={product._id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors relative">
                {/* Upper Row: Image + Details */}
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-150 shadow-sm flex items-center justify-center shrink-0 relative">
                    {product.mainImage ? (
                      <img src={product.mainImage} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-350" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        className="font-bold text-slate-800 text-xs tracking-tight hover:underline cursor-pointer truncate"
                        onClick={() => startEditing(product)}
                      >
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{product.category || "—"}</p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[9px] font-bold text-slate-500 tracking-tight">{product.itemId}</span>
                      <button
                        onClick={() => copyToClipboard(product.itemId, "SKU")}
                        className="text-slate-300 hover:text-slate-550 transition-colors cursor-pointer"
                        title="Copy SKU code"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex flex-col justify-between items-end shrink-0">
                    <span className="font-extrabold text-slate-800 text-xs">₹{product.price?.toLocaleString("en-IN")}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold shadow-xs ${
                      isOutOfStock
                        ? "bg-rose-50 border-rose-100 text-rose-600"
                        : isLowStock
                        ? "bg-amber-50 border-amber-100 text-amber-600"
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${isOutOfStock ? "bg-rose-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <span>{isOutOfStock ? "Depleted" : isLowStock ? "Low" : "In Stock"}</span>
                    </span>
                  </div>
                </div>

                {/* Middle Row: Sizes Stock */}
                {sizes.length > 0 && (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2">
                    <div className="flex flex-wrap gap-1 items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sizes</span>
                      <span className={`text-[9px] font-bold ${isOutOfStock ? "text-rose-500" : isLowStock ? "text-amber-500" : "text-slate-500"}`}>
                        Total: {stockVal} Items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sizes.sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b)).map((size) => (
                        <span
                          key={size}
                          className={`text-[9px] px-1.5 py-0.5 rounded-lg border font-bold ${
                            (sizeStock[size] || 0) === 0
                              ? "bg-rose-50/60 border-rose-100 text-rose-500"
                              : "bg-white border-slate-150 text-slate-600"
                          }`}
                        >
                          {product.sizeDisplayType === "numeric" ? (SIZE_MAP[size] || size) : size}: {sizeStock[size] || 0}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Row: Actions */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                  <button
                    onClick={() => setShowBarcodeId(showBarcodeId === product._id ? null : product._id)}
                    className="text-[9px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 bg-blue-50/50 hover:bg-blue-50 px-2 py-0.5 rounded-lg cursor-pointer transition-colors border border-blue-100/50"
                  >
                    <BarcodeIcon size={10} /> Barcode Preview
                  </button>
                  {showBarcodeId === product._id && (
                    <div className="absolute bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-20 bottom-12 left-4 animate-fadeIn">
                      <Barcode value={product.itemId} width={120} height={40} dataItem={product.itemId} />
                      <span className="block text-center font-mono text-[9px] font-bold text-slate-400 mt-2">SKU: {product.itemId}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEditing(product)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl transition-all shadow-xs text-[10px] font-bold cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => printLabel(product.itemId)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 border border-blue-100 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="Print Barcode Label"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-100 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU / Code</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Stock Count</th>
                <th className="px-6 py-4 text-center">Availability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const stockVal = getTotalStock(product);
                const isOutOfStock = stockVal === 0;
                const isLowStock = stockVal > 0 && stockVal <= 10;
                const sizes = product.availableSizes || [];
                const sizeStock = product.sizeStock || {};

                return (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Item Details */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-150 shadow-sm flex items-center justify-center relative">
                          {product.mainImage ? (
                            <img src={product.mainImage} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <span
                            className="font-bold text-slate-800 text-sm tracking-tight hover:underline cursor-pointer"
                            onClick={() => startEditing(product)}
                          >
                            {product.name}
                          </span>
                          
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              onClick={() => setShowBarcodeId(showBarcodeId === product._id ? null : product._id)}
                              className="text-[9px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                            >
                              <BarcodeIcon size={9} /> Barcode Preview
                            </button>
                            {showBarcodeId === product._id && (
                              <div className="absolute bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-20 mt-6.5 animate-fadeIn">
                                <Barcode value={product.itemId} width={120} height={40} dataItem={product.itemId} />
                                <span className="block text-center font-mono text-[9px] font-bold text-slate-400 mt-2">SKU: {product.itemId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU Code */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-500 tracking-tight">{product.itemId}</span>
                        <button
                          onClick={() => copyToClipboard(product.itemId, "SKU")}
                          className="text-slate-300 hover:text-slate-550 transition-colors cursor-pointer"
                          title="Copy SKU code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4.5 text-slate-600 text-xs font-semibold">
                      {product.category || "—"}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4.5 text-right font-extrabold text-slate-800 text-sm">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </td>

                    {/* Stock quantities per size */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col items-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-[200px]">
                          {sizes.length > 0 ? (
                            sizes.sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b)).map((size) => (
                              <span
                                key={size}
                                className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold ${
                                  (sizeStock[size] || 0) === 0
                                    ? "bg-rose-50 border-rose-100 text-rose-600"
                                    : "bg-slate-50 border-slate-100 text-slate-600"
                                }`}
                              >
                                {size}: {sizeStock[size] || 0}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold block mt-1.5 ${isOutOfStock ? "text-rose-500" : isLowStock ? "text-amber-500" : "text-slate-400"}`}>
                          Total: {stockVal} Items
                        </span>
                      </div>
                    </td>

                    {/* Availability */}
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold shadow-sm justify-center ${
                        isOutOfStock
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : isLowStock
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-rose-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                        <span>{isOutOfStock ? "Depleted" : isLowStock ? "Low Stock" : "In Stock"}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEditing(product)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title="Edit Product Specs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => printLabel(product.itemId)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 border border-blue-100 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Print Barcode Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-100 rounded-xl transition-all shadow-sm cursor-pointer"
                          title="Move to Trash"
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
      </div>

      {/* Product Editor Modal */}
      <AnimatePresence>
        {editingProductId && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {!editingProduct ? (
                <div className="py-24 text-center">
                  <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">Retrieving product specs...</p>
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
                    <div>
                      <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Offline Shop Editor</span>
                      <h2 className="text-xl font-bold tracking-tight">Edit SKU #{editingProduct.itemId}</h2>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Form Group: Specs */}
                    <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                        <Package className="w-4.5 h-4.5 text-slate-500" />
                        <h3>Product Specifications</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Name *</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Main Category</label>
                          <Dropdown
                            value={editForm.mainCategory || "footwear"}
                            onChange={(val) => setEditForm({ ...editForm, mainCategory: val, category: "" })}
                            placeholder="Select Main Category"
                            align="full"
                            className="w-full"
                            options={MAIN_CATEGORIES}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                          <Dropdown
                            value={editForm.category}
                            onChange={(val) => setEditForm({ ...editForm, category: val })}
                            placeholder="Select Category"
                            align="full"
                            className="w-full"
                            options={(CATEGORY_MAP[editForm.mainCategory || "footwear"] || []).map(c => ({ value: c, label: c }))}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Color</label>
                          <Dropdown
                            value={editForm.color}
                            onChange={(val) => setEditForm({ ...editForm, color: val })}
                            placeholder="Select Color"
                            align="full"
                            className="w-full"
                            options={COLORS.map(c => ({ value: c, label: c }))}
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Group: Photo Media */}
                    <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                        <ImageIcon className="w-4.5 h-4.5 text-slate-500" />
                        <h3>Media & Visuals</h3>
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        {editForm.mainImage ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative group border shadow-sm bg-white">
                            <img src={editForm.mainImage} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, mainImage: "" })}
                              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white text-[8px] text-center font-bold">Cover</span>
                          </div>
                        ) : (
                          <label className="w-16 h-16 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-white">
                            {uploadingState.main ? (
                              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-slate-300" />
                                <span className="text-[7px] text-slate-400 font-bold mt-1">Cover</span>
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
                          <div key={i} className="w-16 h-16 rounded-xl overflow-hidden relative group border shadow-sm bg-white">
                            <img src={img} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, otherImages: editForm.otherImages.filter((_, j) => j !== i) })}
                              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {(editForm.otherImages?.length || 0) < 4 && (
                          <label className="w-16 h-16 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-white">
                            {uploadingState.secondary ? (
                              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4 text-slate-300" />
                                <span className="text-[7px] text-slate-400 mt-1 font-bold">Detail</span>
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

                    {/* Form Group: Pricing & Profit */}
                    <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                        <IndianRupee className="w-4.5 h-4.5 text-slate-500" />
                        <h3>Financials & Markup</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cost Price (₹)</label>
                          <input
                            type="number"
                            value={editForm.costPrice}
                            onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Selling Price (₹) *</label>
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-extrabold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Listed Price / MRP (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 200"
                            value={editForm.listedPrice || ""}
                            onChange={(e) => setEditForm({ ...editForm, listedPrice: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs font-extrabold focus:outline-none"
                          />
                        </div>

                        {cp > 0 && sp > 0 && (
                          <div className="col-span-1 sm:col-span-3 p-3.5 bg-white border rounded-xl flex items-center justify-between text-xs">
                            <span className="text-slate-400">Projected Margin Markup</span>
                            <span className={`font-extrabold ${profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                              ₹{profit.toFixed(0)} ({profitPercentage.toFixed(0)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Form Group: Sizes & Grid */}
                    <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                          <Layers className="w-4.5 h-4.5 text-slate-500" />
                          <h3>Sizes & Quantities</h3>
                        </div>
                        <span className="text-xs bg-white font-extrabold text-slate-700 px-3 py-1 rounded-xl shadow-sm border border-slate-200">
                          {calculateTotalStock()} Items Active
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Size Display System</label>
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="editSizeDisplayType"
                                checked={editForm.sizeDisplayType === "alpha"}
                                onChange={() => handleSizeDisplayTypeChange("alpha")}
                                className="accent-slate-900 cursor-pointer"
                              />
                              Alpha (S, M, L)
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="editSizeDisplayType"
                                checked={editForm.sizeDisplayType === "numeric"}
                                onChange={() => handleSizeDisplayTypeChange("numeric")}
                                className="accent-slate-900 cursor-pointer"
                              />
                              Numeric (28, 30, 32)
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="editSizeDisplayType"
                                checked={editForm.sizeDisplayType === "free"}
                                onChange={() => handleSizeDisplayTypeChange("free")}
                                className="accent-slate-900 cursor-pointer"
                              />
                              One Size / Free Size
                            </label>
                          </div>
                        </div>

                        {editForm.sizeDisplayType !== "free" && (
                          <div className="flex flex-wrap gap-2">
                            {ALL_SIZES.map((s) => {
                              const isActive = editForm.sizes?.includes(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => toggleSize(s)}
                                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                                    isActive
                                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-50"
                                  }`}
                                >
                                  {editForm.sizeDisplayType === "numeric" ? (SIZE_MAP[s] || s) : s}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {editForm.sizes?.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 animate-fadeIn">
                            {editForm.sizes
                              .sort((a, b) => {
                                if (a === "OS") return -1;
                                if (b === "OS") return 1;
                                return ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b);
                              })
                              .map((s) => (
                                <div key={s} className="bg-white border rounded-xl p-2 text-center shadow-xs">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                                    {s === "OS" ? "One Size (OS)" : (editForm.sizeDisplayType === "numeric" ? (SIZE_MAP[s] || s) : s)}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editForm.sizeStock?.[s] === 0 ? "0" : (editForm.sizeStock?.[s] || "")}
                                    onChange={(e) => updateSizeQty(s, e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold focus:outline-none focus:border-slate-800"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons (Sticky at bottom) */}
                  <div className="flex gap-3 p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Catalog Changes</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
