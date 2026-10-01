import type { Metadata } from "next";

import CartClient from "./CartClient";
import { SEO_STATIC } from "@/lib/seo-static";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description:
    "Review your selected rentals and proceed to checkout with YMA Bouncy Castles.",
  alternates: {
    canonical: "/cart",
  },
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  referrer: "origin-when-cross-origin",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Shopping Cart | YMA Bouncy Castles",
    description:
      "Review your selected rentals and proceed to checkout with YMA Bouncy Castles.",
    url: `${SEO_STATIC.BASE_URL}/cart`,
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
    title: "Shopping Cart | YMA Bouncy Castles",
    description:
      "Review your selected rentals and proceed to checkout with YMA Bouncy Castles.",
    images: ["/og-image.jpg"],
  },
};

export default function CartPage() {
  return <CartClient />;
}
