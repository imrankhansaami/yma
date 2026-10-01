"use client";

import Link from "next/link";
import { CATEGORY_PAGES } from "@/lib/category-pages";
import { useQuery } from "@tanstack/react-query";
import { getAllPageContent, PageContent } from "@/services/pageContent.service";
import { ArrowRight } from "lucide-react";

export default function CategoryPagesAdmin() {
  const { data: pageContents = [] } = useQuery<PageContent[]>({
    queryKey: ["pageContent", "category"],
    queryFn: () => getAllPageContent("category"),
  });

  const contentMap = new Map(pageContents.map((p) => [p.pageKey, p]));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-brand-black-950 mb-6">
        Category Pages
      </h1>
      <div className="space-y-3">
        {CATEGORY_PAGES.map((cat) => {
          const existing = contentMap.get(cat.slug);
          return (
            <Link
              key={cat.slug}
              href={`/admin/pages/categories/${cat.slug}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="text-sm font-medium text-brand-black-950">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  /{cat.slug} &middot;{" "}
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
