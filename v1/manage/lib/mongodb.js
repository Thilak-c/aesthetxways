import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aesthetx-ways?directConnection=true';
const dbName = process.env.MONGODB_DB || 'aesthetx-ways';

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoAdminClientPromise) {
    client = new MongoClient(uri);
    global._mongoAdminClientPromise = client.connect();
  }
  clientPromise = global._mongoAdminClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

let indexesInitialized = false;

export async function initDb() {
  const db = await getDb();
  if (!indexesInitialized) {
    try {
      Promise.all([
        db.collection('orders').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
        db.collection('products').createIndex({ slug: 1 }, { unique: true, sparse: true }),
        db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }),
        db.collection('bills').createIndex({ billNumber: 1 }, { unique: true, sparse: true }),
      ]).catch((err) => console.warn('[Admin MongoDB] Index creation warning:', err.message));
      indexesInitialized = true;
    } catch (err) {
      console.warn('[Admin MongoDB] Init error:', err.message);
    }
  }
  return db;
}

