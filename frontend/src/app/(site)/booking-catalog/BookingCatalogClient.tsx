"use client";

import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
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

/**
 * Size filter options. These bucket products by their internal `sizeFootprint`
 * (length x width). The raw size string is never displayed to customers.
 */
const SIZE_OPTIONS = [
  { value: "", label: "Any Size" },
  { value: "xs", label: "Extra Small (up to 5ft x 8ft)" },
  { value: "s", label: "Small (up to 12ft x 10ft)" },
  { value: "m", label: "Medium (up to 15ft x 11ft)" },
  { value: "l", label: "Large (up to 18ft x 15ft)" },
  { value: "xl", label: "Extra Large (20ft and above)" },
] as const;

function resolveSort(value: string) {
  return SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];
}

const LOCATION_POSTCODE_MAP: Record<string, string> = {
  Barking: "IG11",
  "Buckhurst Hill": "IG9",
  Debden: "IG10",
  "Forest Road (Loughton)": "IG10",
  Ilford: "IG1",
  London: "E/N/NW",
  "Roding Valley": "IG9",
  Romford: "RM1",
};

const POSTCODE_LOCATION_MAP: Record<string, string> = Object.entries(
  LOCATION_POSTCODE_MAP,
).reduce(
  (acc, [locationName, postcode]) => {
    if (!acc[postcode]) acc[postcode] = locationName;
    return acc;
  },
  {} as Record<string, string>,
);

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
  const [sizeBand, setSizeBand] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<{
    categorySelect: string;
    location: string;
    searchTerm: string;
    pageSize: string;
    sort: string;
    sizeBand: string;
    startDateStr?: string;
    endDateStr?: string;
    categoryPathSlug: string;
  }>({
    categorySelect: "",
    location: "",
    searchTerm: "",
    pageSize: "12",
    sort: contextDefaultSort,
    sizeBand: "",
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
    const rawSizeBand = searchParams.get("size")?.trim() || "";
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
    const pickupOrCity = rawPickup || rawCity;
    const mappedLocation = POSTCODE_LOCATION_MAP[pickupOrCity] || pickupOrCity;
    const startDateStr = start ? format(start, "yyyy-MM-dd") : undefined;
    const endDateStr = end ? format(end, "yyyy-MM-dd") : startDateStr;

    setCategorySelect(nextCategory);
    // Normalise legacy or unknown sort values to a known option so the dropdown
    // and the query never disagree.
    const normalizedSort = resolveSort(rawSort).value;
    setLocation(mappedLocation);
    setSearchTerm(rawSearch);
    setSort(normalizedSort);
    setSizeBand(rawSizeBand);
    setPageSize(rawLimit);
    setCurrentPage(Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1);
    setDateRange(start ? { from: start, to: end || start } : undefined);
    setAppliedFilters({
      categorySelect: nextCategory,
      location: mappedLocation,
      searchTerm: rawSearch,
      pageSize: rawLimit,
      sort: normalizedSort,
      sizeBand: rawSizeBand,
      startDateStr,
      endDateStr,
      categoryPathSlug,
    });
  }, [searchParams, catData, forcedCategoryName]);

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: () => fetchLocations({ page: 1, limit: 100 }),
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
    !appliedFilters.sizeBand &&
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
      appliedFilters.sizeBand,
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
        sizeBand: appliedFilters.sizeBand || null,
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
      sizeBand,
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
    if (sizeBand?.trim()) params.set("size", sizeBand.trim());
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

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-4 p-4 border rounded-xl bg-white shadow-sm items-end">
        {/* Category Select */}
        <div className="flex-1 min-w-[200px] space-y-1">
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
            <SelectContent>
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

        {/* Location Select */}
        <div className="flex-1 min-w-[200px] space-y-1">
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
            <SelectContent>
              <SelectItem value=" ">Everywhere</SelectItem>
              {(locationsData as any[])?.map((loc, i) => {
                const name = loc.name?.trim() || `Location ${i + 1}`;
                const postcode =
                  loc.city?.trim() || LOCATION_POSTCODE_MAP[name] || "";
                // Locations are postcode districts now, so the code is the name
                // and repeating it reads as "CM17 (CM17)".
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

        {/* Size Select — internal size band, never shows the raw size string */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
            Size
          </label>
          <Select
            value={sizeBand || " "}
            onValueChange={(v) => {
              setSizeBand(v === " " ? "" : v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter by size" className="w-full h-11">
              <SelectValue placeholder="Any Size" />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value || "any"}
                  value={option.value || " "}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div className="flex-1 min-w-[240px] space-y-1">
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
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setCurrentPage(1);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Button */}
        <Button
          className="h-11 bg-brand-orange-500 text-white px-8 rounded-lg hover:bg-brand-orange-450 transition-all duration-200 cursor-pointer"
          onClick={applyFilters}
        >
          <Search className="mr-2 h-4 w-4" /> Find Availability
        </Button>
      </div>

      {/* Results count + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-gray-600">
          Your search results:{" "}
          <span className="font-semibold text-brand-ink-900">{total}</span>
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
          <SelectTrigger aria-label="Sort products" className="w-[200px] h-10">
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
              className="h-64 bg-gray-100 animate-pulse rounded-xl"
            />
          ))
        ) : mappedItems.length > 0 ? (
          mappedItems.map((p: any) => (
            <ProductCard
              key={p._id}
              id={p._id}
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
    <Suspense fallback={<div>Loading Catalog...</div>}>
      <BookingCatalogPageInner
        forcedCategoryName={forcedCategoryName}
        initialProducts={initialProducts}
        initialTotal={initialTotal}
      />
    </Suspense>
  );
}
