"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAllPageContent, PageContent } from "@/services/pageContent.service";
import { ArrowRight } from "lucide-react";

const CORE_PAGES = [
  { key: "home", title: "Home Page", path: "/" },
  { key: "contact", title: "Contact Page", path: "/contact" },
  { key: "faqs", title: "FAQs Page", path: "/faqs" },
  { key: "privacy-policy", title: "Privacy Policy", path: "/privacy-policy" },
  { key: "terms", title: "Terms & Conditions", path: "/terms" },
  { key: "booking-catalog", title: "Booking Catalog", path: "/booking-catalog" },
];

export default function CorePagesAdmin() {
  const { data: pageContents = [] } = useQuery<PageContent[]>({
    queryKey: ["pageContent", "core"],
    queryFn: () => getAllPageContent("core"),
  });

  const contentMap = new Map(pageContents.map((p) => [p.pageKey, p]));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-brand-black-950 mb-6">
        Core Pages
      </h1>
      <div className="space-y-3">
        {CORE_PAGES.map((page) => {
          const existing = contentMap.get(page.key);
          return (
            <Link
              key={page.key}
              href={`/admin/pages/core/${page.key}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="text-sm font-medium text-brand-black-950">
                  {page.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {page.path} &middot;{" "}
                  {existing ? (
                    <span className="text-green-600">Content configured</span>
                  ) : (
                    <span className="text-amber-600">Using defaults</span>
                  )}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
