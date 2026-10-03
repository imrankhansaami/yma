import HeroSection from "@/components/sections/HeroSection";
import PickCastle from "@/components/sections/PickCastle";
import WhyChoose from "@/components/sections/WhyChoose";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { CmsSections } from "@/components/common/CmsSections";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { SEO_STATIC } from "@/lib/seo-static";

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

  const title = cms?.metaTitle || DEFAULT_TITLE;
  const description = cms?.metaDescription || DEFAULT_DESCRIPTION;

  // Always emit a canonical. Returning `undefined` here clobbered the root
  // layout's canonical and left the homepage with none.
  const canonical =
    typeof cms?.canonicalUrl === "string" && cms.canonicalUrl.trim().startsWith("/")
      ? cms.canonicalUrl.trim()
      : "/";

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
      title: cms?.metaTitle || "YMA Bouncy Castles | Premium Party Hire",
      description,
      url: SEO_STATIC.BASE_URL,
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
      title: cms?.metaTitle || "YMA Bouncy Castles | Premium Party Hire",
      description,
      images: ["/og-image.jpg"],
    },
  };
}

const Page = async () => {
  const cms = await fetchPageContent("core", "home");
  return (
    <div>
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
      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-home" />
      <CmsSections sections={cms?.sections} />
    </div>
  );
};

export default Page;
