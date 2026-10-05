import BookingInfoStrip from "@/components/catalog/BookingInfoStrip";
import { RichText } from "@/components/common/RichText";
import { BlogPostingJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiBlog } from "@/services/blog.service";
import { ChevronRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";
import { joinCanonicalPath, normalizeCanonicalSlug } from "@/lib/canonical";

export const revalidate = 300;

type Params = { slug: string };

type BlogResponse = {
  data?: {
    blog?: ApiBlog;
  };
};

async function fetchBlog(slug: string): Promise<ApiBlog | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;

    const res = await fetch(`${baseUrl}/api/v1/blogs/slug/${slug}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as BlogResponse;
    return data?.data?.blog ?? null;
  } catch {
    return null;
  }
}

function stripHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeCanonicalSlug(
    value
      .replace(/<[^>]*>/g, "")
      .replace(/&[a-z0-9#]+;/gi, ""),
  );
}

function buildTocAndAnchoredHtml(html?: string | null) {
  // Imported article bodies often begin with their own <h1>, which would give
  // the page two H1s. Demote body H1s to H2 so the page title stays the only H1.
  const source = String(html || "").replace(
    /<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi,
    "<h2$1>$2</h2>",
  );
  const toc: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  const used = new Map<string, number>();

  const anchored = source.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_full, rawLevel, rawAttrs, rawText) => {
      const level = Number(rawLevel) as 2 | 3;
      const plain = stripHtml(rawText);
      if (!plain) return _full;

      const base = slugify(plain) || `section-${toc.length + 1}`;
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;

      toc.push({ id, text: plain, level });
      return `<h${level}${rawAttrs} id="${id}">${rawText}</h${level}>`;
    },
  );

  return { toc, html: anchored };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await fetchBlog(slug);
  if (!blog) {
    return {
      title: { absolute: "Blog Not Found | YMA" },
      description: "The requested blog could not be found.",
    };
  }

  const isPublished =
    blog.isPublished === true ||
    (blog.status ?? "").toLowerCase() === "published";
  if (!isPublished) {
    return {
      title: { absolute: "Blog Not Found | YMA" },
      description: "The requested blog could not be found.",
    };
  }

  const title = blog.metaTitle || blog.seoTitle || blog.title;
  const defaults = await getSeoDefaults();
  const seoTitle = buildSeoTitle(title, defaults.siteName);
  const description =
    blog.metaDescription ||
    blog.seoDescription ||
    stripHtml(blog.subtitle) ||
    stripHtml(blog.description);
  const image = blog.images?.[0] || "/og-image.jpg";
  const canonical = joinCanonicalPath([
    "blog",
    normalizeCanonicalSlug(blog.slug || slug),
  ]);
  if (canonical !== joinCanonicalPath(["blog", slug])) {
    permanentRedirect(canonical);
  }
  const keywords = mergeKeywords(
    defaults.defaultMetaKeywords,
    blog.seoKeywords ?? blog.tags ?? [],
  );

  return {
    title: { absolute: seoTitle },
    description,
    keywords,
    authors: [{ name: defaults.siteName }],
    creator: defaults.siteName,
    publisher: defaults.siteName,
    applicationName: defaults.siteName,
    category: "Blog",
    referrer: "origin-when-cross-origin",
    alternates: { canonical: blog.canonicalUrl || canonical },
    openGraph: {
      title: seoTitle,
      description,
      url: `${defaults.defaultCanonicalBaseUrl}${canonical}`,
      type: "article",
      siteName: defaults.siteName,
      locale: "en_GB",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: blog.imageAltText || title,
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

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const blogData = await fetchBlog(slug);

  const isPublished =
    blogData?.isPublished === true ||
    (blogData?.status ?? "").toLowerCase() === "published";

  if (!blogData || !isPublished) {
    notFound();
  }

  const blog = {
    title: blogData.title,
    subtitle: blogData.subtitle ?? "",
    description: blogData.description ?? "",
    featuredImage: blogData.images?.[0],
    author: blogData.author ?? {
      name: blogData.authorName ?? "",
      avatar: blogData.authorImage ?? undefined,
    },
  };
  const defaults = await getSeoDefaults();
  const canonicalPath = joinCanonicalPath([
    "blog",
    normalizeCanonicalSlug(blogData.slug || slug),
  ]);
  if (canonicalPath !== joinCanonicalPath(["blog", slug])) {
    permanentRedirect(canonicalPath);
  }
  const canonicalUrl = `${defaults.defaultCanonicalBaseUrl}${canonicalPath}`;
  const structuredDescription =
    stripHtml(blogData.subtitle) || stripHtml(blogData.description) || blogData.title;
  const structuredImage = blogData.images?.[0];
  const { toc, html } = buildTocAndAnchoredHtml(blog.description);

  return (
    <main className="w-full font-inter mx-auto max-w-[1280px] min-h-screen bg-white overflow-x-hidden mt-24 md:mt-32 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: defaults.defaultCanonicalBaseUrl },
          { name: "Blog", url: `${defaults.defaultCanonicalBaseUrl}/blog` },
          { name: blogData.title, url: canonicalUrl },
        ]}
      />
      <BlogPostingJsonLd
        headline={blogData.metaTitle || blogData.seoTitle || blogData.title}
        description={
          blogData.metaDescription || blogData.seoDescription || structuredDescription
        }
        image={structuredImage}
        authorName={blog.author?.name}
        datePublished={blogData.publishedAt || blogData.createdAt}
        dateModified={blogData.updatedAt}
        url={canonicalUrl}
        publisherName={defaults.siteName}
      />
      {blogData.customJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: blogData.customJsonLd }}
        />
      ) : null}
      <header className="px-4 sm:px-0 py-6 sm:py-8 min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-brand-gray-600 mb-5 flex-wrap min-w-0"
        >
          <Link href="/" aria-label="Home">
            <Home className="h-4 w-4 flex-shrink-0" />
          </Link>
          <ChevronRight className="h-4 w-4 text-brand-gray-300 flex-shrink-0" />
          <Link href="/blog" className="text-[14px] whitespace-nowrap hover:underline">
            Blogs
          </Link>
          <ChevronRight className="h-4 w-4 text-brand-gray-300 flex-shrink-0" />
          <span className="text-[14px] text-brand-gray-600 truncate min-w-0">
            {blog.title.length > 50
              ? blog.title.substring(0, 50) + "..."
              : blog.title}
          </span>
        </nav>

        <h1
          className="text-brand-ink-900 font-bold text-[30px] sm:text-[36px] leading-[1.15] tracking-[-0.02em] mb-4 max-w-[34ch] break-words"
          itemProp="headline"
        >
          {blog.title}
        </h1>

        <p
          className="text-brand-gray-700 text-[17px] sm:text-[20px] font-medium leading-[1.5] mb-6 sm:mb-8 max-w-[60ch] break-words"
          itemProp="description"
        >
          {blog.subtitle}
        </p>
      </header>

      <article className="px-4 sm:px-0 pb-12" itemScope itemType="https://schema.org/BlogPosting">
        {blog.featuredImage ? (
          <div className="pb-2">
            <div className="w-full overflow-hidden">
              <div className="relative w-full aspect-[240/150] sm:aspect-[16/10] rounded-lg overflow-hidden bg-brand-gray-90">
                <Image
                  src={blog.featuredImage}
                  alt={blogData.imageAltText || blog.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 768px"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-2">
            <div className="w-full overflow-hidden">
              <Skeleton className="w-full aspect-[240/150] sm:aspect-[16/10] rounded-lg" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,760px)_280px] gap-10 py-8">
          <div className="min-w-0">
            <RichText
              html={html}
              className="text-brand-black-950 text-[17px] sm:text-[18px] font-normal leading-[1.85] break-words max-w-[70ch] [&>h2]:mt-12 [&>h2]:mb-5 [&>h2]:text-[30px] [&>h2]:leading-[1.25] [&>h2]:font-bold [&>h3]:mt-10 [&>h3]:mb-4 [&>h3]:text-[24px] [&>h3]:leading-[1.3] [&>h3]:font-semibold [&>p]:mb-6 [&>ul]:mb-6 [&>ol]:mb-6 [&>blockquote]:my-8 [&>blockquote]:pl-4 [&>blockquote]:border-l-4 [&>blockquote]:border-brand-orange-300 [&>blockquote]:text-brand-gray-700"
            />
          </div>
          {toc.length > 0 ? (
            <aside className="lg:sticky lg:top-28 h-fit rounded-xl border border-brand-gray-200 bg-brand-gray-50 p-4">
              <p className="text-xs font-semibold tracking-[0.08em] uppercase text-brand-gray-600 mb-3">
                On this page
              </p>
              <nav aria-label="Table of contents">
                <ul className="space-y-2 text-sm leading-6">
                  {toc.map((item) => (
                    <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                      <a
                        href={`#${item.id}`}
                        className="text-brand-ink-900 hover:text-brand-orange-500 transition-colors"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          ) : null}
        </div>

        <div className="rounded-xl border border-brand-gray-200 p-5 sm:p-6 mt-2 mb-10 bg-white">
          <h2 className="text-xl sm:text-2xl font-semibold text-brand-ink-900">
            Continue Reading
          </h2>
          <p className="mt-2 text-sm sm:text-base text-brand-gray-650">
            Explore related resources and booking pages.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/blog" className="rounded-lg border border-brand-gray-200 p-3 hover:border-brand-orange-400">
              <p className="font-semibold text-brand-ink-900">More Articles</p>
              <p className="text-sm text-brand-gray-650 mt-1">Read latest planning and safety guides.</p>
            </Link>
            <Link href="/booking-catalog" className="rounded-lg border border-brand-gray-200 p-3 hover:border-brand-orange-400">
              <p className="font-semibold text-brand-ink-900">Browse Products</p>
              <p className="text-sm text-brand-gray-650 mt-1">See bouncy castles and soft play options.</p>
            </Link>
            <Link href="/contact" className="rounded-lg border border-brand-gray-200 p-3 hover:border-brand-orange-400">
              <p className="font-semibold text-brand-ink-900">Contact Team</p>
              <p className="text-sm text-brand-gray-650 mt-1">Get help choosing the right setup.</p>
            </Link>
          </div>
        </div>

        <BookingInfoStrip />
      </article>
    </main>
  );
}
