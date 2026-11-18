"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

/**
 * Holds the admin chrome: the sidebar, the top bar and the content column.
 *
 * On phones the sidebar is an off-canvas drawer (the dashboard was unusable at
 * 390px with a 19.5rem sidebar pinned open), toggled from the menu button in the
 * top bar. From `lg` up it is pinned exactly as before.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // A tap on a nav item navigates; close the drawer so the page is visible.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // While the drawer is open the page behind it must not scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <div className="lg:ml-[19.5rem]">
        <AdminNavbar onMenuClick={() => setMenuOpen(true)} />

        <main className="min-h-screen bg-brand-gray-50 px-3 pb-6 pt-16 sm:px-4 sm:pb-8 lg:px-4 lg:pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}
