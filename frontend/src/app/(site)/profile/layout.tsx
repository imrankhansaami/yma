import type { Metadata } from "next";
import { SEO_STATIC } from "@/lib/seo-static";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your orders and account details.",
  alternates: {
    canonical: "/profile",
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
    title: "My Profile",
    description: "Manage your orders and account details.",
    url: `${SEO_STATIC.BASE_URL}/profile`,
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

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
