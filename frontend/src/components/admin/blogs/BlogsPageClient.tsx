"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BlogsTable } from "@/components/admin/blogs/BlogsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchBlogs, type FetchBlogsResponse } from "@/services/blog.service";

const DEFAULT_ROWS_PER_PAGE = 10;

export default function BlogsPageClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isFetching, isError, refetch } =
    useQuery<FetchBlogsResponse>({
      queryKey: ["admin-blogs", debouncedSearch, currentPage, rowsPerPage],
      queryFn: () =>
        fetchBlogs({
          page: currentPage,
          limit: rowsPerPage,
          name: debouncedSearch || null,
        }),
      placeholderData: keepPreviousData,
      staleTime: 30 * 1000,
    });

  const blogs = useMemo(() => data?.items ?? [], [data]);
  const totalResults = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pages ?? 1);

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen space-y-5 py-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-brand-black-950">
            Blog Management
          </h1>
          <p className="text-sm text-brand-gray-500">
            Create, manage, and publish blogs for YMA Bouncy Castle website.
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-zinc-400" />
          <Input
            placeholder="Search by blog name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-lg border-brand-gray-150 bg-white pl-10 text-sm text-brand-black-950 placeholder:text-brand-zinc-400 shadow-none focus-visible:ring-0"
          />
        </div>
        <Link href="/admin/blogs/add-blog" className="shrink-0">
          <Button className="h-10 rounded-lg bg-brand-orange-650 px-4 text-sm font-medium text-white shadow-none hover:bg-brand-orange-500">
            <Plus className="mr-2 h-4 w-4" />
            Create Blog
          </Button>
        </Link>
      </div>

      <BlogsTable
        blogs={blogs}
        totalResults={totalResults}
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        searchTerm={debouncedSearch}
        isLoading={isLoading || isFetching}
        isError={isError}
        onRetry={() => refetch()}
        onDeleted={() => refetch()}
        onRowsPerPageChange={handleRowsPerPageChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
