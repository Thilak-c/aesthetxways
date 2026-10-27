import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();



// Get inventory history/movements
export const getInventoryMovements = query({
  args: {
    productId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { productId, limit = 50 }) => {
    let query = ctx.db.query("inventoryMovements");
    
    if (productId) {
      query = query.filter((q) => q.eq(q.field("productId"), productId));
    }
    
    const movements = await query.order("desc").take(limit);
    return movements;
  },
});

// ============ INVENTORY MUTATIONS ============

// Update stock for a single product
export const updateStock = mutation({
  args: {
    productId: v.id("products"),
    newStock: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, newStock, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock ?? product.totalAvailable ?? 0;
    const change = newStock - oldStock;

    // Update product
    await ctx.db.patch(productId, {
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: newStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: change > 0 ? "stock_in" : "stock_out",
      quantity: Math.abs(change),
      previousStock: oldStock,
      newStock: newStock,
      reason: reason || "Manual adjustment",
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, oldStock, newStock, change };
  },
});

// Update size-specific stock
export const updateSizeStock = mutation({
  args: {
    productId: v.id("products"),
    sizeStock: v.any(),
    availableSizes: v.optional(v.array(v.string())),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, sizeStock, availableSizes, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    // Calculate total stock from sizes
    const totalStock = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    // Use provided availableSizes or derive from sizeStock
    const sizes = availableSizes || Object.keys(sizeStock);

    await ctx.db.patch(productId, {
      sizeStock,
      availableSizes: sizes,
      currentStock: totalStock,
      totalAvailable: totalStock,
      inStock: totalStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "size_update",
      quantity: totalStock,
      previousStock: product.currentStock ?? 0,
      newStock: totalStock,
      reason: "Size stock update",
      sizeDetails: sizeStock,
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, totalStock, availableSizes: sizes };
  },
});

// Bulk stock update
export const bulkUpdateStock = mutation({
  args: {
    updates: v.array(v.object({
      productId: v.id("products"),
      newStock: v.number(),
    })),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { updates, reason, updatedBy }) => {
    const results = [];

    for (const update of updates) {
      try {
        const product = await ctx.db.get(update.productId);
        if (!product) {
          results.push({ productId: update.productId, success: false, error: "Not found" });
          continue;
        }

        const oldStock = product.currentStock ?? 0;
        
        await ctx.db.patch(update.productId, {
          currentStock: update.newStock,
          totalAvailable: update.newStock,
          inStock: update.newStock > 0,
          updatedAt: nowIso(),
          updatedBy: updatedBy || "admin",
        });

        await ctx.db.insert("inventoryMovements", {
          productId: product.itemId,
          productName: product.name,
          type: update.newStock > oldStock ? "stock_in" : "stock_out",
          quantity: Math.abs(update.newStock - oldStock),
          previousStock: oldStock,
          newStock: update.newStock,
          reason: reason || "Bulk update",
          createdAt: nowIso(),
          createdBy: updatedBy || "admin",
        });

        results.push({ productId: update.productId, success: true });
      } catch (error) {
        results.push({ productId: update.productId, success: false, error: error.message });
      }
    }

    return results;
  },
});

// Add stock (restock)
export const addStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, quantity, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock ?? product.totalAvailable ?? 0;
    const newStock = oldStock + quantity;

    await ctx.db.patch(productId, {
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: true,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "stock_in",
      quantity,
      previousStock: oldStock,
      newStock,
      reason: reason || "Restock",
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, oldStock, newStock };
  },
});

// Remove stock
export const removeStock = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, quantity, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const oldStock = product.currentStock ?? product.totalAvailable ?? 0;
    const newStock = Math.max(0, oldStock - quantity);

    await ctx.db.patch(productId, {
      currentStock: newStock,
      totalAvailable: newStock,
      inStock: newStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "stock_out",
      quantity,
      previousStock: oldStock,
      newStock,
      reason: reason || "Stock removal",
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, oldStock, newStock };
  },
});

// Remove stock for a specific size
export const removeSizeStock = mutation({
  args: {
    productId: v.id("products"),
    size: v.string(),
    quantity: v.number(),
    reason: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { productId, size, quantity, reason, updatedBy }) => {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");

    const sizeStock = product.sizeStock || {};
    const oldSizeQty = sizeStock[size] ?? 0;
    const newSizeQty = Math.max(0, oldSizeQty - quantity);
    
    // Update size stock
    const newSizeStock = { ...sizeStock, [size]: newSizeQty };
    
    // Calculate new total stock
    const newTotalStock = Object.values(newSizeStock).reduce((sum, qty) => sum + (qty || 0), 0);
    const oldTotalStock = product.currentStock ?? product.totalAvailable ?? 0;

    await ctx.db.patch(productId, {
      sizeStock: newSizeStock,
      currentStock: newTotalStock,
      totalAvailable: newTotalStock,
      inStock: newTotalStock > 0,
      updatedAt: nowIso(),
      updatedBy: updatedBy || "admin",
    });

    // Log movement
    await ctx.db.insert("inventoryMovements", {
      productId: product.itemId,
      productName: product.name,
      productImage: product.mainImage || null,
      type: "stock_out",
      quantity,
      previousStock: oldTotalStock,
      newStock: newTotalStock,
      reason: reason || `Size ${size} stock removal`,
      sizeDetails: { size, oldQty: oldSizeQty, newQty: newSizeQty },
      createdAt: nowIso(),
      createdBy: updatedBy || "admin",
    });

    return { success: true, size, oldQty: oldSizeQty, newQty: newSizeQty };
  },
});

// ============ BILLING FUNCTIONS ============

// Create a new bill
export const createBill = mutation({
  args: {
    billNumber: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
    })),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.number()),
    discountAmount: v.optional(v.float64()),
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const billId = await ctx.db.insert("bills", {
      billNumber: args.billNumber,
      items: args.items,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      subtotal: args.subtotal,
      discount: args.discount || 0,
      discountAmount: args.discountAmount || 0,
      tax: args.tax,
      total: args.total,
      paymentMethod: args.paymentMethod || "cash",
      createdAt: nowIso(),
      createdBy: args.createdBy || "billing",
    });

    return { success: true, billId };
  },
});

export const createWebsitePOSBill = mutation({
  args: {
    billNumber: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
      sizeDisplayType: v.optional(v.string()),
    })),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.number()),
    discountAmount: v.optional(v.float64()),
    discountType: v.optional(v.string()),
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.string(),
    splitDetails: v.optional(v.object({
      cash: v.float64(),
      online: v.float64(),
    })),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const generatedBillNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const billNumber = args.billNumber || generatedBillNumber;

    // Deduct stock for each item from website "products" table
    for (const item of args.items) {
      let product = null;
      try {
        product = await ctx.db.get(ctx.db.normalizeId("products", item.productId));
      } catch (e) {
        // Invalid ID format or not found
      }
      
      if (!product) {
        product = await ctx.db.query("products")
          .withIndex("by_itemId", q => q.eq("itemId", item.itemId))
          .first();
      }

      if (product) {
        const sizeStock = { ...product.sizeStock };
        sizeStock[item.size] = Math.max(0, (sizeStock[item.size] || 0) - item.quantity);
        const newTotal = Object.values(sizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

        await ctx.db.patch(product._id, {
          sizeStock,
          currentStock: newTotal,
          totalAvailable: newTotal,
          inStock: newTotal > 0,
          updatedAt: nowIso(),
        });

        // Log movement in website "inventoryMovements"
        await ctx.db.insert("inventoryMovements", {
          productId: item.itemId,
          productName: item.productName,
          productImage: item.productImage || product.mainImage || null,
          type: "stock_out",
          quantity: item.quantity,
          previousStock: product.currentStock ?? product.totalAvailable ?? 0,
          newStock: newTotal,
          reason: `Sale (POS Walk-in) - ${billNumber}`,
          sizeDetails: sizeStock,
          createdAt: nowIso(),
          createdBy: args.createdBy || "billing",
        });
      }
    }

    // Insert bill record in website "bills" table
    const cleanItems = args.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage || undefined,
      itemId: item.itemId,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
    }));

    const billId = await ctx.db.insert("bills", {
      billNumber,
      items: cleanItems,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      subtotal: args.subtotal,
      discount: args.discount || 0,
      discountAmount: args.discountAmount || 0,
      discountType: args.discountType || (args.discountAmount > 0 ? "percentage" : undefined),
      tax: args.tax,
      total: args.total,
      paymentMethod: args.paymentMethod,
      splitDetails: args.splitDetails,
      createdAt: nowIso(),
      createdBy: args.createdBy,
    });

    return { success: true, billId, billNumber };
  },
});

// Get billing history
export const getBillingHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    const bills = await ctx.db
      .query("bills")
      .order("desc")
      .take(limit);

    return bills;
  },
});

// Get bill by bill number
export const getBillByNumber = query({
  args: {
    billNumber: v.string(),
  },
  handler: async (ctx, { billNumber }) => {
    const bill = await ctx.db
      .query("bills")
      .withIndex("by_bill_number", (q) => q.eq("billNumber", billNumber))
      .first();

    return bill;
  },
});




// Get website products optimized for POS billing
export const getWebsiteProductsForBilling = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db.query("products")
      .filter(q => q.neq(q.field("isDeleted"), true))
      .order("desc");
    const products = args.limit !== undefined ? await baseQuery.take(args.limit) : await baseQuery.collect();
    
    return products.map(p => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      mainImage: p.mainImage,
      price: p.price,
      availableSizes: p.availableSizes || [],
      sizeStock: p.sizeStock || {},
      sizeDisplayType: p.sizeDisplayType || "alpha",
    }));
  },
});

