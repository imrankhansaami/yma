import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { AdminToastProvider } from "@/components/ui/admin-toast";
import { privateCanonical } from "@/lib/canonical";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin",
  description: "YMA administration dashboard.",
  ...privateCanonical("/admin"),
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminToastProvider>
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </AdminToastProvider>
  );
}
