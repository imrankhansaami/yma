"use client";

import NavBG from "@/assets/images/navbar.png";
import NavBG_SM from "@/assets/images/navbar_sm.png";
import Logo from "@/assets/logo.svg";
import { fetchLocations } from "@/services/location.service";
import { normalizeCanonicalSlug } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  LogIn,
  Menu,
  Phone,
  Search as SearchIcon,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WhatsappBtn from "./btn/WhatsappBtn";

import {
  selectAuthCheckingStale,
  selectIsAuthenticated,
  selectUser,
  useAuthStore,
} from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  inputId?: string;
};

const SearchInput = ({
  value,
  onChange,
  onSubmit,
  inputId,
}: SearchInputProps) => (
  <form
    className="relative w-full mt-1"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <SearchIcon
      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-70 text-black"
      aria-hidden="true"
    />
    <input
      id={inputId}
      type="search"
      placeholder="Search"
      aria-label="Search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full rounded-lg border border-white/20 bg-white/95 pl-10 pr-4 text-[16px] leading-[1] text-black placeholder-black/50 shadow-sm outline-none focus:border-transparent focus:ring-2 focus:ring-white/60 font-inter"
    />
  </form>
);

const Navbar = () => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [open, setOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [activeParentIdx, setActiveParentIdx] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const { open: openCart, count } = useCartStore();

  // Auth state from store
  const isAuthed = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const authCheckStale = useAuthStore(selectAuthCheckingStale());
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isAdminAuthed = isAuthed && isAdmin;
  const profileHref = isAdminAuthed ? "/admin" : "/profile";

  // Make sure auth state is always in sync with the server
  useEffect(() => {
    if (authCheckStale) {
      void checkAuth();
    }
  }, [authCheckStale, checkAuth]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at the very top
      if (currentScrollY < 10) {
        setIsNavVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Determine direction with a small threshold to avoid flickering
      if (currentScrollY > lastScrollY.current + 5) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setIsNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const {
    data: locationsData,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useQuery({
    queryKey: ["navbar-locations"],
    queryFn: () => fetchLocations({ page: 1, limit: 50 }),
    staleTime: 10 * 60 * 1000,
    enabled: showLocations || open,
  });

  const locationsTree = useMemo(() => {
    const raw = Array.isArray(locationsData) ? locationsData : [];

    const dedup = (items: any[]) => {
      const seen = new Set<string>();
      return items.filter((loc) => {
        const key = String(loc.id ?? loc._id ?? loc.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const normalized = dedup(raw);
    return normalized.length > 0 ? normalized : [];
  }, [locationsData]);

  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return locationsTree;

    const search = locationSearch.toLowerCase().trim();
    return locationsTree
      .map((loc: any) => {
        const parentMatches = String(loc.name).toLowerCase().includes(search);
        const filteredChildren = Array.isArray(loc.children)
          ? loc.children.filter((child: any) =>
              String(child.name).toLowerCase().includes(search),
            )
          : [];

        if (parentMatches || filteredChildren.length > 0) {
          return {
            ...loc,
            children: parentMatches ? loc.children : filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [locationsTree, locationSearch]);

  useEffect(() => {
    if (filteredLocations.length === 0) return;
    setActiveParentIdx((prev) =>
      prev >= 0 && prev < filteredLocations.length ? prev : 0,
    );
  }, [filteredLocations]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setShowMobileSearch(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toSlug = (name: string) => normalizeCanonicalSlug(name);

  const handleSearchSubmit = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      const nextUrl = trimmed
        ? `/booking-catalog?search=${encodeURIComponent(trimmed)}`
        : "/booking-catalog";
      router.push(nextUrl);
      setOpen(false);
      setShowMobileSearch(false);
    },
    [router],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (value === "") {
        handleSearchSubmit("");
      }
    },
    [handleSearchSubmit],
  );

  return (
    <div className="fixed inset-x-0 top-0 z-50 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="relative h-full w-full">
          <Image
            src={NavBG}
            alt="YMA Bouncy Castles navbar background"
            fill
            priority
            sizes="100vw"
            className="hidden xl:block object-cover pointer-events-none select-none"
            aria-hidden="true"
            draggable={false}
          />
          <Image
            src={NavBG_SM}
            alt="YMA Bouncy Castles mobile navbar background"
            fill
            priority
            sizes="100vw"
            className="xl:hidden object-cover pointer-events-none select-none"
            aria-hidden="true"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]" />
        </div>
      </div>

      <nav className="flex items-center xl:items-start justify-between xl:flex-col px-4 sm:px-6 py-4 max-w-[1280px] mx-auto font-londrina min-h-[80px]">
        <div className="flex items-center gap-3 sm:gap-8 shrink-0">
          <Link
            href="/"
            aria-label="YMA Bouncy Castles homepage"
            className="flex items-center space-x-2"
          >
            <Image
              src={Logo}
              alt="YMA Bouncy Castles logo"
              priority
              className="w-[5rem] sm:w-[6.3rem]"
            />
          </Link>

          <div className="hidden xl:block w-[36rem] max-w-[36rem]">
            <SearchInput
              value={searchValue}
              onChange={handleSearchChange}
              onSubmit={() => handleSearchSubmit(searchValue)}
            />
          </div>

          <div className="hidden xl:flex items-center space-x-3 shrink-0">
            <WhatsappBtn onClick={() => setOpen(false)} />
            <Link
              href="tel:07951431111"
              className="flex items-center gap-2 rounded-full border-[2px] border-white bg-brand-yellow-500 px-6 py-2 text-white transition hover:bg-brand-yellow-600 hover:border-white min-w-[170px] justify-center"
            >
              <Phone className="h-5 w-5" />
              <span className="text-lg font-semibold">Call Now</span>
            </Link>
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center border rounded-full bg-transparent hover:bg-white transition-colors duration-300 group cursor-pointer"
              onClick={openCart}
              aria-label="Open cart"
            >
              <ShoppingCart className="group-hover:text-black transition-colors duration-300" />
              {count > 0 && (
                <span className="absolute p-1 -top-2 -right-1 bg-brand-orange-500 text-white border border-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
            {!isAuthed ? (
              <Link
                href={"/login"}
                className="border-[2px] border-white text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white hover:text-brand-gray-500 transition-colors cursor-pointer min-w-[120px] justify-center"
              >
                <LogIn />
                <span className="text-lg">Login</span>
              </Link>
            ) : isAdminAuthed ? (
              <Link
                href={profileHref}
                className="border-[2px] border-white text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white hover:text-brand-gray-500 transition-colors cursor-pointer min-w-[120px] justify-center"
              >
                <User />
                <span className="text-lg">Admin</span>
              </Link>
            ) : (
              <Link
                href={profileHref}
                className="border-[2px] border-white text-white px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white hover:text-brand-gray-500 transition-colors cursor-pointer min-w-[120px] justify-center"
              >
                <User />
                <span className="text-lg">Profile</span>
              </Link>
            )}
          </div>
        </div>

        {/* --------------------Navbar Items for Large device only-------------- */}
        <div
          className={`hidden xl:flex items-center gap-8 text-[20px] leading-8 transition-all duration-300 ease-in-out origin-top ${
            isNavVisible
              ? "max-h-20 opacity-100 xl:mt-6"
              : "max-h-0 opacity-0 overflow-hidden xl:mt-0"
          }`}
        >
          <Link
            href="/"
            className={
              pathname === "/"
                ? "text-brand-orange-500"
                : "hover:text-brand-orange-500 transition-colors"
            }
          >
            Home
          </Link>

          <Link
            href="/booking-catalog"
            className={
              pathname === "/booking-catalog"
                ? "text-brand-orange-500"
                : "hover:text-brand-orange-500 transition-colors"
            }
          >
            Booking Catalog
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setShowLocations(true)}
            onMouseLeave={() => setShowLocations(false)}
            onFocusCapture={() => setShowLocations(true)}
            onBlurCapture={(e) => {
              if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget))
                return;
              setShowLocations(false);
            }}
          >
            <button
              className="flex items-center cursor-pointer gap-1 hover:text-brand-orange-500 transition-colors"
              aria-haspopup="true"
              aria-expanded={showLocations}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowLocations(false);
              }}
            >
              Our Locations
              <ChevronDown
                className={`transition-transform duration-200 ${
                  showLocations ? "rotate-180" : ""
                }`}
              />
            </button>

            {showLocations && (
              <div className="absolute left-0 top-4 mt-3 w-[620px] rounded-2xl border border-white/10 bg-white text-brand-ink-900 shadow-2xl shadow-black/20 overflow-hidden">
                <div className="px-4 pt-3 pb-3 border-b border-brand-gray-200">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray-400" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-lg border border-brand-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/2 border-r border-brand-gray-200">
                    <div className="px-4 pt-3 pb-3 border-b border-brand-gray-200">
                      <Link
                        href="/locations"
                        className="flex items-center justify-between rounded-xl bg-brand-orange-75 px-3 py-2 text-sm font-semibold text-brand-orange-700 hover:bg-brand-orange-100 transition-colors"
                      >
                        <span>All Locations</span>
                      </Link>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto px-4 py-3 space-y-1">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((loc: any, idx: number) => {
                          const isActive = idx === activeParentIdx;
                          const slug = toSlug(String(loc.name));
                          return (
                            <Link
                              key={`${String(loc.id ?? loc.name)}-${idx}`}
                              href={`/locations/${slug}`}
                              onMouseEnter={() => setActiveParentIdx(idx)}
                              onFocus={() => setActiveParentIdx(idx)}
                              className={[
                                "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                                isActive
                                  ? "bg-brand-orange-75 text-brand-orange-700"
                                  : "text-brand-ink-900 hover:bg-brand-gray-25",
                              ].join(" ")}
                            >
                              {loc.name}
                            </Link>
                          );
                        })
                      ) : (
                        <span className="text-xs text-brand-gray-400 px-3 py-1 block">
                          {locationsLoading
                            ? "Loading locations..."
                            : locationSearch.trim()
                              ? "No locations found"
                              : "No locations available"}
                        </span>
                      )}
                      {locationsError && (
                        <span className="text-xs text-red-500 px-3 py-1 block">
                          Unable to load locations
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-1/2">
                    <div className="px-4 pt-3 pb-3 border-b border-brand-gray-200">
                      <span className="text-sm font-semibold text-brand-ink-900">
                        Areas
                      </span>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto px-4 py-3 space-y-2">
                      {filteredLocations.length > 0 &&
                      Array.isArray(
                        filteredLocations[activeParentIdx]?.children,
                      ) &&
                      (filteredLocations[activeParentIdx]?.children as any[])
                        .length > 0 ? (
                        (
                          filteredLocations[activeParentIdx]?.children as any[]
                        ).map((child: any, cIdx: number) => (
                          <Link
                            key={`${String(child.id ?? child.name)}-${cIdx}`}
                            href={`/locations/${toSlug(String(child.name))}`}
                            className="block rounded-lg px-3 py-2 text-sm text-brand-gray-700 hover:bg-brand-gray-25"
                          >
                            {child.name}
                          </Link>
                        ))
                      ) : (
                        <span className="text-xs text-brand-gray-400 px-3 py-1 block">
                          No sub-locations
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/contact"
            className={
              pathname === "/contact"
                ? "text-brand-orange-500"
                : "hover:text-brand-orange-500 transition-colors"
            }
          >
            Contact
          </Link>

          <Link
            href="/blog"
            className={
              pathname === "/blog"
                ? "text-brand-orange-500"
                : "hover:text-brand-orange-500 transition-colors"
            }
          >
            Blogs
          </Link>
        </div>
        {/* TODO section end----------------  */}
        <div className="flex xl:hidden items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            aria-label={showMobileSearch ? "Close search" : "Search"}
            className="relative inline-flex h-11 w-11 items-center justify-center border rounded-full bg-transparent shrink-0"
            onClick={() => {
              setShowMobileSearch((v) => {
                const next = !v;
                if (next) {
                  setTimeout(() => {
                    document.getElementById("navbar-search-mobile")?.focus();
                  }, 0);
                }
                return next;
              });
            }}
          >
            {showMobileSearch ? (
              <X className="h-6 w-6" />
            ) : (
              <SearchIcon className="h-6 w-6" />
            )}
          </button>

          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center border rounded-full bg-transparent"
            onClick={openCart}
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute p-1 -top-2 -right-1 bg-brand-orange-500 text-white border border-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          {!isAuthed ? (
            <Link
              href="/login"
              aria-label="Login"
              className="relative inline-flex h-11 w-11 items-center justify-center border rounded-full bg-transparent"
            >
              <LogIn className="h-6 w-6" />
            </Link>
          ) : (
            <Link
              href={profileHref}
              aria-label={isAdminAuthed ? "Admin profile" : "Profile"}
              className="relative inline-flex h-11 w-11 items-center justify-center border rounded-full bg-transparent"
            >
              <User className="h-6 w-6" />
            </Link>
          )}

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center rounded-md border border-white/80 w-10 h-10"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* -------------------Navbar Element only for  For Small devices-------------- */}
      <div
        className={`xl:hidden px-6 pb-3 max-w-[1280px] mx-auto transition-[max-height,opacity] duration-300 ease-out overflow-hidden ${
          showMobileSearch
            ? "opacity-100 max-h-24 pointer-events-auto"
            : "opacity-0 max-h-0 pointer-events-none"
        }`}
      >
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          onSubmit={() => handleSearchSubmit(searchValue)}
          inputId="navbar-search-mobile"
        />
      </div>

      <div
        className={`xl:hidden absolute inset-x-0 top-full z-40 bg-[var(--alpha-black-60)] backdrop-blur-md border-t border-white/10 transition-[max-height,opacity] duration-300 overflow-hidden ${
          open ? "opacity-100 max-h-[90vh]" : "opacity-0 max-h-0"
        }`}
      >
        <div className="px-6 py-6 pb-8 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Links */}
          <div className="flex flex-col space-y-4 text-xl">
            <Link
              href="/"
              className={
                pathname === "/"
                  ? "text-brand-orange-500"
                  : "hover:text-brand-orange-500"
              }
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/booking-catalog"
              className={
                pathname === "/booking-catalog"
                  ? "text-brand-orange-500"
                  : "hover:text-brand-orange-500"
              }
              onClick={() => setOpen(false)}
            >
              Booking Catalog
            </Link>
            <details className="group">
              <summary className="list-none flex items-center justify-between cursor-pointer">
                <span>Our Locations</span>
                <ChevronDown className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 ml-3 flex flex-col space-y-3 text-base/7 opacity-90">
                <div className="relative mb-2">
                  <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/20 bg-white/10 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                  />
                </div>
                <Link href="/locations" onClick={() => setOpen(false)}>
                  All Locations
                </Link>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc: any, idx: number) => (
                    <div key={`${String(loc.id ?? loc.name)}-${idx}`}>
                      <Link
                        href={`/locations/${toSlug(String(loc.name))}`}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        {loc.name}
                      </Link>
                      {Array.isArray(loc.children) &&
                      (loc.children as any[]).length > 0 ? (
                        <div className="mt-2 ml-4 flex flex-col space-y-2 text-sm">
                          {(loc.children as any[]).map(
                            (child: any, cIdx: number) => (
                              <Link
                                key={`${String(
                                  child.id ?? child.name,
                                )}-${cIdx}`}
                                href={`/locations/${toSlug(
                                  String(child.name),
                                )}`}
                                onClick={() => setOpen(false)}
                              >
                                {child.name}
                              </Link>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-brand-gray-300">
                    {locationSearch.trim()
                      ? "No locations found"
                      : "No locations available"}
                  </span>
                )}
                {locationsLoading && (
                  <span className="text-xs text-brand-gray-300">
                    Loading...
                  </span>
                )}
                {locationsError && (
                  <span className="text-xs text-red-500">
                    Unable to load locations
                  </span>
                )}
              </div>
            </details>
            <Link
              href="/contact"
              className={
                pathname === "/contact"
                  ? "text-brand-orange-500"
                  : "hover:text-brand-orange-500"
              }
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/blog"
              className={
                pathname === "/blog"
                  ? "text-brand-orange-500"
                  : "hover:text-brand-orange-500"
              }
              onClick={() => setOpen(false)}
            >
              Blogs
            </Link>
          </div>

          <hr className="border-white/10" />

          <div className="flex items-center gap-3 flex-nowrap sm:flex-col sm:items-stretch">
            <WhatsappBtn
              className="w-10 h-10 px-0 min-w-0 sm:w-auto sm:h-10 sm:px-4 sm:min-w-[170px]"
              textClassName="hidden sm:inline"
            />

            <Link
              href="tel:07951431111"
              aria-label="Call Now"
              className="border-[2px] border-white bg-brand-yellow-500 text-white w-10 h-10 px-0 rounded-full flex items-center justify-center gap-2 hover:bg-brand-yellow-600 hover:border-white transition-colors cursor-pointer min-w-0 sm:w-auto sm:h-auto sm:px-6 sm:py-3 sm:min-w-[170px]"
              onClick={() => setOpen(false)}
            >
              <Phone />
              <span className="hidden sm:inline text-lg font-semibold">
                Call Now
              </span>
            </Link>

            {!isAuthed ? (
              <Link
                href={"/login"}
                aria-label="Login"
                className="border-[2px] border-white text-white w-10 h-10 px-0 rounded-full flex items-center justify-center gap-2 hover:bg-white hover:text-brand-gray-500 transition-colors cursor-pointer min-w-0 sm:w-auto sm:h-auto sm:px-7 sm:py-3 sm:min-w-[180px]"
                onClick={() => setOpen(false)}
              >
                <LogIn />
                <span className="hidden sm:inline text-lg">Login</span>
              </Link>
            ) : isAdminAuthed ? (
              <Link
                href={profileHref}
                aria-label="Admin profile"
                className="border-[2px] border-white text-white w-10 h-10 px-0 rounded-full flex items-center justify-center gap-2 hover:bg-white hover:text-brand-gray-500 transition-colors cursor-pointer min-w-0 sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:min-w-[150px]"
                onClick={() => setOpen(false)}
              >
                <User />
                <span className="hidden sm:inline text-lg">Admin</span>
              </Link>
            ) : (
              <Link
                href={profileHref}
                aria-label="Profile"
                className="border-[2px] border-white text-white w-10 h-10 px-0 rounded-full flex items-center justify-center gap-2 hover:bg-white hover:text-brand-gray-500 transition-colors cursor-pointer min-w-0 sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:min-w-[150px]"
                onClick={() => setOpen(false)}
              >
                <User />
                <span className="hidden sm:inline text-lg">Profile</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
