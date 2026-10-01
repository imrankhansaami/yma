"use client";

import {
  differenceInCalendarDays,
  format,
  isBefore,
  startOfMonth,
  startOfToday,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ApiProduct,
  fetchProduct,
  fetchProductBySlug,
} from "@/services/product.service";
import { useCartStore } from "@/store/useCartStore";

export type ProductCardProps = {
  id?: string | number;
  slug?: string;

  images: { src: string; alt?: string }[];
  title: string;
  subtitle?: string;
  subnote?: string;
  priceOriginal?: number | null;
  priceCurrent: number;
  priceSuffix?: string;
  discountPercent?: number | null;
  linkQuery?: string;
  onBook?: () => void;
  onAddToCart?: () => void;
  className?: string;
  isLoading?: boolean;
};

const productDetailsCache = new Map<string, Promise<ApiProduct | null>>();

async function getProductDetails(productId: string): Promise<ApiProduct | null> {
  const cached = productDetailsCache.get(productId);
  if (cached) return cached;

  const isObjectId = /^[a-f0-9]{24}$/i.test(String(productId || "").trim());
  const request = (isObjectId
    ? fetchProduct(productId)
    : fetchProductBySlug(productId)
  ).catch(() => null);

  productDetailsCache.set(productId, request);
  return request;
}

export default function ProductCard({
  id,
  slug,
  images,
  title,
  subtitle = "Total Rental Price",
  subnote = "Incl. taxes",
  priceOriginal = null,
  priceCurrent,
  priceSuffix = "per day",
  discountPercent = null,
  linkQuery,
  onBook,
  className = "",
  isLoading = false,
}: ProductCardProps) {
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateRange | undefined>(
    undefined,
  );
  const [baseMonth, setBaseMonth] = useState<Date>(startOfMonth(new Date()));
  const [isAdding, setIsAdding] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [resolvedSlug, setResolvedSlug] = useState<string>(
    String(slug || "").trim(),
  );

  const today = startOfToday();
  const bookedSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const isBooked = (d: Date) => bookedSet.has(format(d, "yyyy-MM-dd"));
  const isDisabled = (d: Date) => isBefore(d, today) || isBooked(d);
  const formattedInputValue = useMemo(() => {
    if (!selectedDate?.from) return "Select dates";
    if (selectedDate.to) {
      return `${format(selectedDate.from, "MMM dd")} - ${format(
        selectedDate.to,
        "MMM dd, yyyy",
      )}`;
    }
    return format(selectedDate.from, "PP");
  }, [selectedDate]);

  const {
    addItem,
    open: openCart,
    items,
    removeItem,
  } = useCartStore();

  const hasDiscount =
    typeof discountPercent === "number" &&
    !Number.isNaN(discountPercent) &&
    discountPercent > 0;

  const img = images?.[0];
  const normalizedSlug = String(slug || "").trim();
  const effectiveSlug = String(resolvedSlug || normalizedSlug).trim();
  const productPathId =
    id !== undefined && id !== null && effectiveSlug ? effectiveSlug : null;
  const existingInCart = id
    ? items.some((it) => String(it.id) === String(id))
    : false;

  const handleConfirmDate = async () => {
    if (!selectedDate?.from || !id) return;
    setIsAdding(true);
    try {
      const startISO = format(selectedDate.from, "yyyy-MM-dd");
      const days = selectedDate.to
        ? differenceInCalendarDays(selectedDate.to, selectedDate.from) + 1
        : 1;
      await addItem({
        id: String(id),
        title,
        image: images?.[0]?.src ?? "",
        dateISO: startISO,
        days,
        pricePerDay: priceCurrent,
        quantity: 1,
      });
      openCart();
      setOpenDatePicker(false);
    } finally {
      setIsAdding(false);
    }
  };

  const Title = () => {
    const titleEl = (
      <span className="text-brand-ink-900 font-semibold text-[15px] leading-5 sm:text-[18px] sm:leading-6">
        {title}
      </span>
    );
    if (id !== undefined && id !== null) {
      const query = linkQuery ? `?${linkQuery}` : "";
      if (!effectiveSlug) return titleEl;
      return (
        <Link
          href={`/product/${effectiveSlug}${query}`}
          className="inline-block focus:outline-none focus:ring-0 cursor-pointer"
        >
          {titleEl}
        </Link>
      );
    }
    return (
      <span className="text-brand-ink-900 font-semibold text-[15px] leading-5 sm:text-[18px] sm:leading-6">
        {title}
      </span>
    );
  };

  useEffect(() => {
    if (!id) {
      setBookedDates([]);
      return;
    }

    let mounted = true;
    const productId = String(id);

    (async () => {
      const p = await getProductDetails(productId);
      if (!mounted) return;

      if (!p) {
        setBookedDates([]);
        return;
      }
      const nextSlug = String((p as any)?.slug || "").trim();
      if (nextSlug) setResolvedSlug(nextSlug);
      const booked = Array.isArray((p as any)?.bookedDates)
        ? (p as any).bookedDates
            .map((entry: any) => entry?.date)
            .filter(Boolean)
            .map((date: string) => format(new Date(date), "yyyy-MM-dd"))
        : [];
      setBookedDates(booked);
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <ProductCardSkeleton className={className} />;
  }

  return (
    <>
      <article
        className={[
          "w-full min-w-0 bg-white overflow-hidden h-full flex flex-col",
          className,
        ].join(" ")}
        aria-label={title}
      >
        {/* Image */}
        <div className="relative pt-3 sm:pt-4">
          {productPathId ? (
            <Link
              href={`/product/${productPathId}${linkQuery ? `?${linkQuery}` : ""}`}
              className="relative block w-full overflow-hidden rounded-xl aspect-[4/3] sm:h-[250px] sm:aspect-auto"
              aria-label={`View ${title}`}
            >
              {img ? (
                <Image
                  src={img.src}
                  alt={img.alt || title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 420px"
                  priority={false}
                />
              ) : (
                <div className="h-full w-full bg-brand-gray-75" />
              )}
            </Link>
          ) : (
            <div className="relative w-full overflow-hidden rounded-xl aspect-[4/3] sm:h-[250px] sm:aspect-auto">
              {img ? (
                <Image
                  src={img.src}
                  alt={img.alt || title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 420px"
                  priority={false}
                />
              ) : (
                <div className="h-full w-full bg-brand-gray-75" />
              )}
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute left-2 top-5 sm:top-6 rounded-md bg-white text-brand-ink-900 text-xs sm:text-sm font-semibold px-2.5 py-1.5 shadow-[0_1px_2px_var(--alpha-black-8)]">
              {discountPercent}% Off
            </div>
          )}

          {images && images.length > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-5 flex items-center gap-1.5">
              {images.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === 0 ? "bg-white" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pb-4 sm:pb-5 pt-3 sm:pt-4 min-w-0 flex-1 flex flex-col">
          <h3 className="m-0 min-h-[44px] sm:min-h-[52px]">
            <Title />
          </h3>

          {/* Captions */}
          <div className="mt-1.5 sm:mt-2 min-h-[40px] sm:min-h-[48px]">
            <p className="text-brand-gray-400 text-[12px] sm:text-[14px]">
              {subtitle}
            </p>
            <p className="text-brand-gray-400 text-[12px] sm:text-[14px] mt-0.5 sm:mt-1">
              {subnote}
            </p>
          </div>

          <div className="mt-auto">
            {/* Price */}
            <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0">
                {priceOriginal && priceOriginal > priceCurrent ? (
                  <span className="text-brand-gray-400 line-through text-[14px] sm:text-[18px]">
                    £{priceOriginal}
                  </span>
                ) : null}
                <span className="text-brand-ink-900 text-[16px] sm:text-[18px] font-semibold">
                  £{priceCurrent}
                </span>
                <span className="text-brand-gray-700 text-[12px] sm:text-[16px]">
                  {priceSuffix}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              {id && effectiveSlug ? (
                <Link
                  href={`/product/${effectiveSlug}${linkQuery ? `?${linkQuery}` : ""}`}
                  type="button"
                  onClick={onBook}
                  className="
    w-full h-9 sm:h-12
    rounded-full
    bg-brand-orange-500
    text-white font-semibold
    flex items-center justify-center gap-2
    text-[13px] sm:text-[16px]
    border border-white
    shadow-[0_2px_6px_var(--alpha-black-15)]
    hover:bg-brand-orange-450
    transition-all duration-200
  "
                >
                  <span>Book Product</span>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="
    w-full h-9 sm:h-12
    rounded-full
    bg-brand-gray-150
    text-brand-ink-900/60 font-semibold
    flex items-center justify-center gap-2
    text-[13px] sm:text-[16px]
    border border-white
    shadow-[0_2px_6px_var(--alpha-black-15)]
    cursor-not-allowed
  "
                >
                  <span>Book Product</span>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}

              {/* Add to cart / Quantity selector */}
              {!existingInCart ? (
                <button
                  type="button"
                  onClick={() => setOpenDatePicker(true)}
                  className="w-full h-9 sm:h-12 rounded-full bg-white text-brand-ink-900 font-semibold border border-brand-gray-150 hover:bg-brand-gray-25 flex items-center justify-center gap-2 text-[13px] sm:text-[16px]"
                >
                  <span>Add to Cart</span>
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (!id) return;
                    await removeItem(String(id));
                  }}
                  className="w-full h-9 sm:h-12 rounded-full bg-white text-brand-ink-900 font-semibold border border-brand-gray-150 hover:bg-brand-gray-25 flex items-center justify-center gap-2 text-[13px] sm:text-[16px]"
                >
                  Remove from Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      <Dialog open={openDatePicker} onOpenChange={setOpenDatePicker}>
        <DialogContent
          className="bg-white font-inter p-0 w-[94vw] max-w-[370px] md:max-w-[470px] rounded-[18px] max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 pt-3 sm:pt-5">
            <DialogTitle className="text-[18px] sm:text-[20px] font-semibold text-brand-ink-900">
              Please Select Your Booking Date
            </DialogTitle>
            <DialogClose asChild>
              <button
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-brand-gray-90 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-brand-ink-900" />
              </button>
            </DialogClose>
          </div>

          <div className="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
            <div className="w-full h-10 sm:h-12 rounded-[12px] border border-brand-gray-150 bg-brand-gray-115 text-brand-gray-650 flex items-center px-4 text-[15px] gap-2">
              <CalendarIcon className="h-5 w-5 text-brand-gray-350" />
              <span className="flex-1">{formattedInputValue}</span>
              <ChevronDown className="h-5 w-5 text-brand-gray-350" />
            </div>

            <div className="mt-4 rounded-2xl px-1 pt-1 pb-2">
              <Calendar
                mode="range"
                numberOfMonths={1}
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={baseMonth}
                onMonthChange={setBaseMonth}
                disabled={isDisabled}
                modifiers={{ booked: isBooked }}
                showOutsideDays
                className="w-full"
                classNames={{
                  root: cn(
                    "w-full [--cell-size:34px] sm:[--cell-size:44px]",
                    "[&_button.rdp-day]:h-[var(--cell-size)] [&_button.rdp-day]:w-full [&_button.rdp-day]:rounded-[10px]",
                    "[&_button.rdp-day]:text-[15px] [&_button.rdp-day]:font-medium",
                    "[&_button[aria-selected='true']]:!bg-brand-orange-500 [&_button[aria-selected='true']]:!text-white",
                    "[&_button[aria-selected='true']]:shadow-[0_4px_10px_var(--alpha-orange-500-35)]",
                    "[&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-brand-orange-500/40",
                  ),
                  button_previous:
                    "h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg border border-brand-gray-150 bg-white text-brand-ink-900 hover:bg-brand-gray-110",
                  button_next:
                    "h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg border border-brand-gray-150 bg-white text-brand-ink-900 hover:bg-brand-gray-110",
                  caption_label:
                    "text-[14px] sm:text-[16px] font-semibold text-brand-ink-900 tracking-tight",
                  weekdays: "flex px-1 sm:px-2 mt-1",
                  weekday:
                    "flex-1 text-center text-sm text-brand-zinc-400 font-medium",
                  week: "flex w-full mt-2 px-1 sm:px-2 gap-0",
                  day: "flex-1",
                  outside: "text-brand-gray-300",
                  disabled: "text-brand-gray-300 opacity-60",
                  table: "w-full",
                  day_range_start:
                    "!rounded-l-[10px] !rounded-r-none bg-brand-orange-500 text-white",
                  day_range_end:
                    "!rounded-r-[10px] !rounded-l-none bg-brand-orange-500 text-white",
                  day_range_middle:
                    "!rounded-none bg-brand-orange-500/20 text-brand-ink-900",
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-10 sm:h-11 px-5 sm:px-6 rounded-full border-brand-gray-300 text-brand-ink-900 text-[15px] font-semibold bg-white hover:bg-brand-gray-110"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleConfirmDate}
                disabled={!selectedDate?.from || isAdding}
                className="h-10 sm:h-11 px-6 sm:px-7 rounded-full bg-brand-orange-500 hover:bg-brand-orange-450 text-white text-[15px] font-semibold"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProductCardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <article
      className={[
        "w-full min-w-0 bg-white overflow-hidden animate-pulse",
        className,
      ].join(" ")}
      aria-label="Loading product"
    >
      <div className="relative pt-3 sm:pt-4">
        <div className="relative w-full overflow-hidden rounded-xl h-[180px] sm:h-[250px] bg-brand-gray-75" />
        <div className="absolute left-2 top-5 sm:top-6 h-6 w-20 rounded-md bg-brand-gray-200" />
        <div className="absolute right-4 sm:right-6 top-4 sm:top-6 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-gray-200" />
      </div>

      <div className="pb-4 sm:pb-5 pt-3 sm:pt-4 min-w-0">
        <div className="h-5 w-3/4 rounded bg-brand-gray-200" />
        <div className="mt-2 space-y-2">
          <div className="h-4 w-32 rounded bg-brand-gray-200" />
          <div className="h-4 w-24 rounded bg-brand-gray-200" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-5 w-14 rounded bg-brand-gray-200" />
          <div className="h-4 w-20 rounded bg-brand-gray-200" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-9 sm:h-12 rounded-full bg-brand-gray-200" />
          <div className="h-9 sm:h-12 rounded-full bg-brand-gray-75 border border-brand-gray-200" />
        </div>
      </div>
    </article>
  );
}
