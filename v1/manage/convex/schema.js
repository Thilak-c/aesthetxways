// convex/schema.js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for email/password auth
  users: defineTable({
    email: v.optional(v.string()), // Made optional for phone-only auth
    passwordHash: v.optional(v.string()), // Made optional for phone-only auth
    name: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    // Role-based access control
    role: v.optional(
      v.union(v.literal("user"), v.literal("admin"), v.literal("super_admin"))
    ),
    isActive: v.optional(v.boolean()),
    // Temporary password storage (for super admin viewing - NOT secure for production!)
    tempPassword: v.optional(v.string()),
    tempPasswordSetAt: v.optional(v.string()),
    // Soft delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
    deletedBy: v.optional(v.id("users")),
    // Onboarding fields
    address: v.optional(
      v.object({
        flatNo: v.optional(v.string()),
        area: v.optional(v.string()),
        landmark: v.optional(v.string()),
        state: v.string(),
        city: v.string(),
        pinCode: v.string(),
        fullAddress: v.string(),
      })
    ),
    photoUrl: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingStep: v.optional(v.number()),
    interests: v.optional(v.array(v.string())),
    selectedSizes: v.optional(v.array(v.string())), // Array of user's preferred sizes
    // Phone fields
    phoneNumber: v.optional(v.string()),
    secondaryPhoneNumber: v.optional(v.string()), // Secondary phone number
    phoneNumberLocked: v.optional(v.boolean()),
    // Permanent address fields (immutable once set) - for backward compatibility
    permanentAddress: v.optional(
      v.object({
        flatNo: v.optional(v.string()),
        area: v.optional(v.string()),
        landmark: v.optional(v.string()),
        state: v.string(),
        city: v.string(),
        pinCode: v.string(),
        fullAddress: v.string(),
      })
    ),
    permanentAddressLocked: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_deleted", ["isDeleted"])
    .index("by_phone", ["phoneNumber"])
    .searchIndex("search_users", {
      searchField: "email",
      filterFields: ["isDeleted"],
    }),

  // Sessions table storing opaque session tokens
  sessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
  })
    .index("by_token", ["sessionToken"])
    .index("by_userId", ["userId"]),

  // Password Reset OTPs table
  passwordResetOTPs: defineTable({
    email: v.string(),
    otp: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
    used: v.boolean(),
    verified: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_otp", ["otp"]),


  // Trash table for storing deleted items that can be restored
  trash: defineTable({
    originalId: v.id("users"), // Original record ID
    tableName: v.string(), // Which table the item came from
    originalData: v.any(), // Complete original record data
    deletedAt: v.string(),
    deletedBy: v.id("users"), // Who deleted it
    deletionReason: v.optional(v.string()),
    canRestore: v.optional(v.boolean()), // Whether item can be restored
    updatedAt: v.optional(v.string()), // Changed from v.number() to v.string()
    updatedBy: v.optional(v.string()),
  })
    .index("by_table", ["tableName"])
    .index("by_deleted_by", ["deletedBy"])
    .index("by_deleted_at", ["deletedAt"]),


  // Existing products table (for main website - customer facing)
  // OPTIMIZED: Added indexes for category, itemId, inStock for faster queries
  products: defineTable({
    mainCategory: v.optional(v.string()),
    buys: v.optional(v.float64()),
    inCart: v.optional(v.float64()),
    isHidden: v.optional(v.boolean()),
    category: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.string(),
    otherImages: v.optional(v.array(v.string())),
    itemId: v.string(),
    name: v.string(),
    price: v.float64(),
    costPrice: v.optional(v.float64()),
    listedPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    subcategories: v.optional(v.string()),
    type: v.optional(v.array(v.string())),
    availableSizes: v.optional(v.array(v.string())),
    sizeStock: v.optional(v.any()),
    websiteSizeStock: v.optional(v.any()),
    websiteStock: v.optional(v.number()),
    websiteInStock: v.optional(v.boolean()),
    inStock: v.optional(v.boolean()),
    totalAvailable: v.optional(v.number()),
    currentStock: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
    deletedBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
    sizeDisplayType: v.optional(v.string()),
    isTopSeller: v.optional(v.boolean()),
  })
    .index("by_deleted", ["isDeleted"])
    .index("by_itemId", ["itemId"])
    .index("by_category", ["category"])
    .index("by_inStock", ["inStock"])
    .index("by_category_inStock", ["category", "inStock"])
    .index("by_createdAt", ["createdAt"]),









  
  // OPTIMIZED: Added createdAt index for time-based queries
  orders: defineTable({
    userId: v.any(),
    orderNumber: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        price: v.float64(),
        image: v.string(),
        quantity: v.float64(),
        size: v.string(),
      })
    ),
    shippingDetails: v.object({
      fullName: v.string(),
      email: v.string(),
      phone: v.string(),
      flatNo: v.optional(v.string()),
      area: v.optional(v.string()),
      landmark: v.optional(v.string()),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
      country: v.string(),
    }),
    paymentDetails: v.object({
      razorpayOrderId: v.optional(v.string()),
      razorpayPaymentId: v.optional(v.string()),
      amount: v.float64(),
      currency: v.string(),
      status: v.string(), // 'pending', 'completed', 'failed'
      paidAt: v.optional(v.number()), // Payment timestamp
      paidBy: v.optional(v.string()), // Payment method or payer name
      paymentMethod: v.optional(v.string()), // 'upi', 'card', 'netbanking', 'wallet', 'cod'
      codCharge: v.optional(v.float64()),
      remainingCOD: v.optional(v.float64()),
    }),
    orderTotal: v.float64(),
    status: v.string(), // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    // Delivery tracking
    estimatedDeliveryDate: v.optional(v.number()), // Estimated delivery timestamp
    deliveryDetails: v.optional(
      v.array(
        v.object({
          status: v.string(), // 'order_placed', 'processing', 'shipped', 'out_for_delivery', 'delivered'
          message: v.string(), // Status message
          location: v.optional(v.string()), // Current location
          timestamp: v.number(), // When this status was updated
          updatedBy: v.optional(v.string()), // Who updated this status
        })
      )
    ),
    // Shiprocket integration
    shiprocketDetails: v.optional(
      v.object({
        shiprocketOrderId: v.optional(v.number()),
        shipmentId: v.optional(v.number()),
        awbCode: v.optional(v.string()),
        courierCompanyId: v.optional(v.number()),
        courierName: v.optional(v.string()),
        trackingUrl: v.optional(v.string()),
        createdAt: v.optional(v.number()),
        status: v.optional(v.string()), // Shiprocket order status
        error: v.optional(v.string()), // Error message if creation failed
      })
    ),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_order_number", ["orderNumber"])
    .index("by_status", ["status"])
    .index("by_estimated_delivery", ["estimatedDeliveryDate"])
    .index("by_createdAt", ["createdAt"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  // Add this table definition to your schema
  recentlyViewed: defineTable({
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    productPrice: v.number(),
    productCategory: v.string(),
    viewedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_viewed", ["userId", "viewedAt"])
    .index("by_product", ["productId"]),

  
   reports: defineTable({
    userId: v.string(),      // optional, can use visitorId
    message: v.string(),     // report text
    fileUrl: v.string(),     // optional uploaded file URL
    createdAt: v.number(),   // timestamp
  }),

  

  // Pre-aggregated daily analytics counters to handle scalability
  dailyAnalytics: defineTable({
    date: v.string(), // "YYYY-MM-DD"
    type: v.string(), // "metric", "page", "location", "funnel", "device", "browser", "os", "referrer", "campaign"
    key: v.string(), // e.g. "totalViews", "/product/AWT0293", "India/Patna", "add_to_cart", "desktop"
    count: v.number(),
    meta: v.optional(v.any()), // e.g. { latitude, longitude } for location
  })
    .index("by_date", ["date"])
    .index("by_type_date", ["type", "date"])
    .index("by_type_date_key", ["type", "date", "key"]),

  // Daily unique session registry to count totalSessions and uniqueUsers
  sessionTracker: defineTable({
    date: v.string(),
    sessionId: v.string(),
  })
    .index("by_date_session", ["date", "sessionId"]),
 
  // Active Sessions table for tracking current user sessions
  activeSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.any()),
    
    // Current state
    currentPage: v.string(),
    lastActivity: v.string(), // ISO timestamp
    
    // Session metadata
    deviceType: v.string(),
    browser: v.string(),
    os: v.string(),
    
    // Location
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    postal: v.optional(v.string()), // Postal/PIN code
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    
    // Acquisition / Referral Info
    referrer: v.optional(v.string()),
    referrerDomain: v.optional(v.string()),
    
    // Session stats
    pageViews: v.number(),
    actionsCount: v.number(),
    sessionStart: v.string(),
    sessionDuration: v.number(), // milliseconds
    
    // Status
    isActive: v.boolean(), // Active if last activity < 5 minutes ago
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"])
    .index("by_last_activity", ["lastActivity"]),

  // Bills table for storing billing history
  bills: defineTable({
    billNumber: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()), // Size of the product
      price: v.float64(),
      quantity: v.number(),
    })),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.number()), // Discount percentage (0, 5, 10)
    discountAmount: v.optional(v.float64()), // Discount amount in rupees
    discountType: v.optional(v.string()), // 'flat' | 'percentage'
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.string(), // 'cash', 'card', 'upi', 'split'
    splitDetails: v.optional(v.object({
      cash: v.float64(),
      online: v.float64(),
    })),
    createdAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_bill_number", ["billNumber"])
    .index("by_created", ["createdAt"])
    .index("by_created_by", ["createdBy"]),

  // Inventory Movements table for tracking stock changes
  inventoryMovements: defineTable({
    productId: v.string(), // itemId of the product
    productName: v.string(),
    productImage: v.optional(v.string()), // Product image URL
    type: v.string(), // 'stock_in', 'stock_out', 'adjustment', 'size_update', 'sale', 'return'
    quantity: v.number(),
    previousStock: v.number(),
    newStock: v.number(),
    reason: v.optional(v.string()),
    sizeDetails: v.optional(v.any()), // For size-specific updates
    orderId: v.optional(v.string()), // Reference to order if sale/return
    createdAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"])
    .index("by_created_by", ["createdBy"]),

  // Returns/Exchanges table
  returns: defineTable({
    returnNumber: v.string(),
    originalBillNumber: v.string(),
    type: v.string(), // 'return', 'exchange'
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
    })),
    exchangeItems: v.optional(v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.optional(v.string()),
      price: v.float64(),
      quantity: v.number(),
    }))),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    reason: v.string(),
    refundAmount: v.float64(),
    additionalPayment: v.optional(v.float64()), // For exchange with price difference
    status: v.string(), // 'pending', 'approved', 'completed', 'rejected'
    createdAt: v.string(),
    processedAt: v.optional(v.string()),
    createdBy: v.string(),
    processedBy: v.optional(v.string()),
  })
    .index("by_return_number", ["returnNumber"])
    .index("by_bill_number", ["originalBillNumber"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Customers table
  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    totalPurchases: v.number(),
    totalSpent: v.float64(),
    lastVisit: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_phone", ["phone"])
    .index("by_name", ["name"])
    .index("by_total_spent", ["totalSpent"]),

  // Suppliers table
  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  // Purchase Orders table
  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    items: v.array(v.object({
      productId: v.optional(v.string()),
      productName: v.string(),
      itemId: v.optional(v.string()),
      size: v.optional(v.string()),
      quantity: v.number(),
      unitCost: v.float64(),
      totalCost: v.float64(),
    })),
    subtotal: v.float64(),
    tax: v.optional(v.float64()),
    shipping: v.optional(v.float64()),
    total: v.float64(),
    status: v.string(), // 'draft', 'sent', 'confirmed', 'received', 'cancelled'
    expectedDelivery: v.optional(v.string()),
    receivedAt: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_po_number", ["poNumber"])
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Expenses table
  expenses: defineTable({
    category: v.string(), // 'rent', 'utilities', 'salary', 'supplies', 'marketing', 'other'
    description: v.string(),
    amount: v.float64(),
    paymentMethod: v.string(),
    vendor: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    date: v.string(),
    isRecurring: v.boolean(),
    recurringFrequency: v.optional(v.string()), // 'monthly', 'quarterly', 'yearly'
    notes: v.optional(v.string()),
    createdAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_date", ["date"])
    .index("by_created", ["createdAt"]),

  // Daily Reports table
  dailyReports: defineTable({
    date: v.string(),
    totalSales: v.float64(),
    totalTransactions: v.number(),
    cashSales: v.float64(),
    cardSales: v.float64(),
    upiSales: v.float64(),
    totalReturns: v.float64(),
    returnCount: v.number(),
    totalExpenses: v.float64(),
    netRevenue: v.float64(),
    topSellingProducts: v.optional(v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.number(),
      revenue: v.float64(),
    }))),
    openingCash: v.optional(v.float64()),
    closingCash: v.optional(v.float64()),
    cashDifference: v.optional(v.float64()),
    notes: v.optional(v.string()),
    closedBy: v.optional(v.string()),
    closedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_date", ["date"]),

  // Coupons table for discount codes
  coupons: defineTable({
    code: v.string(), // Coupon code (e.g., "FIRST100", "SAVE200")
    description: v.string(), // Description of the coupon
    discountType: v.string(), // "flat" or "percentage"
    discountValue: v.number(), // Amount or percentage
    minOrderValue: v.number(), // Minimum order value required
    maxDiscount: v.optional(v.number()), // Maximum discount for percentage coupons
    usageLimit: v.optional(v.number()), // Total usage limit (null = unlimited)
    usageCount: v.number(), // Current usage count
    perUserLimit: v.optional(v.number()), // Per user usage limit
    validFrom: v.string(), // Start date
    validUntil: v.string(), // End date
    isActive: v.boolean(), // Active status
    applicableCategories: v.optional(v.array(v.string())), // Specific categories
    excludedCategories: v.optional(v.array(v.string())), // Excluded categories
    applicableProducts: v.optional(v.array(v.string())), // Specific products
    paymentMethods: v.optional(v.array(v.string())), // Allowed payment methods
    createdBy: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_valid_until", ["validUntil"])
    .index("by_created", ["createdAt"])
    .index("by_deleted", ["isDeleted"]),

  // Coupon Usage table for tracking coupon usage
  couponUsage: defineTable({
    couponId: v.id("coupons"),
    couponCode: v.string(),
    userId: v.optional(v.id("users")),
    orderNumber: v.string(),
    discountAmount: v.number(),
    orderTotal: v.number(),
    usedAt: v.string(),
  })
    .index("by_coupon", ["couponId"])
    .index("by_user", ["userId"])
    .index("by_order", ["orderNumber"])
    .index("by_used_at", ["usedAt"])
    .index("by_user_coupon", ["userId", "couponId"]),

  subscribers: defineTable({
    email: v.string(),
    subscribedAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_subscribed_at", ["subscribedAt"]),

  // Shiprocket packaging configuration
  shiprocketConfig: defineTable({
    length: v.number(),
    breadth: v.number(),
    height: v.number(),
    weight: v.number(),
    updatedAt: v.number(),
  }),

  // Site Settings table for controlling site status (open/closed/maintenance)
  siteSettings: defineTable({
    key: v.string(), // e.g. "siteStatus"
    value: v.string(), // "open", "closed", "maintenance"
    message: v.optional(v.string()), // Custom message to display
    updatedAt: v.string(),
  })
    .index("by_key", ["key"]),

  // Banners table for homepage hero banner grid
  banners: defineTable({
    position: v.string(), // "left", "right_top", "right_bottom"
    imageUrl: v.string(),
    productLink: v.string(),
    updatedAt: v.string(),
  })
    .index("by_position", ["position"]),

  // Payments table for tracking customer online & cash payments
  payments: defineTable({
    orderId: v.optional(v.id("orders")),
    orderNumber: v.string(),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    amount: v.float64(),
    currency: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.string(), // "completed", "pending", "failed", "refunded"
    razorpayOrderId: v.optional(v.string()),
    razorpayPaymentId: v.optional(v.string()),
    paymentAddress: v.string(), // customer delivery address
    products: v.array(v.object({
      productId: v.string(),
      name: v.string(),
      price: v.float64(),
      quantity: v.number(),
      size: v.string(),
    })),
    createdAt: v.string(), // ISO format
  })
    .index("by_order", ["orderNumber"])
    .index("by_razorpay", ["razorpayPaymentId"])
    .index("by_created", ["createdAt"]),

  // Billing Products table for quick billing-only items
  billingProducts: defineTable({
    itemId: v.string(),
    name: v.string(),
    price: v.float64(),
    category: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
    createdAt: v.string(),
    createdBy: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_deleted", ["isDeleted"])
    .index("by_createdAt", ["createdAt"]),
});
