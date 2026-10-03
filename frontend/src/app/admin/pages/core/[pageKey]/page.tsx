"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPageContentByKey,
  upsertPageContent,
  PageSection,
} from "@/services/pageContent.service";
import TextEditor from "@/components/admin/inventory/TextEditor";
import { useAdminToast } from "@/components/ui/admin-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  home: "Home Page",
  contact: "Contact Page",
  faqs: "FAQs Page",
  "privacy-policy": "Privacy Policy",
  terms: "Terms & Conditions",
  "booking-catalog": "Booking Catalog",
};

export default function EditCorePage() {
  const { pageKey } = useParams<{ pageKey: string }>();
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const { data: pageContent } = useQuery({
    queryKey: ["pageContent", "core", pageKey],
    queryFn: () => getPageContentByKey("core", pageKey),
    enabled: !!pageKey,
  });

  const [metaTitle, setMetaTitle] = useState("");
  const [pageTitleValue, setPageTitleValue] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [customJsonLd, setCustomJsonLd] = useState("");
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    if (pageContent) {
      setMetaTitle(pageContent.metaTitle || "");
      setPageTitleValue(pageContent.title || "");
      setMetaDescription(pageContent.metaDescription || "");
      setMetaKeywords(pageContent.metaKeywords || "");
      setCanonicalUrl(pageContent.canonicalUrl || "");
      setCustomJsonLd(pageContent.customJsonLd || "");
      setSections(pageContent.sections || []);
    }
  }, [pageContent]);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        sectionKey: `section-${Date.now()}`,
        title: "",
        content: "",
        order: prev.length,
      },
    ]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (
    index: number,
    field: keyof PageSection,
    value: string | number
  ) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const mutation = useMutation({
    mutationFn: () =>
      upsertPageContent("core", pageKey, {
        title: pageTitleValue,
        metaTitle,
        metaDescription,
        metaKeywords,
        canonicalUrl,
        customJsonLd,
        sections,
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageContent"] });
      notify({ title: "Success", message: "Page saved successfully", variant: "success" });
    },
    onError: () => {
      notify({ title: "Error", message: "Failed to save page", variant: "error" });
    },
  });

  const pageTitle =
    pageContent?.title?.trim() || PAGE_TITLES[pageKey] || pageKey;

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/pages/core"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Core Pages
      </Link>

      <h1 className="text-2xl font-semibold text-brand-black-950 mb-6">
        Edit: {pageTitle}
      </h1>

      <div className="space-y-6">
        {/* Page heading */}
        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Page
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Page Heading
            </label>
            <input
              type="text"
              value={pageTitleValue}
              onChange={(e) => setPageTitleValue(e.target.value)}
              placeholder={PAGE_TITLES[pageKey] || pageKey}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-slate-500">
              Shown as the H1 on pages the site renders from this content —
              e.g. /{pageKey}
            </p>
          </div>
        </div>

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
            />
          </div>
        </div>

        {/* Sections */}
        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
              Page Sections
            </h2>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </div>

          {sections.length === 0 && (
            <p className="text-sm text-slate-500">
              No sections yet. Click &quot;Add Section&quot; to start building
              this page.
            </p>
          )}

          {sections.map((section, idx) => (
            <div
              key={section.sectionKey}
              className="rounded-md border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(idx, "title", e.target.value)}
                  placeholder="Section title"
                  className="text-sm font-medium border-none bg-transparent p-0 focus:ring-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSection(idx)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <TextEditor
                value={section.content}
                onChange={(val) => updateSection(idx, "content", val)}
              />
            </div>
          ))}
        </div>

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
