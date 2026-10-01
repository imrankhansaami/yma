import {
  LocalBusinessJsonLd,
  OrganizationJsonLd,
  WebsiteJsonLd,
} from "@/components/seo/JsonLd";
import QueryProvider from "@/providers/QueryProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Londrina_Solid } from "next/font/google";
import { Toaster } from "sonner";
import { buildSeoTitle, getSeoDefaults, parseRobots } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const londrina = Londrina_Solid({
  variable: "--font-londrina-solid",
  subsets: ["latin"],
  weight: ["100", "300", "400", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "300", "400", "900"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await getSeoDefaults();
  const siteName = defaults.siteName;
  const brandSuffix = siteName.trim().split(/\s+/)[0] || "YMA";
  const canonicalBase = defaults.defaultCanonicalBaseUrl;
  const defaultTitle = buildSeoTitle(defaults.defaultMetaTitle, siteName);
  const defaultDescription = defaults.defaultMetaDescription;
  const defaultKeywords = defaults.defaultMetaKeywords;
  const ogTitle = defaults.defaultOpenGraphTitle;
  const ogDescription = defaults.defaultOpenGraphDescription;
  const robots = parseRobots(defaults.defaultRobots);

  return {
    title: {
      default: defaultTitle,
      template: `%s | ${brandSuffix}`,
    },
    description: defaultDescription,
    keywords: defaultKeywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(canonicalBase),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_GB",
      url: canonicalBase,
      siteName,
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${siteName} - Bouncy Castle Hire`,
          type: "image/jpeg",
        },
      ],
    },
    robots: {
      ...robots,
      googleBot: {
        index: robots.index,
        follow: robots.follow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
        noimageindex: false,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteName,
    },
    icons: {
      icon: [
        { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    verification: {
      // google: "your-google-verification-code",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={[
          londrina.className,
          londrina.variable,
          inter.variable,
          geistSans.variable,
          geistMono.variable,
          "antialiased",
        ].join(" ")}
      >
        {/* Schema.org JSON-LD structured data */}
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
        <WebsiteJsonLd />

        <QueryProvider>
          <Toaster position="top-right" theme="light" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
