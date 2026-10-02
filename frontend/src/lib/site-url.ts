/**
 * Canonical public site URL.
 *
 * Set NEXT_PUBLIC_SITE_URL per environment:
 *   - staging:    NEXT_PUBLIC_SITE_URL=https://yma.simplif-ai.co
 *   - production: NEXT_PUBLIC_SITE_URL=https://ymabouncycastles.uk
 *
 * NEXT_PUBLIC_* values are inlined at build time, so a rebuild is required
 * after changing this. The fallback keeps production correct if the variable
 * is ever unset.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ymabouncycastles.uk"
).replace(/\/+$/, "");

/** Bare host (no protocol), for link-internal checks. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");