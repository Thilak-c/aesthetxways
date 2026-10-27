import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// Get all active billing products
export const getBillingProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("billingProducts")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .collect();

    return products.map((p) => ({
      _id: p._id,
      itemId: p.itemId,
      name: p.name,
      price: p.price,
      category: p.category || "Quick Billing",
      isBillingProduct: true,
      createdAt: p.createdAt,
    }));
  },
});

// Create a new billing product (asking Name and Price)
export const createBillingProduct = mutation({
  args: {
    name: v.string(),
    price: v.float64(),
    category: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, { name, price, category, createdBy }) => {
    if (!name.trim()) {
      throw new Error("Product name is required");
    }
    if (price < 0) {
      throw new Error("Price must be a positive number");
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const itemId = `BP-${randomNum}`;

    const productId = await ctx.db.insert("billingProducts", {
      itemId,
      name: name.trim(),
      price: Number(price),
      category: category || "Quick Billing",
      createdAt: nowIso(),
      createdBy: createdBy || "admin",
      isDeleted: false,
    });

    return { success: true, productId, itemId };
  },
});

// Update existing billing product
export const updateBillingProduct = mutation({
  args: {
    id: v.id("billingProducts"),
    name: v.string(),
    price: v.float64(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, price, category }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Billing product not found");

    await ctx.db.patch(id, {
      name: name.trim(),
      price: Number(price),
      category: category || existing.category || "Quick Billing",
      updatedAt: nowIso(),
    });

    return { success: true };
  },
});

// Delete billing product (soft delete)
export const deleteBillingProduct = mutation({
  args: {
    id: v.id("billingProducts"),
  },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Billing product not found");

    await ctx.db.patch(id, {
      isDeleted: true,
      updatedAt: nowIso(),
    });

    return { success: true };
  },
});
