import { ChevronRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SEO_STATIC } from "@/lib/seo-static";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "A sample page on the YMA Bouncy Castles website. It is not a hire listing.",
  alternates: {
    canonical: "/demo",
  },
  robots: {
    index: false,
    follow: false,
  },
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  referrer: "origin-when-cross-origin",
  openGraph: {
    title: "Demo",
    description:
      "A sample page on the YMA Bouncy Castles website. It is not a hire listing.",
    url: `${SEO_STATIC.BASE_URL}/demo`,
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

export default function DemoPage() {
  return (
    <main className="mx-auto mt-28 w-full max-w-[1280px] bg-white font-inter text-brand-ink-900 sm:px-6 md:mt-40">
      <div className="mx-auto w-full px-4 pb-16 sm:px-0 sm:pb-20">
        <div className="mb-5 flex items-center gap-2 text-sm text-brand-gray-600">
          <Link href="/" aria-label="Home" className="inline-flex">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-brand-gray-300" />
          <span className="text-[14px]">Demo</span>
        </div>

        <section className="relative mt-6 overflow-hidden bg-white py-8 sm:mt-8 sm:rounded-[28px] sm:border sm:border-brand-gray-170 sm:px-6 sm:py-10 md:px-10 lg:px-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange-500/30 bg-brand-orange-50 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-orange-500 shadow-[0_6px_14px_var(--alpha-black-6)]">
            Sample page
          </div>
          <h1 className="mt-4 font-display text-[36px] leading-[1.1] text-brand-ink-900 sm:text-[44px]">
            This is a demo page
          </h1>
          <p className="mt-3 max-w-[640px] text-[15px] text-brand-gray-700 sm:text-[16px]">
            It uses the same header and footer as the rest of the YMA Bouncy
            Castles site. It is not a new hire product, and search engines are
            asked not to index it.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 text-[13px] font-semibold sm:grid-cols-3">
            <div className="rounded-2xl border border-brand-orange-500/30 bg-brand-orange-50 px-4 py-3 text-brand-orange-500 shadow-[0_10px_24px_var(--alpha-black-6)]">
              Same site chrome
            </div>
            <div className="rounded-2xl border border-brand-blue-500/30 bg-brand-blue-50 px-4 py-3 text-brand-blue-500 shadow-[0_10px_24px_var(--alpha-black-6)]">
              Not in the menu
            </div>
            <div className="rounded-2xl border border-brand-green-500/30 bg-brand-green-50 px-4 py-3 text-brand-green-600 shadow-[0_10px_24px_var(--alpha-black-6)]">
              Hidden from search
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-brand-orange-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_18px_var(--alpha-black-25)] transition-transform hover:scale-[1.02]"
            >
              Back to the homepage
            </Link>
            <Link
              href="/booking-catalog"
              className="inline-flex items-center justify-center rounded-full border border-brand-gray-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-brand-ink-900"
            >
              Browse the catalogue
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-brand-gray-200 bg-white px-5 py-2.5 text-[14px] font-semibold text-brand-ink-900"
            >
              Contact
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
