"use client";
import SampleImage from "@/assets/images/bg1.png";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchCategories, type Category } from "@/services/category.service";
import { fetchLocations } from "@/services/location.service";
import {
  fetchProducts,
  type ApiProduct,
  type FetchProductsResponse,
} from "@/services/product.service";
import { normalizeCanonicalSlug } from "@/lib/canonical";
import Link from "next/link";
import ProductCard, { ProductCardProps } from "../ProductCard";

const CATEGORIES = [
  "Bouncy Castle Hire Catalogue",
  "Soft Play Hire Catalogue",
  "Garden Games Hire Catalogue",
  "Fun Food Hire Catalogue",
] as const;

const FALLBACK_CARDS_COUNT = 4;

function mapProductToCard(
  p: ApiProduct,
  fallbackImg: string,
): ProductCardProps & { id: string } {
  const cover =
    p.imageCover || (Array.isArray(p.images) && p.images[0]) || fallbackImg;

  const basePrice = p.perDayPrice ?? p.rentalPrice ?? p.price;
  const priceOriginal =
    typeof p.priceDiscount === "number" && p.priceDiscount > 0
      ? basePrice
      : null;

  const priceCurrent =
    typeof p.priceDiscount === "number" && p.priceDiscount > 0
      ? p.priceDiscount!
      : basePrice;

  const discountPercent =
    typeof p.priceDiscount === "number" && p.priceDiscount > 0 && basePrice > 0
      ? Math.round(((basePrice - p.priceDiscount) / basePrice) * 100)
      : null;

  return {
    id: String(p.id ?? p._id ?? ""),
    images: [{ src: cover, alt: p.name }],
    title: p.name,
    subtitle: "Total Rental Price",
    subnote: "Incl. taxes",
    priceOriginal,
    priceCurrent,
    priceSuffix: "per day",
    discountPercent,
  };
}

export default function DynamicOneStopPartyShop({
  locationName,
}: {
  locationName?: string;
}) {
  const fallbackImage = (SampleImage as unknown as { src: string }).src;

  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations", { page: 1, limit: 100 }],
    queryFn: () => fetchLocations({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
    enabled: !!locationName,
  });

  const selectedLocationId = useMemo(() => {
    if (!locationName || !locationsData) return null;

    const toSlug = (name: string) => normalizeCanonicalSlug(name);

    const all = Array.isArray(locationsData) ? (locationsData as any[]) : [];
    const targetSlug = toSlug(locationName);

    // Helper to find location recursively
    const findLoc = (list: any[]): any => {
      for (const loc of list) {
        if (toSlug(String(loc.name)) === targetSlug) {
          return loc;
        }
        if (Array.isArray(loc.children) && loc.children.length > 0) {
          const found = findLoc(loc.children);
          if (found) return found;
        }
      }
      return null;
    };

    const match = findLoc(all);
    return match?.id ?? match?._id ?? null;
  }, [locationsData, locationName]);

  const { data: categoriesApi } = useQuery<Category[]>({
    queryKey: ["one-stop-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] =
    Array.isArray(categoriesApi) && categoriesApi.length > 0
      ? categoriesApi
      : CATEGORIES.map((label, idx) => ({
          id: String(idx),
          _id: String(idx),
          name: label,
        }));

  const [activeCategoryId, setActiveCategoryId] = useState<
    Category["id"] | null
  >(categories[0]?.id ?? null);
  const [autoSelected, setAutoSelected] = useState(false);

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((c) => String(c.id) === String(activeCategoryId))) {
      setActiveCategoryId(categories[0]?.id ?? null);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (!categoriesApi || categoriesApi.length === 0) return;
    if (autoSelected) return;

    // If a location is requested, wait until we've finished loading locations
    // so we don't prematurely pick a category based on global products.
    if (locationName && locationsLoading) return;

    let cancelled = false;

    const pickFirstWithProducts = async () => {
      for (const cat of categoriesApi) {
        try {
          const resp = await fetchProducts({
            page: 1,
            limit: 1,
            sort: "-createdAt",
            categoryId: String(cat.id),
            locationId: selectedLocationId,
          });
          if (!cancelled && resp?.items?.length) {
            setActiveCategoryId(cat.id);
            setAutoSelected(true);
            return;
          }
        } catch {
          // skip invalid category
        }
      }
      if (!cancelled) {
        setAutoSelected(true);
      }
    };

    pickFirstWithProducts();

    return () => {
      cancelled = true;
    };
  }, [
    categoriesApi,
    autoSelected,
    selectedLocationId,
    locationsLoading,
    locationName,
  ]);

  const activeCategory =
    categories.find((c) => String(c.id) === String(activeCategoryId)) ??
    categories[0];

  const {
    data: productsResp,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<FetchProductsResponse>({
    queryKey: ["one-stop-products", activeCategory?.id, selectedLocationId],
    queryFn: () =>
      fetchProducts({
        page: 1,
        limit: FALLBACK_CARDS_COUNT,
        sort: "-createdAt",
        categoryId:
          categoriesApi && categoriesApi.length > 0
            ? String(activeCategory?.id ?? "")
            : null,
        locationId: selectedLocationId,
      }),
    enabled: !!activeCategory?.id,
    staleTime: 60 * 1000,
  });

  const apiProducts: ApiProduct[] = productsResp?.items ?? [];

  const dynamicCards: (ProductCardProps & { id: string })[] =
    apiProducts.length > 0
      ? apiProducts.map((p) => mapProductToCard(p, fallbackImage))
      : [];

  const cardsToRender =
    dynamicCards.length > 0 && !productsError ? dynamicCards : [];

  return (
    <section className="w-full py-10  md:py-16 font-inter">
      <div className=" max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8">
          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
            {locationName
              ? `Your One-Stop Party Shop in ${locationName}`
              : "Your One-Stop Party Shop"}
          </h2>
          <p className="font-inter text-[14px] sm:text-[18px] mt-3 text-brand-gray-700 max-w-[620px] mx-auto">
            Browse bouncy castles, soft play, garden games, and fun food —
            everything you need to make your event unforgettable.
          </p>
        </header>

        {/* ----------------------Product Catalogue Tab for Small device--------------- */}
        <div className="w-full mb-6 grid grid-cols-2 gap-3 md:hidden">
          {categories.map((cat, i) => {
            const isActive =
              String(cat.id) === String(activeCategory?.id ?? cat.id);
            const isOddLast =
              categories.length % 2 === 1 && i === categories.length - 1;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={[
                  "text-center rounded-md px-3 py-3 text-[13px] leading-tight font-semibold transition-colors whitespace-normal [overflow-wrap:anywhere] cursor-pointer w-full min-h-[44px] flex items-center justify-center",
                  isOddLast
                    ? "col-span-2 justify-self-center max-w-[240px]"
                    : "",
                  "border",
                  isActive
                    ? "border-brand-orange-500 bg-brand-orange-50 text-brand-orange-500"
                    : "border-brand-gray-200 bg-white text-brand-ink-900 hover:bg-brand-gray-25",
                ].join(" ")}
                aria-pressed={isActive}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
        {/* ----------------------Product Catalogue Tab for Large device--------------- */}
        <div className="hidden mb-6 md:flex justify-center flex-wrap gap-4">
          {categories.map((cat) => {
            const isActive =
              String(cat.id) === String(activeCategory?.id ?? cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={[
                  "text-center rounded-md px-5 py-2.5 text-[13px] sm:text-[15px] font-semibold transition-colors text-nowrap cursor-pointer min-w-[170px]",
                  "border",
                  isActive
                    ? "border-brand-orange-500 bg-brand-orange-50 text-brand-orange-500"
                    : "border-brand-gray-200 bg-white text-brand-ink-900 hover:bg-brand-gray-25",
                ].join(" ")}
                aria-pressed={isActive}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
        {/* --------------------Product Card-------------- */}
        <div className="grid grid-cols-2 gap-4 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productsLoading && dynamicCards.length === 0
            ? Array.from({ length: FALLBACK_CARDS_COUNT }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="w-full h-[220px] sm:h-[300px] rounded-xl bg-gray-200 animate-pulse"
                />
              ))
            : null}

          {cardsToRender.map((cfg, i) => (
            <ProductCard
              key={(cfg as any).id ?? i}
              {...cfg}
              onBook={() =>
                console.log(
                  "Book Product",
                  (cfg as any).id ?? i + 1,
                  "in",
                  activeCategory?.name,
                )
              }
              onAddToCart={() =>
                console.log(
                  "Add to Cart",
                  (cfg as any).id ?? i + 1,
                  "in",
                  activeCategory?.name,
                )
              }
              className="mx-auto w-full"
            />
          ))}
        </div>

        {!productsLoading && cardsToRender.length === 0 && (
          <div className="mt-4 text-sm text-brand-gray-600 text-center">
            No products available right now.
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href={
              locationName
                ? `/booking-catalog?locationName=${encodeURIComponent(
                    locationName,
                  )}`
                : "/booking-catalog"
            }
            className="inline-flex h-11 sm:h-12 w-auto min-w-[170px] items-center justify-center gap-2 rounded-full border-[2px] border-white bg-brand-green-500 px-4 font-londrina text-white shadow-sm transition-colors hover:bg-brand-green-600"
          >
            See More Products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
