import type { Metadata } from "next";
import { SEO_STATIC } from "@/lib/seo-static";

export const metadata: Metadata = {
  title: "Booking Catalog | Browse Bouncy Castles & Party Hire",
  description:
    "Browse our full collection of bouncy castles, soft play equipment, garden games & fun foods available for hire in London, Essex, Enfield, Birmingham & Coventry.",
  alternates: {
    canonical: "/booking-catalog",
  },
  keywords: [
    "booking catalog",
    "bouncy castle hire",
    "soft play hire",
    "party rentals",
    "garden games hire",
  ],
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  category: "Catalog",
  referrer: "origin-when-cross-origin",
  openGraph: {
    title: "Booking Catalog | YMA Bouncy Castles",
    description:
      "Browse our full collection of bouncy castles, soft play equipment, garden games & fun foods available for hire.",
    url: `${SEO_STATIC.BASE_URL}/booking-catalog`,
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

export default function BookingCatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
