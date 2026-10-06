import type { Metadata } from "next";
import { SEO_STATIC } from "@/lib/seo-static";
import { buildSeoTitle } from "@/lib/seo";
import { fetchPageContent } from "@/lib/pageContent";
import { resolveCanonical } from "@/lib/canonical";

const DEFAULT_TITLE = "Contact Us | Get in Touch";
const DEFAULT_DESCRIPTION =
  "Contact YMA Bouncy Castles for bookings, inquiries, or event details. Call us at +44 7951 431111 or email info@ymabouncycastles.uk. Serving London, Essex, Birmingham & Coventry.";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchPageContent("core", "contact");

  const title = buildSeoTitle(cms?.metaTitle || DEFAULT_TITLE, SEO_STATIC.SITE_NAME);
  const description = cms?.metaDescription || DEFAULT_DESCRIPTION;
  const canonical = resolveCanonical(cms?.canonicalUrl, "/contact");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    authors: [{ name: SEO_STATIC.SITE_NAME }],
    creator: SEO_STATIC.CREATOR,
    publisher: SEO_STATIC.PUBLISHER,
    applicationName: SEO_STATIC.SITE_NAME,
    category: "Contact",
    referrer: "origin-when-cross-origin",
    openGraph: {
      title: cms?.metaTitle || "Contact YMA Bouncy Castles",
      description,
      url: canonical.startsWith("http") ? canonical : `${SEO_STATIC.BASE_URL}${canonical}`,
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
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
