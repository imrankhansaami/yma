"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type TableFooterProps = {
  totalResults: number;
  showingCount: number;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  currentPage: number;
  totalPages: number;
  onRowsPerPageChange: (value: number) => void;
  onPageChange?: (page: number) => void;
  variant?: "default" | "compact" | "inventory";
  className?: string;
};

const variantStyles = {
  default: {
    wrapper: "border-t border-brand-gray-150 px-5 py-3",
    infoText: "text-sm font-medium text-brand-gray-650",
    controlText: "text-sm text-brand-black-950",
    selectTrigger:
      "h-9 w-[70px] rounded-md border border-brand-gray-150 bg-white px-2 text-[12px] text-brand-black-950 shadow-none",
    button:
      "h-9 w-9 rounded-lg border-brand-gray-150 bg-white text-brand-gray-650 shadow-none",
  },
  compact: {
    wrapper: "border-t border-slate-200 px-5 py-2.5 -mt-5 -mb-6",
    infoText: "text-sm font-medium text-brand-gray-500",
    controlText: "text-sm text-brand-black-950",
    selectTrigger:
      "h-8 w-[70px] rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-900",
    button: "h-8 w-8 rounded-lg border-slate-200 bg-white text-brand-gray-500",
  },
  inventory: {
    wrapper: "border-t border-brand-gray-150 bg-white px-4 py-2",
    infoText: "text-sm font-medium text-brand-gray-500",
    controlText: "text-sm font-medium text-brand-black-950",
    selectTrigger:
      "h-8 w-[71px] rounded-lg border border-brand-gray-125 bg-white px-3 text-sm text-brand-black-950",
    button: "h-8 w-8 rounded-lg border-brand-gray-125 bg-white text-brand-black-950",
  },
};

export function TableFooter({
  totalResults,
  showingCount,
  rowsPerPage,
  rowsPerPageOptions,
  currentPage,
  totalPages,
  onRowsPerPageChange,
  onPageChange,
  variant = "default",
  className,
}: TableFooterProps) {
  const styles = variantStyles[variant];
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const isInteractive = typeof onPageChange === "function";

  const handlePageChange = (page: number) => {
    if (!isInteractive) return;
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    onPageChange?.(nextPage);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        styles.wrapper,
        className
      )}
    >
      <div className={styles.infoText}>
        Showing {showingCount} of {totalResults} results.
      </div>

      <div className="flex items-center gap-5">
        <div className={cn("flex items-center gap-2", styles.controlText)}>
          <span>Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => onRowsPerPageChange(Number(value))}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {rowsPerPageOptions.map((option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                  className="font-inter"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.controlText}>
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className={styles.button}
            aria-label="First page"
            disabled={!isInteractive || !canGoPrev}
            onClick={() => handlePageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={styles.button}
            aria-label="Previous page"
            disabled={!isInteractive || !canGoPrev}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={styles.button}
            aria-label="Next page"
            disabled={!isInteractive || !canGoNext}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={styles.button}
            aria-label="Last page"
            disabled={!isInteractive || !canGoNext}
            onClick={() => handlePageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
