import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://db.aesthetxways.com"
);

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
    const branchesData = await convex.query(api.siteSettings.getPosBranches, {});
    const usersData = await convex.query(api.siteSettings.getPosUsers, {});

    const branches = branchesData?.branches || DEFAULT_STORE_BRANCHES;
    const activeBranch = branchesData?.activeBranch || "gaya";

    return Response.json({
      success: true,
      branches,
      activeBranch,
      users: usersData || null,
      updatedAt: branchesData?.updatedAt || null
    });
  } catch (err) {
    console.error("Error fetching POS settings from Convex:", err);
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

    if (branches && typeof branches === "object") {
      await convex.mutation(api.siteSettings.savePosBranches, {
        branchesJson: JSON.stringify(branches),
        activeBranch: activeBranch || "gaya"
      });
    }

    if (users && Array.isArray(users)) {
      await convex.mutation(api.siteSettings.savePosUsers, {
        usersJson: JSON.stringify(users)
      });
    }

    return Response.json({ success: true, message: "Saved to Convex database successfully" });
  } catch (err) {
    console.error("Error saving POS settings to Convex:", err);
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
