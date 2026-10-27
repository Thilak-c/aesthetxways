/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as banners from "../banners.js";
import type * as billingProducts from "../billingProducts.js";
import type * as coupons from "../coupons.js";
import type * as crons from "../crons.js";
import type * as inventory from "../inventory.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as reports from "../reports.js";
import type * as shiprocketConfig from "../shiprocketConfig.js";
import type * as siteSettings from "../siteSettings.js";
import type * as users from "../users.js";
import type * as webStore from "../webStore.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  backup: typeof backup;
  banners: typeof banners;
  billingProducts: typeof billingProducts;
  coupons: typeof coupons;
  crons: typeof crons;
  inventory: typeof inventory;
  orders: typeof orders;
  products: typeof products;
  reports: typeof reports;
  shiprocketConfig: typeof shiprocketConfig;
  siteSettings: typeof siteSettings;
  users: typeof users;
  webStore: typeof webStore;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
