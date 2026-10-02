import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import * as reviewService from "./review.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { IReviewFilters, ReviewStatus } from "./review.interface";

const pick = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const toInt = (value: unknown, fallback: number) => {
  const n = Number(pick(value));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

// =========================
// PUBLIC
// =========================

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user as any;
  const { product, name, email, rating, title, comment } = req.body;

  const review = await reviewService.createReview({
    product: String(product || ""),
    user: user ? String(user._id) : undefined,
    name: String(name || user?.name || "").trim(),
    email: email ? String(email).trim() : user?.email,
    rating: Number(rating),
    title: title ? String(title).trim() : undefined,
    comment: String(comment || "").trim(),
  });

  res.status(201).json({
    success: true,
    message:
      "Thanks for your review! It will appear once it has been checked.",
    data: {
      review: { _id: review._id, status: review.status, rating: review.rating },
    },
  });
});

export const getProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const limit = Math.min(toInt(req.query.limit, 10), 50);
    const sortRaw = String(pick(req.query.sort) || "newest");
    const sort = (["newest", "highest", "lowest"].includes(sortRaw)
      ? sortRaw
      : "newest") as "newest" | "highest" | "lowest";

    const result = await reviewService.listProductReviews(
      String(req.params.productId),
      page,
      limit,
      sort,
    );

    res.status(200).json({ success: true, data: result });
  },
);

export const getRatingSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const summary = await reviewService.getRatingSummary(
      String(req.params.productId),
    );
    res.status(200).json({ success: true, data: { summary } });
  },
);

// =========================
// ADMIN
// =========================

export const getAllReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const limit = Math.min(toInt(req.query.limit, 20), 100);

    const filters: IReviewFilters = {
      product: pick(req.query.product) ? String(pick(req.query.product)) : undefined,
      status: (pick(req.query.status) as IReviewFilters["status"]) || "all",
      rating: pick(req.query.rating) ? String(pick(req.query.rating)) : undefined,
      search: pick(req.query.search) ? String(pick(req.query.search)) : undefined,
    };

    const result = await reviewService.listAllReviews(filters, page, limit);
    res.status(200).json({ success: true, data: result });
  },
);

export const getReviewStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await reviewService.getReviewStats();
    res.status(200).json({ success: true, data: { stats } });
  },
);

export const updateReviewStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { review, summary } = await reviewService.updateReviewStatus(
      String(req.params.id),
      String(req.body.status) as ReviewStatus,
    );

    res.status(200).json({
      success: true,
      message: `Review ${review.status}.`,
      data: { review, summary },
    });
  },
);

export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    await reviewService.deleteReview(String(req.params.id));
    res.status(200).json({ success: true, message: "Review deleted" });
  },
);