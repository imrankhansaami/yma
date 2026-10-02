/**
 * Product size helpers.
 *
 * `size` is an internal, free-text field the admin types in L/W/H order, e.g.
 * "27ft x 9.5ft x 11ft". It is never shown to customers — it exists so the
 * storefront can order and filter products by how large they are. The catalogue
 * DEFAULT sort alternates a large product with a small one using this, and the
 * Size filter buckets products by it.
 *
 * `sizeFootprint` is the numeric form (length x width in feet) stored alongside
 * it so queries can sort and range-filter without parsing at read time.
 */

export type SizeBand = "xs" | "s" | "m" | "l" | "xl";

/** Footprint (sq ft) upper bound for each band. */
export const SIZE_BANDS: { band: SizeBand; label: string; max: number }[] = [
  { band: "xs", label: "Extra Small (up to 5ft x 8ft)", max: 40 },
  { band: "s", label: "Small (up to 12ft x 10ft)", max: 120 },
  { band: "m", label: "Medium (up to 15ft x 11ft)", max: 170 },
  { band: "l", label: "Large (up to 18ft x 15ft)", max: 280 },
  { band: "xl", label: "Extra Large (20ft and above)", max: Number.POSITIVE_INFINITY },
];

/**
 * Pull the first three numbers out of a size string.
 * Accepts "27ft x 9.5ft x 11ft", "27 x 9.5 x 11", "27FT X 9.5FT X 11FT".
 */
export function parseSizeString(
  value?: string | null,
): { length: number; width: number; height?: number } | null {
  if (!value) return null;
  const numbers = String(value)
    .replace(/,/g, ".")
    .match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length < 2) return null;

  const [length, width, height] = numbers.map(Number);
  if (!Number.isFinite(length) || !Number.isFinite(width)) return null;
  if (length <= 0 || width <= 0) return null;

  return {
    length,
    width,
    height: Number.isFinite(height) ? height : undefined,
  };
}

/**
 * Effective footprint for a product.
 *
 * Prefers the typed `size` string (the admin's intent) and falls back to the
 * structured `dimensions` fields, so every product resolves to a number as long
 * as either is present.
 */
export function footprintFor(product: {
  size?: string | null;
  dimensions?: { length?: number; width?: number } | null;
}): number {
  const parsed = parseSizeString(product?.size);
  if (parsed) return parsed.length * parsed.width;

  const length = Number(product?.dimensions?.length) || 0;
  const width = Number(product?.dimensions?.width) || 0;
  return length * width;
}

/** Which band a footprint falls into. Returns null when there is no size. */
export function bandForFootprint(footprint: number): SizeBand | null {
  if (!Number.isFinite(footprint) || footprint <= 0) return null;
  for (const entry of SIZE_BANDS) {
    if (footprint < entry.max) return entry.band;
  }
  return "xl";
}

/** Footprint range for a band, used to build database queries. */
export function rangeForBand(band: SizeBand): { $gte?: number; $lt?: number } | null {
  const index = SIZE_BANDS.findIndex((entry) => entry.band === band);
  if (index === -1) return null;

  const lower = index === 0 ? 0 : SIZE_BANDS[index - 1].max;
  const upper = SIZE_BANDS[index].max;

  const range: { $gte?: number; $lt?: number } = {};
  if (lower > 0) range.$gte = lower;
  if (Number.isFinite(upper)) range.$lt = upper;
  return range;
}

/** Human-readable label for a band. */
export function labelForBand(band: SizeBand): string {
  return SIZE_BANDS.find((entry) => entry.band === band)?.label ?? band;
}

/** Format structured dimensions into the admin's "27ft x 9.5ft x 11ft" style. */
export function formatSize(
  length?: number | null,
  width?: number | null,
  height?: number | null,
): string {
  const parts = [length, width, height]
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length < 2) return "";
  return `${parts.map((n) => `${n}ft`).join(" x ")}`;
}
