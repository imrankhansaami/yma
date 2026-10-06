"use client";

import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Home,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore } from "@/store/useCartStore";
import {
  CartExtra,
  computeExtrasTotal,
} from "@/store/useCartStore";

import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  startOfToday,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import Bg1 from "@/assets/images/bg1.png";
import EmptyIcons from "@/assets/images/Empty icons.png";
import CategoryCarousels from "@/components/CategoryCarousels";
import { cn } from "@/lib/utils";
import {
  fetchFrequentlyBoughtProducts,
  fetchProduct,
  fetchProducts,
  type ApiProduct,
  type FetchProductsResponse,
  type FrequentlyBoughtRelationship,
} from "@/services/product.service";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useQuery } from "@tanstack/react-query";

type FBTItem = {
  id: string;
  title: string;
  priceOriginal: number;
  priceCurrent: number;
  image: string;
  images?: string[];
  badge?: string;
};

const hasStockLike = (value: any): boolean => {
  const stock = Number(
    value?.stock ?? value?.quantity ?? value?.availability?.availableStock ?? 0,
  );
  return Number.isFinite(stock) && stock > 0;
};

export default function CartClient() {
  const { items, removeItem, addItem, updateItemDays } = useCartStore() as any;
  const router = useRouter();
  const { loadCategories, findCategoryId } = useCategoryStore();

  const [daysLocal, setDaysLocal] = useState<Record<string, number>>({});
  const [fbtQuantities, setFbtQuantities] = useState<Record<string, number>>(
    {},
  );
  const [showFbtModal, setShowFbtModal] = useState(false);
  const [fbtImageIndexes, setFbtImageIndexes] = useState<
    Record<string, number>
  >({});
  const [showFbtDatePicker, setShowFbtDatePicker] = useState(false);
  const [fbtDate, setFbtDate] = useState<DateRange | undefined>(undefined);
  const [fbtDateItem, setFbtDateItem] = useState<FBTItem | null>(null);
  const [fbtIsAdding, setFbtIsAdding] = useState(false);
  const [fbtBaseMonth, setFbtBaseMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [fbtBookedDates, setFbtBookedDates] = useState<Set<string>>(new Set());

  const fbtToday = startOfToday();
  const fbtFormattedInputValue = useMemo(() => {
    if (!fbtDate?.from) return "Select dates";
    if (fbtDate.to) {
      return `${format(fbtDate.from, "MMM dd")} - ${format(
        fbtDate.to,
        "MMM dd, yyyy",
      )}`;
    }
    return format(fbtDate.from, "PP");
  }, [fbtDate]);
  const isFbtBooked = (d: Date) =>
    fbtBookedDates.has(format(d, "yyyy-MM-dd"));
  const isFbtDisabled = (d: Date) => d < fbtToday || isFbtBooked(d);
  // Load categories for dynamic lookups
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Resolve Garden Games category id for modal content
  const gardenId = findCategoryId(["Garden Games"]);

  // Fetch frequently bought products
  const { data: fbtRelationships, isLoading: fbtLoading } = useQuery<
    FrequentlyBoughtRelationship[]
  >({
    queryKey: ["frequently-bought-all"],
    queryFn: fetchFrequentlyBoughtProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform API data to FBTItem format
  const fbtItems: FBTItem[] = useMemo(
    () =>
      (fbtRelationships ?? [])
        .flatMap((relationship) =>
          relationship.frequentlyBought
            .filter((item) => hasStockLike(item))
            .map((item) => {
            const priceOriginal = item.price ?? 0;
            const priceCurrent = item.discountPrice ?? priceOriginal;
            const hasDiscount =
              item.discount && item.discount > 0 && item.discountPrice;
            const discountPercent = hasDiscount
              ? Math.round((item.discount as number) * 100) / 100
              : null;

            return {
              id: String(item.productId ?? ""),
              title: String(item.productName ?? ""),
              priceOriginal: priceOriginal,
              priceCurrent: priceCurrent,
              image: item.imageCover || (Bg1 as unknown as { src: string }).src,
              images:
                item.images && item.images.length > 0 ? item.images : undefined,
              badge: discountPercent
                ? `${Math.round(discountPercent)}% Off`
                : undefined,
            };
            }),
        )
        .filter((item, index, list) => {
          const id = item.id;
          return id && list.findIndex((entry) => entry.id === id) === index;
        })
        .slice(0, 6), // Limit to 6 items for display
    [fbtRelationships],
  );

  const {
    data: gardenResp,
    isLoading: gardenLoading,
    isError: gardenError,
  } = useQuery<FetchProductsResponse>({
    queryKey: ["cart-modal-garden", gardenId],
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

  const gardenProducts: ApiProduct[] = (gardenResp?.items ?? []).filter(
    hasStockLike,
  );
  const gardenItemsForModal: FBTItem[] = gardenProducts.map((p) => {
    const cover =
      p.imageCover ||
      (Array.isArray(p.images) && p.images[0]) ||
      (Bg1 as unknown as { src: string }).src;
    const hasDiscount =
      typeof p.priceDiscount === "number" && p.priceDiscount > 0;
    const priceOriginal = hasDiscount ? p.price : p.price;
    const priceCurrent = hasDiscount ? p.priceDiscount! : p.price;
    const discountPercent =
      hasDiscount && p.price > 0
        ? Math.round(((p.price - p.priceDiscount!) / p.price) * 100)
        : null;
    return {
      id: String(p.id ?? p._id ?? ""),
      title: p.name,
      priceOriginal,
      priceCurrent,
      image: cover,
      badge: discountPercent ? `${discountPercent}% Off` : undefined,
    };
  });

  const keyFor = (id: string, dateISO?: string) => `${id}-${dateISO ?? ""}`;

  const rows = useMemo(
    () =>
      (items || []).map((it: any) => {
        const key = keyFor(it.id, it.dateISO);
        const days = daysLocal[key] ?? it.days ?? 1;
        const perDay = Number(it.pricePerDay ?? 0);
        const extras = (it.extras ?? []) as CartExtra[];
        const extrasTotal = computeExtrasTotal(extras, days);
        return {
          ...it,
          key,
          days,
          quantity: 1,
          perDay,
          extras,
          extrasTotal,
          total: perDay * days + extrasTotal,
        };
      }),
    [items, daysLocal],
  );

  const setDays = async (row: any, next: number) => {
    const clamped = Math.max(1, Math.min(30, next));
    // instant UI
    setDaysLocal((m) => ({ ...m, [row.key]: clamped }));
    try {
      await updateItemDays(row.id, row.dateISO, clamped, row.quantity);
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    const map: Record<string, number> = {};
    const trackedIds = new Set<string>([
      ...fbtItems.map((f) => f.id),
      ...gardenItemsForModal.map((f) => f.id),
    ]);
    rows.forEach((r: any) => {
      if (trackedIds.has(String(r.id))) {
        const qty = typeof r.quantity === "number" ? r.quantity : 1;
        map[String(r.id)] = (map[String(r.id)] || 0) + Math.max(0, qty);
      }
    });
    setFbtQuantities((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(map);
      if (prevKeys.length !== nextKeys.length) return map;
      for (const k of nextKeys) {
        if (prev[k] !== map[k]) return map;
      }
      return prev;
    });
  }, [rows, fbtItems, gardenItemsForModal]);

  const handleFbtImageNext = (itemId: string, totalImages: number) => {
    setFbtImageIndexes((prev) => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % totalImages,
    }));
  };

  const handleFbtImagePrev = (itemId: string, totalImages: number) => {
    setFbtImageIndexes((prev) => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  const handleFbtImageSwipe = (
    itemId: string,
    totalImages: number,
    startX: number,
    endX: number,
  ) => {
    const diff = startX - endX;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left, go to next
        handleFbtImageNext(itemId, totalImages);
      } else {
        // Swiped right, go to previous
        handleFbtImagePrev(itemId, totalImages);
      }
    }
  };

  const setFbtQuantity = async (f: FBTItem, nextQty: number) => {
    const qty = Math.max(0, nextQty);
    setFbtQuantities((m) => ({ ...m, [f.id]: qty }));

    const existingRow = rows.find((r: any) => r.id === f.id);
    const primaryBooking =
      rows.find((r: any) => r.id !== f.id) || rows[0] || undefined;
    const baseDate =
      existingRow?.dateISO ||
      primaryBooking?.dateISO ||
      format(new Date(), "yyyy-MM-dd");
    const days = existingRow?.days ?? primaryBooking?.days ?? 1;

    if (qty === 0) {
      await removeItem?.(f.id, baseDate);
      return;
    }

    if (existingRow) {
      await updateItemDays?.(f.id, baseDate, days, qty);
    } else {
      await addItem?.({
        id: f.id,
        title: f.title,
        image: f.image,
        dateISO: baseDate,
        days,
        pricePerDay: f.priceCurrent,
        quantity: qty,
      });
    }
  };

  const openFbtDatePicker = (f: FBTItem) => {
    const primaryBooking =
      rows.find((r: any) => r.id !== f.id) || rows[0] || undefined;
    const baseDate =
      primaryBooking?.dateISO || format(new Date(), "yyyy-MM-dd");
    setFbtDateItem(f);
    setFbtDate({ from: parseISO(baseDate), to: undefined });
    setFbtBookedDates(new Set());
    setShowFbtDatePicker(true);
  };

  useEffect(() => {
    let mounted = true;
    if (!showFbtDatePicker || !fbtDateItem?.id) return;

    (async () => {
      try {
        const product = await fetchProduct(String(fbtDateItem.id));
        if (!mounted) return;
        const booked = Array.isArray(product?.bookedDates)
          ? product.bookedDates
              .map((entry: any) => entry?.date)
              .filter(Boolean)
              .map((date: string) => format(new Date(date), "yyyy-MM-dd"))
          : [];
        setFbtBookedDates(new Set(booked));
      } catch {
        if (mounted) setFbtBookedDates(new Set());
      }
    })();

    return () => {
      mounted = false;
    };
  }, [showFbtDatePicker, fbtDateItem?.id]);

  const confirmFbtDate = async () => {
    if (!fbtDateItem || !fbtDate?.from) return;
    setFbtIsAdding(true);
    try {
      const startISO = format(fbtDate.from, "yyyy-MM-dd");
      const days = fbtDate.to
        ? differenceInCalendarDays(fbtDate.to, fbtDate.from) + 1
        : 1;
      const existingRow = rows.find((r: any) => r.id === fbtDateItem.id);
      const primaryBooking =
        rows.find((r: any) => r.id !== fbtDateItem.id) || rows[0] || undefined;
      const fallbackDays = existingRow?.days ?? primaryBooking?.days ?? 1;

      await addItem?.({
        id: fbtDateItem.id,
        title: fbtDateItem.title,
        image: fbtDateItem.image,
        dateISO: startISO,
        days: days || fallbackDays,
        pricePerDay: fbtDateItem.priceCurrent,
        quantity: 1,
      });
      setFbtQuantities((m) => ({ ...m, [fbtDateItem.id]: 1 }));
      setShowFbtDatePicker(false);
      setFbtDateItem(null);
    } finally {
      setFbtIsAdding(false);
    }
  };

  const performCheckout = () => {
    router.push("/checkout");
  };

  const proceedCheckout = () => {
    setShowFbtModal(false);
    performCheckout();
  };

  const isEmpty = rows.length === 0;
  const subtotalGBP = `£${rows
    .reduce((s: number, r: { total?: number }) => s + (r.total ?? 0), 0)
    .toFixed(2)}`;

  const renderFbtControls = (f: FBTItem) => {
    const row = rows.find((r: any) => String(r.id) === String(f.id));
    const qtyFromRow =
      row && typeof row.quantity === "number" ? Math.max(0, row.quantity) : 0;
    const qty = qtyFromRow > 0 ? qtyFromRow : (fbtQuantities[f.id] ?? 0);

    if (qty <= 0) {
      return (
        <Button
          size="sm"
          className="h-9 w-fit min-w-[120px] rounded-full bg-brand-orange-500 hover:bg-brand-orange-450 text-white font-semibold px-4 cursor-pointer"
          onClick={() => openFbtDatePicker(f)}
        >
          Add to Cart{" "}
          <span aria-hidden className="ml-1">
            +
          </span>
        </Button>
      );
    }

    return (
      <div className="inline-flex items-center justify-between gap-6 h-10 px-4 rounded-full border border-brand-gray-240 bg-white w-fit min-w-[120px]">
        <button
          aria-label="Remove item"
          className="h-6 w-6 flex items-center justify-center text-brand-ink-900 hover:text-brand-ink-900 focus:outline-none"
          onClick={() => setFbtQuantity(f, 0)}
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <span className="text-[15px] font-semibold text-brand-ink-900">
          Added
        </span>
      </div>
    );
  };

  return (
    <section className="w-full font-inter mt-24 md:mt-32">
      <div
        className={[
          "mx-auto max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8",
          !isEmpty ? "pb-28 lg:pb-8" : "",
        ].join(" ")}
      >
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-sm text-brand-gray-600">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 text-brand-gray-300" />
          <span>Shopping Cart</span>
        </div>

        {/* Title */}
        <h1 className="text-brand-ink-900 font-semibold text-[26px] sm:text-[28px]">
          Shopping Cart
        </h1>

        {/* Header divider */}
        <div className="mt-4 border-t border-brand-gray-200" />

        {/* Empty state */}
        <div className="w-full">
          {isEmpty && (
            <div className="px-4 py-14">
              <div className="h-full w-full flex flex-col items-center justify-center text-center">
                <Image src={EmptyIcons} alt="empty icons" priority />
                <p className="mt-6 text-ink-900 text-[18px] font-semibold">
                  Your cart is currently empty!
                </p>
                <p className="mt-2 text-gray-600 text-sm max-w-[18rem]">
                  Looks like you haven&apos;t added anything yet. Start shopping
                  to fill it up.
                </p>
                <Link
                  href="/booking-catalog"
                  className="mt-6 inline-flex w-[min(420px,calc(100%-24px))] h-10 rounded-full bg-brand-orange-500 text-white font-semibold items-center justify-center gap-1 shadow-[0_2px_0_var(--alpha-black-15)] border border-white hover:bg-brand-orange-400 transition-colors"
                >
                  Browse Catalogue <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {!isEmpty && (
            <div className="rounded-xl border-brand-gray-200 overflow-hidden bg-white">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left min-w-full md:min-w-[720px] lg:min-w-0">
                  <colgroup>
                    <col />
                    <col style={{ width: 160 }} />
                    <col style={{ width: 160 }} />
                    <col style={{ width: 80 }} />
                  </colgroup>

                  <thead>
                    <tr className="bg-gray-25 text-[11px] sm:text-[13px] text-brand-gray-600">
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium">
                        Details
                      </th>
                      {/* Hide on mobile to match the screenshot */}
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium hidden md:table-cell">
                        Price Per Day
                      </th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium text-center text-nowrap">
                        Total Price
                      </th>
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 font-medium text-center">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row: any) => (
                      <tr key={row.key} className="align-top border-b">
                        {/* DETAILS */}
                        <td className="py-3 sm:py-4">
                          <div className="flex gap-2 sm:gap-4">
                            {/* Responsive thumbnail (fixes overflow on mobile) */}
                            <div className="relative w-[45px] h-[45px] sm:w-[136px] sm:h-[136px] md:w-[176px] md:h-[150px] rounded-lg overflow-hidden border border-brand-gray-200 shrink-0">
                              <Image
                                src={row.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="(max-width:640px) 110px, (max-width:768px) 136px, 176px"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-brand-ink-900 text-[13px] sm:text-[14px] leading-5 line-clamp-2">
                                {row.title ||
                                  row.productName ||
                                  row.name ||
                                  "Product"}
                              </p>

                              {(row.extras ?? []).length ? (
                                <ul className="mt-1 text-[12px] leading-5 text-brand-gray-600">
                                  {(row.extras as CartExtra[]).map((extra) => (
                                    <li key={extra.key}>+ {extra.label}</li>
                                  ))}
                                </ul>
                              ) : null}

                              <div className="mt-2 text-sm sm:text-[13px]">
                                <div className="text-brand-ink-900 font-semibold">
                                  From:{" "}
                                  <span className="font-normal text-brand-gray-600">
                                    {row.startDateISO && row.endDateISO
                                      ? `${format(
                                          parseISO(row.startDateISO),
                                          "MMM dd",
                                        )} - ${format(
                                          parseISO(row.endDateISO),
                                          "MMM dd, yyyy",
                                        )}`
                                      : row.dateISO
                                        ? format(
                                            parseISO(row.dateISO),
                                            "MMM dd, yyyy",
                                          )
                                        : "—"}
                                  </span>
                                </div>

                                <div className="mt-2 text-brand-ink-900 font-semibold">
                                  Days:{" "}
                                  <span className="font-normal text-brand-gray-600">
                                    {row.days}
                                  </span>
                                </div>
                                <div className="mt-2 inline-flex items-center">
                                  <div className="inline-flex items-center justify-between gap-6 h-10 px-4 rounded-full border border-brand-gray-240 bg-white">
                                    <button
                                      aria-label={
                                        row.days === 1
                                          ? "Remove item"
                                          : "Decrease days"
                                      }
                                      className="h-6 w-6 flex items-center justify-center text-brand-ink-900 hover:text-brand-ink-900 focus:outline-none"
                                      onClick={() =>
                                        row.days === 1
                                          ? removeItem?.(row.id, row.dateISO)
                                          : setDays(row, row.days - 1)
                                      }
                                    >
                                      {row.days === 1 ? (
                                        <Trash2 className="h-4 w-4" />
                                      ) : (
                                        <Minus className="h-4 w-4" />
                                      )}
                                    </button>

                                    <span className="text-[15px] font-semibold text-brand-ink-900">
                                      {row.days}
                                    </span>

                                    <button
                                      aria-label="Increase days"
                                      className="h-6 w-6 flex items-center justify-center text-brand-ink-900 hover:text-brand-ink-900 focus:outline-none"
                                      onClick={() => setDays(row, row.days + 1)}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price per day (desktop/tablet) */}
                        <td className="px-4 py-4  text-center text-[13px] sm:text-[14px] text-brand-ink-900 hidden md:table-cell">
                          £{row.perDay.toFixed(2)}
                        </td>

                        {/* Total price reflects current days */}
                        <td className="px-3 sm:px-4 py-4 text-[13px] sm:text-[14px] text-brand-ink-900 text-center">
                          <span className="sm:hidden">£{row.perDay.toFixed(0)}</span>
                          <span className="hidden sm:inline">
                            £{row.total.toFixed(2)}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td className="px-3 sm:px-4 py-4 text-center">
                          <button
                            aria-label="Remove item"
                            className="rounded hover:bg-brand-gray-25 border border-transparent hover:border-brand-gray-200"
                            onClick={() => removeItem?.(row.id, row.dateISO)}
                          >
                            <Trash2 className="h-4 w-4 text-brand-graphite-700" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isEmpty && (
            <aside className="w-full hidden lg:block">
              {/* Summary card */}
              <div className="rounded-xl border border-brand-gray-200 p-4 bg-white">
                <div className="text-[14px] text-brand-ink-900">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-gray-600">
                      Subtotal ({rows.length}{" "}
                      {rows.length === 1 ? "item" : "items"}):
                    </span>
                    <span className="font-semibold">{subtotalGBP}</span>
                  </div>

                  <button
                    className="w-full mt-4 h-10 rounded-full bg-brand-orange-500 text-white font-semibold flex items-center justify-center gap-1 hover:bg-brand-orange-400 transition-colors"
                    onClick={() => setShowFbtModal(true)}
                  >
                    Proceed to Checkout <span aria-hidden>→</span>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-brand-ink-900 font-semibold text-[14px]">
                  Frequently Bought Together
                </h3>

                <div className="mt-3 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {fbtLoading ? (
                    // Skeleton loading state
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`fbt-skeleton-${idx}`}>
                        <div className="flex gap-3 justify-between">
                          <div className="relative h-[90px] w-[110px] rounded-md overflow-hidden border border-brand-gray-200 shrink-0 bg-slate-100 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
                            <div className="h-10 w-full bg-slate-100 rounded-full animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : fbtItems.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-brand-gray-600">
                        No frequently bought items available
                      </p>
                    </div>
                  ) : (
                    fbtItems.map((f) => {
                      const images =
                        f.images && f.images.length > 0 ? f.images : [f.image];
                      const hasMultipleImages = images.length > 1;
                      const currentIndex = fbtImageIndexes[f.id] || 0;
                      const currentImage = images[currentIndex] || f.image;

                      return (
                        <div key={f.id}>
                          <div className="flex gap-3 justify-between">
                            <div
                              className="relative h-[90px] w-[110px] rounded-md overflow-hidden border border-brand-gray-200 shrink-0 select-none"
                              onMouseDown={(e) => {
                                if (!hasMultipleImages) return;
                                const startX = e.clientX;
                                const handleMouseMove = (
                                  moveEvent: MouseEvent,
                                ) => {
                                  moveEvent.preventDefault();
                                };
                                const handleMouseUp = (upEvent: MouseEvent) => {
                                  const endX = upEvent.clientX;
                                  handleFbtImageSwipe(
                                    f.id,
                                    images.length,
                                    startX,
                                    endX,
                                  );
                                  document.removeEventListener(
                                    "mousemove",
                                    handleMouseMove,
                                  );
                                  document.removeEventListener(
                                    "mouseup",
                                    handleMouseUp,
                                  );
                                };
                                document.addEventListener(
                                  "mousemove",
                                  handleMouseMove,
                                );
                                document.addEventListener(
                                  "mouseup",
                                  handleMouseUp,
                                );
                              }}
                              onTouchStart={(e) => {
                                if (!hasMultipleImages) return;
                                const startX = e.touches[0].clientX;
                                const handleTouchMove = () => {
                                  // Allow scrolling
                                };
                                const handleTouchEnd = (
                                  endEvent: TouchEvent,
                                ) => {
                                  const endX =
                                    endEvent.changedTouches[0].clientX;
                                  handleFbtImageSwipe(
                                    f.id,
                                    images.length,
                                    startX,
                                    endX,
                                  );
                                  document.removeEventListener(
                                    "touchmove",
                                    handleTouchMove,
                                  );
                                  document.removeEventListener(
                                    "touchend",
                                    handleTouchEnd,
                                  );
                                };
                                document.addEventListener(
                                  "touchmove",
                                  handleTouchMove,
                                );
                                document.addEventListener(
                                  "touchend",
                                  handleTouchEnd,
                                );
                              }}
                            >
                              <Image
                                src={currentImage}
                                alt=""
                                fill
                                className="object-cover pointer-events-none"
                                sizes="110px"
                                draggable={false}
                              />
                              {f.badge && (
                                <span className="absolute left-1 top-1 text-[10px] font-semibold bg-brand-sky-500 text-white px-1.5 py-[2px] rounded z-10">
                                  {f.badge}
                                </span>
                              )}
                              {hasMultipleImages && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                  {images.map((_, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-1 w-1 rounded-full ${
                                        idx === currentIndex
                                          ? "bg-white"
                                          : "bg-white/50"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-brand-ink-900 leading-4 line-clamp-2 font-semibold">
                                {f.title}
                              </div>
                              <div className="mt-1 text-sm">
                                <span className="line-through text-brand-zinc-400 mr-1">
                                  ${f.priceOriginal}
                                </span>
                                <span className="text-brand-ink-900 font-semibold">
                                  ${f.priceCurrent}
                                </span>{" "}
                                <span className="text-brand-gray-600">
                                  per day
                                </span>
                              </div>

                              <div className="mt-2">{renderFbtControls(f)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>

        {!isEmpty && (
          <div className="mt-6 lg:hidden">
            <h3 className="text-brand-ink-900 font-semibold text-[15px]">
              Frequently Bought Together
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {fbtLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`fbt-mobile-skel-${idx}`}
                    className="h-[210px] w-full rounded-xl bg-slate-100 animate-pulse"
                  />
                ))
              ) : fbtItems.length === 0 ? (
                <div className="col-span-2 text-sm text-brand-gray-600">
                  No frequently bought items available
                </div>
              ) : (
                fbtItems.map((f) => {
                  const images =
                    f.images && f.images.length > 0 ? f.images : [f.image];
                  const currentIndex = fbtImageIndexes[f.id] || 0;
                  const currentImage = images[currentIndex] || f.image;

                  return (
                    <div
                      key={`fbt-mobile-${f.id}`}
                      className="rounded-xl border border-brand-gray-200 bg-white overflow-hidden"
                    >
                      <div className="relative w-full aspect-[4/3]">
                        <Image
                          src={currentImage}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 200px"
                        />
                        {f.badge && (
                          <span className="absolute left-2 top-2 text-[10px] font-semibold bg-brand-sky-500 text-white px-1.5 py-[2px] rounded">
                            {f.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-[12px] text-brand-ink-900 leading-4 line-clamp-2 font-semibold">
                          {f.title}
                        </div>
                        <div className="mt-1 text-[12px]">
                          {f.priceOriginal &&
                          f.priceOriginal > f.priceCurrent ? (
                            <span className="line-through text-brand-zinc-400 mr-1">
                              ${f.priceOriginal}
                            </span>
                          ) : null}
                          <span className="text-brand-ink-900 font-semibold">
                            ${f.priceCurrent}
                          </span>{" "}
                          <span className="text-brand-gray-600">per day</span>
                        </div>
                        <div className="mt-2">{renderFbtControls(f)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {!isEmpty && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-brand-gray-200 bg-white px-4 py-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 12px)",
          }}
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex items-center justify-between text-[14px] text-brand-ink-900">
              <span className="text-brand-gray-600">
                Subtotal ({rows.length} {rows.length === 1 ? "item" : "items"}):
              </span>
              <span className="font-semibold">{subtotalGBP}</span>
            </div>
            <button
              className="mt-3 w-full h-10 rounded-full bg-brand-orange-500 text-white font-semibold flex items-center justify-center gap-1 hover:bg-brand-orange-400 transition-colors"
              onClick={() => setShowFbtModal(true)}
            >
              Proceed to Checkout <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}

      {showFbtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-[94vw] max-w-[560px] max-h-[90vh] bg-white rounded-[16px] shadow-2xl overflow-hidden">
            <div className="flex flex-col h-[80vh]">
              <div className="sticky top-0 z-10 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[18px] font-semibold text-brand-slate-900">
                      Make The Party Even More Fun
                    </h3>
                    <p className="text-[14px] text-brand-gray-650 mt-1">
                      Add popular garden games before checkout.
                    </p>
                  </div>
                  <button
                    aria-label="Close"
                    className="h-8 w-8 rounded-full hover:bg-brand-gray-100 flex items-center justify-center"
                    onClick={() => setShowFbtModal(false)}
                  >
                    <X className="h-4 w-4 text-brand-slate-950" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 w-full max-w-none">
                {gardenLoading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`sk-${i}`}
                        className="h-[110px] w-full rounded-md bg-gray-200 animate-pulse"
                      />
                    ))}
                  </>
                )}

                {!gardenLoading &&
                  !gardenError &&
                  gardenItemsForModal.map((f) => (
                    <div key={f.id} className="flex gap-3">
                      <div className="relative h-[90px] w-[110px] rounded-md overflow-hidden border border-brand-gray-200 shrink-0">
                        <Image
                          src={f.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="110px"
                        />
                        {f.badge && (
                          <span className="absolute left-1 top-1 text-[10px] font-semibold bg-brand-sky-500 text-white px-1.5 py-[2px] rounded">
                            {f.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-brand-ink-900 leading-4 line-clamp-2 font-semibold">
                          {f.title}
                        </div>
                        <div className="mt-1 text-sm">
                          {f.priceOriginal &&
                          f.priceOriginal > f.priceCurrent ? (
                            <span className="line-through text-brand-zinc-400 mr-1">
                              ${f.priceOriginal}
                            </span>
                          ) : null}
                          <span className="text-brand-ink-900 font-semibold">
                            ${f.priceCurrent}
                          </span>{" "}
                          <span className="text-brand-gray-600">per day</span>
                        </div>

                        <div className="mt-2">{renderFbtControls(f)}</div>
                      </div>
                    </div>
                  ))}

                {!gardenLoading &&
                  !gardenError &&
                  gardenItemsForModal.length === 0 && (
                    <div className="text-sm text-brand-gray-600">
                      No garden games available right now.
                    </div>
                  )}
              </div>

              <div className="sticky bottom-0 z-10 bg-white px-5 py-4 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  className="rounded-full px-5 h-10"
                  onClick={proceedCheckout}
                >
                  Skip
                </Button>
                <Button
                  className="rounded-full px-5 h-10 bg-brand-orange-500 hover:bg-brand-orange-450"
                  onClick={proceedCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom categories showcase */}
      <div className="mt-12">
        <CategoryCarousels />
      </div>

      <Dialog
        open={showFbtDatePicker}
        onOpenChange={(open) => {
          if (!open) {
            setShowFbtDatePicker(false);
            setFbtDateItem(null);
          }
        }}
      >
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
              <span className="flex-1">{fbtFormattedInputValue}</span>
              <ChevronDown className="h-5 w-5 text-brand-gray-350" />
            </div>

            <div className="mt-4 rounded-2xl px-1 pt-1 pb-2">
              <Calendar
                mode="range"
                numberOfMonths={1}
                selected={fbtDate}
                onSelect={setFbtDate}
                month={fbtBaseMonth}
                onMonthChange={setFbtBaseMonth}
                disabled={isFbtDisabled}
                modifiers={{ booked: isFbtBooked }}
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
                onClick={confirmFbtDate}
                disabled={!fbtDate?.from || fbtIsAdding}
                className="h-10 sm:h-11 px-6 sm:px-7 rounded-full bg-brand-orange-500 hover:bg-brand-orange-450 text-white text-[15px] font-semibold"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
