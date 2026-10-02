"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createReview,
  fetchProductReviews,
  fetchRatingSummary,
  type ApiReview,
} from "@/services/review.service";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "highest" | "lowest";

/** Read-only stars. */
function Stars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={cn(
            n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300",
          )}
        />
      ))}
    </span>
  );
}

/** Clickable star picker for the form. */
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-7 w-7",
              n <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-300",
            )}
          />
        </button>
      ))}
    </span>
  );
}

function Breakdown({
  breakdown,
  count,
}: {
  breakdown: { "1": number; "2": number; "3": number; "4": number; "5": number };
  count: number;
}) {
  return (
    <div className="w-full space-y-1.5">
      {([5, 4, 3, 2, 1] as const).map((n) => {
        const value = breakdown?.[String(n) as "1"] ?? 0;
        const pct = count ? Math.round((value / count) * 100) : 0;
        return (
          <div key={n} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-6 shrink-0">{n}★</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span
                className="block h-full rounded-full bg-amber-400"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right tabular-nums">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: ApiReview }) {
  const when = review.createdAt ? new Date(review.createdAt) : null;
  return (
    <li className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Stars value={review.rating} />
        {review.isVerifiedPurchase ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            Verified booking
          </span>
        ) : null}
        {when ? (
          <span className="ml-auto text-xs text-gray-500">{format(when, "d MMM yyyy")}</span>
        ) : null}
      </div>
      {review.title ? (
        <p className="mt-2 font-semibold text-gray-900">{review.title}</p>
      ) : null}
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">
        {review.comment}
      </p>
      <p className="mt-2 text-xs font-medium text-gray-500">— {review.name}</p>
      {review.adminReply ? (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">YMA replied: </span>
          {review.adminReply}
        </div>
      ) : null}
    </li>
  );
}

export default function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName?: string;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [showForm, setShowForm] = React.useState(false);

  const [rating, setRating] = React.useState(5);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [comment, setComment] = React.useState("");

  const enabled = Boolean(productId);

  const summaryQuery = useQuery({
    queryKey: ["reviews", "summary", productId],
    queryFn: () => fetchRatingSummary(productId),
    enabled,
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", "list", productId, page, sort],
    queryFn: () => fetchProductReviews(productId, page, 5, sort),
    enabled,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createReview({
        product: productId,
        name: name.trim(),
        email: email.trim() || undefined,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      toast.success("Thanks! Your review is awaiting approval.");
      setShowForm(false);
      setRating(5);
      setName("");
      setEmail("");
      setTitle("");
      setComment("");
      // Nothing new is public yet, but refresh in case auto-approval is on.
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Sorry, we could not save your review.",
      );
    },
  });

  const summary = summaryQuery.data;
  const data = reviewsQuery.data;
  const reviews = data?.reviews ?? [];
  const count = summary?.count ?? 0;

  const canSubmit =
    name.trim().length > 1 && comment.trim().length >= 5 && rating >= 1;

  if (!enabled) return null;

  return (
    <section id="reviews" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-brand-ink-900 text-[18px] font-semibold">
          Reviews &amp; ratings
          {productName ? <span className="sr-only"> for {productName}</span> : null}
        </h2>
        <Button
          type="button"
          variant={showForm ? "outline" : "default"}
          size="sm"
          className="rounded-full"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Write a review"}
        </Button>
      </div>

      {/* Summary */}
      <div className="mt-5 grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span className="text-4xl font-extrabold text-gray-900">
              {count ? (summary?.average ?? 0).toFixed(1) : "—"}
            </span>
            <div>
              <Stars value={summary?.average ?? 0} size={18} />
              <p className="mt-0.5 text-xs text-gray-500">
                {count === 1 ? "1 review" : `${count} reviews`}
              </p>
            </div>
          </div>
        </div>
        <Breakdown
          breakdown={summary?.breakdown ?? { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }}
          count={count}
        />
      </div>

      {/* Form */}
      {showForm ? (
        <form
          className="mt-6 space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            mutation.mutate();
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Your rating
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rv-name" className="mb-1 block text-sm font-medium text-gray-900">
                Your name <span className="text-red-500">*</span>
              </label>
              <input
                id="rv-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="e.g. Sarah"
              />
            </div>
            <div>
              <label htmlFor="rv-email" className="mb-1 block text-sm font-medium text-gray-900">
                Email <span className="text-gray-400">(not published)</span>
              </label>
              <input
                id="rv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rv-title" className="mb-1 block text-sm font-medium text-gray-900">
              Headline <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="rv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="Great castle, kids loved it"
            />
          </div>

          <div>
            <label htmlFor="rv-comment" className="mb-1 block text-sm font-medium text-gray-900">
              Your review <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rv-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              minLength={5}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="Tell others about your experience…"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canSubmit || mutation.isPending} className="rounded-full">
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit review"
              )}
            </Button>
            <p className="text-xs text-gray-500">
              Reviews are checked before they appear.
            </p>
          </div>
        </form>
      ) : null}

      {/* List */}
      {reviewsQuery.isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          No reviews yet{productName ? ` for ${productName}` : ""}. Be the first to
          share your experience.
        </p>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-end">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Sort
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
              >
                <option value="newest">Newest</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </label>
          </div>

          <ul className="mt-3 space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </ul>

          {data && data.pages > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-gray-500">
                Page {data.page} of {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}