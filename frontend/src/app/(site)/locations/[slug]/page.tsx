import ReserveNowBtn from "@/components/common/btn/ReserveNowBtn";
import CtaReadySection from "@/components/sections/CtaReadySection";
import DynamicOneStopPartyShop from "@/components/sections/DynamicOneStopPartyShop";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { CheckCircle2, Home } from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import LocationDetailClient from "./LocationDetailClient";
import WhatsappBtn from "@/components/common/btn/WhatsappBtn";
import { RichText } from "@/components/common/RichText";
import {
  LocationBodyBlock,
  LocationHeroBlock,
} from "@/components/blocks/LocationBlocks";
import type {
  LocationBodyContent,
  LocationHeroContent,
  PageBlock,
} from "@/lib/blocks/types";
import { buildSeoTitle, getSeoDefaults, mergeKeywords } from "@/lib/seo";
import { joinCanonicalPath, normalizeCanonicalSlug } from "@/lib/canonical";
import { fetchPageContent } from "@/lib/pageContent";

type Params = { slug: string };
type ApiLocation = {
  name?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  content?: string;
  isActive?: boolean;
};

/** Hero copy for a location page, used until a `locationHero` block exists. */
function defaultHero(name: string): LocationHeroContent {
  return {
    title: `Turn Up the Fun with ${name}\u2019s Best Bouncy Castle Hire`,
    paragraphs: [
      `Bouncy castles, inflatable slides, and obstacle courses are the ultimate entertainment for any event, and YMA Bouncy Castles LTD is your trusted provider in ${name}. Whether it\u2019s a birthday party, a corporate gathering, a school fair, or a community festival, our inflatable castles, soft play areas, and themed designs deliver endless fun and excitement for all ages.`,
      `With safe, high-quality equipment like jumping castles, moon bounces, and inflatable water slides, YMA ensures every event runs smoothly. Our hassle-free service includes delivery, setup, and takedown, so you can focus on enjoying the celebration without worry. From small gardens to large outdoor spaces, we treat every venue professionally and carefully.`,
      `Looking to rent small bouncy castle units for a birthday or indoor party? Our online booking system makes it easy to find the perfect inflatable for your space. Use our live online booking system to check availability and secure your party inflatable rentals. Alternatively, reach out to us for prompt responses to your bouncy castle rental queries.`,
    ],
  };
}

/** Body copy for a location page, used until a `locationBody` block exists. */
function defaultBody(name: string): LocationBodyContent {
  return {
    aboutTitle: `Bouncy Castle Hire in ${name} \u2013 YMA Bouncy Castle LTD`,
    aboutParagraphs: [
      `YMA Bouncy Castle LTD specializes in offering high-quality bouncy castle hire services across ${name}. We provide a wide variety of inflatables, including bouncy castles, slides, obstacle courses, and soft play setups suitable for all ages. Whether you're organizing a birthday party, a school fair, a corporate event, or a public festival, our inflatables bring an extra dose of excitement to your special occasion.`,
      `Our team is committed to providing hassle-free service, with a strong focus on safety, customer satisfaction, and competitive pricing. We help you make your event memorable by ensuring fun-filled experiences for both children and adults. From the initial booking to the final takedown, our reliable service and attention to detail guarantee an unforgettable experience for you and your guests.`,
    ],
    whyTitle: "Why Choose YMA Bouncy Castle LTD?",
    whyItems: [
      {
        title: `Trusted Experts in ${name}`,
        body: "Our team is professional and reliable. With years of experience, we guarantee clear communication and attention to detail. From booking to setup, we make sure everything runs smoothly.",
      },
      {
        title: "Safety First",
        body: "All our inflatables are PIPA-certified, regularly inspected, and cleaned after every use. We follow strict safety guidelines and provide secure anchoring, ensuring your event is safe.",
      },
      {
        title: "Wide Range & Affordable Pricing",
        body: "We offer a variety of themes and sizes for all ages and budgets. Whether it\u2019s a princess castle for kids or an obstacle course for a team-building event, we have something for everyone.",
      },
      {
        title: "Fast Local Delivery",
        body: `We serve ${name} and surrounding areas, including Rush Green, Becontree, and Heathway. We offer prompt, free delivery and setup, ensuring your event is hassle-free.`,
      },
      {
        title: "Last-Minute Bookings Available",
        body: "Need a bouncy castle last minute? We offer emergency event solutions, with same-day or next-day bookings depending on availability.",
      },
    ],
    servicesTitle: "Our Bouncy Castle Hire Services",
    servicesItems: [
      {
        title: "Children's & Adult Bouncy Castles",
        body: "We offer bouncy castles in various sizes and themes. Whether you're planning a backyard party or a small indoor celebration, you can rent small bouncy castle units perfect for limited spaces. Our adult bouncy castles are built to last, using reinforced materials for added durability.",
      },
      {
        title: "Themed Bouncy Castles",
        body: "Choose from a range of exciting themes like superheroes, princess castles, jungle adventures, and disco domes. Perfect for all ages, these inflatables add extra fun to your event.",
      },
      {
        title: "Inflatable Slides & Obstacle Courses",
        body: "For a more exciting experience, we have giant inflatable slides and obstacle courses. These are ideal for both kids and adults and bring interactive fun to your event.",
      },
      {
        title: "Soft Play & Ball Pits",
        body: "We provide soft play setups and ball pits for toddlers. These are designed to offer a safe and fun space for younger children to play.",
      },
      {
        title: "Garden Games & Fun Food",
        body: "Make your event even more enjoyable with interactive games and food options. We offer giant board games, Nerf shooting, penalty shootouts, and machines for popcorn and candy floss.",
      },
      {
        title: "Flexible Setup Options",
        body: "We can set up inflatables indoors or outdoors on grass, artificial turf, or hard surfaces, with safety mats for added protection. We ensure everything is securely installed for a worry-free event.",
      },
    ],
    safetyTitle: "Bouncy Castle Safety & Quality",
    safetyItems: [
      {
        title: "Safety Standards",
        body: "We adhere to the highest UK safety standards. All our inflatables are fully insured and PIPA safety tested.",
      },
      {
        title: "Professional Setup & Takedown",
        body: "Our team installs and secures each inflatable to prevent accidents, ensuring a safe environment for your guests.",
      },
      {
        title: "Risk Assessments & Guidelines",
        body: "We provide clear usage instructions and perform safety checks before each hire. We also offer guidance in case of bad weather or strong winds.",
      },
    ],
    occasionsTitle: "Perfect for Every Occasion",
    occasionsSubtitle: "Our Bouncy Castle Hire Service Is Perfect For:",
    occasionsItems: [
      "Birthday Parties \u2013 Create lasting memories with hours of fun.",
      "School Events & Fairs \u2013 Safe, engaging activities for kids at school fundraisers.",
      "Corporate Events \u2013 Add excitement to company parties and team-building events.",
      "Community & Charity Events \u2013 Great for local fundraisers and gatherings.",
      "Weddings & Family Gatherings \u2013 Keep the kids entertained while adults celebrate.",
      "Public Festivals & Carnivals \u2013 We cater to large-scale events and festivals.",
    ],
  };
}

function toTitle(value: string) {
  if (!value) return "Location";
  return value
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function fetchLocationBySlug(slug: string): Promise<ApiLocation | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;
    const res = await fetch(`${baseUrl}/api/v1/locations/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const routeSlug = normalizeCanonicalSlug(decodeURIComponent(slug || ""));
  const resolvedLocation = await fetchLocationBySlug(routeSlug);
  if (!resolvedLocation) notFound();
  const canonicalSlug = normalizeCanonicalSlug(resolvedLocation?.slug || routeSlug);
  if (canonicalSlug && canonicalSlug !== routeSlug) {
    permanentRedirect(joinCanonicalPath(["locations", canonicalSlug]));
  }
  const decoded = normalizeCanonicalSlug(resolvedLocation?.name || canonicalSlug).replace(
    /-/g,
    " ",
  );
  const locationName = toTitle(decoded);

  const defaults = await getSeoDefaults();
  const title = resolvedLocation?.metaTitle || `Bouncy Castles Hire in ${locationName}`;
  const seoTitle = buildSeoTitle(title, defaults.siteName);
  const description = resolvedLocation?.metaDescription ||
    `Premium bouncy castle hire in ${locationName}. Book inflatables, soft play, and party rentals with fast delivery.`;
  const canonical = joinCanonicalPath(["locations", canonicalSlug]);

  return {
    title: { absolute: seoTitle },
    description,
    keywords: mergeKeywords(defaults.defaultMetaKeywords, [
      "bouncy castle hire",
      "party rentals",
      locationName,
    ]),
    authors: [{ name: defaults.siteName }],
    creator: defaults.siteName,
    publisher: defaults.siteName,
    applicationName: defaults.siteName,
    category: "Locations",
    referrer: "origin-when-cross-origin",
    alternates: { canonical },
    openGraph: {
      title: seoTitle,
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
          alt: `Bouncy Castles Hire in ${locationName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export const revalidate = 300;

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const routeSlug = normalizeCanonicalSlug(decodeURIComponent(slug || ""));
  const resolvedLocation = await fetchLocationBySlug(routeSlug);

  // Unknown slug must be a real 404, not a 200 with a made-up heading.
  if (!resolvedLocation) {
    notFound();
  }

  const canonicalSlug = normalizeCanonicalSlug(resolvedLocation?.slug || routeSlug);
  if (canonicalSlug && canonicalSlug !== routeSlug) {
    permanentRedirect(joinCanonicalPath(["locations", canonicalSlug]));
  }

  // A location toggled off in the admin must not be publicly reachable.
  if (resolvedLocation.isActive === false) {
    notFound();
  }

  const decoded = normalizeCanonicalSlug(resolvedLocation?.name || canonicalSlug).replace(
    /-/g,
    " ",
  );
  const locationName = toTitle(decoded);
  const defaults = await getSeoDefaults();

  // CMS-managed copy (edited in Admin → Pages → Locations).
  const locationDescription =
    resolvedLocation?.description?.trim() ||
    `Premium bouncy castle hire in ${locationName}, delivered on time and loved by kids and adults alike.`;
  const locationContentHtml = resolvedLocation?.content?.trim() || "";

  // CMS-managed page blocks (Admin → Pages → Locations), with the current
  // copy as the fallback so every location page renders unchanged.
  const locationCms = await fetchPageContent("location", canonicalSlug);
  const locationBlocks = (locationCms?.sections || []) as PageBlock[];
  const heroBlock = locationBlocks.find((b) => b.type === "locationHero")?.data as
    | LocationHeroContent
    | undefined;
  const bodyBlock = locationBlocks.find((b) => b.type === "locationBody")?.data as
    | LocationBodyContent
    | undefined;
  const hero: LocationHeroContent = {
    ...defaultHero(locationName),
    ...(heroBlock || {}),
  };
  const body: LocationBodyContent = {
    ...defaultBody(locationName),
    ...(bodyBlock || {}),
  };

  return (
    <main className="bg-white mt-16 md:mt-24 font-inter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: defaults.defaultCanonicalBaseUrl },
          { name: "Locations", url: `${defaults.defaultCanonicalBaseUrl}/locations` },
          {
            name: locationName,
            url: `${defaults.defaultCanonicalBaseUrl}/locations/${canonicalSlug}`,
          },
        ]}
      />
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-0 py-12 sm:py-14 md:py-16">
        <div className="flex items-center gap-2 text-sm text-brand-gray-650">
          <Home className="h-4 w-4" />
          <span className="text-brand-gray-400">/</span>
          <span className="text-brand-gray-700">
            Bouncy Castles Hire in {locationName}
          </span>
        </div>

        <div className="border-b border-brand-gray-175 py-6 sm:py-7">
          <h1 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
            Bouncy Castles Hire in {locationName}
          </h1>
          <p className="mt-2 text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed">
            {locationDescription}
          </p>
        </div>
        {/* --------------Hero Section---------------- */}
        <div className="grid grid-cols-1 gap-10 md:gap-16 md:grid-cols-2 items-stretch py-12 sm:py-14 md:py-16">
          <div className="space-y-4 text-brand-ink-900">
            <LocationHeroBlock content={hero} />

            <div className="mt-6 sm:mt-8 flex flex-row items-center  gap-3 sm:gap-4 font-londrina! w-full ">
              <WhatsappBtn />
              <ReserveNowBtn
                href={`/booking-catalog?locationName=${encodeURIComponent(
                  locationName,
                )}`}
                className="h-10 sm:h-11 md:h-12 px-6 sm:px-7"
              />
            </div>
          </div>

          <div className="relative h-full overflow-hidden rounded-xl border border-brand-gray-175 shadow-sm">
            <iframe
              title={`${locationName} map`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                locationName,
              )}&z=12&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0 min-h-[280px]"
              allowFullScreen
            />
          </div>
        </div>

        {/* --------------CMS Content (Admin → Pages → Locations)-------- */}
        {locationContentHtml ? (
          <RichText
            html={locationContentHtml}
            className="pb-4 prose-headings:text-brand-ink-900 prose-p:text-brand-gray-450"
          />
        ) : null}

        {/* --------------Product Catalogue------------ */}
        <DynamicOneStopPartyShop locationName={locationName} />

        {/* -------------CTA--------------------- */}
        <CtaReadySection />

        <LocationBodyBlock content={body} />

        <div className="pt-8 space-y-4">
          <LocationDetailClient locationName={locationName} />
        </div>
      </div>
    </main>
  );
}
