import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Customers | Admin",
  description: "Customer management for YMA admin.",
  ...privateCanonical("/admin/customers"),
};

export default function AdminCustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
