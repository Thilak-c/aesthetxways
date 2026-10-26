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

  // Phone OTPs table for phone-based authentication
  phoneOTPs: defineTable({
    phone: v.string(),
    otp: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
    used: v.boolean(),
  })
    .index("by_phone", ["phone"])
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
  })
    .index("by_deleted", ["isDeleted"])
    .index("by_itemId", ["itemId"])
    .index("by_category", ["category"])
    .index("by_inStock", ["inStock"])
    .index("by_category_inStock", ["category", "inStock"])
    .index("by_createdAt", ["createdAt"]),

  // ============ WEBSITE TRASH (web_trash) ============
  web_trash: defineTable({
    originalId: v.string(),
    itemId: v.string(),
    name: v.string(),
    productData: v.any(), // Complete product data
    deletedAt: v.string(),
    deletedBy: v.optional(v.string()),
  })
    .index("by_itemId", ["itemId"])
    .index("by_deleted", ["deletedAt"]),

  // ============ OFFLINE TRASH (off_trash) ============
  off_trash: defineTable({
    originalId: v.string(),
    itemId: v.string(),
    name: v.string(),
    productData: v.any(), // Complete product data
    deletedAt: v.string(),
    deletedBy: v.optional(v.string()),
  })
    .index("by_itemId", ["itemId"])
    .index("by_deleted", ["deletedAt"]),

  // ============ WEBSITE STORE PRODUCTS (web_products) ============
  web_products: defineTable({
    itemId: v.string(),
    name: v.string(),
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
    sizeStock: v.any(), // { "6": 5, "7": 10, ... }
    totalStock: v.number(),
    inStock: v.boolean(),
    isHidden: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_itemId", ["itemId"])
    .index("by_category", ["category"])
    .index("by_deleted", ["isDeleted"]),

  // ============ OFFLINE STORE PRODUCTS (off_products) ============
  off_products: defineTable({
    mainCategory: v.optional(v.string()),
    itemId: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    mainImage: v.string(),
    otherImages: v.optional(v.array(v.string())),
    price: v.float64(),
    costPrice: v.optional(v.float64()),
    color: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    availableSizes: v.array(v.string()),
    sizeStock: v.any(), // { "6": 5, "7": 10, ... }
    totalStock: v.number(),
    inStock: v.boolean(),
    isHidden: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_itemId", ["itemId"])
    .index("by_category", ["category"])
    .index("by_deleted", ["isDeleted"]),

  // ============ WEBSITE BILLS (web_bills) ============
  web_bills: defineTable({
    billNumber: v.string(),
    orderId: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.string(),
      price: v.float64(),
      quantity: v.number(),
    })),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    shippingAddress: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.float64()),
    shipping: v.optional(v.float64()),
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.string(),
    paymentStatus: v.string(), // pending, paid, failed
    orderStatus: v.string(), // pending, confirmed, shipped, delivered, cancelled
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_billNumber", ["billNumber"])
    .index("by_status", ["orderStatus"])
    .index("by_created", ["createdAt"]),

  // ============ OFFLINE BILLS (off_bills) ============
  off_bills: defineTable({
    billNumber: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      productImage: v.optional(v.string()),
      itemId: v.string(),
      size: v.string(),
      price: v.float64(),
      quantity: v.number(),
    })),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    subtotal: v.float64(),
    discount: v.optional(v.float64()),
    discountAmount: v.optional(v.float64()),
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.string(), // cash, card, upi
    createdAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_billNumber", ["billNumber"])
    .index("by_created", ["createdAt"]),

  // ============ WEBSITE INVENTORY MOVEMENTS (web_movements) ============
  web_movements: defineTable({
    productId: v.string(),
    productName: v.string(),
    type: v.string(), // stock_in, stock_out, sale, return, adjustment
    quantity: v.number(),
    previousStock: v.number(),
    newStock: v.number(),
    reason: v.optional(v.string()),
    sizeDetails: v.optional(v.any()),
    orderId: v.optional(v.string()),
    createdAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"]),

  // ============ OFFLINE INVENTORY MOVEMENTS (off_movements) ============
  off_movements: defineTable({
    productId: v.string(),
    productName: v.string(),
    type: v.string(), // stock_in, stock_out, sale, return, adjustment
    quantity: v.number(),
    previousStock: v.number(),
    newStock: v.number(),
    reason: v.optional(v.string()),
    sizeDetails: v.optional(v.any()),
    billNumber: v.optional(v.string()),
    createdAt: v.string(),
    createdBy: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"]),

  // Reviews table for product reviews
  reviews: defineTable({
    productId: v.string(), // itemId of the product
    userId: v.id("users"),
    userName: v.string(), // User's name for display
    rating: v.number(), // 1-5 rating
    title: v.string(), // Review title
    comment: v.string(), // Review comment
    size: v.optional(v.string()), // Size purchased
    recommend: v.boolean(), // Whether user recommends the product
    verified: v.boolean(), // Whether user actually purchased the product
    helpful: v.number(), // Number of helpful votes
    createdAt: v.string(),
    updatedAt: v.string(),
    // Soft delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_rating", ["rating"])
    .index("by_created", ["createdAt"])
    .index("by_deleted", ["isDeleted"]),

  // Cart table for storing user cart items
  cart: defineTable({
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    price: v.float64(),
    size: v.string(),
    quantity: v.number(),
    addedAt: v.string(),
    updatedAt: v.string(),
    isActive: v.boolean(), // For soft delete/archiving
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_product_size", ["userId", "productId", "size"])
    .index("by_active", ["isActive"]),

  // Wishlist table for storing user wishlist items
  wishlist: defineTable({
    userId: v.id("users"),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    price: v.float64(),
    category: v.optional(v.string()),
    addedAt: v.string(),
    isActive: v.boolean(), // For soft delete/archiving
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_product", ["userId", "productId"])
    .index("by_active", ["isActive"]),
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

  // Views table for tracking product views
  views: defineTable({
    productId: v.string(), // itemId of the product
    userId: v.optional(v.id("users")), // Optional - for anonymous views
    ipAddress: v.optional(v.string()), // For anonymous tracking
    userAgent: v.optional(v.string()), // Browser/device info
    referrer: v.optional(v.string()), // Where the user came from
    viewedAt: v.string(), // When the view occurred
    sessionId: v.optional(v.string()), // For grouping views in same session
    // View context
    viewType: v.optional(v.string()), // 'product_page', 'search_result', 'category_page', etc.
    searchQuery: v.optional(v.string()), // If viewed from search
    category: v.optional(v.string()), // Product category
    // Soft delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_viewed_at", ["viewedAt"])
    .index("by_product_viewed", ["productId", "viewedAt"])
    .index("by_view_type", ["viewType"])
    .index("by_category", ["category"])
    .index("by_deleted", ["isDeleted"]),
    dailyAccess: defineTable({
    userIdV: v.string(),
    date: v.string(),
  }),
   reports: defineTable({
    userId: v.string(),      // optional, can use visitorId
    message: v.string(),     // report text
    fileUrl: v.string(),     // optional uploaded file URL
    createdAt: v.number(),   // timestamp
  }),

  // Chat Sessions table for managing chat conversations
  chatSessions: defineTable({
    sessionId: v.string(), // Unique session identifier
    userId: v.optional(v.id("users")), // Linked user account (optional for anonymous)
    guestInfo: v.optional(v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    })),
    status: v.string(), // 'active', 'waiting', 'closed'
    priority: v.string(), // 'low', 'medium', 'high', 'urgent'
    category: v.optional(v.string()), // 'general', 'order', 'product', 'technical'
    assignedTo: v.optional(v.id("users")), // Admin user ID
    createdAt: v.string(),
    updatedAt: v.string(),
    lastMessageAt: v.string(),
    isActive: v.boolean(),
  })
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"])
    .index("by_created", ["createdAt"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_session_id", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_priority", ["priority"])
    .index("by_category", ["category"]),

  // Chat Messages table for storing individual messages
  chatMessages: defineTable({
    sessionId: v.string(), // Reference to chat session
    senderId: v.optional(v.id("users")), // User ID (null for anonymous)
    senderType: v.string(), // 'user', 'admin', 'system'
    senderName: v.string(), // Display name
    message: v.string(), // Message content
    messageType: v.string(), // 'text', 'image', 'file', 'system'
    isRead: v.boolean(),
    readAt: v.optional(v.string()),
    createdAt: v.string(),
    editedAt: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_created", ["sessionId", "createdAt"])
    .index("by_sender", ["senderId"])
    .index("by_sender_type", ["senderType"])
    .index("by_read_status", ["isRead"]),

  // Support Tickets table for tracking customer support requests
  supportTickets: defineTable({
    ticketNumber: v.string(), // Auto-generated ticket number
    sessionId: v.string(), // Reference to chat session
    userId: v.optional(v.id("users")),
    subject: v.string(),
    description: v.string(),
    status: v.string(), // 'open', 'in_progress', 'resolved', 'closed'
    priority: v.string(), // 'low', 'medium', 'high', 'urgent'
    category: v.string(),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
    resolvedAt: v.optional(v.string()),
    closedAt: v.optional(v.string()),
    resolutionNotes: v.optional(v.string()),
    customerSatisfaction: v.optional(v.number()), // 1-5 rating
  })
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"])
    .index("by_priority", ["priority"])
    .index("by_category", ["category"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),

  // Report Templates table for defining report structures
  reportTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(), // 'sales', 'orders', 'products', 'customers', 'inventory', 'marketing'
    type: v.string(), // 'summary', 'detailed', 'analytical'
    dataSource: v.string(), // Main table/collection to query
    fields: v.array(v.object({
      name: v.string(),
      label: v.string(),
      type: v.string(), // 'string', 'number', 'date', 'currency'
      aggregation: v.optional(v.string()), // 'sum', 'avg', 'count', 'min', 'max'
      format: v.optional(v.string()),
    })),
    filters: v.array(v.object({
      name: v.string(),
      label: v.string(),
      type: v.string(), // 'date', 'select', 'multiselect', 'text', 'number'
      options: v.optional(v.array(v.string())),
      required: v.boolean(),
      defaultValue: v.optional(v.any()),
    })),
    chartConfig: v.optional(v.object({
      type: v.string(), // 'bar', 'line', 'pie', 'table'
      xAxis: v.string(),
      yAxis: v.string(),
      groupBy: v.optional(v.string()),
    })),
    permissions: v.array(v.string()), // Roles that can access this template
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"]),

  // Report Instances table for generated reports
  reportInstances: defineTable({
    templateId: v.id("reportTemplates"),
    name: v.string(),
    parameters: v.object({
      filters: v.any(),
      dateRange: v.object({
        start: v.string(),
        end: v.string(),
      }),
      groupBy: v.optional(v.string()),
      sortBy: v.optional(v.string()),
      limit: v.optional(v.number()),
    }),
    status: v.string(), // 'pending', 'generating', 'completed', 'failed'
    data: v.optional(v.any()), // Generated report data
    metadata: v.object({
      recordCount: v.number(),
      generationTime: v.number(), // milliseconds
      dataSize: v.number(), // bytes
    }),
    generatedBy: v.id("users"),
    generatedAt: v.string(),
    expiresAt: v.optional(v.string()),
  })
    .index("by_template", ["templateId"])
    .index("by_generated_by", ["generatedBy"])
    .index("by_status", ["status"])
    .index("by_generated", ["generatedAt"]),

  // Scheduled Reports table for automated report generation
  scheduledReports: defineTable({
    templateId: v.id("reportTemplates"),
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.object({
      frequency: v.string(), // 'daily', 'weekly', 'monthly', 'custom'
      cronExpression: v.string(),
      timezone: v.string(),
    }),
    parameters: v.object({
      filters: v.any(),
      recipients: v.array(v.string()), // Email addresses
      formats: v.array(v.string()), // 'csv', 'pdf', 'json'
    }),
    isActive: v.boolean(),
    lastRun: v.optional(v.string()),
    nextRun: v.string(),
    runCount: v.number(),
    createdBy: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_template", ["templateId"])
    .index("by_active", ["isActive"])
    .index("by_next_run", ["nextRun"])
    .index("by_created_by", ["createdBy"]),

  // Report Exports table for tracking export files
  reportExports: defineTable({
    reportInstanceId: v.id("reportInstances"),
    format: v.string(), // 'csv', 'pdf', 'json'
    fileName: v.string(),
    fileSize: v.number(),
    downloadUrl: v.string(),
    status: v.string(), // 'generating', 'completed', 'failed', 'expired'
    generatedBy: v.id("users"),
    generatedAt: v.string(),
    expiresAt: v.string(),
    downloadCount: v.number(),
  })
    .index("by_report_instance", ["reportInstanceId"])
    .index("by_generated_by", ["generatedBy"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // Report Subscriptions table for user preferences
  reportSubscriptions: defineTable({
    userId: v.id("users"),
    scheduledReportId: v.id("scheduledReports"),
    isActive: v.boolean(),
    preferences: v.object({
      formats: v.array(v.string()),
      deliveryTime: v.optional(v.string()),
      includeCharts: v.boolean(),
    }),
    subscribedAt: v.string(),
    lastDelivery: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_scheduled_report", ["scheduledReportId"])
    .index("by_active", ["isActive"]),

  // Email Notifications table for tracking email sends
  emailNotifications: defineTable({
    type: v.string(), // 'order_notification', 'order_confirmation', 'shipping_update', etc.
    orderNumber: v.optional(v.string()),
    recipientEmail: v.string(),
    subject: v.string(),
    status: v.string(), // 'sent', 'failed', 'pending'
    error: v.optional(v.string()),
    sentAt: v.string(),
    metadata: v.optional(v.any()), // Additional data like order details, etc.
  })
    .index("by_order", ["orderNumber"])
    .index("by_recipient", ["recipientEmail"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_sent_at", ["sentAt"]),

  // Collections table for dynamic collections
  collections: defineTable({
    name: v.string(), // Display name (e.g., "New Arrivals")
    slug: v.string(), // URL-friendly name (e.g., "new-arrivals")
    description: v.optional(v.string()),
    type: v.string(), // 'automatic', 'manual'
    // For automatic collections
    rules: v.optional(v.object({
      filterType: v.string(), // 'date', 'sales', 'views', 'tag', 'custom'
      dateRange: v.optional(v.number()), // Days to look back
      minSales: v.optional(v.number()),
      minViews: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      sortBy: v.optional(v.string()), // 'createdAt', 'salesCount', 'views', 'price'
      sortOrder: v.optional(v.string()), // 'asc', 'desc'
      limit: v.optional(v.number()),
    })),
    // For manual collections
    productIds: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    displayOrder: v.number(), // For ordering in sidebar
    icon: v.optional(v.string()), // Icon name or emoji
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .index("by_display_order", ["displayOrder"])
    .index("by_type", ["type"]),

  // User Activity table for tracking all user actions
  userActivity: defineTable({
    // User identification
    userId: v.optional(v.id("users")), // Null for anonymous users
    sessionId: v.string(), // Unique session identifier
    
    // Activity details
    activityType: v.string(), // 'page_view', 'action', 'event'
    actionType: v.optional(v.string()), // Specific action like 'add_to_cart'
    
    // Page/location data
    page: v.string(), // Current page URL
    previousPage: v.optional(v.string()),
    
    // Action data
    actionData: v.optional(v.any()), // JSON data about the action
    
    // Session metadata
    deviceType: v.string(), // 'mobile', 'tablet', 'desktop'
    browser: v.string(),
    os: v.string(),
    screenResolution: v.optional(v.string()),
    
    // Location data (approximate)
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    postal: v.optional(v.string()), // Postal/PIN code
    ipAddress: v.optional(v.string()), // Hashed for privacy
    
    // Referrer data
    referrer: v.optional(v.string()),
    referrerDomain: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    
    // Timestamps
    timestamp: v.string(),
    duration: v.optional(v.number()), // Time spent on page (ms)
    
    // Privacy
    isAnonymized: v.boolean(),
    optedOut: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_activity_type", ["activityType"])
    .index("by_action_type", ["actionType"])
    .index("by_page", ["page"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  // Active Sessions table for tracking current user sessions
  activeSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.id("users")),
    
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
    tax: v.float64(),
    total: v.float64(),
    paymentMethod: v.string(), // 'cash', 'card', 'upi'
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

  // Banners table for homepage hero banner grid
  banners: defineTable({
    position: v.string(), // "left", "right_top", "right_bottom"
    imageUrl: v.string(),
    productLink: v.string(),
    updatedAt: v.string(),
  })
    .index("by_position", ["position"]),
});
