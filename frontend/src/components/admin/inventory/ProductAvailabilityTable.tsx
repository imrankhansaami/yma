"use client";

import { Eye } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import SampleImage from "@/assets/images/bg1.png";
import { TableFooter } from "@/components/admin/shared/TableFooter";
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
import ProductDetailsModal from "@/components/admin/inventory/ProductDetailsModal";
import { ApiProduct } from "@/services/product.service";
import { fetchCategories } from "@/services/category.service";

interface ProductAvailabilityTableProps {
  products: ApiProduct[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  isLoading?: boolean;
  onRowsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export function ProductAvailabilityTable({
  products,
  totalResults,
  currentPage,
  totalPages,
  rowsPerPage,
  isLoading,
  onRowsPerPageChange,
  onPageChange,
}: ProductAvailabilityTableProps) {
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

  const availableProducts = useMemo(() => {
    // Filter products with quantity > 0
    return products.filter((p) => {
        const qty = Number(p.stock ?? p.quantity ?? 0);
        return qty > 0;
    });
  }, [products]);

  const rows = useMemo(() => {
    return availableProducts.map((product) => {
      const category =
        Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories[0]
          : null;
      const categoryName =
        typeof category === "string"
          ? categoryNameById.get(category) || "Uncategorized"
          : category?.name || "Uncategorized";
      
      const price = product.price || product.rentalPrice || 0;
      const warehouse = product.warehouse || product.location?.city || "—";
      const vendor = product.vendor || "YMA";
      const image = product.imageCover || (product.images && product.images[0]) || SampleImage;

      return {
        id: product._id || product.id,
        productName: product.name,
        category: categoryName,
        rentalFee: `$${Number(price).toFixed(2)}`,
        warehouse: String(warehouse),
        vendor: String(vendor),
        image,
        original: product,
      };
    });
  }, [availableProducts, categoryNameById]);

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
                  <TableHead className="w-[4%] px-4 py-3 text-[12px] font-medium text-brand-gray-500">
                    {/* Action col */}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-brand-gray-150">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      {Array.from({ length: 7 }).map((_, cellIdx) => (
                        <TableCell key={cellIdx} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} className="border-brand-gray-150">
                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.id}
                      </TableCell>

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

                      <TableCell className="px-4 py-4">
                        <span className="inline-flex items-center rounded-md bg-brand-gray-110 px-1.5 py-0.5 text-xs font-medium text-brand-black-950">
                          {row.category}
                        </span>
                      </TableCell>

                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.rentalFee}
                      </TableCell>

                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.warehouse}
                      </TableCell>

                      <TableCell className="px-4 py-4 text-sm text-brand-black-950">
                        {row.vendor}
                      </TableCell>

                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950"
                          onClick={() => setSelectedProduct(row.original)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
