'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  RefreshCw,
  Copy,
  Download,
  Filter,
  Check,
  Star,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Archive,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Tag,
  ArrowLeft,
  ArrowRight,
  Truck,
  Globe,
  Box,
  Percent,
  DollarSign,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  UploadCloud,
  Loader2,
} from 'lucide-react';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const CATEGORIES = [
  'Oversized T-Shirts',
  'Baggy Jeans',
  'Hoodies & Sweatshirts',
  'Cargo Pants & Lowers',
  'Jackets & Outerwear',
  'Sneakers & Footwear',
  'Caps & Headwear',
  'Accessories',
];

const ROLES = [
  { id: 'standard', label: 'Standard', desc: 'Standalone apparel item' },
  { id: 'accessory', label: 'Accessory', desc: 'Add-ons & caps' },
  { id: 'bundle', label: 'Bundle', desc: 'Combo outfit package' },
];

const SPORTS = [
  'Streetwear',
  'Casual Daily',
  'Vintage & Distressed',
  'Minimalist',
  'Urban Aesthetic',
];

const GENDERS = [
  { id: 'unisex', label: 'Unisex' },
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
];

const RETURN_POLICIES = [
  '7 Days Exchange',
  '14 Days Easy Return',
  '30 Days Wear Trial',
  'Final Sale - No Returns',
];

const PRESET_COLORS = [
  { id: 'grey', name: 'Grey', hex: '#6f7276', border: false },
  { id: 'green', name: 'Vibrant Green', hex: '#00c853', border: false },
  { id: 'black', name: 'Black', hex: '#111111', border: false },
  { id: 'white', name: 'White', hex: '#ffffff', border: true },
  { id: 'navy', name: 'Navy Blue', hex: '#1e3a8a', border: false },
  { id: 'blue', name: 'Royal Blue', hex: '#0ea5e9', border: false },
  { id: 'red', name: 'Crimson Red', hex: '#dc2626', border: false },
  { id: 'orange', name: 'Solar Orange', hex: '#ea580c', border: false },
  { id: 'sand', name: 'Beige / Sand', hex: '#e8dec8', border: false },
  { id: 'brown', name: 'Earth Brown', hex: '#78350f', border: false },
  { id: 'purple', name: 'Deep Plum', hex: '#7c3aed', border: false },
  { id: 'pink', name: 'Rose Bloom', hex: '#ec4899', border: false },
];

const DRAWER_TABS = [
  { id: 'general', label: 'General', number: '01' },
  { id: 'media', label: 'Media', number: '02' },
  { id: 'pricing', label: 'Pricing', number: '03' },
  { id: 'variants', label: 'Variants & Stock', number: '04' },
  { id: 'relations', label: 'Relationships', number: '05' },
  { id: 'shipping_seo', label: 'Shipping & SEO', number: '06' },
];

const INITIAL_EMPTY_FORM = {
  name: '',
  slug: '',
  sku: '',
  brand: 'Aesthetx Ways',
  role: 'standard',
  category: '',
  sport: '',
  gender: '',
  tags: [],
  costPrice: '',
  priceNumber: '',
  basePrice: '',
  originalPrice: '',
  image: '',
  gallery: [],
  color: '',
  colorHex: '',
  description: '',
  variants: ALL_SIZES.map((sz) => ({
    size: sz,
    sku: '',
    stock: '',
    priceOverride: '',
    active: false,
  })),
  availableSizes: [],
  colorways: [],
  linkedColorways: [],
  relatedProducts: [],
  accessories: [],
  comboItems: [],
  comboPrice: '',
  weight: '',
  returnPolicy: '',
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: [],
  },
  hidden: false,
  featured: false,
};

// --- SIGNATURE LOGIN-MODAL FLOATING FORM SYSTEM ---
function FloatingInput({
  label,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onClick,
  type = 'text',
  required = false,
  min,
  max,
  step,
  maxLength,
  prefix,
  helper,
  disabled = false,
  fontMono = false,
  className = '',
  compact = false,
  autoSelectOnFocus = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const hasValue = value !== '' && value !== null && value !== undefined;
  const isFloating = isFocused || hasValue;

  const handleFocus = (e) => {
    setIsFocused(true);
    if (autoSelectOnFocus || type === 'number') {
      try {
        e.target.select();
      } catch (err) { }
    }
    if (onFocus) onFocus(e);
  };

  const handleClick = (e) => {
    if (autoSelectOnFocus || type === 'number') {
      try {
        e.target.select();
      } catch (err) { }
    }
    if (onClick) onClick(e);
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className={`relative w-full ${compact ? 'h-[44px] px-3 rounded-[6px]' : 'h-[52px] sm:h-[54px] px-4 rounded-[8px]'
          } border transition-colors cursor-text bg-white flex items-center ${isFocused ? 'border-[#111111]' : 'border-[#8d8d8d]'
          } ${disabled ? 'bg-neutral-50/70 cursor-not-allowed opacity-75' : ''}`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none truncate max-w-[calc(100%-14px)] ${isFloating
              ? `-top-2 left-2.5 px-1 bg-white leading-none z-10 ${compact ? 'text-[10.5px] text-[#111111] font-medium' : 'text-[12px] text-[#111111] font-normal'
              }`
              : `top-1/2 -translate-y-1/2 left-3 ${compact ? 'text-[12.5px] text-[#707072]' : 'text-[14px] sm:text-[15px] text-[#707072]'
              }`
            }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <div className="flex items-center w-full min-w-0">
          {prefix && isFloating && (
            <span
              className={`${compact ? 'text-[13px]' : 'text-[14px] sm:text-[15px]'
                } text-[#111111] font-normal select-none pr-1 shrink-0`}
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              {prefix}
            </span>
          )}
          <input
            ref={inputRef}
            type={type}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            value={value ?? ''}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={handleFocus}
            onClick={handleClick}
            onBlur={() => setIsFocused(false)}
            className={`w-full bg-transparent ${compact ? 'text-[13px]' : 'text-[14px] sm:text-[15px]'
              } text-[#111111] font-normal outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
          />
        </div>
      </div>
      {helper && (
        <p
          className="text-[11.5px] text-[#707072] mt-1 px-1"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function FloatingSelect({
  label,
  value,
  options,
  onSelect,
  required = false,
  helper,
  className = '',
  onAddOption,
  onRemoveOption,
  addLabel,
  onAddCustom,
  addCustomLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef(null);

  const addFn = onAddOption || onAddCustom;
  const actionText = addLabel || addCustomLabel || `Add ${label}`;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsAdding(false);
        setCustomInput('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveCustom = (e) => {
    e.stopPropagation();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (addFn) {
      addFn(trimmed);
    } else {
      onSelect(trimmed);
    }
    setCustomInput('');
    setIsAdding(false);
    setIsOpen(false);
  };

  const isFloating = isOpen || Boolean(value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-full h-[52px] sm:h-[54px] px-4 rounded-[8px] border transition-colors cursor-pointer bg-white flex items-center justify-between ${isOpen ? 'border-[#111111]' : 'border-[#8d8d8d]'
          }`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${isFloating
              ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
              : 'top-1/2 -translate-y-1/2 left-4 text-[14px] sm:text-[15px] text-[#707072]'
            }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <span
          className={`text-[14px] sm:text-[15px] text-[#111111] font-normal truncate mr-2 ${value ? 'opacity-100' : 'opacity-0'
            }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {value || 'Select'}
        </span>

        <svg
          className={`w-3.5 h-3.5 text-[#111111] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''
            }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-[10px] shadow-xl py-1 z-40 max-h-64 flex flex-col">
          <div className="overflow-y-auto flex-1 max-h-48 py-0.5">
            {options.map((opt) => {
              const optVal = typeof opt === 'string' ? opt : opt.label;
              const optKey = typeof opt === 'string' ? opt : opt.id || opt.label;
              const isSelected = value === optVal || value === optKey;
              return (
                <div
                  key={optKey}
                  onClick={() => {
                    onSelect(optVal);
                    setIsOpen(false);
                  }}
                  className={`group w-full flex items-center justify-between px-4 py-2.5 text-[14px] sm:text-[15px] transition-colors cursor-pointer select-none ${isSelected
                      ? '  text-[#111111] font-medium'
                      : 'text-[#222222] hover:bg-[#fafafa]'
                    }`}
                  style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                >
                  <span className="truncate flex-1 mr-2">{optVal}</span>

                  {onRemoveOption && (
                    <button
                      type="button"
                      title={`Remove "${optVal}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveOption(optVal);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#707072] hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {addFn && (
            <div className="border-t border-[#e5e5e5] p-2 bg-[#fafafa] shrink-0 rounded-b-[10px]">
              {isAdding ? (
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={`New ${label.toLowerCase()}...`}
                    autoFocus
                    className="flex-1 h-8 px-2.5 text-[13px] bg-white border border-[#111111] rounded-[6px] outline-none text-[#111111]"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveCustom(e);
                      } else if (e.key === 'Escape') {
                        setIsAdding(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    disabled={!customInput.trim()}
                    className="h-8 px-2.5 bg-[#111111] hover:bg-black text-white text-[12px] font-medium rounded-[6px] disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setCustomInput('');
                    }}
                    className="h-8 px-2 text-[#707072] hover:text-[#111111] text-[12px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAdding(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-[13px] font-medium text-[#111111] hover:bg-[#f0f0f0] rounded-[6px] transition-colors cursor-pointer"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {actionText}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {helper && (
        <p
          className="text-[11.5px] text-[#707072] mt-1 px-1"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function FloatingTextarea({
  label,
  value,
  onChange,
  rows = 3,
  required = false,
  helper,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const hasValue = value !== '' && value !== null && value !== undefined;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => textareaRef.current?.focus()}
        className={`relative w-full rounded-[8px] border p-3.5 pt-3.5 transition-colors cursor-text bg-white ${isFocused ? 'border-[#111111]' : 'border-[#8d8d8d]'
          }`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${isFloating
              ? '-top-2.5 left-3 px-1.5 bg-white text-[12px] text-[#111111] font-normal leading-none z-10'
              : 'top-3.5 left-4 text-[14px] sm:text-[15px] text-[#707072]'
            }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <textarea
          ref={textareaRef}
          rows={rows}
          required={required}
          value={value ?? ''}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#111111] font-normal outline-none p-0 resize-none leading-relaxed mt-1"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        />
      </div>
      {helper && (
        <p
          className="text-[11.5px] text-[#707072] mt-1 px-1"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function LoginStyleCheckbox({ checked, onChange, title, subtitle }) {
  return (
    <div
      onClick={onChange}
      className="flex items-start gap-3 cursor-pointer group select-none py-1"
    >
      <div
        className={`w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked
            ? 'bg-[#111111] text-white border border-[#111111]'
            : 'bg-white border-2 border-[#8d8d8d] group-hover:border-[#111111]'
          }`}
      >
        {checked && (
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-[14px] sm:text-[15px] font-medium text-[#111111] block leading-tight"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className="text-[12.5px] text-[#707072] block mt-0.5"
            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const shouldOpenNew = searchParams.get('action') === 'new';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // 1 & 2. Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [sportsList, setSportsList] = useState(SPORTS);
  const [returnPoliciesList, setReturnPoliciesList] = useState(RETURN_POLICIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'out_of_stock' | 'visible' | 'hidden'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name_asc' | 'price_asc' | 'price_desc'

  // 10. Bulk selection
  const [selectedSlugs, setSelectedSlugs] = useState([]);

  // 3. Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeDrawerTab, setActiveDrawerTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [metaTagInput, setMetaTagInput] = useState('');
  const [isCustomMetaTitle, setIsCustomMetaTitle] = useState(false);
  const [isCustomMetaDesc, setIsCustomMetaDesc] = useState(false);
  const [isCustomMetaTags, setIsCustomMetaTags] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [relationsSearch, setRelationsSearch] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const fileInputRef = useRef(null);

  // 9. Safe deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State covering all modules - completely clean, no default dummy values
  const [formData, setFormData] = useState(INITIAL_EMPTY_FORM);

  // Required Field Validation: Don't let admin add product until all required fields are filled
  const getRequiredFieldIssues = () => {
    const issues = [];
    if (!formData.name?.trim()) {
      issues.push({ field: 'name', label: 'Product Name', tab: 'general' });
    }
    if (!formData.slug?.trim()) {
      issues.push({ field: 'slug', label: 'Slug', tab: 'general' });
    }
    if (!formData.sku?.trim()) {
      issues.push({ field: 'sku', label: 'SKU Code', tab: 'general' });
    }
    if (!formData.category?.trim()) {
      issues.push({ field: 'category', label: 'Category', tab: 'general' });
    }
    if (!formData.sport?.trim()) {
      issues.push({ field: 'sport', label: 'Sport', tab: 'general' });
    }
    if (!formData.gender?.trim()) {
      issues.push({ field: 'gender', label: 'Target Audience', tab: 'general' });
    }
    if (!formData.description?.trim()) {
      issues.push({ field: 'description', label: 'Product Description', tab: 'general' });
    }
    if (!formData.image?.trim()) {
      issues.push({ field: 'image', label: 'Cover Image', tab: 'media' });
    }
    if (!formData.color?.trim() && !formData.colorHex?.trim()) {
      issues.push({ field: 'color', label: 'Product Color', tab: 'media' });
    }
    if (!formData.priceNumber || Number(formData.priceNumber) <= 0) {
      issues.push({ field: 'priceNumber', label: 'Selling Price', tab: 'pricing' });
    }
    const activeVariants = (formData.variants || []).filter(
      (v) => v.active && v.stock !== '' && Number(v.stock) >= 0
    );
    if (activeVariants.length === 0) {
      issues.push({
        field: 'variants',
        label: 'At least 1 active size variant with stock',
        tab: 'variants',
      });
    }
    return issues;
  };

  const requiredIssues = getRequiredFieldIssues();
  const isFormValid = requiredIssues.length === 0;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchTaxonomies = async () => {
    try {
      const res = await fetch('/api/taxonomies');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategoriesList(data.categories);
        }
        if (Array.isArray(data.sports) && data.sports.length > 0) {
          setSportsList(data.sports);
        }
        if (Array.isArray(data.returnPolicies) && data.returnPolicies.length > 0) {
          setReturnPoliciesList(data.returnPolicies);
        }
      }
    } catch (err) {
      console.error('Failed to fetch taxonomies:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        const prods = json.products || [];
        setProducts(prods);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (newCat) => {
    const clean = (newCat || '').trim();
    if (!clean) return;
    setCategoriesList((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setFormData((prev) => ({ ...prev, category: clean }));
    showToast(`Added category "${clean}"`);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', action: 'add', value: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) setCategoriesList(data.categories);
      }
    } catch (err) {
      console.error('Failed to save category to database:', err);
    }
  };

  const handleRemoveCategory = async (catToRemove) => {
    const clean = (catToRemove || '').trim();
    if (!clean) return;
    setCategoriesList((prev) => prev.filter((c) => c !== clean));
    if (formData.category === clean) {
      setFormData((f) => ({ ...f, category: '' }));
    }
    showToast(`Removed category "${clean}"`);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', action: 'remove', value: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) setCategoriesList(data.categories);
      }
    } catch (err) {
      console.error('Failed to remove category from database:', err);
    }
  };

  const handleAddSport = async (newSport) => {
    const clean = (newSport || '').trim();
    if (!clean) return;
    setSportsList((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setFormData((prev) => ({ ...prev, sport: clean }));
    showToast(`Added sport "${clean}"`);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sport', action: 'add', value: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sports)) setSportsList(data.sports);
      }
    } catch (err) {
      console.error('Failed to save sport to database:', err);
    }
  };

  const handleRemoveSport = async (sportToRemove) => {
    const clean = (sportToRemove || '').trim();
    if (!clean) return;
    setSportsList((prev) => prev.filter((s) => s !== clean));
    if (formData.sport === clean) {
      setFormData((f) => ({ ...f, sport: '' }));
    }
    showToast(`Removed sport "${clean}"`);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sport', action: 'remove', value: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sports)) setSportsList(data.sports);
      }
    } catch (err) {
      console.error('Failed to remove sport from database:', err);
    }
  };

  const handleAddReturnPolicy = async (newPolicy) => {
    const clean = (newPolicy || '').trim();
    if (!clean) return;
    setReturnPoliciesList((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setFormData((prev) => ({ ...prev, returnPolicy: clean }));
    showToast(`Added return policy "${clean}"`);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'returnPolicy', action: 'add', value: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.returnPolicies)) setReturnPoliciesList(data.returnPolicies);
      }
    } catch (err) {
      console.error('Failed to save return policy to database:', err);
    }
  };

  const handleRemoveReturnPolicy = async (policyToRemove) => {
    const clean = (policyToRemove || '').trim();
    if (!clean) return;
    setReturnPoliciesList((prev) => prev.filter((p) => p !== clean));
    if (formData.returnPolicy === clean) {
      setFormData((f) => ({ ...f, returnPolicy: '' }));
    }
    showToast(`Removed return policy "${clean}"`);

    try {
      const res = await fetch('/api/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'returnPolicy', action: 'remove', value: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.returnPolicies)) setReturnPoliciesList(data.returnPolicies);
      }
    } catch (err) {
      console.error('Failed to remove return policy from database:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTaxonomies();
    if (shouldOpenNew) {
      openCreateModal();
    }
  }, [shouldOpenNew]);

  // 3. Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setActiveDrawerTab('general');
    setCustomImageUrl('');
    setRelationsSearch('');
    setNewSizeInput('');
    setIsCustomMetaTitle(false);
    setIsCustomMetaDesc(false);
    setIsCustomMetaTags(false);
    setMetaTagInput('');
    setFormData({
      ...INITIAL_EMPTY_FORM,
      variants: ALL_SIZES.map((sz) => {
        const isCommon = ['S', 'M', 'L', 'XL', 'XXL'].includes(sz);
        return {
          size: sz,
          sku: '',
          stock: isCommon ? 12 : '',
          priceOverride: '',
          active: isCommon,
        };
      }),
    });
    setIsModalOpen(true);
  };

  // 3. Open Edit Modal
  const openEditModal = (prod) => {
    setModalMode('edit');
    setActiveDrawerTab('general');
    setCustomImageUrl('');
    setRelationsSearch('');
    setNewSizeInput('');
    const hasCustomTitle = Boolean(prod.seo?.metaTitle && prod.seo.metaTitle !== prod.name);
    const hasCustomDesc = Boolean(prod.seo?.metaDescription && prod.seo.metaDescription !== prod.description);
    const hasCustomKeywords = Array.isArray(prod.seo?.keywords) && prod.seo.keywords.length > 0;
    setIsCustomMetaTitle(hasCustomTitle);
    setIsCustomMetaDesc(hasCustomDesc);
    setIsCustomMetaTags(hasCustomKeywords);
    setMetaTagInput('');
    const mainImg = prod.image || prod.mainImage || (Array.isArray(prod.gallery) && prod.gallery[0]) || '';
    const baseSku = prod.sku || '';
    const initialColor = prod.color || (Array.isArray(prod.colorways) && prod.colorways[0]) || '';
    const initialColorHex = prod.colorHex || PRESET_COLORS.find((p) => p.name.toLowerCase() === initialColor.toLowerCase())?.hex || '';

    // Resolve variants - merge ALL_SIZES with any saved variants so ALL sizes are available on edit
    const existingVariants = Array.isArray(prod.variants) ? prod.variants : [];
    const activeSizes = Array.isArray(prod.availableSizes) ? prod.availableSizes : [];
    const existingMap = new Map();
    existingVariants.forEach((v) => {
      if (v && v.size) {
        existingMap.set(v.size.toLowerCase(), v);
      }
    });

    const allSizesList = [...ALL_SIZES];
    existingVariants.forEach((v) => {
      if (v?.size && !allSizesList.some((s) => s.toLowerCase() === v.size.toLowerCase())) {
        allSizesList.push(v.size);
      }
    });

    const variants = allSizesList.map((sz) => {
      const match = existingMap.get(sz.toLowerCase());
      if (match) {
        return {
          size: match.size || sz,
          sku: match.sku || (baseSku ? `${baseSku}-${sz.replace(/\s+/g, '')}` : ''),
          stock: match.stock === 0 || match.stock === '0' || match.stock === '' || match.stock === null || match.stock === undefined ? '' : match.stock,
          priceOverride: match.priceOverride === null || match.priceOverride === undefined ? '' : match.priceOverride,
          active: match.active !== false,
        };
      }
      return {
        size: sz,
        sku: baseSku ? `${baseSku}-${sz.replace(/\s+/g, '')}` : '',
        stock: '',
        priceOverride: '',
        active: activeSizes.includes(sz),
      };
    });

    setFormData({
      name: prod.name || '',
      slug: prod.slug || prod.id || '',
      sku: baseSku,
      brand: prod.brand || '',
      role: prod.role || 'standard',
      category: prod.category || '',
      sport: prod.sport || '',
      gender: prod.gender || '',
      tags: Array.isArray(prod.tags) ? prod.tags : [],
      costPrice: prod.costPrice || '',
      priceNumber: prod.priceNumber || '',
      basePrice: prod.basePrice || prod.priceNumber || '',
      originalPrice: prod.originalPrice || '',
      image: mainImg,
      gallery: Array.isArray(prod.gallery) && prod.gallery.length > 0 ? prod.gallery : (mainImg ? [mainImg] : []),
      color: initialColor,
      colorHex: initialColorHex,
      description: prod.description || '',
      variants,
      availableSizes: Array.isArray(prod.availableSizes) ? prod.availableSizes : [],
      colorways: Array.isArray(prod.linkedColorways) && prod.linkedColorways.length > 0
        ? prod.linkedColorways
        : (Array.isArray(prod.colorways) ? prod.colorways.filter((s) => s !== initialColor) : []),
      linkedColorways: Array.isArray(prod.linkedColorways) && prod.linkedColorways.length > 0
        ? prod.linkedColorways
        : (Array.isArray(prod.colorways) ? prod.colorways.filter((s) => s !== initialColor) : []),
      relatedProducts: Array.isArray(prod.relatedProducts) ? prod.relatedProducts : [],
      accessories: Array.isArray(prod.accessories) ? prod.accessories : [],
      comboItems: Array.isArray(prod.comboItems) ? prod.comboItems : [],
      comboPrice: prod.comboPrice || '',
      weight: prod.shipping?.weight || prod.weight || '',
      returnPolicy: prod.shipping?.returnPolicy || prod.returnPolicy || '',
      seo: {
        metaTitle: prod.seo?.metaTitle || prod.name || '',
        metaDescription: prod.seo?.metaDescription || prod.description || '',
        keywords: Array.isArray(prod.seo?.keywords) && prod.seo.keywords.length > 0
          ? prod.seo.keywords
          : (Array.isArray(prod.tags) ? prod.tags : []),
      },
      hidden: prod.hidden === true || prod.inStock === false,
      featured: prod.featured === true,
    });
    setIsModalOpen(true);
  };

  // 4. Show/Hide Single Product
  const handleToggleHide = async (slug, currentHidden) => {
    try {
      const newHidden = !currentHidden;
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, hidden: newHidden, inStock: !newHidden }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update visibility');
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.slug === slug || p.id === slug
            ? { ...p, hidden: newHidden, inStock: !newHidden }
            : p
        )
      );
      showToast(newHidden ? 'Product hidden from store' : 'Product visible in store');
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      showToast(err.message || 'Failed to toggle visibility');
      fetchProducts();
    }
  };

  // 12. Featured Single Product
  const handleToggleFeatured = async (slug, currentFeatured, e) => {
    if (e) e.stopPropagation();
    try {
      const newFeatured = !currentFeatured;
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, featured: newFeatured }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update featured flag');
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.slug === slug || p.id === slug ? { ...p, featured: newFeatured } : p
        )
      );
      showToast(newFeatured ? 'Marked as Featured' : 'Removed from Featured');
    } catch (err) {
      console.error('Failed to toggle featured:', err);
      showToast(err.message || 'Failed to toggle featured');
      fetchProducts();
    }
  };

  // 8. Duplicate Product
  const handleDuplicateProduct = async (prod, e) => {
    if (e) e.stopPropagation();
    try {
      const copySuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanSlug = `${prod.slug || prod.id}-copy-${copySuffix}`;
      const duplicateData = {
        name: `${prod.name} (Copy)`,
        slug: cleanSlug,
        sku: `${(prod.sku || 'SNU').replace(/-CPY.*/, '')}-CPY-${copySuffix}`,
        category: prod.category || '',
        priceNumber: prod.priceNumber || 0,
        originalPrice: prod.originalPrice || null,
        image: prod.image || '',
        gallery: Array.isArray(prod.gallery) ? [...prod.gallery] : (prod.image ? [prod.image] : []),
        description: prod.description || '',
        availableSizes: prod.availableSizes || [...ALL_SIZES],
        inStock: prod.inStock !== false,
        hidden: true, // Hidden by default for safety
        featured: false,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData),
      });

      if (res.ok) {
        const json = await res.json();
        setProducts((prev) => [json.product, ...prev]);
        showToast(`Duplicated as "${duplicateData.name}"`);
        openEditModal(json.product);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to duplicate product');
      }
    } catch (err) {
      console.error('Failed to duplicate:', err);
      alert('Network error while duplicating product');
    }
  };

  // 9. Safe Deletion & Archive
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    const slug = deleteTarget.slug || deleteTarget.id;
    try {
      const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete product from database');
      }

      setProducts((prev) => prev.filter((p) => p.slug !== slug && p.id !== slug));
      setDeleteTarget(null);
      showToast('Product deleted');
    } catch (err) {
      console.error('Failed to delete product:', err);
      showToast(err.message || 'Error deleting product');
      fetchProducts();
    }
  };

  // 10. Bulk Actions
  const toggleSelectAll = () => {
    if (selectedSlugs.length === filteredAndSortedProducts.length) {
      setSelectedSlugs([]);
    } else {
      setSelectedSlugs(filteredAndSortedProducts.map((p) => p.slug || p.id));
    }
  };

  const toggleSelectRow = (slug, e) => {
    if (e) e.stopPropagation();
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleBulkVisibility = async (hideState) => {
    if (selectedSlugs.length === 0) return;
    try {
      setProducts((prev) =>
        prev.map((p) =>
          selectedSlugs.includes(p.slug || p.id)
            ? { ...p, hidden: hideState, inStock: !hideState }
            : p
        )
      );
      await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slugs: selectedSlugs,
          hidden: hideState,
          inStock: !hideState,
        }),
      });
      showToast(hideState ? `Hid ${selectedSlugs.length} products` : `Made ${selectedSlugs.length} products visible`);
      setSelectedSlugs([]);
    } catch (err) {
      console.error('Bulk visibility error:', err);
      fetchProducts();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSlugs.length === 0) return;
    if (!confirm(`Permanently delete ${selectedSlugs.length} selected products?`)) return;
    try {
      const slugsToDelete = [...selectedSlugs];
      const res = await fetch(`/api/products?slugs=${encodeURIComponent(slugsToDelete.join(','))}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete products from database');
      }

      setProducts((prev) => prev.filter((p) => !slugsToDelete.includes(p.slug || p.id)));
      setSelectedSlugs([]);
      showToast(`Deleted ${slugsToDelete.length} products`);
    } catch (err) {
      console.error('Bulk delete error:', err);
      showToast(err.message || 'Error in bulk delete');
      fetchProducts();
    }
  };

  // 15. Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Product ID',
      'Name',
      'SKU',
      'Category',
      'Selling Price',
      'Original Price',
      'Stock Status',
      'Visibility',
      'Featured',
      'Available Sizes',
      'Last Updated',
    ];
    const rows = filteredAndSortedProducts.map((p) => [
      `"${p.id || p.slug}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.sku || ''}"`,
      `"${p.category || ''}"`,
      p.priceNumber || '',
      p.originalPrice || '',
      p.inStock !== false ? 'In Stock' : 'Out of Stock',
      p.hidden === true ? 'Hidden' : 'Visible',
      p.featured ? 'Yes' : 'No',
      `"${(p.availableSizes || []).join(', ')}"`,
      `"${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB') : ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported products to CSV');
  };

  // 6. Form Submit with Strict Validation
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Check all required fields
    if (!isFormValid) {
      const firstIssue = requiredIssues[0];
      setActiveDrawerTab(firstIssue.tab);
      showToast(`Required: Please fill in "${firstIssue.label}"`);
      return;
    }

    if (formData.originalPrice && Number(formData.originalPrice) < Number(formData.priceNumber)) {
      setActiveDrawerTab('pricing');
      alert('Original price (MRP) cannot be less than the selling price.');
      return;
    }

    try {
      setSaving(true);
      const cleanWeight = formData.weight !== '' && formData.weight !== undefined && formData.weight !== null
        ? Number(formData.weight)
        : 450;

      const payload = {
        ...formData,
        weight: cleanWeight,
        shipping: {
          weight: cleanWeight,
          returnPolicy: formData.returnPolicy || '7 Days Exchange',
        },
        color: formData.color || '',
        colorHex: formData.colorHex || '',
        linkedColorways: Array.isArray(formData.linkedColorways)
          ? formData.linkedColorways
          : (Array.isArray(formData.colorways) ? formData.colorways : []),
        colorways: Array.isArray(formData.linkedColorways)
          ? formData.linkedColorways
          : (Array.isArray(formData.colorways) ? formData.colorways : []),
        seo: {
          metaTitle: formData.seo?.metaTitle?.trim() || formData.name?.trim() || '',
          metaDescription: formData.seo?.metaDescription?.trim() || formData.description?.trim() || '',
          keywords: Array.isArray(formData.seo?.keywords) && formData.seo.keywords.length > 0
            ? formData.seo.keywords
            : (Array.isArray(formData.tags) ? formData.tags : []),
        },
      };

      if (modalMode === 'create') {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = await res.json();
          setProducts((prev) => [json.product, ...prev]);
          setIsModalOpen(false);
          showToast('Product created');
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create product');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setProducts((prev) =>
            prev.map((p) => (p.slug === formData.slug ? { ...p, ...formData } : p))
          );
          setIsModalOpen(false);
          showToast('Product updated');
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update product');
        }
      }
    } catch (err) {
      console.error('Form submit error:', err);
    } finally {
      setSaving(false);
    }
  };

  // 5. Sizes & Variant Helpers
  const updateVariant = (index, field, value) => {
    setFormData((prev) => {
      const variants = [...prev.variants];
      const target = { ...variants[index], [field]: value };
      if (field === 'active' && value === true && !target.sku && prev.sku) {
        target.sku = `${prev.sku}-${target.size.replace(/\s+/g, '')}`;
      }
      if (field === 'size' && prev.sku && (!target.sku || target.sku.startsWith(prev.sku))) {
        target.sku = `${prev.sku}-${value.replace(/\s+/g, '').toUpperCase()}`;
      }
      variants[index] = target;
      return { ...prev, variants };
    });
  };

  const handleAddNewSize = () => {
    const clean = newSizeInput.trim();
    if (!clean) return;
    const formatted = clean.toUpperCase();
    setFormData((prev) => {
      const variants = Array.isArray(prev.variants) ? [...prev.variants] : [];
      const existingIdx = variants.findIndex(
        (v) => v.size.toLowerCase() === formatted.toLowerCase() || v.size.toLowerCase() === clean.toLowerCase()
      );
      if (existingIdx >= 0) {
        variants[existingIdx] = {
          ...variants[existingIdx],
          active: true,
          stock: variants[existingIdx].stock || 12,
        };
        return { ...prev, variants };
      }
      const newVar = {
        size: formatted,
        sku: prev.sku ? `${prev.sku}-${clean.replace(/\s+/g, '').toUpperCase()}` : '',
        stock: 12,
        priceOverride: '',
        active: true,
      };
      return { ...prev, variants: [...variants, newVar] };
    });
    setNewSizeInput('');
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const toggleAllSizes = (enable) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        active: enable,
        sku: enable ? (v.sku || (prev.sku ? `${prev.sku}-${v.size.replace(/\s+/g, '')}` : '')) : '',
        stock: enable ? v.stock : '',
        priceOverride: enable ? v.priceOverride : '',
      })),
    }));
  };

  const fillAllStock = (qty) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        stock: qty === 0 || qty === '' ? '' : qty,
        active: qty > 0 ? true : v.active,
        sku: v.sku || (prev.sku ? `${prev.sku}-${v.size.replace(/\s+/g, '')}` : ''),
      })),
    }));
  };

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    setFormData((prev) => {
      if (prev.tags.includes(clean)) return prev;
      const updatedTags = [...prev.tags, clean];
      return {
        ...prev,
        tags: updatedTags,
        seo: {
          ...prev.seo,
          keywords: isCustomMetaTags ? (prev.seo?.keywords || []) : updatedTags,
        },
      };
    });
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => {
      const updatedTags = prev.tags.filter((t) => t !== tagToRemove);
      return {
        ...prev,
        tags: updatedTags,
        seo: {
          ...prev.seo,
          keywords: isCustomMetaTags ? (prev.seo?.keywords || []) : updatedTags,
        },
      };
    });
  };

  const addMetaTag = (tag) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    setIsCustomMetaTags(true);
    setFormData((prev) => {
      const currentKeywords = Array.isArray(prev.seo?.keywords) ? prev.seo.keywords : [];
      if (currentKeywords.includes(clean)) return prev;
      return {
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...currentKeywords, clean],
        },
      };
    });
    setMetaTagInput('');
  };

  const removeMetaTag = (tagToRemove) => {
    setIsCustomMetaTags(true);
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: (prev.seo?.keywords || []).filter((t) => t !== tagToRemove),
      },
    }));
  };

  const toggleColorway = (slug) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.linkedColorways) && prev.linkedColorways.length > 0
        ? prev.linkedColorways
        : (Array.isArray(prev.colorways) ? prev.colorways.filter((s) => s !== prev.color) : []);
      const exists = current.includes(slug);
      const next = exists ? current.filter((s) => s !== slug) : [...current, slug];
      return {
        ...prev,
        linkedColorways: next,
        colorways: next,
      };
    });
  };

  const toggleAccessory = (slug) => {
    setFormData((prev) => {
      const exists = prev.accessories.includes(slug);
      return {
        ...prev,
        accessories: exists ? prev.accessories.filter((s) => s !== slug) : [...prev.accessories, slug],
      };
    });
  };

  const addComboComponent = (prod) => {
    const slug = prod.slug || prod.id;
    setFormData((prev) => {
      const exists = prev.comboItems.some((ci) => ci.slug === slug);
      if (exists) return prev;
      const nextItems = [
        ...prev.comboItems,
        {
          slug,
          name: prod.name,
          category: prod.category || '',
          quantity: 1,
          image: prod.image || (prod.gallery && prod.gallery[0]) || '',
          priceNumber: prod.priceNumber || 0,
        },
      ];
      const base = Number(prev.basePrice || prev.priceNumber || 0);
      const nextTotal = base + nextItems.reduce(
        (sum, ci) => sum + (Number(ci.priceNumber) || 0) * (Number(ci.quantity) || 1),
        0
      );
      return {
        ...prev,
        comboItems: nextItems,
        originalPrice: nextTotal > 0 ? String(nextTotal) : prev.originalPrice,
      };
    });
  };

  const removeComboComponent = (slug) => {
    setFormData((prev) => {
      const nextItems = prev.comboItems.filter((ci) => ci.slug !== slug);
      const base = Number(prev.basePrice || prev.priceNumber || 0);
      const nextTotal = base + nextItems.reduce(
        (sum, ci) => sum + (Number(ci.priceNumber) || 0) * (Number(ci.quantity) || 1),
        0
      );
      return {
        ...prev,
        comboItems: nextItems,
        originalPrice: nextTotal > 0 ? String(nextTotal) : '',
      };
    });
  };

  const updateComboQuantity = (slug, delta) => {
    setFormData((prev) => {
      const nextItems = prev.comboItems.map((ci) =>
        ci.slug === slug ? { ...ci, quantity: Math.max(1, ci.quantity + delta) } : ci
      );
      const base = Number(prev.basePrice || prev.priceNumber || 0);
      const nextTotal = base + nextItems.reduce(
        (sum, ci) => sum + (Number(ci.priceNumber) || 0) * (Number(ci.quantity) || 1),
        0
      );
      return {
        ...prev,
        comboItems: nextItems,
        originalPrice: nextTotal > 0 ? String(nextTotal) : prev.originalPrice,
      };
    });
  };

  // 7. Gallery Management & File Upload Helpers
  const addGalleryImage = (url) => {
    if (!url) return;
    setFormData((prev) => {
      const currentGallery = Array.isArray(prev.gallery) ? prev.gallery : [];
      if (currentGallery.includes(url)) return prev;
      const updated = [...currentGallery, url];
      const newCover = prev.image && prev.image.trim() !== '' ? prev.image : url;
      return { ...prev, gallery: updated, image: newCover };
    });
    setCustomImageUrl('');
  };

  const removeGalleryImage = (url) => {
    setFormData((prev) => {
      const currentGallery = Array.isArray(prev.gallery) ? prev.gallery : [];
      const updated = currentGallery.filter((u) => u !== url);
      const newMain = prev.image === url ? (updated[0] || '') : prev.image;
      return { ...prev, gallery: updated, image: newMain };
    });
  };

  const setCoverImage = (url) => {
    setFormData((prev) => {
      const currentGallery = Array.isArray(prev.gallery) ? [...prev.gallery] : [];
      const reordered = [url, ...currentGallery.filter((u) => u !== url)];
      return {
        ...prev,
        image: url,
        gallery: reordered,
      };
    });
    setToastMessage('Primary cover updated');
  };

  const moveGalleryImage = (index, direction) => {
    setFormData((prev) => {
      const gallery = [...(prev.gallery || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= gallery.length) return prev;
      const temp = gallery[index];
      gallery[index] = gallery[targetIndex];
      gallery[targetIndex] = temp;
      return { ...prev, gallery };
    });
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(
      (f) =>
        f.type?.startsWith('image/') ||
        /\.(jpe?g|png|webp|avif|gif|svg|bmp|tiff|heic)$/i.test(f.name)
    );
    if (fileList.length === 0) {
      showToast('Please select valid image files');
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fileList.forEach((file) => {
        fd.append('files', file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload images');
      }

      const newUrls = data.urls || [];
      if (newUrls.length > 0) {
        setFormData((prev) => {
          const currentGallery = Array.isArray(prev.gallery) ? prev.gallery : [];
          const updatedGallery = [...currentGallery];
          newUrls.forEach((url) => {
            if (!updatedGallery.includes(url)) {
              updatedGallery.push(url);
            }
          });
          const newCover = prev.image && prev.image.trim() !== '' ? prev.image : updatedGallery[0];
          return {
            ...prev,
            gallery: updatedGallery,
            image: newCover,
          };
        });
        showToast(`Uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''} successfully`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // 1 & 2. Filter & Sort Execution
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // 1. Search by name, SKU, product ID, or category
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          const matchSlug = p.slug?.toLowerCase().includes(q);
          const matchId = p.id?.toLowerCase().includes(q);
          const matchCat = p.category?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchSlug && !matchId && !matchCat) return false;
        }

        // 2. Filters
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

        const isHidden = p.hidden === true || p.inStock === false;
        const inStock = p.inStock !== false;

        if (statusFilter === 'in_stock' && !inStock) return false;
        if (statusFilter === 'out_of_stock' && inStock) return false;
        if (statusFilter === 'visible' && isHidden) return false;
        if (statusFilter === 'hidden' && !isHidden) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'price_asc') {
          return (a.priceNumber || 0) - (b.priceNumber || 0);
        }
        if (sortBy === 'price_desc') {
          return (b.priceNumber || 0) - (a.priceNumber || 0);
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Discount % calculation helper
  const calculateDiscount = (price, origPrice) => {
    if (!origPrice || origPrice <= price) return null;
    return Math.round(((origPrice - price) / origPrice) * 100);
  };

  return (
    <>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-[13px] px-4 py-2 rounded-full border border-neutral-700 flex items-center gap-2 animate-toast pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center pb-5 px-2 pt-10 justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold tracking-tight text-[#111111]">
              Products
            </h2>
            <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/80 transition-colors">
              {filteredAndSortedProducts.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">


            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium border border-neutral-900 transition-all duration-150 ease-out active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar (Matching screenshot) */}
        <div className="flex flex-col sm:flex-row items-stretch p-2 px-0 pt-2 sm:items-center gap-1">
          {/* 1. Search product name */}
          <div className="relative flex-1 min-w-[220px] ">
            <input
              type="text"
              placeholder="Search product name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-4 pr-10  border border-neutral-200 bg-white text-[13.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-900 transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
          </div>

   

        
        </div>

        {/* Product Table (Clean border-driven grid matching reference) */}
        {loading ? (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-white text-[13px] font-semibold text-neutral-800">
                    <th className="py-3 px-4 border-r border-neutral-200 w-[170px]"><span className="w-16 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 min-w-[240px]"><span className="w-28 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 w-[90px]"><span className="w-10 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 w-[160px] text-right"><span className="w-20 h-3 rounded skeleton-shimmer block ml-auto" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 min-w-[160px]"><span className="w-12 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 min-w-[170px]"><span className="w-16 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 w-[120px]"><span className="w-14 h-5 rounded-full skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 w-[160px] text-right"><span className="w-16 h-3 rounded skeleton-shimmer block ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded skeleton-shimmer" /><div className="w-20 h-3 rounded skeleton-shimmer" /></div></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded skeleton-shimmer" /><div className="w-36 h-3 rounded skeleton-shimmer" /></div></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-12 h-5 rounded-full skeleton-shimmer" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-20 h-3 rounded skeleton-shimmer ml-auto" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200">
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="w-12 h-2.5 rounded skeleton-shimmer" />
                          <div className="w-12 h-2.5 rounded skeleton-shimmer" />
                          <div className="w-10 h-2.5 rounded skeleton-shimmer" />
                          <div className="w-10 h-2.5 rounded skeleton-shimmer" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-24 h-3 rounded skeleton-shimmer" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-14 h-5 rounded-full skeleton-shimmer" /></td>
                      <td className="py-3.5 px-4"><div className="w-20 h-5 rounded skeleton-shimmer ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-none transition-all duration-200">
            {/* Bulk Action Bar - Shown when items are selected (Matching screenshot) */}
            <AnimatePresence>
              {selectedSlugs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="overflow-hidden border-b border-neutral-200 bg-white"
                >
                  <div className="flex items-center gap-3.5 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6.5 h-6.5 rounded-full border border-[#e5e5e5] bg-[#fafafa] flex items-center justify-center text-[12px] font-medium text-[#111111] tabular-nums">
                        {selectedSlugs.length}
                      </span>
                      <span className="text-[13.5px] font-medium text-[#111111]">
                        Selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleBulkVisibility(false)}
                        className="px-4 py-1.5 rounded-full border border-[#e5e5e5] bg-white hover:bg-neutral-50 text-[13px] font-medium text-[#111111] cursor-pointer transition-colors"
                      >
                        Show in Store
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkVisibility(true)}
                        className="px-4 py-1.5 rounded-full border border-[#e5e5e5] bg-white hover:bg-neutral-50 text-[13px] font-medium text-[#111111] cursor-pointer transition-colors"
                      >
                        Hide
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        className="px-4 py-1.5 rounded-full border border-[#fecdd3] bg-[#fff1f2] hover:bg-[#ffe4e6] text-[13px] font-medium text-[#be123c] cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSlugs([])}
                        className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-[#111111] cursor-pointer transition-colors ml-0.5"
                        title="Clear selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-white text-[13px] font-semibold text-neutral-800">
                    {/* SKU Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[170px]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className={`w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${selectedSlugs.length > 0
                              ? 'bg-[#111111] border border-[#111111] text-white'
                              : 'border border-neutral-300 bg-white hover:border-neutral-400'
                            }`}
                          title={selectedSlugs.length === filteredAndSortedProducts.length ? 'Deselect all' : 'Select all'}
                        >
                          {selectedSlugs.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0 ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : selectedSlugs.length > 0 ? (
                            <span className="w-2.5 h-[2px] bg-white rounded-full" />
                          ) : null}
                        </button>
                        <span>SKU</span>
                      </div>
                    </th>

                    {/* Product name Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap min-w-[240px]">
                      <div className="flex items-center justify-between">
                        <span>Product name</span>
                        <svg
                          className="w-3.5 h-3.5 text-neutral-400 shrink-0 inline-block ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h10M3 12h7M3 18h4M17 8l3 3m0 0l3-3m-3 3V3" />
                        </svg>
                      </div>
                    </th>

                    {/* Type Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[90px]">
                      <span>Type</span>
                    </th>

                    {/* Selling price Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[160px] text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>Selling price</span>
                        <svg
                          className="w-3.5 h-3.5 text-neutral-400 shrink-0 inline-block ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h10M3 12h7M3 18h4M17 8l3 3m0 0l3-3m-3 3V3" />
                        </svg>
                      </div>
                    </th>

                    {/* Stock Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap min-w-[160px]">
                      <div className="flex items-center gap-1">
                        <span>Stock</span>
                        <svg
                          className="w-3.5 h-3.5 text-neutral-400 shrink-0 inline-block ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h10M3 12h7M3 18h4M17 8l3 3m0 0l3-3m-3 3V3" />
                        </svg>
                      </div>
                    </th>

                    {/* Category Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap min-w-[170px]">
                      <span>Category</span>
                    </th>

                    {/* Status Column */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[120px]">
                      <span>Status</span>
                    </th>

                    {/* Actions Column */}
                    <th className="py-3 px-4 whitespace-nowrap w-[160px] text-right">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-[13.5px] text-neutral-800">
                  {filteredAndSortedProducts.map((prod) => {
                    const slug = prod.slug || prod.id;
                    const isSelected = selectedSlugs.includes(slug);
                    const isHidden = prod.hidden === true || prod.inStock === false;
                    const sku = prod.sku || `SKU-${(slug || '').slice(0, 5).toUpperCase()}`;
                    const priceFormatted = `₹${(prod.priceNumber || 0).toLocaleString('en-IN')}`;
                    const totalStock = Array.isArray(prod.variants) && prod.variants.length > 0
                      ? prod.variants.reduce((sum, v) => sum + (v.active !== false ? Number(v.stock || 0) : 0), 0)
                      : (prod.stockQuantity ?? (prod.availableSizes ? prod.availableSizes.length * 2 : 12));
                    const stock = isHidden ? 0 : totalStock;
                    const sizeStockList = (() => {
                      if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                        const active = prod.variants.filter((v) => v.active !== false);
                        if (active.length > 0) {
                          return active.map((v) => ({
                            size: v.size || '',
                            stock: v.stock === '' || v.stock === null || v.stock === undefined ? 0 : Number(v.stock),
                          }));
                        }
                      }
                      if (Array.isArray(prod.availableSizes) && prod.availableSizes.length > 0) {
                        const defaultPerSize = prod.stockQuantity
                          ? Math.max(1, Math.floor(prod.stockQuantity / prod.availableSizes.length))
                          : 2;
                        return prod.availableSizes.map((sz) => ({
                          size: sz,
                          stock: defaultPerSize,
                        }));
                      }
                      return [];
                    })();
                    const mainImg = prod.image || prod.mainImage || (Array.isArray(prod.gallery) && prod.gallery[0]) || '';

                    return (
                      <tr
                        key={slug}
                        className={`hover:bg-neutral-50/70 transition-colors ${isSelected ? 'bg-neutral-50/90' : isHidden ? 'bg-neutral-50/30 opacity-75' : ''
                          }`}
                      >
                        {/* SKU */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectRow(slug, e)}
                              className={`w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${isSelected
                                  ? 'bg-[#111111] border border-[#111111] text-white'
                                  : 'border border-neutral-300 bg-white hover:border-neutral-400'
                                }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </button>
                            <span className="text-[13px] text-neutral-700 font-medium">
                              {sku}
                            </span>
                          </div>
                        </td>

                        {/* Product name */}
                        <td className="py-3.5 px-4 border-r border-neutral-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9  shrink-0 flex items-center justify-center overflow-hidden">
                              {mainImg ? (
                                <img
                                  src={mainImg}
                                  alt={prod.name}
                                  className="w-full h-full rounded-sm object-contain"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4  text-neutral-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-[13.5px] text-neutral-900 block truncate">
                                {prod.name}
                              </span>
                              {(prod.color || prod.colorHex) && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 border border-black/10"
                                    style={{ backgroundColor: prod.colorHex || '#111111' }}
                                  />
                                  <span className="truncate">{prod.color}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type / Role */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium capitalize ${prod.role === 'bundle'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : prod.role === 'accessory'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                          >
                            {prod.role === 'bundle' ? 'Bundle' : prod.role === 'accessory' ? 'Accessory' : 'Standard'}
                          </span>
                        </td>

                        {/* Selling price */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap text-right">
                          <span className="font-medium text-[13.5px] text-neutral-900">
                            {priceFormatted}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap">
                          {sizeStockList.length > 0 ? (
                            <div className="flex flex-col gap-1 py-0.5">
                              <div className="grid grid-cols-2 gap-x-3.5 gap-y-0.5">
                                {sizeStockList.map((item) => (
                                  <div
                                    key={item.size}
                                    className="text-[12px] leading-[18px] flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <span className="font-medium text-neutral-600 min-w-[34px]">
                                      {item.size}
                                    </span>
                                    <span className="text-neutral-400 font-normal">:</span>
                                    <span
                                      className={`font-semibold ${item.stock === 0 ? 'text-rose-500' : 'text-neutral-900'
                                        }`}
                                    >
                                      {item.stock}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-1 mt-0.5 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium">
                                <span>Total:</span>
                                <span className={`font-semibold ${totalStock === 0 ? 'text-rose-500' : 'text-neutral-900'}`}>
                                  {totalStock}
                                </span>
                              </div>
                            </div>
                          ) : stock === 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13.5px] font-medium text-neutral-900">0</span>
                              <svg
                                className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          ) : (
                            <span className="text-[13.5px] font-medium text-neutral-900">{stock}</span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap text-neutral-700">
                          <span className="text-[13px] text-neutral-800">
                            {prod.category || 'Apparel'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap">
                          {!isHidden ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200/80">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium text-rose-600 bg-rose-50 border border-rose-200/80">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Active / Inactive switch */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={!isHidden}
                              onClick={() => handleToggleHide(slug, isHidden)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer border ${!isHidden ? 'bg-[#111111] border-neutral-900' : 'bg-neutral-200 border-neutral-300'
                                }`}
                              title={!isHidden ? 'Deactivate product' : 'Activate product'}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${!isHidden ? 'translate-x-4.5' : 'translate-x-0.5'
                                  }`}
                              />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(prod)}
                              className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={(e) => handleDuplicateProduct(prod, e)}
                              className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
                              title="Duplicate product"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(prod)}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete product"
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
        ) : products.length === 0 ? (
          <div className="py-20 text-center min-h-[70vh] bg-white  p-8">


            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium border border-neutral-900 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          <div className="py-20 text-center bg-white ">
            <Package className="w-9 h-9 text-neutral-300 mx-auto mb-2.5" />
            <h3 className="text-[15px] font-medium text-[#111111]">No products found</h3>
            <p className="text-[13px] text-neutral-400 mt-0.5">
              Try adjusting your search query or clear the active filters.
            </p>
          </div>
        )}
      </div>

      {/* 3. 6-TAB SLIDE-OVER DRAWER (ALL 9 MODULES) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-3xl lg:max-w-4xl bg-white h-full border-l border-[#e5e5e5] flex flex-col z-10 shadow-2xl"
            >
         
            {/* 6-Tab Navigation Bar & Fixed Square Close Button */}
            <div className="relative flex items-center justify-between border-b border-[#e5e5e5] bg-white shrink-0">
              <div className="flex items-center px-4 overflow-x-auto scrollbar-none flex-1 min-w-0">
                {DRAWER_TABS.map((tab) => {
                  const isActive = activeDrawerTab === tab.id;
                  const hasMissing = requiredIssues.some((issue) => issue.tab === tab.id);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDrawerTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${isActive
                          ? 'border-[#111111] text-[#111111] font-semibold'
                          : 'border-transparent text-[#707072] hover:text-[#111111]'
                        }`}
                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                    >
                      <span>{tab.label}</span>
                      {hasMissing && (
                        <span
                          title="Contains required fields that must be filled"
                          className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Fixed Square Close Button at Top Right Corner */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-[49px] h-[49px] flex items-center justify-center text-[#111111] hover:bg-neutral-100 hover:opacity-70 transition-all cursor-pointer bg-white"
                aria-label="Close drawer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                >
                  <path
                    stroke="#111111"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.75 5.25L5.25 18.75m0-13.5l13.5 13.5"
                  />
                </svg>
              </button>
            </div>

            {/* Drawer Body - Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
                {/* ===================== TAB 01: GENERAL ===================== */}
                {activeDrawerTab === 'general' && (
                  <div className="space-y-5">
                    {/* Role selector */}
                    <div>
                      <span
                        className="block text-[13px] font-medium text-[#111111] mb-2"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Product Role
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {ROLES.map((role) => {
                          const isSelected = formData.role === role.id;
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, role: role.id })}
                              className={`p-3.5 rounded-[10px] border text-left cursor-pointer transition-all ${isSelected
                                  ? 'border-[#111111] bg-white shadow-sm ring-1 ring-[#111111]'
                                  : 'border-[#8d8d8d] bg-white hover:border-[#111111]'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className="text-[13.5px] font-medium text-[#111111]"
                                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                >
                                  {role.label}
                                </span>
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 text-[#111111]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <p
                                className="text-[11.5px] text-[#707072] line-clamp-1"
                                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                              >
                                {role.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Product Name */}
                    <FloatingInput
                      label="Product Name"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newSlug =
                          modalMode === 'create'
                            ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                            : formData.slug;
                        setFormData((prev) => ({
                          ...prev,
                          name: val,
                          slug: newSlug,
                          seo: {
                            ...prev.seo,
                            metaTitle: isCustomMetaTitle ? prev.seo?.metaTitle : val,
                          },
                        }));
                      }}
                      placeholder="e.g. Oversized Heavyweight Tee"
                    />

                    {/* Slug & SKU */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FloatingInput
                        label="Slug (URL Identifier)"
                        required
                        fontMono
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''),
                          })
                        }
                      />
                      <FloatingInput
                        label="SKU Code"
                        required
                        fontMono
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value.toUpperCase() })
                        }
                      />
                    </div>

                    {/* Category & Sport */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FloatingSelect
                        label="Category"
                        required
                        value={formData.category || ''}
                        options={categoriesList}
                        onSelect={(val) => setFormData({ ...formData, category: val })}
                        onAddOption={handleAddCategory}
                        onRemoveOption={handleRemoveCategory}
                        addLabel="Add Category"
                      />
                      <FloatingSelect
                        label="Style / Sport"
                        required
                        value={formData.sport || ''}
                        options={sportsList}
                        onSelect={(val) => setFormData({ ...formData, sport: val })}
                        onAddOption={handleAddSport}
                        onRemoveOption={handleRemoveSport}
                        addLabel="Add Style"
                      />
                    </div>

                    {/* Brand */}
                    <FloatingInput
                      label="Brand"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Aesthetx Ways"
                    />

                    {/* Target Audience */}
                    <div>
                      <span
                        className="block text-[13px] font-medium text-[#111111] mb-2"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Target Audience *
                      </span>
                      <div className="flex items-center gap-2">
                        {GENDERS.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, gender: g.id })}
                            className={`px-5 py-2 rounded-full text-[13px] transition-all cursor-pointer ${formData.gender === g.id
                                ? 'bg-[#111111] text-white font-medium shadow-sm'
                                : '  text-[#707072] hover:text-[#111111] hover:bg-[#ebebeb]'
                              }`}
                            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      {formData.tags?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px]   text-[#111111] border border-[#e5e5e5]"
                              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-[#707072] hover:text-[#111111] cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <FloatingInput
                        label="Add Keyword Tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(tagInput);
                          }
                        }}
                        helper="Press Enter to add tag (e.g. breathable, carbon-plate)"
                      />
                    </div>

                    {/* Description */}
                    <FloatingTextarea
                      label="Product Description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          description: val,
                          seo: {
                            ...prev.seo,
                            metaDescription: isCustomMetaDesc ? prev.seo?.metaDescription : val,
                          },
                        }));
                      }}
                    />
                  </div>
                )}

                {/* ===================== TAB 02: MEDIA ===================== */}
                {activeDrawerTab === 'media' && (
                  <div className="space-y-5">
                    {/* 1. COMPACT COLOR TOOLBAR */}
                    <div className="rounded-2xl border border-[#e5e5e5] bg-white p-3.5 sm:p-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Active Color Preview Circle */}
                          <div
                            className="w-9 h-9 rounded-full border border-black/10 shadow-inner shrink-0 flex items-center justify-center transition-all"
                            style={{ backgroundColor: formData.colorHex || '#111111' }}
                          >
                            {formData.colorHex?.toLowerCase() === '#ffffff' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                            )}
                          </div>

                          {/* Color Tone Name Input */}
                          <div className="flex-1 min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#707072] leading-none mb-1">
                              Product Color Tone *
                            </span>
                            <input
                              type="text"
                              value={formData.color || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                              placeholder="e.g. Vintage Black, Faded Grey, Cobalt Blue"
                              className="w-full text-[14px] font-medium text-[#111111] placeholder-neutral-400 bg-transparent outline-none p-0"
                              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                            />
                          </div>
                        </div>

                        {/* Swatches & Custom Picker Row */}
                        <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0 scrollbar-none">
                          {PRESET_COLORS.map((c) => {
                            const isSelected =
                              (formData.colorHex && formData.colorHex.toLowerCase() === c.hex.toLowerCase()) ||
                              (formData.color && formData.color.toLowerCase() === c.name.toLowerCase());

                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    color: c.name,
                                    colorHex: c.hex,
                                  }));
                                }}
                                title={c.name}
                                className={`w-7 h-7 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                                  c.border ? 'border border-[#d4d4d4]' : ''
                                } ${
                                  isSelected
                                    ? 'ring-2 ring-offset-2 ring-[#111111] scale-110'
                                    : 'hover:scale-105 hover:ring-1 hover:ring-neutral-300'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              >
                                {isSelected && (
                                  <Check
                                    className={`w-3.5 h-3.5 ${
                                      c.hex === '#ffffff' || c.hex === '#e8dec8' ? 'text-[#111111]' : 'text-white'
                                    }`}
                                  />
                                )}
                              </button>
                            );
                          })}

                          {/* Custom Color Dot */}
                          <label
                            title="Choose Custom Color"
                            className={`w-7 h-7 rounded-full border border-dashed border-[#8d8d8d] hover:border-[#111111] bg-neutral-50 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                              formData.colorHex && !PRESET_COLORS.some((p) => p.hex.toLowerCase() === formData.colorHex.toLowerCase())
                                ? 'ring-2 ring-offset-2 ring-[#111111] scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={
                              formData.colorHex && !PRESET_COLORS.some((p) => p.hex.toLowerCase() === formData.colorHex.toLowerCase())
                                ? { backgroundColor: formData.colorHex, borderStyle: 'solid' }
                                : {}
                            }
                          >
                            {formData.colorHex && !PRESET_COLORS.some((p) => p.hex.toLowerCase() === formData.colorHex.toLowerCase()) ? (
                              <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-neutral-500" />
                            )}
                            <input
                              type="color"
                              value={formData.colorHex || '#111111'}
                              onChange={(e) => {
                                const hex = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  colorHex: hex,
                                  color: prev.color || 'Custom Tone',
                                }));
                              }}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 2. MEDIA GALLERY SECTION HEADER */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              className="text-[14px] font-semibold text-[#111111]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              Product Visual Media
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600">
                              {formData.gallery?.length || 0} photo{formData.gallery?.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#707072] mt-0.5">
                            The first photo is automatically used as the storefront primary cover.
                          </p>
                        </div>

                        {/* Action Buttons: Paste URL & Upload Photos */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={`px-3 py-1.5 rounded-full border text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              showUrlInput
                                ? 'border-[#111111] bg-neutral-100 text-[#111111]'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>Paste URL</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-full bg-[#111111] hover:bg-black text-white text-[12.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Photos</span>
                          </button>
                        </div>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(e.target.files);
                          }
                        }}
                      />

                      {/* Inline URL Adder Bar (Toggled on "Paste URL") */}
                      {showUrlInput && (
                        <div className="p-3 rounded-xl border border-neutral-200 bg-[#fafafa] flex items-center gap-2">
                          <input
                            type="url"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customImageUrl.trim()) {
                                e.preventDefault();
                                addGalleryImage(customImageUrl);
                                setShowUrlInput(false);
                              }
                            }}
                            placeholder="Paste direct image link (https://... or /api/uploads/...)"
                            className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-2 text-[13px] text-[#111111] placeholder-neutral-400 outline-none focus:border-[#111111]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customImageUrl.trim()) {
                                addGalleryImage(customImageUrl);
                                setShowUrlInput(false);
                              }
                            }}
                            disabled={!customImageUrl.trim()}
                            className="px-4 py-2 rounded-lg bg-[#111111] text-white text-[13px] font-medium disabled:opacity-40 hover:bg-black transition-all cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
                            title="Close"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* 3. MEDIA GRID / DROPZONE */}
                      {isUploading && (
                        <div className="p-10 rounded-2xl border-2 border-dashed border-[#111111] bg-neutral-50/60 flex flex-col items-center justify-center text-center">
                          <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
                          <p className="text-[14px] font-medium text-[#111111]">
                            Uploading & optimizing photos...
                          </p>
                          <p className="text-[12px] text-neutral-400 mt-0.5">
                            Auto-converting to high-speed WebP
                          </p>
                        </div>
                      )}

                      {!isUploading && (!formData.gallery || formData.gallery.length === 0) && (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                            isDragging
                              ? 'border-[#111111] bg-neutral-100 scale-[1.005]'
                              : 'border-[#d4d4d4] hover:border-[#111111] bg-[#fafafa] hover:bg-neutral-50'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e5e5] shadow-xs flex items-center justify-center mx-auto mb-3.5">
                            <UploadCloud className="w-7 h-7 text-[#111111]" />
                          </div>
                          <p className="text-[15px] font-semibold text-[#111111]">
                            Drop product photos here, or click to browse
                          </p>
                          <p className="text-[12.5px] text-[#707072] mt-1 max-w-md mx-auto">
                            Upload high-resolution shots from any angle. Supports JPG, PNG, WebP, HEIC (Batch selection enabled).
                          </p>
                          <span className="inline-block mt-4 px-4 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-800 text-[12.5px] font-medium shadow-xs">
                            Browse files from computer
                          </span>
                        </div>
                      )}

                      {!isUploading && formData.gallery && formData.gallery.length > 0 && (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 transition-all ${
                            isDragging ? 'ring-2 ring-[#111111] rounded-2xl p-2 bg-neutral-100/50' : ''
                          }`}
                        >
                          {formData.gallery.map((url, idx) => {
                            const isCover = idx === 0 || formData.image === url;
                            return (
                              <div
                                key={`${url}-${idx}`}
                                className={`group relative rounded-2xl border overflow-hidden bg-white shadow-xs transition-all duration-200 ${
                                  isCover
                                    ? 'border-[#111111] ring-2 ring-[#111111] shadow-md'
                                    : 'border-[#e5e5e5] hover:border-neutral-400 hover:shadow-sm'
                                }`}
                              >
                                {/* Photo Aspect Container */}
                                <div className="w-full aspect-[4/5] bg-neutral-50/70 p-2 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={url}
                                    alt={`Product photo ${idx + 1}`}
                                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                                  />
                                </div>

                                {/* Cover Badge on Slot 0 / Active Cover */}
                                {isCover ? (
                                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#111111] text-white text-[10.5px] font-bold tracking-wide shadow-sm">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>COVER</span>
                                  </div>
                                ) : (
                                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-neutral-600 border border-neutral-200/80 text-[10.5px] font-bold">
                                    #{idx + 1}
                                  </span>
                                )}

                                {/* Hover / Active Actions Overlay */}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                                  {/* Top Row: Star / Set as cover + Delete */}
                                  <div className="flex items-center justify-between">
                                    {!isCover ? (
                                      <button
                                        type="button"
                                        onClick={() => setCoverImage(url)}
                                        title="Set as Primary Cover"
                                        className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-[#111111] text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                      >
                                        <Star className="w-3 h-3" />
                                        <span>Set Cover</span>
                                      </button>
                                    ) : (
                                      <div />
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => removeGalleryImage(url)}
                                      title="Delete Photo"
                                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Bottom Row: Reorder Arrows */}
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveGalleryImage(idx, -1)}
                                      title="Move Left / Forward"
                                      className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-[#111111] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xs flex items-center gap-1 text-[11px] font-medium"
                                    >
                                      <ArrowLeft className="w-3 h-3" />
                                      <span>Move</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === formData.gallery.length - 1}
                                      onClick={() => moveGalleryImage(idx, 1)}
                                      title="Move Right / Backward"
                                      className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-[#111111] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xs flex items-center gap-1 text-[11px] font-medium"
                                    >
                                      <span>Move</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Persistent '+ Add More' Tile at the End */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[4/5] rounded-2xl border-2 border-dashed border-[#d4d4d4] hover:border-[#111111] bg-neutral-50/50 hover:bg-neutral-100/60 flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all group"
                          >
                            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center mb-2 shadow-2xs group-hover:scale-110 transition-transform">
                              <Plus className="w-5 h-5 text-neutral-700" />
                            </div>
                            <span className="text-[12.5px] font-semibold text-[#111111]">
                              Add Photo
                            </span>
                            <span className="text-[10.5px] text-neutral-400 mt-0.5">
                              Click or drop here
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===================== TAB 03: PRICING ===================== */}
                {activeDrawerTab === 'pricing' && (() => {
                  const selling = Number(formData.priceNumber || 0);
                  const cost = Number(formData.costPrice || 0);
                  const mrp = Number(formData.originalPrice || 0);
                  const profit = selling - cost;
                  const marginPercent = selling > 0 && cost > 0 ? Math.round((profit / selling) * 100) : null;
                  const discountPercent = mrp > selling && mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
                  const isMrpInvalid = mrp > 0 && mrp < selling;

                  const applyDiscountPreset = (percent) => {
                    if (mrp > 0) {
                      const discounted = Math.round(mrp * (1 - percent / 100));
                      setFormData((prev) => ({
                        ...prev,
                        priceNumber: discounted,
                        basePrice: discounted,
                      }));
                    }
                  };

                  const applyMarkupPreset = (multiplier) => {
                    if (cost > 0) {
                      const markedUp = Math.round(cost * multiplier);
                      setFormData((prev) => ({
                        ...prev,
                        priceNumber: markedUp,
                        basePrice: markedUp,
                      }));
                    }
                  };

                  return (
                    <div className="space-y-5">
                      {/* 1. TOP LIVE FINANCIAL METRICS STRIP */}
                     

                      {/* 2. MAIN PRICING INPUTS CARD */}
                      <div className=" space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                          <div>
                            <h4
                              className="text-[14px] font-semibold text-[#111111]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              Price Configuration
                            </h4>
                           
                          </div>
                         
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                          {/* Cost Price */}
                          <FloatingInput
                            label="Cost Price (Unit Cost)"
                            type="number"
                            min="0"
                            prefix="₹"
                            value={formData.costPrice || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, costPrice: e.target.value })
                            }
                            helper="Procurement / production cost"
                          />

                          {/* Selling Price */}
                          <FloatingInput
                            label="Selling Price (Checkout) *"
                            required
                            type="number"
                            min="1"
                            prefix="₹"
                            value={formData.priceNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                priceNumber: e.target.value,
                                basePrice: e.target.value,
                              })
                            }
                            helper="Price customer actually pays"
                          />

                          {/* Original Price / MRP */}
                          <FloatingInput
                            label="Original MRP (Compare-at)"
                            type="number"
                            min="0"
                            prefix="₹"
                            value={formData.originalPrice || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, originalPrice: e.target.value })
                            }
                            helper="Shown with strikethrough"
                          />
                        </div>

                        {/* Error Alert if MRP < Selling */}
                        {isMrpInvalid && (
                          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-[13px]">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Original MRP (₹{mrp}) cannot be less than Selling Price (₹{selling}).</span>
                          </div>
                        )}
                      </div>

                    
                    </div>
                  );
                })()}

                {/* ===================== TAB 04: VARIANTS & STOCK ===================== */}
                {activeDrawerTab === 'variants' && (
                  <div className="space-y-4">
                    {/* Inventory Overview & Bulk Quick Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-[#707072] uppercase tracking-wider block">
                          Total Available Inventory
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-[20px] font-bold text-[#111111] tabular-nums tracking-tight">
                            {formData.variants?.reduce(
                              (sum, v) => sum + (v.active !== false ? Number(v.stock || 0) : 0),
                              0
                            ).toLocaleString('en-IN')}{' '}
                            <span className="text-[13px] font-normal text-[#707072]">units</span>
                          </span>
                          <span className="text-[12px] text-[#707072]">
                            • {formData.variants?.filter((v) => v.active !== false).length} active sizes
                          </span>
                        </div>
                      </div>

                    
                    </div>

                    {/* Add Custom Size Toolbar */}
                    <div className="flex items-center justify-between gap-3  bg-white">
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <span className="text-[11.5px] font-medium text-[#707072] shrink-0">
                          Add Size:
                        </span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={newSizeInput}
                            onChange={(e) => setNewSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewSize();
                              }
                            }}
                            placeholder="e.g. S, M, L, XL, 32..."
                            className="h-8 px-2.5 rounded-md border border-[#e5e5e5] bg-[#fafafa] text-[12px] text-[#111111] placeholder:text-[#8d8d8d] focus:bg-white focus:outline-none focus:border-[#111111] w-full transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewSize}
                            className="h-8 px-3 rounded-md bg-[#111111] hover:bg-black text-white text-[11.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#707072] hidden sm:inline">
                        Toggle inactive to hide sizes from storefront dropdowns
                      </span>
                    </div>

                    {/* Size Variants Table */}
                    <div className="border border-[#e5e5e5] overflow-x-auto bg-white">
                      <table className="w-full text-left text-[12.5px] min-w-[640px]">
                        <colgroup>
                          <col className="w-[44px]" />
                          <col className="w-[110px]" />
                          <col className="w-[28%]" />
                          <col className="w-[18%]" />
                          <col className="w-[32%]" />
                          <col className="w-[44px]" />
                        </colgroup>
                        <thead className="bg-[#fafafa] border-b border-[#e5e5e5] text-[10.5px] uppercase tracking-wider text-[#707072] font-semibold">
                          <tr>
                            <th className="py-2.5 px-2 text-center">Active</th>
                            <th className="py-2.5 px-3">Size</th>
                            <th className="py-2.5 px-3">Variant SKU</th>
                            <th className="py-2.5 px-3">Stock Units</th>
                            <th className="py-2.5 px-3">Price Override</th>
                            <th className="py-2.5 px-2 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e5e5]">
                          {formData.variants?.map((v, idx) => {
                            const isActive = Boolean(v.active);
                            const basePrice = Number(formData.priceNumber || 0);
                            const hasOverride = v.priceOverride !== '' && v.priceOverride !== undefined && v.priceOverride !== null;
                            const overrideVal = hasOverride ? Number(v.priceOverride) : null;
                            const diff = hasOverride && overrideVal !== null ? overrideVal - basePrice : 0;
                            const pctDiff = basePrice > 0 && hasOverride ? Math.round((Math.abs(diff) / basePrice) * 100) : 0;

                            return (
                              <tr
                                key={`${v.size}-${idx}`}
                                className={`transition-colors ${!isActive ? 'bg-[#fafafa]/80 opacity-50' : 'hover:bg-[#fafafa]/60'}`}
                              >
                                <td className="py-2.5 px-0 text-center align-top pt-3.5">
                                  <div
                                    onClick={() => updateVariant(idx, 'active', !isActive)}
                                    className="flex justify-center cursor-pointer"
                                  >
                                    <div
                                      className={`w-4.5 h-4.5 rounded-[4px] flex items-center justify-center transition-colors ${isActive
                                          ? 'bg-[#111111] text-white border border-[#111111]'
                                          : 'bg-white border border-[#8d8d8d] hover:border-[#111111]'
                                        }`}
                                    >
                                      {isActive && (
                                        <svg
                                          className="w-3 h-3"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-1 align-top pt-2.5">
                                  <input
                                    type="text"
                                    value={v.size}
                                    disabled={!isActive}
                                    onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                                    className="w-full font-bold text-[#111111] text-[13px] bg-transparent border-b border-transparent hover:border-[#e5e5e5] focus:border-[#111111] focus:outline-none py-1 transition-colors disabled:opacity-60"
                                    title="Edit size label"
                                  />
                                </td>
                                <td className="py-2.5 px-1 align-top">
                                  <FloatingInput
                                    compact
                                    label="Variant SKU"
                                    fontMono
                                    disabled={!isActive}
                                    value={v.sku || ''}
                                    onChange={(e) => updateVariant(idx, 'sku', e.target.value.toUpperCase())}
                                    placeholder={isActive && formData.sku ? `${formData.sku}-${v.size.replace(/\s+/g, '')}` : 'SKU'}
                                  />
                                </td>
                                <td className="py-2.5 px-1 align-top">
                                  <FloatingInput
                                    compact
                                    label="Stock"
                                    type="number"
                                    min="0"
                                    disabled={!isActive}
                                    autoSelectOnFocus
                                    value={v.stock === '' || v.stock === undefined || v.stock === null ? '' : v.stock}
                                    onChange={(e) => updateVariant(idx, 'stock', e.target.value === '' ? '' : Number(e.target.value))}
                                  />
                                </td>
                                <td className="py-2.5 px-1 align-top">
                                  <div>
                                    <FloatingInput
                                      compact
                                      label="Price Override"
                                      type="number"
                                      min="0"
                                      prefix="₹"
                                      disabled={!isActive}
                                      autoSelectOnFocus
                                      value={v.priceOverride || ''}
                                      onChange={(e) => updateVariant(idx, 'priceOverride', e.target.value)}
                                      placeholder={basePrice > 0 ? String(basePrice) : 'Default'}
                                    />
                                    <div className="mt-1 px-0.5 min-h-[16px] flex items-center">
                                      {hasOverride ? (
                                        diff > 0 ? (
                                          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-700 tabular-nums">
                                            <span>+₹{diff.toLocaleString('en-IN')}</span>
                                            <span className="text-[9.5px] text-emerald-600">({pctDiff}% above base)</span>
                                          </span>
                                        ) : diff < 0 ? (
                                          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-rose-700 tabular-nums">
                                            <span>-₹{Math.abs(diff).toLocaleString('en-IN')}</span>
                                            <span className="text-[9.5px] text-rose-600">({pctDiff}% below base)</span>
                                          </span>
                                        ) : (
                                          <span className="text-[10.5px] text-[#707072]">
                                            = Same as base (₹{basePrice.toLocaleString('en-IN')})
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10.5px] text-[#707072] select-none tabular-nums">
                                          Default: {basePrice > 0 ? `₹${basePrice.toLocaleString('en-IN')}` : 'Base selling price'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center align-top pt-3.5">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(idx)}
                                    className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete this size variant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===================== TAB 05: RELATIONSHIPS & COMBOS ===================== */}
                {activeDrawerTab === 'relations' && (
                  <div className="space-y-6">
                    {/* BUNDLE / COMBO BUILDER */}
                    {formData.role === 'bundle' ? (
                      <div className="space-y-5">
                        {/* Clean Minimal Header */}
                        <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
                          <div>
                            <h4
                              className="text-[14px] font-bold text-[#111111]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              Combo Package Builder
                            </h4>
                            <p className="text-[12px] text-[#707072] mt-0.5">
                              Bundle catalog products and set the discounted combo price.
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                            Bundle
                          </span>
                        </div>

                        {/* Pricing & Comparison Card */}
                        {(() => {
                          const baseProductPrice = Number(formData.basePrice || formData.priceNumber || 0);
                          const addedComponentsTotal = (formData.comboItems || []).reduce(
                            (sum, ci) => sum + Number(ci.priceNumber || 0) * Number(ci.quantity || 1),
                            0
                          );
                          const combinedItemsPrice = baseProductPrice + addedComponentsTotal;
                          const secondProduct = formData.comboItems?.[0];

                          return (
                            <div className="   space-y-2.5">
                              {/* The first selling price, the second selling price of both products */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded-[10px] border border-[#e5e5e5]">
                                  <span
                                    className="block text-[11px] font-semibold text-[#707072] uppercase tracking-wider"
                                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                  >
                                    First Selling Price
                                  </span>
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className="text-[13px] font-medium text-[#111111] truncate"
                                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                                    >
                                      {formData.name || 'Product 1'}
                                    </span>
                                    <span
                                      className="text-[16px] font-bold text-[#111111] shrink-0"
                                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                    >
                                      ₹{baseProductPrice.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-3 bg-white rounded-[10px] border border-[#e5e5e5]">
                                  <span
                                    className="block text-[11px] font-semibold text-[#707072] uppercase tracking-wider"
                                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                  >
                                    Second Selling Price
                                  </span>
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className="text-[13px] font-medium text-[#111111] truncate"
                                      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                                    >
                                      {secondProduct
                                        ? (formData.comboItems.length > 1
                                          ? `${formData.comboItems.length} Products Added`
                                          : secondProduct.name)
                                        : 'No item added yet'}
                                    </span>
                                    <span
                                      className="text-[16px] font-bold text-[#111111] shrink-0"
                                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                    >
                                      {addedComponentsTotal > 0
                                        ? `₹${addedComponentsTotal.toLocaleString('en-IN')}`
                                        : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Below, a field to set the combined selling price */}
                              <div>
                                {(() => {
                                  const entered = Number(formData.comboPrice);
                                  const isFilled =
                                    formData.comboPrice !== '' &&
                                    formData.comboPrice !== null &&
                                    !isNaN(entered) &&
                                    entered > 0;

                                  let comboHelper;
                                  if (!isFilled) {
                                    comboHelper = (
                                      <span
                                        className="text-[#707072]"
                                        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                                      >
                                        Actual combined selling price:{' '}
                                        <strong
                                          className="text-[#111111] font-semibold"
                                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                        >
                                          ₹{combinedItemsPrice.toLocaleString('en-IN')}
                                        </strong>
                                      </span>
                                    );
                                  } else {
                                    const diff = entered - combinedItemsPrice;
                                    const pct =
                                      combinedItemsPrice > 0
                                        ? Math.round((Math.abs(diff) / combinedItemsPrice) * 100)
                                        : 0;

                                    if (diff < 0) {
                                      comboHelper = (
                                        <span
                                          className="text-emerald-700"
                                          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                                        >
                                          <strong
                                            className="font-bold"
                                            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                          >
                                            -₹{Math.abs(diff).toLocaleString('en-IN')} (-{pct}%)
                                          </strong>{' '}
                                          vs actual combined selling price (₹
                                          {combinedItemsPrice.toLocaleString('en-IN')})
                                        </span>
                                      );
                                    } else if (diff > 0) {
                                      comboHelper = (
                                        <span
                                          className="text-rose-600"
                                          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                                        >
                                          <strong
                                            className="font-bold"
                                            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                                          >
                                            +₹{diff.toLocaleString('en-IN')} (+{pct}%)
                                          </strong>{' '}
                                          vs actual combined selling price (₹
                                          {combinedItemsPrice.toLocaleString('en-IN')})
                                        </span>
                                      );
                                    } else {
                                      comboHelper = (
                                        <span
                                          className="text-[#707072]"
                                          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                                        >
                                          ₹0 (0%) — Same as actual combined selling price (₹
                                          {combinedItemsPrice.toLocaleString('en-IN')})
                                        </span>
                                      );
                                    }
                                  }

                                  return (
                                    <FloatingInput
                                      label="Combined Selling Price"
                                      type="number"
                                      min="1"
                                      prefix="₹"
                                      value={formData.comboPrice || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData((prev) => ({
                                          ...prev,
                                          comboPrice: val,
                                          priceNumber: val || prev.priceNumber,
                                          originalPrice:
                                            combinedItemsPrice > 0
                                              ? String(combinedItemsPrice)
                                              : prev.originalPrice,
                                        }));
                                      }}
                                      helper={comboHelper}
                                    />
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Active combo components */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-[13px] font-medium text-[#111111]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              Bundle Components ({1 + (formData.comboItems?.length || 0)})
                            </span>
                            <span className="text-[11.5px] text-[#707072]">
                              {1 + (formData.comboItems || []).reduce((s, ci) => s + (ci.quantity || 1), 0)} items total
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* Pinned Base Product (test-1) */}
                            {(() => {
                              const baseProductPrice = Number(formData.basePrice || formData.priceNumber || 0);
                              return (
                                <div className="flex items-stretch rounded-[12px] border border-neutral-300 bg-neutral-50/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
                                  <div className="w-16 sm:w-20 self-stretch shrink-0 bg-white border-r border-neutral-200 flex items-center justify-center overflow-hidden">
                                    {formData.image || (Array.isArray(formData.gallery) && formData.gallery[0]) ? (
                                      <img
                                        src={formData.image || (Array.isArray(formData.gallery) && formData.gallery[0])}
                                        alt={formData.name || 'Base Product'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="w-5 h-5 text-neutral-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-semibold text-[#111111] truncate block">
                                          {formData.name || 'Base Product'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#111111] text-white shrink-0">
                                          Base Item
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[11.5px] text-[#707072] mt-0.5 flex-wrap">
                                        <span>Selling: ₹{baseProductPrice.toLocaleString('en-IN')}</span>
                                        {formData.sku && (
                                          <>
                                            <span>•</span>
                                            <span className="text-neutral-700 font-medium">{formData.sku}</span>
                                          </>
                                        )}
                                        {formData.category && (
                                          <>
                                            <span>•</span>
                                            <span className="capitalize text-neutral-500">{formData.category}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[12px] text-neutral-600 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shrink-0">
                                      <span>Qty: 1</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Added combo items (test-2) */}
                            {formData.comboItems?.map((ci) => {
                              const itemPrice = ci.priceNumber || 0;
                              const compTotal = itemPrice * (ci.quantity || 1);
                              return (
                                <div
                                  key={ci.slug}
                                  className="flex items-stretch rounded-[12px] border border-[#e5e5e5] bg-white hover:border-neutral-300 transition-colors overflow-hidden"
                                >
                                  <div className="w-16 sm:w-20 self-stretch shrink-0 bg-[#fafafa] border-r border-[#e5e5e5] flex items-center justify-center overflow-hidden">
                                    {ci.image ? (
                                      <img
                                        src={ci.image}
                                        alt={ci.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="w-5 h-5 text-neutral-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[13px] font-medium text-[#111111] block truncate">
                                        {ci.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-[11.5px] text-[#707072] mt-0.5 flex-wrap">
                                        <span>Selling: ₹{itemPrice.toLocaleString('en-IN')}</span>
                                        {(ci.sku || products.find((p) => (p.slug || p.id) === ci.slug)?.sku) && (
                                          <>
                                            <span>•</span>
                                            <span className="text-neutral-700 font-medium">
                                              {ci.sku || products.find((p) => (p.slug || p.id) === ci.slug)?.sku}
                                            </span>
                                          </>
                                        )}
                                        {(ci.category || products.find((p) => (p.slug || p.id) === ci.slug)?.category) && (
                                          <>
                                            <span>•</span>
                                            <span className="capitalize text-neutral-500">
                                              {ci.category || products.find((p) => (p.slug || p.id) === ci.slug)?.category}
                                            </span>
                                          </>
                                        )}
                                        {ci.quantity > 1 && (
                                          <>
                                            <span>•</span>
                                            <span className="text-[#111111] font-medium">
                                              Component: ₹{compTotal.toLocaleString('en-IN')}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="flex items-center border border-[#8d8d8d] rounded-full overflow-hidden bg-white">
                                        <button
                                          type="button"
                                          onClick={() => updateComboQuantity(ci.slug, -1)}
                                          className="px-2.5 py-1 text-[#111111] hover:  text-[13px] font-bold cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <span className="px-2 py-1 text-[12.5px] font-medium text-[#111111]">
                                          {ci.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateComboQuantity(ci.slug, 1)}
                                          className="px-2.5 py-1 text-[#111111] hover:  text-[13px] font-bold cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeComboComponent(ci.slug)}
                                        className="p-1.5 rounded-full text-[#707072] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Remove component"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Add catalog items to combo */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-[13px] font-medium text-[#111111]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              Add Catalog Items
                            </span>
                          </div>

                          {/* Search Bar for Catalog Items */}
                          <div className="relative mb-2.5">
                            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={relationsSearch}
                              onChange={(e) => setRelationsSearch(e.target.value)}
                              placeholder="Search by name, SKU, price, category..."
                              className="w-full h-8.5 pl-8.5 pr-8 rounded-[8px] border border-[#e5e5e5] bg-white text-[12px] text-[#111111] placeholder:text-[#8d8d8d] outline-none focus:border-[#111111] transition-colors"
                            />
                            {relationsSearch && (
                              <button
                                type="button"
                                onClick={() => setRelationsSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-[14px] leading-none cursor-pointer"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto">
                            {(() => {
                              const q = relationsSearch.trim().toLowerCase();
                              const filtered = products
                                .filter((p) => p.slug !== formData.slug && p.id !== formData.slug)
                                .filter((p) => {
                                  if (!q) return true;
                                  return (
                                    (p.name || '').toLowerCase().includes(q) ||
                                    (p.sku || '').toLowerCase().includes(q) ||
                                    (p.category || '').toLowerCase().includes(q) ||
                                    (p.color || '').toLowerCase().includes(q) ||
                                    String(p.priceNumber || '').includes(q)
                                  );
                                });

                              if (filtered.length === 0) {
                                return (
                                  <div className="col-span-full p-4 text-center text-[12px] text-neutral-400">
                                    No products match &quot;{relationsSearch}&quot;
                                  </div>
                                );
                              }

                              return filtered.map((p) => {
                                const slug = p.slug || p.id;
                                const isAdded = formData.comboItems?.some((ci) => ci.slug === slug);
                                const pPrice = p.priceNumber || 0;
                                return (
                                  <button
                                    key={slug}
                                    type="button"
                                    disabled={isAdded}
                                    onClick={() => addComboComponent(p)}
                                    className={`flex items-stretch rounded-[10px] border text-left cursor-pointer transition-colors overflow-hidden ${isAdded
                                        ? '  border-[#e5e5e5] opacity-50 cursor-not-allowed'
                                        : 'bg-white border-[#e5e5e5] hover:border-[#111111]'
                                      }`}
                                  >
                                    <div className="w-16 self-stretch shrink-0 bg-[#fafafa] border-r border-[#e5e5e5] flex items-center justify-center overflow-hidden">
                                      {(p.image || (p.gallery && p.gallery[0])) ? (
                                        <img
                                          src={p.image || (p.gallery && p.gallery[0])}
                                          alt={p.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 py-2.5 px-3 flex items-center justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[12.5px] font-medium text-[#111111] truncate block">
                                          {p.name}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#707072] mt-0.5 flex-wrap">
                                          <span>₹{pPrice.toLocaleString('en-IN')}</span>
                                          {p.sku && (
                                            <>
                                              <span>•</span>
                                              <span className="text-neutral-700 font-medium">{p.sku}</span>
                                            </>
                                          )}
                                          {p.category && (
                                            <>
                                              <span>•</span>
                                              <span className="capitalize text-neutral-500">{p.category}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <span
                                        className={`text-[11px] font-medium shrink-0 ${isAdded ? 'text-[#8d8d8d]' : 'text-[#111111]'
                                          }`}
                                      >
                                        {isAdded ? 'Added' : '+ Add'}
                                      </span>
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* STANDARD FOOTWEAR / ACCESSORY RELATIONSHIPS */
                      <div className="space-y-6">
                        {/* Linked Colorways */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-[13px] font-medium text-[#111111]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              Linked Colorway Siblings
                            </span>
                          </div>

                          {/* Search Bar for Colorways */}
                          <div className="relative mb-2.5">
                            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={relationsSearch}
                              onChange={(e) => setRelationsSearch(e.target.value)}
                              placeholder="Search by name, SKU, price, category..."
                              className="w-full h-8.5 pl-8.5 pr-8 rounded-[8px] border border-[#e5e5e5] bg-white text-[12px] text-[#111111] placeholder:text-[#8d8d8d] outline-none focus:border-[#111111] transition-colors"
                            />
                            {relationsSearch && (
                              <button
                                type="button"
                                onClick={() => setRelationsSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-[14px] leading-none cursor-pointer"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-[12px]">
                            {(() => {
                              const q = relationsSearch.trim().toLowerCase();
                              const filtered = products
                                .filter((p) => p.slug !== formData.slug && p.id !== formData.slug)
                                .filter((p) => {
                                  if (!q) return true;
                                  return (
                                    (p.name || '').toLowerCase().includes(q) ||
                                    (p.sku || '').toLowerCase().includes(q) ||
                                    (p.category || '').toLowerCase().includes(q) ||
                                    (p.color || '').toLowerCase().includes(q) ||
                                    String(p.priceNumber || '').includes(q)
                                  );
                                });

                              if (filtered.length === 0) {
                                return (
                                  <div className="col-span-full p-4 text-center text-[12px] text-neutral-400">
                                    No products match &quot;{relationsSearch}&quot;
                                  </div>
                                );
                              }

                              return filtered.map((p) => {
                                const slug = p.slug || p.id;
                                const isLinked = (formData.linkedColorways || formData.colorways)?.includes(slug);
                                return (
                                  <button
                                    key={slug}
                                    type="button"
                                    onClick={() => toggleColorway(slug)}
                                    className={`flex items-stretch rounded-[10px] border text-left cursor-pointer transition-colors overflow-hidden ${isLinked
                                        ? 'bg-[#111111] text-white border-[#111111]'
                                        : 'bg-white text-[#111111] border-[#e5e5e5] hover:border-[#111111]'
                                      }`}
                                  >
                                    <div className="w-16 self-stretch shrink-0 bg-[#fafafa] border-r border-[#e5e5e5] flex items-center justify-center overflow-hidden">
                                      {(p.image || (p.gallery && p.gallery[0])) ? (
                                        <img
                                          src={p.image || (p.gallery && p.gallery[0])}
                                          alt={p.name}
                                          className="w-full h-full object-cover block"
                                        />
                                      ) : (
                                        <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 py-2.5 px-3 flex items-center justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <span className={`text-[12.5px] font-medium truncate block ${isLinked ? 'text-white' : 'text-[#111111]'}`}>
                                          {p.name}
                                        </span>
                                        <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 flex-wrap ${isLinked ? 'text-neutral-300' : 'text-[#707072]'}`}>
                                          <span>₹{(p.priceNumber || 0).toLocaleString('en-IN')}</span>
                                          {p.sku && (
                                            <>
                                              <span>•</span>
                                              <span className={isLinked ? 'text-white font-medium' : 'text-neutral-700 font-medium'}>{p.sku}</span>
                                            </>
                                          )}
                                          {p.category && (
                                            <>
                                              <span>•</span>
                                              <span className={`capitalize ${isLinked ? 'text-neutral-300' : 'text-neutral-500'}`}>{p.category}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {isLinked ? (
                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                                          <svg
                                            className="w-3 h-3 text-black"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] font-medium text-[#707072] shrink-0">
                                          Link
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===================== TAB 06: SHIPPING & SEO ===================== */}
                {activeDrawerTab === 'shipping_seo' && (
                  <div className="space-y-3">
                    {/* Store Visibility */}
                    <div>
                      <span
                        className="block text-[13px] font-medium text-[#111111] mb-2"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Store Visibility
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="  bg-white">
                          <LoginStyleCheckbox
                            title="Active in Storefront"
                            subtitle="Visible to customers on the website"
                            checked={!formData.hidden}
                            onChange={() =>
                              setFormData({ ...formData, hidden: !formData.hidden, inStock: formData.hidden })
                            }
                          />
                        </div>

                        <div className="  bg-white">
                          <LoginStyleCheckbox
                            title="Homepage Featured"
                            subtitle="Highlight in top hero carousels"
                            checked={Boolean(formData.featured)}
                            onChange={() =>
                              setFormData({ ...formData, featured: !formData.featured })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shipping Specifications */}
                    <div>
                      <span
                        className="block text-[13px] font-medium text-[#111111] mb-2"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Shipping & Logistics
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <FloatingInput
                          label="Package Weight (Grams)"
                          type="number"
                          min="0"
                          value={formData.weight || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, weight: e.target.value === '' ? '' : Number(e.target.value) })
                          }
                         
                        />

                        <FloatingSelect
                          label="Return Policy"
                          value={formData.returnPolicy || ''}
                          options={returnPoliciesList}
                          onSelect={(val) => setFormData({ ...formData, returnPolicy: val })}
                          onAddOption={handleAddReturnPolicy}
                          onRemoveOption={handleRemoveReturnPolicy}
                          addLabel="Add Return Policy"
                        />
                      </div>
                    </div>

                    {/* SEO Metadata */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span
                            className="text-[13px] font-medium text-[#111111] block"
                            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                          >
                            Search Engine Optimization (SEO)
                          </span>
                          <span className="text-[11.5px] text-[#707072]">
                            Auto-filled from Product Name & Description by default. Edit anytime to customize.
                          </span>
                        </div>
                   
                      </div>

                      {/* Meta Title */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[12px] font-medium text-[#111111]">Meta Title</span>
                          {isCustomMetaTitle ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomMetaTitle(false);
                                setFormData((prev) => ({
                                  ...prev,
                                  seo: { ...prev.seo, metaTitle: prev.name },
                                }));
                              }}
                              className="text-[11px] text-[#707072] hover:text-[#111111] underline cursor-pointer"
                            >
                              Reset to Product Name
                            </button>
                          ) : (
                            <span >
                            
                            </span>
                          )}
                        </div>
                        <FloatingInput
                          label="Meta Title"
                          value={formData.seo?.metaTitle || formData.name || ''}
                          onChange={(e) => {
                            setIsCustomMetaTitle(true);
                            setFormData({
                              ...formData,
                              seo: { ...formData.seo, metaTitle: e.target.value },
                            });
                          }}
                          helper={`${(formData.seo?.metaTitle || formData.name || '').length} / 60 characters recommended`}
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[12px] font-medium text-[#111111]">Meta Description</span>
                          {isCustomMetaDesc ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomMetaDesc(false);
                                setFormData((prev) => ({
                                  ...prev,
                                  seo: { ...prev.seo, metaDescription: prev.description },
                                }));
                              }}
                              className="text-[11px] text-[#707072] hover:text-[#111111] underline cursor-pointer"
                            >
                              Reset to Product Description
                            </button>
                          ) : (
                            <span >
                             
                            </span>
                          )}
                        </div>
                        <FloatingTextarea
                          label="Meta Description"
                          rows={3}
                          value={formData.seo?.metaDescription || formData.description || ''}
                          onChange={(e) => {
                            setIsCustomMetaDesc(true);
                            setFormData({
                              ...formData,
                              seo: { ...formData.seo, metaDescription: e.target.value },
                            });
                          }}
                          helper={`${(formData.seo?.metaDescription || formData.description || '').length} / 160 characters recommended`}
                        />
                      </div>

                      {/* Meta Keywords / Tags */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[12px] font-medium text-[#111111]">Meta Keywords & Tags</span>
                          {isCustomMetaTags ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomMetaTags(false);
                                setFormData((prev) => ({
                                  ...prev,
                                  seo: { ...prev.seo, keywords: prev.tags },
                                }));
                              }}
                              className="text-[11px] text-[#707072] hover:text-[#111111] underline cursor-pointer"
                            >
                              Reset to Product Tags
                            </button>
                          ) : (
                            <span className="text-[10.5px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                              Synced with Product Tags
                            </span>
                          )}
                        </div>
                        {((formData.seo?.keywords && formData.seo.keywords.length > 0) || (formData.tags && formData.tags.length > 0)) && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {(formData.seo?.keywords?.length > 0 ? formData.seo.keywords : formData.tags).map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px]   text-[#111111] border border-[#e5e5e5]"
                                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                              >
                                #{kw}
                                <button
                                  type="button"
                                  onClick={() => removeMetaTag(kw)}
                                  className="text-[#707072] hover:text-[#111111] cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <FloatingInput
                          label="Add Meta Keyword Tag"
                          value={metaTagInput}
                          onChange={(e) => setMetaTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addMetaTag(metaTagInput);
                            }
                          }}
                          helper="Press Enter to add meta keyword tag"
                        />
                      </div>

                      {/* Google Search Result Live Preview Card */}
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#707072] mb-1.5">
                          Google Search Snippet Preview
                        </span>
                        <div className="p-4 rounded-[12px] border border-[#e5e5e5] bg-white space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#202124]">
                            <span className="font-medium">Aesthetx Ways</span>
                            <span className="text-neutral-400">›</span>
                            <span className="text-[#707072] truncate">
                              https://aesthetxways.com/product/{formData.slug || 'product-slug'}
                            </span>
                          </div>
                          <h4 className="text-[15px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug truncate">
                            {formData.seo?.metaTitle || formData.name || 'Streetwear Apparel'} | Aesthetx Ways
                          </h4>
                          <p className="text-[12.5px] text-[#4d5156] line-clamp-2 leading-relaxed">
                            {formData.seo?.metaDescription ||
                              formData.description ||
                              'Premium heavyweight streetwear apparel, baggy fits, and timeless everyday comfort by Aesthetx Ways.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer with Actions strictly matching LoginModal */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#e5e5e5] bg-white flex flex-col gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {/* 1. Status Bar for Required Fields */}
                {!isFormValid ? (
                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px] text-amber-800 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-amber-50/60 border border-amber-200/50">
                    <span className="font-medium truncate">
                      {requiredIssues.length} required {requiredIssues.length === 1 ? 'field' : 'fields'} remaining
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveDrawerTab(requiredIssues[0].tab)}
                      className="text-[#111111] font-semibold underline hover:no-underline cursor-pointer ml-2 shrink-0"
                    >
                      Fill {requiredIssues[0].label} →
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] text-emerald-700 px-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>All required fields completed • Ready to save</span>
                  </div>
                )}

                {/* 2. Action Buttons Row */}
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-[42px] sm:h-[44px] px-3.5 sm:px-6 rounded-full border border-[#8d8d8d] hover:border-[#111111] text-[#111111] text-[13px] sm:text-[13.5px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer bg-white"
                    style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {/* Previous / Next tab buttons */}
                    {(() => {
                      const currentIdx = DRAWER_TABS.findIndex((t) => t.id === activeDrawerTab);
                      return (
                        <>
                          {currentIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => setActiveDrawerTab(DRAWER_TABS[currentIdx - 1].id)}
                              className="h-[42px] sm:h-[44px] px-3 sm:px-5 rounded-full border border-[#8d8d8d] hover:border-[#111111] text-[#111111] text-[12.5px] sm:text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer bg-white"
                              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                              title="Previous tab"
                            >
                              <span className="hidden sm:inline">Previous</span>
                              <span className="sm:hidden">←</span>
                            </button>
                          )}
                          {currentIdx < DRAWER_TABS.length - 1 && (
                            <button
                              type="button"
                              onClick={() => setActiveDrawerTab(DRAWER_TABS[currentIdx + 1].id)}
                              className="h-[42px] sm:h-[44px] px-3 sm:px-5 rounded-full border border-[#111111] text-[#111111] hover:  text-[12.5px] sm:text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer bg-white"
                              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
                              title="Next tab"
                            >
                              <span className="hidden sm:inline">Next Tab</span>
                              <span className="sm:hidden">Next →</span>
                            </button>
                          )}
                        </>
                      );
                    })()}

                    <button
                      type="submit"
                      disabled={!isFormValid || saving}
                      title={
                        !isFormValid
                          ? `Cannot save: Please fill required fields: ${requiredIssues.map((i) => i.label).join(', ')}`
                          : ''
                      }
                      className={`h-[42px] sm:h-[44px] px-4 sm:px-7 rounded-full text-[13px] sm:text-[14px] font-medium whitespace-nowrap shrink-0 transition-all flex items-center justify-center gap-2 shadow-sm ${isFormValid && !saving
                          ? 'bg-[#111111] hover:bg-black text-white cursor-pointer active:scale-[0.99]'
                          : 'bg-[#f0f0f0] text-[#a0a0a0] border border-[#e0e0e0] cursor-not-allowed opacity-80'
                        }`}
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {saving ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. SAFE DELETION / ARCHIVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setDeleteTarget(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-[440px] bg-white rounded-2xl border border-neutral-200 p-6 z-10 space-y-4"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-[17px] font-bold text-[#111111]">
                  Delete &quot;{deleteTarget.name}&quot;?
                </h3>
                <p className="text-[12.5px] text-neutral-500 mt-1 leading-relaxed">
                  Permanent deletion removes this product from the catalog. Orders and sales metrics will still be preserved.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleToggleHide(deleteTarget.slug || deleteTarget.id, false);
                    setDeleteTarget(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-[13px] font-medium text-neutral-800 cursor-pointer"
                >
                  Hide Instead
                </button>

                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="w-full sm:w-auto px-4 py-2 rounded-full border border-rose-600 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
