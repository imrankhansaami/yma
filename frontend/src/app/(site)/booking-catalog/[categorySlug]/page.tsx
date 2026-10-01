import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BookingCatalogSection from "@/components/catalog/BookingCatalogSection";
import BouncyCastleSeoContent from "@/components/catalog/BouncyCastleSeoContent";
import FunFoodSeoContent from "@/components/catalog/FunFoodSeoContent";
import GardenGamesSeoContent from "@/components/catalog/GardenGamesSeoContent";
import ObstacleCourseSlidesSeoContent from "@/components/catalog/ObstacleCourseSlidesSeoContent";
import SoftPlaySeoContent from "@/components/catalog/SoftPlaySeoContent";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd";
import { CATEGORY_PAGE_BY_SLUG } from "@/lib/category-pages";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";
import { joinCanonicalPath } from "@/lib/canonical";
import { fetchPageContent } from "@/lib/pageContent";
import Script from "next/script";

type Params = { categorySlug: string };
type SearchParams = Record<string, string | string[] | undefined>;
type CatalogCategory = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};
type CategoryProduct = {
  name: string;
  slug: string;
  image?: string;
};

const FILTER_PARAM_KEYS = new Set([
  "search",
  "sort",
  "pickup",
  "city",
  "location",
  "availableOn",
  "start",
  "end",
  "startDate",
  "endDate",
  "availableFrom",
  "availableUntil",
]);

function isNonEmptyParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === "string" && entry.trim());
  }
  return typeof value === "string" && value.trim().length > 0;
}

function hasActiveFilters(searchParams: SearchParams) {
  return Object.entries(searchParams).some(
    ([key, value]) => FILTER_PARAM_KEYS.has(key) && isNonEmptyParam(value),
  );
}

function normalizeCategoryToken(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/-hire$/i, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bhire\b/g, " ")
    .replace(/\bcastles\b/g, "castle")
    .replace(/\bgames\b/g, "game");
}

async function resolveCategoryId(baseUrl: string, categorySlug: string) {
  try {
    const res = await fetch(`${baseUrl}/api/v1/categories?page=1&limit=200`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return "";

    const data = await res.json();
    const categories = Array.isArray(data?.data?.categories)
      ? (data.data.categories as CatalogCategory[])
      : [];

    const normalizedSlug = categorySlug.toLowerCase();
    const normalizedToken = normalizeCategoryToken(categorySlug);

    const match = categories.find((category) => {
      const bySlug = String(category?.slug || "").toLowerCase() === normalizedSlug;
      const byName =
        normalizeCategoryToken(String(category?.name || "")) === normalizedToken;
      return bySlug || byName;
    });

    return String(match?._id || match?.id || "").trim();
  } catch {
    return "";
  }
}

async function fetchCategoryProducts(categorySlug: string): Promise<CategoryProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
  if (!baseUrl) return [];

  const categoryId = await resolveCategoryId(baseUrl, categorySlug);
  if (!categoryId) return [];

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/products?page=1&limit=8&category=${encodeURIComponent(categoryId)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];

    const data = await res.json();
    const payload = data?.data;
    const rawProducts = Array.isArray(payload)
      ? payload
      : (payload?.products ?? []);
    const products = Array.isArray(rawProducts) ? rawProducts : [];

    return products
      .filter((product: any) => {
        const stock = Number(
          product?.stock ?? product?.quantity ?? product?.availability?.availableStock ?? 0,
        );
        return Number.isFinite(stock) && stock > 0;
      })
      .map((product: any) => {
        const name = String(product?.name || "").trim();
        const slug = String(product?.slug || "").trim();
        const image = String(product?.imageCover || product?.images?.[0] || "").trim();
        return { name, slug, image };
      })
      .filter((product: CategoryProduct) => Boolean(product.name && product.slug))
      .slice(0, 6);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const config = CATEGORY_PAGE_BY_SLUG.get(categorySlug);
  const defaults = await getSeoDefaults();
  const resolvedSearchParams = await searchParams;
  const isFiltered = hasActiveFilters(resolvedSearchParams);

  if (!config) {
    return {
      title: { absolute: buildSeoTitle("Booking Catalog", defaults.siteName) },
      robots: { index: false, follow: false },
    };
  }

  // Fetch CMS overrides from PageContent API
  const pageContent = await fetchPageContent("category", config.slug);

  const seoTitle = buildSeoTitle(
    pageContent?.metaTitle || config.title,
    defaults.siteName,
  );
  const description = pageContent?.metaDescription || config.seoDescription;
  const canonicalPath = pageContent?.canonicalUrl ||
    joinCanonicalPath(["booking-catalog", config.slug]);

  return {
    title: { absolute: seoTitle },
    description,
    keywords: mergeKeywords(defaults.defaultMetaKeywords, [
      ...(pageContent?.metaKeywords
        ? pageContent.metaKeywords.split(",").map((k) => k.trim())
        : config.keywords),
      config.title,
      "booking catalog",
      "party hire",
    ]),
    alternates: {
      canonical: canonicalPath,
    },
    robots: isFiltered
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
      description: config.seoDescription,
      url: `${defaults.defaultCanonicalBaseUrl}${canonicalPath}`,
      type: "website",
      siteName: defaults.siteName,
      locale: "en_GB",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function CategoryCatalogPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { categorySlug } = await params;
  const config = CATEGORY_PAGE_BY_SLUG.get(categorySlug);
  if (!config) notFound();
  const defaults = await getSeoDefaults();
  const products = await fetchCategoryProducts(config.slug);
  const pageContent = await fetchPageContent("category", config.slug);
  const itemList = products.map((product) => ({
    name: product.name,
    url: `${defaults.defaultCanonicalBaseUrl}/product/${product.slug}`,
    image: product.image || `${defaults.defaultCanonicalBaseUrl}/og-image.jpg`,
  }));

  return (
    <>
      {pageContent?.customJsonLd && (
        <Script
          id={`custom-jsonld-category-${categorySlug}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: pageContent.customJsonLd }}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: defaults.defaultCanonicalBaseUrl },
          { name: "Booking Catalog", url: `${defaults.defaultCanonicalBaseUrl}/booking-catalog` },
          {
            name: config.title,
            url: `${defaults.defaultCanonicalBaseUrl}/booking-catalog/${config.slug}`,
          },
        ]}
      />
      {itemList.length > 0 ? (
        <ItemListJsonLd name={`${config.title} Products`} items={itemList} />
      ) : null}
      <BookingCatalogSection forcedCategoryName={config.slug} />
      {config.slug === "bouncy-castle-hire" ? <BouncyCastleSeoContent /> : null}
      {config.slug === "soft-play-hire" ? <SoftPlaySeoContent /> : null}
      {config.slug === "garden-games-hire" ? <GardenGamesSeoContent /> : null}
      {config.slug === "fun-food-hire" ? <FunFoodSeoContent /> : null}
      {config.slug === "obstacle-course-slides-hire" ? <ObstacleCourseSlidesSeoContent /> : null}
    </>
  );
}
