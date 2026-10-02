"use client";

import Logo from "@/assets/logo2.png";
import { cn } from "@/lib/utils";
import {
  FileText,
  LayoutDashboard,
  Package,
  PanelsTopLeft,
  CornerUpRight,
  Search,
  Settings,
  Star,
  Store,
  TicketPercent,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Order & Booking Management",
    href: "/admin/orders",
    icon: Package,
  },
  {
    label: "Inventory Management",
    href: "/admin/inventory",
    icon: Store,
  },
  {
    label: "Customer Management",
    href: "/admin/customers",
    icon: User,
  },
  {
    label: "Promo Codes",
    href: "/admin/promo-codes",
    icon: TicketPercent,
  },
  {
    label: "Blogs Management",
    href: "/admin/blogs",
    icon: PanelsTopLeft,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    label: "Redirects",
    href: "/admin/redirects",
    icon: CornerUpRight,
  },
  {
    label: "SEO Settings",
    href: "/admin/seo",
    icon: Search,
  },
];

const bottomLinks = [
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[19.5rem] flex-col border-r border-slate-200 bg-white pt-3 pb-4">
      {/* Logo */}
      <Link
        href="/"
        className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-[5px]"
      >
        <div className="px-3">
          <Image src={Logo} alt="logo" />
        </div>
      </Link>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-[11px] font-medium transition-colors",
                active
                  ? "bg-slate-100 text-brand-black-950"
                  : "text-brand-gray-500 hover:bg-slate-50 hover:text-brand-black-950",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-4 space-y-1 px-3 pt-3">
        {bottomLinks.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-[11px] font-medium transition-colors",
                active
                  ? "bg-slate-100 text-brand-black-950"
                  : "text-brand-gray-500 hover:bg-slate-50 hover:text-brand-black-950",
              )}
            >
              <Icon className="h-6 w-6 text-slate-500" />
              <span className="truncate text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
