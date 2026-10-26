import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// ============ WEBSITE PRODUCTS CRUD ============

export const addProduct = mutation({
  args: {
    itemId: v.string(),
    name: v.string(),
    mainCategory: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.string(),
    otherImages: v.optional(v.array(v.string())),
    price: v.float64(),
    costPrice: v.optional(v.float64()),
    listedPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    availableSizes: v.array(v.string()),
    sizeStock: v.any(),
    sizeDisplayType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check duplicate
    const existing = await ctx.db.query("products")
      .withIndex("by_itemId", q => q.eq("itemId", args.itemId))
      .first();
    if (existing) throw new Error("Product with this SKU already exists");

    const totalStock = Object.values(args.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

    const id = await ctx.db.insert("products", {
      mainCategory: args.mainCategory || "footwear",
      itemId: args.itemId,
      name: args.name,
      category: args.category || "",
      description: args.description || "",
      mainImage: args.mainImage,
      otherImages: args.otherImages || [],
      price: args.price,
      costPrice: args.costPrice || 0,
      listedPrice: args.listedPrice,
      color: args.color || "",
      secondaryColor: args.secondaryColor || "",
      availableSizes: args.availableSizes,
      sizeStock: args.sizeStock,
      sizeDisplayType: args.sizeDisplayType || "alpha",
      totalStock,
      inStock: totalStock > 0,
      isHidden: false,
      isDeleted: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    // Log movement
    await ctx.db.insert("web_movements", {
      productId: args.itemId,
      productName: args.name,
      type: "stock_in",
      quantity: totalStock,
      previousStock: 0,
      newStock: totalStock,
      reason: "Initial stock",
      sizeDetails: args.sizeStock,
      createdAt: nowIso(),
      createdBy: "admin",
    });

    return { success: true, id };
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.optional(v.string()),
    otherImages: v.optional(v.array(v.string())),
    price: v.optional(v.float64()),
    costPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    isHidden: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await ctx.db.patch(id, { ...filtered, updatedAt: nowIso() });
    return { success: true };
  },
});

export const updateStock = mutation({
  args: {
    id: v.id("products"),
    sizeStock: v.any(),
    availableSizes: v.optional(v.array(v.string())),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, sizeStock, availableSizes, reason }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    const oldStock = product.totalStock;
    const newStock = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    const sizes = availableSizes || Object.keys(sizeStock);

    await ctx.db.patch(id, {
      sizeStock,
      availableSizes: sizes,
      totalStock: newStock,
      inStock: newStock > 0,
      updatedAt: nowIso(),
    });

    await ctx.db.insert("web_movements", {
      productId: product.itemId,
      productName: product.name,
      type: newStock > oldStock ? "stock_in" : "stock_out",
      quantity: Math.abs(newStock - oldStock),
      previousStock: oldStock,
      newStock,
      reason: reason || "Stock update",
      sizeDetails: sizeStock,
      createdAt: nowIso(),
      createdBy: "admin",
    });

    return { success: true, oldStock, newStock };
  },
});

// Full product update (all fields)
export const updateProductFull = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    mainCategory: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.string(),
    otherImages: v.optional(v.array(v.string())),
    price: v.float64(),
    costPrice: v.optional(v.float64()),
    listedPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    availableSizes: v.array(v.string()),
    sizeStock: v.any(),
    sizeDisplayType: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...args }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    const totalStock = Object.values(args.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    const oldStock = product.totalStock;

    await ctx.db.patch(id, {
      mainCategory: args.mainCategory,
      name: args.name,
      category: args.category || "",
      description: args.description || "",
      mainImage: args.mainImage,
      otherImages: args.otherImages || [],
      price: args.price,
      costPrice: args.costPrice || 0,
      listedPrice: args.listedPrice,
      color: args.color || "",
      secondaryColor: args.secondaryColor || "",
      availableSizes: args.availableSizes,
      sizeStock: args.sizeStock,
      sizeDisplayType: args.sizeDisplayType,
      totalStock,
      inStock: totalStock > 0,
      updatedAt: nowIso(),
    });

    // Log stock change if any
    if (totalStock !== oldStock) {
      await ctx.db.insert("web_movements", {
        productId: product.itemId,
        productName: args.name,
        type: totalStock > oldStock ? "stock_in" : "stock_out",
        quantity: Math.abs(totalStock - oldStock),
        previousStock: oldStock,
        newStock: totalStock,
        reason: "Product update",
        sizeDetails: args.sizeStock,
        createdAt: nowIso(),
        createdBy: "admin",
      });
    }

    return { success: true };
  },
});

// Move product to trash (not permanent delete)
export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    // Save to trash
    await ctx.db.insert("web_trash", {
      originalId: id,
      itemId: product.itemId,
      name: product.name,
      productData: product,
      deletedAt: nowIso(),
      deletedBy: "admin",
    });

    // Delete from products
    await ctx.db.delete(id);

    return { success: true };
  },
});

// Restore product from trash
export const restoreProduct = mutation({
  args: { trashId: v.id("web_trash") },
  handler: async (ctx, { trashId }) => {
    const trashItem = await ctx.db.get(trashId);
    if (!trashItem) throw new Error("Trash item not found");

    // Check if itemId already exists
    const existing = await ctx.db.query("products")
      .withIndex("by_itemId", q => q.eq("itemId", trashItem.itemId))
      .first();
    if (existing) throw new Error("Product with this SKU already exists");

    // Restore product
    const { _id, _creationTime, isDeleted, ...productData } = trashItem.productData;
    await ctx.db.insert("products", {
      ...productData,
      isDeleted: false,
      updatedAt: nowIso(),
    });

    // Remove from trash
    await ctx.db.delete(trashId);

    return { success: true };
  },
});

// Get all trash items
// OPTIMIZED: Added limit
export const getTrash = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("web_trash").order("desc").take(args.limit || 100);
  },
});

// ============ QUERIES ============

// OPTIMIZED: Added pagination
export const getAllProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(args.limit || 100);
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getProductByItemId = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    return await ctx.db.query("products")
      .withIndex("by_itemId", q => q.eq("itemId", itemId))
      .first();
  },
});

// OPTIMIZED: Added limit
export const getStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .take(args.limit || 1000);

    const stats = {
      totalProducts: products.length,
      totalStock: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      totalCost: 0,
      categories: {},
    };

    products.forEach(p => {
      stats.totalStock += p.totalStock;
      stats.totalValue += p.totalStock * p.price;
      stats.totalCost += p.totalStock * (p.costPrice || 0);

      if (p.totalStock === 0) stats.outOfStock++;
      else if (p.totalStock <= 10) stats.lowStock++;
      else stats.inStock++;

      const cat = p.category || "Uncategorized";
      if (!stats.categories[cat]) stats.categories[cat] = { count: 0, stock: 0 };
      stats.categories[cat].count++;
      stats.categories[cat].stock += p.totalStock;
    });

    stats.potentialProfit = stats.totalValue - stats.totalCost;
    return stats;
  },
});

// OPTIMIZED: Added limit
export const getLowStock = query({
  args: { 
    threshold: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold || 10;
    const limit = args.limit || 50;
    
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .take(500);
    
    return products
      .filter(p => p.totalStock <= threshold)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, limit);
  },
});

export const getMovements = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db.query("web_movements").order("desc").take(limit);
  },
});

// OPTIMIZED: Added limit
export const searchProducts = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .take(500);
    
    const s = args.query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.itemId.toLowerCase().includes(s) ||
      (p.category || "").toLowerCase().includes(s)
    ).slice(0, limit);
  },
});

// Get dead stock (products with no sales, older than X days)
// OPTIMIZED: Added limit
export const getDeadStock = query({
  args: {
    daysOld: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysOld = args.daysOld || 30;
    const limit = args.limit || 50;
    
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .take(500);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return products
      .filter(p => {
        if (p.createdAt) {
          const createdDate = new Date(p.createdAt);
          return createdDate < cutoffDate;
        }
        return true;
      })
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice || 0,
        totalStock: p.totalStock || 0,
        mainImage: p.mainImage,
        createdAt: p.createdAt,
        stockValue: (p.costPrice || p.price || 0) * (p.totalStock || 0),
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, limit);
  },
});


// Get products by category (for shop page)
// OPTIMIZED: Use index + limit
export const getProductsByCategory = query({
  args: { 
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Try exact match with index first
    const exactMatch = await ctx.db.query("products")
      .withIndex("by_category", q => q.eq("category", args.category))
      .filter(q => q.and(
        q.neq(q.field("isDeleted"), true),
        q.neq(q.field("isHidden"), true)
      ))
      .take(limit);
    
    if (exactMatch.length > 0) {
      return exactMatch;
    }
    
    // Fallback: case-insensitive search with limit
    const products = await ctx.db.query("products")
      .filter(q => q.and(
        q.neq(q.field("isDeleted"), true),
        q.neq(q.field("isHidden"), true)
      ))
      .take(500);
    
    const categoryLower = args.category.toLowerCase();
    return products.filter(p => 
      (p.category || "").toLowerCase() === categoryLower
    ).slice(0, limit);
  },
});

// Get product by itemId (for product page)
export const getProductById = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    // Try to find by itemId first
    const product = await ctx.db.query("products")
      .withIndex("by_itemId", q => q.eq("itemId", productId))
      .first();
    
    if (product && !product.isDeleted) {
      return product;
    }
    return null;
  },
});

// Get featured/visible products with limit
export const getFeaturedProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 8 }) => {
    const products = await ctx.db.query("products")
      .filter(q => q.and(
        q.neq(q.field("isDeleted"), true),
        q.neq(q.field("isHidden"), true),
        q.eq(q.field("inStock"), true)
      ))
      .order("desc")
      .take(limit);
    return products;
  },
});

// Get top picks from products (sorted by stock/newest)
// OPTIMIZED: Use take() instead of collect()
export const getTopPicks = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const products = await ctx.db.query("products")
      .filter(q => q.and(
        q.neq(q.field("isDeleted"), true),
        q.neq(q.field("isHidden"), true),
        q.eq(q.field("inStock"), true)
      ))
      .order("desc")
      .take(limit);

    return products.map(p => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      category: p.category,
      price: p.price,
      mainImage: p.mainImage || "/products/placeholder.jpg",
      createdAt: p.createdAt || null,
      totalStock: p.totalStock,
    }));
  },
});


// ============ OPTIMIZED CARD-ONLY QUERIES ============
// Returns ONLY: _id, itemId, name, price, mainImage, category

const toCardData = (p) => ({
  _id: p._id,
  itemId: p.itemId,
  name: p.name,
  price: p.price,
  mainImage: p.mainImage,
  category: p.category,
});

// Get all products for cards (minimal data)
export const getProductsForCards = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .order("desc")
      .take(limit);
    
    return products.map(toCardData);
  },
});

// Get featured products for cards
export const getFeaturedForCards = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 8;
    
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .order("desc")
      .take(limit);
    
    return products.map(toCardData);
  },
});

// Get products by category for cards
export const getByCategoryForCards = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true)
        )
      )
      .take(limit);
    
    return products.map(toCardData);
  },
});

// ============ NEWSLETTER SUBSCRIBERS ============

export const subscribeNewsletter = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const emailLower = email.toLowerCase().trim();
    
    // Check if already subscribed
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();
      
    if (existing) {
      return { success: true, alreadySubscribed: true };
    }
    
    const id = await ctx.db.insert("subscribers", {
      email: emailLower,
      subscribedAt: nowIso(),
    });
    
    return { success: true, id };
  },
});
