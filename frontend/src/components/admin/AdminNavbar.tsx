"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

export default function AdminNavbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
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
    <header className="fixed top-0 right-0 left-0 z-30 flex h-[4rem] items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-6 lg:ml-[19.5rem]">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="-ml-1 shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 sm:text-xl lg:text-2xl">
        {title}
      </h1>

      {/* User profile */}
      <div className="flex shrink-0 items-center gap-2">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white sm:h-10 sm:w-10">
            {initials || "AD"}
          </div>
        )}
        <div className="hidden flex-col leading-tight sm:flex">
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
