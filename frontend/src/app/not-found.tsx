import Link from "next/link";
import { Home, Search } from "lucide-react";
import type { Metadata } from "next";
import { publicCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found" },
  description: "The page you are looking for could not be found.",
  ...publicCanonical("/404"),
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-bold text-brand-orange-500 leading-none mb-2">
          404
        </div>

        <h1 className="text-[28px] font-semibold text-brand-ink-900 mb-3">
          Page not found
        </h1>

        <p className="text-[15px] text-brand-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have
          been moved or deleted. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-brand-orange-500 text-white font-semibold text-[14px] hover:bg-brand-orange-450 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>

          <Link
            href="/booking-catalog"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full border border-brand-gray-150 text-brand-ink-900 font-semibold text-[14px] hover:bg-brand-gray-25 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Products
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-gray-170">
          <p className="text-[13px] text-brand-gray-600 mb-4">
            Need help? Contact us:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-[14px]">
            <a
              href="tel:+447951431111"
              className="text-brand-orange-500 hover:underline"
            >
              +44 7951 431111
            </a>
            <a
              href="mailto:info@ymabouncycastles.uk"
              className="text-brand-orange-500 hover:underline"
            >
              info@ymabouncycastles.uk
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
