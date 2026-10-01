import type { Metadata } from "next";

import { SEO_STATIC } from "@/lib/seo-static";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your booking with YMA Bouncy Castles.",
  alternates: {
    canonical: "/checkout",
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
    title: "Checkout | YMA Bouncy Castles",
    description: "Complete your booking with YMA Bouncy Castles.",
    url: `${SEO_STATIC.BASE_URL}/checkout`,
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
    title: "Checkout | YMA Bouncy Castles",
    description: "Complete your booking with YMA Bouncy Castles.",
    images: ["/og-image.jpg"],
  },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-inter mt-28 md:mt-40 pb-[var(--checkout-mobile-bar,0px)] overflow-x-hidden max-w-[1280px] mx-auto px-4">
      <div className="mx-auto w-full px-4 md:pb-10">
        <div className="">
          <h1 className="mb-4 text-[28px] font-semibold tracking-[-0.02em] text-ink-900 ">
            Checkout
          </h1>
        </div>
        <div className="bg-gray-200 w-full h-[1px]"></div>
      </div>
      <CheckoutClient />
    </main>
  );
}
