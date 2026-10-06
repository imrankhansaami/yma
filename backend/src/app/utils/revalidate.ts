import { config } from "../config/config";

/**
 * Trigger on-demand ISR revalidation on the Next.js frontend.
 * Fire-and-forget — failures are logged but never block the response.
 *
 * `tags` purge specific cached fetches (the CMS page-content reads). Pass them
 * alongside `paths` so a regenerated page does not re-read its own stale copy.
 */
export const revalidatePaths = async (
  paths: string[],
  tags: string[] = [],
): Promise<void> => {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) return;
  if (paths.length === 0 && tags.length === 0) return;

  const url = `${config.frontendUrl}/api/revalidate`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, paths, tags }),
    });
  } catch (err) {
    console.error("[revalidate] Failed to revalidate paths:", paths, err);
  }
};

/** Cache tag for a PageContent record, matching the frontend's fetch tag. */
export const pageContentTag = (pageType?: string, pageKey?: string) =>
  pageType && pageKey
    ? `page-content:${pageType}:${String(pageKey).toLowerCase()}`
    : "";

/** Cache tag for product listings, matching the frontend's fetch tag. */
export const PRODUCTS_TAG = "products";

/** Cache tag for a single product's detail fetch. */
export const productTag = (slug?: string) =>
  slug ? `product:${slug}` : "";
