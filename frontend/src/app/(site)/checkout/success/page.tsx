import SVGImage from "@/assets/images/Simplification.png";
import { SEO_STATIC } from "@/lib/seo-static";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been confirmed with YMA Bouncy Castles.",
  alternates: {
    canonical: "/checkout/success",
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
    title: "Order Confirmed",
    description: "Your order has been confirmed with YMA Bouncy Castles.",
    url: `${SEO_STATIC.BASE_URL}/checkout/success`,
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

const OrderConfirmedContent = () => (
  <main className="min-h-screen w-full bg-white text-foreground font-inter mt-32">
    <div className="mx-auto flex max-w-[880px] flex-col items-center justify-center px-4 py-10 md:py-20">
      <div className="flex items-center justify-center">
        <Image
          src={SVGImage}
          alt=""
          width={96}
          height={96}
          className="rounded-full"
        />
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">Order Confirmed!</p>

      <h1 className="mt-4 text-center text-[22px] leading-snug text-black md:text-[28px]">
        Congratulations. You Just Made the Best Decision of the Day.
      </h1>

      <Link
        href={"/"}
        type="button"
        className="mt-6 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-900 shadow-sm transition hover:bg-gray-50 active:translate-y-px cursor-pointer"
      >
        Back to Home
      </Link>
    </div>
  </main>
);

export default function OrderConfirmedPage() {
  return <OrderConfirmedContent />;
}
