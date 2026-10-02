import api from "@/api/api";

export interface ApiReview {
  _id: string;
  product?:
    | string
    | { _id?: string; name?: string; slug?: string; imageCover?: string };
  name: string;
  rating: number;
  title?: string;
  comment: string;
  status?: "pending" | "approved" | "rejected";
  isVerifiedPurchase?: boolean;
  adminReply?: string;
  /** Admin listing only — never present on public responses. */
  email?: string;
  createdAt?: string;
}

export interface ApiRatingSummary {
  average: number;
  count: number;
  breakdown: { "1": number; "2": number; "3": number; "4": number; "5": number };
}

export interface ReviewListResult {
  reviews: ApiReview[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateReviewPayload {
  product: string;
  name: string;
  email?: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const unwrap = <T,>(payload: any): T => (payload?.data ?? payload) as T;

export const fetchRatingSummary = async (
  productId: string,
): Promise<ApiRatingSummary> => {
  const res = await api.get(`/reviews/summary/${productId}`);
  return unwrap<{ summary: ApiRatingSummary }>(res.data).summary;
};

export const fetchProductReviews = async (
  productId: string,
  page = 1,
  limit = 10,
  sort: "newest" | "highest" | "lowest" = "newest",
): Promise<ReviewListResult> => {
  const res = await api.get(`/reviews/product/${productId}`, {
    params: { page, limit, sort },
  });
  return unwrap<ReviewListResult>(res.data);
};

export const createReview = async (payload: CreateReviewPayload) => {
  const res = await api.post("/reviews", payload);
  return unwrap<{ review: { _id: string; status: string } }>(res.data);
};

// ---------------------------------------------------------------- admin

export const fetchAllReviews = async (
  params: {
    page?: number;
    limit?: number;
    status?: string;
    rating?: number | string;
    search?: string;
    product?: string;
  } = {},
): Promise<ReviewListResult> => {
  const res = await api.get("/reviews", { params });
  return unwrap<ReviewListResult>(res.data);
};

export const fetchReviewStats = async (): Promise<ReviewStats> => {
  const res = await api.get("/reviews/stats");
  return unwrap<{ stats: ReviewStats }>(res.data).stats;
};

export const updateReviewStatus = async (
  id: string,
  status: "pending" | "approved" | "rejected",
) => {
  const res = await api.patch(`/reviews/${id}/status`, { status });
  return unwrap<{ review: ApiReview }>(res.data);
};

export const deleteReview = async (id: string) => {
  await api.delete(`/reviews/${id}`);
};