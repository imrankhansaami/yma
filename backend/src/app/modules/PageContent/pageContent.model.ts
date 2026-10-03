import mongoose, { Schema } from "mongoose";
import { IPageContent } from "./pageContent.interface";

export type IPageContentDocument = IPageContent & mongoose.Document;

const pageSectionSchema = new Schema(
  {
    sectionKey: {
      type: String,
      required: [true, "Section key is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true },
);

const pageContentSchema = new Schema<IPageContentDocument>(
  {
    pageType: {
      type: String,
      required: [true, "Page type is required"],
      enum: {
        values: ["category", "location", "core"],
        message: "Page type must be category, location, or core",
      },
      index: true,
    },
    pageKey: {
      type: String,
      required: [true, "Page key is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    sections: {
      type: [pageSectionSchema],
      default: [],
    },
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Page title cannot exceed 200 characters"],
    },
    metaTitle: {
      type: String,
      trim: true,
      default: "",
      maxlength: [120, "Meta title cannot exceed 120 characters"],
    },
    metaDescription: {
      type: String,
      trim: true,
      default: "",
      maxlength: [320, "Meta description cannot exceed 320 characters"],
    },
    metaKeywords: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Meta keywords cannot exceed 500 characters"],
    },
    canonicalUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Canonical URL cannot exceed 500 characters"],
    },
    customJsonLd: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index on {pageType, pageKey}
pageContentSchema.index({ pageType: 1, pageKey: 1 }, { unique: true });

const PageContent = mongoose.model<IPageContentDocument>(
  "PageContent",
  pageContentSchema,
);

export default PageContent;
