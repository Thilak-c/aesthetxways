"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Save,
  RefreshCw,
  X,
  Edit,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aesthetxways.com";

const getDisplayImageUrl = (url) => {
  if (!url) return "";
  const idx = url.indexOf("/api/uploads/");
  if (idx !== -1) {
    return url.substring(idx);
  }
  return url;
};

export default function BannersPage() {
  const banners = useQuery(api.banners.getBanners);
  const products = useQuery(api.products.getAllProducts);
  const updateBanner = useMutation(api.banners.updateBanner);

  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUploading, setModalUploading] = useState(false);

  // Modal configuration state
  const [modalConfig, setModalConfig] = useState({
    position: "left",
    imageUrl: "",
    productLink: ""
  });

  // Local state for banners display
  const [bannerConfig, setBannerConfig] = useState({
    left: { imageUrl: "", productLink: "" },
    right_top: { imageUrl: "", productLink: "" },
    right_bottom: { imageUrl: "", productLink: "" }
  });

  // Sync loaded banners to local state
  useEffect(() => {
    if (banners) {
      const config = {
        left: { imageUrl: "", productLink: "" },
        right_top: { imageUrl: "", productLink: "" },
        right_bottom: { imageUrl: "", productLink: "" }
      };
      banners.forEach((b) => {
        if (config[b.position]) {
          config[b.position] = {
            imageUrl: b.imageUrl,
            productLink: b.productLink
          };
        }
      });
      setBannerConfig(config);
    }
  }, [banners]);

  // Open modal pre-populated with a specific position
  const openModal = (position) => {
    const targetPos = position || "left";
    setModalConfig({
      position: targetPos,
      imageUrl: bannerConfig[targetPos]?.imageUrl || "",
      productLink: bannerConfig[targetPos]?.productLink || ""
    });
    setIsModalOpen(true);
  };

  // Sync modal when position dropdown changes
  const handleModalPositionChange = (pos) => {
    setModalConfig({
      position: pos,
      imageUrl: bannerConfig[pos]?.imageUrl || "",
      productLink: bannerConfig[pos]?.productLink || ""
    });
  };

  // Upload image inside the modal
  const uploadModalImage = async (file) => {
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      toast.error("Image file is too large. Please select an image under 4MB.");
      return;
    }

    setModalUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      toast.loading("Uploading image...", { id: "modal-upload" });
      const res = await fetch("/api/upload", { method: "POST", body: fd });

      if (res.status === 413) {
        toast.error("Upload failed: Image file is too large for the server.", { id: "modal-upload" });
        return;
      }
      if (!res.ok) {
        toast.error(`Upload failed (Status ${res.status})`, { id: "modal-upload" });
        return;
      }

      const data = await res.json();

      if (data.success && data.url) {
        setModalConfig((prev) => ({
          ...prev,
          imageUrl: data.url
        }));
        toast.success("Image uploaded!", { id: "modal-upload" });
      } else {
        toast.error(data.error || "Upload failed.", { id: "modal-upload" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: Invalid server response.", { id: "modal-upload" });
    } finally {
      setModalUploading(false);
    }
  };

  // Save banner configuration from the modal
  const handleModalSave = async () => {
    if (!modalConfig.imageUrl) {
      return toast.error("Please upload an image.");
    }
    if (!modalConfig.productLink.trim()) {
      return toast.error("Please select or enter a link.");
    }

    setSaving(true);
    try {
      await updateBanner({
        position: modalConfig.position,
        imageUrl: modalConfig.imageUrl,
        productLink: modalConfig.productLink
      });

      // Update local state display
      setBannerConfig((prev) => ({
        ...prev,
        [modalConfig.position]: {
          imageUrl: modalConfig.imageUrl,
          productLink: modalConfig.productLink
        }
      }));

      toast.success("Banner saved successfully!");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save banner.");
    } finally {
      setSaving(false);
    }
  };

  // Pre-seed helper to configure and save defaults immediately
  const preSeedBanners = async () => {
    setSaving(true);
    const baseUrl = window.location.origin;
    try {
      await Promise.all([
        updateBanner({
          position: "left",
          imageUrl: `${baseUrl}/api/uploads/b1.webp`,
          productLink: "/product/dusty-fade-baggy-jeans"
        }),
        updateBanner({
          position: "right_top",
          imageUrl: `${baseUrl}/api/uploads/b2.webp`,
          productLink: "/product/black-fade-baggy-jeans"
        }),
        updateBanner({
          position: "right_bottom",
          imageUrl: `${baseUrl}/api/uploads/b3.webp`,
          productLink: "/product/glacier-wash-baggy-jeans"
        })
      ]);

      setBannerConfig({
        left: {
          imageUrl: `${baseUrl}/api/uploads/b1.webp`,
          productLink: "/product/dusty-fade-baggy-jeans"
        },
        right_top: {
          imageUrl: `${baseUrl}/api/uploads/b2.webp`,
          productLink: "/product/black-fade-baggy-jeans"
        },
        right_bottom: {
          imageUrl: `${baseUrl}/api/uploads/b3.webp`,
          productLink: "/product/glacier-wash-baggy-jeans"
        }
      });

      toast.success("Default banners seeded!");
    } catch (err) {
      toast.error("Failed to seed default banners.");
    } finally {
      setSaving(false);
    }
  };

  const positions = [
    {
      id: "left",
      label: "Left Banner",
      description: "Recommended: 1200x1500px (4:5)"
    },
    {
      id: "right_top",
      label: "Top Right Banner",
      description: "Recommended: 1200x1500px (4:5)"
    },
    {
      id: "right_bottom",
      label: "Bottom Right Banner",
      description: "Recommended: 1200x1500px (4:5)"
    }
  ];

  const isLoading = banners === undefined || products === undefined;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 pt-12 lg:pt-0">
            <Link
              href="/website/analytics"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Hero Banners
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Manage landing page banners and product links.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={preSeedBanners}
                  disabled={saving || isLoading}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 text-slate-700 disabled:text-slate-400 rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? "Seeding..." : "Seed Defaults"}
                </button>
                <button
                  onClick={() => openModal("left")}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Banner</span>
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
              <p className="text-sm font-bold">Loading banner configuration...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {positions.map((pos) => {
                const config = bannerConfig[pos.id] || { imageUrl: "", productLink: "" };

                return (
                  <div
                    key={pos.id}
                    className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Title & Description */}
                      <div className="mb-4">
                        <h3 className="font-extrabold text-slate-800 text-sm">{pos.label}</h3>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {pos.description}
                        </p>
                      </div>

                      {/* Image Preview */}
                      <div className="mb-5">
                        {config.imageUrl ? (
                          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border shadow-sm bg-slate-50">
                            <img src={getDisplayImageUrl(config.imageUrl)} className="w-full h-full object-cover" alt={pos.label} />
                          </div>
                        ) : (
                          <div className="w-full aspect-[4/5] border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50">
                            <ImageIcon className="w-6 h-6 text-slate-350" />
                            <span className="text-[10px] text-slate-400 mt-2 font-bold">No Image Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* Product Link Display */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Link URL
                          </label>
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[38px] overflow-hidden">
                            <LinkIcon className="text-slate-400 w-3.5 h-3.5 flex-shrink-0" />
                            {config.productLink ? (
                              <a
                                href={config.productLink.startsWith("http") ? config.productLink : `${APP_URL}${config.productLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-850 hover:underline truncate font-medium flex-1"
                              >
                                {config.productLink.startsWith("http") ? config.productLink : `${APP_URL}${config.productLink}`}
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 italic flex-1">
                                No product linked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openModal(pos.id)}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Banner</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Portal / Overlay */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <h3 className="font-extrabold text-slate-900 text-base">Upload & Configure Banner</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-1 space-y-5">
                  {/* Select Position */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1.5">
                      Banner Position
                    </label>
                    <select
                      value={modalConfig.position}
                      onChange={(e) => handleModalPositionChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none font-bold"
                    >
                      <option value="left">Left Banner (4:5)</option>
                      <option value="right_top">Top Right Banner (4:5)</option>
                      <option value="right_bottom">Bottom Right Banner (4:5)</option>
                    </select>
                  </div>

                  {/* Upload Image Section */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1.5">
                      Banner Image
                    </label>
                    {modalConfig.imageUrl ? (
                      <div className="relative w-full aspect-[4/5] max-w-[200px] mx-auto rounded-2xl overflow-hidden group border shadow-sm bg-slate-50">
                        <img src={getDisplayImageUrl(modalConfig.imageUrl)} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() =>
                            setModalConfig((prev) => ({
                              ...prev,
                              imageUrl: ""
                            }))
                          }
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white text-xs font-bold gap-1.5"
                        >
                          <X className="w-5 h-5" /> Remove Image
                        </button>
                      </div>
                    ) : (
                      <label className="w-full aspect-[4/5] max-w-[200px] mx-auto border-2 border-dashed border-slate-200 hover:border-slate-450 hover:bg-slate-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all">
                        {modalUploading ? (
                          <>
                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                            <span className="text-[10px] text-slate-400 mt-2">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-350" />
                            <span className="text-[10px] text-slate-500 font-bold mt-2">Upload Image</span>
                            <span className="text-[8px] text-slate-400 mt-1">PNG, JPG, WebP</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={modalUploading}
                          onChange={(e) => e.target.files?.[0] && uploadModalImage(e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>

                  {/* Destination URL Link */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1.5">
                      Destination Link
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[38px] overflow-hidden">
                      <LinkIcon className="text-slate-400 w-3.5 h-3.5 flex-shrink-0" />
                      {modalConfig.productLink ? (
                        <a
                          href={modalConfig.productLink.startsWith("http") ? modalConfig.productLink : `${APP_URL}${modalConfig.productLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate font-medium flex-1"
                        >
                          {modalConfig.productLink.startsWith("http") ? modalConfig.productLink : `${APP_URL}${modalConfig.productLink}`}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic flex-1">
                          No product linked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Dropdown Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1.5">
                      Link Product Shortcut
                    </label>
                    <select
                      value={modalConfig.productLink.replace("/product/", "")}
                      onChange={(e) => {
                        if (e.target.value) {
                          setModalConfig((prev) => ({
                            ...prev,
                            productLink: `/product/${e.target.value}`
                          }));
                        } else {
                          setModalConfig((prev) => ({
                            ...prev,
                            productLink: ""
                          }));
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-800 rounded-xl text-xs focus:outline-none font-bold"
                    >
                      <option value="">-- Choose Product --</option>
                      {products?.map((p) => (
                        <option key={p.itemId} value={p.itemId}>
                          [{p.itemId}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-end gap-3.5">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalSave}
                    disabled={saving || modalUploading}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Save className="w-4.5 h-4.5" />
                    )}
                    <span>Save Banner</span>
                  </button>
                </div>
              </div>

              {/* Transition animations and details */}
              <style jsx>{`
                .animate-fade-in {
                  animation: fadeIn 0.25s ease-out forwards;
                }
                .animate-scale-in {
                  animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes scaleIn {
                  from {
                    opacity: 0;
                    transform: scale(0.95) translateY(12px);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }
              `}</style>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
