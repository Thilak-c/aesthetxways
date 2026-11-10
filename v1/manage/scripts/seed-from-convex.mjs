import { MongoClient } from 'mongodb';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://db.aesthetxways.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aesthetx-ways';

const TABLES = [
  'products',
  'orders',
  'users',
  'sessions',
  'passwordResetOTPs',
  'reports',
  'siteSettings',
  'coupons',
  'banners',
  'shiprocketConfig',
  'subscribers',
  'billingProducts',
  'payments',
  'bills',
  'inventoryMovements',
  'customers',
  'suppliers',
  'purchaseOrders',
  'expenses',
  'dailyReports',
  'trash',
  'recentlyViewed',
  'cart',
  'wishlist'
];

async function seed() {
  console.log('--- SEEDING MONGODB FROM CONVEX (READ ONLY) ---');
  console.log(`Source Convex:  ${CONVEX_URL}`);
  console.log(`Target MongoDB: ${MONGODB_URI}`);

  const convex = new ConvexHttpClient(CONVEX_URL);
  const mongo = new MongoClient(MONGODB_URI);

  await mongo.connect();
  const db = mongo.db();

  let totalTablesSeeded = 0;
  let totalDocsSeeded = 0;

  for (const table of TABLES) {
    try {
      const records = await Promise.race([
        convex.query('backup:getTableData', { tableName: table }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);

      if (!records || !Array.isArray(records) || records.length === 0) {
        console.log(`Table [${table}]: 0 records (skipped)`);
        continue;
      }

      console.log(`Table [${table}]: Retrieved ${records.length} records from Convex`);
      const collection = db.collection(table);

      let docs = records.map((r) => ({ ...r, originalConvexId: r._id }));

      if (table === 'products') {
        docs = docs.map((doc, idx) => ({
          ...doc,
          slug: doc.slug || doc.itemId || `prod-${doc._id || idx}`,
          title: doc.name || doc.title,
        }));
      }

      if (table === 'orders') {
        docs = docs.map((doc, idx) => {
          const ordId = doc.orderNumber || doc.orderId || `ORD-${doc._id || idx}`;
          const customerName = doc.shippingDetails?.fullName || doc.paymentDetails?.paidBy || doc.customer?.name || 'Customer';
          const customerPhone = doc.shippingDetails?.phone || doc.customer?.mobile || '';
          const customerEmail = doc.shippingDetails?.email || doc.customer?.email || '';

          return {
            ...doc,
            orderId: ordId,
            orderNumber: ordId,
            fulfillmentStatus: doc.fulfillmentStatus || doc.status || 'pending',
            customer: {
              name: customerName,
              mobile: customerPhone,
              email: customerEmail,
              ...doc.customer
            },
            shippingAddress: {
              fullName: customerName,
              address: doc.shippingDetails?.address || '',
              city: doc.shippingDetails?.city || '',
              state: doc.shippingDetails?.state || '',
              pincode: doc.shippingDetails?.pincode || '',
              mobile: customerPhone,
              email: customerEmail,
              ...doc.shippingAddress
            },
            pricing: {
              finalTotal: doc.orderTotal || doc.paymentDetails?.amount || 0,
              grandTotal: doc.orderTotal || doc.paymentDetails?.amount || 0,
              subtotal: doc.orderTotal || 0,
              shippingFee: 0,
              ...doc.pricing
            },
            payment: {
              status: (doc.paymentDetails?.status === 'completed' || doc.paymentDetails?.status === 'paid')
                ? 'PAID'
                : (doc.paymentDetails?.paymentMethod === 'COD' ? 'COD' : 'PENDING'),
              method: doc.paymentDetails?.paymentMethod || 'PREPAID',
              amount: doc.paymentDetails?.amount || doc.orderTotal || 0,
              razorpayOrderId: doc.paymentDetails?.razorpayOrderId,
              razorpayPaymentId: doc.paymentDetails?.razorpayPaymentId,
              ...doc.payment
            },
            createdAt: doc.createdAt ? (typeof doc.createdAt === 'number' ? new Date(doc.createdAt) : new Date(doc.createdAt)) : new Date(doc._creationTime || Date.now())
          };
        });
      }

      await collection.deleteMany({});
      await collection.insertMany(docs);

      console.log(` -> Successfully seeded ${docs.length} records into collection '${table}'`);
      totalTablesSeeded++;
      totalDocsSeeded += docs.length;
    } catch (err) {
      console.warn(`Table [${table}]: query skipped or failed (${err.message})`);
    }
  }

  await mongo.close();
  console.log('\n--- SEED COMPLETE ---');
  console.log(`Seeded ${totalDocsSeeded} records across ${totalTablesSeeded} collections into MongoDB.`);
}

seed().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
