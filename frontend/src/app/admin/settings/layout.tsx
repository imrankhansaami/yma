import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Settings | Admin",
  description: "Admin profile and settings for YMA admin.",
  ...privateCanonical("/admin/settings"),
};

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
