import type { Metadata } from "next";

const fallbackMeta = {
  siteName: "YMA Bouncy Castles",
  defaultMetaTitle: "Bouncy Castle Hire | London, Essex & Birmingham",
  defaultMetaDescription:
    "Premium bouncy castles, soft play & garden games for parties. Serving London, Essex, Birmingham & Coventry. Book online today!",
  defaultMetaKeywords: [
    "bouncy castle hire",
    "bouncy castle rental",
    "inflatable hire",
    "party hire",
    "soft play hire",
    "London bouncy castle",
    "Essex bouncy castle",
    "Birmingham bouncy castle",
    "Coventry bouncy castle",
    "Enfield bouncy castle",
    "kids party",
    "garden games",
    "fun foods",
    "event hire",
    "party rentals",
    "children entertainment",
  ].join(", "),
  defaultCanonicalBaseUrl: "https://ymabouncycastles.uk",
  defaultOpenGraphTitle: "YMA Bouncy Castles | Premium Bouncy Castle Hire",
  defaultOpenGraphDescription:
    "Premium bouncy castle hire for parties and events in London, Essex, Enfield, Birmingham & Coventry. Book online today!",
  defaultRobots: "index, follow",
};

type SeoSettingsResponse = {
  data?: {
    settings?: Partial<typeof fallbackMeta>;
  };
};

export type SeoDefaults = typeof fallbackMeta;

const SEO_TITLE_MAX_LENGTH = 60;

export async function getSeoDefaults(): Promise<SeoDefaults> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return fallbackMeta;
    const res = await fetch(`${baseUrl}/api/v1/seo-settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return fallbackMeta;
    const payload = (await res.json()) as SeoSettingsResponse;
    const settings = payload?.data?.settings ?? {};
    return {
      siteName: settings.siteName?.trim() || fallbackMeta.siteName,
      defaultMetaTitle:
        settings.defaultMetaTitle?.trim() || fallbackMeta.defaultMetaTitle,
      defaultMetaDescription:
        settings.defaultMetaDescription?.trim() ||
        fallbackMeta.defaultMetaDescription,
      defaultMetaKeywords:
        settings.defaultMetaKeywords?.trim() ||
        fallbackMeta.defaultMetaKeywords,
      defaultCanonicalBaseUrl:
        settings.defaultCanonicalBaseUrl?.trim() ||
        fallbackMeta.defaultCanonicalBaseUrl,
      defaultOpenGraphTitle:
        settings.defaultOpenGraphTitle?.trim() ||
        fallbackMeta.defaultOpenGraphTitle,
      defaultOpenGraphDescription:
        settings.defaultOpenGraphDescription?.trim() ||
        fallbackMeta.defaultOpenGraphDescription,
      defaultRobots:
        settings.defaultRobots?.trim() || fallbackMeta.defaultRobots,
    };
  } catch {
    return fallbackMeta;
  }
}

type RobotsLike = Exclude<Metadata["robots"], string | null | undefined>;

export function parseRobots(value?: string): RobotsLike {
  const normalized = (value ?? "").toLowerCase();
  const directives = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const hasNoIndex = directives.includes("noindex");
  const hasNoFollow = directives.includes("nofollow");

  return {
    index: !hasNoIndex,
    follow: !hasNoFollow,
    nocache: directives.includes("noarchive") || directives.includes("nocache"),
  };
}

export function mergeKeywords(
  defaults: string,
  keywords: Array<string | undefined>,
) {
  const base = defaults
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const extra = keywords
    .map((item) => item?.trim())
    .filter(Boolean) as string[];
  return Array.from(new Set([...base, ...extra]));
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getBrandAliases(siteName: string) {
  const normalizedSite = normalizeSpace(siteName);
  const firstToken = normalizedSite.split(" ")[0] || normalizedSite;
  const acronym =
    normalizedSite
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || firstToken.toUpperCase();

  const aliases = new Set<string>();
  if (normalizedSite) aliases.add(normalizedSite.toLowerCase());
  if (firstToken) aliases.add(firstToken.toLowerCase());
  if (acronym) aliases.add(acronym.toLowerCase());
  return aliases;
}

function trimToLength(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const cutoff = Math.max(0, maxLength - 1);
  const compact = value.slice(0, cutoff).trim().replace(/[|:,\-\/\s]+$/, "");
  if (!compact) return value.slice(0, maxLength);
  return `${compact}...`;
}

export function buildSeoTitle(rawTitle: string, siteName: string) {
  const input = normalizeSpace(rawTitle);
  const aliases = getBrandAliases(siteName);
  const preferredBrand = normalizeSpace(siteName).split(" ")[0] || "YMA";
  const brandLower = preferredBrand.toLowerCase();

  // Remove existing brand mentions from segments so we can append exactly once.
  const cleanedSegments = input
    .split("|")
    .map((segment) => normalizeSpace(segment))
    .filter(Boolean)
    .filter((segment) => !aliases.has(segment.toLowerCase()));

  const uniqueSegments = Array.from(
    new Set(cleanedSegments.map((segment) => segment.toLowerCase())),
  ).map((lower) => cleanedSegments.find((segment) => segment.toLowerCase() === lower)!);

  let base = normalizeSpace(uniqueSegments.join(" | "));
  if (!base) base = preferredBrand;

  const suffix = ` | ${preferredBrand}`;
  let candidate =
    base.toLowerCase().endsWith(`| ${brandLower}`) ||
    base.toLowerCase() === brandLower
      ? base
      : `${base}${suffix}`;

  if (candidate.length <= SEO_TITLE_MAX_LENGTH) return candidate;

  const maxBaseLength = SEO_TITLE_MAX_LENGTH - suffix.length;
  const shortenedBase = trimToLength(base, Math.max(10, maxBaseLength));
  candidate =
    shortenedBase.toLowerCase().endsWith(`| ${brandLower}`) ||
    shortenedBase.toLowerCase() === brandLower
      ? shortenedBase
      : `${shortenedBase}${suffix}`;

  return trimToLength(candidate, SEO_TITLE_MAX_LENGTH);
}
