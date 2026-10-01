import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Add Product | Admin",
  description: "Add inventory products in YMA admin.",
  ...privateCanonical("/admin/inventory/add-product"),
};

export default function AdminAddProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
