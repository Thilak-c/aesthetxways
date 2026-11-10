import { MongoClient } from 'mongodb';

async function migrateOrderIds() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('aesthetx-ways');

  const orders = await db.collection('orders').find({}).toArray();
  console.log(`Found ${orders.length} orders in MongoDB. Converting IDs to 6-digit numbers...`);

  const used = new Set();
  const generateUnique6Digit = () => {
    while (true) {
      const num = Math.floor(100000 + Math.random() * 900000).toString();
      if (!used.has(num)) {
        used.add(num);
        return num;
      }
    }
  };

  const migrated = [];
  for (const ord of orders) {
    const newId = generateUnique6Digit();
    const oldId = ord.orderId || ord.orderNumber;

    await db.collection('orders').updateOne(
      { _id: ord._id },
      {
        $set: {
          orderId: newId,
          orderNumber: newId,
          legacyOrderId: oldId,
          updatedAt: new Date(),
        },
      }
    );

    migrated.push({ oldId, newId, customer: ord.customer?.name || 'Customer' });
  }

  console.log(`Successfully converted all ${migrated.length} orders to 6-digit IDs!`);
  console.log('Sample migrations (first 10):');
  console.table(migrated.slice(0, 10));

  await client.close();
}

migrateOrderIds().catch(console.error);

