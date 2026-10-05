import { ChevronRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import type { PageBlock } from "@/lib/blocks/types";
import { fetchPageContent } from "@/lib/pageContent";
import { SEO_STATIC } from "@/lib/seo-static";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Read the YMA Bouncy Castles terms and conditions for bouncy castle hire. Understand our booking, cancellation, and safety policies.",
  alternates: {
    canonical: "/terms",
  },
  keywords: [
    "terms and conditions",
    "rental policy",
    "booking terms",
    "YMA Bouncy Castles",
  ],
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  category: "Legal",
  referrer: "origin-when-cross-origin",
  openGraph: {
    title: "Terms & Conditions | YMA Bouncy Castles",
    description:
      "Read the YMA Bouncy Castles terms and conditions for bouncy castle hire. Understand our booking, cancellation, and safety policies.",
    url: `${SEO_STATIC.BASE_URL}/terms`,
    type: "website",
    siteName: SEO_STATIC.SITE_NAME,
    locale: SEO_STATIC.LOCALE,
    images: [
      {
        url: SEO_STATIC.OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "YMA Bouncy Castles Terms & Conditions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions | YMA Bouncy Castles",
    description:
      "Read the YMA Bouncy Castles terms and conditions for bouncy castle hire. Understand our booking, cancellation, and safety policies.",
    images: ["/og-image.jpg"],
  },
};

export default async function TermsPage() {
  const cms = await fetchPageContent("core", "terms");
  const blocks = (cms?.sections || []) as PageBlock[];
  return (
    <main className="w-full bg-white text-brand-ink-900 font-inter mt-24 md:mt-36">
      <div className="mx-auto w-full max-w-[900px] px-6 md:px-8 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 pt-6 text-[13px] leading-none text-brand-gray-600">
          <Link href="/" className="hover:text-brand-ink-900">
            <Home className="h-[15px] w-[15px]" />
          </Link>
          <ChevronRight className="h-[15px] w-[15px] text-brand-gray-300" />
          <span>Terms & Conditions</span>
        </div>

        {blocks.length > 0 ? (
          <PageBlocks blocks={blocks} />
        ) : (
          <>
        {/* Title */}
        <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.02em]">
          Terms & Conditions
        </h1>
        <p className="mt-2 text-[15px] text-brand-gray-600">
          Last updated: December 2024
        </p>

        {/* Divider */}
        <div className="mt-6 h-px w-full bg-brand-gray-170" />

        {/* Content */}
        <div className="mt-8 prose prose-gray max-w-none prose-headings:text-brand-ink-900 prose-p:text-brand-gray-700 prose-li:text-brand-gray-700">
          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">1. Introduction</h2>
            <p className="text-[15px] leading-7">
              These Terms and Conditions govern the hire of bouncy castles,
              inflatables, and related equipment from YMA Bouncy Castles. By
              making a booking, you agree to be bound by these terms. Please
              read them carefully before booking.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              2. Booking & Payment
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                All bookings must be made through our website or by contacting
                us directly.
              </li>
              <li>
                A deposit may be required to secure your booking. The deposit
                amount will be specified at the time of booking.
              </li>
              <li>
                Full payment is due before or on the day of delivery unless
                otherwise agreed.
              </li>
              <li>
                Prices are quoted in GBP and include VAT where applicable.
              </li>
              <li>
                We accept payment by card, bank transfer, or cash on delivery.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              3. Delivery & Collection
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                We will deliver and set up the equipment at the agreed location
                and time.
              </li>
              <li>
                You must ensure the setup area is clear, accessible, and
                suitable for the equipment.
              </li>
              <li>
                The area must be free from sharp objects, pet waste, and other
                hazards.
              </li>
              <li>
                For outdoor setups, grass is the preferred surface. Hard
                surfaces may require additional safety mats.
              </li>
              <li>
                We require access to a suitable power supply within 30 metres of
                the setup location.
              </li>
              <li>
                Collection will be at the agreed time. Please ensure the area is
                accessible.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              4. Sensitive Items Deposit
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              Certain items are classified as &quot;sensitive&quot; due to their
              value or fragility. A 20% deposit is required for these items,
              which will be refunded upon return of the equipment in
              satisfactory condition.
            </p>
            <p className="text-[15px] leading-7">
              Deductions may be made from the deposit for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] mt-2">
              <li>Damage beyond normal wear and tear</li>
              <li>Missing parts or accessories</li>
              <li>Excessive cleaning required</li>
              <li>Late return of equipment</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              5. Cancellation Policy
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                <strong>More than 14 days before:</strong> Full refund minus a
                £10 administration fee.
              </li>
              <li>
                <strong>7-14 days before:</strong> 50% refund of the total
                booking value.
              </li>
              <li>
                <strong>Less than 7 days before:</strong> No refund unless we
                can rebook the date.
              </li>
              <li>
                <strong>Weather cancellation:</strong> If we cancel due to
                unsafe weather conditions (high winds, storms), you will receive
                a full refund or the option to reschedule.
              </li>
            </ul>
            <p className="text-[15px] leading-7 mt-4">
              To cancel, please contact us by phone or email as soon as
              possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              6. Weather Conditions
            </h2>
            <p className="text-[15px] leading-7">
              Safety is our priority. Inflatables cannot be operated in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] mt-2">
              <li>Wind speeds exceeding 24 mph</li>
              <li>Heavy rain, lightning, or storms</li>
              <li>Extreme temperatures</li>
            </ul>
            <p className="text-[15px] leading-7 mt-4">
              If weather conditions become unsafe during your hire period, you
              must deflate and secure the equipment immediately. We will advise
              on weather conditions and may cancel or postpone if forecasts are
              severe.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              7. Safety & Supervision
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              The hirer is responsible for the safe operation of the equipment
              during the hire period. You must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                Provide constant adult supervision at all times when the
                equipment is in use
              </li>
              <li>Follow all safety instructions provided</li>
              <li>
                Ensure users remove shoes, glasses, jewellery, and sharp objects
                before use
              </li>
              <li>
                Limit the number of users according to the equipment
                specifications
              </li>
              <li>Prevent food, drink, and chewing gum on the equipment</li>
              <li>Not allow somersaults or rough play</li>
              <li>Separate children by age and size groups</li>
              <li>
                Turn off the blower and secure the equipment in adverse weather
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              8. Liability & Insurance
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              YMA Bouncy Castles maintains public liability insurance for our
              equipment. However:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                The hirer assumes responsibility for the safe supervision and
                use of the equipment.
              </li>
              <li>
                We are not liable for injuries resulting from misuse, lack of
                supervision, or failure to follow safety guidelines.
              </li>
              <li>
                The hirer is responsible for any damage to the equipment during
                the hire period.
              </li>
              <li>
                We recommend the hirer has their own public liability insurance
                for events.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              9. Damage to Equipment
            </h2>
            <p className="text-[15px] leading-7">
              You are responsible for any damage to the equipment during the
              hire period beyond normal wear and tear. This includes damage
              caused by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] mt-2">
              <li>Misuse or failure to follow instructions</li>
              <li>Pets or animals</li>
              <li>Vandalism</li>
              <li>Contact with sharp objects</li>
              <li>Failure to secure equipment in adverse weather</li>
            </ul>
            <p className="text-[15px] leading-7 mt-4">
              Repair or replacement costs will be charged to the hirer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              10. Service Areas
            </h2>
            <p className="text-[15px] leading-7">
              We provide delivery and collection services in the following
              areas: London, Essex, Enfield, Birmingham, and Coventry. Delivery
              charges may vary based on location. Please contact us for areas
              outside our standard service region.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-[15px] leading-7">
              We reserve the right to update these Terms and Conditions at any
              time. Changes will be posted on our website. The terms applicable
              to your booking are those in effect at the time of booking.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              12. Governing Law
            </h2>
            <p className="text-[15px] leading-7">
              These Terms and Conditions are governed by the laws of England and
              Wales. Any disputes will be subject to the exclusive jurisdiction
              of the courts of England and Wales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">13. Contact Us</h2>
            <p className="text-[15px] leading-7">
              If you have any questions about these Terms and Conditions, please
              contact us:
            </p>
            <div className="mt-4 text-[15px] space-y-1">
              <p>
                <strong>YMA Bouncy Castles</strong>
              </p>
              <p>Email: info@ymabouncycastles.uk</p>
              <p>Phone: +44 7951 431111</p>
            </div>
          </section>
        </div>
          </>
        )}
      </div>

      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-terms" />
    </main>
  );
}
