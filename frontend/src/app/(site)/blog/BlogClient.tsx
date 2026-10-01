"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import Pagination from "@/components/Pagination";
import { RichText } from "@/components/common/RichText";
import {
  fetchBlogs,
  type ApiBlog,
  type FetchBlogsResponse,
} from "@/services/blog.service";
import { normalizeCanonicalSlug } from "@/lib/canonical";

const ITEMS_PER_PAGE = 12;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function toSlug(value?: string | null) {
  return normalizeCanonicalSlug(value);
}

export default function BlogClient() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } =
    useQuery<FetchBlogsResponse>({
      queryKey: ["blogs", currentPage, ITEMS_PER_PAGE],
      queryFn: () =>
        fetchBlogs({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          status: "published",
          publishedOnly: true,
        }),
      placeholderData: keepPreviousData,
      staleTime: 60 * 1000,
    });

  const blogs = useMemo(() => data?.items ?? [], [data]);
  const derivedPages = useMemo(
    () => data?.pages ?? Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE),
    [data],
  );
  const totalPages = Math.max(1, derivedPages || 0);
  const showEmpty = !isLoading && !isFetching && blogs.length === 0 && !isError;
  const showPagination = blogs.length > 0 && totalPages > 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDate = useCallback((iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const buildShareUrl = useCallback((path?: string) => {
    if (!path) return "";
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, []);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className="flex flex-col mb-2 sm:mb-4 animate-pulse h-full"
        >
          <div className="relative w-full aspect-[240/180] overflow-hidden rounded-lg border border-brand-gray-200 mb-2 sm:mb-4 bg-slate-100" />
          <div className="flex flex-col gap-2 sm:gap-4 flex-1">
            <div className="flex flex-col gap-1">
              <div className="h-4 sm:h-5 w-3/4 bg-slate-100 rounded" />
              <div className="h-3 sm:h-4 w-1/2 bg-slate-100 rounded" />
            </div>
            <div className="h-12 sm:h-14 w-full bg-slate-100 rounded" />
            <div className="flex gap-2 sm:gap-4 mt-auto">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-slate-100 rounded-full" />
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-slate-100 rounded-full" />
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-slate-100 rounded-full" />
            </div>
          </div>
        </div>
      ));
    }

    if (isError) {
      return (
        <div className="col-span-full flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-brand-ink-900 text-lg font-semibold">
            Couldn&apos;t load blogs right now.
          </p>
          <p className="text-brand-gray-600 text-sm max-w-md">
            Please check your connection and try again. If the issue persists,
            our team is likely already on it.
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-brand-orange-500 px-4 py-2 text-white font-semibold hover:bg-brand-orange-600 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    if (showEmpty) {
      return (
        <div className="col-span-full flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-brand-ink-900 text-lg font-semibold">No blogs yet</p>
          <p className="text-brand-gray-600 text-sm max-w-md">
            New articles and guides will appear here as soon as they are
            published.
          </p>
        </div>
      );
    }

    return blogs.map((blog: ApiBlog, idx: number) => {
      const heroImage =
        (Array.isArray(blog.images) && blog.images[0]) || "/placeholder.png";
      const dateLabel = formatDate(blog.publishedAt || blog.createdAt) || "";
      const normalizedSlug = String(blog.slug || "").trim();
      const preferredSlug =
        normalizedSlug && !OBJECT_ID_RE.test(normalizedSlug)
          ? normalizedSlug
          : toSlug(blog.title);
      const href = preferredSlug ? `/blog/${preferredSlug}` : "#";
      const isDisabled = href === "#";
      const shareUrl = buildShareUrl(href);

      const handleShare = (
        e: React.MouseEvent<HTMLButtonElement>,
        platform: "facebook" | "twitter" | "instagram",
      ) => {
        e.preventDefault();
        e.stopPropagation();
        if (!shareUrl || isDisabled) return;

        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedText = encodeURIComponent(blog.title ?? "");

        if (platform === "facebook") {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            "_blank",
            "noopener,noreferrer",
          );
          return;
        }

        if (platform === "twitter") {
          window.open(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
            "_blank",
            "noopener,noreferrer",
          );
          return;
        }

        if (navigator.share) {
          void navigator.share({ url: shareUrl });
          return;
        }

        if (navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(shareUrl);
        }
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      };

      return (
        <Link
          key={blog._id ?? blog.id ?? blog.slug ?? idx}
          href={href}
          className={[
            "flex flex-col mb-2 sm:mb-4 group h-full",
            isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ].join(" ")}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : 0}
        >
          {/* Blog Image */}
          <div className="relative w-full aspect-[240/180] overflow-hidden rounded-lg border border-brand-gray-200 mb-2 sm:mb-4 group-hover:shadow-lg transition-shadow duration-200">
            <Image
              src={heroImage}
              alt={blog.imageAltText || blog.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Blog Content */}
          <div className="flex flex-col gap-2 sm:gap-4 flex-1">
            {/* Title and Date */}
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <h3 className="text-brand-ink-900 font-semibold text-sm sm:text-[16px] leading-[1.4] sm:leading-[1.5] line-clamp-2 group-hover:text-brand-orange-500 transition-colors duration-200">
                {blog.title}
              </h3>
              <p className="text-brand-gray-600 text-xs sm:text-[16px] leading-[1.4] sm:leading-[1.5] font-normal">
                {dateLabel}
              </p>
            </div>

            {/* Description */}
            {blog.subtitle ? (
              <p className="text-brand-gray-600 text-xs sm:text-[16px] leading-[1.4] sm:leading-[1.5] line-clamp-3 font-normal">
                {blog.subtitle}
              </p>
            ) : (
              <RichText
                html={blog.description}
                className="text-brand-gray-600 text-xs sm:text-[16px] leading-[1.4] sm:leading-[1.5] line-clamp-3 font-normal"
              />
            )}

            {/* Social Icons */}
            <div className="flex gap-2 sm:gap-4 items-center pt-1 sm:pt-2 mt-auto">
              <button
                aria-label="Share on Facebook"
                className="text-brand-gray-520 hover:text-brand-ink-900 transition-colors flex items-center justify-center cursor-pointer"
                title="Share on Facebook"
                onClick={(e) => handleShare(e, "facebook")}
              >
                <FaFacebook className="h-4 w-4 sm:h-6 sm:w-6 fill-current" />
              </button>
              <button
                aria-label="Share on Instagram"
                className="text-brand-gray-520 hover:text-brand-ink-900 transition-colors flex items-center justify-center cursor-pointer"
                title="Share on Instagram"
                onClick={(e) => handleShare(e, "instagram")}
              >
                <Instagram className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>
              <button
                aria-label="Share on Twitter"
                className="text-brand-gray-520 hover:text-brand-ink-900 transition-colors flex items-center justify-center cursor-pointer"
                title="Share on Twitter"
                onClick={(e) => handleShare(e, "twitter")}
              >
                <FaXTwitter className="h-4 w-4 sm:h-6 sm:w-6 fill-current" />
              </button>
            </div>
          </div>
        </Link>
      );
    });
  }, [blogs, formatDate, isError, isLoading, refetch, showEmpty, buildShareUrl]);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
        {renderContent}
      </div>

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isFetching}
        />
      )}
    </>
  );
}
