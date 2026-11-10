import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DEFAULT_STORE_BRANCHES = {
  patna: {
    id: "patna",
    name: "Patna Branch",
    storeName: "AESTHETX WAYS (PATNA)",
    storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici"
  },
  gaya: {
    id: "gaya",
    name: "Gaya Branch",
    storeName: "AESTHETX WAYS (GAYA)",
    storeAddress: "Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici"
  }
};

export async function GET() {
  try {
    const db = await getDb();
    const branchesDoc = await db.collection("siteSettings").findOne({ key: "posBranches" });
    const usersDoc = await db.collection("siteSettings").findOne({ key: "posUsers" });

    let branchesData = null;
    if (branchesDoc?.value) {
      try {
        branchesData = typeof branchesDoc.value === "string" ? JSON.parse(branchesDoc.value) : branchesDoc.value;
      } catch {}
    }

    let usersData = null;
    if (usersDoc?.value) {
      try {
        usersData = typeof usersDoc.value === "string" ? JSON.parse(usersDoc.value) : usersDoc.value;
      } catch {}
    }

    const branches = branchesData?.branches || DEFAULT_STORE_BRANCHES;
    const activeBranch = branchesData?.activeBranch || "patna";

    return Response.json({
      success: true,
      branches,
      activeBranch,
      users: usersData || null,
      updatedAt: branchesDoc?.updatedAt || null
    });
  } catch (err) {
    console.error("Error fetching POS settings from MongoDB:", err);
    return Response.json(
      { success: false, error: String(err), branches: DEFAULT_STORE_BRANCHES },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { branches, activeBranch, users } = body;
    const db = await getDb();

    if (branches && typeof branches === "object") {
      const branchesPayload = {
        branches,
        activeBranch: activeBranch || "patna",
        updatedAt: new Date().toISOString()
      };
      await db.collection("siteSettings").updateOne(
        { key: "posBranches" },
        {
          $set: {
            key: "posBranches",
            value: JSON.stringify(branchesPayload),
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
    }

    if (users && Array.isArray(users)) {
      await db.collection("siteSettings").updateOne(
        { key: "posUsers" },
        {
          $set: {
            key: "posUsers",
            value: JSON.stringify(users),
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
    }

    return Response.json({ success: true, message: "Saved to MongoDB successfully" });
  } catch (err) {
    console.error("Error saving POS settings to MongoDB:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
