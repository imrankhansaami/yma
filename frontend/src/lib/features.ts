/**
 * Storefront feature flags.
 *
 * Reviews & ratings are fully built — customers can post them, admins moderate
 * them at /admin/reviews, and a product's average is stored on the product —
 * but they are kept out of the customer-facing site until the business is
 * ready to show them.
 *
 * To switch them on: set NEXT_PUBLIC_SHOW_REVIEWS=true and rebuild the
 * frontend. Leaving it unset (or anything other than "true") keeps them hidden.
 */
export const SHOW_PRODUCT_REVIEWS =
  process.env.NEXT_PUBLIC_SHOW_REVIEWS === "true";
