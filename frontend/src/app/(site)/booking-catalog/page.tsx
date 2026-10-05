import type { Metadata } from "next";

import BookingCatalogSection from "@/components/catalog/BookingCatalogSection";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import { fetchPageContent } from "@/lib/pageContent";
import type { PageBlock } from "@/lib/blocks/types";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";
import type { ApiProduct } from "@/services/product.service";

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogProduct = {
  name?: string;
  summary?: string;
  description?: string;
  imageCover?: string;
  images?: string[];
};

type CatalogCategory = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

const normalizeCategoryToken = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/-hire$/i, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bhire\b/g, " ")
    .replace(/\bcastles\b/g, "castle")
    .replace(/\bgames\b/g, "game");

async function resolveCategoryId(
  baseUrl: string,
  searchParams: SearchParams,
): Promise<string> {
  const rawCategoryId = getStringParam(searchParams.category).trim();
  if (rawCategoryId) return rawCategoryId;

  const rawCategoryName = getStringParam(searchParams.categoryName).trim();
  if (!rawCategoryName) return "";
  const categoryNameToken = rawCategoryName.replace(/-hire$/i, "");

  try {
    const res = await fetch(`${baseUrl}/api/v1/categories?page=1&limit=200`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return "";

    const data = await res.json();
    const categories = Array.isArray(data?.data?.categories)
      ? (data.data.categories as CatalogCategory[])
      : [];
    if (!categories.length) return "";

    const normalizedQuery = normalizeCategoryToken(categoryNameToken);
    const match = categories.find((category) => {
      const id = String(category?._id || category?.id || "").trim();
      if (!id) return false;
      const bySlug =
        String(category?.slug || "").toLowerCase() === categoryNameToken.toLowerCase();
      const byName =
        normalizeCategoryToken(String(category?.name || "")) === normalizedQuery;
      return bySlug || byName;
    });

    return String(match?._id || match?.id || "").trim();
  } catch {
    return "";
  }
}

async function fetchCatalogProducts(searchParams: SearchParams) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
  if (!baseUrl) return { items: [] as ApiProduct[], total: 0 };

  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "12");

  // Mirrors the client's SORT_OPTIONS so the server-rendered seed matches the
  // order the client shows on first paint (no reorder flash). "default" is the
  // backend's alternating big/small order.
  const SORT_MAP: Record<string, { sortBy: string; sortOrder: string }> = {
    default: { sortBy: "default", sortOrder: "desc" },
    newest: { sortBy: "createdAt", sortOrder: "desc" },
    "price-asc": { sortBy: "price", sortOrder: "asc" },
    "price-desc": { sortBy: "price", sortOrder: "desc" },
  };
  const rawSort =
    getStringParam(searchParams.sortBy).trim() ||
    getStringParam(searchParams.sort).trim() ||
    "default";
  const sortChoice = SORT_MAP[rawSort] ?? SORT_MAP.default;
  params.set("sortBy", sortChoice.sortBy);
  params.set("sortOrder", sortChoice.sortOrder);

  const search = searchParams.search;
  if (typeof search === "string" && search.trim()) {
    params.set("search", search.trim());
    params.set("name", search.trim());
  }

  const categoryId = await resolveCategoryId(baseUrl, searchParams);
  if (categoryId) {
    params.set("category", categoryId);
  }

  const sizeBand = getStringParam(searchParams.size).trim();
  if (sizeBand) {
    params.set("sizeBand", sizeBand);
  }

  const location =
    (typeof searchParams.pickup === "string" && searchParams.pickup) ||
    (typeof searchParams.city === "string" && searchParams.city) ||
    (typeof searchParams.location === "string" && searchParams.location) ||
    "";
  if (location) {
    params.set("city", location);
  }

  const availableOn = searchParams.availableOn;
  if (typeof availableOn === "string" && availableOn) {
    params.set("availableOn", availableOn);
  }
  const availableFrom =
    (typeof searchParams.start === "string" && searchParams.start) ||
    (typeof searchParams.startDate === "string" && searchParams.startDate) ||
    (typeof searchParams.availableFrom === "string" && searchParams.availableFrom) ||
    "";
  if (availableFrom) {
    params.set("startDate", availableFrom);
  }
  const availableUntil =
    (typeof searchParams.end === "string" && searchParams.end) ||
    (typeof searchParams.endDate === "string" && searchParams.endDate) ||
    (typeof searchParams.availableUntil === "string" && searchParams.availableUntil) ||
    "";
  if (availableUntil) {
    params.set("endDate", availableUntil);
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/products?${params.toString()}`, {
      next: { revalidate: 300 },
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

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const categoryName = getStringParam(resolvedSearchParams.categoryName).trim();
  const locationName =
    getStringParam(resolvedSearchParams.pickup).trim() ||
    getStringParam(resolvedSearchParams.city).trim() ||
    getStringParam(resolvedSearchParams.locationName).trim();
  const searchTerm = getStringParam(resolvedSearchParams.search).trim();

  const { items, total } = await fetchCatalogProducts(resolvedSearchParams);

  const productNames = items
    .map((p: CatalogProduct) => p?.name)
    .filter((name: string | undefined): name is string => Boolean(name))
    .slice(0, 6);

  const highlightedList =
    productNames.length > 0 ? productNames.join(", ") : "our top rentals";

  const defaults = await getSeoDefaults();
  const titleParts = [
    searchTerm
      ? `Search results for "${searchTerm}"`
      : categoryName
        ? `${categoryName} Rentals`
        : locationName
          ? `Booking Catalog in ${locationName}`
          : "Booking Catalog",
  ];

  const title = titleParts.filter(Boolean).join(" | ");
  const seoTitle = buildSeoTitle(title, defaults.siteName);

  const description = searchTerm
    ? `Browse ${total || "our"} results for "${searchTerm}", including ${highlightedList}.`
    : `Explore ${total || "our"} products including ${highlightedList}. Book bouncy castles, soft play, and party rentals in London, Essex, Enfield, Birmingham & Coventry.`;

  const image =
    items?.[0]?.imageCover || items?.[0]?.images?.[0] || "/og-image.jpg";

  const canonicalParams = new URLSearchParams();
  if (searchTerm) canonicalParams.set("search", searchTerm);
  if (categoryName) canonicalParams.set("categoryName", categoryName);
  if (locationName) canonicalParams.set("city", locationName);
  const availableOn = getStringParam(resolvedSearchParams.availableOn).trim();
  if (availableOn) canonicalParams.set("availableOn", availableOn);
  const availableFrom =
    getStringParam(resolvedSearchParams.start).trim() ||
    getStringParam(resolvedSearchParams.startDate).trim() ||
    getStringParam(resolvedSearchParams.availableFrom).trim();
  if (availableFrom) canonicalParams.set("availableFrom", availableFrom);
  const availableUntil =
    getStringParam(resolvedSearchParams.end).trim() ||
    getStringParam(resolvedSearchParams.endDate).trim() ||
    getStringParam(resolvedSearchParams.availableUntil).trim();
  if (availableUntil) canonicalParams.set("availableUntil", availableUntil);
  const sort = getStringParam(resolvedSearchParams.sort).trim();
  if (sort) canonicalParams.set("sort", sort);
  const canonicalQuery = canonicalParams.toString();
  const hasFilterParams = canonicalQuery.length > 0;

  const keywords = mergeKeywords(defaults.defaultMetaKeywords, [
    "bouncy castle hire",
    "booking catalog",
    "party rentals",
    categoryName,
    locationName,
    searchTerm,
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
    robots: hasFilterParams
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
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

export default async function BookingCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  // Only seed the client with server-rendered products for the default,
  // unfiltered view. When filters/sort/paging are in the URL the client's
  // first render uses a different query key, so seeding would not match.
  const seedKeys = [
    "category",
    "categoryName",
    "search",
    "pickup",
    "city",
    "location",
    "locationName",
    "availableOn",
    "start",
    "startDate",
    "availableFrom",
    "end",
    "endDate",
    "availableUntil",
    "page",
    "limit",
    "sort",
    "sortBy",
    "size",
  ];
  const hasFilterParams = seedKeys.some(
    (key) => getStringParam(resolvedSearchParams[key]).trim().length > 0,
  );

  const seeded = hasFilterParams
    ? undefined
    : await fetchCatalogProducts(resolvedSearchParams);

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
