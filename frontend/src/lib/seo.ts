import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-url";

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
  defaultCanonicalBaseUrl: SITE_URL,
  defaultOpenGraphTitle: "Premium Bouncy Castle Hire",
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

/**
 * Resolve a page's SEO title. An explicitly authored meta title is used exactly
 * as entered: we do NOT strip brand segments or append a site-name suffix, so
 * the rendered <title> matches the admin field verbatim (whitespace aside).
 * Callers pass an already-resolved fallback (e.g. the product name or a CMS
 * heading) for pages without a custom meta title.
 */
export function buildSeoTitle(rawTitle: string, _siteName?: string) {
  return normalizeSpace(rawTitle);
}
