import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import LocationImg from "@/assets/images/location1.png";
import EastLondonImg from "@/assets/locations/east-london.jpg";
import EnfieldImg from "@/assets/locations/enfield.jpg";
import EssexImg from "@/assets/locations/essex.jpg";
import NorthLondonImg from "@/assets/locations/north-london.jpg";
import ReserveNowBtn from "@/components/common/btn/ReserveNowBtn";
import CtaReadySection from "@/components/sections/CtaReadySection";
import LocationShowcase from "@/components/sections/LocationShowcase";
import OneStopPartyShop from "@/components/sections/OneStopPartyShop";
import { Button } from "@/components/ui/button";
import {
  eastLondonAreas,
  enfieldAreas,
  essexAreas,
  northLondonAreas,
} from "@/data/locations";
import { SEO_STATIC } from "@/lib/seo-static";
import { fetchPageContent } from "@/lib/pageContent";
import type { LocationHubContent, PageBlock } from "@/lib/blocks/types";

export const metadata: Metadata = {
  title: "All Locations",
  description:
    "See every area we cover for bouncy castles, soft play, garden games, and fun food hire across the UK.",
  alternates: { canonical: "/locations" },
  keywords: [
    "bouncy castle hire locations",
    "party rentals UK",
    "soft play hire",
    "garden games hire",
    "YMA Bouncy Castles locations",
  ],
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  category: "Locations",
  referrer: "origin-when-cross-origin",
  openGraph: {
    title: "All Locations | YMA Bouncy Castles",
    description:
      "See every area we cover for bouncy castles, soft play, garden games, and fun food hire across the UK.",
    url: `${SEO_STATIC.BASE_URL}/locations`,
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

const heroCopy = {
  eyebrow: "Bouncy Castle Hire in UK",
  title: "We are available in more than 100 Locations in the UK!",
  description:
    "From combo castles to soft play and garden games, we bring unforgettable fun to 100+ UK locations with friendly, professional service.",
  subtext:
    "We cover East London, North London, Essex, Enfield, and nearby areas.",
};

const DEFAULT_SHOWCASE_COPY = [
  {
    title: "EAST LONDON",
    intro:
      "East London\u2019s vibrant mix of riverside districts, markets, and family neighborhoods.",
  },
  {
    title: "NORTH LONDON",
    intro:
      "North London\u2019s leafy parks, lively high streets, and close-knit communities.",
  },
  {
    title: "ESSEX",
    intro:
      "Essex towns and suburbs known for spacious gardens and family events.",
  },
  {
    title: "ENFIELD",
    intro:
      "Enfield\u2019s blend of suburban neighborhoods, green spaces, and local hubs.",
  },
];

export default async function LocationsPage() {
  // CMS-managed copy (Admin \u2192 Pages \u2192 Core \u2192 locations), with the
  // current copy as the fallback.
  const cms = await fetchPageContent("core", "locations");
  const hubBlock = ((cms?.sections || []) as PageBlock[]).find(
    (b) => b.type === "locationHub",
  )?.data as LocationHubContent | undefined;
  const hub: LocationHubContent = {
    ...{
      eyebrow: heroCopy.eyebrow,
      title: heroCopy.title,
      description: heroCopy.description,
      subtext: heroCopy.subtext,
      showcases: DEFAULT_SHOWCASE_COPY,
    },
    ...(hubBlock || {}),
  };
  const showcases = (hub.showcases || DEFAULT_SHOWCASE_COPY).slice(0, 4);
  const showCopy = (index: number) =>
    showcases[index] || DEFAULT_SHOWCASE_COPY[index];

  return (
    <main className="bg-white text-brand-ink-900 mt-16 md:mt-32 font-inter">
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-4  py-12  md:py-16 text-center">
          <p className="text-[11px] sm:text-sm capitalize text-brand-gray-500 font-medium mb-4 sm:mb-5 font-inter">
            {hub.eyebrow}
          </p>

          <h1 className="font-display text-[26px] sm:text-5xl md:text-5xl lg:text-6xl font-bold leading-snug text-brand-slate-900 mb-4 sm:mb-5">
            {hub.title}
          </h1>

          <p className="text-[14px] sm:text-lg md:text-lg leading-relaxed text-brand-gray-700 mx-auto mb-4 sm:mb-6 font-inter">
            {hub.description}
          </p>

          <p className="text-[14px] sm:text-base text-brand-gray-700 mx-auto mb-6 sm:mb-8 font-inter">
            {hub.subtext}
          </p>

          <div className="flex flex-nowrap items-center justify-center gap-3 sm:gap-4">
            <Button
              asChild
              className="h-10 sm:h-11 md:h-12 rounded-full bg-brand-green-500 hover:bg-brand-green-600 text-white border-[2px] text-base border-white shadow-sm px-6 sm:px-8 font-semibold min-w-[170px] flex items-center justify-center gap-2 transition-colors font-londrina"
            >
              <Link href="/contact">
                Contact Us
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            <ReserveNowBtn className="h-10 sm:h-11 md:h-12 px-6 sm:px-7" />
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-12 sm:pb-14 md:pb-16">
          <div className="overflow-hidden rounded-2xl">
            <Image
              src={LocationImg}
              alt="Our service locations map"
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>

        <LocationShowcase
          title={showCopy(0).title}
          intro={showCopy(0).intro}
          ctaHref="/booking-catalog?locationName=East%20London"
          ctaLabel="Reserve Now"
          imageSrc={EastLondonImg}
          imageLeft
          areas={eastLondonAreas}
        />

        <LocationShowcase
          title={showCopy(1).title}
          intro={showCopy(1).intro}
          ctaHref="/booking-catalog?locationName=North%20London"
          ctaLabel="Reserve Now"
          imageSrc={NorthLondonImg}
          areas={northLondonAreas}
        />

        <LocationShowcase
          title={showCopy(2).title}
          intro={showCopy(2).intro}
          ctaHref="/booking-catalog?locationName=Essex"
          ctaLabel="Reserve Now"
          imageSrc={EssexImg}
          imageLeft
          areas={essexAreas}
        />

        <LocationShowcase
          title={showCopy(3).title}
          intro={showCopy(3).intro}
          ctaHref="/booking-catalog?locationName=Enfield"
          ctaLabel="Reserve Now"
          imageSrc={EnfieldImg}
          areas={enfieldAreas}
        />
        {/* -------------------Product Catalogue--------------- */}
        <OneStopPartyShop />
        <CtaReadySection />
      </section>
    </main>
  );
}
