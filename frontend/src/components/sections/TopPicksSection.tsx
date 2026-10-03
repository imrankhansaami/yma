"use client";
import SampleImage from "@/assets/images/bg1.png";
import { fetchTopPicks, type ApiProduct } from "@/services/product.service";
import { SHOW_PRODUCT_REVIEWS } from "@/lib/features";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ProductCard, { ProductCardProps } from "../ProductCard";

export default function TopPicksSection() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 16;

  const fallbackImage = (SampleImage as unknown as { src: string }).src;

  const { data, isLoading, isError } = useQuery<ApiProduct[]>({
    queryKey: ["top-picks"],
    queryFn: fetchTopPicks,
    staleTime: 5 * 60 * 1000,
  });

  const dynamicItems: ProductCardProps[] = useMemo(() => {
    const apiProducts: ApiProduct[] = Array.isArray(data) ? data : [];
    if (apiProducts.length === 0 || isError) return [];
    return apiProducts.map((p, i) => {
      const cover =
        p.imageCover ||
        (Array.isArray(p.images) && p.images[0]) ||
        fallbackImage;

      const basePrice = p.perDayPrice ?? p.rentalPrice ?? p.price;
      const hasDiscount =
        typeof p.priceDiscount === "number" && p.priceDiscount > 0;

      const priceOriginal = hasDiscount ? basePrice : null;
      const priceCurrent = hasDiscount ? p.priceDiscount! : basePrice;

      const discountPercent =
        hasDiscount && basePrice > 0
          ? Math.round(((basePrice - p.priceDiscount!) / basePrice) * 100)
          : null;
      const id = String(p.id ?? p._id ?? i + 1);
      const slug = String(p.slug || "").trim();

      return {
        id,
        images: [{ src: cover, alt: p.name }],
        title: p.name,
        subtitle: "Total Rental Price",
        subnote: "Incl. taxes",
        priceOriginal,
        priceCurrent,
        priceSuffix: "per day",
        discountPercent,
        ratingValue: SHOW_PRODUCT_REVIEWS ? p.ratingsAverage ?? undefined : undefined,
        ratingCount: SHOW_PRODUCT_REVIEWS ? p.ratingsQuantity ?? undefined : undefined,
        slug: slug || undefined,
        onBook: () => (slug ? router.push(`/product/${slug}`) : undefined),
        onAddToCart: () => (slug ? router.push(`/product/${slug}`) : undefined),
      };
    });
  }, [data, fallbackImage, isError, router]);

  const items: ProductCardProps[] = dynamicItems;

  const pageCount = Math.max(1, Math.ceil(items.length / limit));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return items.slice(start, start + limit);
  }, [items, currentPage]);

  const pagesToShow = useMemo(() => {
    if (pageCount <= 5)
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "ellipsis", pageCount] as const;
    if (currentPage >= pageCount - 2)
      return [1, "ellipsis", pageCount - 2, pageCount - 1, pageCount] as const;
    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      pageCount,
    ] as const;
  }, [currentPage, pageCount]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(pageCount, p + 1));
  const goPage = (n: number) =>
    setCurrentPage(Math.min(pageCount, Math.max(1, n)));

  return (
    <section className="w-full py-12  md:py-16 font-inter">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-10 md:mb-12">
          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
            Top Picks for Big Fun
          </h2>
          <p className="font-inter text-[14px] sm:text-[18px] mt-3 text-brand-gray-700 max-w-[620px] mx-auto">
            Our top-booked castles, loved by kids and parents alike.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {isLoading && dynamicItems.length === 0
            ? Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="w-full h-[260px] sm:h-[300px] rounded-xl bg-gray-200 animate-pulse"
                />
              ))
            : null}

          {pagedItems.map((p, idx) => (
            <ProductCard key={idx} {...p} />
          ))}
        </div>

        {!isLoading && items.length === 0 && (
          <div className="mt-6 text-center text-sm text-brand-gray-600">
            No top picks available right now.
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav
              aria-label="Pagination"
              className="inline-flex items-center rounded-xl border border-brand-gray-150 overflow-hidden h-10 sm:h-14"
            >
              <button
                onClick={goPrev}
                disabled={currentPage === 1 || isLoading}
                className="inline-flex items-center justify-center text-brand-zinc-400 disabled:opacity-60 h-10 sm:h-14 px-3 sm:px-5"
                aria-label="Previous page"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
              </button>

              <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />

              <div className="flex items-stretch">
                {pagesToShow.map((p, idx) => {
                  const isEllipsis = p === "ellipsis";
                  const isActive = typeof p === "number" && p === currentPage;

                  return (
                    <div key={`${p}-${idx}`} className="flex items-stretch">
                      {isEllipsis ? (
                        <span
                          className="inline-flex items-center justify-center h-10 sm:h-14 min-w-[44px] sm:min-w-[64px] px-3 sm:px-6 text-[14px] sm:text-[18px] font-medium text-brand-ink-900"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          disabled={isLoading}
                          onClick={() => goPage(p as number)}
                          className={[
                            "inline-flex items-center justify-center",
                            "h-10 sm:h-14",
                            "min-w-[44px] sm:min-w-[64px]",
                            "px-3 sm:px-6",
                            "text-[14px] sm:text-[18px] font-medium",
                            isActive
                              ? "bg-brand-orange-50 text-brand-orange-500"
                              : "text-brand-ink-900 hover:bg-brand-gray-25",
                          ].join(" ")}
                          aria-label={`Go to page ${p}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {p}
                        </button>
                      )}
                      {idx !== pagesToShow.length - 1 && (
                        <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />

              <button
                onClick={goNext}
                disabled={currentPage === pageCount || isLoading}
                className="inline-flex items-center justify-center text-brand-ink-900 disabled:opacity-60 h-10 sm:h-14 px-3 sm:px-5"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
}
