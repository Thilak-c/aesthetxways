import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// Get the current site status
export const getSiteStatus = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "siteStatus"))
      .first();

    if (!setting) {
      return { status: "open", message: "", updatedAt: null };
    }

    return {
      status: setting.value,
      message: setting.message || "",
      updatedAt: setting.updatedAt,
    };
  },
});

// Set the site status (open / closed / maintenance)
export const setSiteStatus = mutation({
  args: {
    status: v.string(), // "open", "closed", "maintenance"
    message: v.optional(v.string()),
  },
  handler: async (ctx, { status, message }) => {
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "siteStatus"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: status,
        message: message || "",
        updatedAt: nowIso(),
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: "siteStatus",
        value: status,
        message: message || "",
        updatedAt: nowIso(),
      });
    }

    return { success: true, status };
  },
});

// Get POS Branches & Settings
export const getPosBranches = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "posBranches"))
      .first();

    if (!setting || !setting.value) {
      return null;
    }

    try {
      return JSON.parse(setting.value);
    } catch {
      return null;
    }
  },
});

// Save POS Branches & Settings
export const savePosBranches = mutation({
  args: {
    branchesJson: v.string(), // Stringified JSON of branches object
    activeBranch: v.optional(v.string()),
  },
  handler: async (ctx, { branchesJson, activeBranch }) => {
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "posBranches"))
      .first();

    const payload = JSON.stringify({
      branches: JSON.parse(branchesJson),
      activeBranch: activeBranch || "patna",
      updatedAt: nowIso(),
    });

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: payload,
        updatedAt: nowIso(),
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: "posBranches",
        value: payload,
        updatedAt: nowIso(),
      });
    }

    return { success: true };
  },
});

// Get POS Staff / Cashier Users
export const getPosUsers = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "posUsers"))
      .first();

    if (!setting || !setting.value) {
      return null;
    }

    try {
      return JSON.parse(setting.value);
    } catch {
      return null;
    }
  },
});

// Save POS Staff / Cashier Users
export const savePosUsers = mutation({
  args: {
    usersJson: v.string(), // Stringified JSON array of users
  },
  handler: async (ctx, { usersJson }) => {
    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", "posUsers"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: usersJson,
        updatedAt: nowIso(),
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: "posUsers",
        value: usersJson,
        updatedAt: nowIso(),
      });
    }

    return { success: true };
  },
});

// Default Catalog Taxonomy
const DEFAULT_MAIN_CATEGORIES = [
  { value: "footwear", label: "Footwear" },
  { value: "apparel", label: "Apparel / Clothing" },
  { value: "headwear", label: "Headwear" },
  { value: "eyewear", label: "Eyewear" },
];

const DEFAULT_CATEGORY_MAP = {
  footwear: ["Shoes", "boots", "sandals", "sneakers"],
  apparel: ["Shirts", "t-shirts", "Waffle T-shirt", "jackets", "pants", "jeans", "dresses", "socks", "jersey", "jerseys"],
  headwear: ["Hats", "caps", "beanies"],
  eyewear: ["Glasses", "sunglasses"],
};

const DEFAULT_COLORS = [
  "Black", "White", "Brown", "Navy", "Grey", "Red", "Blue", "Green", "Beige", "Tan", "Multi", "Orange", "Purple", "Silver", "Golden", "Rose Gold", "Copper"
];

async function loadCatalogConfig(ctx) {
  const setting = await ctx.db
    .query("siteSettings")
    .withIndex("by_key", (q) => q.eq("key", "catalogConfig"))
    .first();

  if (!setting || !setting.value) {
    return {
      mainCategories: DEFAULT_MAIN_CATEGORIES,
      categoryMap: DEFAULT_CATEGORY_MAP,
      colors: DEFAULT_COLORS,
    };
  }

  try {
    const parsed = JSON.parse(setting.value);
    return {
      mainCategories: Array.isArray(parsed.mainCategories) && parsed.mainCategories.length > 0 ? parsed.mainCategories : DEFAULT_MAIN_CATEGORIES,
      categoryMap: parsed.categoryMap && typeof parsed.categoryMap === "object" ? parsed.categoryMap : DEFAULT_CATEGORY_MAP,
      colors: Array.isArray(parsed.colors) && parsed.colors.length > 0 ? parsed.colors : DEFAULT_COLORS,
    };
  } catch {
    return {
      mainCategories: DEFAULT_MAIN_CATEGORIES,
      categoryMap: DEFAULT_CATEGORY_MAP,
      colors: DEFAULT_COLORS,
    };
  }
}

async function persistCatalogConfig(ctx, config) {
  const existing = await ctx.db
    .query("siteSettings")
    .withIndex("by_key", (q) => q.eq("key", "catalogConfig"))
    .first();

  const payload = JSON.stringify(config);

  if (existing) {
    await ctx.db.patch(existing._id, {
      value: payload,
      updatedAt: nowIso(),
    });
  } else {
    await ctx.db.insert("siteSettings", {
      key: "catalogConfig",
      value: payload,
      updatedAt: nowIso(),
    });
  }
}

// Get Catalog Config (Categories, Subcategories, Colors)
export const getCatalogConfig = query({
  args: {},
  handler: async (ctx) => {
    return await loadCatalogConfig(ctx);
  },
});

// Add Store Category
export const addStoreCategory = mutation({
  args: {
    mainCategory: v.string(),
    category: v.string(),
  },
  handler: async (ctx, { mainCategory, category }) => {
    const config = await loadCatalogConfig(ctx);
    const cat = category.trim();
    if (!cat) throw new Error("Category name cannot be empty");

    const categoryMap = { ...config.categoryMap };
    const list = Array.isArray(categoryMap[mainCategory]) ? [...categoryMap[mainCategory]] : [];
    
    // Check case-insensitive duplicate
    if (!list.some(c => c.toLowerCase() === cat.toLowerCase())) {
      list.push(cat);
      categoryMap[mainCategory] = list;
      await persistCatalogConfig(ctx, { ...config, categoryMap });
    }

    return { success: true, categoryMap };
  },
});

// Remove Store Category
export const removeStoreCategory = mutation({
  args: {
    mainCategory: v.string(),
    category: v.string(),
  },
  handler: async (ctx, { mainCategory, category }) => {
    const config = await loadCatalogConfig(ctx);
    const categoryMap = { ...config.categoryMap };
    const list = Array.isArray(categoryMap[mainCategory]) ? [...categoryMap[mainCategory]] : [];

    categoryMap[mainCategory] = list.filter(c => c.toLowerCase() !== category.trim().toLowerCase());
    await persistCatalogConfig(ctx, { ...config, categoryMap });

    return { success: true, categoryMap };
  },
});

// Add Main Category
export const addMainCategory = mutation({
  args: {
    value: v.string(),
    label: v.string(),
  },
  handler: async (ctx, { value, label }) => {
    const config = await loadCatalogConfig(ctx);
    const val = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const lbl = label.trim();
    if (!val || !lbl) throw new Error("Main category value and label are required");

    const mainCategories = [...config.mainCategories];
    if (!mainCategories.some(m => m.value.toLowerCase() === val)) {
      mainCategories.push({ value: val, label: lbl });
      const categoryMap = { ...config.categoryMap };
      if (!categoryMap[val]) {
        categoryMap[val] = [];
      }
      await persistCatalogConfig(ctx, { ...config, mainCategories, categoryMap });
    }

    return { success: true, mainCategories };
  },
});

// Remove Main Category
export const removeMainCategory = mutation({
  args: {
    value: v.string(),
  },
  handler: async (ctx, { value }) => {
    const config = await loadCatalogConfig(ctx);
    const mainCategories = config.mainCategories.filter(m => m.value.toLowerCase() !== value.trim().toLowerCase());
    const categoryMap = { ...config.categoryMap };
    delete categoryMap[value.trim().toLowerCase()];

    await persistCatalogConfig(ctx, { ...config, mainCategories, categoryMap });

    return { success: true, mainCategories };
  },
});

// Add Color
export const addColor = mutation({
  args: {
    color: v.string(),
  },
  handler: async (ctx, { color }) => {
    const config = await loadCatalogConfig(ctx);
    const clr = color.trim();
    if (!clr) throw new Error("Color name cannot be empty");

    const colors = [...config.colors];
    if (!colors.some(c => c.toLowerCase() === clr.toLowerCase())) {
      colors.push(clr);
      await persistCatalogConfig(ctx, { ...config, colors });
    }

    return { success: true, colors };
  },
});

// Remove Color
export const removeColor = mutation({
  args: {
    color: v.string(),
  },
  handler: async (ctx, { color }) => {
    const config = await loadCatalogConfig(ctx);
    const colors = config.colors.filter(c => c.toLowerCase() !== color.trim().toLowerCase());
    await persistCatalogConfig(ctx, { ...config, colors });

    return { success: true, colors };
  },
});

