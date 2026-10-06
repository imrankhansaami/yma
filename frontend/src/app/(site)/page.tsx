import HeroSection from "@/components/sections/HeroSection";
import PickCastle from "@/components/sections/PickCastle";
import WhyChoose from "@/components/sections/WhyChoose";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import type { PageBlock } from "@/lib/blocks/types";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { SEO_STATIC } from "@/lib/seo-static";
import { buildSeoTitle } from "@/lib/seo";
import { resolveCanonical } from "@/lib/canonical";

const TopPicksSection = dynamic(
  () => import("@/components/sections/TopPicksSection"),
  {
    loading: () => <div className="h-72" />,
  },
);

const CastleHireSection = dynamic(
  () => import("@/components/sections/CastleHireSection"),
  {
    loading: () => <div className="h-72" />,
  },
);

const TestimonialSection = dynamic(
  () => import("@/components/sections/Testimonial"),
  {
    loading: () => <div className="h-72" />,
  },
);

const OneStopPartyShop = dynamic(
  () => import("@/components/sections/OneStopPartyShop"),
  {
    loading: () => <div className="h-96" />,
  },
);

const CtaReadySection = dynamic(
  () => import("@/components/sections/CtaReadySection"),
  {
    loading: () => <div className="h-48" />,
  },
);

const NewsletterSection = dynamic(
  () => import("@/components/sections/NewsletterSection"),
  {
    loading: () => <div className="h-56" />,
  },
);

// Defaults used when no CMS override is set
const DEFAULT_TITLE = "Bouncy Castle Hire | London, Essex, Birmingham & Coventry";
const DEFAULT_DESCRIPTION =
  "Book premium bouncy castles, soft play, garden games & fun foods for your party or event. Serving London, Essex, Enfield, Birmingham & Coventry. Free delivery available!";

import { fetchPageContent } from "@/lib/pageContent";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchPageContent("core", "home");

  const title = buildSeoTitle(cms?.metaTitle || DEFAULT_TITLE, SEO_STATIC.SITE_NAME);
  const description = cms?.metaDescription || DEFAULT_DESCRIPTION;

  // Always emit a canonical. Returning `undefined` here clobbered the root
  // layout's canonical and left the homepage with none.
  const canonical = resolveCanonical(cms?.canonicalUrl, "/");

  return {
    title,
    description,
    keywords: [
      "bouncy castle hire",
      "party rentals",
      "soft play hire",
      "garden games hire",
      "fun foods hire",
      "London bouncy castles",
      "Essex bouncy castles",
      "Birmingham bouncy castles",
      "Coventry bouncy castles",
    ],
    authors: [{ name: SEO_STATIC.SITE_NAME }],
    creator: SEO_STATIC.CREATOR,
    publisher: SEO_STATIC.PUBLISHER,
    applicationName: SEO_STATIC.SITE_NAME,
    category: "Party Rentals",
    referrer: "origin-when-cross-origin",
    alternates: { canonical },
    openGraph: {
      title: cms?.metaTitle || "Premium Party Hire",
      description,
      url:
        canonical === "/"
          ? SEO_STATIC.BASE_URL
          : canonical.startsWith("http")
            ? canonical
            : `${SEO_STATIC.BASE_URL}${canonical}`,
      type: "website",
      siteName: SEO_STATIC.SITE_NAME,
      locale: SEO_STATIC.LOCALE,
      images: [
        {
          url: SEO_STATIC.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SEO_STATIC.OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cms?.metaTitle || "Premium Party Hire",
      description,
      images: ["/og-image.jpg"],
    },
  };
}

const Page = async () => {
  const cms = await fetchPageContent("core", "home");
  const blocks = (cms?.sections || []) as PageBlock[];
  const hasBlocks = blocks.length > 0;

  return (
    <div>
      {hasBlocks ? (
        <PageBlocks blocks={blocks} />
      ) : (
        <>
          <HeroSection />
          <PickCastle />
          <TopPicksSection />
          <WhyChoose />
          <CastleHireSection />
          <TestimonialSection />
          <div className="px-4">
            <OneStopPartyShop />
            <CtaReadySection />
          </div>
          <NewsletterSection />
        </>
      )}
      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-home" />
    </div>
  );
};

export default Page;
