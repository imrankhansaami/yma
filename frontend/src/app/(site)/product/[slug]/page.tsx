import type { Metadata } from "next";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/JsonLd";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";
import { joinCanonicalPath, normalizeCanonicalSlug } from "@/lib/canonical";
import { SHOW_PRODUCT_REVIEWS } from "@/lib/features";
import type { ApiProduct } from "@/services/product.service";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { PRODUCTS_TAG, productTag } from "@/lib/productTags";
import ProductClient from "./ProductClient";

// Prerendered (ISR). If this route renders on demand, Next streams the HTML shell
// before generateMetadata() has resolved the product fetch, and the title,
// description, canonical and robots end up in the body — where search engines
// ignore the canonical. Prerendering keeps them in <head>.
export const revalidate = 300;

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return [];

    const res = await fetch(`${baseUrl}/api/v1/products?limit=500`, {
      next: { revalidate: 300, tags: [PRODUCTS_TAG] },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { data?: Array<{ slug?: string }> };
    const products = Array.isArray(data?.data) ? data.data : [];

    return products
      .map((product) => ({ slug: String(product?.slug || "").trim() }))
      .filter((entry) => entry.slug.length > 0);
  } catch {
    // Never fail the build on a data hiccup: the pages fall back to on-demand
    // rendering until the next successful build.
    return [];
  }
}

type Params = { slug: string };

type ProductResponse = {
  data?: {
    product?: ApiProduct;
  };
};

async function fetchProductBySlug(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;

    const res = await fetch(`${baseUrl}/api/v1/products/slug/${slug}`, {
      next: {
        // Short window: a product becomes bookable again the day after its
        // booked range ends, and nothing purges the tag at that moment.
        revalidate: 300,
        // Tagged so an admin edit can purge this exact entry via /api/revalidate.
        tags: [PRODUCTS_TAG, productTag(slug)],
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as ProductResponse;
    return data?.data?.product ?? null;
  } catch {
    return null;
  }
}

function toSlug(value?: string | null) {
  return normalizeCanonicalSlug(value);
}

function resolveProductSlug(
  product: { slug?: string; name?: string } | null,
  fallback: string,
) {
  const fromModel = String(product?.slug || "").trim();
  if (fromModel) return fromModel;
  const fromName = toSlug(product?.name);
  return fromName || fallback;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return {
      title: { absolute: "Product Not Found" },
      description: "The requested product could not be found.",
    };
  }

  const defaults = await getSeoDefaults();
  const title = product.metaTitle || product.name || "Product Details";
  const seoTitle = buildSeoTitle(title, defaults.siteName);
  const description =
    product.metaDescription ||
    product.summary ||
    product.description ||
    "View product details and book now.";
  const image = product.imageCover || product.images?.[0] || "/og-image.jpg";
  const productSlug = resolveProductSlug(product, toSlug(slug));
  if (productSlug && productSlug !== toSlug(slug)) {
    permanentRedirect(joinCanonicalPath(["product", productSlug]));
  }
  const canonicalPath = joinCanonicalPath(["product", productSlug]);
  const url = `${defaults.defaultCanonicalBaseUrl}${canonicalPath}`;
  const canonical = product.canonicalUrl || canonicalPath;

  return {
    title: { absolute: seoTitle },
    description,
    keywords: mergeKeywords(defaults.defaultMetaKeywords, [
      title,
      "bouncy castle hire",
      "party rental",
      "book now",
    ]),
    authors: [{ name: defaults.siteName }],
    creator: defaults.siteName,
    publisher: defaults.siteName,
    applicationName: defaults.siteName,
    category: "Product",
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical,
    },
    openGraph: {
      title: seoTitle,
      description,
      url,
      type: "website",
      siteName: defaults.siteName,
      locale: "en_GB",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt:
            product.imageCoverAltText ||
            product.imageAltText ||
            product.imageAltTexts?.[0] ||
            product.name ||
            title,
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

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    notFound();
  }
  const defaults = await getSeoDefaults();
  const productSlug = resolveProductSlug(product, toSlug(slug));
  if (productSlug && productSlug !== toSlug(slug)) {
    permanentRedirect(joinCanonicalPath(["product", productSlug]));
  }
  const productCanonicalPath = joinCanonicalPath(["product", productSlug]);
  const productUrl = `${defaults.defaultCanonicalBaseUrl}${productCanonicalPath}`;
  const productDescription =
    product?.summary || product?.description || "View product details and book now.";
  const productImage = product?.imageCover || product?.images?.[0] || "/og-image.jpg";
  const productPrice = Number(product?.priceDiscount ?? product?.price ?? 0);

  return (
    <>
      {product?.name ? (
        <>
          <BreadcrumbJsonLd
            items={[
              { name: "Home", url: defaults.defaultCanonicalBaseUrl },
              { name: "Booking Catalog", url: `${defaults.defaultCanonicalBaseUrl}/booking-catalog` },
              { name: product.name, url: productUrl },
            ]}
          />
          <ProductJsonLd
            name={product.name}
            description={productDescription}
            image={productImage}
            sku={product.sku}
            price={productPrice}
            availability={(Number(product?.availability?.availableStock ?? product?.stock ?? 0) > 0 ? "InStock" : "OutOfStock")}
            url={productUrl}
            ratingValue={SHOW_PRODUCT_REVIEWS ? product.ratingsAverage : undefined}
            ratingCount={SHOW_PRODUCT_REVIEWS ? product.ratingsQuantity : undefined}
          />
          {product.customJsonLd ? (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: product.customJsonLd }}
            />
          ) : null}
        </>
      ) : null}
      <Suspense fallback={null}>
        <ProductClient initialProduct={product} />
      </Suspense>
    </>
  );
}
