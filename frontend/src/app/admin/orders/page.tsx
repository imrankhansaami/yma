"use client";

import { OrdersTable } from "@/components/admin/dashboard/OrdersTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

type TabType = "pending" | "confirmed" | "completed" | "cancelled" | "all";
// ... (TABS definition)
const TABS: { id: TabType; label: string }[] = [
  { id: "pending", label: "Pending Orders" },
  { id: "confirmed", label: "Confirmed Orders" },
  { id: "completed", label: "Completed Orders" },
  { id: "cancelled", label: "Cancelled Orders" },
  { id: "all", label: "All Orders" },
];

const OrdersPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("page") !== "1") {
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [activeTab, debouncedSearch, date?.from, date?.to, pathname, router]);

  const getPageInfo = () => {
    switch (activeTab) {
      case "pending":
        return {
          title: "Pending Orders",
          description: "Showing all orders waiting for confirmation.",
        };
      case "confirmed":
        return {
          title: "Confirmed Orders",
          description: "Showing all confirmed orders ready for processing.",
        };
      case "completed":
        return {
          title: "Completed Orders",
          description: "Showing all orders that have been fulfilled.",
        };
      case "cancelled":
        return {
          title: "Cancelled Orders",
          description: "Showing all orders that have been cancelled.",
        };
      default:
        return {
          title: "All Orders",
          description:
            "Showing all customer orders from the selected date range. Adjust the date range anytime to filter results.",
        };
    }
  };

  const { title, description } = getPageInfo();

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
                  : "text-gray-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto py-8 pt-18">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md z-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by customer name & order ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-300 focus-visible:ring-gray-900"
            />
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50",
                  !date && "text-gray-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "MMM d, yyyy")} -{" "}
                      {format(date.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(date.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 font-inter" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Orders Table */}
        <OrdersTable
          status={activeTab}
          search={debouncedSearch}
          startDate={date?.from ? format(date.from, "yyyy-MM-dd") : undefined}
          endDate={
            date?.from
              ? format(date.to || date.from, "yyyy-MM-dd")
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default OrdersPage;
