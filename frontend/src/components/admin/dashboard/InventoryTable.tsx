"use client";

import { Eye } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import SampleImage from "@/assets/images/bg1.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableFooter } from "@/components/admin/shared/TableFooter";
import ProductDetailsModal from "../inventory/ProductDetailsModal";
import type { ApiProduct } from "@/services/product.service";
import { fetchCategories } from "@/services/category.service";

type ProductStatus = "Active" | "Paused";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const statusStyles: Record<
  ProductStatus,
  { text: string; dot: string; border: string }
> = {
  Active: {
    text: "text-brand-green-550",
    dot: "bg-brand-green-550",
    border: "border-brand-gray-300",
  },
  Paused: {
    text: "text-brand-amber-500",
    dot: "bg-brand-amber-500",
    border: "border-brand-gray-300",
  },
};

type InventoryTableProps = {
  products: ApiProduct[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  isLoading?: boolean;
  onRowsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
};

export function InventoryTable({
  products,
  totalResults,
  currentPage,
  totalPages,
  rowsPerPage,
  isLoading,
  onRowsPerPageChange,
  onPageChange,
}: InventoryTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      if (!c?.id || !c?.name) continue;
      map.set(String(c.id), c.name);
    }
    return map;
  }, [categories]);

  const rows = useMemo(() => {
    return products.map((product) => {
      const category =
        Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories[0]
          : null;
      const categoryName =
        typeof category === "string"
          ? categoryNameById.get(category) || "Uncategorized"
          : category?.name || "Uncategorized";
      const price =
        (product as any)?.perDayPrice ??
        (product as any)?.rentalPrice ??
        product.price ??
        0;
      const warehouse =
        (product as any)?.warehouse ??
        product.location?.city ??
        product.location?.state ??
        product.location?.country ??
        "—";
      const vendor = (product as any)?.vendor ?? "YMA";
      const status: ProductStatus =
        product.isActive === false ? "Paused" : "Active";
      const image =
        product.imageCover || (product.images && product.images[0]) || SampleImage;

      return {
        id: product._id || product.id,
        productName: product.name,
        category: categoryName,
        rentalFee: `$${Number(price).toFixed(2)}`,
        warehouse: String(warehouse),
        vendor: String(vendor),
        status,
        image,
        original: product, // Store original product object for modal
      };
    });
  }, [products, categoryNameById]);

  return (
    <>
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <section className="w-full">
        <Card className="rounded-xl border border-brand-gray-150 shadow-[0px_1px_2px_0px_var(--alpha-ink-900-5)]">
          <div className="overflow-hidden rounded-xl -mt-4">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-brand-gray-150 bg-white">
                  <TableHead className="w-[8%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Product ID
                  </TableHead>
                  <TableHead className="w-[22%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Product Name
                  </TableHead>
                  <TableHead className="w-[13%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Category
                  </TableHead>
                  <TableHead className="w-[11%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Rental Fee
                  </TableHead>
                  <TableHead className="w-[12%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Warehouse
                  </TableHead>
                  <TableHead className="w-[13%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Vendor
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    Status
                  </TableHead>
                  <TableHead className="w-[4%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    {/* Action col */}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-brand-gray-150">
                {isLoading ? (
                  Array.from({ length: Math.min(rowsPerPage, 6) }).map(
                    (_, index) => (
                      <TableRow
                        key={`inventory-skeleton-${index}`}
                        className="border-brand-gray-150"
                      >
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-5 w-20 rounded" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Skeleton className="h-5 w-20 rounded" />
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                        </TableCell>
                      </TableRow>
                    )
                  )
                ) : (
                  rows.map((row) => {
                  const styles = statusStyles[row.status];
                  return (
                    <TableRow key={row.id} className="border-brand-gray-150">
                      {/* Product ID */}
                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                       {row?.id}
                      </TableCell>

                      {/* Product Name cell */}
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 overflow-hidden rounded border-[0.8px] border-brand-gray-150 bg-slate-100">
                            <Image
                              src={row.image}
                              alt={row.productName}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                          <p className="truncate text-sm text-brand-black-950 max-w-[200px]">
                            {row.productName}
                          </p>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="px-4 py-4">
                        <span className="inline-flex items-center rounded-md bg-brand-gray-110 px-1.5 py-0.5 text-xs font-medium text-brand-black-950">
                          {row.category}
                        </span>
                      </TableCell>

                      {/* Rental Fee */}
                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.rentalFee}
                      </TableCell>

                      {/* Warehouse */}
                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.warehouse}
                      </TableCell>

                      {/* Vendor */}
                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.vendor}
                      </TableCell>

                      {/* Status badge */}
                      <TableCell className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] font-semibold shadow-[0px_1px_2px_var(--alpha-ink-900-5)]",
                            styles.text,
                            styles.border
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              styles.dot
                            )}
                          />
                          {row.status}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950 hover:bg-brand-gray-50"
                          onClick={() => setSelectedProduct(row.original)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }))}
              </TableBody>
            </Table>
          </div>

          {/* Footer: pagination / info */}
          <TableFooter
            totalResults={totalResults}
            showingCount={rows.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            onRowsPerPageChange={onRowsPerPageChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            variant="inventory"
          />
        </Card>
      </section>
    </>
  );
}
