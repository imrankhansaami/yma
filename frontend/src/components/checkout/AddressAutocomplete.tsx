"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * UK address autocomplete for the checkout address fields.
 *
 * Powered by Photon (photon.komoot.io), a free geocoder built on OpenStreetMap
 * data. No API key and no billing, unlike the Google Places route — but it comes
 * with the usual open-data caveats: UK house numbers are only as complete as
 * OpenStreetMap's coverage, and there is no uptime guarantee. Typing is never
 * blocked, so an address the lookup doesn't know can still be entered by hand.
 *
 * Nominatim (OSM's own geocoder) is deliberately not used: its usage policy
 * forbids as-you-type searching.
 */

export type AddressParts = {
  street: string;
  flat: string;
  town: string;
  county: string;
  postcode: string;
};

type Suggestion = {
  id: string;
  primary: string;
  secondary: string;
  parts: AddressParts;
};

const PHOTON_URL = "https://photon.komoot.io/api/";
/** Roughly the UK, so results come from the right country. */
const UK_BBOX = "-8.65,49.86,1.77,60.86";
const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;
/** Repeated queries (the same street typed twice) come from here. */
const cache = new Map<string, Suggestion[]>();

async function searchAddresses(input: string): Promise<Suggestion[]> {
  const key = input.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url =
      `${PHOTON_URL}?q=${encodeURIComponent(input.trim())}` +
      `&limit=8&lang=en&bbox=${UK_BBOX}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const json = await res.json();
    const features: any[] = Array.isArray(json?.features) ? json.features : [];

    const seen = new Set<string>();
    const results: Suggestion[] = [];

    for (const feature of features) {
      const p = feature?.properties ?? {};
      // Photon's bbox is a rectangle, so it also catches Ireland: keep GB only.
      if (String(p.countrycode ?? "").toUpperCase() !== "GB") continue;

      const street =
        [p.housenumber, p.street].filter(Boolean).join(" ").trim() ||
        String(p.name ?? "").trim();
      const town = String(
        p.city ?? p.town ?? p.district ?? p.locality ?? "",
      ).trim();
      const county = String(p.county ?? p.state ?? "").trim();
      const postcode = String(p.postcode ?? "").toUpperCase();

      if (!street && !town && !postcode) continue;

      const id = String(p.osm_id ?? `${street}|${postcode}`);
      if (seen.has(id)) continue;
      seen.add(id);

      const secondary = [town, county && county !== town ? county : "", postcode]
        .filter(Boolean)
        .join(", ");

      results.push({
        id,
        primary: street || town || postcode,
        secondary,
        parts: { street, flat: "", town, county, postcode },
      });

      if (results.length >= MAX_RESULTS) break;
    }

    // Keep the cache small; it only exists to avoid repeat calls.
    if (cache.size > 50) cache.clear();
    cache.set(key, results);
    return results;
  } catch {
    return [];
  }
}

export default function AddressAutocomplete({
  id,
  placeholder,
  className,
  inputProps,
  onSelect,
}: {
  id: string;
  placeholder?: string;
  className?: string;
  /** Props from react-hook-form's register(), spread onto the input. */
  inputProps: {
    name: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
    ref: React.Ref<HTMLInputElement>;
  };
  /** Called with the parts of the picked address. */
  onSelect: (parts: AddressParts) => void;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapper = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  useEffect(() => () => clearTimeout(debounce.current), []);

  const scheduleSearch = (value: string) => {
    clearTimeout(debounce.current);
    if (value.trim().length < MIN_CHARS) {
      setItems([]);
      close();
      return;
    }
    debounce.current = setTimeout(async () => {
      const list = await searchAddresses(value);
      setItems(list);
      setActive(-1);
      setOpen(list.length > 0);
    }, DEBOUNCE_MS);
  };

  return (
    <div ref={wrapper} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        className={className}
        {...inputProps}
        onChange={(event) => {
          inputProps.onChange(event);
          scheduleSearch(event.target.value);
        }}
        onKeyDown={(event) => {
          if (!open) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, items.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter") {
            // Never let a suggestion submit the checkout form.
            event.preventDefault();
            if (active >= 0 && items[active]) {
              onSelect(items[active].parts);
              close();
            }
          } else if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-suggestions`}
      />

      {open ? (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-brand-gray-150 bg-white shadow-lg"
        >
          {items.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => {
                onSelect(suggestion.parts);
                close();
              }}
              className={`block w-full px-3 py-2 text-left leading-5 ${
                index === active
                  ? "bg-brand-gray-25 text-brand-ink-900"
                  : "text-brand-ink-700 hover:bg-brand-gray-25"
              }`}
            >
              <span className="block text-[13px]">{suggestion.primary}</span>
              {suggestion.secondary ? (
                <span className="block text-[12px] text-brand-gray-400">
                  {suggestion.secondary}
                </span>
              ) : null}
            </button>
          ))}
          {/* OpenStreetMap's licence requires attribution for the data. */}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="block border-t border-brand-gray-100 px-3 py-1 text-[11px] text-brand-gray-400 hover:text-brand-gray-600"
          >
            © OpenStreetMap contributors
          </a>
        </div>
      ) : null}
    </div>
  );
}
