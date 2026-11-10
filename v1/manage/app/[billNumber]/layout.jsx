import { initDb } from "@/lib/mongodb";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const billNumber = resolvedParams?.billNumber ? String(resolvedParams.billNumber) : "";

  let bill = null;
  try {
    const db = await initDb();
    bill = await db.collection("bills").findOne({ billNumber });
  } catch (error) {
    console.error("Failed to fetch bill metadata from MongoDB:", error);
  }

  const title = `Bill #${billNumber} | AesthetX Ways`;
  const customerName = bill?.customerName ? bill.customerName.toUpperCase() : "Valued Guest";
  const itemsText = bill?.items?.map((item) => `${item.productName} (Size ${item.size || "Std"})`).join(", ") || "";
  const description = bill
    ? `Digital E-bill #${billNumber} for ${customerName} at AesthetX Ways. Items: ${itemsText}`
    : `Digital receipt verification terminal at AesthetX Ways.`;

  return {
    title,
    description,
    icons: {
      icon: "/logo_t.svg",
    },
  };
}

export default function BillLayout({ children }) {
  return <>{children}</>;
}
