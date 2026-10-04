import mongoose, { Schema, Model } from "mongoose";
import { IProduct } from "./product.interface";
import { sanitizeSeoMetaTitle } from "../../utils/seoTitle";
import { normalizeSlug, normalizeSlugList } from "../../utils/slug";
import { footprintFor } from "../../utils/productSize";

// The raw document shape. Do NOT intersect with `mongoose.Document` — it makes
// every `.lean()` result uncastable, since lean queries return plain objects.
export type IProductModel = IProduct;

const productSchema: Schema = new Schema(
  {
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    slugAliases: {
      type: [String],
      default: [],
      index: true,
    },
    certificates: {
      type: [String],
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },

    vendor: {
      type: String,
      required: false,
    },

    warehouse: {
      type: String,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    dimensions: {
      length: {
        type: Number,
        required: [false, "Length is required"],
        min: [1, "Length must be at least 1 foot"],
      },
      width: {
        type: Number,
        required: [false, "Width is required"],
        min: [1, "Width must be at least 1 foot"],
      },
      height: {
        type: Number,
        required: [false, "Height is required"],
        min: [1, "Height must be at least 1 foot"],
      },
    },

    images: [String], // Already exists - this is the array of images

    bookedDates: [
      {
        startDate: {
          type: Date,
          required: false,
        },
        endDate: {
          type: Date,
          required: false,
        },
        bookingId: {
          type: Schema.Types.ObjectId,
          ref: "Booking",
        },
        status: {
          type: String,
          enum: ["confirmed", "pending", "cancelled"],
          default: "confirmed",
        },
      },
    ],
    isTopPick: {
      type: Boolean,
      default: false,
    },
    topPickRank: {
      type: Number,
      min: 1,
      max: 100,
    },
    topPickUpdatedAt: {
      type: Date,
    },
    isTopSelling: {
      type: Boolean,
      default: false,
    },
    topSellingRank: {
      type: Number,
      min: 1,
      max: 100,
    },
    topSellingNotes: {
      type: String,
      trim: true,
      maxlength: [200, "Notes cannot exceed 200 characters"],
    },
    topSellingMarkedAt: {
      type: Date,
    },
    salesCount: {
      // You can update this based on actual bookings
      type: Number,
      default: 0,
      min: 0,
    },
    lastSoldAt: {
      type: Date,
    },
    name: {
      type: String,
      required: [false, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [false, "Product description is required"],
    },
    summary: {
      type: String,
      maxlength: [500, "Summary cannot exceed 500 characters"],
    },
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
    imageCoverAltText: {
      type: String,
      trim: true,
      maxlength: [255, "Cover image alt text cannot exceed 255 characters"],
    },
    imageAltTexts: {
      type: [String],
      default: [],
      validate: {
        validator: function (value: string[]): boolean {
          return value.every((item) => !item || item.length <= 255);
        },
        message: "Each image alt text must be 255 characters or less",
      },
    },
    canonicalUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    customJsonLd: {
      type: String,
    },
    price: {
      type: Number,
      required: [false, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    perDayPrice: {
      type: Number,
      min: [0, "Per day price cannot be negative"],
    },
    perWeekPrice: {
      type: Number,
      min: [0, "Per week price cannot be negative"],
    },
    deliveryAndCollection: {
      type: String,
      required: [false, "Delivery and collection information is required"],
      trim: true,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value: number): boolean {
          return !value || value < (this as any).price;
        },
        message: "Discount price must be below regular price",
      },
    },
    duration: {
      type: String,
      required: [false, "Duration is required"],
    },
    maxGroupSize: {
      type: Number,
      required: [false, "Max group size is required"],
      min: [1, "Group size must be at least 1"],
    },
    difficulty: {
      type: String,
      required: [false, "Difficulty level is required"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be easy, medium, or difficult",
      },
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    imageCover: {
      type: String,
      required: [false, "Image cover is required"],
    },
    location: {
      country: {
        type: String,
        default: "England",
        required: false,
      },
      state: {
        type: String,
        required: [false, "State is required"],
        trim: true,
      },
      city: {
        type: String,
        trim: false,
      },
      /**
       * Postcode districts this product covers, e.g. ["RM9", "RM10"].
       * Selected on the admin product form from the managed location list;
       * the storefront location filter matches against these.
       */
      postcodes: {
        type: [String],
        default: [],
      },
    },

    availableFrom: {
      type: Date,
      required: [false, "Available from date is required"],
    },
    availableUntil: {
      type: Date,
      required: [false, "Available until date is required"],
    },
    size: {
      type: String,
      trim: true,
    },
    /**
     * Internal numeric size (length x width in feet), derived from `size` or
     * `dimensions`. Never displayed — it powers the catalogue's big/small
     * DEFAULT ordering and the Size filter.
     */
    sizeFootprint: {
      type: Number,
      default: 0,
      index: true,
    },
    /**
     * Denormalised review stats, recomputed by the Review module whenever a
     * review is approved, unpublished or deleted. Mirrors WooCommerce's
     * `_wc_average_rating` / `_wc_review_count`.
     */
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: [false, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    isSensitive: {
      type: Boolean,
      required: [false, "Sensitive item status is required"],
      default: false,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    material: {
      type: String,
      required: [false, "Material information is required"],
      trim: true,
    },
    design: {
      type: String,
      required: [false, "Design information is required"],
      trim: true,
    },
    ageRange: {
      min: {
        type: Number,
        required: [false, "Minimum age is required"],
        min: [0, "Minimum age cannot be negative"],
      },
      max: {
        type: Number,
        required: [false, "Maximum age is required"],
        validate: {
          validator: function (this: any, value: number): boolean {
            // During updates, 'this' might be a Query or a partial doc
            // We check if it's a document and if min exists
            const min = this.ageRange
              ? this.ageRange.min
              : this.getUpdate
                ? this.getUpdate().$set["ageRange.min"]
                : undefined;

            // If min isn't being updated and we can't find it, we skip validation
            // or assume it's valid to avoid the 'undefined' crash
            if (min === undefined) return true;

            return value >= min;
          },
          message: "Maximum age must be greater than or equal to minimum age",
        },
      },
      unit: {
        type: String,
        required: [false, "Age unit is required"],
        enum: {
          values: ["years", "months"],
          message: "Age unit must be years or months",
        },
      },
    },
    safetyFeatures: {
      type: [String],
      default: [],
    },
    qualityAssurance: {
      isCertified: {
        type: Boolean,
        required: [false, "Certification status is required"],
        default: false,
      },
      certification: {
        type: String,
        trim: true,
      },
      warrantyPeriod: {
        type: String,
        trim: true,
      },
      warrantyDetails: {
        type: String,
        trim: true,
      },
    },
    purchaseHistory: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        count: {
          type: Number,
          default: 0,
        },
        lastPurchased: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    frequentlyBoughtTogether: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        frequency: {
          type: Number,
          default: 0,
          min: 0,
          max: 1,
        },
        confidence: {
          type: Number,
          default: 0,
          min: 0,
          max: 1,
        },
      },
    ],
    deliveryTimeOptions: {
      type: [String],
      default: ["8am-12pm", "12pm-4pm", "4pm-8pm"],
      enum: ["8am-12pm", "12pm-4pm", "4pm-8pm", "after_8pm"],
    },
    collectionTimeOptions: {
      type: [String],
      default: ["before_5pm", "after_5pm", "next_day"],
      enum: ["before_5pm", "after_5pm", "next_day"],
    },
    defaultDeliveryTime: {
      type: String,
      default: "8am-12pm",
      enum: ["8am-12pm", "12pm-4pm", "4pm-8pm", "after_8pm"],
    },
    defaultCollectionTime: {
      type: String,
      default: "before_5pm",
      enum: ["before_5pm", "after_5pm", "next_day"],
    },
    deliveryTimeFee: {
      type: Number,
      default: 0,
      min: [0, "Delivery time fee cannot be negative"],
    },
    collectionTimeFee: {
      type: Number,
      default: 0,
      min: [0, "Collection time fee cannot be negative"],
    },
    /**
     * Selectable add-ons for this product. Modelled on the WordPress rental
     * plugin's "extra options": each entry is a tick-box (max 1) or a small
     * quantity stepper with a price and a pricing basis.
     */
    extraOptions: {
      type: [
        new Schema(
          {
            key: { type: String, required: true, trim: true },
            label: { type: String, required: true, trim: true },
            price: {
              type: Number,
              default: 0,
              min: [0, "Extra option price cannot be negative"],
            },
            pricingType: {
              type: String,
              enum: ["total", "per_day", "per_quantity"],
              default: "total",
            },
            max: {
              type: Number,
              default: 1,
              min: [1, "Extra option max must be at least 1"],
            },
            enabled: { type: Boolean, default: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// In productSchema.index section, add:
productSchema.index({ "frequentlyBoughtTogether.frequency": -1 });
productSchema.virtual("dimensions.area").get(function (this: IProductModel) {
  return this.dimensions.length * this.dimensions.width;
});
productSchema.virtual("discountPrice").get(function (this: IProductModel) {
  if (this.discount && this.discount > 0) {
    return this.price - (this.price * this.discount) / 100;
  }
  return this.price;
});

// Add virtual for available dates
productSchema.virtual("availableDates").get(function (this: IProductModel) {
  const now = new Date();
  const availableFrom = new Date(this.availableFrom);
  const availableUntil = new Date(this.availableUntil);

  // Return array of available dates (simplified)
  return {
    from: availableFrom > now ? availableFrom : now,
    until: availableUntil,
    isAvailable:
      this.stock > 0 && now >= availableFrom && now <= availableUntil,
  };
});
productSchema.virtual("deliveryInfo").get(function (this: IProductModel) {
  return {
    deliveryTimes: this.deliveryTimeOptions,
    defaultDelivery: this.defaultDeliveryTime,
    deliveryFee: this.deliveryTimeFee,
    collectionTimes: this.collectionTimeOptions,
    defaultCollection: this.defaultCollectionTime,
    collectionFee: this.collectionTimeFee,
  };
});
productSchema.virtual("formattedDimensions").get(function (
  this: IProductModel,
) {
  return `${this.dimensions.length}ft x ${this.dimensions.width}ft x ${this.dimensions.height}ft`;
});

productSchema.virtual("formattedAgeRange").get(function (this: IProductModel) {
  return `${this.ageRange.min}-${this.ageRange.max} ${this.ageRange.unit}`;
});

// productSchema.virtual("isActive").get(function (this: IProductModel) {
//   return this.active;
// });

productSchema.virtual("isAvailable").get(function (this: IProductModel) {
  const now = new Date();
  return (
    this.isActive &&
    this.stock > 0 &&
    now >= this.availableFrom &&
    now <= this.availableUntil
  );
});

productSchema.virtual("hasWarranty").get(function (this: IProductModel) {
  return (
    this.qualityAssurance.warrantyPeriod &&
    this.qualityAssurance.warrantyPeriod.length > 0
  );
});

productSchema.index({ "location.country": 1, "location.state": 1 });
productSchema.index({ price: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ "dimensions.length": 1, "dimensions.width": 1 });
productSchema.index({ "ageRange.min": 1, "ageRange.max": 1 });
productSchema.index({ material: 1 });
productSchema.index({ isSensitive: 1 });
productSchema.index({ "qualityAssurance.isCertified": 1 });

function toSlug(value: string) {
  return normalizeSlug(value, "product");
}

async function createUniqueSlug(
  baseName: string,
  model: Model<IProductModel>,
  excludeId?: string,
) {
  const root = toSlug(baseName);
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

productSchema.pre("save", async function (next) {
  const doc = this as any;
  if (typeof doc.metaTitle === "string" && doc.metaTitle.trim()) {
    doc.metaTitle = sanitizeSeoMetaTitle(doc.metaTitle);
  }
  const previousSlug = normalizeSlug(doc.slug);
  const hasSlug = previousSlug.length > 0;
  const shouldRegenerate = !hasSlug || doc.isModified("name");
  if (shouldRegenerate) {
    doc.slug = await createUniqueSlug(
      String(doc.name || ""),
      doc.constructor as Model<IProductModel>,
      doc._id?.toString(),
    );
  } else {
    doc.slug = previousSlug;
  }

  const aliases = Array.isArray(doc.slugAliases) ? doc.slugAliases : [];
  doc.slugAliases = normalizeSlugList([
    ...aliases,
    shouldRegenerate ? previousSlug : undefined,
  ]).filter((item) => item !== doc.slug);

  // Keep the internal numeric size in step with the typed size / dimensions.
  doc.sizeFootprint = footprintFor({
    size: doc.size,
    dimensions: doc.dimensions,
  });

  return next();
});

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  if (typeof update?.metaTitle === "string") {
    update.metaTitle = sanitizeSeoMetaTitle(update.metaTitle);
  }
  if (typeof update?.$set?.metaTitle === "string") {
    update.$set.metaTitle = sanitizeSeoMetaTitle(update.$set.metaTitle);
  }

  const current = await this.model
    .findOne(this.getQuery())
    .select("slug slugAliases size dimensions sizeFootprint");

  // Keep the internal numeric size in step with the typed size / dimensions.
  // Done before the slug branches below, which return early.
  {
    const nextSize = update?.size ?? update?.$set?.size ?? (current as any)?.size;
    const nextDimensions =
      update?.dimensions ?? update?.$set?.dimensions ?? (current as any)?.dimensions;
    const footprint = footprintFor({ size: nextSize, dimensions: nextDimensions });
    if (update?.$set) {
      update.$set.sizeFootprint = footprint;
    } else {
      update.sizeFootprint = footprint;
    }
  }

  const currentSlug = normalizeSlug((current as any)?.slug);
  const currentAliases = Array.isArray((current as any)?.slugAliases)
    ? (current as any).slugAliases
    : [];

  const name = update?.name ?? update?.$set?.name;
  const incomingSlug = update?.slug ?? update?.$set?.slug;
  const candidate = String(name || incomingSlug || "").trim();
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
    if (update?.$set) {
      update.$set.slugAliases = mergedAliases;
    } else {
      update.slugAliases = mergedAliases;
    }
    this.setUpdate(update);
    return next();
  }

  const query = this.getQuery() as any;
  const queryId =
    typeof query?._id === "string"
      ? query._id
      : query?._id?.toString?.() || undefined;
  const uniqueSlug = await createUniqueSlug(candidate, Product, queryId);
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

const Product: Model<IProductModel> = mongoose.model<IProductModel>(
  "Product",
  productSchema,
);

export default Product;
