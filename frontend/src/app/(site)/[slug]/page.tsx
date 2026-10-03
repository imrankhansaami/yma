import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { CmsSections } from "@/components/common/CmsSections";
import CtaReadySection from "@/components/sections/CtaReadySection";
import DynamicOneStopPartyShop from "@/components/sections/DynamicOneStopPartyShop";
import { normalizeCanonicalSlug } from "@/lib/canonical";
import { fetchPageContent } from "@/lib/pageContent";
import { buildSeoTitle, getSeoDefaults } from "@/lib/seo";

export const revalidate = 300;

type Params = { slug: string };

/** "bouncy-castles-hire-in-bow" -> "Bouncy Castles Hire In Bow" */
function toTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Only our own paths are safe to use as a canonical. */
function safeCanonical(value: string | undefined, key: string) {
  const raw = (value || "").trim();
  if (!raw) return `/${key}`;
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    if (/ymabouncycastles\.(uk|co\.uk)$/i.test(url.hostname)) return url.pathname;
  } catch {
    return `/${key}`;
  }
  return `/${key}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = normalizeCanonicalSlug(decodeURIComponent(slug || ""));
  const [cms, defaults] = await Promise.all([
    fetchPageContent("core", key),
    getSeoDefaults(),
  ]);

  if (!cms) return { title: "Page not found", robots: { index: false, follow: false } };

  const heading = cms.title?.trim() || toTitle(key);
  const title = buildSeoTitle(cms.metaTitle?.trim() || heading, defaults.siteName);
  const description =
    cms.metaDescription?.trim() ||
    `${heading} from YMA Bouncy Castles — safe, PIPA-tested inflatables delivered and set up by our own team.`;
  const canonical = safeCanonical(cms.canonicalUrl, key);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    keywords: (cms.metaKeywords || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    authors: [{ name: defaults.siteName }],
    creator: defaults.siteName,
    publisher: defaults.siteName,
    applicationName: defaults.siteName,
    referrer: "origin-when-cross-origin",
    openGraph: {
      title,
      description,
      url: `${defaults.defaultCanonicalBaseUrl}${canonical}`,
      type: "website",
      siteName: defaults.siteName,
      locale: "en_GB",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: heading,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

/**
 * Renders any `core` PageContent record at its own slug. This is what serves
 * the marketing and area pages imported from the old WordPress site — they are
 * managed in Admin → Pages → Core Pages like every other page.
 */
export default async function CmsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const key = normalizeCanonicalSlug(decodeURIComponent(slug || ""));
  const cms = await fetchPageContent("core", key);
  if (!cms) notFound();

  if (cms.isActive === false) notFound();

  const heading = cms.title?.trim() || toTitle(key);
  const showCatalogue = key.startsWith("bouncy-castles-hire");

  return (
    <main className="bg-white text-brand-ink-900 font-inter mt-16 md:mt-28">
      <CmsJsonLd jsonLd={cms.customJsonLd} id={`custom-jsonld-${key}`} />

      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-[13px] text-brand-gray-600">
          <Link href="/" className="hover:text-brand-ink-900">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-brand-gray-300" />
          <span className="text-[14px]">{heading}</span>
        </div>

        <h1 className="mt-5 font-inter font-semibold text-[26px] sm:text-[32px] md:text-[36px] leading-tight text-brand-ink-900">
          {heading}
        </h1>

        <CmsSections
          sections={cms.sections}
          className="w-full pt-8 pb-2 font-inter"
        />
      </div>

      {showCatalogue ? <DynamicOneStopPartyShop /> : null}

      <CtaReadySection />
    </main>
  );
}
