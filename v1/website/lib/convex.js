import { ConvexHttpClient } from "convex/browser";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  process.env.CONVEX_SELF_HOSTED_URL ||
  'https://db.aesthetxways.com';

export const convexClient = new ConvexHttpClient(convexUrl);
