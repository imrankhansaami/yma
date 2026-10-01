"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.error("Application error:", error);
    if (pathname !== "/unexpected-error") {
      router.replace("/unexpected-error");
    }
  }, [error, pathname, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-[28px] font-semibold text-brand-ink-900 mb-3">
          Something went wrong
        </h1>

        <p className="text-[15px] text-brand-gray-600 mb-8">
          We apologise for the inconvenience. An unexpected error has occurred.
          Please try again or return to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-brand-orange-500 text-white font-semibold text-[14px] hover:bg-brand-orange-450 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full border border-brand-gray-150 text-brand-ink-900 font-semibold text-[14px] hover:bg-brand-gray-25 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[12px] text-brand-gray-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
