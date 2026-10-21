import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aesthetx-ways';
const dbName = process.env.MONGODB_DB || 'aesthetx-ways';

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Returns database instance
 */
export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

let indexesInitialized = false;

/**
 * Ensures collection indexes once at startup
 */
export async function initDb() {
  const db = await getDb();
  if (indexesInitialized) return db;

  try {
    await Promise.allSettled([
      db.collection('orders').createIndex({ orderId: 1 }, { unique: true }),
      db.collection('orders').createIndex({ 'customer.email': 1 }),
      db.collection('orders').createIndex({ 'customer.mobile': 1 }),
      db.collection('orders').createIndex({ createdAt: -1 }),
      db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
      db.collection('users').createIndex({ mobile: 1 }, { sparse: true }),
      db.collection('products').createIndex({ slug: 1 }, { unique: true }),
    ]);
    indexesInitialized = true;
    return db;
  } catch (error) {
    console.error('[MongoDB] Index creation warning:', error);
    return db;
  }
}

export default clientPromise;
