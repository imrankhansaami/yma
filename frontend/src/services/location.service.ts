import api from "@/api/api";

export type LocationOption = {
  id: string;
  name: string;
  slug?: string;
  slugAliases?: string[];
  fullAddress?: string | null;
  children?: LocationOption[];
  city: string;
  /** Region, e.g. "Greater London" — used by the location picker for context. */
  state?: string;
  postcode?: string;
  isActive?: boolean;
  deliveryAreas?: { name?: string }[];
};

/**
 * Fetch locations from backend.
 * GET /locations?page=&limit=
 */
/* ********************Nahid**************/
export async function fetchLocations(params?: {
  page?: number;
  limit?: number;
  category?: string; // Add this
  city?: string; // Add this
}): Promise<LocationOption[]> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;

  const res = await api.get("/locations", {
    params: {
      page,
      limit,
      category: params?.category,
      city: params?.city,
    },
  });

  const payload = res?.data?.data;
  let arr: any[] = [];

  if (Array.isArray(payload)) arr = payload;
  else if (Array.isArray(payload?.locations)) arr = payload.locations;

  const normalize = (
    loc: any,
    idx: number,
  ): LocationOption & { city?: string } => ({
    id: loc.id ?? loc._id ?? String(idx),
    name: loc.name ?? loc.fullAddress ?? "Location",
    slug: String(loc.slug || "").trim() || undefined,
    slugAliases: Array.isArray(loc.slugAliases)
      ? loc.slugAliases.map((s: any) => String(s || "").trim()).filter(Boolean)
      : [],
    city: loc.city, // Ensure city is captured
    state: loc.state,
    postcode: loc.postcode,
    isActive: loc.isActive !== false,
    fullAddress: loc.fullAddress ?? loc.description ?? "",
    deliveryAreas: Array.isArray(loc.deliveryAreas) ? loc.deliveryAreas : [],
    children: Array.isArray(loc.children)
      ? loc.children.map((child: any, cIdx: number) => normalize(child, cIdx))
      : undefined,
  });

  return arr.map(normalize);
}
/* ********************Nahid**************/

// export async function fetchLocations(params?: {
//   page?: number;
//   limit?: number;
// }): Promise<LocationOption[]> {
//   const page = params?.page ?? 1;
//   const limit = params?.limit ?? 50;
//
//   const res = await api.get("/locations", {
//     params: { page, limit },
//   });
//
//   const payload = res?.data?.data;
//   let arr: ApiLocation[] = [];
//
//   if (Array.isArray(payload)) {
//     // In case API returns array directly
//     arr = payload as any;
//   } else if (Array.isArray(payload?.locations)) {
//     arr = payload.locations as any;
//   }
//
//   const normalize = (loc: any, idx: number): LocationOption => ({
//     id: loc.id ?? loc._id ?? String(idx),
//     name: loc.name ?? loc.fullAddress ?? "Location",
//     fullAddress: loc.fullAddress ?? loc.description ?? "",
//     deliveryAreas: Array.isArray(loc.deliveryAreas) ? loc.deliveryAreas : [],
//     children: Array.isArray(loc.children)
//       ? loc.children.map((child: any, cIdx: number) =>
//           normalize(child, cIdx)
//         )
//       : undefined,
//   });
//
//   return arr.map(normalize);
// }
