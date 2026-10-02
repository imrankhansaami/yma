import express from "express";
import {
  createReview,
  getAllReviews,
  getProductReviews,
  getRatingSummary,
  getReviewStats,
  updateReviewStatus,
  deleteReview,
} from "./review.controller";
import { optionalAuth, protectRoute } from "../../middlewares/auth.middleware";
import { restrictTo } from "../../middlewares/authorization.middleware";

const router = express.Router();

// ---- Public ---------------------------------------------------------------
// Reviews are moderated, so posting is open (a signed-in customer is linked
// automatically when a token is present).
router.post("/", optionalAuth, createReview);
router.get("/product/:productId", getProductReviews);
router.get("/summary/:productId", getRatingSummary);

// ---- Admin ----------------------------------------------------------------
router.use(protectRoute);
router.get("/", restrictTo("admin", "superadmin", "editor"), getAllReviews);
router.get("/stats", restrictTo("admin", "superadmin", "editor"), getReviewStats);
router.patch(
  "/:id/status",
  restrictTo("admin", "superadmin", "editor"),
  updateReviewStatus,
);
router.delete("/:id", restrictTo("admin", "superadmin", "editor"), deleteReview);

export default router;