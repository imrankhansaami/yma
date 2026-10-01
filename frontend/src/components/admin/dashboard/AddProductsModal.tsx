"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchProducts, type ApiProduct } from "@/services/product.service";
import { CircleCheck, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type AddProductsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProducts: (items: Array<{ product: ApiProduct; quantity: number }>) => void;
};

export function AddProductsModal({
  open,
  onOpenChange,
  onAddProducts,
}: AddProductsModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setIsLoading(true);
    fetchProducts({
      page: 1,
      limit: 30,
      search: debouncedSearch || null,
    })
      .then((res) => {
        if (isMounted) setProducts(res.items || []);
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, open]);

  const handleIncrement = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  };

  const handleRemove = (id: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const selectedItems = useMemo(() => {
    return Object.entries(quantities)
      .map(([id, qty]) => {
        const product = products.find(
          (p) => (p._id || p.id) === id,
        );
        return product ? { product, quantity: qty } : null;
      })
      .filter(Boolean) as Array<{ product: ApiProduct; quantity: number }>;
  }, [products, quantities]);

  const handleAddProducts = () => {
    if (selectedItems.length === 0) return;
    onAddProducts(selectedItems);
    setQuantities({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-w-[620px] flex-col rounded-2xl border border-slate-200 bg-white p-0 font-inter max-h-[85vh] overflow-hidden"
        )}
      >
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
        {/* HEADER */}
        <DialogHeader className="px-6 pt-5 pb-4 bg-brand-gray-50 rounded-t-2xl">
          <DialogTitle className="text-slate-900">
            Add Products for Customer
          </DialogTitle>
        </DialogHeader>

        {/* SEARCH INPUT */}
        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search products"
              className="h-10 w-full rounded-[10px] border border-slate-200 pl-9 text-[13px] text-slate-900 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="max-h-[calc(85vh-220px)] overflow-y-auto px-6 -mt-6 -mb-3">
          <div>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-slate-500">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                No products found.
              </div>
            ) : (
              products.map((p) => {
              const id = (p._id || p.id) as string;
              const qty = quantities[id] ?? 0;
              const hasQty = qty > 0;
              const image =
                (Array.isArray(p.imageCover) ? p.imageCover[0] : p.imageCover) ||
                (Array.isArray(p.images) ? p.images[0] : undefined);
              const price =
                typeof p.price === "number"
                  ? `$${p.price.toFixed(2)}`
                  : "$0.00";

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  {/* LEFT: image + text */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[6px] bg-brand-emerald-520">
                      {image ? (
                        <Image
                          src={image}
                          alt={p.name}
                          fill
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[26px] font-bold text-white">
                          ~
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-brand-black-950 break-words">
                        {p.name}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {price}{" "}
                        <span className="font-medium text-sm text-slate-900">
                          per day
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* RIGHT: + button or qty control */}
                  <div className="shrink-0">
                    {hasQty ? (
                      <div className="inline-flex h-[38px] items-center rounded-lg border border-slate-200 bg-white px-2 text-[13px]">
                        <button
                          type="button"
                          onClick={() => handleRemove(id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <span className="mx-3 min-w-[16px] text-center font-medium text-slate-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(id)}
                          className="inline-flex h-7 w-7 items-center justify-center bg-white text-slate-700"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleIncrement(id)}
                        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        aria-label="Add product"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex items-center justify-end gap-2 rounded-b-lg border-t border-slate-200 bg-white px-6 py-4">
          <Button
            variant="outline"
            className="h-10 rounded-lg border-slate-300 bg-white px-4 text-sm font-medium text-slate-800"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-1" />
            Cancel
          </Button>

          <Button
            className="h-10 rounded-lg bg-brand-orange-500 px-5 text-[13px] font-semibold text-white hover:bg-brand-orange-450"
            onClick={handleAddProducts}
            disabled={selectedItems.length === 0}
          >
            <CircleCheck className="mr-2 h-4 w-4" />
            Add Products
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
