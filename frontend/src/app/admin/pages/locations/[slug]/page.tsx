"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminToast } from "@/components/ui/admin-toast";
import TextEditor from "@/components/admin/inventory/TextEditor";
import BlockEditor from "@/components/admin/pages/BlockEditor";
import { GENERIC_BLOCK_TYPES } from "@/lib/blocks/types";
import {
  getPageContentByKey,
  PageSection,
  upsertPageContent,
} from "@/services/pageContent.service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/api/api";

/** A location page renders its own hero and body, plus any generic blocks. */
const LOCATION_BLOCK_TYPES = [
  ...GENERIC_BLOCK_TYPES,
  "locationHero",
  "locationBody",
];

export default function EditLocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const { data: location, isLoading } = useQuery({
    queryKey: ["location", slug],
    queryFn: async () => {
      const { data } = await api.get(`/locations/slug/${slug}`);
      return data?.data?.location ?? data?.data ?? null;
    },
    enabled: !!slug,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // CMS page blocks for this location's long-form copy.
  const { data: pageContent } = useQuery({
    queryKey: ["pageContent", "location", slug],
    queryFn: () => getPageContentByKey("location", slug),
    enabled: !!slug,
  });

  const [sections, setSections] = useState<PageSection[]>([]);
  const [useSavedContent, setUseSavedContent] = useState(true);

  useEffect(() => {
    if (pageContent) {
      setSections(pageContent.sections || []);
      setUseSavedContent(pageContent.isActive !== false);
    }
  }, [pageContent]);

  useEffect(() => {
    if (location) {
      setName(location.name || "");
      setDescription(location.description || "");
      setContent(location.content || "");
      setMetaTitle(location.metaTitle || "");
      setMetaDescription(location.metaDescription || "");
      setIsActive(location.isActive ?? true);
    }
  }, [location]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/locations/${location._id}`, {
        name,
        description,
        content,
        metaTitle,
        metaDescription,
        isActive,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", slug] });
      notify({ title: "Success", message: "Location updated successfully", variant: "success" });
    },
    onError: () => {
      notify({ title: "Error", message: "Failed to update location", variant: "error" });
    },
  });

  const blocksMutation = useMutation({
    mutationFn: () =>
      upsertPageContent("location", slug, {
        sections,
        isActive: useSavedContent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageContent"] });
      notify({
        title: "Success",
        message: "Page sections saved successfully",
        variant: "success",
      });
    },
    onError: () => {
      notify({
        title: "Error",
        message: "Failed to save page sections",
        variant: "error",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>;
  }

  if (!location) {
    return <div className="p-6 text-sm text-slate-500">Location not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/pages/locations"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Locations
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brand-black-950">
          Edit: {location.name}
        </h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          Active
        </label>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Location Details
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Short Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>

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
        </div>

        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Page Content
          </h2>
          <TextEditor value={content} onChange={setContent} />
        </div>

        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Page Sections
          </h2>
          <p className="text-xs text-slate-500">
            These are the blocks that make up the copy on this page: the
            headline and intro beside the map, and the about, why-choose-us,
            services, safety and occasions sections below the product grid.
            Unticking &quot;use this saved content&quot; falls back to the copy
            built into the site.
          </p>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={useSavedContent}
              onChange={(e) => setUseSavedContent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              <span className="block text-sm font-medium text-slate-700">
                Use this saved content
              </span>
            </span>
          </label>
          <BlockEditor
            sections={sections}
            onChange={setSections}
            allowedTypes={LOCATION_BLOCK_TYPES}
          />
          <button
            type="button"
            onClick={() => blocksMutation.mutate()}
            disabled={blocksMutation.isPending}
            className="rounded-md bg-brand-black-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-black-900 disabled:opacity-50"
          >
            {blocksMutation.isPending ? "Saving..." : "Save Page Sections"}
          </button>
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
