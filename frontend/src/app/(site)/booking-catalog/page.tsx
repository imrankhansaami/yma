import type { Metadata } from "next";

import BookingCatalogSection from "@/components/catalog/BookingCatalogSection";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import { fetchPageContent } from "@/lib/pageContent";
import type { PageBlock } from "@/lib/blocks/types";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";
import type { ApiProduct } from "@/services/product.service";
import { PRODUCTS_TAG } from "@/lib/productTags";

// Prerendered (ISR) so the metadata above is baked into <head> at build time
// instead of being streamed into the body on an on-demand render.
export const revalidate = 300;

type CatalogProduct = {
  name?: string;
  summary?: string;
  description?: string;
  imageCover?: string;
  images?: string[];
};

/**
 * The default, unfiltered view — the only thing this route renders on the server.
 * Filtered/sorted/paged URLs are handled entirely by the client component, which
 * reads the query string itself.
 *
 * Reading `searchParams` on the server (here or in generateMetadata) would force
 * this route to render on demand, and an on-demand render streams the HTML shell
 * before the metadata resolves — putting the title, description and canonical in
 * the body, where search engines ignore the canonical. Keeping the route static
 * keeps them in <head>.
 */
async function fetchCatalogProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
  if (!baseUrl) return { items: [] as ApiProduct[], total: 0 };

  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "12");
  params.set("sortBy", "default");
  params.set("sortOrder", "desc");

  try {
    const res = await fetch(`${baseUrl}/api/v1/products?${params.toString()}`, {
      next: { revalidate: 300, tags: [PRODUCTS_TAG] },
    });
    if (!res.ok) return { items: [] as ApiProduct[], total: 0 };

    const data = await res.json();
    // The products endpoint returns `data` as a bare array (with counts in
    // `meta`), but older/other shapes nest under `products`/`items`. Handle all.
    const payload = data?.data ?? {};
    const rawItems: ApiProduct[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.products)
        ? payload.products
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

    const total =
      typeof data?.meta?.total === "number"
        ? data.meta.total
        : typeof payload?.pagination?.total === "number"
          ? payload.pagination.total
          : typeof data?.total === "number"
            ? data.total
            : typeof data?.results === "number"
              ? data.results
              : rawItems.length;

    return { items: rawItems, total };
  } catch {
    return { items: [] as ApiProduct[], total: 0 };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { items, total } = await fetchCatalogProducts();

  const productNames = items
    .map((p: CatalogProduct) => p?.name)
    .filter((name: string | undefined): name is string => Boolean(name))
    .slice(0, 6);

  const highlightedList =
    productNames.length > 0 ? productNames.join(", ") : "our top rentals";

  const defaults = await getSeoDefaults();
  const title = "Booking Catalog";
  const seoTitle = buildSeoTitle(title, defaults.siteName);

  const description = `Explore ${total || "our"} products including ${highlightedList}. Book bouncy castles, soft play, and party rentals in London, Essex, Enfield, Birmingham & Coventry.`;

  const image =
    items?.[0]?.imageCover || items?.[0]?.images?.[0] || "/og-image.jpg";

  const keywords = mergeKeywords(defaults.defaultMetaKeywords, [
    "bouncy castle hire",
    "booking catalog",
    "party rentals",
    ...productNames,
  ]);

  return {
    title: { absolute: seoTitle },
    description,
    keywords,
    authors: [{ name: defaults.siteName }],
    creator: defaults.siteName,
    publisher: defaults.siteName,
    applicationName: defaults.siteName,
    category: "Catalog",
    referrer: "origin-when-cross-origin",
    // Filtered URLs (/booking-catalog?city=…) canonicalise to /booking-catalog
    // via the layout, which is what keeps them out of the index now that the
    // noindex can no longer be applied per query string on a static route.
    openGraph: {
      title: seoTitle,
      description,
      url: `${defaults.defaultCanonicalBaseUrl}/booking-catalog`,
      type: "website",
      siteName: defaults.siteName,
      locale: "en_GB",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "Booking Catalog",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: [image],
    },
  };
}

export default async function BookingCatalogPage() {
  const seeded = await fetchCatalogProducts();

  const cms = await fetchPageContent("core", "booking-catalog");
  const blocks = (cms?.sections || []) as PageBlock[];
  const header = blocks.find((b) => b.type === "pageHeader");
  const contentBlocks = blocks.filter(
    (b) => b.type !== "pageHeader" && b.visible !== false,
  );

  return (
    <>
      <BookingCatalogSection
        initialProducts={seeded?.items}
        initialTotal={seeded?.total}
        title={(header?.data as any)?.title || undefined}
        intro={(header?.data as any)?.subtitle || undefined}
      />
      {contentBlocks.length > 0 ? (
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-16 font-inter">
          <PageBlocks blocks={contentBlocks} />
        </div>
      ) : null}
      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-booking-catalog" />
    </>
  );
}
