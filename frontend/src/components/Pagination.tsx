"use client";

import { ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  maxVisiblePages?: number;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  maxVisiblePages = 5,
}: PaginationProps) => {
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - halfVisible);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    // Always show first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("ellipsis");
    }

    // Add pages in range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(Math.max(1, currentPage - 1));
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(Math.min(totalPages, currentPage + 1));
    }
  };

  const handlePageClick = (page: number) => {
    if (!isLoading) {
      onPageChange(page);
    }
  };

  return (
    <div className="mt-8 flex justify-center">
      <nav
        aria-label="Pagination"
        className="inline-flex items-center rounded-xl border border-brand-gray-150 overflow-hidden h-10 sm:h-14"
      >
        {/* Prev */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || isLoading}
          className="inline-flex items-center justify-center text-brand-zinc-400 disabled:opacity-60 h-10 sm:h-14 px-3 sm:px-5"
          aria-label="Previous page"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 rotate-180" />
        </button>

        {/* Divider */}
        <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />

        {/* Page items */}
        <div className="flex items-stretch">
          {pages.map((p, idx) => {
            const isEllipsis = p === "ellipsis";
            const isActive = typeof p === "number" && p === currentPage;
            const pageNumber = typeof p === "number" ? p : null;

            return (
              <div key={`${p}-${idx}`} className="flex items-stretch">
                {isEllipsis ? (
                  <span
                    className="inline-flex items-center justify-center h-10 sm:h-14 min-w-[44px] sm:min-w-[64px] px-3 sm:px-6 text-[14px] sm:text-[18px] font-medium text-brand-ink-900"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (pageNumber !== null) handlePageClick(pageNumber);
                    }}
                    disabled={isLoading}
                    className={[
                      "inline-flex items-center justify-center",
                      "h-10 sm:h-14",
                      "min-w-[44px] sm:min-w-[64px]",
                      "px-3 sm:px-6",
                      "text-[14px] sm:text-[18px] font-medium",
                      isActive
                        ? "bg-brand-orange-50 text-brand-orange-500"
                        : "text-brand-ink-900 hover:bg-brand-gray-25",
                    ].join(" ")}
                    aria-label={`Go to page ${pageNumber}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                )}
                {idx !== pages.length - 1 && (
                  <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />

        {/* Next */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || isLoading}
          className="inline-flex items-center justify-center text-brand-ink-900 disabled:opacity-60 h-10 sm:h-14 px-3 sm:px-5"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
