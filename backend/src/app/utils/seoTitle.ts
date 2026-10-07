/**
 * Meta titles are authored explicitly in the admin. We deliberately do NOT
 * rewrite them here — historically this helper stripped any brand segment and
 * appended a fixed " | YMA" suffix, which made the saved value differ from what
 * the editor typed (and caused duplicated suffixes like "... | YMA | YMA").
 *
 * The field is now authoritative: only whitespace is normalised, so the stored
 * value is exactly what the editor sees and what the frontend renders. A blank
 * value collapses to "" so callers can fall back to an auto-generated title.
 */
export function sanitizeSeoMetaTitle(rawTitle?: string | null): string {
  if (rawTitle == null) return "";
  return String(rawTitle).replace(/\s+/g, " ").trim();
}
