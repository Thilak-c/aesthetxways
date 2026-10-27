import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to convert period string to ISO Date string
function getCutoffDate(period) {
  const now = new Date();
  if (period === "24h") {
    now.setHours(now.getHours() - 24);
  } else if (period === "7d") {
    now.setDate(now.getDate() - 7);
  } else {
    // default 30d
    now.setDate(now.getDate() - 30);
  }
  return now.toISOString();
}

// Record activity by incrementing pre-aggregated daily counters
export const recordActivity = mutation({
  args: {
    userId: v.optional(v.any()),
    sessionId: v.string(),
    activityType: v.string(),
    actionType: v.optional(v.string()),
    page: v.string(),
    previousPage: v.optional(v.string()),
    actionData: v.optional(v.any()),
    deviceType: v.string(),
    browser: v.string(),
    os: v.string(),
    screenResolution: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    postal: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    referrer: v.optional(v.string()),
    referrerDomain: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    timestamp: v.string(),
    duration: v.optional(v.number()),
    isAnonymized: v.boolean(),
    optedOut: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const date = args.timestamp.split("T")[0]; // YYYY-MM-DD format

    // Helper to increment daily counter
    const incrementCount = async (type, key, meta) => {
      const existing = await ctx.db
        .query("dailyAnalytics")
        .withIndex("by_type_date_key", (q) => q.eq("type", type).eq("date", date).eq("key", key))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { count: existing.count + 1 });
      } else {
        await ctx.db.insert("dailyAnalytics", { date, type, key, count: 1, meta });
      }
    };

    // 1. Session tracking (only increment session-scoped totals if this is the first time we see this session today)
    const seen = await ctx.db
      .query("sessionTracker")
      .withIndex("by_date_session", (q) => q.eq("date", date).eq("sessionId", args.sessionId))
      .first();

    if (!seen) {
      await ctx.db.insert("sessionTracker", { date, sessionId: args.sessionId });
      
      // Increment session aggregates
      await incrementCount("metric", "totalSessions");
      await incrementCount("metric", "uniqueUsers");
      await incrementCount("device", args.deviceType);
      await incrementCount("browser", args.browser);
      await incrementCount("os", args.os);
      await incrementCount("referrer", args.referrerDomain || "direct");
      await incrementCount("referrerFull", args.referrer || "direct");
      if (args.utmCampaign) {
        await incrementCount("campaign", `${args.utmSource || "source"} / ${args.utmCampaign}`);
      }
    }

    // 2. Increment view/action aggregates (always tracked)
    await incrementCount("metric", "totalViews");
    
    if (args.activityType === "page_view") {
      await incrementCount("page", args.page);
    }

    // Increment location views
    const locationKey = `${args.country || "Unknown"}/${args.city || "Unknown"}`;
    const locationMeta = (args.latitude && args.longitude) 
      ? { latitude: args.latitude, longitude: args.longitude } 
      : undefined;
    await incrementCount("location", locationKey, locationMeta);

    // Increment hourly view
    try {
      const hour = new Date(args.timestamp).getHours();
      await incrementCount("hourly", String(hour));
    } catch (_) {}

    // 3. Increment funnel stages
    if (args.activityType === "page_view") {
      if (args.page === "/" || args.page.startsWith("/?")) {
        await incrementCount("funnel", "homepage");
      } else if (args.page.includes("/product/")) {
        await incrementCount("funnel", "viewProduct");
      } else if (args.page.includes("/cart")) {
        await incrementCount("funnel", "cart");
      } else if (args.page.includes("/checkout")) {
        await incrementCount("funnel", "checkout");
      }
    } else if (args.activityType === "action") {
      if (args.actionType === "add_to_cart") {
        await incrementCount("funnel", "cart");
      } else if (args.actionType === "initiate_checkout") {
        await incrementCount("funnel", "checkout");
      } else if (args.actionType === "purchase_complete") {
        await incrementCount("funnel", "purchase");
      }
    }

    // 4. Update real-time Active Sessions table
    const existingSession = await ctx.db
      .query("activeSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    const isPageView = args.activityType === "page_view";
    
    if (existingSession) {
      const startTime = new Date(existingSession.sessionStart).getTime();
      const lastTime = new Date(args.timestamp).getTime();
      const updatedDuration = Math.max(0, lastTime - startTime);

      await ctx.db.patch(existingSession._id, {
        userId: args.userId || existingSession.userId,
        currentPage: args.page,
        lastActivity: args.timestamp,
        pageViews: existingSession.pageViews + (isPageView ? 1 : 0),
        actionsCount: existingSession.actionsCount + (isPageView ? 0 : 1),
        sessionDuration: updatedDuration,
        isActive: true,
        latitude: args.latitude || existingSession.latitude,
        longitude: args.longitude || existingSession.longitude,
        referrer: existingSession.referrer || args.referrer,
        referrerDomain: existingSession.referrerDomain || args.referrerDomain,
      });
    } else {
      await ctx.db.insert("activeSessions", {
        sessionId: args.sessionId,
        userId: args.userId,
        currentPage: args.page,
        lastActivity: args.timestamp,
        deviceType: args.deviceType,
        browser: args.browser,
        os: args.os,
        country: args.country,
        city: args.city,
        postal: args.postal,
        latitude: args.latitude,
        longitude: args.longitude,
        referrer: args.referrer,
        referrerDomain: args.referrerDomain,
        pageViews: isPageView ? 1 : 0,
        actionsCount: isPageView ? 0 : 1,
        sessionStart: args.timestamp,
        sessionDuration: 0,
        isActive: true,
      });
    }

    // 5. Auto-clean activeSessions table: delete sessions older than 2 hours to prevent memory bloat
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    const twoHoursAgoStr = twoHoursAgo.toISOString();
    
    const oldSessions = await ctx.db
      .query("activeSessions")
      .withIndex("by_last_activity")
      .filter((q) => q.lt(q.field("lastActivity"), twoHoursAgoStr))
      .collect();

    for (const oldSess of oldSessions) {
      await ctx.db.delete(oldSess._id);
    }

    return { success: true };
  },
});

// Update session heartbeat timestamp
export const heartbeatSession = mutation({
  args: {
    sessionId: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("activeSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      const startTime = new Date(session.sessionStart).getTime();
      const lastTime = new Date(args.timestamp).getTime();
      const updatedDuration = Math.max(0, lastTime - startTime);

      await ctx.db.patch(session._id, {
        lastActivity: args.timestamp,
        sessionDuration: updatedDuration,
        isActive: true,
      });
      return { success: true };
    }
    return { success: false };
  },
});

// Fetch analytics daily summary aggregation for admin dashboard
export const getAnalyticsSummary = query({
  args: {
    period: v.string(), // '24h', '7d', '30d'
  },
  handler: async (ctx, args) => {
    const cutoffStr = getCutoffDate(args.period);
    const cutoffDate = cutoffStr.split("T")[0];

    // 1. Get Live Stats (active sessions within past 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const fiveMinutesAgoStr = fiveMinutesAgo.toISOString();

    const liveSessions = await ctx.db
      .query("activeSessions")
      .withIndex("by_last_activity")
      .filter((q) => q.gte(q.field("lastActivity"), fiveMinutesAgoStr))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const liveCityCounts = {};
    liveSessions.forEach((s) => {
      const city = s.city || "Unknown";
      liveCityCounts[city] = (liveCityCounts[city] || 0) + 1;
    });

    const liveCities = Object.entries(liveCityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Fetch all activeSessions to calculate session duration retention curve
    const allSessions = await ctx.db
      .query("activeSessions")
      .collect();

    const totalSessionCount = allSessions.length;
    let retention = [];
    if (totalSessionCount > 0) {
      const intervals = [
        { label: "0m", ms: 0 },
        { label: "30s", ms: 30000 },
        { label: "1m", ms: 60000 },
        { label: "2m", ms: 120000 },
        { label: "3m", ms: 180000 },
        { label: "5m", ms: 300000 },
        { label: "10m", ms: 600000 },
        { label: "15m+", ms: 900000 },
      ];
      retention = intervals.map((interval) => {
        const matchingCount = allSessions.filter((s) => (s.sessionDuration || 0) >= interval.ms).length;
        const percentage = Math.round((matchingCount / totalSessionCount) * 100);
        return {
          duration: interval.label,
          users: matchingCount,
          percentage: percentage,
        };
      });
    } else {
      retention = [
        { duration: "0m", users: 0, percentage: 100 },
        { duration: "30s", users: 0, percentage: 0 },
        { duration: "1m", users: 0, percentage: 0 },
        { duration: "2m", users: 0, percentage: 0 },
        { duration: "3m", users: 0, percentage: 0 },
        { duration: "5m", users: 0, percentage: 0 },
        { duration: "10m", users: 0, percentage: 0 },
        { duration: "15m+", users: 0, percentage: 0 },
      ];
    }

    // 2. Fetch pre-aggregated daily records within requested period
    const dailyData = await ctx.db
      .query("dailyAnalytics")
      .filter((q) => q.gte(q.field("date"), cutoffDate))
      .collect();

    let totalViews = 0;
    let totalSessions = 0;
    let uniqueUsers = 0;

    const pageCounts = {};
    const countryCounts = {};
    const cityCounts = {};
    const deviceCounts = {};
    const browserCounts = {};
    const osCounts = {};
    const referrerCounts = {};
    const referrerFullCounts = {};
    const utmCampaignCounts = {};
    const locationCoords = {};
    const dailyViewsTrend = {};
    const hourlyCounts = {};
    for (let i = 0; i < 24; i++) {
      hourlyCounts[String(i)] = 0;
    }

    const funnel = {
      homepage: 0,
      viewProduct: 0,
      cart: 0,
      checkout: 0,
      purchase: 0,
    };

    dailyData.forEach((row) => {
      const c = row.count;

      if (row.type === "metric") {
        if (row.key === "totalViews") totalViews += c;
        if (row.key === "totalSessions") totalSessions += c;
        if (row.key === "uniqueUsers") uniqueUsers += c;
      } else if (row.type === "page") {
        pageCounts[row.key] = (pageCounts[row.key] || 0) + c;
        dailyViewsTrend[row.date] = (dailyViewsTrend[row.date] || 0) + c;
      } else if (row.type === "location") {
        const parts = row.key.split("/");
        const country = parts[0] || "Unknown";
        const city = parts[1] || "Unknown";

        countryCounts[country] = (countryCounts[country] || 0) + c;
        cityCounts[city] = (cityCounts[city] || 0) + c;

        if (row.meta && typeof row.meta.latitude === "number" && typeof row.meta.longitude === "number") {
          const latRound = Math.round(row.meta.latitude * 100) / 100;
          const lonRound = Math.round(row.meta.longitude * 100) / 100;
          const coordKey = `${latRound},${lonRound}`;
          if (!locationCoords[coordKey]) {
            locationCoords[coordKey] = {
              latitude: row.meta.latitude,
              longitude: row.meta.longitude,
              city,
              country,
              count: 0,
            };
          }
          locationCoords[coordKey].count += c;
        }
      } else if (row.type === "funnel") {
        if (funnel[row.key] !== undefined) {
          funnel[row.key] += c;
        }
      } else if (row.type === "device") {
        deviceCounts[row.key] = (deviceCounts[row.key] || 0) + c;
      } else if (row.type === "browser") {
        browserCounts[row.key] = (browserCounts[row.key] || 0) + c;
      } else if (row.type === "os") {
        osCounts[row.key] = (osCounts[row.key] || 0) + c;
      } else if (row.type === "referrer") {
        referrerCounts[row.key] = (referrerCounts[row.key] || 0) + c;
      } else if (row.type === "referrerFull") {
        referrerFullCounts[row.key] = (referrerFullCounts[row.key] || 0) + c;
      } else if (row.type === "campaign") {
        utmCampaignCounts[row.key] = (utmCampaignCounts[row.key] || 0) + c;
      } else if (row.type === "hourly") {
        hourlyCounts[row.key] = (hourlyCounts[row.key] || 0) + c;
      }
    });

    const sortAndLimit = (obj, limit = undefined) => {
      const arr = Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      return limit !== undefined ? arr.slice(0, limit) : arr;
    };

    return {
      liveVisitors: liveSessions.length,
      liveCities,
      metrics: {
        totalViews,
        totalSessions,
        uniqueUsers,
        conversionRate: totalSessions > 0 ? ((funnel.purchase / totalSessions) * 100).toFixed(1) : "0.0",
      },
      funnel,
      retention,
      breakdowns: {
        countries: sortAndLimit(countryCounts),
        cities: sortAndLimit(cityCounts),
        devices: sortAndLimit(deviceCounts),
        browsers: sortAndLimit(browserCounts),
        os: sortAndLimit(osCounts),
        referrers: sortAndLimit(referrerCounts),
        referrersFull: sortAndLimit(referrerFullCounts),
        campaigns: sortAndLimit(utmCampaignCounts),
        pages: sortAndLimit(pageCounts),
        locations: Object.values(locationCoords),
      },
      dailyViews: Object.entries(dailyViewsTrend)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      hourlyViews: Object.entries(hourlyCounts)
        .map(([hour, count]) => {
          const h = parseInt(hour, 10);
          const ampm = h >= 12 ? "PM" : "AM";
          const displayHour = h % 12 === 0 ? 12 : h % 12;
          return {
            hour: `${displayHour} ${ampm}`,
            hourNum: h,
            count
          };
        })
        .sort((a, b) => a.hourNum - b.hourNum),
    };
  },
});

// Seed mock pre-aggregated daily analytics data for testing
export const seedMockData = mutation({
  args: {
    totalUsers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const targetUsers = args.totalUsers ?? 60000;
    
    const CITIES = [
      { city: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
      { city: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
      { city: 'Patna', country: 'India', lat: 25.5941, lon: 85.1356 },
      { city: 'Bangalore', country: 'India', lat: 12.9716, lon: 77.5946 },
      { city: 'Pune', country: 'India', lat: 18.5204, lon: 73.8567 },
      { city: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639 },
      { city: 'Hyderabad', country: 'India', lat: 17.3850, lon: 78.4867 },
      { city: 'Chennai', country: 'India', lat: 13.0827, lon: 80.2707 },
      { city: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
      { city: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
      { city: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
      { city: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 }
    ];

    const DEVICES = ['desktop', 'mobile', 'tablet'];
    const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const OS = ['Windows', 'MacOS', 'iOS', 'Android'];
    const REFERRERS = ['direct', 'google.com', 'facebook.com', 'instagram.com'];

    // Delete existing records
    const dailyRecs = await ctx.db.query("dailyAnalytics").collect();
    for (const r of dailyRecs) await ctx.db.delete(r._id);
    const trackers = await ctx.db.query("sessionTracker").collect();
    for (const t of trackers) await ctx.db.delete(t._id);
    const sessions = await ctx.db.query("activeSessions").collect();
    for (const s of sessions) await ctx.db.delete(s._id);

    // In-memory aggregator
    // Structure: map[key_string] = { date, type, key, count, meta }
    const dailyAggMap = new Map();

    const addInMemoryCount = (date, type, key, count = 1, meta = undefined) => {
      const aggKey = `${date}:${type}:${key}`;
      const existing = dailyAggMap.get(aggKey);
      if (existing) {
        existing.count += count;
      } else {
        dailyAggMap.set(aggKey, { date, type, key, count, meta });
      }
    };

    // Distribute total users across 7 days
    const avgDailyUsers = Math.floor(targetUsers / 7);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dateObj = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      const date = dateObj.toISOString().split("T")[0];

      // Introduce a slight variance per day (+/- 15%)
      const dailyUsers = Math.floor(avgDailyUsers * (0.85 + Math.random() * 0.3));

      for (let u = 0; u < dailyUsers; u++) {
        const cityData = CITIES[Math.floor(Math.random() * CITIES.length)];
        const device = DEVICES[Math.random() < 0.6 ? 0 : Math.random() < 0.9 ? 1 : 2];
        const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
        const os = OS[Math.floor(Math.random() * OS.length)];
        const referrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];

        // Increment session metrics
        let referrerFull = "direct";
        if (referrer === "google.com") {
          referrerFull = "https://google.com/search?q=aesthetx+ways";
        } else if (referrer === "facebook.com") {
          referrerFull = "https://facebook.com/posts/clothing-brand-sale";
        } else if (referrer === "instagram.com") {
          referrerFull = "https://l.instagram.com/staticways-outfit";
        }

        addInMemoryCount(date, "metric", "totalSessions", 1);
        addInMemoryCount(date, "metric", "uniqueUsers", 1);
        addInMemoryCount(date, "device", device, 1);
        addInMemoryCount(date, "browser", browser, 1);
        addInMemoryCount(date, "os", os, 1);
        addInMemoryCount(date, "referrer", referrer, 1);
        addInMemoryCount(date, "referrerFull", referrerFull, 1);

        // Average 3.2 views per user session
        const sessionViews = 1 + Math.floor(Math.random() * 5);
        addInMemoryCount(date, "metric", "totalViews", sessionViews);

        for (let vCount = 0; vCount < sessionViews; vCount++) {
          const rand = Math.random();
          const page = rand < 0.4 ? "/" : rand < 0.8 ? `/product/AWT0${100 + Math.floor(Math.random() * 100)}` : "/cart";
          addInMemoryCount(date, "page", page, 1);
        }

        // Increment location
        const jitterLat = cityData.lat + (Math.random() - 0.5) * 0.12;
        const jitterLon = cityData.lon + (Math.random() - 0.5) * 0.12;
        addInMemoryCount(date, "location", `${cityData.country}/${cityData.city}`, 1, {
          latitude: jitterLat,
          longitude: jitterLon
        });

        // Funnel progression
        const randVal = Math.random();
        const maxStage = randVal < 0.05 ? 5 : randVal < 0.18 ? 4 : randVal < 0.38 ? 3 : randVal < 0.75 ? 2 : 1;

        addInMemoryCount(date, "funnel", "homepage", 1);
        if (maxStage >= 2) addInMemoryCount(date, "funnel", "viewProduct", 1);
        if (maxStage >= 3) addInMemoryCount(date, "funnel", "cart", 1);
        if (maxStage >= 4) addInMemoryCount(date, "funnel", "checkout", 1);
        if (maxStage >= 5) addInMemoryCount(date, "funnel", "purchase", 1);

        // Seed hourly metric
        const randHour = Math.random() < 0.75 
          ? 10 + Math.floor(Math.random() * 13) // Peak: 10 AM to 10 PM
          : Math.floor(Math.random() * 10);    // Off-peak
        addInMemoryCount(date, "hourly", String(randHour), 1);
      }
    }

    // Now write the daily aggregation totals to database
    let writtenCount = 0;
    for (const record of dailyAggMap.values()) {
      await ctx.db.insert("dailyAnalytics", record);
      writtenCount++;
    }

    // Insert 2,000 random mock active/offline sessions to populate real-time view lists without exceeding write limit
    // Some are active (lastActivity < 5 mins), some are offline/inactive (lastActivity > 5 mins)
    const now = new Date();
    for (let i = 0; i < 2000; i++) {
      const cityData = CITIES[Math.floor(Math.random() * CITIES.length)];
      const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
      const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
      const os = OS[Math.floor(Math.random() * OS.length)];
      
      const isActive = Math.random() < 0.4; // 40% active, 60% offline
      const minutesAgo = isActive ? Math.floor(Math.random() * 5) : 6 + Math.floor(Math.random() * 110);
      const lastActivityTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
      
      const rand = Math.random();
      const page = rand < 0.4 ? "/" : rand < 0.8 ? `/product/AWT0${100 + Math.floor(Math.random() * 100)}` : "/cart";

      const mockReferrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
      let mockReferrerFull = "direct";
      if (mockReferrer === "google.com") {
        mockReferrerFull = "https://google.com/search?q=aesthetx+ways";
      } else if (mockReferrer === "facebook.com") {
        mockReferrerFull = "https://facebook.com/posts/clothing-brand-sale";
      } else if (mockReferrer === "instagram.com") {
        mockReferrerFull = "https://l.instagram.com/staticways-outfit";
      }

      await ctx.db.insert("activeSessions", {
        sessionId: `sess_mock_${i}_${Math.random().toString(36).substring(2, 6)}`,
        currentPage: page,
        lastActivity: lastActivityTime.toISOString(),
        deviceType: device,
        browser,
        os,
        country: cityData.country,
        city: cityData.city,
        postal: `${100000 + Math.floor(Math.random() * 800000)}`,
        latitude: cityData.lat + (Math.random() - 0.5) * 0.1,
        longitude: cityData.lon + (Math.random() - 0.5) * 0.1,
        referrer: mockReferrerFull,
        referrerDomain: mockReferrer,
        pageViews: 1 + Math.floor(Math.random() * 8),
        actionsCount: Math.floor(Math.random() * 4),
        sessionStart: new Date(lastActivityTime.getTime() - (Math.random() * 20 * 60 * 1000)).toISOString(),
        sessionDuration: Math.floor(Math.random() * 15 * 60 * 1000),
        isActive,
      });
    }

    return { 
      success: true, 
      simulatedUsers: targetUsers, 
      dailyAnalyticsRecords: writtenCount, 
      activeSessionsCreated: 2000 
    };
  }
});

// Clear all aggregated analytics tables
export const clearAnalyticsData = mutation({
  args: {},
  handler: async (ctx) => {
    const daily = await ctx.db.query("dailyAnalytics").collect();
    for (const r of daily) await ctx.db.delete(r._id);
    const trackers = await ctx.db.query("sessionTracker").collect();
    for (const t of trackers) await ctx.db.delete(t._id);
    const sessions = await ctx.db.query("activeSessions").collect();
    for (const s of sessions) await ctx.db.delete(s._id);
    return { success: true, clearedActivities: daily.length, clearedSessions: sessions.length };
  }
});
