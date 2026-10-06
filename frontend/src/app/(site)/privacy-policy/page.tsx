import { ChevronRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CmsJsonLd } from "@/components/common/CmsJsonLd";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import type { PageBlock } from "@/lib/blocks/types";
import { fetchPageContent } from "@/lib/pageContent";
import { SEO_STATIC } from "@/lib/seo-static";

const DEFAULT_TITLE = "Privacy Policy";
const DEFAULT_DESCRIPTION =
  "Read the YMA Bouncy Castles privacy policy. Learn how we collect, use, and protect your personal information.";
const DEFAULT_CANONICAL = "/privacy-policy";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await fetchPageContent("core", "privacy-policy");

  const title = cms?.metaTitle || DEFAULT_TITLE;
  const description = cms?.metaDescription || DEFAULT_DESCRIPTION;
  const canonical =
    typeof cms?.canonicalUrl === "string" && cms.canonicalUrl.trim().startsWith("/")
      ? cms.canonicalUrl.trim()
      : DEFAULT_CANONICAL;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    keywords: ["privacy policy", "data protection", "GDPR", "YMA Bouncy Castles"],
    authors: [{ name: SEO_STATIC.SITE_NAME }],
    creator: SEO_STATIC.CREATOR,
    publisher: SEO_STATIC.PUBLISHER,
    applicationName: SEO_STATIC.SITE_NAME,
    category: "Legal",
    referrer: "origin-when-cross-origin",
    openGraph: {
      title: cms?.metaTitle || "Privacy Policy | YMA Bouncy Castles",
      description,
      url: `${SEO_STATIC.BASE_URL}${canonical}`,
      type: "website",
      siteName: SEO_STATIC.SITE_NAME,
      locale: SEO_STATIC.LOCALE,
      images: [
        {
          url: SEO_STATIC.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "YMA Bouncy Castles Privacy Policy",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cms?.metaTitle || "Privacy Policy | YMA Bouncy Castles",
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function PrivacyPolicyPage() {
  const cms = await fetchPageContent("core", "privacy-policy");
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
          <span>Privacy Policy</span>
        </div>

        {blocks.length > 0 ? (
          <PageBlocks blocks={blocks} />
        ) : (
          <>
        {/* Title */}
        <h1 className="mt-6 text-[32px] font-semibold tracking-[-0.02em]">
          Privacy Policy
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
              YMA Bouncy Castles (&quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website
              ymabouncycastles.uk or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              2. Information We Collect
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              We may collect information about you in various ways, including:
            </p>
            <h3 className="text-[16px] font-semibold mb-2">Personal Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                Name and contact information (email address, phone number)
              </li>
              <li>Billing and delivery address</li>
              <li>
                Payment information (processed securely through our payment
                providers)
              </li>
              <li>Booking and order history</li>
              <li>Communications you send to us</li>
            </ul>

            <h3 className="text-[16px] font-semibold mb-2 mt-4">
              Automatically Collected Data
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Pages visited and time spent on our website</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>Process and manage your bookings and orders</li>
              <li>
                Communicate with you about your bookings, including
                confirmations and reminders
              </li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              4. Sharing Your Information
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>
                Service providers who assist in our operations (payment
                processors, delivery services)
              </li>
              <li>
                Professional advisers (lawyers, accountants) when necessary
              </li>
              <li>Law enforcement or regulatory bodies when required by law</li>
            </ul>
            <p className="text-[15px] leading-7 mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">5. Cookies</h2>
            <p className="text-[15px] leading-7">
              We use cookies and similar tracking technologies to improve your
              experience on our website. Cookies are small data files stored on
              your device. You can control cookies through your browser
              settings. For more information, please see our Cookie Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">6. Data Security</h2>
            <p className="text-[15px] leading-7">
              We implement appropriate technical and organisational measures to
              protect your personal information against unauthorised access,
              alteration, disclosure, or destruction. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              7. Your Rights (GDPR)
            </h2>
            <p className="text-[15px] leading-7 mb-4">
              Under the UK General Data Protection Regulation (UK GDPR), you
              have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px]">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>
                Request deletion of your data (&quot;right to be
                forgotten&quot;)
              </li>
              <li>Object to processing of your data</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-[15px] leading-7 mt-4">
              To exercise these rights, please contact us at
              info@ymabouncycastles.uk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              8. Data Retention
            </h2>
            <p className="text-[15px] leading-7">
              We retain your personal information only for as long as necessary
              to fulfil the purposes for which it was collected, including to
              satisfy legal, accounting, or reporting requirements. Booking
              records are typically retained for 7 years for legal and tax
              purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-[15px] leading-7">
              Our services are not directed to children under 16. We do not
              knowingly collect personal information from children. If you
              believe we have collected information from a child, please contact
              us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-[15px] leading-7">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[20px] font-semibold mb-4">11. Contact Us</h2>
            <p className="text-[15px] leading-7">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
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

      <CmsJsonLd jsonLd={cms?.customJsonLd} id="custom-jsonld-privacy-policy" />
    </main>
  );
}
