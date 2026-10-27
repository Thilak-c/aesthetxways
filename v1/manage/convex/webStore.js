import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

// OPTIMIZED: Added pagination and filters out deleted/hidden products
export const getAllProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("products")
      .filter(q => q.and(
        q.neq(q.field("isDeleted"), true),
        q.neq(q.field("isHidden"), true)
      ))
      .order("desc")
      .take(args.limit || 100);
  },
});

export const getProductByItemId = query({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const product = await ctx.db.query("products")
      .withIndex("by_itemId", q => q.eq("itemId", itemId))
      .first();

    if (!product || product.isDeleted || product.isHidden) {
      return null;
    }

    return product;
  },
});

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
