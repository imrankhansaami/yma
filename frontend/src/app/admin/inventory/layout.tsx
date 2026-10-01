import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Inventory | Admin",
  description: "Inventory management for YMA admin.",
  ...privateCanonical("/admin/inventory"),
};

export default function AdminInventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
