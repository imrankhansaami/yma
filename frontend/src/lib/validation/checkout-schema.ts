import * as yup from "yup";

/** The "Purchase type" choices offered on the checkout form. */
export const PURCHASE_TYPE_OPTIONS = [
  "Personal Use",
  "Business Use (School and Corporate event)",
] as const;

export const checkoutSchema = yup
  .object({
    firstName: yup.string().required("This field is required."),
    lastName: yup.string().required("This field is required."),
    location: yup.string().optional(),
    phone: yup.string().required("This field is required."),
    street1: yup.string().required("This field is required."),
    street2: yup.string().optional(),
    townCity: yup.string().required("This field is required."),
    stateCounty: yup.string().optional(),
    email: yup
      .string()
      .email("Enter a valid email")
      .required("This field is required."),
    postalCode: yup.string().required("This field is required."),
    company: yup.string().optional(),
    accessibility: yup.string().optional(),
    deliveryTime: yup.string().required("This field is required."),
    floorType: yup.string().required("This field is required."),
    collectionTime: yup.string().required("This field is required."),
    userType: yup.string().required("This field is required."),
    keepOvernight: yup.boolean().default(false),
    shipDifferent: yup.boolean().default(false),
    shipPostalCode: yup
      .string()
      .when("shipDifferent", {
        is: true,
        then: (schema) => schema.required("This field is required."),
        otherwise: (schema) => schema.optional(),
      }),
    shipStreet1: yup
      .string()
      .when("shipDifferent", {
        is: true,
        then: (schema) => schema.required("This field is required."),
        otherwise: (schema) => schema.optional(),
      }),
    shipStreet2: yup.string().optional(),
    purchaseType: yup
      .string()
      .oneOf([...PURCHASE_TYPE_OPTIONS], "Select a purchase type")
      .required("This field is required."),
    hireOccasion: yup.string().optional(),
    notes: yup.string().optional(),
    agree: yup.boolean().oneOf([true], "This field is required."),
  })
  .required();

export type CheckoutValues = yup.InferType<typeof checkoutSchema>;
