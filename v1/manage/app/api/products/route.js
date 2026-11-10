import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function normalizeProduct(p) {
  const priceNum = typeof p.priceNumber === 'number'
    ? p.priceNumber
    : (typeof p.price === 'number'
      ? p.price
      : Number(String(p.price || 0).replace(/[^\d.]/g, ''))) || 0;

  const originalPriceNum = typeof p.originalPrice === 'number'
    ? p.originalPrice
    : (typeof p.listedPrice === 'number'
      ? p.listedPrice
      : null);

  const mainImg = p.image || p.mainImage || '';
  const gal = Array.isArray(p.gallery) && p.gallery.length > 0
    ? p.gallery
    : (Array.isArray(p.otherImages) && p.otherImages.length > 0
      ? [p.mainImage, ...p.otherImages].filter(Boolean)
      : (mainImg ? [mainImg] : []));

  const cleanSlug = p.slug || p.itemId || String(p._id);
  const cleanSku = p.sku || p.itemId || `AW-${cleanSlug.slice(0, 8).toUpperCase()}`;

  let vars = [];
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    vars = p.variants;
  } else if (p.sizeStock && typeof p.sizeStock === 'object') {
    vars = Object.entries(p.sizeStock).map(([sz, stk]) => ({
      size: sz,
      stock: Number(stk) || 0,
      active: true,
      sku: `${cleanSku}-${sz.replace(/\s+/g, '')}`,
    }));
  } else if (Array.isArray(p.availableSizes) && p.availableSizes.length > 0) {
    vars = p.availableSizes.map((sz) => ({
      size: sz,
      stock: 12,
      active: true,
      sku: `${cleanSku}-${sz.replace(/\s+/g, '')}`,
    }));
  }

  const totalStock = vars.length > 0
    ? vars.reduce((acc, v) => acc + (v.active !== false ? Number(v.stock || 0) : 0), 0)
    : (p.stockQuantity ?? p.currentStock ?? p.totalAvailable ?? 0);

  const activeSizes = vars.filter((v) => v.active !== false && Number(v.stock || 0) > 0).map((v) => v.size);

  const discount = originalPriceNum && originalPriceNum > priceNum
    ? Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)
    : 0;

  const costNum = typeof p.costPrice === 'number' ? p.costPrice : null;
  const margin = costNum && priceNum > costNum
    ? Math.round(((priceNum - costNum) / priceNum) * 100)
    : null;

  return {
    ...p,
    _id: String(p._id),
    id: cleanSlug,
    slug: cleanSlug,
    sku: cleanSku,
    itemId: cleanSlug,
    name: p.name || p.title || '',
    title: p.name || p.title || '',
    brand: p.brand || 'Aesthetx Ways',
    role: p.role || 'standard',
    category: p.category || p.mainCategory || 'Streetwear',
    sport: p.sport || p.style || '',
    gender: p.gender || 'unisex',
    tags: Array.isArray(p.tags) ? p.tags : [],
    costPrice: costNum,
    price: `₹${priceNum.toLocaleString('en-IN')}`,
    priceNumber: priceNum,
    originalPrice: originalPriceNum,
    discount,
    margin,
    image: mainImg,
    mainImage: mainImg,
    gallery: gal,
    otherImages: gal.slice(1),
    alt: `${p.name || ''} ${p.category || ''}`.trim(),
    description: p.description || '',
    features: Array.isArray(p.features) ? p.features : [],
    variants: vars,
    availableSizes: activeSizes.length > 0 ? activeSizes : (Array.isArray(p.availableSizes) ? p.availableSizes : []),
    stockQuantity: totalStock,
    currentStock: totalStock,
    totalAvailable: totalStock,
    inStock: totalStock > 0,
    color: p.color || '',
    colorHex: p.colorHex || '',
    linkedColorways: Array.isArray(p.linkedColorways) ? p.linkedColorways : (Array.isArray(p.colorways) ? p.colorways : []),
    colorways: Array.isArray(p.linkedColorways) ? p.linkedColorways : (Array.isArray(p.colorways) ? p.colorways : []),
    relatedProducts: Array.isArray(p.relatedProducts) ? p.relatedProducts : [],
    accessories: Array.isArray(p.accessories) ? p.accessories : [],
    comboItems: Array.isArray(p.comboItems) ? p.comboItems : [],
    comboPrice: p.comboPrice ? Number(p.comboPrice) : null,
    shipping: {
      weight: p.shipping?.weight || p.weight || 450,
      returnPolicy: p.shipping?.returnPolicy || p.returnPolicy || '7 Days Exchange',
    },
    seo: {
      metaTitle: p.seo?.metaTitle || '',
      metaDescription: p.seo?.metaDescription || '',
      keywords: Array.isArray(p.seo?.keywords) ? p.seo.keywords : [],
    },
    hidden: Boolean(p.hidden ?? p.isHidden),
    isHidden: Boolean(p.hidden ?? p.isHidden),
    featured: Boolean(p.featured ?? p.isTopSeller),
    isTopSeller: Boolean(p.featured ?? p.isTopSeller),
    createdAt: p.createdAt || new Date(),
    updatedAt: p.updatedAt || new Date(),
  };
}

export async function GET() {
  try {
    const db = await initDb();
    const rawProducts = await db.collection('products')
      .find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    const products = rawProducts.map(normalizeProduct);
    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('[Admin Products GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      sku,
      brand = 'Aesthetx Ways',
      role = 'standard',
      category = 'Streetwear',
      sport = '',
      gender = 'unisex',
      tags = [],
      costPrice = null,
      priceNumber,
      originalPrice = null,
      image,
      gallery = [],
      description = '',
      variants = [],
      color = '',
      colorHex = '',
      colorways = [],
      linkedColorways = [],
      relatedProducts = [],
      accessories = [],
      comboItems = [],
      comboPrice = null,
      weight = 450,
      returnPolicy = '7 Days Exchange',
      seo = {},
      features = [],
      hidden = false,
      featured = false,
    } = body;

    if (!name || !priceNumber) {
      return NextResponse.json({ error: 'Name and selling price are required' }, { status: 400 });
    }

    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return isNaN(val) ? null : val;
      const cleaned = Number(String(val).replace(/[^\d.]/g, ''));
      return isNaN(cleaned) ? null : cleaned;
    };

    const cleanPrice = parseNum(priceNumber) || 0;
    const cleanOriginalPrice = parseNum(originalPrice);
    const cleanCostPrice = parseNum(costPrice);
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanSku = sku || `AW-${cleanSlug.slice(0, 8).toUpperCase()}`;

    const discount = cleanOriginalPrice && cleanOriginalPrice > cleanPrice
      ? Math.round(((cleanOriginalPrice - cleanPrice) / cleanOriginalPrice) * 100)
      : 0;
    const margin = cleanCostPrice && cleanPrice > cleanCostPrice
      ? Math.round(((cleanPrice - cleanCostPrice) / cleanPrice) * 100)
      : null;

    const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
    const resolvedVariants = Array.isArray(variants) && variants.length > 0
      ? variants
      : DEFAULT_SIZES.map((sz) => ({
          size: sz,
          sku: `${cleanSku}-${sz.replace(/\s+/g, '')}`,
          stock: 10,
          priceOverride: null,
          active: true,
        }));

    const totalStock = resolvedVariants.reduce((sum, v) => sum + (v.active !== false ? Number(v.stock || 0) : 0), 0);
    const activeSizes = resolvedVariants.filter((v) => v.active !== false && Number(v.stock || 0) > 0).map((v) => v.size);

    const sizeStockObj = {};
    resolvedVariants.forEach((v) => {
      sizeStockObj[v.size] = Number(v.stock || 0);
    });

    const db = await initDb();

    // Check if slug or itemId already exists
    const existing = await db.collection('products').findOne({
      $or: [{ slug: cleanSlug }, { itemId: cleanSlug }, { id: cleanSlug }],
    });
    if (existing) {
      return NextResponse.json({ error: 'A product with this identifier already exists' }, { status: 409 });
    }

    const mainImage = image || (gallery[0] || '');
    const finalGallery = gallery.length > 0 ? gallery : (mainImage ? [mainImage] : []);

    const newProduct = {
      id: cleanSlug,
      slug: cleanSlug,
      itemId: cleanSlug,
      sku: cleanSku,
      name,
      title: name,
      brand: brand || 'Aesthetx Ways',
      role,
      category: category || 'Streetwear',
      mainCategory: category || 'Streetwear',
      sport: sport || '',
      gender: gender || 'unisex',
      tags: Array.isArray(tags) ? tags : [],
      costPrice: cleanCostPrice,
      price: `₹${cleanPrice.toLocaleString('en-IN')}`,
      priceNumber: cleanPrice,
      originalPrice: cleanOriginalPrice,
      discount,
      margin,
      image: mainImage,
      mainImage: mainImage,
      gallery: finalGallery,
      otherImages: finalGallery.slice(1),
      alt: `${name} ${category}`.trim(),
      description: description || '',
      features: Array.isArray(features) ? features : [],
      variants: resolvedVariants,
      sizeStock: sizeStockObj,
      availableSizes: activeSizes,
      stockQuantity: totalStock,
      currentStock: totalStock,
      totalAvailable: totalStock,
      inStock: totalStock > 0,
      color: color || '',
      colorHex: colorHex || '',
      linkedColorways: Array.isArray(linkedColorways) ? linkedColorways : (Array.isArray(colorways) ? colorways : []),
      colorways: Array.isArray(linkedColorways) ? linkedColorways : (Array.isArray(colorways) ? colorways : []),
      relatedProducts: Array.isArray(relatedProducts) ? relatedProducts : [],
      accessories: Array.isArray(accessories) ? accessories : [],
      comboItems: Array.isArray(comboItems) ? comboItems : [],
      comboPrice: comboPrice ? Number(comboPrice) : null,
      weight: weight ? Number(weight) : 450,
      returnPolicy: returnPolicy || '7 Days Exchange',
      shipping: {
        weight: weight ? Number(weight) : 450,
        returnPolicy: returnPolicy || '7 Days Exchange',
      },
      seo: {
        metaTitle: seo?.metaTitle || '',
        metaDescription: seo?.metaDescription || '',
        keywords: Array.isArray(seo?.keywords) ? seo.keywords : [],
      },
      hidden: Boolean(hidden),
      isHidden: Boolean(hidden),
      featured: Boolean(featured),
      isTopSeller: Boolean(featured),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection('products').insertOne(newProduct);
    newProduct._id = insertResult.insertedId.toString();

    return NextResponse.json({ success: true, product: normalizeProduct(newProduct) });
  } catch (error) {
    console.error('[Admin Products POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const db = await initDb();

    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return isNaN(val) ? null : val;
      const cleaned = Number(String(val).replace(/[^\d.]/g, ''));
      return isNaN(cleaned) ? null : cleaned;
    };

    // Bulk update support
    if (Array.isArray(body.slugs) && body.slugs.length > 0) {
      const { slugs, ...updates } = body;
      if (updates.priceNumber !== undefined) {
        const priceNum = parseNum(updates.priceNumber) || 0;
        updates.priceNumber = priceNum;
        updates.price = `₹${priceNum.toLocaleString('en-IN')}`;
      }
      if (updates.hidden !== undefined) {
        updates.isHidden = Boolean(updates.hidden);
      }
      updates.updatedAt = new Date();
      await db.collection('products').updateMany(
        { $or: [{ slug: { $in: slugs } }, { itemId: { $in: slugs } }, { id: { $in: slugs } }] },
        { $set: updates }
      );
      return NextResponse.json({ success: true, count: slugs.length, message: 'Products updated' });
    }

    const { slug, ...updates } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Product identifier is required' }, { status: 400 });
    }

    if (updates.name) {
      updates.title = updates.name;
    }

    if (updates.priceNumber !== undefined) {
      const priceNum = parseNum(updates.priceNumber) || 0;
      updates.priceNumber = priceNum;
      updates.price = `₹${priceNum.toLocaleString('en-IN')}`;
    }

    if (updates.originalPrice !== undefined) {
      updates.originalPrice = parseNum(updates.originalPrice);
    }

    if (updates.costPrice !== undefined) {
      updates.costPrice = parseNum(updates.costPrice);
    }

    if (updates.priceNumber !== undefined || updates.originalPrice !== undefined) {
      const p = updates.priceNumber !== undefined ? updates.priceNumber : null;
      const op = updates.originalPrice !== undefined ? updates.originalPrice : null;
      if (p && op && op > p) {
        updates.discount = Math.round(((op - p) / op) * 100);
      } else {
        updates.discount = 0;
      }
    }

    if (updates.priceNumber !== undefined || updates.costPrice !== undefined) {
      const p = updates.priceNumber !== undefined ? updates.priceNumber : null;
      const cp = updates.costPrice !== undefined ? updates.costPrice : null;
      if (p && cp && p > cp) {
        updates.margin = Math.round(((p - cp) / p) * 100);
      }
    }

    if (updates.image !== undefined) {
      updates.mainImage = updates.image;
    }
    if (Array.isArray(updates.gallery)) {
      updates.otherImages = updates.gallery.slice(1);
    }

    if (updates.hidden !== undefined) {
      updates.isHidden = Boolean(updates.hidden);
    }
    if (updates.featured !== undefined) {
      updates.isTopSeller = Boolean(updates.featured);
    }

    if (updates.weight !== undefined || updates.shipping?.weight !== undefined) {
      const cleanWeight = updates.weight !== undefined && updates.weight !== ''
        ? Number(updates.weight)
        : (updates.shipping?.weight !== undefined && updates.shipping?.weight !== '' ? Number(updates.shipping.weight) : 450);
      updates.weight = cleanWeight;
      updates['shipping.weight'] = cleanWeight;
      if (updates.shipping) {
        updates.shipping.weight = cleanWeight;
      }
    }

    if (updates.returnPolicy !== undefined || updates.shipping?.returnPolicy !== undefined) {
      const cleanPolicy = updates.returnPolicy || updates.shipping?.returnPolicy || '7 Days Exchange';
      updates.returnPolicy = cleanPolicy;
      updates['shipping.returnPolicy'] = cleanPolicy;
      if (updates.shipping) {
        updates.shipping.returnPolicy = cleanPolicy;
      }
    }

    // Stock & variants rollup
    if (Array.isArray(updates.variants)) {
      const totalStock = updates.variants.reduce((sum, v) => sum + (v.active !== false ? Number(v.stock || 0) : 0), 0);
      updates.stockQuantity = totalStock;
      updates.currentStock = totalStock;
      updates.totalAvailable = totalStock;
      updates.availableSizes = updates.variants.filter((v) => v.active !== false && Number(v.stock || 0) > 0).map((v) => v.size);
      
      const sizeStockObj = {};
      updates.variants.forEach((v) => {
        sizeStockObj[v.size] = Number(v.stock || 0);
      });
      updates.sizeStock = sizeStockObj;

      if (updates.inStock === undefined) {
        updates.inStock = totalStock > 0;
      }
    }

    updates.updatedAt = new Date();

    if (Array.isArray(updates.linkedColorways) || Array.isArray(updates.colorways)) {
      const linked = Array.isArray(updates.linkedColorways) ? updates.linkedColorways : updates.colorways;
      updates.linkedColorways = linked;
      updates.colorways = linked;

      for (const siblingSlug of linked) {
        if (siblingSlug && siblingSlug !== slug) {
          await db.collection('products').updateOne(
            { $or: [{ slug: siblingSlug }, { itemId: siblingSlug }, { id: siblingSlug }] },
            { $addToSet: { linkedColorways: slug, colorways: slug } }
          );
        }
      }
    }

    const result = await db.collection('products').updateOne(
      { $or: [{ slug }, { itemId: slug }, { id: slug }, { _id: slug }] },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('[Admin Products PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const slugsParam = searchParams.get('slugs');
    const all = searchParams.get('all');

    const db = await initDb();

    if (all === 'true') {
      const res = await db.collection('products').deleteMany({});
      return NextResponse.json({
        success: true,
        count: res.deletedCount,
        message: 'All products successfully deleted',
      });
    }

    if (slugsParam) {
      const slugs = slugsParam.split(',').filter(Boolean);
      await db.collection('products').deleteMany({
        $or: [{ slug: { $in: slugs } }, { itemId: { $in: slugs } }, { id: { $in: slugs } }],
      });
      return NextResponse.json({ success: true, count: slugs.length, message: 'Products deleted' });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Product identifier is required' }, { status: 400 });
    }

    const result = await db.collection('products').deleteOne({
      $or: [{ slug }, { itemId: slug }, { id: slug }, { _id: slug }],
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[Admin Products DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}
