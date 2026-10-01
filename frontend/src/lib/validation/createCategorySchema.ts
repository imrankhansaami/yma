import * as yup from "yup";

export const createCategorySchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Category name is required."),
});

export type CreateCategoryFormData = yup.InferType<
  typeof createCategorySchema
>;
