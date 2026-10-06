/**
 * Cache tags for product data.
 *
 * These must stay in sync with the backend's `revalidatePaths` calls
 * (`backend/src/app/utils/revalidate.ts`). Tagging the product fetches lets an
 * admin edit purge them through /api/revalidate — without a tag, revalidatePath
 * rebuilds the page but the fetch can still serve its own cached copy until its
 * own window (up to an hour) expires, so image changes do not appear at once.
 */
export const PRODUCTS_TAG = "products";

/** Tag for a single product's detail fetch. */
export const productTag = (slug?: string | null) =>
  slug ? `product:${slug}` : "";
