import { NextResponse } from "next/server";
import { initDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
  }

  try {
    const db = await initDb();
    const query = { $or: [{ slug: id }, { itemId: id }, { id }] };
    if (typeof id === "string" && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    }
    const product = await db.collection("products").findOne(query);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...product,
      _id: String(product._id),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
