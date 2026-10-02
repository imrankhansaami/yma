import mongoose from "mongoose";
import Review from "./review.model";
import Product from "../Product/product.model";
import Order from "../Order/order.model";
import ApiError from "../../utils/apiError";
import { revalidatePaths } from "../../utils/revalidate";
import {
  ICreateReviewData,
  IRatingSummary,
  IReviewFilters,
  IReviewStats,
  ReviewStatus,
} from "./review.interface";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const isObjectId = (id?: string) =>
  Boolean(id && mongoose.isValidObjectId(id));

/**
 * The public shape of a review. Deliberately never exposes `email` or `user`,
 * and hides whether a row is still pending.
 */
const toPublic = (review: any) => ({
  _id: review._id,
  product: review.product,
  name: review.name,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
  adminReply: review.adminReply,
  createdAt: review.publishedAt || review.createdAt,
});

/** Recompute a product's denormalised rating and refresh its cached page. */
export const recomputeProductRating = async (
  productId: string,
): Promise<IRatingSummary> => {
  const summary = await getRatingSummary(productId);
  await Product.updateOne(
    { _id: toObjectId(productId) },
    {
      $set: {
        ratingsAverage: summary.average,
        ratingsQuantity: summary.count,
      },
    },
  );
  return summary;
};

const revalidateProductPage = async (productId: string) => {
  try {
    const product: any = await Product.findById(productId).select("slug").lean();
    if (product?.slug) {
      await revalidatePaths([`/product/${product.slug}`]);
    }
  } catch {
    // Revalidation is best-effort; never fail a write because of it.
  }
};

// =========================
// CREATE
// =========================

export const createReview = async (data: ICreateReviewData) => {
  if (!isObjectId(data.product)) {
    throw new ApiError("A valid product is required", 400);
  }

  const product = await Product.findById(data.product).select("name slug");
  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  const userId = isObjectId(data.user) ? toObjectId(data.user!) : undefined;

  // Badge a review as a verified purchase when the signed-in customer has
  // actually ordered this product.
  let isVerifiedPurchase = false;
  if (userId) {
    const ordered = await Order.exists({
      user: userId,
      "items.product": toObjectId(data.product),
    });
    isVerifiedPurchase = Boolean(ordered);
  }

  const review = await Review.create({
    product: toObjectId(data.product),
    user: userId,
    name: data.name,
    email: data.email,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    // Reviews are moderated: they go live only once an admin approves them.
    status: data.status ?? "pending",
    isVerifiedPurchase,
  });

  if (review.status === "approved") {
    review.publishedAt = new Date();
    await review.save();
    await recomputeProductRating(data.product);
    await revalidateProductPage(data.product);
  }

  return review;
};

// =========================
// READ (public)
// =========================

export const listProductReviews = async (
  productId: string,
  page = 1,
  limit = 10,
  sort: "newest" | "highest" | "lowest" = "newest",
) => {
  if (!isObjectId(productId)) {
    throw new ApiError("Invalid product id", 400);
  }

  const query = { product: toObjectId(productId), status: "approved" as ReviewStatus };
  const sortOption =
    sort === "highest"
      ? { rating: -1 as const, createdAt: -1 as const }
      : sort === "lowest"
        ? { rating: 1 as const, createdAt: -1 as const }
        : { createdAt: -1 as const };

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews: reviews.map(toPublic),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getRatingSummary = async (
  productId: string,
): Promise<IRatingSummary> => {
  const empty: IRatingSummary = {
    average: 0,
    count: 0,
    breakdown: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
  if (!isObjectId(productId)) return empty;

  const rows: { _id: number; count: number }[] = await Review.aggregate([
    { $match: { product: toObjectId(productId), status: "approved" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const breakdown = { ...empty.breakdown };
  let count = 0;
  let sum = 0;
  for (const row of rows) {
    const key = String(row._id) as keyof typeof breakdown;
    if (key in breakdown) breakdown[key] = row.count;
    count += row.count;
    sum += row._id * row.count;
  }

  return {
    average: count ? Number((sum / count).toFixed(2)) : 0,
    count,
    breakdown,
  };
};

// =========================
// READ / MANAGE (admin)
// =========================

export const listAllReviews = async (
  filters: IReviewFilters = {},
  page = 1,
  limit = 20,
) => {
  const query: Record<string, any> = {};

  if (isObjectId(filters.product)) query.product = toObjectId(filters.product!);
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.rating && Number(filters.rating) >= 1 && Number(filters.rating) <= 5) {
    query.rating = Number(filters.rating);
  }
  if (filters.search) {
    const safe = String(filters.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    query.$or = [{ name: rx }, { email: rx }, { title: rx }, { comment: rx }];
  }

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product", "name slug imageCover")
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getReviewStats = async (): Promise<IReviewStats> => {
  const rows: { _id: ReviewStatus; count: number }[] = await Review.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const stats: IReviewStats = { pending: 0, approved: 0, rejected: 0, total: 0 };
  for (const row of rows) {
    if (row._id === "pending" || row._id === "approved" || row._id === "rejected") {
      stats[row._id] = row.count;
    }
    stats.total += row.count;
  }
  return stats;
};

export const updateReviewStatus = async (
  reviewId: string,
  status: ReviewStatus,
) => {
  if (!isObjectId(reviewId)) {
    throw new ApiError("Invalid review id", 400);
  }
  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new ApiError("Status must be pending, approved or rejected", 400);
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  review.status = status;
  if (status === "approved" && !review.publishedAt) {
    review.publishedAt = new Date();
  }
  await review.save();

  const productId = String(review.product);
  const summary = await recomputeProductRating(productId);
  await revalidateProductPage(productId);

  return { review, summary };
};

export const deleteReview = async (reviewId: string) => {
  if (!isObjectId(reviewId)) {
    throw new ApiError("Invalid review id", 400);
  }

  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  const productId = String(review.product);
  const summary = await recomputeProductRating(productId);
  await revalidateProductPage(productId);

  return { review, summary };
};