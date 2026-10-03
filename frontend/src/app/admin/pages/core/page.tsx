"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAllPageContent, PageContent } from "@/services/pageContent.service";
import { ArrowRight, EyeOff, Search } from "lucide-react";
import { useMemo, useState } from "react";

/** Pages that are built into the site and can always be edited. */
const BUILT_IN = [
  { key: "home", title: "Home Page", path: "/" },
  { key: "contact", title: "Contact Page", path: "/contact" },
  { key: "faqs", title: "FAQs Page", path: "/faqs" },
  { key: "privacy-policy", title: "Privacy Policy", path: "/privacy-policy" },
  { key: "terms", title: "Terms & Conditions", path: "/terms" },
  { key: "booking-catalog", title: "Booking Catalog", path: "/booking-catalog" },
];

export default function CorePagesAdmin() {
  const [search, setSearch] = useState("");

  const { data: pageContents = [] } = useQuery<PageContent[]>({
    queryKey: ["pageContent", "core"],
    queryFn: () => getAllPageContent("core"),
  });

  const rows = useMemo(() => {
    const contentMap = new Map(pageContents.map((p) => [p.pageKey, p]));
    const builtInKeys = new Set(BUILT_IN.map((p) => p.key));

    const builtIn = BUILT_IN.map((page) => ({
      key: page.key,
      title: contentMap.get(page.key)?.title?.trim() || page.title,
      path: page.path,
      record: contentMap.get(page.key),
    }));

    // Everything imported or created on the fly (the area landing pages, About
    // Us, the policy pages, ...).
    const extra = pageContents
      .filter((p) => !builtInKeys.has(p.pageKey))
      .sort((a, b) => a.pageKey.localeCompare(b.pageKey))
      .map((p) => ({
        key: p.pageKey,
        title: p.title?.trim() || p.pageKey,
        path: `/${p.pageKey}`,
        record: p,
      }));

    return [...builtIn, ...extra];
  }, [pageContents]);

  const query = search.trim().toLowerCase();
  const visible = query
    ? rows.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.key.toLowerCase().includes(query),
      )
    : rows;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brand-black-950">
          Core Pages
        </h1>
        <span className="text-xs text-slate-500">
          {rows.length} page{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-300"
        />
      </div>

      <div className="space-y-3">
        {visible.map((page) => (
          <Link
            key={page.key}
            href={`/admin/pages/core/${page.key}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-medium text-brand-black-950">
                <span className="truncate">{page.title}</span>
                {page.record && page.record.isActive === false ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    <EyeOff className="h-3 w-3" />
                    Hidden
                  </span>
                ) : null}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-500">
                {page.path} &middot;{" "}
                {page.record ? (
                  <span className="text-green-600">
                    {page.record.sections?.length || 0} section
                    {(page.record.sections?.length || 0) === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="text-amber-600">Using defaults</span>
                )}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        ))}
        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No pages match “{search}”.
          </p>
        ) : null}
      </div>
    </div>
  );
}
