"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Copy, Plus, X } from "lucide-react";

import api from "@/api/api";
import { useAdminToast } from "@/components/ui/admin-toast";

type AdminLocation = {
  _id: string;
  name?: string;
  place?: string;
  slug?: string;
  isActive?: boolean;
};

export default function LocationPagesAdmin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const { data, isLoading } = useQuery<AdminLocation[]>({
    queryKey: ["locations", "admin"],
    queryFn: async () => {
      const { data } = await api.get("/locations?limit=300&includeInactive=true");
      return data?.data ?? data ?? [];
    },
  });

  const locations = Array.isArray(data) ? data : [];

  // The page being duplicated, and the new area's details.
  const [source, setSource] = useState<AdminLocation | null>(null);
  const [place, setPlace] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");

  const openDuplicate = (loc: AdminLocation) => {
    setSource(loc);
    setPlace("");
    setCode("");
    setSlug("");
  };

  const slugFrom = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const duplicate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/locations/${source?._id}/duplicate`, {
        place: place.trim(),
        name: code.trim(),
        slug: slug.trim(),
        replaceFrom: source?.place || source?.name || "",
        replaceTo: place.trim() || code.trim(),
      });
      return data?.data ?? data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      const newSlug = created?.slug || slug.trim();
      notify({
        title: "Page duplicated",
        message: "The new page is a draft — publish it when it's ready.",
        variant: "success",
      });
      setSource(null);
      if (newSlug) router.push(`/admin/pages/locations/${newSlug}`);
    },
    onError: (error: any) => {
      notify({
        title: "Error",
        message:
          error?.response?.data?.message || "Could not duplicate the page",
        variant: "error",
      });
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brand-black-950">
          Location Pages
        </h1>
        <Link
          href="/admin/pages/locations/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-black-950 px-4 py-2 text-sm font-medium text-white hover:bg-brand-black-900"
        >
          <Plus className="h-4 w-4" /> New Location
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading locations...</p>
      ) : locations.length === 0 ? (
        <p className="text-sm text-slate-500">
          No locations yet. Create your first location page.
        </p>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <Link
                href={`/admin/pages/locations/${loc.slug || loc._id}`}
                className="min-w-0 flex-1"
              >
                <h3 className="text-sm font-medium text-brand-black-950">
                  {loc.place ? `${loc.place} (${loc.name})` : loc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  /{loc.slug} &middot;{" "}
                  {loc.isActive === false ? (
                    <span className="text-amber-600">Draft</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => openDuplicate(loc)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                title="Duplicate this page into a new area"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <Link
                href={`/admin/pages/locations/${loc.slug || loc._id}`}
                className="shrink-0"
              >
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {source ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-brand-black-950/40 p-4 pt-16 backdrop-blur-sm"
          onClick={() => setSource(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-brand-black-950">
                  Duplicate this page
                </p>
                <p className="text-xs text-slate-500">
                  Copying everything from{" "}
                  {source.place ? `${source.place} (${source.name})` : source.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSource(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Place name (shown on the page)
                </span>
                <input
                  type="text"
                  value={place}
                  onChange={(event) => {
                    setPlace(event.target.value);
                    setSlug(slugFrom(`bouncy-castles-hire-in-${event.target.value}`));
                  }}
                  placeholder="e.g. Chigwell"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Postcode district (used for delivery &amp; catalogue matching)
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="e.g. IG7"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  URL slug
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <p className="text-xs text-slate-500">
                The copy is copied with “{source.place || source.name}” replaced
                by the new place name. The new page starts as a draft.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setSource(null)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={duplicate.isPending || !place.trim() || !code.trim()}
                onClick={() => duplicate.mutate()}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-black-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-black-900 disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" />
                {duplicate.isPending ? "Duplicating..." : "Duplicate page"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
