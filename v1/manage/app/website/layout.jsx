import AdminShell from "@/components/AdminShell";

export const metadata = {
  title: "Aesthetx Ways Management",
};

export default function WebsiteLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}

