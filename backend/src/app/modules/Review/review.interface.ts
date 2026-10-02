import { Types } from "mongoose";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface IReview {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  /** Set when a signed-in customer leaves the review. */
  user?: Types.ObjectId;
  /** Display name shown publicly. */
  name: string;
  /**
   * Never exposed publicly — used to match a guest review against an order so
   * it can be badged as a verified purchase, and so admins can follow up.
   */
  email?: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount?: number;
  /** Optional public reply from the business. */
  adminReply?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateReviewData {
  product: string;
  user?: string;
  name: string;
  email?: string;
  rating: number;
  title?: string;
  comment: string;
  status?: ReviewStatus;
}

export interface IReviewFilters {
  product?: string;
  status?: ReviewStatus | "all";
  rating?: number | string;
  search?: string;
}

export interface IRatingBucket {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
}

export interface IRatingSummary {
  average: number;
  count: number;
  breakdown: IRatingBucket;
}

export interface IReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}