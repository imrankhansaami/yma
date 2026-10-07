import mongoose, { Schema } from "mongoose";
import {
  ILocation,
  IDeliveryArea,
  IDeliveryOptions,
} from "./location.interface";
import { normalizeSlug, normalizeSlugList } from "../../utils/slug";

/* ---------------------------------- */
/* DELIVERY AREA SUB-SCHEMA            */
/* ---------------------------------- */
const DeliveryAreaSchema = new Schema<IDeliveryArea>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    postcode: {
      type: String,
      required: false,
      trim: true,
      uppercase: true,
    },
    deliveryFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    minOrder: {
      type: Number,
      min: 0,
      default: 0,
    },
    estimatedTime: {
      type: Number,
      min: 0,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

/* ---------------------------------- */
/* DELIVERY OPTIONS SUB-SCHEMA         */
/* ---------------------------------- */
const DeliveryOptionsSchema = new Schema<IDeliveryOptions>(
  {
    isAvailable: { type: Boolean, default: true },
    isFree: { type: Boolean, default: false },
    fee: { type: Number, min: 0, default: 0 },
    minOrder: { type: Number, min: 0, default: 0 },
    estimatedTime: { type: Number, min: 0, default: 60 },
    radius: { type: Number, min: 0, default: 5000 },
  },
  { _id: false },
);

/* ---------------------------------- */
/* LOCATION SCHEMA (SIMPLIFIED)       */
/* ---------------------------------- */
const LocationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
      sparse: true,
    },
    slugAliases: {
      type: [String],
      default: [],
      index: true,
    },

    postcode: {
      type: String,
      required: false,
      trim: true,
      uppercase: true,
      index: true,
    },

    country: {
      type: String,
      required: false,
      trim: true,
    },

    state: {
      type: String,
      required: false,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    deliveryAreas: {
      type: [DeliveryAreaSchema],
      default: [],
    },

    deliveryOptions: {
      type: DeliveryOptionsSchema,
      default: () => ({
        isAvailable: true,
        isFree: false,
        fee: 0,
        minOrder: 0,
        estimatedTime: 60,
        radius: 5000,
      }),
    },

    description: {
      type: String,
      trim: true,
    },

    metaTitle: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 320,
    },
    content: {
      type: String,
    },

    /** Google Maps query shown on the location page: place, address, or "lat,lng". */
    mapQuery: {
      type: String,
      trim: true,
      default: "",
    },
    /** Google Maps zoom level for the location page map. */
    mapZoom: {
      type: Number,
      min: 1,
      max: 21,
      default: 12,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    children: {
      type: [Schema.Types.ObjectId],
      ref: "Location",
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

/* ---------------------------------- */
/* UNIQUE INDEX (name + postcode)     */
/* ---------------------------------- */
LocationSchema.index({ name: 1, postcode: 1 }, { unique: true });
// `slug` already has a unique + sparse index from the field definition.

/* ---------------------------------- */
/* DELIVERY AREA INDEXES              */
/* ---------------------------------- */
LocationSchema.index({ "deliveryAreas.postcode": 1 });
LocationSchema.index({ "deliveryAreas.isActive": 1 });

async function createUniqueLocationSlug(baseName: string, excludeId?: string) {
  const root = normalizeSlug(baseName, "location");
  if (!root) return "";

  let attempt = root;
  let suffix = 2;

  while (true) {
    const query: Record<string, any> = { slug: attempt };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await mongoose.models.Location.exists(query);
    if (!exists) return attempt;
    attempt = `${root}-${suffix++}`;
  }
}

LocationSchema.pre("save", async function (next) {
  const doc = this as any;
  const previousSlug = normalizeSlug(doc.slug);
  const hasSlug = previousSlug.length > 0;
  const shouldRegenerate = !hasSlug || doc.isModified("name");

  if (shouldRegenerate) {
    doc.slug = await createUniqueLocationSlug(String(doc.name || ""), doc._id?.toString());
  } else {
    doc.slug = previousSlug;
  }

  const aliases = Array.isArray(doc.slugAliases) ? doc.slugAliases : [];
  doc.slugAliases = normalizeSlugList([
    ...aliases,
    shouldRegenerate ? previousSlug : undefined,
  ]).filter((item) => item !== doc.slug);

  next();
});

LocationSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  const current = await this.model.findOne(this.getQuery()).select("slug slugAliases");
  const currentSlug = normalizeSlug((current as any)?.slug);
  const currentAliases = Array.isArray((current as any)?.slugAliases)
    ? (current as any).slugAliases
    : [];

  const name = update?.name ?? update?.$set?.name;
  const incomingSlug = update?.slug ?? update?.$set?.slug;
  const candidate = String(name || incomingSlug || "").trim();

  if (incomingSlug) {
    const normalizedIncoming = normalizeSlug(incomingSlug);
    if (!normalizedIncoming) {
      const err = new Error("Invalid slug format");
      (err as any).statusCode = 400;
      return next(err);
    }
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
  const uniqueSlug = await createUniqueLocationSlug(candidate, queryId);
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
  next();
});

export const LocationModel = mongoose.model<ILocation>(
  "Location",
  LocationSchema,
);
