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

