"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminToast } from "@/components/ui/admin-toast";
import TextEditor from "@/components/admin/inventory/TextEditor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import api from "@/api/api";

export default function NewLocationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const [name, setName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [mapQuery, setMapQuery] = useState("");
  const [mapZoom, setMapZoom] = useState(12);
  const [urlSlug, setUrlSlug] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/locations", {
        name,
        postcode,
        country,
        state,
        city,
        description,
        content,
        metaTitle,
        metaDescription,
        mapQuery,
        mapZoom,
        ...(urlSlug.trim() ? { slug: urlSlug.trim() } : {}),
        isActive: true,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      notify({ title: "Success", message: "Location created successfully", variant: "success" });
      router.push("/admin/pages/locations");
    },
    onError: (err: any) => {
      notify({
        title: "Error",
        message: err?.response?.data?.message || "Failed to create location",
        variant: "error",
      }
      );
    },
  });

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/pages/locations"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Locations
      </Link>

      <h1 className="text-2xl font-semibold text-brand-black-950 mb-6">
        Create New Location
      </h1>

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Location Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. East London"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State / Region
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. London"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL slug
            </label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-slate-400">
                /locations/
              </span>
              <input
                type="text"
                value={urlSlug}
                onChange={(e) => setUrlSlug(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Leave blank to derive from the name"
              />
            </div>
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
            Map
          </h2>
          <p className="text-xs text-slate-500">
            Sets the pin shown in this page&apos;s map. Enter a place, a full
            address, or coordinates like{" "}
            <span className="font-mono">51.7786,0.1307</span>. Leave it blank to
            use the location name automatically.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Map location
              </label>
              <input
                type="text"
                value={mapQuery}
                onChange={(e) => setMapQuery(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. Old Harlow, or 51.7786,0.1307"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Zoom
              </label>
              <input
                type="number"
                min={1}
                max={21}
                value={mapZoom}
                onChange={(e) => setMapZoom(Number(e.target.value) || 12)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <iframe
              title="Map preview"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapQuery.trim() || name || "",
              )}&z=${mapZoom}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-64 w-full border-0"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand-black-950 uppercase tracking-wide">
            Page Content
          </h2>
          <TextEditor value={content} onChange={setContent} />
        </div>

        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name.trim()}
          className="rounded-md bg-brand-black-950 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-black-900 disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create Location"}
        </button>
      </div>
    </div>
  );
}
