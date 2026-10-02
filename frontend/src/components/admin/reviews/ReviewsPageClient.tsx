"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteReview,
  fetchAllReviews,
  fetchReviewStats,
  updateReviewStatus,
  type ApiReview,
} from "@/services/review.service";

type StatusTab = "all" | "pending" | "approved" | "rejected";

const TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const statusStyle: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= value
              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
              : "h-3.5 w-3.5 text-brand-gray-300"
          }
        />
      ))}
    </span>
  );
}

function productName(product: ApiReview["product"]) {
  if (!product || typeof product === "string") return "—";
  return product.name || "—";
}

export default function ReviewsPageClient() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<StatusTab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const statsQuery = useQuery({
    queryKey: ["admin-reviews", "stats"],
    queryFn: fetchReviewStats,
    staleTime: 15 * 1000,
  });

  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews", "list", tab, search, page],
    queryFn: () =>
      fetchAllReviews({
        page,
        limit,
        status: tab,
        search: search.trim() || undefined,
      }),
    staleTime: 15 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "approved" | "rejected";
    }) => updateReviewStatus(id, status),
    onSuccess: (_data, vars) => {
      toast.success(`Review ${vars.status}.`);
      invalidate();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Could not update the review."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted.");
      invalidate();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Could not delete the review."),
  });

  const reviews = reviewsQuery.data?.reviews ?? [];
  const totalPages = Math.max(1, reviewsQuery.data?.pages ?? 1);
  const stats = statsQuery.data;

  const busy = statusMutation.isPending || deleteMutation.isPending;

  return (
    <div className="min-h-screen space-y-5 py-6">
      <div className="space-y-1">
        <h1 className="text-base font-semibold text-brand-black-950">
          Reviews &amp; Ratings
        </h1>
        <p className="text-sm text-brand-gray-500">
          Approve, reject or remove customer reviews. A product&apos;s star
          rating updates as soon as a review is approved.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats?.total ?? 0 },
          { label: "Pending", value: stats?.pending ?? 0 },
          { label: "Approved", value: stats?.approved ?? 0 },
          { label: "Rejected", value: stats?.rejected ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-brand-gray-235 bg-white p-3"
          >
            <p className="text-xs text-brand-gray-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-brand-black-950">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={
                tab === t.key
                  ? "rounded-full bg-brand-black-950 px-3.5 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-brand-gray-235 bg-white px-3.5 py-1.5 text-xs font-medium text-brand-gray-700 hover:border-brand-gray-300"
              }
            >
              {t.label}
              {t.key === "pending" && stats?.pending ? ` (${stats.pending})` : ""}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email or text…"
          className="w-full max-w-xs"
        />
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-brand-gray-235 bg-white">
        {reviewsQuery.isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-brand-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <p className="p-6 text-center text-sm text-brand-gray-500">
            No reviews to show.
          </p>
        ) : (
          <ul className="divide-y divide-brand-gray-235">
            {reviews.map((review) => (
              <li key={review._id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={review.rating} />
                      <span className="text-sm font-medium text-brand-black-950">
                        {review.name}
                      </span>
                      {review.email ? (
                        <span className="text-xs text-brand-gray-500">
                          {review.email}
                        </span>
                      ) : null}
                      {review.isVerifiedPurchase ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Verified booking
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          statusStyle[review.status || "pending"]
                        }`}
                      >
                        {review.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-brand-gray-500">
                      {productName(review.product)}
                      {review.createdAt
                        ? ` · ${format(new Date(review.createdAt), "d MMM yyyy, HH:mm")}`
                        : ""}
                    </p>

                    {review.title ? (
                      <p className="mt-2 text-sm font-semibold text-brand-black-950">
                        {review.title}
                      </p>
                    ) : null}
                    <p className="mt-1 whitespace-pre-line text-sm text-brand-gray-700">
                      {review.comment}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {review.status !== "approved" ? (
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={busy}
                        onClick={() =>
                          statusMutation.mutate({ id: review._id, status: "approved" })
                        }
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    ) : null}
                    {review.status !== "rejected" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={busy}
                        onClick={() =>
                          statusMutation.mutate({ id: review._id, status: "rejected" })
                        }
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-rose-600 hover:text-rose-700"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Delete this review permanently?")) {
                          deleteMutation.mutate(review._id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-brand-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}