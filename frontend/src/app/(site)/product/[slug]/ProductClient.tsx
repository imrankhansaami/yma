"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

import {
  differenceInCalendarDays,
  format,
  isBefore,
  startOfMonth,
  startOfToday,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Home,
  Share,
  Star,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import BookingInfoStrip from "@/components/catalog/BookingInfoStrip";
import { RichText } from "@/components/common/RichText";
import ProductReviews from "@/components/product/ProductReviews";
import { SHOW_PRODUCT_REVIEWS } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  CartExtra,
  computeExtrasTotal,
  useCartStore,
} from "@/store/useCartStore";

import { ApiProduct, fetchProductBySlug } from "@/services/product.service";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import BouncyCastleWithSlideImg from "@/assets/category/BouncyCastleWithSlide.png";
import RegularBouncyCastleImg from "@/assets/category/RegularBouncyCastle.png";
import SoftPlayImg from "@/assets/category/SoftPlay.png";

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width:${breakpointPx}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    setIsMobile(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [breakpointPx]);
  return isMobile;
}

function imagesFromProduct(p?: ApiProduct | null): string[] {
  const list = Array.isArray(p?.images) ? p!.images : [];
  if (list.length > 0) return list;
  if (p?.imageCover) return [p.imageCover];
  return [];
}

function pricePerDayFromProduct(p?: ApiProduct | null): number {
  if (!p) return 0;
  return Number(p.priceDiscount ?? p.price ?? 0);
}

function isPdfAsset(asset: string): boolean {
  return (
    asset.startsWith("data:application/pdf") ||
    asset.startsWith("data:application/octet-stream") ||
    asset.toLowerCase().includes(".pdf")
  );
}

/**
 * Open a certificate, which may be a base64 `data:` PDF — as uploaded via the
 * admin. Note we must NEVER `window.open()` a `data:` URL: Chrome blocks
 * top-level navigation to `data:` URLs, which is why "the PDF did not open".
 * Instead we turn the data URI into a Blob and open/download that.
 */
function openCertificate(asset: string) {
  if (!asset) return;

  const isDataUri = asset.startsWith("data:");
  if (!isDataUri) {
    window.open(asset, "_blank", "noopener,noreferrer");
    return;
  }

  const download = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = "certificate.pdf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  try {
    const commaIndex = asset.indexOf(",");
    const meta = asset.slice(5, commaIndex); // e.g. application/pdf;base64
    const payload = asset.slice(commaIndex + 1);
    let blob: Blob;

    if (/;base64/i.test(meta)) {
      const binary = atob(payload.replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: "application/pdf" });
    } else {
      blob = new Blob([decodeURIComponent(payload)], {
        type: "application/pdf",
      });
    }

    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, "_blank");
    if (!win) {
      // Popup blocked — fall back to downloading the blob.
      download(blobUrl);
    }
    // Give the new tab time to load before releasing the object URL.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch {
    // Could not decode the data URI; fall back to a direct download.
    download(asset);
  }
}

type CategoryRef = string | { name?: string | null };

function normalizeCategoryName(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCategoryNames(categories?: CategoryRef[]): string[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c) => (typeof c === "string" ? c : c?.name))
    .filter((c): c is string => Boolean(c));
}

function getDimensionsVisualization(product?: ApiProduct | null) {
  const categoryNames = getCategoryNames(product?.categories as CategoryRef[]);
  if (!categoryNames.length) return null;

  const normalized = categoryNames.map(normalizeCategoryName);

  const matches = [
    {
      image: RegularBouncyCastleImg,
      keywords: ["regular bouncy", "bouncy castle", "bounce"],
    },
    {
      image: SoftPlayImg,
      keywords: ["soft play", "softplay"],
    },
    {
      image: BouncyCastleWithSlideImg,
      keywords: ["with slide", "bouncy castle with slide", "slide"],
    },
  ];

  for (const entry of matches) {
    if (normalized.some((n) => entry.keywords.some((k) => n.includes(k)))) {
      return entry;
    }
  }

  return null;
}

export default function ProductClient({
  initialProduct = null,
  availableFrom = null,
  availableUntil = null,
  availableOn = null,
}: {
  initialProduct?: ApiProduct | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availableOn?: string | null;
}) {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug;
  const productSlug = rawSlug ? decodeURIComponent(rawSlug).trim() : rawSlug;

  const isMobile = useIsMobile();
  const today = startOfToday();

  const [activeImage, setActiveImage] = React.useState(0);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined,
  );
  const [openDate, setOpenDate] = React.useState(false);
  const [baseMonth, setBaseMonth] = React.useState<Date>(
    startOfMonth(new Date()),
  );
  // The calendar depends on the current date/timezone and the viewport width,
  // which differ between server and client. Render it only after mount to
  // avoid hydration mismatches.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Add-ons the customer has ticked, keyed by option key -> quantity.
  const [selectedExtras, setSelectedExtras] = React.useState<
    Record<string, number>
  >({});
  const formattedSidebarDate = dateRange?.from
    ? dateRange?.to
      ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
      : format(dateRange.from, "PP")
    : "Select dates";

  const rangeDays =
    dateRange?.from && dateRange?.to
      ? differenceInCalendarDays(dateRange.to, dateRange.from) + 1
      : dateRange?.from
        ? 1
        : null;

  React.useEffect(() => {
    if (availableFrom) {
      const from = new Date(availableFrom);
      if (!Number.isNaN(from.getTime())) {
        const to = availableUntil ? new Date(availableUntil) : undefined;
        const validTo = to && !Number.isNaN(to.getTime()) ? to : undefined;
        setDateRange({ from, to: validTo });
        return;
      }
    }
    if (availableOn) {
      const parsed = new Date(availableOn);
      if (!Number.isNaN(parsed.getTime())) {
        setDateRange({ from: parsed, to: undefined });
      }
    }
  }, [availableFrom, availableUntil, availableOn]);

  const { addItem, open: openCart } = useCartStore();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery<ApiProduct | null>({
    queryKey: ["product", productSlug],
    queryFn: () => fetchProductBySlug(productSlug as string),
    enabled: !!productSlug && !initialProduct,
    initialData: initialProduct,
    staleTime: 5 * 60 * 1000,
  });

  const bookedSet = React.useMemo(() => {
    const booked = Array.isArray(product?.bookedDates)
      ? product.bookedDates
          .map((entry) => entry?.date)
          .filter(Boolean)
          .map((date) => format(new Date(date as string), "yyyy-MM-dd"))
      : [];
    return new Set(booked);
  }, [product?.bookedDates]);

  const isBooked = React.useCallback(
    (d: Date) => bookedSet.has(format(d, "yyyy-MM-dd")),
    [bookedSet],
  );

  const isDisabled = React.useCallback(
    (d: Date) => isBefore(d, today) || isBooked(d),
    [isBooked, today],
  );

  const isMissing = (!product && !isLoading) || isError;

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (isMissing) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-brand-ink-900">
            Product not found
          </h1>
          <p className="text-brand-gray-600 text-sm">
            The product you are looking for may have been moved or no longer
            exists.
          </p>
          <Link
            href="/booking-catalog"
            className="inline-flex items-center justify-center rounded-lg bg-brand-orange-500 px-4 py-2 text-white font-semibold hover:bg-brand-orange-600 transition"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const images = imagesFromProduct(product);
  const pricePerDay = pricePerDayFromProduct(product);
  const pricePerWeek = Math.round(pricePerDay * 7);
  const hasPrice =
    product?.priceDiscount !== undefined || product?.price !== undefined;
  const ratingValue = product?.ratingsAverage;
  const ratingCount = Number(product?.ratingsQuantity ?? 0);
  const hasRating = ratingValue != null || ratingCount > 0;
  const visualization = getDimensionsVisualization(product);
  const dimensions = product?.dimensions;
  const hasDimensions =
    dimensions?.width != null &&
    dimensions?.length != null &&
    dimensions?.height != null;
  const dimensionSummary = hasDimensions
    ? `${dimensions.width} ft (Width) x ${dimensions.length} ft (Length) x ${dimensions.height} ft (Height)`
    : null;
  const coverImageAltText =
    product?.imageCoverAltText || product?.imageAltText || product?.name || "Product image";
  const galleryImageAltTexts = product?.imageAltTexts || [];
  const activeImageAltText = galleryImageAltTexts[activeImage] || coverImageAltText;

  const effectiveDays = Math.max(1, rangeDays ?? 1);
  const totalPrice =
    pricePerDay > 0
      ? Math.floor(effectiveDays / 7) * pricePerWeek +
        (effectiveDays % 7) * pricePerDay
      : 0;

  // Add-ons offered for this product (the WordPress "Other Options" list).
  const extraOptions = (product?.extraOptions ?? []).filter(
    (option) => option.enabled !== false,
  );
  const chosenExtras: CartExtra[] = extraOptions
    .map((option) => ({ ...option, quantity: selectedExtras[option.key] ?? 0 }))
    .filter((option) => option.quantity > 0)
    .map((option) => ({
      key: option.key,
      label: option.label,
      price: option.price,
      pricingType: option.pricingType,
      quantity: option.quantity,
    }));
  const extrasTotal = computeExtrasTotal(chosenExtras, effectiveDays);
  const grandTotal = totalPrice + extrasTotal;

  const setExtraQuantity = (key: string, quantity: number) => {
    setSelectedExtras((previous) => {
      if (quantity <= 0) {
        const next = { ...previous };
        delete next[key];
        return next;
      }
      return { ...previous, [key]: quantity };
    });
  };

  const onBook = () => {
    if (!dateRange?.from || !product) return;
    addItem({
      id: String(product?.id ?? productSlug),
      title: String(product?.name ?? ""),
      image: images[0],
      dateISO: format(dateRange.from, "yyyy-MM-dd"),
      days: effectiveDays,
      pricePerDay,
      extras: chosenExtras,
    });
    openCart();
  };

  const handleShare = async () => {
    if (!product) return;
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/product/${product?.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name ?? "Product",
          text: product.summary ?? "",
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } else {
        toast.success("Link ready to share");
      }
    } catch {}
  };

  return (
    <TooltipProvider>
      <div className="w-full mt-24 md:mt-32 font-inter">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-4 pb-6 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-brand-gray-600 mt-4">
              <Home className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 text-brand-gray-300" />
              <Link
                href="/booking-catalog"
                className="text-sm hover:text-brand-ink-900 text-nowrap"
              >
                Booking Catalog
              </Link>
              <ChevronRight className="h-4 w-4 text-brand-gray-300" />
              {product?.name ? (
                <span className="text-sm text-nowrap">
                  {product.name.length > 10
                    ? product.name.slice(0, 10) + "..."
                    : product.name}
                </span>
              ) : null}
            </div>

            <div className="hidden sm:flex items-center gap-5 text-brand-gray-600">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 hover:text-brand-ink-900"
              >
                <Share className="h-4 w-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-6">
            {/* LEFT: Media */}
            <div>
              <div className="relative rounded-xl overflow-hidden border border-brand-gray-200">
                <Aspect className="rounded-xl">
                  {images.length > 0 ? (
                    <Image
                      src={images[activeImage]}
                      alt={activeImageAltText}
                      fill
                      sizes="(max-width: 1279px) 100vw, 480px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="h-full w-full bg-brand-gray-75" />
                  )}
                </Aspect>

                {/* Mobile Share/Save overlay on image */}
                <div className="sm:hidden absolute inset-x-0 top-3 z-10 flex justify-between px-3">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-sm text-brand-ink-900 shadow-sm border border-brand-gray-150"
                  >
                    <Share className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {images.length > 0 ? (
                <div className="mt-3 flex items-center gap-3">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      aria-label={`image ${i + 1}`}
                      className={`relative h-[64px] w-[86px] rounded-md overflow-hidden border ${
                        i === activeImage
                          ? "border-brand-orange-500"
                          : "border-brand-gray-200"
                      }`}
                      onClick={() => setActiveImage(i)}
                    >
                      <Image
                        src={src}
                        alt={galleryImageAltTexts[i] || coverImageAltText}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              {product?.name ? (
                <h1 className="text-[22px] sm:text-[24px] md:text-[26px] font-semibold text-brand-ink-900">
                  {product.name}
                </h1>
              ) : null}

              {SHOW_PRODUCT_REVIEWS && hasRating ? (
                <div className="mt-2 flex items-center gap-2 text-brand-gray-700 text-[14px]">
                  <Star className="h-4 w-4 fill-brand-ink-900 text-brand-ink-900" />
                  {ratingValue != null ? (
                    <span className="font-medium">
                      {ratingValue.toFixed(2)}
                    </span>
                  ) : null}
                  {ratingCount ? (
                    <span className="text-brand-gray-400">({ratingCount})</span>
                  ) : null}
                </div>
              ) : null}

              <Separator className="my-3 bg-brand-gray-200" />

              <div className="mt-3 bg-white text-[14px] text-brand-gray-700 space-y-2">
                {dimensionSummary && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-brand-ink-900 font-medium">
                      Size:
                    </span>
                    <span>{dimensionSummary}</span>
                  </div>
                )}
                {product?.deliveryAndCollection && (
                  <div className="flex flex-col gap-1">
                    <span className="text-brand-ink-900 font-medium">
                      Delivery & Collection:
                    </span>
                    <span>{product.deliveryAndCollection}</span>
                  </div>
                )}
              </div>
              <Separator className="my-3 bg-brand-gray-200" />

              {/* Booking Calendar */}
              <div className="mt-6">
                <h2 className="text-brand-ink-900 font-semibold text-[16px] mb-3">
                  Booking Calendar
                </h2>

                <div className="rounded-xl md:border border-brand-gray-200 bg-white w-full flex justify-center">
                  <div className="p-2 w-full max-w-[420px] sm:max-w-[520px] font-londrina">
                    {mounted ? (
                      <Calendar
                        className="w-full"
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={isMobile ? 1 : 2}
                        month={baseMonth}
                        onMonthChange={setBaseMonth}
                        pagedNavigation
                        disabled={isDisabled}
                        modifiers={{ booked: isBooked }}
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="h-[330px] w-full animate-pulse rounded-xl bg-slate-50"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Sidebar */}
            <aside className="w-full order-1">
              <Card className="rounded-2xl shadow-[0_10px_30px_var(--alpha-black-8)] border border-brand-gray-200">
                <CardContent className="p-0">
                  <div className="px-3 md:pt-6">
                    <div className="text-center">
                      {hasPrice ? (
                        <>
                          <div className="text-brand-ink-900 text-[28px] font-semibold">
                            £{dateRange?.from ? grandTotal : pricePerDay}
                          </div>
                          <div className="text-[12px] text-brand-zinc-400">
                            {dateRange?.from
                              ? dateRange?.to
                                ? `For ${rangeDays} days • ${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                                : `For 1 day • ${format(dateRange.from, "MMM d")}`
                              : "Select dates"}
                          </div>
                          {extrasTotal > 0 ? (
                            <div className="mt-1 text-[12px] text-brand-zinc-400">
                              Includes £{extrasTotal} in options
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>

                    {hasPrice ? (
                      <div className="mt-4 grid grid-cols-2 rounded-lg overflow-hidden border border-brand-gray-150">
                        <div className="px-3 py-2 flex items-center justify-center gap-1 text-center">
                          <div className="text-brand-ink-900 text-sm font-medium">
                            £{pricePerDay}
                          </div>
                          <div className="text-[11px] text-brand-zinc-400">
                            Per day
                          </div>
                        </div>
                        <div className="px-3 py-2 text-center flex items-center justify-center gap-1 border-l border-brand-gray-150">
                          <div className="text-brand-ink-900 text-sm font-medium">
                            £{pricePerWeek}
                          </div>
                          <div className="text-[11px] text-brand-zinc-400">
                            Per week
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {extraOptions.length ? (
                      <div className="mt-4 rounded-lg border border-brand-gray-150 px-3 py-3">
                        <div className="text-[13px] font-medium text-brand-ink-900">
                          Other Options:
                        </div>
                        <div className="mt-2 space-y-2">
                          {extraOptions.map((option) => {
                            const quantity = selectedExtras[option.key] ?? 0;
                            const isSingle = option.max <= 1;
                            return (
                              <div
                                key={option.key}
                                className="flex items-start justify-between gap-3"
                              >
                                {isSingle ? (
                                  <label className="flex flex-1 items-start gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange-500"
                                      checked={quantity > 0}
                                      onChange={(event) =>
                                        setExtraQuantity(
                                          option.key,
                                          event.target.checked ? 1 : 0,
                                        )
                                      }
                                    />
                                    <span className="text-[13px] leading-5 text-brand-ink-900">
                                      {option.label}
                                    </span>
                                  </label>
                                ) : (
                                  <span className="flex flex-1 flex-col gap-1">
                                    <span className="text-[13px] leading-5 text-brand-ink-900">
                                      {option.label}
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        aria-label={`Decrease ${option.label}`}
                                        className="h-6 w-6 rounded border border-brand-gray-150 text-brand-ink-900 disabled:opacity-40"
                                        disabled={quantity <= 0}
                                        onClick={() =>
                                          setExtraQuantity(
                                            option.key,
                                            quantity - 1,
                                          )
                                        }
                                      >
                                        −
                                      </button>
                                      <span className="w-6 text-center text-[13px] text-brand-ink-900">
                                        {quantity}
                                      </span>
                                      <button
                                        type="button"
                                        aria-label={`Increase ${option.label}`}
                                        className="h-6 w-6 rounded border border-brand-gray-150 text-brand-ink-900 disabled:opacity-40"
                                        disabled={quantity >= option.max}
                                        onClick={() =>
                                          setExtraQuantity(
                                            option.key,
                                            quantity + 1,
                                          )
                                        }
                                      >
                                        +
                                      </button>
                                    </span>
                                  </span>
                                )}
                                <span className="shrink-0 text-[13px] font-medium text-brand-ink-900">
                                  £{option.price}
                                  {option.pricingType === "per_day" ? (
                                    <span className="text-[11px] font-normal text-brand-zinc-400">
                                      {" "}
                                      / day
                                    </span>
                                  ) : null}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="px-3 pt-4 md:py-4 space-y-3">
                    {/* Date popover (desktop) */}
                    <div className="hidden md:block relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      <Popover open={openDate} onOpenChange={setOpenDate}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-10 w-full rounded-[8px] justify-between pl-9 pr-3 border-brand-gray-125 font-normal text-brand-ink-900"
                          >
                            <span>{formattedSidebarDate}</span>
                            <span className="text-brand-gray-600">▾</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="center"
                          className="p-0 rounded-xl border bg-white w-full"
                        >
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={isMobile ? 1 : 2}
                            month={baseMonth}
                            onMonthChange={setBaseMonth}
                            disabled={isDisabled}
                            modifiers={{ booked: isBooked }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <button
                      className="flex
                        w-full h-10 sm:h-12
                        rounded-full
                        bg-brand-orange-500
                        text-white font-semibold
                        items-center justify-center gap-2
                        text-[14px] sm:text-[16px]
                        border border-white
                        shadow-[0_2px_6px_var(--alpha-black-15)]
                        hover:bg-brand-orange-450
                        transition-all duration-200"
                      onClick={onBook}
                      disabled={!dateRange?.from || !product || !hasPrice}
                    >
                      Book Product
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>

          <section className="mt-10 space-y-6">
            {product?.description ? (
              <div className="space-y-2">
                <h3 className="text-brand-ink-900 text-[18px] font-semibold">
                  Description
                </h3>
                <RichText
                  html={product.description}
                  className="text-brand-gray-700"
                />
              </div>
            ) : null}

            {product?.sensitiveDetails && (
              <div className="space-y-2">
                <h3 className="text-brand-ink-900 text-[18px] font-semibold">
                  ⚠️ Sensitive Colour Product Notice (Refundable Cleaning &
                  Damage Deposit)
                </h3>
                <RichText
                  html={product.sensitiveDetails}
                  className="text-brand-gray-700"
                />
              </div>
            )}

            {product?.deliveryAndCollection && (
              <div className="space-y-2">
                <h3 className="text-brand-ink-900 text-[18px] font-semibold">
                  Delivery & Collection
                </h3>
                <p className="text-brand-gray-700">
                  {product.deliveryAndCollection}
                </p>
              </div>
            )}

            {product?.ageRange && (
              <div className="space-y-2">
                <h3 className="text-brand-ink-900 text-[18px] font-semibold">
                  Age Range
                </h3>
                <p className="text-brand-gray-700">
                  {typeof product.ageRange === "string"
                    ? product.ageRange
                    : `Suitable for children aged ${product.ageRange.min ?? "—"}–${
                        product.ageRange.max ?? "—"
                      } ${product.ageRange.unit ?? ""}.`}
                </p>
              </div>
            )}

          </section>

          {visualization && hasDimensions ? (
            <section className="mt-10">
              <h3 className="text-brand-ink-900 text-[18px] font-semibold">
                Dimensions Visualization
              </h3>
              <p className="text-brand-gray-700 text-[14px] mt-1">
                {dimensionSummary}
              </p>

              <div className="flex justify-start overflow-x-auto">
                <div className="relative h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] flex-shrink-0">
                  <Image
                    src={visualization.image}
                    alt="Dimensions visualization"
                    fill
                    sizes="(max-width: 640px) 280px, 380px"
                    className="object-contain"
                    priority={false}
                  />

                  <div className="absolute right-[8%] sm:right-[8.2%] top-[37.5%] sm:top-[39%] text-[10px] sm:text-xs text-brand-slate-950 font-semibold">
                    {dimensions.height} FT
                  </div>
                  <div className="absolute left-[20%] sm:left-[21%] bottom-[13%] sm:bottom-[15%] text-[10px] sm:text-xs text-brand-slate-950 rotate-[10deg] font-semibold">
                    {dimensions.width} FT
                  </div>
                  <div className="absolute right-[18%] sm:right-[19%] bottom-[26%] sm:bottom-[27%] text-[10px] sm:text-xs text-brand-slate-950 rotate-[-50deg] font-semibold">
                    {dimensions.length} FT
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {Array.isArray(product?.certificates) && product.certificates.length > 0 ? (
            <section className="mt-10">
              <h3 className="text-brand-ink-900 text-[18px] font-semibold">
                Certificates
              </h3>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {product.certificates.map((certificate, index) => {
                  const isPdf = isPdfAsset(certificate);
                  if (isPdf) {
                    return (
                      <button
                        key={`${certificate.slice(0, 20)}-${index}`}
                        type="button"
                        onClick={() => openCertificate(certificate)}
                        className="group rounded-lg border border-brand-gray-200 bg-white p-2 hover:border-brand-orange-300 text-left"
                      >
                        <div className="aspect-square w-full overflow-hidden rounded-md border border-brand-gray-100 bg-brand-gray-50 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 text-brand-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-xs font-medium">View PDF</span>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] text-brand-gray-700 group-hover:text-brand-ink-900 truncate">
                          Certificate {index + 1} (PDF)
                        </p>
                      </button>
                    );
                  }
                  return (
                    <a
                      key={`${certificate.slice(0, 20)}-${index}`}
                      href={certificate}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-lg border border-brand-gray-200 bg-white p-2 hover:border-brand-orange-300"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-brand-gray-100 bg-brand-gray-50">
                        <Image
                          src={certificate}
                          alt={`Certificate ${index + 1}`}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-brand-gray-700 group-hover:text-brand-ink-900 truncate">
                        Certificate {index + 1} (Image)
                      </p>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}

          {SHOW_PRODUCT_REVIEWS && product && (product._id || product.id) ? (
            <ProductReviews
              productId={String(product._id || product.id)}
              productName={product.name}
            />
          ) : null}
        </div>

        <BookingInfoStrip />
      </div>
    </TooltipProvider>
  );
}

function Aspect({
  children,
  className = "",
  ratio = 4 / 3,
}: {
  children: React.ReactNode;
  className?: string;
  ratio?: number;
}) {
  return (
    <div
      className={`relative w-full ${className}`}
      style={{ paddingTop: `${100 / ratio}%` }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="w-full mt-36 font-inter">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-4 pb-28 sm:py-6 animate-pulse">
        <div className="h-4 w-64 rounded bg-brand-gray-200" />

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-6">
          <div>
            <div className="relative rounded-xl overflow-hidden border border-brand-gray-200 bg-brand-gray-75">
              <Aspect className="rounded-xl">
                <div />
              </Aspect>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[64px] w-[86px] rounded-md bg-brand-gray-75 border border-brand-gray-200"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="h-7 w-3/4 rounded bg-brand-gray-200" />
            <div className="mt-3 h-4 w-32 rounded bg-brand-gray-200" />
            <div className="my-3 h-px w-full bg-brand-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-brand-gray-200" />
              <div className="h-4 w-2/3 rounded bg-brand-gray-200" />
              <div className="h-4 w-1/2 rounded bg-brand-gray-200" />
            </div>
            <div className="my-6 h-5 w-40 rounded bg-brand-gray-200" />
            <div className="h-[320px] rounded-xl border border-brand-gray-200 bg-brand-gray-75" />
          </div>

          <aside className="w-full order-1">
            <div className="rounded-2xl border border-brand-gray-200 p-6">
              <div className="h-8 w-24 rounded bg-brand-gray-200 mx-auto" />
              <div className="mt-2 h-3 w-32 rounded bg-brand-gray-200 mx-auto" />
              <div className="mt-4 h-14 rounded-lg bg-brand-gray-75 border border-brand-gray-200" />
              <div className="mt-6 h-10 rounded-[8px] bg-brand-gray-75 border border-brand-gray-200" />
              <div className="mt-3 h-12 rounded-full bg-brand-gray-200" />
            </div>
          </aside>
        </div>

        <div className="mt-10 space-y-3">
          <div className="h-5 w-40 rounded bg-brand-gray-200" />
          <div className="h-4 w-full rounded bg-brand-gray-200" />
          <div className="h-4 w-5/6 rounded bg-brand-gray-200" />
          <div className="h-4 w-2/3 rounded bg-brand-gray-200" />
        </div>
      </div>
    </div>
  );
}
