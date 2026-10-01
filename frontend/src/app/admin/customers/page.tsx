"use client";

import CustomerTable from "@/components/admin/customers/CustomerTable";
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
import { useState } from "react";
import type { DateRange } from "react-day-picker";

const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Content */}
      <div className="mx-auto py-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className=" font-semibold text-gray-900 mb-2">
            Customer Management
          </h1>
          <p className="text-sm text-gray-600">
            View customer history, track hired bouncy castles, and quickly
            reorder past bookings on their behalf.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-2 flex items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md z-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Order Id, customer name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-300 focus-visible:ring-gray-900"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50",
                  !date && "text-gray-400",
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
                  <span>Pick dates</span>
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

        {/* Table */}
        <CustomerTable searchQuery={searchQuery} dateRange={date} />
      </div>
    </div>
  );
};

export default CustomersPage;
