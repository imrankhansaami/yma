import mongoose, { Schema, Model } from "mongoose";
import { IBlog, BlogStatus } from "./blog.interface";
import { sanitizeSeoMetaTitle } from "../../utils/seoTitle";
import { normalizeSlug, normalizeSlugList } from "../../utils/slug";

// Mongoose expects the "raw" document shape here; hydration (and the
// `.lean()` plain-object shape used by the service layer) is derived from it,
// so don't intersect with `mongoose.Document`.
export type IBlogModel = IBlog;

const blogSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Add author details directly in blog
    authorDetails: {
      name: {
        type: String,
        trim: true,
      },
      avatar: {
        type: String,
      },
      profilePicture: {
        type: String,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      designation: {
        type: String,
        trim: true,
      },
    },
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Blog description is required"],
    },
    images: [String],

    category: {
      type: String,
      trim: true,
    },
    tags: [String],
    status: {
      type: String,
      enum: ["draft", "published", "archived", "scheduled"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    customField1: String,
    customField2: String,
    customField3: String,
    customField4: String,
    customField5: String,
    customField6: String,
    customField7: String,
    customField8: String,
    subtitle: String,
    // Add these author fields:
    authorName: {
      type: String,
      required: true,
    },
    authorImage: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, "SEO title cannot exceed 60 characters"],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "SEO description cannot exceed 160 characters"],
    },
    seoKeywords: [String],
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [255, "Meta title cannot exceed 255 characters"],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [320, "Meta description cannot exceed 320 characters"],
    },
    imageAltText: {
      type: String,
      trim: true,
      maxlength: [255, "Image alt text cannot exceed 255 characters"],
    },
    canonicalUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    customJsonLd: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    slugAliases: {
      type: [String],
      default: [],
      index: true,
    },
    readTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

function toSlug(value?: string | null) {
  return normalizeSlug(value, "blog");
}

async function createUniqueSlug(
  baseTitle: string,
  model: Model<IBlogModel>,
  excludeId?: string,
) {
  const root = toSlug(baseTitle);
  if (!root) return "";

  let attempt = root;
  let suffix = 2;

  while (true) {
    const query: Record<string, any> = { slug: attempt };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await model.exists(query);
    if (!exists) return attempt;
    attempt = `${root}-${suffix++}`;
  }
}

// Generate slug from title before saving
blogSchema.pre("save", async function (next) {
  if (typeof this.metaTitle === "string" && this.metaTitle.trim()) {
    this.metaTitle = sanitizeSeoMetaTitle(this.metaTitle);
  }
  if (typeof this.seoTitle === "string" && this.seoTitle.trim()) {
    this.seoTitle = sanitizeSeoMetaTitle(this.seoTitle);
  }

  const previousSlug = normalizeSlug(this.slug);
  const hasSlug = previousSlug.length > 0;
  const shouldRegenerate = this.isModified("title") || !hasSlug;
  if (shouldRegenerate) {
    this.slug = await createUniqueSlug(
      String(this.title || ""),
      this.constructor as Model<IBlogModel>,
      this._id?.toString(),
    );
  } else {
    this.slug = previousSlug;
  }
  const aliases = Array.isArray((this as any).slugAliases)
    ? (this as any).slugAliases
    : [];
  (this as any).slugAliases = normalizeSlugList([
    ...aliases,
    shouldRegenerate ? previousSlug : undefined,
  ]).filter((item) => item !== this.slug);

  // Calculate read time (approx 200 words per minute)
  if (this.isModified("description")) {
    const wordCount = this.description.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }

  // Set publishedAt when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  return next();
});

blogSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  const current = await this.model.findOne(this.getQuery()).select("slug slugAliases");
  const currentSlug = normalizeSlug((current as any)?.slug);
  const currentAliases = Array.isArray((current as any)?.slugAliases)
    ? (current as any).slugAliases
    : [];
  if (typeof update?.metaTitle === "string") {
    update.metaTitle = sanitizeSeoMetaTitle(update.metaTitle);
  }
  if (typeof update?.$set?.metaTitle === "string") {
    update.$set.metaTitle = sanitizeSeoMetaTitle(update.$set.metaTitle);
  }
  if (typeof update?.seoTitle === "string") {
    update.seoTitle = sanitizeSeoMetaTitle(update.seoTitle);
  }
  if (typeof update?.$set?.seoTitle === "string") {
    update.$set.seoTitle = sanitizeSeoMetaTitle(update.$set.seoTitle);
  }

  const title = update?.title ?? update?.$set?.title;
  const incomingSlug = update?.slug ?? update?.$set?.slug;
  const candidate = String(title || incomingSlug || "").trim();
  const normalizedIncomingSlug = incomingSlug ? normalizeSlug(incomingSlug) : "";
  if (incomingSlug && !normalizedIncomingSlug) {
    const err = new Error("Invalid slug format");
    (err as any).statusCode = 400;
    return next(err);
  }
  if (!candidate) {
    const mergedAliases = normalizeSlugList([...currentAliases, currentSlug]).filter(
      (item) => item !== currentSlug,
    );
    if (update?.$set) update.$set.slugAliases = mergedAliases;
    else update.slugAliases = mergedAliases;
    this.setUpdate(update);
    return next();
  }

  const query = this.getQuery() as any;
  const queryId =
    typeof query?._id === "string"
      ? query._id
      : query?._id?.toString?.() || undefined;
  const uniqueSlug = await createUniqueSlug(candidate, Blog, queryId);
  const mergedAliases = normalizeSlugList([...currentAliases, currentSlug]).filter(
    (item) => item !== uniqueSlug,
  );

  if (update?.$set) {
    update.$set.slug = uniqueSlug;
    update.$set.slugAliases = mergedAliases;
  } else {
    update.slug = uniqueSlug;
    update.slugAliases = mergedAliases;
  }

  this.setUpdate(update);
  return next();
});

// Virtual for isPublished
blogSchema.virtual("isPublished").get(function () {
  return this.status === "published";
});

// Virtual for formatted date
blogSchema.virtual("formattedDate").get(function () {
  return this.publishedAt
    ? new Date(this.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(this.createdAt!).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
});

// Indexes
blogSchema.index({ title: "text", subtitle: "text", description: "text" });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ isFeatured: 1, status: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ scheduledAt: 1 });
blogSchema.index({ createdAt: -1 });

const Blog: Model<IBlogModel> = mongoose.model<IBlogModel>("Blog", blogSchema);

export default Blog;
