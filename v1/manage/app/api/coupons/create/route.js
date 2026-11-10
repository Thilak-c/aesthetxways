import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // Check if coupon with same code already exists
    const existing = await db.collection("coupons").findOne({
      code: (body.code || "").toUpperCase().trim()
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const newCoupon = {
      ...body,
      code: (body.code || "").toUpperCase().trim(),
      usedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("coupons").insertOne(newCoupon);

    return NextResponse.json({ success: true, couponId: result.insertedId.toString() });
  } catch (error) {
    console.error("Coupon creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}
