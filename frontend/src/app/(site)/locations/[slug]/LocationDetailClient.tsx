"use client";

import { fetchLocations } from "@/services/location.service";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { normalizeCanonicalSlug } from "@/lib/canonical";

export default function LocationDetailClient({
  locationName,
  locationSlug,
  beforeFaq,
}: {
  /** The place shown in copy, e.g. "Harlow". */
  locationName: string;
  /** The slug used to match the location record, e.g. "cm18". */
  locationSlug?: string;
  /** Rendered between the delivery areas and the FAQ — the page's CTA. */
  beforeFaq?: ReactNode;
}) {
  const toSlug = (name: string) =>
    normalizeCanonicalSlug(name);

  const { data: locationsData } = useQuery({
    queryKey: ["locations", "delivery-areas"],
    queryFn: () => fetchLocations({ page: 1, limit: 50 }),
    staleTime: 5 * 60 * 1000,
  });

  const deliveryAreas = useMemo(() => {
    const slug = toSlug(locationSlug || locationName);
    const all = Array.isArray(locationsData) ? (locationsData as any[]) : [];

    const match =
      all.find(
        (loc) =>
          toSlug(String(loc.slug || loc.name)) === slug ||
          (Array.isArray(loc.slugAliases) &&
            loc.slugAliases.some((alias: string) => toSlug(alias) === slug)),
      ) ??
      all
        .flatMap((loc) => (Array.isArray(loc.children) ? loc.children : []))
        .find(
          (child: any) =>
            toSlug(String(child.slug || child.name)) === slug ||
            (Array.isArray(child.slugAliases) &&
              child.slugAliases.some((alias: string) => toSlug(alias) === slug)),
        );

    const names: string[] = [];
    const addNames = (list?: any[]) => {
      if (!Array.isArray(list)) return;
      list.forEach((area) => {
        const n = String(area?.name ?? "").trim();
        if (n && !names.includes(n)) names.push(n);
      });
    };

    if (match) {
      addNames((match as any).deliveryAreas);
      if (Array.isArray(match.children)) {
        match.children.forEach((child: any) =>
          addNames(child?.deliveryAreas as any[]),
        );
      }
    }

    return names;
  }, [locationsData, locationName, locationSlug]);

  return (
    <>
      {deliveryAreas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl sm:text-2xl font-semibold">
            Delivery Areas – Bouncy Castle Hire in {locationName}
          </h3>
          <p className="text-sm sm:text-base text-brand-gray-700">
            We offer free and fast delivery within {locationName}, including
            areas like:
          </p>
          <div className="space-y-2">
            {deliveryAreas.map((name, idx) => (
              <div
                key={`${name}-${idx}`}
                className="flex items-start gap-2 text-sm sm:text-base text-brand-ink-900"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-orange-500" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {beforeFaq}
    </>
  );
}
