import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-inter">
          <AdminSidebar />

          <div className="ml-[19.5rem]">
            <AdminNavbar />

            <main className="min-h-screen bg-brand-gray-50 px-4 pb-4 pt-16">
              {children}
            </main>
          </div>
        </div>
      </AdminGuard>
    </AdminToastProvider>
  );
}
