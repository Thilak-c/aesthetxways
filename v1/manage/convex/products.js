import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get current timestamp
const nowIso = () => new Date().toISOString();

// Existing insert mutation
export const insert = mutation(async ({ db }, product) => {
  await db.insert("products", {
    buys: 0,
    inCart: 0,
    isHidden: false,
    ...product
  });
});




// Bulletproof case-insensitive category search
// OPTIMIZED: Uses index-based query with pagination
export const getProductsByCategoryOrType = query({
  args: { 
    searchTerm: v.string(),
    searchType: v.optional(v.union(v.literal("category"), v.literal("type"), v.literal("both"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const normalizedTerm = args.searchTerm?.trim();
      const searchType = args.searchType || "both";
      const limit = args.limit || 50;
      
      if (!normalizedTerm) {
        return [];
      }

      // OPTIMIZED: Use index for category search when possible
      if (searchType === "category") {
        // Try exact match first using index
        const exactMatch = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", normalizedTerm))
          .filter((q) => 
            q.and(
              q.neq(q.field("isDeleted"), true),
              q.neq(q.field("isHidden"), true),
              q.eq(q.field("inStock"), true)
            )
          )
          .take(limit);
        
        if (exactMatch.length > 0) {
          return exactMatch;
        }
      }

      // Fallback: Get products with filters and limit
      const products = await ctx.db
        .query("products")
        .filter((q) => 
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true),
            q.eq(q.field("inStock"), true)
          )
        )
        .take(500); // Cap at 500 for performance
      
      const termLower = normalizedTerm.toLowerCase();
      
      return products.filter(product => {
        // Check category (case-insensitive)
        const categoryMatch = searchType !== "type" && 
          product.category?.toLowerCase() === termLower;
        
        // Check type array (case-insensitive)
        const typeMatch = searchType !== "category" && 
          product.type && 
          Array.isArray(product.type) && 
          product.type.some(t => t?.toLowerCase() === termLower);
        
        return categoryMatch || typeMatch;
      }).slice(0, limit);
      
    } catch (error) {
      return [];
    }
  },
});

// Also keep the original for backward compatibility
// OPTIMIZED: Uses index-based query with pagination
export const getProductsByCategory = query({
  args: { 
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const normalizedCategory = args.category?.trim();
      const limit = args.limit || 50;
      
      if (!normalizedCategory) {
        return [];
      }

      // OPTIMIZED: Try exact match using index first
      const exactMatch = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", normalizedCategory))
        .filter((q) => 
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true),
            q.eq(q.field("inStock"), true)
          )
        )
        .take(limit);
      
      if (exactMatch.length > 0) {
        return exactMatch;
      }

      // Fallback: Case-insensitive search with limit
      const products = await ctx.db
        .query("products")
        .filter((q) => 
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true),
            q.eq(q.field("inStock"), true)
          )
        )
        .take(500);
      
      // Case-insensitive category matching
      return products.filter(product => 
        product.category?.toLowerCase() === normalizedCategory.toLowerCase()
      ).slice(0, limit);
      
    } catch (error) {
      return [];
    }
  },
});

// Get product by itemId
// OPTIMIZED: Uses index-based query
export const getProductByItemId = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    // OPTIMIZED: Use index for direct lookup
    const product = await ctx.db
      .query("products")
      .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
      .filter((q) => q.and(q.neq(q.field("isDeleted"), true), q.neq(q.field("isHidden"), true)))
      .first();
    
    return product || null;
  },
});

// Get products by subcategory (case-insensitive)
// OPTIMIZED: Added pagination limit
export const getProductsBySubcategory = query({
  args: { 
    subcategory: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const normalizedSubcategory = args.subcategory?.trim();
      const limit = args.limit || 50;
      
      if (!normalizedSubcategory) {
        return [];
      }

      // OPTIMIZED: Use take() instead of collect()
      const products = await ctx.db
        .query("products")
        .filter((q) => 
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true),
            q.eq(q.field("inStock"), true)
          )
        )
        .take(500);
      
      // Case-insensitive subcategory matching
      return products.filter(product => 
        product.subcategories?.toLowerCase() === normalizedSubcategory.toLowerCase()
      ).slice(0, limit);
      
    } catch (error) {
      return [];
    }
  },
});















// Move product to trash (store in trash table AND mark as deleted)
export const moveToTrash = mutation({
  args: {
    productId: v.string(),          // ID of the product to delete
    deletedBy: v.optional(v.string()), // Optional, who deleted it
    reason: v.optional(v.string()), // Optional, reason for deletion
  },
  handler: async (ctx, { productId, deletedBy, reason }) => {
    // 1. Fetch the product from the products table
    const product = await ctx.db.get("products", productId);
    if (!product) {
      throw new Error("Product not found.");
    }

    // 2. Insert into trashforproduct
    await ctx.db.insert("trashforproduct", {
      originalId: productId,
      tableName: "products",
      originalData: product,
      deletedAt: nowIso(),
      deletedBy: deletedBy || "admin",
      deletionReason: reason || "",
      canRestore: true,
    });

    // 3. Delete the product from products table
    await ctx.db.delete("products", productId);

    return { success: true, message: "Product deleted and moved to trash." };
  },
});

// Restore product from trash (remove from trash table AND mark as not deleted)
export const restoreFromTrash = mutation({
  args: { 
    productId: v.id("products"),
    restoredBy: v.optional(v.string())
  },
  handler: async (ctx, { productId, restoredBy }) => {
    // Find the trash item for this product
    const trashItem = await ctx.db
      .query("trash")
      .withIndex("by_table", (q) => q.eq("tableName", "products"))
      .filter((q) => q.eq(q.field("originalId"), productId))
      .first();
    
    if (trashItem) {
      // Remove from trash table
      await ctx.db.delete(trashItem._id);
    }
    
    // Mark product as not deleted
    await ctx.db.patch(productId, { 
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: nowIso() // Ensure this is a string
    });
    
    return { success: true, message: "Product restored from trash successfully" };
  },
});

// New update mutation
export const update = mutation(async ({ db }, { itemId, updates }) => {
  const product = await db
    .query("products")
    .filter(q => q.eq(q.field("itemId"), itemId))
    .unique();

  if (!product) throw new Error("Product not found");

  // Ensure updatedAt is a string
  const updateData = {
    ...updates,
    updatedAt: nowIso()
  };

  await db.patch(product._id, updateData);
});

// Get all products (excluding deleted ones)
// OPTIMIZED: Added pagination
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("products")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(limit);
  },
});

// Get all products including deleted ones (for admin)
// OPTIMIZED: Added pagination
export const getAllIncludingDeleted = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    return await ctx.db
      .query("products")
      .order("desc")
      .take(limit);
  },
});

// Get single product by itemId
// OPTIMIZED: Uses index
export const getById = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
      .first();
  },
});

export const toggleHidden = mutation(async ({ db }, { itemId, isHidden }) => {
  const product = await db
    .query("products")
    .filter(q => q.eq(q.field("itemId"), itemId))
    .first();

  if (!product) throw new Error("Product not found");

  await db.patch(product._id, { 
    isHidden,
    updatedAt: nowIso() // Ensure this is a string
  });
});

export const deleteProduct = mutation(async ({ db }, { _id }) => {
  if (!_id) throw new Error("Missing _id");

  await db.delete("products", _id);
});


// Test function to check if API generation works
export const test = query(async ({ db }) => {
  return "test";
});

// Debug function to check database content
export const debugProducts = query(async ({ db }) => {
  const allProducts = await db.query("products").collect();
  return allProducts.map(p => ({
    _id: p._id,
    name: p.name,
    buys: p.buys,
    isHidden: p.isHidden,
    category: p.category,
    price: p.price,
    mainImage: p.mainImage || p.image || "No image",
    image: p.image || "No image"
  }));
});

// Get single product by _id for public product pages
// OPTIMIZED: Uses index for itemId lookup
export const getProductById = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    try {
      // OPTIMIZED: Use index for itemId lookup
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", productId))
        .filter(q => q.neq(q.field("isDeleted"), true))
        .first();
      
      if (product) {
        return product;
      }
      
      // Fallback: try to find by _id (document ID)
      try {
        const productById = await ctx.db.get(productId);
        if (productById && productById.isDeleted !== true) {
          return productById;
        }
      } catch (error) {
        // Invalid document ID
      }
      
      return null;
    } catch (error) {
      return null;
    }
  },
});
// OPTIMIZED: Category stats with pagination
export const getProductCategories = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 1000;
    
    // OPTIMIZED: Use take() instead of collect()
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .take(limit);

    const categories = {};
    
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      if (!categories[category]) {
        categories[category] = {
          name: category,
          count: 0,
          totalSales: 0,
          totalBuys: 0,
          averagePrice: 0,
          priceSum: 0,
        };
      }
      
      categories[category].count += 1;
      categories[category].totalSales += (product.buys || 0) * (product.price || 0);
      categories[category].totalBuys += (product.buys || 0);
      categories[category].priceSum += (product.price || 0);
    });

    // Calculate average prices
    Object.values(categories).forEach(category => {
      if (category.count > 0) {
        category.averagePrice = category.priceSum / category.count;
      }
      delete category.priceSum; // Remove helper field
    });

    return Object.values(categories).sort((a, b) => b.count - a.count);
  },
});

// Get multiple products by IDs for wishlist/cart pages
// OPTIMIZED: Batch fetch using index
export const getProductsByIds = query({
  args: { productIds: v.array(v.string()) },
  handler: async (ctx, { productIds }) => {
    if (productIds.length === 0) return [];
    
    // OPTIMIZED: Batch fetch all products at once using index
    const products = [];
    
    for (const id of productIds) {
      // Try by itemId first (using index)
      const product = await ctx.db
        .query("products")
        .withIndex("by_itemId", (q) => q.eq("itemId", id))
        .filter(q => q.neq(q.field("isDeleted"), true))
        .first();
      
      if (product) {
        products.push(product);
        continue;
      }
      
      // Fallback: try by document ID
      try {
        const productById = await ctx.db.get(id);
        if (productById && !productById.isDeleted) {
          products.push(productById);
        }
      } catch (error) {
        // Invalid document ID, skip
      }
    }
    
    return products;
  },
});

// Get top 10 products of the week (by sales)
// OPTIMIZED: Added limit and removed full collection scan
export const getTopPicks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // OPTIMIZED: Use take() instead of collect()
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true)
        )
      )
      .take(200); // Get enough products to sort
    
    // Sort by buys field (sales count)
    const sortedProducts = products.sort((a, b) => (b.buys || 0) - (a.buys || 0));
    
    const topProducts = sortedProducts.slice(0, limit);
    
    // Return products with all necessary fields for display
    return topProducts.map(p => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      mainImage: p.mainImage || p.image || "/products/placeholder.jpg",
      buys: p.buys,
      createdAt: p.createdAt || null
    }));
  },
});

// Get product statistics for admin dashboard
// OPTIMIZED: Added limit to prevent full collection scan
export const getProductStats = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 2000;
    
    // OPTIMIZED: Use take() instead of collect()
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .take(limit);

    const stats = {
      total: products.length,
      inStock: products.filter(p => p.inStock !== false).length,
      outOfStock: products.filter(p => p.inStock === false).length,
      lowStock: products.filter(p => 
        p.currentStock !== undefined && p.currentStock < 10 && p.currentStock > 0
      ).length,
      totalSales: products.reduce((sum, p) => sum + (p.buys || 0) * (p.price || 0), 0),
      totalBuys: products.reduce((sum, p) => sum + (p.buys || 0), 0),
      averagePrice: products.length > 0 
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
        : 0,
      categories: {}
    };

    // Calculate category stats
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      if (!stats.categories[category]) {
        stats.categories[category] = {
          count: 0,
          totalSales: 0,
          totalBuys: 0
        };
      }
      stats.categories[category].count += 1;
      stats.categories[category].totalSales += (product.buys || 0) * (product.price || 0);
      stats.categories[category].totalBuys += (product.buys || 0);
    });

    return stats;
  },
});

// Get products with advanced filtering for admin
export const getProductsWithFilters = query({
  args: {
    searchQuery: v.optional(v.string()),
    category: v.optional(v.string()),
    stockStatus: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true));

    // Apply search filter
    if (args.searchQuery) {
      query = query.filter(q => 
        q.or(
          q.eq(q.field("name"), args.searchQuery),
          q.eq(q.field("itemId"), args.searchQuery)
        )
      );
    }

    // Apply category filter
    if (args.category && args.category !== "All") {
      query = query.filter(q => q.eq(q.field("category"), args.category));
    }

    // Apply stock status filter
    if (args.stockStatus && args.stockStatus !== "All") {
      if (args.stockStatus === "In Stock") {
        query = query.filter(q => q.neq(q.field("inStock"), false));
      } else if (args.stockStatus === "Out of Stock") {
        query = query.filter(q => q.eq(q.field("inStock"), false));
      } else if (args.stockStatus === "Low Stock") {
        query = query.filter(q => 
          q.and(
            q.neq(q.field("currentStock"), undefined),
            q.lt(q.field("currentStock"), 10),
            q.gt(q.field("currentStock"), 0)
          )
        );
      }
    }

    // Apply sorting
    const sortField = args.sortBy || "createdAt";
    const sortOrder = args.sortOrder || "desc";
    
    if (sortField === "name" || sortField === "category") {
      // For string fields, we need to sort after fetching
      const products = await query.collect();
      products.sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
      
      // Apply pagination
      const offset = args.offset || 0;
      const limit = args.limit || 50;
      return products.slice(offset, offset + limit);
    } else {
      // For numeric fields, we can sort in the query
      const order = sortOrder === "asc" ? "asc" : "desc";
      const products = await query.order(order).take(args.limit || 50);
      return products;
    }
  },
});

// Bulk update product status
export const bulkUpdateProductStatus = mutation({
  args: {
    productIds: v.array(v.id("products")),
    updates: v.object({
      inStock: v.optional(v.boolean()),
      isHidden: v.optional(v.boolean()),
      category: v.optional(v.string()),
    }),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productIds, updates, updatedBy = "admin" }) => {
    const results = [];
    
    for (const productId of productIds) {
      try {
        const product = await ctx.db.get(productId);
        if (!product) {
          results.push({ id: productId, success: false, error: "Product not found" });
          continue;
        }

        await ctx.db.patch(productId, {
          ...updates,
          updatedAt: nowIso(), // Changed from Date.now() to nowIso()
          updatedBy,
        });

        results.push({ id: productId, success: true });
      } catch (error) {
        results.push({ id: productId, success: false, error: error.message });
      }
    }

    return results;
  },
});

// Bulk delete products
export const bulkDeleteProducts = mutation({
  args: {
    productIds: v.array(v.id("products")),
    deletedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productIds, deletedBy = "admin" }) => {
    const results = [];
    
    for (const productId of productIds) {
      try {
        const product = await ctx.db.get(productId);
        if (!product) {
          results.push({ id: productId, success: false, error: "Product not found" });
          continue;
        }

        // Soft delete by marking as deleted
        await ctx.db.patch(productId, {
          isDeleted: true,
          deletedAt: nowIso(), // Changed from Date.now() to nowIso()
          deletedBy,
          updatedAt: nowIso() // Added this field
        });

        results.push({ id: productId, success: true });
      } catch (error) {
        results.push({ id: productId, success: false, error: error.message });
      }
    }

    return results;
  },
});

// Get product analytics
export const getProductAnalytics = query({
  args: {
    productId: v.optional(v.string()),
    timeRange: v.optional(v.string()), // "7d", "30d", "90d", "1y"
  },
  handler: async (ctx, { productId, timeRange = "30d" }) => {
    const now = Date.now();
    const timeRanges = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    
    const startTime = now - (timeRanges[timeRange] || timeRanges["30d"]);

    if (productId) {
      // Get analytics for specific product
      const product = await ctx.db
        .query("products")
        .filter(q => q.eq(q.field("itemId"), productId))
        .first();

      if (!product) {
        return null;
      }

      // Get orders for this product in the time range
      const orders = await ctx.db
        .query("orders")
        .filter(q => 
          q.and(
            q.gte(q.field("createdAt"), startTime),
            q.eq(q.field("status"), "delivered")
          )
        )
        .collect();

      // Calculate analytics
      const productOrders = orders.filter(order => 
        order.items.some(item => item.itemId === productId)
      );

      const totalSales = productOrders.reduce((sum, order) => {
        const productItem = order.items.find(item => item.itemId === productId);
        return sum + (productItem ? productItem.price * productItem.quantity : 0);
      }, 0);

      const totalQuantity = productOrders.reduce((sum, order) => {
        const productItem = order.items.find(item => item.itemId === productId);
        return sum + (productItem ? productItem.quantity : 0);
      }, 0);

      return {
        product,
        totalSales,
        totalQuantity,
        orderCount: productOrders.length,
        averageOrderValue: productOrders.length > 0 ? totalSales / productOrders.length : 0,
        timeRange,
      };
    } else {
      // Get overall analytics
      const orders = await ctx.db
        .query("orders")
        .filter(q => 
          q.and(
            q.gte(q.field("createdAt"), startTime),
            q.eq(q.field("status"), "delivered")
          )
        )
        .collect();

      const totalRevenue = orders.reduce((sum, order) => sum + order.orderTotal, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get top selling products
      const productSales = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          if (!productSales[item.itemId]) {
            productSales[item.itemId] = {
              name: item.name,
              totalSales: 0,
              totalQuantity: 0,
            };
          }
          productSales[item.itemId].totalSales += item.price * item.quantity;
          productSales[item.itemId].totalQuantity += item.quantity;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([itemId, data]) => ({ itemId, ...data }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        timeRange,
      };
    }
  },
});

// Update product stock
export const updateProductStock = mutation({
  args: {
    productId: v.id("products"),
    stockData: v.object({
      currentStock: v.optional(v.number()),
      inStock: v.optional(v.boolean()),
      sizeStock: v.optional(v.any()), // Change this to v.any() to allow any object structure
    }),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, stockData, updatedBy = "admin" }) => {
    const product = await ctx.db.get(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Update the product with new stock data
    await ctx.db.patch(productId, {
      ...stockData,
      updatedAt: nowIso(), // Changed from Date.now() to nowIso()
      updatedBy,
    });

    return { success: true };
  },
});

// Get low stock products
export const getLowStockProducts = query({
  args: {
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, { threshold = 10 }) => {
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    return products.filter(product => 
      product.currentStock !== undefined && 
      product.currentStock <= threshold &&
      product.currentStock > 0
    );
  },
});

// Get out of stock products
export const getOutOfStockProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .filter(q => 
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.eq(q.field("inStock"), false)
        )
      )
      .collect();
  },
});

// Get product categories with stats


// Search products for admin
export const searchProducts = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, { query, limit = 20, sortBy = "relevance" }) => {
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    const searchTerm = query.toLowerCase().trim();
    
    const filtered = products.filter(product => {
      const name = (product.name || "").toLowerCase();
      const itemId = (product.itemId || "").toLowerCase();
      const category = (product.category || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      
      return name.includes(searchTerm) ||
             itemId.includes(searchTerm) ||
             category.includes(searchTerm) ||
             description.includes(searchTerm);
    });

    return filtered.slice(0, limit);
  },
});

// Migration function to fix existing products with numeric updatedAt
export const migrateUpdatedAtFields = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let migratedCount = 0;
    
    for (const product of products) {
      // Check if updatedAt is a number (timestamp) instead of string
      if (typeof product.updatedAt === 'number') {
        await ctx.db.patch(product._id, {
          updatedAt: new Date(product.updatedAt).toISOString()
        });
        migratedCount++;
      }
    }
    
    return { migratedCount, message: `Migrated ${migratedCount} products` };
  },
});

// Debug and fix product stock status
export const fixProductStock = mutation({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    // Find product by itemId
    const product = await ctx.db
      .query("products")
      .filter(q => q.eq(q.field("itemId"), productId))
      .first();

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    // Update the product to be in stock
    await ctx.db.patch(product._id, {
      inStock: true,
      updatedAt: nowIso()
    });

    return { 
      success: true, 
      message: `Product ${product.name} is now in stock`,
      product: {
        name: product.name,
        itemId: product.itemId,
        inStock: true
      }
    };
  },
});

// Get recently viewed products for a user
export const getRecentlyViewed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const recentlyViewed = await ctx.db
      .query("recentlyViewed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc", "viewedAt")
      .collect();

    return recentlyViewed.slice(0, limit);
  },
});

// Add this function to track product views
export const trackProductView = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Increment the view count
    await ctx.db.patch(args.productId, {
      views: (product.views || 0) + 1,
    });

    return { success: true };
  },
});

// Get trending products with view counts
export const getTrendingProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 8;
    
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit * 2);
    
    // Sort by view count
    const trendingProducts = products
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
    
    return trendingProducts;
  },
});

// Get best selling products
export const getBestSellers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 8;
    
    const products = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit * 2);
    
    // Sort by sales count
    const bestSellers = products
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, limit);
    
    return bestSellers;
  },
});

// Get editor's choice products
export const getEditorsChoice = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 8;
    
    const editorsChoice = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("isEditorsChoice"), true))
      .order("desc")
      .take(limit);
    
    // If not enough editor's choice products, supplement with top-rated products
    if (editorsChoice.length < limit) {
      const topRated = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(limit * 2);
      
      const topRatedProducts = topRated
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit - editorsChoice.length);
      
      return [...editorsChoice, ...topRatedProducts];
    }
    
    return editorsChoice;
  },
});

// Add product to recently viewed
export const addRecentlyViewed = mutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    productPrice: v.number(),
    productCategory: v.string(),
  },
  handler: async (ctx, { userId, productId, productName, productImage, productPrice, productCategory }) => {
    // Check if this product is already in recently viewed
    const existing = await ctx.db
      .query("recentlyViewed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("productId"), productId))
      .first();

    if (existing) {
      // Update the viewedAt timestamp
      await ctx.db.patch(existing._id, {
        viewedAt: nowIso(),
      });
    } else {
      // Add new entry
      await ctx.db.insert("recentlyViewed", {
        userId,
        productId,
        productName,
        productImage,
        productPrice,
        productCategory,
        viewedAt: nowIso(),
      });     
    }

    // Clean up old entries (keep only last 50 per user)
    const allRecent = await ctx.db
      .query("recentlyViewed")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc", "viewedAt")
      .collect();

    if (allRecent.length > 50) {
      const toDelete = allRecent.slice(50);
      for (const item of toDelete) {
        await ctx.db.delete(item._id);
      }
    }

    return { success: true };
  },
});

// Get related products based on category and price
export const getRelatedProducts = query({
  args: {
    productId: v.string(),
    category: v.string(),
    price: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { productId, category, price, limit = 4 }) => {
    // Get products in the same category, excluding the current product
    const relatedProducts = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), category),
          q.neq(q.field("itemId"), productId),
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true)
        )
      )
      .collect();

    // If we don't have enough products in the same category, get products with similar price range
    if (relatedProducts.length < limit) {
      const priceRange = price * 0.3; // 30% price range
      const minPrice = price - priceRange;
      const maxPrice = price + priceRange;

      const priceSimilarProducts = await ctx.db
        .query("products")
        .filter((q) => 
          q.and(
            q.neq(q.field("itemId"), productId),
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true),
            q.gte(q.field("price"), minPrice),
            q.lte(q.field("price"), maxPrice)
          )
        )
        .collect();

      // Merge and deduplicate
      const allProducts = [...relatedProducts, ...priceSimilarProducts];
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.itemId === product.itemId)
      );

      // Sort by relevance (category match first, then price similarity)
      uniqueProducts.sort((a, b) => {
        const aCategoryMatch = a.category === category ? 1 : 0;
        const bCategoryMatch = b.category === category ? 1 : 0;
        
        if (aCategoryMatch !== bCategoryMatch) {
          return bCategoryMatch - aCategoryMatch;
        }
        
        // If both have same category match, sort by price similarity
        const aPriceDiff = Math.abs(a.price - price);
        const bPriceDiff = Math.abs(b.price - price);
        return aPriceDiff - bPriceDiff;
      });

      return uniqueProducts.slice(0, limit);
    }

    // If we have enough products in the same category, sort by price similarity
    relatedProducts.sort((a, b) => {
      const aPriceDiff = Math.abs(a.price - price);
      const bPriceDiff = Math.abs(b.price - price);
      return aPriceDiff - bPriceDiff;
    });

    return relatedProducts.slice(0, limit);
  },
});

// Reports Functions

// Get dashboard summary statistics
export const getDashboardStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const defaultEndDate = endDate || now;

    // Get orders within date range
    let ordersQuery = ctx.db.query("orders");
    if (startDate) {
      ordersQuery = ordersQuery.filter(q => q.gte(q.field("createdAt"), defaultStartDate));
    }
    if (endDate) {
      ordersQuery = ordersQuery.filter(q => q.lte(q.field("createdAt"), defaultEndDate));
    }
    
    const orders = await ordersQuery.collect();
    
    // Calculate metrics
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.orderTotal, 0);
    const completedOrders = orders.filter(order => order.status === "delivered");
    const netProfit = completedOrders.reduce((sum, order) => sum + (order.orderTotal * 0.3), 0); // Assuming 30% profit margin
    
    // Get unique customers
    const uniqueCustomers = new Set(orders.map(order => order.userId)).size;
    
    return {
      totalSales,
      totalOrders,
      totalCustomers: uniqueCustomers,
      netProfit,
    };
  },
});

// Get sales performance over time
export const getSalesPerformance = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    interval: v.optional(v.string()), // "day", "week", "month"
  },
  handler: async (ctx, { startDate, endDate, interval = "day" }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    let ordersQuery = ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate));
    
    const orders = await ordersQuery.collect();
    
    // Group by time interval
    const salesData = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key;
      
      if (interval === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (interval === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!salesData[key]) {
        salesData[key] = { date: key, sales: 0, orders: 0 };
      }
      salesData[key].sales += order.orderTotal;
      salesData[key].orders += 1;
    });
    
    return Object.values(salesData).sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get revenue breakdown by category
export const getRevenueByCategory = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    let ordersQuery = ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate));
    
    const orders = await ordersQuery.collect();
    
    // Get all products to map categories
    const products = await ctx.db.query("products").collect();
    const productCategories = {};
    products.forEach(product => {
      productCategories[product.itemId] = product.category || "Uncategorized";
    });
    
    const categoryRevenue = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = productCategories[item.productId] || "Uncategorized";
        if (!categoryRevenue[category]) {
          categoryRevenue[category] = 0;
        }
        categoryRevenue[category] += item.price * item.quantity;
      });
    });
    
    return Object.entries(categoryRevenue).map(([category, revenue]) => ({
      category,
      revenue,
    }));
  },
});

// Get top selling products
export const getTopSellingProducts = query({
  args: {
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 5, startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    let ordersQuery = ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate));
    
    const orders = await ordersQuery.collect();
    
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSales[item.productId].totalQuantity += item.quantity;
        productSales[item.productId].totalRevenue += item.price * item.quantity;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  },
});

// Get detailed reports data
export const getDetailedReports = query({
  args: {
    reportType: v.string(), // "orders" or "products"
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const defaultStartDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = args.endDate || now;

    if (args.reportType === "orders") {
      let ordersQuery = ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
        .filter(q => q.lte(q.field("createdAt"), defaultEndDate));
      
      if (args.searchQuery) {
        ordersQuery = ordersQuery.filter(q => 
          q.eq(q.field("orderNumber"), args.searchQuery)
        );
      }
      
      const orders = await ordersQuery
        .order("desc")
        .collect();
      
      const startIndex = args.offset || 0;
      const endIndex = startIndex + (args.limit || 50);
      
      return {
        data: orders.slice(startIndex, endIndex),
        total: orders.length,
      };
    } else {
      // Products report
      let productsQuery = ctx.db.query("products")
        .filter(q => q.neq(q.field("isDeleted"), true));
      
      if (args.category) {
        productsQuery = productsQuery.filter(q => q.eq(q.field("category"), args.category));
      }
      
      if (args.searchQuery) {
        productsQuery = productsQuery.filter(q => 
          q.or(
            q.eq(q.field("name"), args.searchQuery),
            q.eq(q.field("itemId"), args.searchQuery)
          )
        );
      }
      
      const products = await productsQuery.collect();
      
      const startIndex = args.offset || 0;
      const endIndex = startIndex + (args.limit || 50);
      
      return {
        data: products.slice(startIndex, endIndex),
        total: products.length,
      };
    }
  },
});
// Advanced Analytics Functions

// Get comprehensive dashboard analytics
export const getAdvancedAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    period: v.optional(v.string()), // "day", "week", "month", "year"
  },
  handler: async (ctx, { startDate, endDate, period = "month" }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    // Get all orders in date range
    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Get all products
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    // Get all users
    const users = await ctx.db.query("users").collect();

    // Calculate comprehensive metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.orderTotal, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate conversion rate (simplified - orders/users)
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
    
    // Calculate growth metrics
    const previousPeriodStart = defaultStartDate - (defaultEndDate - defaultStartDate);
    const previousOrders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), previousPeriodStart))
      .filter(q => q.lt(q.field("createdAt"), defaultStartDate))
      .collect();
    
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.orderTotal, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const orderGrowth = previousOrders.length > 0 ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 : 0;

    // Top performing products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.name,
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
        productSales[item.productId].orders += 1;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Category performance
    const categoryStats = {};
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          products: 0,
          revenue: 0,
          orders: 0,
        };
      }
      categoryStats[category].products += 1;
    });

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.itemId === item.productId);
        if (product) {
          const category = product.category || "Uncategorized";
          categoryStats[category].revenue += item.price * item.quantity;
          categoryStats[category].orders += 1;
        }
      });
    });

    const categoryPerformance = Object.values(categoryStats)
      .sort((a, b) => b.revenue - a.revenue);

    // Order status distribution
    const statusDistribution = {};
    orders.forEach(order => {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });

    // Payment method distribution
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentDetails.paymentMethod || "razorpay";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Geographic distribution (based on shipping details)
    const geographicData = {};
    orders.forEach(order => {
      const state = order.shippingDetails.state || "Unknown";
      geographicData[state] = (geographicData[state] || 0) + 1;
    });

    return {
      overview: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        conversionRate,
        revenueGrowth,
        orderGrowth,
      },
      topProducts,
      categoryPerformance,
      statusDistribution,
      paymentMethods,
      geographicData,
      period: {
        start: defaultStartDate,
        end: defaultEndDate,
        label: period,
      },
    };
  },
});

// Get detailed traffic and user analytics
export const getTrafficAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    // Get all users created in date range
    const newUsers = await ctx.db.query("users")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Get all orders to analyze user behavior
    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Calculate user engagement metrics
    const userEngagement = {};
    orders.forEach(order => {
      if (!userEngagement[order.userId]) {
        userEngagement[order.userId] = {
          userId: order.userId,
          orders: 0,
          totalSpent: 0,
          lastOrder: order.createdAt,
        };
      }
      userEngagement[order.userId].orders += 1;
      userEngagement[order.userId].totalSpent += order.orderTotal;
      userEngagement[order.userId].lastOrder = Math.max(userEngagement[order.userId].lastOrder, order.createdAt);
    });

    const engagedUsers = Object.values(userEngagement);
    const averageOrdersPerUser = engagedUsers.length > 0 ? 
      engagedUsers.reduce((sum, user) => sum + user.orders, 0) / engagedUsers.length : 0;

    // Customer lifetime value
    const totalCustomerValue = engagedUsers.reduce((sum, user) => sum + user.totalSpent, 0);
    const averageCustomerValue = engagedUsers.length > 0 ? totalCustomerValue / engagedUsers.length : 0;

    // Repeat customer rate
    const repeatCustomers = engagedUsers.filter(user => user.orders > 1).length;
    const repeatCustomerRate = engagedUsers.length > 0 ? (repeatCustomers / engagedUsers.length) * 100 : 0;

    // New vs returning customers
    const newCustomerOrders = orders.filter(order => 
      newUsers.some(user => user._id === order.userId)
    ).length;
    const returningCustomerOrders = orders.length - newCustomerOrders;

    return {
      newUsers: newUsers.length,
      totalUsers: (await ctx.db.query("users").collect()).length,
      engagedUsers: engagedUsers.length,
      averageOrdersPerUser,
      averageCustomerValue,
      repeatCustomerRate,
      newCustomerOrders,
      returningCustomerOrders,
      userEngagement: engagedUsers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20),
    };
  },
});

// Get real-time sales performance
export const getRealTimeSales = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    granularity: v.optional(v.string()), // "hour", "day", "week", "month"
  },
  handler: async (ctx, { startDate, endDate, granularity = "day" }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Group by time period
    const salesData = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key;
      
      if (granularity === "hour") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (granularity === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (granularity === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!salesData[key]) {
        salesData[key] = {
          period: key,
          revenue: 0,
          orders: 0,
          customers: new Set(),
        };
      }
      salesData[key].revenue += order.orderTotal;
      salesData[key].orders += 1;
      salesData[key].customers.add(order.userId);
    });

    // Convert to array and calculate unique customers
    return Object.values(salesData).map(item => ({
      period: item.period,
      revenue: item.revenue,
      orders: item.orders,
      customers: item.customers.size,
    })).sort((a, b) => a.period.localeCompare(b.period));
  },
});

// Get inventory analytics
export const getInventoryAnalytics = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.inStock).length;
    const outOfStockProducts = products.filter(p => !p.inStock).length;
    const lowStockProducts = products.filter(p => (p.currentStock || 0) < 10).length;

    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, product) => 
      sum + (product.price * (product.currentStock || 0)), 0
    );

    // Category-wise inventory
    const categoryInventory = {};
    products.forEach(product => {
      const category = product.category || "Uncategorized";
      if (!categoryInventory[category]) {
        categoryInventory[category] = {
          category,
          products: 0,
          inStock: 0,
          outOfStock: 0,
          lowStock: 0,
          value: 0,
        };
      }
      categoryInventory[category].products += 1;
      if (product.inStock) categoryInventory[category].inStock += 1;
      else categoryInventory[category].outOfStock += 1;
      if ((product.currentStock || 0) < 10) categoryInventory[category].lowStock += 1;
      categoryInventory[category].value += product.price * (product.currentStock || 0);
    });

    return {
      totalProducts,
      inStockProducts,
      outOfStockProducts,
      lowStockProducts,
      totalInventoryValue,
      categoryInventory: Object.values(categoryInventory),
    };
  },
});

// Get customer analytics
export const getCustomerAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    const users = await ctx.db.query("users").collect();
    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Customer segments
    const customerSegments = {
      new: 0,
      returning: 0,
      vip: 0, // High value customers
      inactive: 0,
    };

    const customerSpending = {};
    orders.forEach(order => {
      if (!customerSpending[order.userId]) {
        customerSpending[order.userId] = 0;
      }
      customerSpending[order.userId] += order.orderTotal;
    });

    const vipThreshold = 10000; // VIP customers who spent more than 10k
    const vipCustomers = Object.entries(customerSpending)
      .filter(([_, spending]) => spending >= vipThreshold)
      .length;

    customerSegments.vip = vipCustomers;
    customerSegments.returning = Object.keys(customerSpending).length - vipCustomers;

    // New customers in period
    const newCustomers = users.filter(user => 
      user.createdAt >= defaultStartDate && user.createdAt <= defaultEndDate
    ).length;
    customerSegments.new = newCustomers;

    // Customer acquisition cost (simplified)
    const totalMarketingSpend = 50000; // Placeholder - you'd get this from your marketing data
    const customerAcquisitionCost = newCustomers > 0 ? totalMarketingSpend / newCustomers : 0;

    return {
      totalCustomers: users.length,
      newCustomers,
      customerSegments,
      customerAcquisitionCost,
      averageOrderValue: orders.length > 0 ? 
        orders.reduce((sum, order) => sum + order.orderTotal, 0) / orders.length : 0,
    };
  },
});

// Advanced Traffic Analytics Functions

// Get comprehensive website traffic analytics
export const getWebsiteTrafficAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    granularity: v.optional(v.string()), // "hour", "day", "week", "month"
  },
  handler: async (ctx, { startDate, endDate, granularity = "day" }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    // Get all users (representing website visitors)
    const allUsers = await ctx.db.query("users").collect();
    
    // Get orders to analyze conversion
    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Simulate traffic data (in a real app, you'd integrate with Google Analytics, etc.)
    const trafficData = [];
    const daysDiff = Math.ceil((defaultEndDate - defaultStartDate) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(defaultStartDate + (i * 24 * 60 * 60 * 1000));
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Simulate realistic traffic patterns
      const baseTraffic = isWeekend ? 800 : 1200;
      const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120% variation
      const traffic = Math.floor(baseTraffic * randomFactor);
      
      const bounceRate = 0.3 + Math.random() * 0.2; // 30-50% bounce rate
      const avgSessionDuration = 120 + Math.random() * 180; // 2-5 minutes
      const pagesPerSession = 2.5 + Math.random() * 1.5; // 2.5-4 pages
      
      trafficData.push({
        date: date.toISOString().split('T')[0],
        visitors: traffic,
        pageViews: Math.floor(traffic * pagesPerSession),
        sessions: Math.floor(traffic * 0.9), // 90% of visitors have sessions
        bounceRate: bounceRate * 100,
        avgSessionDuration: Math.floor(avgSessionDuration),
        newVisitors: Math.floor(traffic * 0.6), // 60% new visitors
        returningVisitors: Math.floor(traffic * 0.4), // 40% returning
      });
    }

    // Calculate totals
    const totalVisitors = trafficData.reduce((sum, day) => sum + day.visitors, 0);
    const totalPageViews = trafficData.reduce((sum, day) => sum + day.pageViews, 0);
    const totalSessions = trafficData.reduce((sum, day) => sum + day.sessions, 0);
    const avgBounceRate = trafficData.reduce((sum, day) => sum + day.bounceRate, 0) / trafficData.length;
    const avgSessionDuration = trafficData.reduce((sum, day) => sum + day.avgSessionDuration, 0) / trafficData.length;
    const totalNewVisitors = trafficData.reduce((sum, day) => sum + day.newVisitors, 0);
    const totalReturningVisitors = trafficData.reduce((sum, day) => sum + day.returningVisitors, 0);

    // Calculate conversion rate
    const conversionRate = totalVisitors > 0 ? (orders.length / totalVisitors) * 100 : 0;

    // Device analytics (simulated)
    const deviceData = {
      desktop: { visitors: Math.floor(totalVisitors * 0.45), percentage: 45 },
      mobile: { visitors: Math.floor(totalVisitors * 0.50), percentage: 50 },
      tablet: { visitors: Math.floor(totalVisitors * 0.05), percentage: 5 },
    };

    // Traffic sources (simulated)
    const trafficSources = {
      organic: { visitors: Math.floor(totalVisitors * 0.40), percentage: 40 },
      direct: { visitors: Math.floor(totalVisitors * 0.25), percentage: 25 },
      social: { visitors: Math.floor(totalVisitors * 0.20), percentage: 20 },
      referral: { visitors: Math.floor(totalVisitors * 0.10), percentage: 10 },
      paid: { visitors: Math.floor(totalVisitors * 0.05), percentage: 5 },
    };

    // Geographic distribution (simulated)
    const geographicData = {
      "Maharashtra": Math.floor(totalVisitors * 0.25),
      "Delhi": Math.floor(totalVisitors * 0.20),
      "Karnataka": Math.floor(totalVisitors * 0.15),
      "Tamil Nadu": Math.floor(totalVisitors * 0.12),
      "Gujarat": Math.floor(totalVisitors * 0.10),
      "West Bengal": Math.floor(totalVisitors * 0.08),
      "Rajasthan": Math.floor(totalVisitors * 0.05),
      "Others": Math.floor(totalVisitors * 0.05),
    };

    // Top pages (simulated)
    const topPages = [
      { page: "/", visitors: Math.floor(totalVisitors * 0.35), pageViews: Math.floor(totalPageViews * 0.40) },
      { page: "/products", visitors: Math.floor(totalVisitors * 0.25), pageViews: Math.floor(totalPageViews * 0.30) },
      { page: "/category/men", visitors: Math.floor(totalVisitors * 0.15), pageViews: Math.floor(totalPageViews * 0.12) },
      { page: "/category/women", visitors: Math.floor(totalVisitors * 0.12), pageViews: Math.floor(totalPageViews * 0.10) },
      { page: "/about", visitors: Math.floor(totalVisitors * 0.08), pageViews: Math.floor(totalPageViews * 0.05) },
      { page: "/contact", visitors: Math.floor(totalVisitors * 0.05), pageViews: Math.floor(totalPageViews * 0.03) },
    ];

    return {
      overview: {
        totalVisitors,
        totalPageViews,
        totalSessions,
        avgBounceRate: Math.round(avgBounceRate * 10) / 10,
        avgSessionDuration: Math.round(avgSessionDuration),
        conversionRate: Math.round(conversionRate * 100) / 100,
        newVisitors: totalNewVisitors,
        returningVisitors: totalReturningVisitors,
      },
      dailyData: trafficData,
      deviceData,
      trafficSources,
      geographicData,
      topPages,
      period: {
        start: defaultStartDate,
        end: defaultEndDate,
        granularity,
      },
    };
  },
});

// Get real-time website activity
export const getRealTimeActivity = query({
  handler: async (ctx) => {
    // Get recent orders (last 24 hours)
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentOrders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), last24Hours))
      .order("desc")
      .collect();

    // Get recent users (last 24 hours)
    const recentUsers = await ctx.db.query("users")
      .filter(q => q.gte(q.field("createdAt"), last24Hours))
      .order("desc")
      .collect();

    // Simulate real-time activity
    const activities = [];
    
    // Add recent orders
    recentOrders.forEach(order => {
      activities.push({
        id: `order-${order._id}`,
        type: "order",
        title: "New Order Placed",
        description: `Order #${order.orderNumber} for ${formatCurrency(order.orderTotal)}`,
        timestamp: order.createdAt,
        user: order.shippingDetails.fullName,
        amount: order.orderTotal,
        status: order.status,
      });
    });

    // Add recent users
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        type: "user",
        title: "New User Registered",
        description: `${user.name} joined the platform`,
        timestamp: user.createdAt,
        user: user.name,
        email: user.email,
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return {
      activities: activities.slice(0, 50), // Last 50 activities
      totalOrders: recentOrders.length,
      totalUsers: recentUsers.length,
      lastUpdated: Date.now(),
    };
  },
});

// Get advanced conversion funnel analytics
export const getConversionFunnelAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    // Get all users and orders in date range
    const users = await ctx.db.query("users")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Simulate funnel data
    const totalVisitors = users.length * 3; // Assume 3x more visitors than registered users
    const productPageViews = Math.floor(totalVisitors * 0.6); // 60% visit product pages
    const addToCart = Math.floor(productPageViews * 0.3); // 30% add to cart
    const checkoutStarted = Math.floor(addToCart * 0.7); // 70% start checkout
    const ordersCompleted = orders.length;

    const funnel = [
      { stage: "Website Visitors", count: totalVisitors, percentage: 100 },
      { stage: "Product Page Views", count: productPageViews, percentage: Math.round((productPageViews / totalVisitors) * 100) },
      { stage: "Add to Cart", count: addToCart, percentage: Math.round((addToCart / totalVisitors) * 100) },
      { stage: "Checkout Started", count: checkoutStarted, percentage: Math.round((checkoutStarted / totalVisitors) * 100) },
      { stage: "Orders Completed", count: ordersCompleted, percentage: Math.round((ordersCompleted / totalVisitors) * 100) },
    ];

    // Calculate conversion rates between stages
    const conversionRates = {
      visitorsToProductViews: Math.round((productPageViews / totalVisitors) * 100),
      productViewsToCart: Math.round((addToCart / productPageViews) * 100),
      cartToCheckout: Math.round((checkoutStarted / addToCart) * 100),
      checkoutToOrder: Math.round((ordersCompleted / checkoutStarted) * 100),
      overallConversion: Math.round((ordersCompleted / totalVisitors) * 100),
    };

    return {
      funnel,
      conversionRates,
      period: {
        start: defaultStartDate,
        end: defaultEndDate,
      },
    };
  },
});

// Get advanced user behavior analytics
export const getUserBehaviorAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Analyze user behavior patterns
    const behaviorData = {
      // Time-based patterns
      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orders: Math.floor(orders.length * (0.5 + 0.5 * Math.sin((hour - 6) * Math.PI / 12))),
        visitors: Math.floor(orders.length * 10 * (0.5 + 0.5 * Math.sin((hour - 6) * Math.PI / 12))),
      })),
      
      // Day of week patterns
      weeklyDistribution: [
        { day: "Monday", orders: Math.floor(orders.length * 0.15), visitors: Math.floor(orders.length * 10 * 0.15) },
        { day: "Tuesday", orders: Math.floor(orders.length * 0.18), visitors: Math.floor(orders.length * 10 * 0.18) },
        { day: "Wednesday", orders: Math.floor(orders.length * 0.20), visitors: Math.floor(orders.length * 10 * 0.20) },
        { day: "Thursday", orders: Math.floor(orders.length * 0.19), visitors: Math.floor(orders.length * 10 * 0.19) },
        { day: "Friday", orders: Math.floor(orders.length * 0.16), visitors: Math.floor(orders.length * 10 * 0.16) },
        { day: "Saturday", orders: Math.floor(orders.length * 0.08), visitors: Math.floor(orders.length * 10 * 0.08) },
        { day: "Sunday", orders: Math.floor(orders.length * 0.04), visitors: Math.floor(orders.length * 10 * 0.04) },
      ],

      // User engagement metrics
      engagement: {
        avgSessionDuration: 180 + Math.random() * 120, // 3-5 minutes
        pagesPerSession: 3.2 + Math.random() * 1.8, // 3-5 pages
        bounceRate: 35 + Math.random() * 15, // 35-50%
        returnVisitorRate: 40 + Math.random() * 20, // 40-60%
      },

      // Popular search terms (simulated)
      searchTerms: [
        { term: "hoodie", searches: 1250, conversions: 45 },
        { term: "t-shirt", searches: 980, conversions: 32 },
        { term: "jeans", searches: 750, conversions: 28 },
        { term: "sneakers", searches: 650, conversions: 22 },
        { term: "jacket", searches: 520, conversions: 18 },
        { term: "dress", searches: 480, conversions: 15 },
        { term: "shorts", searches: 420, conversions: 12 },
        { term: "shirt", searches: 380, conversions: 10 },
      ],

      // Exit pages (simulated)
      exitPages: [
        { page: "/products", exits: 450, exitRate: 12.5 },
        { page: "/category/men", exits: 380, exitRate: 10.8 },
        { page: "/category/women", exits: 320, exitRate: 9.2 },
        { page: "/cart", exits: 280, exitRate: 8.1 },
        { page: "/checkout", exits: 150, exitRate: 4.3 },
      ],
    };

    return {
      behaviorData,
      period: {
        start: defaultStartDate,
        end: defaultEndDate,
      },
    };
  },
});

// Helper function for currency formatting
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Fix the getSalesPerformance function to return proper format
export const getSalesPerformanceFixed = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    period: v.optional(v.string()), // "7d", "30d", "90d", "1y"
  },
  handler: async (ctx, { startDate, endDate, period = "30d" }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    let ordersQuery = ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate));
    
    const orders = await ordersQuery.collect();
    
    // Group by time interval based on period
    const salesData = {};
    const interval = period === "7d" ? "day" : period === "30d" ? "day" : period === "90d" ? "week" : "month";
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key;
      
      if (interval === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (interval === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!salesData[key]) {
        salesData[key] = { date: key, sales: 0, orders: 0 };
      }
      salesData[key].sales += order.orderTotal;
      salesData[key].orders += 1;
    });
    
    const sortedData = Object.values(salesData).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      labels: sortedData.map(d => d.date),
      revenue: sortedData.map(d => d.sales),
      orders: sortedData.map(d => d.orders)
    };
  },
});

// Get all products for admin
export const getAllProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(args.limit || 1000);
    
    return products;
  },
});

// OPTIMIZED: Get products for website list (insys admin) - only fields needed for table display
export const getProductsForWebsiteList = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .collect();
    
    return products.map(p => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      mainImage: p.mainImage,
      category: p.category,
      price: p.price,
      currentStock: p.currentStock || p.totalAvailable || 0,
      totalAvailable: p.totalAvailable || p.currentStock || 0,
      sizeDisplayType: p.sizeDisplayType || "alpha",
      isTopSeller: p.isTopSeller,
      isHidden: p.isHidden || false,
    }));
  },
});

// Toggle product visibility (hide / unhide) on the website
export const toggleHideProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, { productId }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const newHiddenState = !product.isHidden;
    await ctx.db.patch(productId, {
      isHidden: newHiddenState,
      updatedAt: nowIso(),
    });

    return { success: true, isHidden: newHiddenState };
  },
});

// OPTIMIZED: Get single product by ID for editing (full data)
export const getProductForEdit = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// OPTIMIZED: Get low stock products for alerts page - only needed fields
export const getLowStockProductsForAlerts = query({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, { threshold = 10 }) => {
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    return products
      .filter(p => {
        const stock = p.currentStock || p.totalAvailable || 0;
        return stock <= threshold;
      })
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        mainImage: p.mainImage,
        category: p.category,
        currentStock: p.currentStock || p.totalAvailable || 0,
        totalAvailable: p.totalAvailable || p.currentStock || 0,
        sizeStock: p.sizeStock,
        availableSizes: p.availableSizes,
      }));
  },
});

// OPTIMIZED: Get products for import page - minimal fields for selection
export const getProductsForImport = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .collect();
    
    return products.map(p => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      mainImage: p.mainImage,
      category: p.category,
      description: p.description,
      otherImages: p.otherImages,
      price: p.price,
      costPrice: p.costPrice,
      color: p.color,
      secondaryColor: p.secondaryColor,
      availableSizes: p.availableSizes,
      sizeStock: p.sizeStock,
      totalStock: p.currentStock || p.totalAvailable || 0,
    }));
  },
});

// Get comprehensive analytics with proper return format
export const getAdvancedAnalyticsFixed = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    period: v.optional(v.string()), // "day", "week", "month", "year"
  },
  handler: async (ctx, { startDate, endDate, period = "month" }) => {
    const now = Date.now();
    const defaultStartDate = startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;

    // Get all orders in date range
    const orders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
      .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
      .collect();

    // Get all products
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    // Get all users
    const users = await ctx.db.query("users").collect();

    // Calculate comprehensive metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.orderTotal, 0);
    const totalOrders = orders.length;
    const totalCustomers = users.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate conversion rate (simplified - orders/users)
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;
    
    // Calculate growth metrics
    const previousPeriodStart = defaultStartDate - (defaultEndDate - defaultStartDate);
    const previousOrders = await ctx.db.query("orders")
      .filter(q => q.gte(q.field("createdAt"), previousPeriodStart))
      .filter(q => q.lt(q.field("createdAt"), defaultStartDate))
      .collect();
    
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.orderTotal, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const orderGrowth = previousOrders.length > 0 ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      conversionRate,
      revenueGrowth,
      orderGrowth,
      period
    };
  },
});

// Get detailed reports with proper format
export const getDetailedReportsFixed = query({
  args: {
    reportType: v.string(), // "orders", "products", "comprehensive"
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const defaultStartDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = args.endDate || now;

    if (args.reportType === "orders") {
      let ordersQuery = ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
        .filter(q => q.lte(q.field("createdAt"), defaultEndDate));
      
      if (args.searchQuery) {
        ordersQuery = ordersQuery.filter(q => 
          q.eq(q.field("orderNumber"), args.searchQuery)
        );
      }
      
      const orders = await ordersQuery
        .order("desc")
        .collect();
      
      const startIndex = args.offset || 0;
      const endIndex = startIndex + (args.limit || 50);
      
      return {
        data: orders.slice(startIndex, endIndex),
        total: orders.length,
      };
    } else if (args.reportType === "products") {
      // Products report
      let productsQuery = ctx.db.query("products")
        .filter(q => q.neq(q.field("isDeleted"), true));
      
      if (args.category) {
        productsQuery = productsQuery.filter(q => q.eq(q.field("category"), args.category));
      }
      
      if (args.searchQuery) {
        productsQuery = productsQuery.filter(q => 
          q.or(
            q.eq(q.field("name"), args.searchQuery),
            q.eq(q.field("itemId"), args.searchQuery)
          )
        );
      }
      
      const products = await productsQuery.collect();
      
      const startIndex = args.offset || 0;
      const endIndex = startIndex + (args.limit || 50);
      
      return {
        data: products.slice(startIndex, endIndex),
        total: products.length,
      };
    } else {
      // Comprehensive report
      const orders = await ctx.db.query("orders")
        .filter(q => q.gte(q.field("createdAt"), defaultStartDate))
        .filter(q => q.lte(q.field("createdAt"), defaultEndDate))
        .collect();
      
      const products = await ctx.db.query("products")
        .filter(q => q.neq(q.field("isDeleted"), true))
        .collect();
      
      return {
        orders: {
          data: orders,
          total: orders.length,
        },
        products: {
          data: products,
          total: products.length,
        }
      };
    }
  },
});

// Simplified personalized products function
export const getPersonalizedProducts = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      if (!args.userId) {
        return [];
      }

      // Get user data
      const user = await ctx.db.get(args.userId);
      
      if (!user || !user.interests || user.interests.length === 0) {
        return [];
      }

      // Get all products (remove isDeleted filter)
      const allProducts = await ctx.db
        .query("products")
        .collect();

      // Simple matching - check if any product type matches any user interest
      const personalizedProducts = allProducts.filter(product => {
        if (!product.type || !Array.isArray(product.type)) {
          return false;
        }
        
        return product.type.some(productType => 
          user.interests.includes(productType)
        );
      });

      // Sort by creation date (newest first) and limit
      const sortedProducts = personalizedProducts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, args.limit || 6);
      
      return sortedProducts;
    } catch (error) {
      return [];
    }
  },
});


// Frontend search function optimized for navbar
export const searchProductsForNavbar = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { searchTerm, limit = 8 }) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      return [];
    }

    const products = await ctx.db
      .query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .filter(q => q.neq(q.field("isHidden"), true))
      .collect();

    const searchQuery = searchTerm.toLowerCase().trim();
    
    // Enhanced search with scoring
    const searchResults = products
      .map(product => {
        let score = 0;
        const name = product.name.toLowerCase();
        const category = (product.category || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        const itemId = product.itemId.toLowerCase();
        
        // Exact name match gets highest score
        if (name === searchQuery) score += 100;
        // Name starts with search term
        else if (name.startsWith(searchQuery)) score += 80;
        // Name contains search term
        else if (name.includes(searchQuery)) score += 60;
        
        // Category matches
        if (category.includes(searchQuery)) score += 40;
        
        // Description matches
        if (description.includes(searchQuery)) score += 20;
        
        // Item ID matches
        if (itemId.includes(searchQuery)) score += 30;
        
        return { ...product, searchScore: score };
      })
      .filter(product => product.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, limit);

    return searchResults.map(({ searchScore, ...product }) => product);
  },
});

// ============ ADMIN FUNCTIONS FOR INSYS ============

// Add product (for admin panel)
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
    isTopSeller: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check duplicate
    const existing = await ctx.db.query("products")
      .filter(q => q.eq(q.field("itemId"), args.itemId))
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
      currentStock: totalStock,
      totalAvailable: totalStock,
      inStock: totalStock > 0,
      isHidden: false,
      isDeleted: false,
      buys: 0,
      inCart: 0,
      isTopSeller: args.isTopSeller,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: args.itemId,
      productName: args.name,
      productImage: args.mainImage,
      type: "stock_in",
      quantity: totalStock,
      previousStock: 0,
      newStock: totalStock,
      reason: "Initial stock",
      sizeDetails: args.sizeStock,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    });

    return { success: true, id };
  },
});

// Update product full (for admin panel)
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
    isTopSeller: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...args }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    const totalStock = Object.values(args.sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    const oldStock = product.currentStock || product.totalAvailable || 0;

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
      currentStock: totalStock,
      totalAvailable: totalStock,
      inStock: totalStock > 0,
      isTopSeller: args.isTopSeller,
      updatedAt: new Date().toISOString(),
    });

    // Log stock change if any
    if (totalStock !== oldStock) {
      await ctx.db.insert("inventoryMovements", {
        productId: product.itemId,
        productName: args.name,
        productImage: args.mainImage,
        type: totalStock > oldStock ? "stock_in" : "stock_out",
        quantity: Math.abs(totalStock - oldStock),
        previousStock: oldStock,
        newStock: totalStock,
        reason: "Product update",
        sizeDetails: args.sizeStock,
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      });
    }

    return { success: true };
  },
});

// Get inventory movements
export const getInventoryMovements = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db.query("inventoryMovements").order("desc").take(limit);
  },
});

// Get trash items
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trash").order("desc").collect();
  },
});

// Get dead stock
export const getDeadStock = query({
  args: { daysOld: v.optional(v.number()) },
  handler: async (ctx, { daysOld = 30 }) => {
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return products
      .filter(p => {
        if (p.createdAt) {
          const createdDate = new Date(p.createdAt);
          return createdDate < cutoffDate && (p.buys || 0) === 0;
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
        totalStock: p.currentStock || p.totalAvailable || 0,
        mainImage: p.mainImage,
        createdAt: p.createdAt,
        stockValue: (p.costPrice || p.price || 0) * (p.currentStock || p.totalAvailable || 0),
      }))
      .sort((a, b) => b.stockValue - a.stockValue);
  },
});


// Restore product from trash by trash ID (for admin panel)
export const restoreFromTrashById = mutation({
  args: { trashId: v.id("trash") },
  handler: async (ctx, { trashId }) => {
    const trashItem = await ctx.db.get(trashId);
    if (!trashItem) throw new Error("Trash item not found");

    // Mark product as not deleted
    const productId = trashItem.originalId;
    const product = await ctx.db.get(productId);
    
    if (product) {
      await ctx.db.patch(productId, {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    // Remove from trash
    await ctx.db.delete(trashId);

    return { success: true };
  },
});


// Update stock by size (for admin panel alerts)
export const updateStockBySize = mutation({
  args: {
    id: v.id("products"),
    sizeStock: v.any(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, sizeStock, reason }) => {
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock || product.totalAvailable || 0;
    const newStock = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

    await ctx.db.patch(id, {
      sizeStock,
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: newStock > 0,
      updatedAt: new Date().toISOString(),
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage,
      type: newStock > oldStock ? "stock_in" : "stock_out",
      quantity: Math.abs(newStock - oldStock),
      previousStock: oldStock,
      newStock,
      reason: reason || "Stock update",
      sizeDetails: sizeStock,
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    });

    return { success: true, oldStock, newStock };
  },
});


// Get stats for admin dashboard (compatible with insys)
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .collect();

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
      const stock = p.currentStock || p.totalAvailable || 0;
      stats.totalStock += stock;
      stats.totalValue += stock * (p.price || 0);
      stats.totalCost += stock * (p.costPrice || 0);

      if (stock === 0) stats.outOfStock++;
      else if (stock <= 10) stats.lowStock++;
      else stats.inStock++;

      const cat = p.category || "Uncategorized";
      if (!stats.categories[cat]) stats.categories[cat] = { count: 0, stock: 0 };
      stats.categories[cat].count++;
      stats.categories[cat].stock += stock;
    });

    stats.potentialProfit = stats.totalValue - stats.totalCost;
    return stats;
  },
});


// ============ OPTIMIZED CARD-ONLY QUERIES ============
// These queries return ONLY the fields needed for product cards
// Fields: itemId, name, price, mainImage, category (+ _id for linking)

// Helper to map product to card-only fields
const toCardData = (p) => ({
  _id: p._id,
  itemId: p.itemId,
  name: p.name,
  price: p.price,
  mainImage: p.mainImage,
  category: p.category,
});

// Get products for cards (minimal data)
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

// Get products by category for cards (minimal data)
export const getProductsByCategoryForCards = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const categoryLower = args.category.toLowerCase();
    
    // Try exact match with index first
    const exactMatch = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(limit);
    
    if (exactMatch.length > 0) {
      return exactMatch.map(toCardData);
    }
    
    // Fallback: case-insensitive search
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(200);
    
    return products
      .filter(p => p.category?.toLowerCase() === categoryLower)
      .slice(0, limit)
      .map(toCardData);
  },
});

// Get top picks for cards (minimal data)
export const getTopPicksForCards = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true)
        )
      )
      .take(100);
    
    // Sort by buys (sales count)
    return products
      .sort((a, b) => (b.buys || 0) - (a.buys || 0))
      .slice(0, limit)
      .map(toCardData);
  },
});

// Get new arrivals for cards (minimal data)
export const getNewArrivalsForCards = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_createdAt")
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

// Get related products for cards (minimal data)
export const getRelatedProductsForCards = query({
  args: {
    productId: v.string(),
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 4;
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.and(
          q.neq(q.field("itemId"), args.productId),
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(limit);
    
    return products.map(toCardData);
  },
});

// Search products for cards (minimal data)
export const searchProductsForCards = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const searchTerm = args.query.toLowerCase().trim();
    
    if (!searchTerm) return [];
    
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(300);
    
    return products
      .filter(p => 
        p.name?.toLowerCase().includes(searchTerm) ||
        p.category?.toLowerCase().includes(searchTerm) ||
        p.itemId?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit)
      .map(toCardData);
  },
});

// Search products for shop (includes subcategories for filtering)
export const searchProductsForShop = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const searchTerm = args.query.toLowerCase().trim();
    
    if (!searchTerm) return [];
    
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(300);
    
    return products
      .filter(p => 
        p.name?.toLowerCase().includes(searchTerm) ||
        p.category?.toLowerCase().includes(searchTerm) ||
        p.itemId?.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit)
      .map(p => ({
        _id: p._id,
        itemId: p.itemId,
        name: p.name,
        price: p.price,
        mainImage: p.mainImage,
        category: p.category,
        subcategories: p.subcategories,
      }));
  },
});

// Get products by type for cards (sneakers, sports, etc.)
export const getProductsByTypeForCards = query({
  args: {
    type: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const typeLower = args.type.toLowerCase();
    
    const products = await ctx.db
      .query("products")
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(300);
    
    return products
      .filter(p => 
        p.category?.toLowerCase() === typeLower ||
        (p.type && Array.isArray(p.type) && p.type.some(t => t?.toLowerCase() === typeLower))
      )
      .slice(0, limit)
      .map(toCardData);
  },
});


// ============ SHOP PAGE OPTIMIZED QUERY ============
// Returns card fields + filter fields (subcategories, type)

export const getProductsForShop = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const categoryLower = args.category.toLowerCase();
    
    // Try exact match with index first
    let products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => 
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.neq(q.field("isHidden"), true),
          q.eq(q.field("inStock"), true)
        )
      )
      .take(limit);
    
    // Fallback: case-insensitive search
    if (products.length === 0) {
      const allProducts = await ctx.db
        .query("products")
        .filter((q) => 
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.neq(q.field("isHidden"), true),
            q.eq(q.field("inStock"), true)
          )
        )
        .take(200);
      
      products = allProducts.filter(p => 
        p.category?.toLowerCase() === categoryLower
      ).slice(0, limit);
    }
    
    // Return only needed fields for shop page
    return products.map(p => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      price: p.price,
      mainImage: p.mainImage,
      category: p.category,
      subcategories: p.subcategories,
      type: p.type,
    }));
  },
});

// Migration function to set mainCategory to footwear for all products
export const migrateMainCategoryToFootwear = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let webMigratedCount = 0;
    for (const product of products) {
      if (!product.mainCategory) {
        await ctx.db.patch(product._id, {
          mainCategory: "footwear"
        });
        webMigratedCount++;
      }
    }

    return {
      success: true,
      webMigratedCount,
      message: `Migrated ${webMigratedCount} online products to footwear`
    };
  },
});


