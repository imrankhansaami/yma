import * as yup from "yup";

/** The "Purchase type" choices offered on the checkout form. */
export const PURCHASE_TYPE_OPTIONS = [
  "Personal Use",
  "Business Use (School and Corporate event)",
] as const;

/** Business orders get the bank-transfer option; personal ones do not. */
export const BUSINESS_PURCHASE_TYPE = PURCHASE_TYPE_OPTIONS[1];

/** Checkout payment methods. Values match the API's PAYMENT_METHODS. */
export const PAYMENT_METHOD_OPTIONS = {
  CASH_ON_DELIVERY: "cash_on_delivery",
  BANK_TRANSFER: "bank_transfer",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Direct bank transfer (School and Corporate event)",
  card: "Card",
  online: "Online payment",
  credit_card: "Credit card",
};

export type PaymentMethod =
  (typeof PAYMENT_METHOD_OPTIONS)[keyof typeof PAYMENT_METHOD_OPTIONS];

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
    paymentMethod: yup
      .string()
      .oneOf(
        Object.values(PAYMENT_METHOD_OPTIONS),
        "Select a payment method",
      )
      .default(PAYMENT_METHOD_OPTIONS.CASH_ON_DELIVERY),
    hireOccasion: yup.string().optional(),
    notes: yup.string().optional(),
    agree: yup.boolean().oneOf([true], "This field is required."),
  })
  .required();

export type CheckoutValues = yup.InferType<typeof checkoutSchema>;
