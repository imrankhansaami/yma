import At from "@/assets/at-sign.svg";
import Facebook from "@/assets/Social icon.svg";
import ReserveNowBtn from "@/components/common/btn/ReserveNowBtn";
import WhatsappBtn from "@/components/common/btn/WhatsappBtn";
import { ChevronRight, Home, Instagram, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { CmsSections } from "@/components/common/CmsSections";
import { fetchPageContent } from "@/lib/pageContent";
import { SEO_STATIC } from "@/lib/seo-static";
import type { ContactPageContent, PageBlock } from "@/lib/blocks/types";

import ContactFormClient from "./ContactFormClient";

/** Default content for the Contact page, used until a CMS block exists. */
const DEFAULT_CONTACT_PAGE: ContactPageContent = {
  badge: "Contact Us",
  title: "Let's plan a party with a little bounce.",
  intro:
    "Tell us a little about your event, and we'll help you pick the best bouncy castle setup for your space and guests.",
  pills: ["Fast replies", "Safe & clean", "Local delivery"],
  stepsLabel: "How it works",
  stepsTitle: "Talk to our team today",
  steps: [
    "Share your date, location, and guest count.",
    "We recommend the right inflatables and extras.",
    "Confirm your quote and we'll handle the rest.",
  ],
  detailsLabel: "Contact details",
  detailsHeading: "Find YMA Bouncy Castles",
  phone: "07951431111",
  email: "info@ymabouncycastles.uk",
  facebook:
    "https://www.facebook.com/people/YMA-Bouncy-Castles-LTD/100092844622235",
  instagram: "https://www.instagram.com/yma.bouncycastles",
  formBadges: ["Bookings Open", "Quick Replies"],
};

const PILL_TONES = [
  "border-brand-orange-500/30 bg-brand-orange-50 text-brand-orange-500",
  "border-brand-green-500/30 bg-brand-green-50 text-brand-green-600",
  "border-brand-blue-500/30 bg-brand-blue-50 text-brand-blue-500",
];

const STEP_TONES = ["bg-brand-orange-100", "bg-brand-blue-50", "bg-brand-green-50"];

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to YMA Bouncy Castles for bookings, inquiries, or event details.",
  keywords: [
    "contact YMA Bouncy Castles",
    "bouncy castle bookings",
    "party rentals contact",
  ],
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  category: "Contact",
  referrer: "origin-when-cross-origin",
  openGraph: {
    title: "Contact YMA Bouncy Castles",
    description:
      "Reach out to YMA Bouncy Castles for bookings, inquiries, or event details.",
    url: `${SEO_STATIC.BASE_URL}/contact`,
    type: "website",
    siteName: SEO_STATIC.SITE_NAME,
    locale: SEO_STATIC.LOCALE,
    images: [
      {
        url: SEO_STATIC.OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Contact YMA Bouncy Castles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact YMA Bouncy Castles",
    description:
      "Reach out to YMA Bouncy Castles for bookings, inquiries, or event details.",
    images: ["/og-image.jpg"],
  },
};

export default async function ContactPage() {
  const cms = await fetchPageContent("core", "contact");
  const block = ((cms?.sections || []) as PageBlock[]).find(
    (b) => b.type === "contactPage",
  );
  const c: ContactPageContent = {
    ...DEFAULT_CONTACT_PAGE,
    ...((block?.data as Partial<ContactPageContent>) || {}),
  };
  const pills = c.pills?.length ? c.pills : DEFAULT_CONTACT_PAGE.pills;
  const steps = c.steps?.length ? c.steps : DEFAULT_CONTACT_PAGE.steps;
  const formBadges = c.formBadges?.length
    ? c.formBadges
    : DEFAULT_CONTACT_PAGE.formBadges;
  return (
    <main className="w-full bg-white text-brand-ink-900 font-inter mt-28 md:mt-40 max-w-[1280px] mx-auto sm:px-6">
      <div className="mx-auto w-full px-4 sm:px-0 pb-16 sm:pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brand-gray-600 mb-5">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 text-brand-gray-300" />
          <span className="text-[14px]">Contact</span>
        </div>

        {/* Two-column layout (reference layout, homepage theme) */}
        <section className="relative mt-6 sm:mt-8 overflow-hidden rounded-none border-0 bg-white  py-8 sm:rounded-[28px] sm:border sm:border-brand-gray-170 sm:px-6 sm:py-10 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="contents lg:block">
              <div className="relative order-1 lg:order-none">
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange-500/30 bg-brand-orange-50 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-orange-500 shadow-[0_6px_14px_var(--alpha-black-6)]">
                  {c.badge}
                </div>
                <h1 className="mt-4 font-display text-[36px] sm:text-[44px] leading-[1.1] text-brand-ink-900">
                  {c.title}
                </h1>
                <p className="mt-3 text-[15px] sm:text-[16px] text-brand-gray-700 max-w-[520px]">
                  {c.intro}
                </p>
              </div>
            </div>

              <div className="relative order-3 lg:order-none">
              <div className="relative">
                <div className="mt-0 lg:mt-6 grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-3 sm:text-[13px] font-semibold">
                  {pills.map((pill, i) => (
                    <span
                      key={`${pill}-${i}`}
                      className={`rounded-2xl border px-3 py-2 shadow-[0_10px_24px_var(--alpha-black-6)] ${
                        PILL_TONES[i % PILL_TONES.length]
                      }`}
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-brand-gray-200 bg-white p-6 shadow-[0_10px_30px_var(--alpha-black-8)]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue-500/30 bg-brand-blue-50 px-3 py-1 text-[12px] font-semibold text-brand-blue-500">
                    {c.stepsLabel}
                  </div>
                  <h3 className="mt-3 text-[16px] font-semibold text-brand-ink-900">
                    {c.stepsTitle}
                  </h3>
                  <ol className="mt-3 space-y-2 text-[14px] text-brand-gray-700">
                    {steps.map((step, i) => (
                      <li key={`${step}-${i}`} className="flex items-center gap-3">
                        <span
                          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-brand-ink-900 ${
                            STEP_TONES[i % STEP_TONES.length]
                          }`}
                        >
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-6 flex flex-nowrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                  <WhatsappBtn className="!w-auto" />
                  <ReserveNowBtn className="w-auto" />
                </div>

                <div className="mt-6 rounded-2xl border border-brand-gray-200 bg-white p-6 shadow-[0_10px_30px_var(--alpha-black-8)]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-green-500/30 bg-brand-green-50 px-3 py-1 text-[12px] font-semibold text-brand-green-600">
                    {c.detailsLabel}
                  </div>
                  <h3 className="mt-3 text-[16px] font-semibold text-brand-ink-900">
                    {c.detailsHeading}
                  </h3>
                  <div className="mt-4 space-y-3 text-[14px] text-brand-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-brand-gray-200 bg-brand-blue-50">
                        <Phone className="h-4 w-4 text-brand-ink-900" />
                      </span>
                      <a
                        href={`tel:${c.phone}`}
                        className="font-semibold text-brand-ink-900 underline underline-offset-[3px]"
                      >
                        {c.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-brand-gray-200 bg-brand-green-50">
                        <Image src={At} height={18} width={18} alt="email" />
                      </span>
                      <a
                        href={`mailto:${c.email}`}
                        className="font-semibold text-brand-ink-900 underline underline-offset-[3px]"
                      >
                        {c.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-5">
                  <a
                    href={c.facebook}
                    aria-label="Facebook"
                    className="text-brand-ink-900 hover:text-brand-gray-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={Facebook}
                      height={24}
                      width={24}
                      alt="facebook"
                    />
                  </a>
                  <a
                    href={c.instagram}
                    aria-label="Instagram"
                    className="text-brand-ink-900 hover:text-brand-gray-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>
            </div>

            <div className="relative order-2 lg:order-none">
              <div className="relative rounded-[22px] border border-brand-gray-200 bg-white p-5 shadow-[0_18px_40px_var(--alpha-black-12)] sm:rounded-[28px] sm:p-6 sm:shadow-[0_28px_60px_var(--alpha-black-15)] md:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {formBadges.map((badge, i) => (
                    <span
                      key={`${badge}-${i}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold shadow-[0_6px_14px_var(--alpha-black-6)] ${
                        i % 2 === 0
                          ? "border-brand-orange-500/30 bg-brand-orange-50 text-brand-orange-500"
                          : "border-brand-blue-500/30 bg-brand-blue-50 text-brand-blue-500"
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-[22px] sm:border sm:border-brand-gray-170 sm:bg-white sm:p-5 sm:shadow-[0_12px_30px_var(--alpha-black-6)] md:p-6">
                  <ContactFormClient />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-contact" />
      <CmsSections sections={cms?.sections} />
    </main>
  );
}
