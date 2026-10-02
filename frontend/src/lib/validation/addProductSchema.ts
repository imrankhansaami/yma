import * as yup from "yup";

export const addProductSchema = yup.object().shape({
  // Basic Info
  name: yup.string().required("Product name is required"),
  description: yup.string().required("Description is required"),
  metaTitle: yup.string().max(255, "Meta title cannot exceed 255 characters").default(""),
  metaDescription: yup
    .string()
    .max(320, "Meta description cannot exceed 320 characters")
    .default(""),
  imageCoverAltText: yup
    .string()
    .max(255, "Cover image alt text cannot exceed 255 characters")
    .default(""),
  imageAltTexts: yup
    .array()
    .of(yup.string().max(255, "Each image alt text cannot exceed 255 characters"))
    .default([]),
  
  // Pricing & Stock
  price: yup.number().typeError("Price must be a number").required("Price is required"),
  stock: yup.number().typeError("Stock must be a number").default(1),
  
  // Dimensions
  dimensions: yup.object().shape({
    length: yup.number().typeError("Length must be a number").required("Length is required"),
    width: yup.number().typeError("Width must be a number").required("Width is required"),
    height: yup.number().typeError("Height must be a number").required("Height is required"),
  }),

  // Internal size (never shown to customers). Free text in L/W/H order, e.g.
  // "27ft x 9.5ft x 11ft". Pre-filled from the dimensions above but editable.
  // Drives the catalogue's big/small ordering and the Size filter.
  size: yup
    .string()
    .max(120, "Size cannot exceed 120 characters")
    .default(""),

  // Age Range
  ageRange: yup.object().shape({
    min: yup.number().typeError("Min age must be a number").required("Min age is required"),
    max: yup.number().typeError("Max age must be a number").required("Max age is required"),
    unit: yup.string().default("years"),
  }),

  // Location
  location: yup.object().shape({
    country: yup.string().required("Country is required"),
    state: yup.string().required("State is required"),
  }),

  // Organization
  // A product can belong to more than one category.
  categories: yup
    .array()
    .of(yup.string().required())
    .min(1, "Select at least one category")
    .default([]),
  vendor: yup.string().default("YMA"),
  warehouse: yup.string().default("yma"),
  difficulty: yup.string().oneOf(["easy", "medium", "difficult"]).default("easy"),

  // Fees
  deliveryTimeFee: yup.number().typeError("Fee must be a number").default(0),
  collectionTimeFee: yup.number().typeError("Fee must be a number").default(0),

  // Dates
  availableFrom: yup.string().required("Start date is required"),
  availableUntil: yup.string().required("End date is required"),

  // Safety & QA
  // Optional list — items are free-text ("PIPA certified", "Safety mats
  // included", ...). Kept lenient so partially-filled forms still save.
  safetyFeatures: yup.array().of(yup.string()).default([]),
  qualityAssurance: yup.object().shape({
    isCertified: yup.boolean().default(false),
    certification: yup.string().default(""),
    warrantyPeriod: yup.string().default(""),
    // warrantyDetails will be mapped from sensitiveDetails
  }),

  // Sensitive / Warranty Details UI
  isSensitive: yup.boolean().default(false),
  sensitiveDetails: yup.string().default(""),

  // SEO
  slug: yup.string().default(""),
  canonicalUrl: yup
    .string()
    .test("is-url", "Must be a valid URL", (value) => {
      if (!value) return true;
      try { new URL(value); return true; } catch { return false; }
    })
    .default(""),
  customJsonLd: yup.string().default(""),

  // Images - Managed by state, but can validate here if we want.
  // Since we use manual FormData, yup might not validation files directly easily unless we register them.
  // We'll trust the manual check or component state.
  certificates: yup.array().default([]),
});

export type AddProductFormData = yup.InferType<typeof addProductSchema>;
