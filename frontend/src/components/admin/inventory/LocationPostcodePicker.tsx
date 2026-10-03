"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import api from "@/api/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminToast } from "@/components/ui/admin-toast";
import { cn } from "@/lib/utils";

export type PostcodeChoice = {
  id?: string;
  /** Area name, e.g. "Romford". */
  name: string;
  /** Postcode district, e.g. "RM1". Shown in preference to the name. */
  postcode?: string;
  state?: string;
  isActive?: boolean;
};

/** What the row shows and what gets stored on the product. */
const labelOf = (choice: PostcodeChoice) =>
  String(choice.postcode || choice.name || "").trim();

/**
 * Multi-select picker for the postcode districts a product covers.
 *
 * Rows are tick boxes, matching the reference list. Admins can search, tick
 * several postcodes, create a missing one, or delete one outright. Deleting is
 * immediate and permanent (the admin delete endpoint soft-deletes; this uses
 * the same endpoint).
 */
export default function LocationPostcodePicker({
  values,
  onChange,
  locations,
  country,
  state,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  locations: PostcodeChoice[];
  country?: string;
  state?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { notify } = useAdminToast();

  const selected = useMemo(
    () => values.map((v) => String(v)) as string[],
    [values],
  );

  // Mirrors `selected` but updated inside `toggle`, so several ticks in one
  // React batch build on each other instead of each reading the same stale list.
  const selectedRef = useRef<string[]>(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const options = useMemo(() => {
    const cleaned = locations
      .map((l: any) => ({
        id: l.id,
        name: String(l.name || "").trim(),
        postcode: String(l.postcode || "").trim(),
        state: String(l.state || "").trim(),
        isActive: l.isActive !== false,
      }))
      // Hide soft-deleted locations so a removed area cannot be re-selected.
      .filter((l) => l.isActive)
      .filter((l) => l.name || l.postcode);

    const term = query.trim().toLowerCase();
    if (!term) return cleaned;
    return cleaned.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.postcode.toLowerCase().includes(term) ||
        l.state.toLowerCase().includes(term),
    );
  }, [locations, query]);

  const exactMatch = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options.some(
      (o) => labelOf(o).toLowerCase() === term || o.name.toLowerCase() === term,
    );
  }, [options, query]);

  const trimmed = query.trim();
  const canCreate = trimmed.length > 1 && !exactMatch;

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post("/locations", {
        name,
        type: "area",
        country: String(country || "").trim(),
        state: String(state || "").trim(),
        isActive: true,
      });
      return data?.data ?? data;
    },
    onSuccess: (_res, name) => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      const next = [...selectedRef.current, name];
      selectedRef.current = next;
      onChange(next);
      setQuery("");
      notify({
        title: "Location created",
        message: `"${name}" was added and selected.`,
        variant: "success",
      });
    },
    onError: (err: any) => {
      notify({
        title: "Could not create location",
        message: err?.response?.data?.message || "Please try a different name.",
        variant: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Hard delete: the admin is removing the area for good. Products keep the
      // postcode as a plain string, so nothing is orphaned.
      await api.delete(`/locations/${id}?hard=true`);
      return id;
    },
    onSuccess: (_id, id) => {
      const removed = options.find((o) => o.id === id);
      const label = removed ? labelOf(removed) : "";
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      if (label) {
        const next = selectedRef.current.filter((s) => s !== label);
        selectedRef.current = next;
        onChange(next);
      }
      notify({
        title: "Location deleted",
        message: label ? `"${label}" was removed.` : "Location removed.",
        variant: "success",
      });
    },
    onError: (err: any) => {
      notify({
        title: "Could not delete location",
        message: err?.response?.data?.message || "Please try again.",
        variant: "error",
      });
    },
  });

  const toggle = (label: string) => {
    const current = selectedRef.current;
    const next = current.includes(label)
      ? current.filter((s) => s !== label)
      : [...current, label];
    selectedRef.current = next;
    onChange(next);
  };

  // "Select all" acts on whatever the search is currently showing, so an admin
  // can narrow to a prefix and tick the lot.
  const allLabels = useMemo(
    () => Array.from(new Set(options.map((o) => labelOf(o)).filter(Boolean))),
    [options],
  );
  const allSelected =
    allLabels.length > 0 && allLabels.every((l) => selected.includes(l));

  const toggleAll = () => {
    const current = selectedRef.current;
    const next = allSelected
      ? current.filter((s) => !allLabels.includes(s))
      : [...current, ...allLabels.filter((l) => !current.includes(l))];
    selectedRef.current = next;
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Select location"
          aria-expanded={open}
          className="w-full min-h-[38px] flex items-center justify-between gap-2 bg-white border border-brand-gray-125 rounded-[8px] px-[12px] py-[6px] text-[14px] text-left focus:outline-none focus:border-brand-orange-500"
        >
          <span className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-brand-gray-500">
                Select postcodes this product covers
              </span>
            ) : (
              selected.map((s) => (
                <span
                  key={s}
                  className="px-2 py-[2px] rounded bg-brand-gray-110 text-brand-ink-950 text-[12px]"
                >
                  {s}
                </span>
              ))
            )}
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
                createMutation.mutate(trimmed);
              }
            }}
            placeholder="Search or type a new postcode..."
            className="w-full px-2 py-2 text-[14px] bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-brand-gray-125 px-3 py-2">
          <button
            type="button"
            onClick={toggleAll}
            disabled={allLabels.length === 0}
            className="flex items-center gap-2 text-[13px] font-medium text-brand-ink-950 disabled:opacity-40"
          >
            <span
              className={cn(
                "h-4 w-4 shrink-0 rounded-[3px] border flex items-center justify-center",
                allSelected
                  ? "bg-brand-orange-500 border-brand-orange-500"
                  : "border-brand-gray-260 bg-white",
              )}
            >
              {allSelected ? <Check className="h-3 w-3 text-white" /> : null}
            </span>
            {allSelected
              ? "Clear all"
              : `Select all${query.trim() ? " shown" : ""} (${allLabels.length})`}
          </button>
          <span className="text-[12px] text-brand-gray-500">
            {selected.length} selected
          </span>
        </div>

        <div className="max-h-[280px] overflow-y-auto py-1">
          {options.length === 0 && !canCreate ? (
            <p className="px-3 py-4 text-[13px] text-brand-gray-500">
              No locations found.
            </p>
          ) : null}

          {options.map((option) => {
            const label = labelOf(option);
            const isSelected = selected.includes(label);
            const secondary =
              option.postcode && option.name && option.postcode !== option.name
                ? option.name
                : "";
            return (
              <div
                key={option.id ?? label}
                className="group flex items-center gap-2 px-3 py-2 hover:bg-brand-gray-110"
              >
                <button
                  type="button"
                  onClick={() => toggle(label)}
                  className="flex items-center gap-2 flex-1 text-left text-[14px]"
                >
                  <span
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-[3px] border flex items-center justify-center",
                      isSelected
                        ? "bg-brand-orange-500 border-brand-orange-500"
                        : "border-brand-gray-260 bg-white",
                    )}
                  >
                    {isSelected ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : null}
                  </span>
                  <span className="text-[#3b5bdb] font-medium">{label}</span>
                  {secondary ? (
                    <span className="text-[12px] text-brand-gray-500">
                      {secondary}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  aria-label={`Delete ${label}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (!option.id) return;
                    deleteMutation.mutate(String(option.id));
                  }}
                  className="opacity-0 group-hover:opacity-100 text-brand-gray-500 hover:text-red-600 disabled:opacity-40"
                  title={`Delete "${label}"`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {canCreate ? (
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(trimmed)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-brand-gray-110 disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                Create <strong>&ldquo;{trimmed}&rdquo;</strong>
              </span>
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
