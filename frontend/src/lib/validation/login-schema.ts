import * as yup from "yup";

export const loginSchema = yup
  .object({
    email: yup
      .string()
      .email("Enter a valid email")
      .required("Email is required"),
    password: yup
      .string()
      .min(6, "At least 6 characters")
      .required("Password is required"),
    remember: yup.boolean().default(false),
  })
  .required();

export type LoginSchema = yup.InferType<typeof loginSchema>;
