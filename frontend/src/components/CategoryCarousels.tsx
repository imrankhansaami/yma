"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import SampleImage from "@/assets/images/bg1.png";
import { fetchProducts, type ApiProduct } from "@/services/product.service";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import ProductCard, { ProductCardProps } from "./ProductCard";

type CategoryRow = {
  id: string;
  title: string;
  items: ProductCardProps[];
  loading?: boolean;
};

function mapProductToCard(
  p: ApiProduct,
  router: ReturnType<typeof useRouter>,
  fallbackImg: string
): ProductCardProps {
  const cover =
    p.imageCover || (Array.isArray(p.images) && p.images[0]) || fallbackImg;
  const basePrice = p.perDayPrice ?? p.rentalPrice ?? p.price;
  const hasDiscount =
    typeof p.priceDiscount === "number" && p.priceDiscount > 0;
  const priceOriginal = hasDiscount ? basePrice : null;
  const priceCurrent = hasDiscount ? p.priceDiscount! : basePrice;
  const discountPercent =
    hasDiscount && basePrice > 0
      ? Math.round(((basePrice - p.priceDiscount!) / basePrice) * 100)
      : null;
  const id = String(p.id ?? p._id ?? "");
  const slug = String(p.slug || "").trim();

  return {
    id,
    images: [{ src: cover || (SampleImage as any).src, alt: p.name }],
    title: p.name,
    subtitle: "Total Rental Price",
    subnote: "Incl. taxes",
    priceOriginal,
    priceCurrent,
    priceSuffix: "per day",
    discountPercent,
    slug: slug || undefined,
    onBook: () => (slug ? router.push(`/product/${slug}`) : undefined),
    onAddToCart: () => (slug ? router.push(`/product/${slug}`) : undefined),
  };
}

export default function CategoryCarousels() {
  const router = useRouter();
  const fallbackImage = (SampleImage as unknown as { src: string }).src;
  const { loadCategories, findCategoryId } = useCategoryStore();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const gardenId = findCategoryId(["Garden Games"]);
  const softPlayId = findCategoryId(["Soft Play", "Soft Play Games"]);

  const {
    data: gardenResp,
    isLoading: gardenLoading,
    isError: gardenError,
  } = useQuery({
    queryKey: ["category-carousel", "garden", gardenId],
    queryFn: () =>
      fetchProducts({
        page: 1,
        limit: 8,
        sort: "-createdAt",
        categoryId: gardenId ? String(gardenId) : null,
      }),
    enabled: gardenId !== null,
    staleTime: 60 * 1000,
  });

  const {
    data: softResp,
    isLoading: softLoading,
    isError: softError,
  } = useQuery({
    queryKey: ["category-carousel", "softplay", softPlayId],
    queryFn: () =>
      fetchProducts({
        page: 1,
        limit: 8,
        sort: "-createdAt",
        categoryId: softPlayId ? String(softPlayId) : null,
      }),
    enabled: softPlayId !== null,
    staleTime: 60 * 1000,
  });

  const gardenItems: ProductCardProps[] = (
    (gardenResp?.items ?? []) as ApiProduct[]
  ).map((p: ApiProduct) => mapProductToCard(p, router, fallbackImage));
  const softItems: ProductCardProps[] = (
    (softResp?.items ?? []) as ApiProduct[]
  ).map((p: ApiProduct) => mapProductToCard(p, router, fallbackImage));

  const CATEGORIES: CategoryRow[] = [
    {
      id: "garden",
      title: "Garden Games",
      items: !gardenError ? gardenItems : [],
      loading: gardenLoading && gardenItems.length === 0,
    },
    {
      id: "softplay",
      title: "Soft Play Games",
      items: !softError ? softItems : [],
      loading: softLoading && softItems.length === 0,
    },
  ];

  return (
    <section className="w-full py-8 sm:py-10 md:py-12 font-inter">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 space-y-12 md:space-y-16">
        {CATEGORIES.map((cat) => (
          <CategoryStrip
            key={cat.id}
            title={cat.title}
            items={cat.items}
            loading={cat.loading}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryStrip({
  title,
  items,
  loading,
}: {
  title: string;
  items: ProductCardProps[];
  loading?: boolean;
}) {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const swiperRef = useRef<any>(null);

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !prevRef.current || !nextRef.current) return;

    swiper.params.navigation = {
      ...(swiper.params.navigation || {}),
      prevEl: prevRef.current,
      nextEl: nextRef.current,
    };

    if (swiper.navigation) {
      swiper.navigation.destroy();
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, [items]);

  return (
    <div className="w-full">
      {/* Headline */}
      <h2 className="text-brand-ink-900 font-semibold text-[20px] sm:text-[22px] md:text-[24px] mb-4 sm:mb-6">
        {title}
      </h2>

      <div className="relative">
        <button
          ref={prevRef}
          aria-label="Previous"
          className={[
            "hidden md:flex absolute left-[-18px] top-1/2 -translate-y-1/2 z-10",
            "h-8 w-8 rounded-full bg-white shadow-md border border-brand-gray-150",
            "items-center justify-center",
            atStart ? "opacity-40 cursor-default" : "hover:bg-brand-gray-25",
          ].join(" ")}
        >
          <ChevronLeft className="h-4 w-4 text-brand-ink-900" />
        </button>

        <button
          ref={nextRef}
          aria-label="Next"
          className={[
            "hidden md:flex absolute right-[-18px] top-1/2 -translate-y-1/2 z-10",
            "h-8 w-8 rounded-full bg-white shadow-md border border-brand-gray-150",
            "items-center justify-center",
            atEnd ? "opacity-40 cursor-default" : "hover:bg-brand-gray-25",
          ].join(" ")}
        >
          <ChevronRight className="h-4 w-4 text-brand-ink-900" />
        </button>

        {/* Mobile grid (no horizontal scroll) */}
        <div className="grid grid-cols-2 gap-3 auto-rows-fr sm:hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`sk-m-${i}`}
                  className="h-[260px] rounded-xl bg-gray-200 animate-pulse"
                />
              ))
            : null}
          {items.map((p, i) => (
            <div key={`m-${i}`} className="h-full flex">
              <ProductCard {...p} className="h-full" />
            </div>
          ))}
        </div>

        {/* Desktop/tablet swiper */}
        <div className="hidden sm:block">
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              //@ts-expect-error : ""
              swiper.params.navigation.prevEl = prevRef.current;
              // @ts-expect-error:""
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setAtStart(swiper.isBeginning);
              setAtEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setAtStart(swiper.isBeginning);
              setAtEnd(swiper.isEnd);
            }}
            slidesPerView={2}
            spaceBetween={16}
            className="items-stretch"
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
            }}
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <SwiperSlide key={`sk-${i}`} className="h-auto flex">
                    <div className="h-[300px] w-full rounded-xl bg-gray-200 animate-pulse" />
                  </SwiperSlide>
                ))
              : null}

            {items.map((p, i) => (
              <SwiperSlide key={i} className="h-auto flex">
                <div className="h-full flex w-full">
                  <ProductCard {...p} className="h-full" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {!loading && items.length === 0 && (
          <div className="mt-2 text-sm text-brand-gray-600">
            No products available right now.
          </div>
        )}
      </div>
    </div>
  );
}
