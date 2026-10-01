import { ChevronRight, Home } from "lucide-react";
import type { Metadata } from "next";

import BlogClient from "./BlogClient";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";

export const revalidate = 300;

type BlogsResponse = {
  data?: {
    blogs?: Array<{
      title?: string;
      subtitle?: string;
      description?: string;
      images?: string[];
    }>;
  };
};

async function fetchBlogHighlights() {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
  if (!baseUrl) return { items: [], image: "/og-image.jpg" };

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/blogs?page=1&limit=6&status=published&publishedOnly=true`,
      { next: { revalidate } },
    );
    if (!res.ok) return { items: [], image: "/og-image.jpg" };
    const data = (await res.json()) as BlogsResponse;
    const items = Array.isArray(data?.data?.blogs) ? data.data!.blogs! : [];
    const image = items?.[0]?.images?.[0] || "/og-image.jpg";
    return { items, image };
  } catch {
    return { items: [], image: "/og-image.jpg" };
  }
}

function stripHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata(): Promise<Metadata> {
  const { items, image } = await fetchBlogHighlights();
  const defaults = await getSeoDefaults();
  const titles = items
    .map((b) => b?.title)
    .filter((t): t is string => Boolean(t))
    .slice(0, 4);
  const highlighted = titles.length ? titles.join(", ") : "latest articles";
  const description =
    stripHtml(items?.[0]?.subtitle) ||
    stripHtml(items?.[0]?.description) ||
    `Discover expert advice, safety guidelines, and creative inspiration, including ${highlighted}.`;

  const title = "Blog";
  const seoTitle = buildSeoTitle(title, defaults.siteName);

  return {
    title: { absolute: seoTitle },
    description,
    authors: [{ name: defaults.siteName }],
    creator: defaults.siteName,
    publisher: defaults.siteName,
    applicationName: defaults.siteName,
    category: "Blog",
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical: "/blog",
    },
    keywords: mergeKeywords(defaults.defaultMetaKeywords, [
      "event planning",
      "party hire",
      "bouncy castle tips",
      "kids party ideas",
      `${defaults.siteName} blog`,
      ...titles,
    ]),
    openGraph: {
      title: seoTitle,
      description,
      url: `${defaults.defaultCanonicalBaseUrl}/blog`,
      type: "website",
      siteName: defaults.siteName,
      locale: "en_GB",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: "YMA Bouncy Castles Blog",
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

export default function BlogPage() {
  return (
    <section className="w-full font-inter bg-white mx-auto max-w-[1280px] mt-24 md:mt-32 sm:px-6">
      {/* Breadcrumb & Header Section */}
      <div className="bg-white px-4 sm:px-0 py-6 sm:py-8 border-b border-brand-gray-200">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brand-gray-600 mb-5">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 text-brand-gray-300" />
          <span className="text-[14px]">Blogs</span>
        </div>

        {/* Title and Description */}
        <div className="max-w-[768px]">
          <h1 className="text-brand-ink-900 font-semibold text-2xl sm:text-[28px] md:text-[30px] leading-[1.3] mb-3">
            Your Complete Event Planning Resource
          </h1>
          <p className="text-brand-gray-600 text-base sm:text-[18px] leading-[1.5]">
            Discover expert advice, safety guidelines, and creative inspiration
            to help you plan joyful, stress-free celebrations with YMA Bouncy
            Castle.
          </p>
        </div>
      </div>

      {/* Blog Grid Section */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        <BlogClient />
      </div>
    </section>
  );
}
