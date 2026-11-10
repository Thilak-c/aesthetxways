import { NextResponse } from "next/server";
import { initDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const db = await initDb();
    const { products } = await request.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ success: 0, failed: 0, errors: ["Invalid products data"] }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const product of products) {
      try {
        if (!product.itemId || !product.name || !product.price) {
          errors.push(`Missing required fields for product: ${product.itemId || product.name || "unknown"}`);
          failed++;
          continue;
        }

        let sizeStock = product.sizeStock || {};
        let availableSizes = product.availableSizes || [];
        
        if (Object.keys(sizeStock).length === 0 && (product.totalStock || product.currentStock)) {
          sizeStock = { "Free": Number(product.totalStock) || Number(product.currentStock) || 0 };
          availableSizes = ["Free"];
        }
        
        const currentStock = Object.values(sizeStock).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
        const priceNum = Number(product.price) || 0;
        const cleanSlug = product.slug || product.itemId;

        const doc = {
          id: cleanSlug,
          slug: cleanSlug,
          itemId: product.itemId,
          sku: product.sku || `AW-${cleanSlug.slice(0, 8).toUpperCase()}`,
          name: product.name,
          title: product.name,
          category: product.category || "Uncategorized",
          mainCategory: product.category || "Uncategorized",
          description: product.description || "",
          mainImage: product.mainImage || "",
          image: product.mainImage || "",
          gallery: Array.isArray(product.otherImages) && product.otherImages.length > 0 ? [product.mainImage, ...product.otherImages].filter(Boolean) : (product.mainImage ? [product.mainImage] : []),
          otherImages: product.otherImages || [],
          price: `₹${priceNum.toLocaleString("en-IN")}`,
          priceNumber: priceNum,
          costPrice: Number(product.costPrice) || null,
          color: product.color || "",
          secondaryColor: product.secondaryColor || "",
          availableSizes: availableSizes,
          sizeStock: sizeStock,
          stockQuantity: currentStock,
          currentStock: currentStock,
          totalAvailable: currentStock,
          inStock: currentStock > 0,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection("products").updateOne(
          { $or: [{ itemId: product.itemId }, { slug: cleanSlug }] },
          { $set: doc },
          { upsert: true }
        );
        success++;
      } catch (err) {
        errors.push(`Failed to import ${product.itemId || product.name}: ${err.message}`);
        failed++;
      }
    }

    return NextResponse.json({ success, failed, errors });
  } catch (err) {
    return NextResponse.json({ success: 0, failed: 0, errors: [err.message] }, { status: 500 });
  }
}
