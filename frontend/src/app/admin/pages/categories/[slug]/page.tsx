"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPageContentByKey,
  upsertPageContent,
} from "@/services/pageContent.service";
import { CATEGORY_PAGE_BY_SLUG } from "@/lib/category-pages";
import TextEditor from "@/components/admin/inventory/TextEditor";
import { useAdminToast } from "@/components/ui/admin-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EditCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const categoryConfig = CATEGORY_PAGE_BY_SLUG.get(slug);

  const { data: pageContent } = useQuery({
    queryKey: ["pageContent", "category", slug],
    queryFn: () => getPageContentByKey("category", slug),
    enabled: !!slug,
  });

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [customJsonLd, setCustomJsonLd] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (pageContent) {
      setMetaTitle(pageContent.metaTitle || "");
      setMetaDescription(pageContent.metaDescription || "");
      setMetaKeywords(pageContent.metaKeywords || "");
      setCanonicalUrl(pageContent.canonicalUrl || "");
      setCustomJsonLd(pageContent.customJsonLd || "");
      setContent(
        pageContent.sections?.[0]?.content || ""
      );
    } else if (categoryConfig) {
      setMetaTitle(categoryConfig.title);
      setMetaDescription(categoryConfig.seoDescription);
      setMetaKeywords(categoryConfig.keywords.join(", "));
    }
  }, [pageContent, categoryConfig]);

  const mutation = useMutation({
    mutationFn: () =>
      upsertPageContent("category", slug, {
        metaTitle,
        metaDescription,
        metaKeywords,
        canonicalUrl,
        customJsonLd,
        sections: [
          {
            sectionKey: "main",
            title: categoryConfig?.title || slug,
            content,
            order: 0,
          },
        ],
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageContent"] });
      notify({ title: "Success", message: "Page content saved successfully", variant: "success" });
    },
    onError: () => {
      notify({ title: "Error", message: "Failed to save page content", variant: "error" });
    },
  });

  if (!categoryConfig) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/pages/categories"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Categories
      </Link>

      <h1 className="text-2xl font-semibold text-brand-black-950 mb-6">
        Edit: {categoryConfig.title}
      </h1>

      <div className="space-y-6">
        {/* SEO Fields */}
        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            SEO Settings
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              maxLength={120}
            />
            <p className="text-xs text-slate-400 mt-1">
              {metaTitle.length}/120 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              maxLength={320}
            />
            <p className="text-xs text-slate-400 mt-1">
              {metaDescription.length}/320 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Meta Keywords
            </label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Canonical URL
            </label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://ymabouncycastles.uk/bouncy-castle-hire"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Custom Schema (JSON-LD)
            </label>
            <textarea
              value={customJsonLd}
              onChange={(e) => setCustomJsonLd(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono"
              rows={4}
              placeholder='{"@context": "https://schema.org", ...}'
            />
          </div>
        </div>

        {/* Page Content */}
        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Page Content
          </h2>
          <TextEditor value={content} onChange={setContent} />
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-md bg-brand-black-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-black-900 disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
