import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "SEO Settings | Admin",
  description: "SEO settings management for YMA admin.",
  ...privateCanonical("/admin/seo"),
};

export default function AdminSeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
