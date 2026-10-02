import mongoose, { Schema, Model } from "mongoose";
import { IReview } from "./review.interface";

// The raw document shape. As with Product/Blog, don't intersect this with
// `mongoose.Document` — `.lean()` results are plain objects and would not cast.
export type IReviewModel = IReview;

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "A review must belong to a product"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Please tell us your name"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    // Private: used for verified-purchase matching and admin follow-up only.
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [200, "Email cannot exceed 200 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Please give a rating"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    comment: {
      type: String,
      required: [true, "Please write a review"],
      trim: true,
      minlength: [5, "A review must be at least 5 characters"],
      maxlength: [2000, "A review cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved or rejected",
      },
      default: "pending",
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminReply: {
      type: String,
      trim: true,
      maxlength: [2000, "Reply cannot exceed 2000 characters"],
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Storefront listing: approved reviews for one product, newest first.
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
// Admin moderation queue.
reviewSchema.index({ status: 1, createdAt: -1 });
// One review per signed-in customer per product. Guests are guarded by moderation.
reviewSchema.index(
  { product: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } },
);

const Review: Model<IReviewModel> = mongoose.model<IReviewModel>(
  "Review",
  reviewSchema,
);

export default Review;