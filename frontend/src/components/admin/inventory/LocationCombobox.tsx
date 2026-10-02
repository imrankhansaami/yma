"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import api from "@/api/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminToast } from "@/components/ui/admin-toast";
import { cn } from "@/lib/utils";

export type LocationChoice = {
  id?: string;
  name: string;
  state?: string;
};

/**
 * Searchable location picker with an inline "create" action.
 *
 * The plain Select was unusable with a growing list, and admins had no way to
 * add an area that was missing. This filters as you type and, when the query
 * does not match an existing area, offers to create it via the locations API.
 */
export default function LocationCombobox({
  value,
  onChange,
  locations,
  country,
  state,
  placeholder = "Search for an area...",
}: {
  value: string;
  onChange: (name: string) => void;
  locations: LocationChoice[];
  /** Taken from the product's own country/state fields when creating an area. */
  country?: string;
  state?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus the search box once the popover has mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const options = useMemo(() => {
    const cleaned = locations
      .map((l) => ({ ...l, name: String(l.name || "").trim() }))
      .filter((l) => l.name);
    const term = query.trim().toLowerCase();
    if (!term) return cleaned;
    return cleaned.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        String(l.state || "").toLowerCase().includes(term),
    );
  }, [locations, query]);

  const exactMatch = useMemo(
    () =>
      options.some(
        (o) => o.name.toLowerCase() === query.trim().toLowerCase(),
      ),
    [options, query],
  );

  const trimmedQuery = query.trim();
  const canCreate = trimmedQuery.length > 1 && !exactMatch;

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/locations", {
        name,
        // The controller requires all four; the product's own country/state
        // supply the region so a new area lands in the right place.
        type: "area",
        country: String(country || "").trim(),
        state: String(state || "").trim(),
        isActive: true,
      });
      return data?.data ?? data;
    },
    onSuccess: (_res, name) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      onChange(name);
      setOpen(false);
      notify({
        title: "Location created",
        message: `"${name}" was added and selected for this product.`,
        variant: "success",
      });
    },
    onError: (err: any) => {
      notify({
        title: "Could not create location",
        message:
          err?.response?.data?.message ||
          "Please check the name and try again.",
        variant: "error",
      });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Select location"
          aria-expanded={open}
          className="w-full h-[38px] flex items-center justify-between gap-2 bg-white border border-brand-gray-125 rounded-[8px] px-[12px] text-[14px] text-left focus:outline-none focus:border-brand-orange-500"
        >
          <span className={cn("truncate", !value && "text-brand-gray-500")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <div className="p-2 border-b border-brand-gray-125">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate && !createMutation.isPending) {
                e.preventDefault();
                createMutation.mutate(trimmedQuery);
              }
            }}
            placeholder={placeholder}
            className="w-full px-2 py-2 text-[14px] bg-transparent focus:outline-none"
          />
        </div>

        <div className="max-h-[260px] overflow-y-auto py-1">
          {options.length === 0 && !canCreate ? (
            <p className="px-3 py-4 text-[13px] text-brand-gray-500">
              No locations found.
            </p>
          ) : null}

          {options.map((option) => {
            const selected =
              option.name.toLowerCase() === String(value).toLowerCase();
            return (
              <button
                key={option.id ?? option.name}
                type="button"
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-brand-gray-110"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{option.name}</span>
                {option.state ? (
                  <span className="ml-auto text-[12px] text-brand-gray-500">
                    {option.state}
                  </span>
                ) : null}
              </button>
            );
          })}

          {canCreate ? (
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(trimmedQuery)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-brand-gray-110 disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                Create <strong>&ldquo;{trimmedQuery}&rdquo;</strong>
              </span>
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
