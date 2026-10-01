"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchLocations } from "@/services/location.service";
import { ArrowRight, Plus } from "lucide-react";

export default function LocationPagesAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => fetchLocations(),
  });

  const locations = data ?? [];

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
          {locations.map((loc: any) => (
            <Link
              key={loc._id}
              href={`/admin/pages/locations/${loc.slug || loc._id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="text-sm font-medium text-brand-black-950">
                  {loc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  /{loc.slug} &middot;{" "}
                  {loc.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
