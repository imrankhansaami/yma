import { ChevronRight, Home } from "lucide-react";

import BookingInfoStrip from "@/components/catalog/BookingInfoStrip";
import BookingCatalogClient from "@/app/(site)/booking-catalog/BookingCatalogClient";
import type { ApiProduct } from "@/services/product.service";

export default function BookingCatalogSection({
  forcedCategoryName,
  initialProducts,
  initialTotal,
  title = "Pick Your Perfect Castle",
  intro = "Explore our full collection and find the perfect inflatable for your event.",
}: {
  forcedCategoryName?: string;
  initialProducts?: ApiProduct[];
  initialTotal?: number;
  title?: string;
  intro?: string;
}) {
  return (
    <section className="w-full mt-16 md:mt-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 sm:py-14 md:py-16 font-inter">
        <div className="mb-5 flex items-center gap-2 text-sm text-brand-gray-600">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 text-brand-gray-300" />
          <span>Booking Catalog</span>
        </div>

        <div className="mb-4">
          <h1 className="text-brand-ink-900 font-semibold text-[26px] sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 text-brand-gray-600 text-[14px]">{intro}</p>
        </div>

        <BookingCatalogClient
          forcedCategoryName={forcedCategoryName}
          initialProducts={initialProducts}
          initialTotal={initialTotal}
        />
      </div>

      <BookingInfoStrip />
    </section>
  );
}
