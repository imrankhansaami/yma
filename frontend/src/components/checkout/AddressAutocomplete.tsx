"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * UK address autocomplete for the checkout address fields.
 *
 * Uses the Google Places API (New) with the same public key the reviews
 * section already uses. Typing suggests real addresses; picking one fills the
 * street, flat, town, county and postcode. Typing is never blocked, so an
 * address Google doesn't know can still be entered by hand.
 */

export type AddressParts = {
  street: string;
  flat: string;
  town: string;
  county: string;
  postcode: string;
};

type Suggestion = { placeId: string; text: string };

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

async function fetchSuggestions(input: string): Promise<Suggestion[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["uk"],
        languageCode: "en",
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json?.suggestions) ? json.suggestions : [];
    return list
      .map((s: any) => s?.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({
        placeId: String(p.placeId || ""),
        text: String(p.text?.text || ""),
      }))
      .filter((s: Suggestion) => s.placeId && s.text);
  } catch {
    return [];
  }
}

async function fetchAddressParts(placeId: string): Promise<AddressParts | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "addressComponents,formattedAddress",
        },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const components: any[] = Array.isArray(json?.addressComponents)
      ? json.addressComponents
      : [];
    const get = (type: string) => {
      const match = components.find((c) => (c?.types ?? []).includes(type));
      return String(match?.longText || "").trim();
    };

    return {
      street: [get("street_number"), get("route")]
        .filter(Boolean)
        .join(" ")
        .trim(),
      flat: get("subpremise"),
      town: get("postal_town") || get("locality") || get("administrative_area_level_3"),
      county: get("administrative_area_level_2"),
      postcode: get("postal_code").toUpperCase(),
    };
  } catch {
    return null;
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
    if (!API_KEY || value.trim().length < MIN_CHARS) {
      setItems([]);
      close();
      return;
    }
    debounce.current = setTimeout(async () => {
      const list = await fetchSuggestions(value.trim());
      setItems(list);
      setActive(-1);
      setOpen(list.length > 0);
    }, DEBOUNCE_MS);
  };

  const pick = async (suggestion: Suggestion) => {
    close();
    const parts = await fetchAddressParts(suggestion.placeId);
    if (parts) onSelect(parts);
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
            if (active >= 0 && items[active]) void pick(items[active]);
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
              key={suggestion.placeId}
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => void pick(suggestion)}
              className={`block w-full px-3 py-2 text-left text-[13px] leading-5 ${
                index === active
                  ? "bg-brand-gray-25 text-brand-ink-900"
                  : "text-brand-ink-700 hover:bg-brand-gray-25"
              }`}
            >
              {suggestion.text}
            </button>
          ))}
          {/* Google's terms require attribution for address suggestions. */}
          <div className="border-t border-brand-gray-100 px-3 py-1 text-[11px] text-brand-gray-400">
            Powered by Google
          </div>
        </div>
      ) : null}
    </div>
  );
}
