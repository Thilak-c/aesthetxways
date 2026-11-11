import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export const DEFAULT_STORE_BRANCHES = {
  patna: {
    id: "patna",
    name: "Patna Branch",
    storeName: "AESTHETX WAYS (PATNA)",
    storeAddress: "Kankarbagh Colony More, Ghrounda, Patna, Bihar 800001",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJZSX8QQBZ7TkRVKYOUyR8pTE",
  },
  gaya: {
    id: "gaya",
    name: "Gaya Branch",
    storeName: "AESTHETX WAYS (GAYA)",
    storeAddress: "Gaya Railway Station Campus Rd, Gol Bagicha, Gaya, Bihar 823002",
    phone: "+91 70337 69997",
    gstin: "10AAACA0000A1Z5",
    upiId: "aesthetxways07@okicici",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ15OdAgAr8zkRvzNUY2o324E",
  },
};

export const DEFAULT_WHATSAPP = {
  clientId: "7033769997",
  phone: "+917033769997",
};

export async function GET() {
  try {
    const db = await getDb();
    const branchesDoc = await db.collection("siteSettings").findOne({ key: "posBranches" });
    const usersDoc = await db.collection("siteSettings").findOne({ key: "posUsers" });
    const waDoc = await db.collection("siteSettings").findOne({ key: "posWhatsApp" });

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

    let waData = null;
    if (waDoc?.value) {
      try {
        waData = typeof waDoc.value === "string" ? JSON.parse(waDoc.value) : waDoc.value;
      } catch {}
    }

    // Merge saved branches with defaults to guarantee all fields (upiId, reviewUrl, etc.) are present
    const rawBranches = branchesData?.branches || {};
    const branches = {
      patna: {
        ...DEFAULT_STORE_BRANCHES.patna,
        ...(rawBranches.patna || {}),
        upiId: rawBranches.patna?.upiId || DEFAULT_STORE_BRANCHES.patna.upiId,
      },
      gaya: {
        ...DEFAULT_STORE_BRANCHES.gaya,
        ...(rawBranches.gaya || {}),
        upiId: rawBranches.gaya?.upiId || DEFAULT_STORE_BRANCHES.gaya.upiId,
      },
    };

    const activeBranch = branchesData?.activeBranch || "patna";
    const whatsapp = {
      ...DEFAULT_WHATSAPP,
      ...(branchesData?.whatsapp || {}),
      ...(waData || {}),
    };

    return Response.json({
      success: true,
      branches,
      activeBranch,
      whatsapp,
      users: usersData || null,
      updatedAt: branchesDoc?.updatedAt || null,
    });
  } catch (err) {
    console.error("Error fetching POS settings from MongoDB:", err);
    return Response.json(
      {
        success: false,
        error: String(err),
        branches: DEFAULT_STORE_BRANCHES,
        whatsapp: DEFAULT_WHATSAPP,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { branches, activeBranch, users, whatsapp } = body;
    const db = await getDb();
    const nowIso = new Date().toISOString();

    if (branches && typeof branches === "object") {
      const branchesPayload = {
        branches,
        activeBranch: activeBranch || "patna",
        whatsapp: whatsapp || undefined,
        updatedAt: nowIso,
      };
      await db.collection("siteSettings").updateOne(
        { key: "posBranches" },
        {
          $set: {
            key: "posBranches",
            value: JSON.stringify(branchesPayload),
            updatedAt: nowIso,
          },
        },
        { upsert: true }
      );
    }

    if (whatsapp && typeof whatsapp === "object") {
      await db.collection("siteSettings").updateOne(
        { key: "posWhatsApp" },
        {
          $set: {
            key: "posWhatsApp",
            value: JSON.stringify(whatsapp),
            updatedAt: nowIso,
          },
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
            updatedAt: nowIso,
          },
        },
        { upsert: true }
      );
    }

    return Response.json({ success: true, message: "Settings saved successfully to MongoDB" });
  } catch (err) {
    console.error("Error saving POS settings to MongoDB:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
