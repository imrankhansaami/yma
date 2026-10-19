/**
 * The A-Z index of location pages shown on /locations.
 *
 * Every active location becomes one link, which is what gives the area pages
 * their internal links. Where two active records resolve to the same place (a
 * postcode district page and the area page built for it), the area page wins:
 * it carries the full location layout and local copy.
 */
import { locationDisplayName } from "@/lib/locations";

export type LocationIndexItem = {
  name: string;
  slug: string;
};

export type LocationIndexGroup = {
  letter: string;
  items: LocationIndexItem[];
};

type ApiLocation = {
  name?: string;
  slug?: string;
  slugAliases?: string[];
  place?: string;
  isActive?: boolean;
};

const AREA_SLUG_PREFIX = "bouncy-castles-hire-";

async function fetchActiveLocations(): Promise<ApiLocation[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return [];
    // The API already hides inactive records for the storefront.
    const res = await fetch(`${baseUrl}/api/v1/locations`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? (json.data as ApiLocation[]) : [];
  } catch {
    return [];
  }
}

/** Group active locations into A-Z buckets, one entry per place. */
export function buildLocationIndex(
  locations: ApiLocation[],
): LocationIndexGroup[] {
  const byPlace = new Map<string, LocationIndexItem & { area: number }>();

  for (const location of locations) {
    const slug = String(location.slug || "").trim();
    if (!slug) continue;

    const name = locationDisplayName(
      location.name,
      slug,
      location.slugAliases,
      location.place,
    ).trim();
    if (!name) continue;

    // Prefer the area page over the postcode district page.
    const area = slug.startsWith(AREA_SLUG_PREFIX) ? 1 : 0;
    const key = name.toLocaleLowerCase("en-GB");
    const existing = byPlace.get(key);
    if (existing && existing.area >= area) continue;
    byPlace.set(key, { name, slug, area });
  }

  const sorted = Array.from(byPlace.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );

  const groups = new Map<string, LocationIndexItem[]>();
  for (const item of sorted) {
    const first = item.name.charAt(0).toUpperCase();
    const letter = first >= "A" && first <= "Z" ? first : "#";
    const bucket = groups.get(letter) ?? [];
    bucket.push({ name: item.name, slug: item.slug });
    groups.set(letter, bucket);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    })
    .map(([letter, items]) => ({ letter, items }));
}

export async function fetchLocationIndex(): Promise<{
  groups: LocationIndexGroup[];
  count: number;
}> {
  const groups = buildLocationIndex(await fetchActiveLocations());
  return {
    groups,
    count: groups.reduce((total, group) => total + group.items.length, 0),
  };
}
