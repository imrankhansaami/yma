import { ChevronRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FAQPageJsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import { FaqSection } from "@/components/blocks/FaqAccordion";
import type { FaqItem, PageBlock } from "@/lib/blocks/types";
import { SEO_STATIC } from "@/lib/seo-static";
import { buildSeoTitle } from "@/lib/seo";
import { fetchPageContent } from "@/lib/pageContent";
import { resolveCanonical } from "@/lib/canonical";

const DEFAULT_TITLE = "FAQs";
const DEFAULT_DESCRIPTION =
  "Get answers to common questions about bouncy castle rentals, booking, safety, and service areas.";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchPageContent("core", "faqs");

  const title = buildSeoTitle(cms?.metaTitle || DEFAULT_TITLE, SEO_STATIC.SITE_NAME);
  const description = cms?.metaDescription || DEFAULT_DESCRIPTION;
  const canonical = resolveCanonical(cms?.canonicalUrl, "/faqs");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    keywords: [
      "bouncy castle FAQs",
      "party hire questions",
      "rental policies",
      "YMA Bouncy Castles help",
    ],
    authors: [{ name: SEO_STATIC.SITE_NAME }],
    creator: SEO_STATIC.CREATOR,
    publisher: SEO_STATIC.PUBLISHER,
    applicationName: SEO_STATIC.SITE_NAME,
    category: "FAQ",
    referrer: "origin-when-cross-origin",
    openGraph: {
      title: cms?.metaTitle || "FAQs | YMA Bouncy Castles",
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
          alt: "YMA Bouncy Castles FAQs",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cms?.metaTitle || "FAQs | YMA Bouncy Castles",
      description,
      images: ["/og-image.jpg"],
    },
  };
}

const faqs = [
  {
    question: "What areas do you cover for bouncy castle rentals?",
    answer:
      "Our service area includes various regions of North and East London, covering places like Loughton, Chigwell, Walthamstow, Chingford, Edmonton, Muswell Hill, Tottenham, Highgate, Wood Green, Hornsey, South Woodford, Woodford, Wanstead and other adjacent areas. We also provide our services to nearby areas such as Romford, Barking, Dagenham, and Leyton. For more information, please check our Location Page.",
  },
  {
    question: "How do I book a bouncy castle?",
    answer:
      "You can book a bouncy castle by calling us or filling out our booking form on the website. We'll require some basic information, such as the date, time, and location of the event.",
  },
  {
    question: "Are your bouncy castles safe?",
    answer:
      "Yes, our bouncy castles are regularly inspected and maintained to ensure they are safe to use. We also provide safety instructions and guidelines for use, and our staff will supervise the set-up and take-down of the equipment.",
  },
  {
    question: "Is there an age limit for using your bouncy castles?",
    answer:
      "We cover all ages. We are insured for children, teenagers and adults, so anybody can join in the fun.",
  },
  {
    question: "Can I get a rental for tomorrow?",
    answer:
      "We'll do our best to accommodate last-minute requests. Please call us as soon as possible to check availability.",
  },
  {
    question: "How much is the delivery fee?",
    answer:
      "The delivery fee varies depending on the distance and location of the event. We also provide complimentary delivery to neighbouring locations. Please contact us for a quote.",
  },
  {
    question: "What happens if it rains during my rental?",
    answer:
      "We'll contact you to discuss options if it rains. If you cancel due to bad weather, there's no charge. If you decide to proceed and the weather turns out to be unsuitable, we reserve the right to cancel the rental for safety reasons.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "If you need to cancel your rental, please let us know as soon as possible. Cancellation fees may apply.",
  },
];

export default async function FaqsPage() {
  const cms = await fetchPageContent("core", "faqs");
  const blocks = (cms?.sections || []) as PageBlock[];
  const hasBlocks = blocks.length > 0;
  const faqBlock = blocks.find((b) => b.type === "faq");
  const faqItems: FaqItem[] = Array.isArray((faqBlock?.data as any)?.items)
    ? ((faqBlock!.data as any).items as FaqItem[])
    : faqs;

  return (
    <main className="w-full bg-white text-brand-ink-900 font-inter mt-24 md:mt-36">
      <FAQPageJsonLd questions={faqItems} />
      <div className="mx-auto w-full max-w-[1000px] px-6 md:px-8 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pt-6 text-[13px] leading-none text-brand-gray-600">
          <Link href="/" className="hover:text-brand-ink-900">
            <Home className="h-[15px] w-[15px]" />
          </Link>
          <ChevronRight className="h-[15px] w-[15px] text-brand-gray-300" />
          <span>FAQs</span>
        </div>

        {hasBlocks ? (
          <PageBlocks blocks={blocks} />
        ) : (
          <FaqSection
            headingAs="h1"
            name="faq"
            intro={
              <>
                We&apos;ve compiled the most important information to help you
                get the most out of your experience. Can&apos;t find what
                you&apos;re looking for?{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-brand-orange-600 underline underline-offset-4 hover:text-brand-orange-700"
                >
                  Contact us.
                </Link>
              </>
            }
            items={faqs}
          />
        )}

        <div className="mt-10 rounded-2xl border border-brand-gray-170 bg-brand-gray-50 p-6 sm:p-7">
          <h3 className="text-[18px] font-semibold text-brand-ink-900">
            Still have questions?
          </h3>
          <p className="mt-2 text-[15px] text-brand-gray-700">
            Give us a call or send a message and we&apos;ll help you book the
            perfect setup.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-10 sm:h-11 rounded-full bg-brand-orange-500 px-6 sm:px-8 text-sm sm:text-base font-semibold text-white border border-white shadow-[0_2px_6px_var(--alpha-black-15)] hover:bg-brand-orange-450 active:bg-brand-orange-550 transition-colors"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-10 sm:h-11 rounded-full bg-transparent px-6 sm:px-7 text-sm sm:text-base font-semibold text-brand-slate-900 hover:bg-transparent active:bg-transparent transition-colors"
            >
              <Link href="/booking-catalog">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      </div>

      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-faqs" />
    </main>
  );
}
