import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Promo Codes | Admin",
  description: "Promo code management for YMA admin.",
  ...privateCanonical("/admin/promo-codes"),
};

export default function AdminPromoCodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
