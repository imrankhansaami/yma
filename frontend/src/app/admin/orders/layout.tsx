import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Orders | Admin",
  description: "Order management for YMA admin.",
  ...privateCanonical("/admin/orders"),
};

export default function AdminOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
