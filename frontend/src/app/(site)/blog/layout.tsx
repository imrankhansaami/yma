import { Metadata } from "next";
import { SEO_STATIC } from "@/lib/seo-static";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Discover expert advice, safety guidelines, and creative inspiration to help you plan joyful, stress-free celebrations with YMA Bouncy Castle.",
  keywords: ["blog", "bouncy castle", "event planning", "safety", "tips"],
  authors: [{ name: SEO_STATIC.SITE_NAME }],
  creator: SEO_STATIC.CREATOR,
  publisher: SEO_STATIC.PUBLISHER,
  applicationName: SEO_STATIC.SITE_NAME,
  category: "Blog",
  referrer: "origin-when-cross-origin",
  openGraph: {
    title: "Blogs",
    description:
      "Discover expert advice, safety guidelines, and creative inspiration to help you plan joyful, stress-free celebrations with YMA Bouncy Castle.",
    url: `${SEO_STATIC.BASE_URL}/blog`,
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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
