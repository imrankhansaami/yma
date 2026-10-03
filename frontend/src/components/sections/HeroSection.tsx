"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import CalenderIcon from "@/assets/icons/calendar-plus-01.png";
import CategoryIcon from "@/assets/icons/category.png";
import Location from "@/assets/icons/marker-pin-01.png";
import PhoneIcon from "@/assets/icons/phone.png";
import SearchIcon from "@/assets/icons/search-lg.svg";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Category, fetchCategories } from "@/services/category.service";
import { CATEGORY_PAGE_BY_SLUG, findCategoryPageByLabel } from "@/lib/category-pages";
import { fetchLocations } from "@/services/location.service";
import Image from "next/image";
import type { DateRange } from "react-day-picker";
import WhatsappBtn from "../common/btn/WhatsappBtn";

export default function HeroSection() {
  const router = useRouter();
  const [isMobile, setIsMobile] = React.useState(false);
  const [shouldLoadFilters, setShouldLoadFilters] = React.useState(false);

  const [category, setCategory] = React.useState<string>("");
  const [location, setLocation] = React.useState<string>("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [openDate, setOpenDate] = React.useState(false);
  const [categorySearch, setCategorySearch] = React.useState<string>("");
  const [locationSearch, setLocationSearch] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    setIsMobile(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldLoadFilters) return;

    let cancelled = false;
    const load = () => {
      if (!cancelled) setShouldLoadFilters(true);
    };

    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(load, { timeout: 1500 });
      return () => {
        cancelled = true;
        (window as any).cancelIdleCallback?.(id);
      };
    }

    const timeout = setTimeout(load, 900);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [shouldLoadFilters]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    enabled: shouldLoadFilters,
  });

  const categories: Category[] = React.useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const {
    data: locationsData,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useQuery({
    queryKey: ["locations", { page: 1, limit: 100 }],
    queryFn: () => fetchLocations({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
    enabled: shouldLoadFilters,
  });

  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const search = categorySearch.toLowerCase().trim();
    return categories.filter((c) =>
      String(c.name).toLowerCase().includes(search),
    );
  }, [categories, categorySearch]);

  const filteredLocations = React.useMemo(() => {
    if (!Array.isArray(locationsData)) return [];
    if (!locationSearch.trim()) return locationsData;
    const search = locationSearch.toLowerCase().trim();
    return locationsData.filter((loc: any) =>
      String(loc.city || loc.name)
        .toLowerCase()
        .includes(search),
    );
  }, [locationsData, locationSearch]);

  const goToBookingCatalog = React.useCallback(
    (opts?: { categoryLabel?: string }) => {
      const params = new URLSearchParams();
      let categoryPathSlug = "";

      // Category - safely handle optional opts
      const categoryLabel = opts?.categoryLabel?.trim();
      let catValue = "";
      const normalizeCategoryLabel = (value: string) =>
        value
          .toLowerCase()
          .trim()
          .replace(/&/g, " and ")
          .replace(/[^a-z0-9]+/g, " ")
          .replace(/\s+/g, " ")
          .replace(/\bcastles\b/g, "castle")
          .replace(/\bgames\b/g, "game");

      if (categoryLabel) {
        const normalizedLabel = normalizeCategoryLabel(categoryLabel);
        const matched = categories.find(
          (c) =>
            normalizeCategoryLabel(String(c.name || "")) === normalizedLabel ||
            String(c.slug || "").toLowerCase() ===
              categoryLabel.toLowerCase().replace(/\s+/g, "-"),
        );
        catValue = matched?._id || matched?._id || categoryLabel;
      } else if (category?.trim()) {
        const matched = categories.find((c) => c.name === category);
        catValue = matched?._id || matched?._id || category;
      }

      if (catValue) {
        const matched = categories.find(
          (c) => String(c._id || c.id) === String(catValue),
        );
        const categoryToken =
          String(matched?.slug || "").trim() ||
          String(matched?.name || categoryLabel || category || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        if (categoryToken) {
          const normalizedCategoryToken = /-hire$/i.test(categoryToken)
            ? categoryToken
            : `${categoryToken}-hire`;
          if (CATEGORY_PAGE_BY_SLUG.has(normalizedCategoryToken)) {
            categoryPathSlug = normalizedCategoryToken;
          } else {
            params.set("categoryName", normalizedCategoryToken);
          }
        }
      }

      // Location - send the human location name; products store it in
      // `location.city` (e.g. "Romford"), so a postcode never matched.
      if (location?.trim()) {
        const selectedLoc = (locationsData as any[])?.find(
          (loc) => loc.name === location || loc.city === location,
        );
        params.set("city", (selectedLoc?.name || location).trim());
      }

      // Dates
      if (dateRange?.from) {
        params.set("start", format(dateRange.from, "dd-MM-yyyy"));
      }
      const endDate = dateRange?.to ?? dateRange?.from;
      if (endDate) {
        params.set("end", format(endDate, "dd-MM-yyyy"));
      }

      if (categoryLabel) {
        const targetPage = findCategoryPageByLabel(categoryLabel);
        if (targetPage) {
          params.delete("categoryName");
          categoryPathSlug = targetPage.slug;
        }
      }

      const basePath = categoryPathSlug
        ? `/booking-catalog/${categoryPathSlug}`
        : "/booking-catalog";
      router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`);
    },
    [categories, locationsData, category, location, dateRange, router],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    let categoryPathSlug = "";

    if (category?.trim()) {
      const matched = categories.find((c) => c.name === category);
      const categoryToken =
        String(matched?.slug || "").trim() ||
        String(matched?.name || category || "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      if (categoryToken) {
        const normalizedCategoryToken = /-hire$/i.test(categoryToken)
          ? categoryToken
          : `${categoryToken}-hire`;
        if (CATEGORY_PAGE_BY_SLUG.has(normalizedCategoryToken)) {
          categoryPathSlug = normalizedCategoryToken;
        } else {
          params.set("categoryName", normalizedCategoryToken);
        }
      }
    }

    if (location?.trim()) {
      // FIXED: send the location name (products store it in `location.city`)
      const selectedLoc = (locationsData as any[])?.find(
        (loc) => loc.name === location || loc.city === location,
      );
      params.set("city", (selectedLoc?.name || location).trim());
    }

    if (dateRange?.from) {
      params.set("start", format(dateRange.from, "dd-MM-yyyy"));
    }
    const endDate = dateRange?.to ?? dateRange?.from;
    if (endDate) {
      params.set("end", format(endDate, "dd-MM-yyyy"));
    }

    const basePath = categoryPathSlug
      ? `/booking-catalog/${categoryPathSlug}`
      : "/booking-catalog";
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="relative min-h-svh lg:h-[959px] w-full bg-brand-ink-975">
      <Image
        src="/header_bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black-70" />

      {/* Content */}
      <div className="relative z-10 max-w-[1280px] mx-auto h-full px-4 sm:px-6">
        <div className="h-[40px] md:h-[60px]" />
        {/* ---------------Options for Small and Medium Devices---------------- */}
        <div className="flex items-start justify-between lg:hidden">
          <div className="mt-20">
            <WhatsappBtn className="h-12 px-5" textClassName="text-[17px]" />
          </div>

          <div className="mt-20 mb-8 lg:hidden flex justify-end">
            <div className="flex flex-col justify-end items-end text-white">
              <span className="font-display text-nowrap">
                <button
                  onClick={() => router.push("/booking-catalog")}
                  className="hover:underline cursor-pointer"
                >
                  Book Online
                </button>
                {" or "}
                <a href="tel:07951431111" className="hover:underline">
                  Call Us
                </a>
              </span>
              <a
                href="tel:07951431111"
                className="font-display whitespace-nowrap hover:underline"
              >
                <Image
                  src={PhoneIcon}
                  alt="phone icon"
                  className="h-4 w-4 mr-2 inline-block -mt-1"
                />
                07951431111
              </a>
            </div>
          </div>
        </div>

        {/* ---------------Options for Large Devices---------------- */}
        <div className="h-auto lg:h-[calc(100%-80px)] pb-8 lg:pb-0">
          <div className="hidden lg:flex text-white text-xl md:text-2xl items-center justify-end mt-26 mb-12">
            <span className="text-3xl tracking-wide mr-6">
              <button
                onClick={() => router.push("/booking-catalog")}
                className="hover:underline cursor-pointer"
              >
                Book Online
              </button>
              {" or "}
              <a href="tel:07951431111" className="hover:underline">
                Call Us
              </a>
            </span>
            <Image src={PhoneIcon} alt="phone icon" className="h-6 w-6 mr-2" />
            <a
              href="tel:07951431111"
              className="font-display text-4xl md:text-3xl hover:underline"
            >
              07951431111
            </a>
          </div>

          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
            {/* LEFT: Headline + Copy */}
            <div className="text-white w-full lg:max-w-[560px] lg:pt-0 text-center lg:text-left mx-auto lg:mx-0">
              <h1 className="font-display leading-[1.1] text-[36px] sm:text-[46px] md:text-[56px] lg:text-[62px]">
                Bounce Into Adventure
              </h1>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-2xl leading-relaxed max-w-[620px] mx-auto lg:mx-0">
                Safe, reliable, and super fun bouncy castle hire for all
                occasions. Easy booking, on-time delivery, and memories that
                last forever!
              </p>
            </div>

            {/* RIGHT: Booking Card */}
            <div className="w-full lg:max-w-[580px] self-center lg:self-start">
              <Card className="max-w-[580px] mx-auto rounded-2xl shadow-2xl border-none bg-white text-[var(--c-101828)]">
                <CardContent className="px-4 sm:px-5 md:px-6 py-5">
                  <form onSubmit={onSubmit} className="space-y-4 font-inter">
                    <div className="border rounded-xl p-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Image
                          src={CategoryIcon}
                          alt="category icon"
                          className="h-5 w-5 shrink-0"
                        />
                        <Select
                          onValueChange={setCategory}
                          value={category}
                          disabled={isLoading}
                        >
                          <SelectTrigger
                            aria-label="Select category"
                            className="h-10 w-full border-0 shadow-none pl-0 focus:ring-0 focus:ring-offset-0"
                          >
                            <SelectValue
                              className={category ? "text-brand-ink-900" : ""}
                              placeholder={
                                isLoading
                                  ? "Loading Categories..."
                                  : isError
                                    ? "Select Category"
                                    : "Select Category"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 pb-2">
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder="Search categories..."
                                  value={categorySearch}
                                  onChange={(e) =>
                                    setCategorySearch(e.target.value)
                                  }
                                  className="h-9 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map((c, idx) => (
                                <SelectItem
                                  key={`${String(c._id)}-${idx}`}
                                  value={String(c.name)}
                                >
                                  {c.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                {categorySearch.trim()
                                  ? "No categories found"
                                  : "No categories available"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="border rounded-xl p-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Image
                          src={Location}
                          alt="location icon"
                          className="h-5 w-5 shrink-0"
                        />
                        <Select
                          onValueChange={setLocation}
                          value={location}
                          disabled={locationsLoading}
                        >
                          <SelectTrigger
                            aria-label="Select location"
                            className="h-10 w-full border-0 shadow-none pl-0 focus:ring-0 focus:ring-offset-0"
                          >
                            <SelectValue
                              className={location ? "text-brand-ink-900" : ""}
                              placeholder={
                                locationsLoading
                                  ? "Loading Locations..."
                                  : locationsError
                                    ? "Select Location"
                                    : "Select Location"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 pb-2">
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder="Search locations..."
                                  value={locationSearch}
                                  onChange={(e) =>
                                    setLocationSearch(e.target.value)
                                  }
                                  className="h-9 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            {/* Fixed: No empty value crash */}
                            <SelectItem value="all">Everywhere</SelectItem>

                            {filteredLocations &&
                            filteredLocations.length > 0 ? (
                              (filteredLocations as any[]).map((loc, idx) => {
                                const name =
                                  loc.name?.trim() || `Location ${idx + 1}`;
                                // The Select *value* is the name so filtering
                                // works; the postcode is shown alongside it only
                                // when it differs.
                                const postcode = loc.city?.trim() || "";
                                // Locations are postcode districts now, so the
                                // code is already the name — don't repeat it.
                                const secondary =
                                  postcode &&
                                  postcode.toUpperCase() !== name.toUpperCase()
                                    ? postcode
                                    : "";
                                const displayToUser = secondary
                                  ? `${name} (${secondary})`
                                  : name;

                                return (
                                  <SelectItem
                                    key={`${loc.id || loc._id || idx}`}
                                    value={name}
                                  >
                                    {displayToUser}
                                  </SelectItem>
                                );
                              })
                            ) : locationsData ? (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                {locationSearch.trim()
                                  ? "No locations found"
                                  : "No locations available"}
                              </div>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="border rounded-xl p-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Image
                          src={CalenderIcon}
                          alt="calendar icon"
                          className="h-5 w-5 shrink-0"
                        />
                        <Popover open={openDate} onOpenChange={setOpenDate}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full h-10 justify-start px-0 text-left font-normal bg-transparent hover:bg-transparent focus-visible:ring-0"
                            >
                              {dateRange?.from ? (
                                <span className="text-brand-ink-900">
                                  {dateRange?.to
                                    ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                                    : format(dateRange.from, "MMM d, yyyy")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Select Date
                                </span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="bottom"
                            align="start"
                            sideOffset={6}
                            collisionPadding={12}
                            className="z-[60] w-full p-0 rounded-xl border bg-white shadow-lg"
                          >
                            <Calendar
                              mode="range"
                              selected={dateRange}
                              onSelect={(range) => {
                                setDateRange(range);
                              }}
                              numberOfMonths={isMobile ? 1 : 2}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl font-extrabold tracking-wide flex items-center justify-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-400 text-white border border-white text-lg cursor-pointer"
                    >
                      <Image
                        src={SearchIcon}
                        alt="search icon"
                        className="h-5 w-5"
                      />
                      Find Availability
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-10 lg:mt-32">
            <div className="grid grid-cols-2 gap-4 sm:gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <Button
                size="lg"
                onClick={() =>
                  goToBookingCatalog({ categoryLabel: "Bouncy Castle" })
                }
                className="w-full rounded-full px-6 py-5 text-white font-bold text-base md:text-[22px] whitespace-normal bg-brand-yellow-500 hover:bg-brand-yellow-600 shadow-[0_3px_0_var(--alpha-black-30)] shadow-brand-yellow-500 border border-white transition-colors duration-300 hover:shadow-brand-yellow-600"
              >
                Bouncy Castle{" "}
                <ChevronRight className="ml-2 h-5 w-5 font-bold" />
              </Button>

              <Button
                size="lg"
                onClick={() =>
                  goToBookingCatalog({ categoryLabel: "Soft Play" })
                }
                className="w-full rounded-full px-6 py-5 text-white font-bold text-base md:text-[22px] whitespace-normal bg-brand-indigo-500 hover:bg-brand-indigo-600 shadow-[0_3px_0_var(--alpha-black-30)] shadow-brand-indigo-500 border border-white transition-colors duration-300 hover:shadow-brand-indigo-600"
              >
                Soft Play <ChevronRight className="ml-2 h-5 w-5 font-bold" />
              </Button>

              <Button
                size="lg"
                onClick={() =>
                  goToBookingCatalog({ categoryLabel: "Garden Games" })
                }
                className="w-full rounded-full px-6 py-5 text-white font-bold text-base md:text-[22px] whitespace-normal bg-brand-cyan-500 hover:bg-brand-cyan-600 shadow-[0_3px_0_var(--alpha-black-30)] shadow-brand-cyan-500 border border-white transition-colors duration-300 hover:shadow-brand-cyan-600"
              >
                Garden Games <ChevronRight className="ml-2 h-5 w-5 font-bold" />
              </Button>
              <Button
                size="lg"
                onClick={() =>
                  goToBookingCatalog({
                    categoryLabel: "Obstacle Course/Slides",
                  })
                }
                className="w-full rounded-full px-6 py-5 text-white font-bold text-base md:text-[22px] whitespace-normal bg-brand-orange-500 hover:bg-brand-orange-600 shadow-[0_3px_0_var(--alpha-black-30)] shadow-brand-orange-500 border border-white transition-colors duration-300 hover:shadow-brand-orange-600"
              >
                Obstacle Slides{" "}
                <ChevronRight className="ml-2 h-5 w-5 font-bold" />
              </Button>

              <Button
                size="lg"
                onClick={() =>
                  goToBookingCatalog({ categoryLabel: "Fun Food" })
                }
                className="col-span-2 sm:col-span-1 justify-self-center w-full max-w-[210px] sm:max-w-none rounded-full px-6 py-5 text-white font-bold text-base md:text-[22px] whitespace-normal bg-brand-emerald-600 hover:bg-brand-green-650 shadow-[0_3px_0_var(--alpha-black-30)] shadow-brand-emerald-600 border border-white transition-colors duration-300 hover:shadow-brand-green-650"
              >
                Fun Food <ChevronRight className="ml-2 h-5 w-5 font-bold" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
