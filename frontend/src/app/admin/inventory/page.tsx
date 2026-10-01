"use client";

import { InventoryTable } from "@/components/admin/dashboard/InventoryTable";
import { CreateCategoryModal } from "@/components/admin/inventory/CreateCategoryModal";
import { ManageCategoriesTable } from "@/components/admin/inventory/ManageCategoriesTable";
import { ProductAvailabilityTable } from "@/components/admin/inventory/ProductAvailabilityTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  fetchProducts,
  type FetchProductsResponse,
} from "@/services/product.service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, PackagePlus, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

type TabType = "all" | "availability" | "categories";

const TABS: { id: TabType; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "availability", label: "Product Availability" },
  { id: "categories", label: "Manage Categories" },
];

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const [availabilityDate, setAvailabilityDate] = useState<
    DateRange | undefined
  >(undefined);
  const router = useRouter();

  // Reset page on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedProductSearch]);

  const { data, isLoading, isFetching } = useQuery<FetchProductsResponse>({
    queryKey: [
      "admin-products",
      debouncedProductSearch,
      currentPage,
      rowsPerPage,
      activeTab === "availability" ? availabilityDate : null,
    ],
    queryFn: () =>
      fetchProducts({
        page: currentPage,
        limit: rowsPerPage,
        // Admin inventory must include both active and inactive products.
        showAll: true,
        search: debouncedProductSearch || null,
        includeCertificates: true,
        availableFrom:
          activeTab === "availability" && availabilityDate?.from
            ? format(availabilityDate.from, "yyyy-MM-dd")
            : null,
        availableUntil:
          activeTab === "availability" && availabilityDate?.from
            ? format(availabilityDate.to ?? availabilityDate.from, "yyyy-MM-dd")
            : null,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const products = useMemo(() => data?.items ?? [], [data]);
  const totalResults = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const isProductsLoading = (isLoading || isFetching) && products.length === 0;

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white fixed left-0 w-full md:left-[19.5rem] md:w-[calc(100%-19.5rem)] z-10">
        <div className="flex gap-0 overflow-x-auto px-2 sm:px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 sm:px-6 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                "hover:text-gray-900",
                activeTab === tab.id
                  ? "bg-brand-gray-105 m-2 rounded-md font-semibold"
                  : "text-gray-600",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto py-8 pt-18">
        {activeTab === "categories" ? (
          <>
            <div className="mb-6">
              <h1 className="text-base font-semibold text-brand-black-950 mb-1.5">
                Manage Categories
              </h1>
              <p className="text-sm text-brand-gray-500">
                Create and organize product categories for easy assignment
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm z-0">
                <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search by customer name & order ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-white border-brand-gray-125 text-sm text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:ring-gray-900"
                />
              </div>

              <Button
                className="h-9 bg-brand-orange-500 hover:bg-brand-orange-650 text-white text-sm font-normal px-4 rounded-lg gap-2 shadow-none"
                onClick={() => setCreateCategoryOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Category
              </Button>
            </div>

            <ManageCategoriesTable
              searchQuery={searchQuery}
              refreshKey={categoryRefreshKey}
            />
          </>
        ) : activeTab === "availability" ? (
          <>
            <div className="mb-6">
              <h1 className="text-base font-semibold text-brand-black-950 mb-1.5">
                Available Inventory
              </h1>
              <p className="text-sm text-brand-gray-500">
                Products not booked for the selected date.
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm z-0">
                <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search by product name & ID"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 h-9 bg-white border-brand-gray-125 text-sm text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:ring-gray-900"
                />
              </div>

              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 justify-start text-left font-normal bg-white border-brand-gray-125 hover:bg-gray-50",
                        !availabilityDate && "text-gray-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {availabilityDate?.from ? (
                        availabilityDate.to ? (
                          <>
                            {format(availabilityDate.from, "LLL dd, y")} -{" "}
                            {format(availabilityDate.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(availabilityDate.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick date/range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 font-inter" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={availabilityDate?.from}
                      selected={availabilityDate}
                      onSelect={setAvailabilityDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                {availabilityDate && (
                  <Button
                    variant="ghost"
                    onClick={() => setAvailabilityDate(undefined)}
                    className="h-9 px-3 text-red-500 hover:text-brand-black-950 text-sm font-medium"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <ProductAvailabilityTable
              products={products}
              totalResults={totalResults}
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              isLoading={isProductsLoading}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <>
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-base font-semibold text-brand-black-950 mb-1.5">
                Available Products
              </h1>
              <p className="text-sm text-brand-gray-500">
                View and manage all products currently available in inventory.
              </p>
            </div>

            {/* Search and Add Product Bar */}
            <div className="mb-4 flex items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-sm z-0">
                <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search by product name & ID"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 h-9 bg-white border-brand-gray-125 text-sm text-brand-black-950 placeholder:text-brand-gray-500 focus-visible:ring-gray-900"
                />
              </div>

              {/* Add Product Button */}
              <Button
                onClick={() => router.push("/admin/inventory/add-product")}
                className="h-9 bg-brand-orange-500 hover:bg-brand-orange-650 text-white text-sm font-normal px-4 rounded-lg gap-2 shadow-none"
              >
                <PackagePlus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Inventory Table */}
            <InventoryTable
              products={products}
              totalResults={totalResults}
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              isLoading={isProductsLoading}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <CreateCategoryModal
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onCreated={() => setCategoryRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};

export default InventoryPage;
