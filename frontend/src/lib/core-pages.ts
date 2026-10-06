/**
 * Core page keys that already have a hand-built route. Their address lives in
 * the code, so it cannot be changed from the admin — renaming the record would
 * orphan the route rather than move it.
 *
 * Kept in one place so the admin editor, the storefront and the sitemap agree
 * on which core pages are movable.
 */
export const BUILT_IN_CORE_PAGE_KEYS = new Set([
  "home",
  "contact",
  "faqs",
  "privacy-policy",
  "terms",
  "booking-catalog",
  "locations",
  "blog",
  "cart",
  "checkout",
  "profile",
]);

export function isBuiltInCorePageKey(pageKey: string): boolean {
  return BUILT_IN_CORE_PAGE_KEYS.has(String(pageKey || "").toLowerCase());
}

/** The public address a core page is served at. */
export function corePagePath(pageKey: string): string {
  const key = String(pageKey || "").toLowerCase();
  return key === "home" ? "/" : `/${key}`;
}
