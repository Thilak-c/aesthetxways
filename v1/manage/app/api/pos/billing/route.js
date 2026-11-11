import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb, initDb } from '@/lib/mongodb';
import { sendPOSBillConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function toMongoId(id) {
  if (!id) return null;
  if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      return new ObjectId(id);
    } catch {}
  }
  return id;
}

// GET /api/pos/billing -> Returns websiteProducts, quickProducts, and recent billsHistory
export async function GET(request) {
  try {
    const db = await initDb();
    const { searchParams } = new URL(request.url);
    const limitHistory = Number(searchParams.get('limitHistory')) || 100;

    const [productsRaw, quickProductsRaw, billsHistoryRaw] = await Promise.all([
      db.collection('products')
        .find({ isDeleted: { $ne: true } })
        .project({
          _id: 1,
          itemId: 1,
          slug: 1,
          name: 1,
          title: 1,
          mainImage: 1,
          image: 1,
          price: 1,
          priceNumber: 1,
          availableSizes: 1,
          sizeStock: 1,
          sizeDisplayType: 1,
          currentStock: 1,
          totalAvailable: 1,
        })
        .toArray(),
      db.collection('billingProducts')
        .find({ isDeleted: { $ne: true } })
        .sort({ _id: -1 })
        .toArray(),
      db.collection('bills')
        .find({})
        .sort({ createdAt: -1, _id: -1 })
        .limit(limitHistory)
        .toArray(),
    ]);

    const websiteProducts = productsRaw.map((p) => {
      const priceNum = typeof p.priceNumber === 'number'
        ? p.priceNumber
        : (typeof p.price === 'number'
          ? p.price
          : Number(String(p.price || 0).replace(/[^\d.]/g, ''))) || 0;

      return {
        _id: String(p._id),
        itemId: p.itemId || p.slug || String(p._id),
        name: p.name || p.title || 'Product',
        mainImage: p.mainImage || p.image || '',
        price: priceNum,
        availableSizes: Array.isArray(p.availableSizes) ? p.availableSizes : [],
        sizeStock: p.sizeStock && typeof p.sizeStock === 'object' ? p.sizeStock : {},
        sizeDisplayType: p.sizeDisplayType || 'alpha',
      };
    });

    const quickProducts = quickProductsRaw.map((p) => ({
      _id: String(p._id),
      itemId: p.itemId || `BP-${String(p._id).slice(-4)}`,
      name: p.name || 'Quick Item',
      price: Number(p.price) || 0,
      category: p.category || 'Quick Billing',
      isBillingProduct: true,
      createdAt: p.createdAt,
    }));

    const billsHistory = billsHistoryRaw.map((b) => ({
      ...b,
      _id: String(b._id),
      isEdited: Boolean(b.isEdited || b.updatedAt),
      pdfUrl: b.pdfUrl || `/api/pos/bills/${b.billNumber}/pdf`,
      invoiceUrl: b.invoiceUrl || b.pdfUrl || `/api/pos/bills/${b.billNumber}/pdf`,
    }));

    return NextResponse.json({
      success: true,
      websiteProducts,
      quickProducts,
      billsHistory,
    });
  } catch (err) {
    console.error('[API /api/pos/billing GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/pos/billing -> Creates bill in MongoDB and updates stock
export async function POST(request) {
  try {
    const db = await initDb();
    const body = await request.json();

    const {
      billNumber: inputBillNumber,
      items = [],
      customerName = '',
      customerPhone = '',
      customerEmail = '',
      subtotal = 0,
      discount = 0,
      discountAmount = 0,
      discountType = 'flat',
      tax = 0,
      roundOff = 0,
      total = 0,
      paymentMethod = 'cash',
      splitDetails,
      createdBy = 'POS Cashier',
    } = body;

    // Ensure guaranteed unique bill number (never collision or duplicate)
    let billNumber = inputBillNumber ? String(inputBillNumber).trim() : '';
    if (billNumber) {
      const existing = await db.collection('bills').findOne({ billNumber });
      if (existing) {
        billNumber = '';
      }
    }

    if (!billNumber) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const candidate = String(Math.floor(100000 + Math.random() * 900000));
        const found = await db.collection('bills').findOne({ billNumber: candidate });
        if (!found) {
          billNumber = candidate;
          break;
        }
      }
      if (!billNumber) {
        billNumber = String(Date.now()).slice(-6);
      }
    }
    const nowIso = new Date().toISOString();

    // 1. Clean item list
    const cleanItems = items.map((item) => ({
      productId: String(item.productId || item.itemId || item.id || ''),
      productName: item.productName || item.name || '',
      productImage: item.productImage || item.image || item.mainImage || undefined,
      itemId: String(item.itemId || item.productId || ''),
      size: item.size || 'Standard',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      sizeDisplayType: item.sizeDisplayType || 'letter',
    }));

    // 2. Deduct inventory in MongoDB "products" collection & log movements
    for (const item of cleanItems) {
      if (!item.productId && !item.itemId) continue;

      const idCandidates = [
        toMongoId(item.productId),
        item.productId,
      ].filter(Boolean);

      const query = {
        $or: [
          { _id: { $in: idCandidates } },
          { itemId: item.itemId },
          { slug: item.itemId },
          { itemId: item.productId },
        ],
      };

      const product = await db.collection('products').findOne(query);

      if (product) {
        const sizeStock = { ...(product.sizeStock || {}) };
        const currentSizeQty = Number(sizeStock[item.size]) || 0;
        sizeStock[item.size] = Math.max(0, currentSizeQty - item.quantity);

        const newTotal = Object.values(sizeStock).reduce((sum, q) => sum + (Number(q) || 0), 0);

        await db.collection('products').updateOne(
          { _id: product._id },
          {
            $set: {
              sizeStock,
              currentStock: newTotal,
              totalAvailable: newTotal,
              inStock: newTotal > 0,
              updatedAt: nowIso,
            },
          }
        );

        // Record stock-out movement in "inventoryMovements"
        await db.collection('inventoryMovements').insertOne({
          productId: item.itemId || String(product._id),
          productName: item.productName || product.name || '',
          productImage: item.productImage || product.mainImage || null,
          type: 'stock_out',
          quantity: item.quantity,
          previousStock: product.currentStock ?? product.totalAvailable ?? 0,
          newStock: newTotal,
          reason: `Sale (POS Walk-in) - ${billNumber}`,
          sizeDetails: sizeStock,
          createdAt: nowIso,
          createdBy: createdBy || 'billing',
        });
      }
    }

    // 3. Insert bill in MongoDB "bills" collection
    const pdfUrl = `/api/pos/bills/${billNumber}/pdf`;

    const billDocument = {
      billNumber,
      items: cleanItems,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      discountAmount: Number(discountAmount) || 0,
      discountType: discountType || (discountAmount > 0 ? 'percentage' : undefined),
      tax: Number(tax) || 0,
      roundOff: Number(roundOff) || 0,
      total: Number(total) || 0,
      paymentMethod,
      splitDetails: splitDetails || undefined,
      branch: body.branch || 'patna',
      storeName: body.storeName || undefined,
      storeAddress: body.storeAddress || undefined,
      storePhone: body.storePhone || undefined,
      upiId: body.upiId || undefined,
      pdfUrl,
      invoiceUrl: pdfUrl,
      createdAt: nowIso,
      createdBy: createdBy || 'POS Cashier',
    };

    const insertResult = await db.collection('bills').insertOne(billDocument);

    // 4. Send Confirmation Email if customer email provided
    let emailResult = null;
    if (billDocument.customerEmail) {
      try {
        emailResult = await sendPOSBillConfirmationEmail(billDocument);
      } catch (eErr) {
        console.error('[API /api/pos/billing] Email dispatch error:', eErr);
      }
    }

    return NextResponse.json({
      success: true,
      billId: String(insertResult.insertedId),
      billNumber,
      emailSent: Boolean(emailResult?.success),
      bill: {
        ...billDocument,
        _id: String(insertResult.insertedId),
      },
    });
  } catch (err) {
    console.error('[API /api/pos/billing POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function isValidAdminPassword(pwd) {
  if (!pwd) return false;
  const hardcoded = ['maskey00@@', 'aesthetx123', '8008439762', '7033769997'];
  if (hardcoded.includes(String(pwd).trim())) return true;
  try {
    const raw = process.env.NEXT_PUBLIC_VALID_CREDENTIALS;
    if (raw) {
      const creds = JSON.parse(raw);
      if (Array.isArray(creds) && creds.some((c) => String(c.password).trim() === String(pwd).trim())) {
        return true;
      }
    }
  } catch {}
  return false;
}

// PUT /api/pos/billing -> Updates an existing bill
export async function PUT(request) {
  try {
    const db = await initDb();
    const body = await request.json();
    const {
      billNumber,
      items = [],
      customerName = '',
      customerPhone = '',
      customerEmail = '',
      subtotal = 0,
      discount = 0,
      discountAmount = 0,
      discountType = 'flat',
      tax = 0,
      roundOff = 0,
      total = 0,
      paymentMethod = 'cash',
      splitDetails,
      updatedBy = 'Admin',
      adminPassword,
      isEmptied,
    } = body;

    if (!billNumber) {
      return NextResponse.json({ success: false, error: 'Bill number is required' }, { status: 400 });
    }

    // Require admin password verification for every edit to an existing bill
    if (!isValidAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Invalid admin password' }, { status: 401 });
    }

    const cleanItems = items.map((item) => ({
      productId: String(item.productId || item.itemId || item.id || ''),
      productName: item.productName || item.name || '',
      productImage: item.productImage || item.image || item.mainImage || undefined,
      itemId: String(item.itemId || item.productId || ''),
      size: item.size || 'Standard',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      sizeDisplayType: item.sizeDisplayType || 'letter',
    }));

    const updateDoc = {
      items: cleanItems,
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      discountAmount: Number(discountAmount) || 0,
      discountType: discountType || (discountAmount > 0 ? 'percentage' : undefined),
      tax: Number(tax) || 0,
      roundOff: Number(roundOff) || 0,
      total: Number(total) || 0,
      paymentMethod,
      splitDetails: splitDetails || undefined,
      pdfUrl: `/api/pos/bills/${billNumber}/pdf`,
      invoiceUrl: `/api/pos/bills/${billNumber}/pdf`,
      ...(body.branch ? { branch: body.branch } : {}),
      ...(body.storeName ? { storeName: body.storeName } : {}),
      ...(body.storeAddress ? { storeAddress: body.storeAddress } : {}),
      ...(body.storePhone ? { storePhone: body.storePhone } : {}),
      ...(body.upiId ? { upiId: body.upiId } : {}),
      isEdited: true,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Admin',
    };

    const result = await db.collection('bills').updateOne(
      { billNumber: String(billNumber) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Bill record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      billNumber,
      message: 'Bill updated successfully',
    });
  } catch (err) {
    console.error('[API /api/pos/billing PUT] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/pos/billing -> Deletes a bill with admin password verification
export async function DELETE(request) {
  try {
    const db = await initDb();
    const body = await request.json();
    const { billNumber, adminPassword } = body;

    if (!billNumber) {
      return NextResponse.json({ success: false, error: 'Bill number is required' }, { status: 400 });
    }

    if (!isValidAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: 'Invalid admin authorization password' }, { status: 401 });
    }

    const bill = await db.collection('bills').findOne({ billNumber: String(billNumber) });
    if (!bill) {
      return NextResponse.json({ success: false, error: 'Bill record not found' }, { status: 404 });
    }

    // Delete bill record from bills collection
    await db.collection('bills').deleteOne({ billNumber: String(billNumber) });

    // Log deletion movement in inventoryMovements
    await db.collection('inventoryMovements').insertOne({
      productId: 'VOID',
      productName: `VOID BILL #${billNumber}`,
      type: 'stock_in',
      quantity: 0,
      reason: `Bill Deleted / Voided #${billNumber} by Admin`,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin Void',
    });

    return NextResponse.json({
      success: true,
      billNumber,
      message: `Bill #${billNumber} deleted successfully`,
    });
  } catch (err) {
    console.error('[API /api/pos/billing DELETE] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

