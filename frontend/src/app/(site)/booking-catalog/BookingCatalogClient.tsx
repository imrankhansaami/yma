"use client";

import { format, isValid, parse } from "date-fns";
import {
  Calendar as CalendarIcon,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Bg1 from "@/assets/images/bg1.png";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";

import {
  Category as ApiCategory,
  fetchCategories,
} from "@/services/category.service";
import { fetchLocations } from "@/services/location.service";
import { districtLocations } from "@/lib/locations";
import { SHOW_PRODUCT_REVIEWS } from "@/lib/features";
import {
  fetchProducts,
  type ApiProduct,
  type FetchProductsResponse,
} from "@/services/product.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Sort choices offered on category pages.
 *
 * "default" is not a database sort: the backend alternates a large product with
 * a small one (footprint = length x width) so a category grid mixes big
 * inflatables with smaller add-ons instead of clustering the large items.
 */
const SORT_OPTIONS = [
  { value: "default", label: "Default", sortBy: "default", sortOrder: "desc" },
  { value: "newest", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { value: "price-asc", label: "Low Price First", sortBy: "price", sortOrder: "asc" },
  { value: "price-desc", label: "High Price First", sortBy: "price", sortOrder: "desc" },
] as const;

const DEFAULT_SORT = "default";

function resolveSort(value: string) {
  return SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];
}

function BookingCatalogPageInner({
  forcedCategoryName,
  initialProducts,
  initialTotal,
}: {
  forcedCategoryName?: string;
  initialProducts?: ApiProduct[];
  initialTotal?: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // The sort dropdown appears on the main catalog and on category pages, with
  // the same default (alternating big/small) in both. The server-rendered seed
  // is fetched with sortBy=default so the first paint matches this order.
  const contextDefaultSort = DEFAULT_SORT;

  const parseUrlDate = (value: string | null): Date | undefined => {
    if (!value) return undefined;
    const normalized = value.trim();
    if (!normalized) return undefined;

    const dmy = parse(normalized, "dd-MM-yyyy", new Date());
    if (isValid(dmy)) return dmy;

    const ymd = parse(normalized, "yyyy-MM-dd", new Date());
    if (isValid(ymd)) return ymd;

    return undefined;
  };

  // --- Filter States ---
  const [categorySelect, setCategorySelect] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pageSize, setPageSize] = useState("12");
  const [sort, setSort] = useState<string>(contextDefaultSort);
  const [currentPage, setCurrentPage] = useState(1);
  // Mobile only: the filter controls live in a bottom sheet so the products sit
  // near the top of the first screen. Desktop keeps the always-visible card.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<{
    categorySelect: string;
    location: string;
    searchTerm: string;
    pageSize: string;
    sort: string;
    startDateStr?: string;
    endDateStr?: string;
    categoryPathSlug: string;
  }>({
    categorySelect: "",
    location: "",
    searchTerm: "",
    pageSize: "12",
    sort: contextDefaultSort,
    startDateStr: undefined,
    endDateStr: undefined,
    categoryPathSlug: String(forcedCategoryName || "").trim(),
  });

  // --- Date Logic Fixed (yyyy-MM-dd) ---
  // This prevents timezone shifts (e.g., Feb 1st becoming Jan 31st)
  const startDateStr = useMemo(
    () => (dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined),
    [dateRange?.from],
  );

  const endDateStr = useMemo(() => {
    const target = dateRange?.to || dateRange?.from;
    if (!target) return undefined;
    return format(target, "yyyy-MM-dd");
  }, [dateRange?.to, dateRange?.from]);

  // --- Queries ---
  const { data: catData } = useQuery<ApiCategory[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const normalizeCategoryLabel = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\bcastles\b/g, "castle")
      .replace(/\bgames\b/g, "game");

  const stripHireSuffix = (value: string) =>
    String(value || "")
      .trim()
      .replace(/-hire$/i, "");

  // Hydrate filter state from URL (supports both new and legacy params)
  useEffect(() => {
    const rawCategoryId = searchParams.get("category")?.trim() || "";
    const rawCategoryName =
      searchParams.get("categoryName")?.trim() ||
      String(forcedCategoryName || "").trim();
    const categoryNameForMatch = stripHireSuffix(rawCategoryName);
    const rawPickup = searchParams.get("pickup")?.trim() || "";
    const rawCity = searchParams.get("city")?.trim() || "";
    const rawSearch = searchParams.get("search")?.trim() || "";
    const rawSort =
      searchParams.get("sortBy")?.trim() ||
      searchParams.get("sort")?.trim() ||
      contextDefaultSort;
    const rawLimit = searchParams.get("limit")?.trim() || "12";
    const rawPage = Number(searchParams.get("page") || 1);

    const start = parseUrlDate(
      searchParams.get("start") || searchParams.get("startDate"),
    );
    const end = parseUrlDate(
      searchParams.get("end") || searchParams.get("endDate"),
    );

    let nextCategory = rawCategoryId;

    if (
      !nextCategory &&
      categoryNameForMatch &&
      Array.isArray(catData) &&
      catData.length
    ) {
      const normalizedQuery = normalizeCategoryLabel(categoryNameForMatch);
      const matched = catData.find((c) => {
        const byName =
          normalizeCategoryLabel(String(c.name || "")) === normalizedQuery;
        const bySlug =
          String(c.slug || "").toLowerCase() ===
          categoryNameForMatch.toLowerCase();
        return byName || bySlug;
      });

      nextCategory = String(matched?._id || matched?.id || "");
    }

    const categoryTokenFromUrl = categoryNameForMatch
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const categoryPathSlug =
      categoryTokenFromUrl || String(forcedCategoryName || "").trim() || "";
    // Every location is a postcode district now, so the URL value is used
    // verbatim. It used to be translated through a postcode -> area-name map,
    // which turned valid districts (IG11) into retired names (Barking).
    const requestedLocation = rawPickup || rawCity;
    const startDateStr = start ? format(start, "yyyy-MM-dd") : undefined;
    const endDateStr = end ? format(end, "yyyy-MM-dd") : startDateStr;

    setCategorySelect(nextCategory);
    // Normalise legacy or unknown sort values to a known option so the dropdown
    // and the query never disagree.
    const normalizedSort = resolveSort(rawSort).value;
    setLocation(requestedLocation);
    setSearchTerm(rawSearch);
    setSort(normalizedSort);
    setPageSize(rawLimit);
    setCurrentPage(Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1);
    setDateRange(start ? { from: start, to: end || start } : undefined);
    setAppliedFilters({
      categorySelect: nextCategory,
      location: requestedLocation,
      searchTerm: rawSearch,
      pageSize: rawLimit,
      sort: normalizedSort,
      startDateStr,
      endDateStr,
      categoryPathSlug,
    });
  }, [searchParams, catData, forcedCategoryName]);

  // Lock the page behind the bottom sheet and let Escape close it. The sheet is
  // plain fixed DOM rather than a dialog so the Radix selects inside it keep
  // working normally.
  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheetOpen]);

  const { data: locationsData } = useQuery({
    queryKey: ["locations", { page: 1, limit: 200 }],
    queryFn: () => fetchLocations({ page: 1, limit: 200 }),
  });

  // Seed the first paint with server-rendered products so the catalog appears
  // in the SSR HTML (better SEO and LCP). Only valid for the default,
  // unfiltered view — any filter/sort/page change uses a different query key.
  const isDefaultQuery =
    currentPage === 1 &&
    appliedFilters.pageSize === "12" &&
    appliedFilters.sort === contextDefaultSort &&
    !appliedFilters.categorySelect &&
    !appliedFilters.location &&
    !appliedFilters.startDateStr &&
    !appliedFilters.endDateStr &&
    !appliedFilters.searchTerm;

  const seededResponse: FetchProductsResponse | undefined =
    isDefaultQuery && initialProducts && initialProducts.length > 0
      ? {
          items: initialProducts,
          total: initialTotal ?? initialProducts.length,
          results: initialTotal ?? initialProducts.length,
          page: 1,
          limit: 12,
        }
      : undefined;

  const {
    data: productsResp,
    isLoading: productsLoading,
    isFetching,
  } = useQuery<FetchProductsResponse>({
    // Chain Filter: Updates whenever any of these change
    queryKey: [
      "products",
      currentPage,
      appliedFilters.pageSize,
      appliedFilters.sort,
      appliedFilters.categorySelect,
      appliedFilters.location,
      appliedFilters.startDateStr,
      appliedFilters.endDateStr,
      appliedFilters.searchTerm,
    ],
    queryFn: () =>
      fetchProducts({
        page: currentPage,
        limit: Number(appliedFilters.pageSize),
        sort: resolveSort(appliedFilters.sort).sortBy,
        sortOrder: resolveSort(appliedFilters.sort).sortOrder,
        // Only send params if they have real values (not " " or empty)
        categoryId:
          appliedFilters.categorySelect &&
          appliedFilters.categorySelect.trim().length > 1
            ? appliedFilters.categorySelect
            : null,
        city:
          appliedFilters.location && appliedFilters.location.trim().length > 1
            ? appliedFilters.location
            : "",
        availableFrom: appliedFilters.startDateStr,
        availableUntil: appliedFilters.endDateStr,
        search: appliedFilters.searchTerm || undefined,
      }),
    initialData: seededResponse,
    // With SSR data there is no need to re-request immediately; without it keep
    // the default freshness so the first client fetch happens right away.
    staleTime: seededResponse ? 300_000 : 0,
  });

  // Safe Data Mapping
  const apiItems = productsResp?.items ?? [];
  const total = productsResp?.total ?? 0;
  const pageCount = Math.ceil(total / Number(appliedFilters.pageSize)) || 1;

  const applyFilters = () => {
    const category =
      Array.isArray(catData) && categorySelect
        ? catData.find((c) => String(c._id || c.id) === String(categorySelect))
        : null;
    const categoryToken =
      String(category?.name || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || String(category?.slug || "").trim();
    const categoryPathSlug = categoryToken
      ? /-hire$/i.test(categoryToken)
        ? categoryToken
        : `${categoryToken}-hire`
      : "";

    const nextApplied = {
      categorySelect,
      location,
      searchTerm,
      pageSize,
      sort,
      startDateStr,
      endDateStr,
      categoryPathSlug,
    };

    setCurrentPage(1);
    setAppliedFilters(nextApplied);

    const params = new URLSearchParams();
    if (location?.trim()) {
      // Keep the location name in the URL: products store it in location.city,
      // so the backend can match it (a postcode would never match).
      params.set("city", location.trim());
    }
    if (searchTerm?.trim()) params.set("search", searchTerm.trim());
    if (sort && sort !== contextDefaultSort) params.set("sortBy", sort);
    if (pageSize && pageSize !== "12") params.set("limit", pageSize);
    if (dateRange?.from) {
      params.set("start", format(dateRange.from, "dd-MM-yyyy"));
      params.set("end", format(dateRange?.to || dateRange.from, "dd-MM-yyyy"));
    }

    const nextPath = categoryPathSlug
      ? `/booking-catalog/${categoryPathSlug}`
      : "/booking-catalog";
    const nextQuery = params.toString();
    router.push(`${nextPath}${nextQuery ? `?${nextQuery}` : ""}`, {
      scroll: true,
    });
  };

  // Map API items to UI ProductCard props
  const mappedItems = apiItems
    .map((p: any) => {
      const productId = String(p?._id ?? p?.id ?? "").trim();
      if (!productId) return null;
      const productSlug = String(p?.slug || "").trim();
      if (!productSlug) return null;

      return {
        _id: productId,
        slug: productSlug,
        title: p?.name ?? "Untitled product",
        images: [{ src: p?.imageCover || Bg1.src, alt: p?.name ?? "Product" }],
        priceCurrent: p?.priceDiscount || p?.perDayPrice || p?.price || 0,
        priceOriginal: p?.priceDiscount
          ? p?.perDayPrice || p?.price || null
          : null,
        ratingValue: SHOW_PRODUCT_REVIEWS ? p?.ratingsAverage : undefined,
        ratingCount: SHOW_PRODUCT_REVIEWS ? p?.ratingsQuantity : undefined,
      };
    })
    .filter(Boolean) as Array<{
    _id: string;
    slug: string;
    title: string;
    images: { src: string; alt: string }[];
    priceCurrent: number;
    priceOriginal: number | null;
    ratingValue?: number;
    ratingCount?: number;
  }>;

  // Count of filters actually applied to the current result set, not just picked
  // in the sheet, so the mobile badge matches what the user is looking at.
  const activeFilterCount =
    (appliedFilters.categorySelect ? 1 : 0) +
    (appliedFilters.location ? 1 : 0) +
    (appliedFilters.startDateStr ? 1 : 0);

  const formatShortDate = (value?: string) => {
    if (!value) return "";
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? format(parsed, "d MMM") : value;
  };

  const datesLabel =
    appliedFilters.startDateStr
      ? appliedFilters.endDateStr &&
        appliedFilters.endDateStr !== appliedFilters.startDateStr
        ? `${formatShortDate(appliedFilters.startDateStr)} – ${formatShortDate(appliedFilters.endDateStr)}`
        : formatShortDate(appliedFilters.startDateStr)
      : "Any dates";

  const resetFilters = () => {
    const categoryPathSlug = String(forcedCategoryName || "").trim();
    setCategorySelect("");
    setLocation("");
    setDateRange(undefined);
    setCurrentPage(1);
    setAppliedFilters({
      categorySelect: "",
      location: "",
      searchTerm: "",
      pageSize,
      sort,
      startDateStr: undefined,
      endDateStr: undefined,
      categoryPathSlug,
    });
    setSheetOpen(false);
    const nextPath = appliedFilters.categoryPathSlug
      ? `/booking-catalog/${appliedFilters.categoryPathSlug}`
      : "/booking-catalog";
    router.push(nextPath, { scroll: false });
  };

  // Built once and used by both the desktop card and the mobile sheet.
  // `layer` raises the portalled dropdown above the sheet (z-[70]).
  const categoryField = (layer = "") => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
        Category
      </label>
      <Select
        value={categorySelect}
        onValueChange={(v) => {
          setCategorySelect(v);
          setCurrentPage(1);
        }}
      >
        <SelectTrigger aria-label="Filter by category" className="w-full h-11">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent className={layer}>
          <SelectItem value=" ">All Categories</SelectItem>
          {catData?.map((c) => (
            // Uses c.id (which maps to _id) for backend ObjectId lookup
            <SelectItem key={c._id} value={String(c._id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const locationField = (layer = "") => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
        Location
      </label>
      <Select
        value={location}
        onValueChange={(v) => {
          setLocation(v);
          setCurrentPage(1);
        }}
      >
        <SelectTrigger aria-label="Filter by location" className="w-full h-11">
          <SelectValue placeholder="Everywhere" />
        </SelectTrigger>
        <SelectContent className={layer}>
          <SelectItem value=" ">Everywhere</SelectItem>
          {districtLocations(locationsData as any[])?.map((loc: any, i: number) => {
            const name = loc.name?.trim() || `Location ${i + 1}`;
            // Locations are postcode districts now, so the code is the name
            // and repeating it reads as "CM17 (CM17)".
            const postcode = loc.city?.trim() || "";
            const secondary =
              postcode && postcode.toUpperCase() !== name.toUpperCase()
                ? postcode
                : "";

            return (
              <SelectItem key={i} value={name}>
                {secondary ? `${name} (${secondary})` : name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );

  const datesField = (months: number, layer = "") => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
        Dates
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-11 py-0 px-3 justify-start font-normal rounded-md border border-input bg-background hover:bg-background"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from
              ? dateRange.to
                ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}`
                : format(dateRange.from, "LLL dd")
              : "Select dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-auto p-0 ${layer}`} align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              setDateRange(range);
              setCurrentPage(1);
            }}
            numberOfMonths={months}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mobile: compact filter bar. The controls themselves live in the sheet
          at the end of this component so the first product row stays on screen. */}
      <div className="lg:hidden">
        <div className="sticky top-[92px] z-30 flex items-center gap-2 rounded-xl border border-brand-gray-150 bg-white/95 px-2.5 py-2 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-brand-gray-150 text-[14px] font-semibold text-brand-ink-900 active:bg-brand-gray-25"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <SlidersHorizontal className="h-4 w-4 text-brand-gray-600" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange-500 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-brand-gray-150 text-[14px] font-semibold text-brand-ink-900 active:bg-brand-gray-25"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            <CalendarIcon className="h-4 w-4 text-brand-gray-600" />
            <span className="truncate">{datesLabel}</span>
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Clear all filters"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand-gray-600 active:bg-brand-gray-25"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop: always-visible filter card */}
      <div className="hidden lg:flex flex-wrap gap-4 p-4 border rounded-xl bg-white shadow-sm items-end">
        <div className="flex-1 min-w-[200px]">{categoryField()}</div>
        <div className="flex-1 min-w-[200px]">{locationField()}</div>
        <div className="flex-1 min-w-[240px]">{datesField(2)}</div>

        {/* Search Button */}
        <Button
          className="h-11 bg-brand-orange-500 text-white px-8 rounded-lg hover:bg-brand-orange-450 transition-all duration-200 cursor-pointer"
          onClick={applyFilters}
        >
          <Search className="mr-2 h-4 w-4" /> Find Availability
        </Button>
      </div>

      {/* Results count + sort */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-brand-gray-600 lg:text-sm">
          <span className="lg:hidden">
            <span className="font-semibold text-brand-ink-900">{total}</span>{" "}
            results
          </span>
          <span className="hidden lg:inline">
            Your search results:{" "}
            <span className="font-semibold text-brand-ink-900">{total}</span>
          </span>
        </p>
        <Select
          value={sort}
          onValueChange={(v) => {
            // Sort applies immediately rather than waiting for
            // "Find Availability" - matching the reference storefront.
            setSort(v);
            setCurrentPage(1);
            setAppliedFilters((prev) => ({ ...prev, sort: v }));
          }}
        >
          <SelectTrigger
            aria-label="Sort products"
            className="w-[140px] h-9 text-[13px] lg:w-[200px] lg:h-10 lg:text-sm"
          >
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {productsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[330px] bg-gray-100 animate-pulse rounded-xl lg:h-64"
            />
          ))
        ) : mappedItems.length > 0 ? (
          mappedItems.map((p: any) => (
            <ProductCard
              key={p._id}
              id={p._id}
              slug={p.slug}
              title={p.title}
              images={p.images}
              priceCurrent={p.priceCurrent}
              priceOriginal={p.priceOriginal}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-400">
            No products found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pageCount}
          onPageChange={(page) => setCurrentPage(page)}
          isLoading={isFetching}
        />
      )}

      {/* Mobile filter sheet. Plain fixed DOM (not a Radix dialog) so the selects
          inside it behave exactly as they do on desktop. */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters and availability"
        >
          <div
            className="absolute inset-0 bg-brand-ink-975/60"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-6 pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-gray-150" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-brand-ink-900">
                Filters &amp; availability
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full text-brand-ink-900 active:bg-brand-gray-75"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {categoryField("z-[80]")}
              {locationField("z-[80]")}
              {datesField(1, "z-[80]")}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="h-12 flex-1 rounded-full border border-brand-gray-150 text-[15px] font-semibold text-brand-ink-900 active:bg-brand-gray-25"
              >
                Clear all
              </button>
              <Button
                onClick={() => {
                  applyFilters();
                  setSheetOpen(false);
                }}
                className="h-12 flex-[1.3] rounded-full bg-brand-orange-500 text-[15px] font-semibold text-white hover:bg-brand-orange-450"
              >
                <Search className="mr-2 h-4 w-4" /> Find Availability
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingCatalogPage({
  forcedCategoryName,
  initialProducts,
  initialTotal,
}: {
  forcedCategoryName?: string;
  initialProducts?: ApiProduct[];
  initialTotal?: number;
}) {
  return (
    <Suspense
      fallback={
        // Skeleton grid rather than bare text: this is what paints before the
        // client resolves, so the cards should already be in place.
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12 md:py-16">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[330px] animate-pulse rounded-xl bg-gray-100 lg:h-64"
              />
            ))}
          </div>
        </div>
      }
    >
      <BookingCatalogPageInner
        forcedCategoryName={forcedCategoryName}
        initialProducts={initialProducts}
        initialTotal={initialTotal}
      />
    </Suspense>
  );
}
