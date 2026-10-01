import * as yup from "yup";

export const addBlogSchema = yup.object({
  title: yup.string().trim().required("Title is required"),
  subtitle: yup.string().trim().required("Subtitle is required"),
  description: yup.string().trim().required("Description is required"),
  metaTitle: yup
    .string()
    .trim()
    .max(255, "Meta title cannot exceed 255 characters")
    .default(""),
  metaDescription: yup
    .string()
    .trim()
    .max(320, "Meta description cannot exceed 320 characters")
    .default(""),
  imageAltText: yup
    .string()
    .trim()
    .max(255, "Image alt text cannot exceed 255 characters")
    .default(""),
  slug: yup.string().trim().default(""),
  canonicalUrl: yup
    .string()
    .trim()
    .test("is-url", "Must be a valid URL", (value) => {
      if (!value) return true;
      try { new URL(value); return true; } catch { return false; }
    })
    .default(""),
  customJsonLd: yup.string().trim().default(""),
});

export type AddBlogFormData = yup.InferType<typeof addBlogSchema>;
