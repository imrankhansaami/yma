import * as yup from "yup";

export const createPromoCodeSchema = yup.object({
  name: yup.string().required("Promo code name is required."),
  discountType: yup.string().required("Discount type is required."),
  discountPercentage: yup
    .number()
    .typeError("Discount percentage is required.")
    .min(0, "Must be 0 or greater.")
    .max(100, "Cannot exceed 100.")
    .required("Discount percentage is required."),
  maxDiscount: yup.string().required("Max discount value is required."),
  minOrderValue: yup.string().required("Minimum order value is required."),
  totalUsageLimit: yup.string().required("Total usage limit is required."),
  usagePerCustomer: yup
    .number()
    .typeError("Usage per customer is required.")
    .min(0, "Must be 0 or greater.")
    .required("Usage per customer is required."),
  validityStart: yup.date().typeError("Start date is required.").required("Start date is required."),
  validityEnd: yup
    .date()
    .nullable()
    .typeError("End date is required.")
    .required("End date is required.")
    .when("validityStart", (start: unknown, schema) => {
      if (start instanceof Date) {
        return schema.min(start, "End date must be after start date.");
      }
      if (typeof start === "string" || typeof start === "number") {
        const parsed = new Date(start);
        if (!Number.isNaN(parsed.getTime())) {
          return schema.min(parsed, "End date must be after start date.");
        }
      }
      return schema;
    }),
});
