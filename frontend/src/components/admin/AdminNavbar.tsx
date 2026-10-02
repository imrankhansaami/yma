"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { selectUser, useAuthStore } from "@/store/useAuthStore";

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/orders")) return "Order & Booking Management";
  if (pathname.startsWith("/admin/inventory")) return "Inventory Management";
  if (pathname.startsWith("/admin/customers")) return "Customer Management";
  if (pathname.startsWith("/admin/promo-codes")) return "Promo Codes";
  if (pathname.startsWith("/admin/blogs")) return "Blogs Management";
    if (pathname.startsWith("/admin/reviews")) return "Reviews & Ratings";
  if (pathname.startsWith("/admin/seo")) return "SEO Settings";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Dashboard";
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname ?? "/admin");
  const user = useAuthStore(selectUser);

  const initials = useMemo(() => {
    const base = user?.name || user?.email || "Admin";
    return base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [user?.email, user?.name]);

  const displayName = user?.name || "Admin";
  const displayEmail = user?.email || "";
  const avatarUrl = user?.photo || "";

  return (
    <header className="fixed top-0 right-0 left-0 z-30 flex h-[4rem] items-center justify-between border-b border-slate-200 bg-white px-6 ml-[19.5rem]">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>

      {/* User profile */}
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
            {initials || "AD"}
          </div>
        )}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-slate-900">
            {displayName}
          </span>
          {displayEmail ? (
            <span className="text-sm text-slate-500">{displayEmail}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
