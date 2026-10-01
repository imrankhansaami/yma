"use client";

import Link from "next/link";
import { FileText, MapPin, Home } from "lucide-react";

const pageGroups = [
  {
    title: "Category Pages",
    description: "Edit content and SEO for category pages (Bouncy Castle, Soft Play, etc.)",
    href: "/admin/pages/categories",
    icon: FileText,
  },
  {
    title: "Location Pages",
    description: "Manage location pages, add new locations, edit SEO settings",
    href: "/admin/pages/locations",
    icon: MapPin,
  },
  {
    title: "Core Pages",
    description: "Edit content for Home, Contact, FAQs, Privacy Policy, and Terms pages",
    href: "/admin/pages/core",
    icon: Home,
  },
];

export default function PagesHub() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-brand-black-950 mb-6">
        Page Management
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pageGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Link
              key={group.href}
              href={group.href}
              className="block rounded-lg border border-slate-200 p-6 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <h2 className="text-lg font-medium text-brand-black-950">
                  {group.title}
                </h2>
              </div>
              <p className="text-sm text-slate-500">{group.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
