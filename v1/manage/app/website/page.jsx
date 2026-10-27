import { redirect } from "next/navigation";

export default function WebsiteDashboardRedirect() {
  redirect("/website/orders");
}
