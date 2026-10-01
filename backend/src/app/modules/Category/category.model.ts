import mongoose, { Document, Schema, Types } from "mongoose";
import { ICategory } from "./category.interface";
import { normalizeSlug, normalizeSlugList } from "../../utils/slug";

export interface ICategoryModel extends Omit<ICategory, "_id">, Document {}

const categorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "A category must have a name"],
      unique: true,
      trim: true,
      maxlength: [
        50,
        "A category name must have less or equal than 50 characters",
      ],
      minlength: [
        3,
        "A category name must have more or equal than 3 characters",
      ],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    slugAliases: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        // Add type annotation
        delete ret.id; // Remove the duplicate id field
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret: any) {
        // Add type annotation
        delete ret.id; // Remove the duplicate id field
        return ret;
      },
    },
    id: false, // Disable the default virtual id field
  }
);

// Pre-save middleware to generate slug from name
categorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.isModified("slug")) {
    this.slug = normalizeSlug(this.name as string, "category");
  }
  const currentSlug = normalizeSlug(this.slug as string);
  const aliases = Array.isArray((this as any).slugAliases)
    ? (this as any).slugAliases
    : [];
  (this as any).slugAliases = normalizeSlugList(aliases).filter(
    (item) => item !== currentSlug,
  );
  next();
});

// Virtual for product count
categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "categories",
  count: true,
});

// Indexes for better performance
// `slug` and `name` already have unique indexes from the field definitions.
categorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategoryModel>("Category", categorySchema);

export default Category;
