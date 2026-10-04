"use client";

import api from "@/api/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { checkoutSchema } from "@/lib/validation/checkout-schema";
import { selectUser, useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { yupResolver } from "@hookform/resolvers/yup";
import { format, parseISO } from "date-fns";
import { HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Controller,
  useForm,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { toast } from "sonner";
import type { InferType } from "yup";

const formSchema = checkoutSchema.omit(["agree"]);

type BaseSchemaValues = InferType<typeof formSchema>;

type CheckoutFormValues = BaseSchemaValues & {
  // extra fields shown when shipping to a different address
  shipPostalCode?: string;
  shipStreet1?: string;
  shipStreet2?: string;
};

type Props = {
  id?: string; // form id so the parent can trigger requestSubmit()
  keepOvernight?: boolean;
  shipDifferent?: boolean;
  onKeepOvernightChange?: (v: boolean) => void;
  onShipDifferentChange?: (v: boolean) => void;
  onDeliveryTimeChange?: (v: string) => void;
  onCollectionTimeChange?: (v: string) => void;
  onFloorTypeChange?: (v: string) => void;
  onSubmittingChange?: (v: boolean) => void;
};

const BaseTextarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) => (
  <textarea
    {...props}
    className={
      "block w-full min-w-0 flex-1 min-h-[96px] rounded-md border border-subtle bg-background px-3 py-2 text-base outline-none " +
      "placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-emphasis " +
      (props.className || "")
    }
  />
);

const ErrorText = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[13px] text-red-600">{msg}</p> : null;

const Field = ({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5 min-w-0 w-full">
    <Label htmlFor={id} className="text-sm text-ink-900">
      {label} {required && <span className="text-red-600">*</span>}
    </Label>
    {children}
  </div>
);

const stripFeeLabel = (value?: string) =>
  (value || "").replace(/\s*\(\+£\d+\)\s*/g, "").trim();

const parseTimeLabelToValue = (value?: string) => {
  const cleaned = stripFeeLabel(value);
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = match[2];
  const ampm = match[3].toUpperCase();
  const hour24 = ampm === "PM" ? (hour % 12) + 12 : hour === 12 ? 0 : hour;
  return `${hour24.toString().padStart(2, "0")}:${minute}`;
};

const normalizeDeliveryTime = (value?: string) => {
  const cleaned = stripFeeLabel(value);
  if (!cleaned) return "";
  if (/standard delivery/i.test(cleaned)) return "09:00";
  return parseTimeLabelToValue(cleaned);
};

const normalizeCollectionTime = (value?: string) => {
  const cleaned = stripFeeLabel(value);
  if (!cleaned) return "";
  if (/standard collection/i.test(cleaned)) return "17:00";
  return parseTimeLabelToValue(cleaned);
};

const HIRE_OCCASION_VALUE_MAP: Record<string, string> = {
  "Christmas Event": "christmasEvent",
  Eid: "eid",
  "Birthday Party - Child": "birthdayPartyKid",
  "Birthday Party - Adult": "birthdayPartyAdult",
  "Community Event / Fayre": "community_event",
  "School Fete": "school_event",
  Wedding: "wedding",
  Christening: "christening",
  "Corporate Funday": "corporateFunday",
};

export default function CheckoutForm({
  id,
  keepOvernight,
  shipDifferent,
  onKeepOvernightChange,
  onShipDifferentChange,
  onDeliveryTimeChange,
  onCollectionTimeChange,
  onFloorTypeChange,
  onSubmittingChange,
}: Props) {
  const router = useRouter();
  const user = useAuthStore(selectUser);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: yupResolver(
      formSchema,
    ) as unknown as Resolver<CheckoutFormValues>,
    defaultValues: {
      firstName: "",
      lastName: "",
      location: "",
      phone: "",
      street1: "",
      street2: "",
      townCity: "",
      stateCounty: "",
      email: "",
      postalCode: "",
      company: "",
      accessibility: "",
      deliveryTime: "",
      floorType: "",
      collectionTime: "",
      userType: "",
      keepOvernight: keepOvernight ?? false,
      shipDifferent: shipDifferent ?? false,
      hireOccasion: "",
      notes: "",

      shipPostalCode: "",
      shipStreet1: "",
      shipStreet2: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (typeof keepOvernight === "boolean")
      setValue("keepOvernight", keepOvernight);
    if (typeof shipDifferent === "boolean")
      setValue("shipDifferent", shipDifferent);
  }, [keepOvernight, shipDifferent, setValue]);

  const { clear, items } = useCartStore();

  useEffect(() => {
    if (user?.email) setValue("email", user.email, { shouldValidate: true });
  }, [user?.email, setValue]);

  const onSubmit: SubmitHandler<CheckoutFormValues> = async (values) => {
    onSubmittingChange?.(true);
    try {
      const useAlt = Boolean(values.shipDifferent);

      // Determine which address block to use for shipping
      const shippingFirstName = values.firstName;
      const shippingLastName = values.lastName;

      const streetMain = useAlt ? values.shipStreet1 : values.street1;
      const street2 = (useAlt ? values.shipStreet2 : values.street2) || "";
      const city = values.townCity || "";
      const stateCounty = values.stateCounty || "";
      const zip = (useAlt ? values.shipPostalCode : values.postalCode) || "";
      const location = values.location;
      const companyName = values.company;

      const streetCombined = street2
        ? `${streetMain || ""}`.trim()
        : `${streetMain || ""}`.trim();

      const accessibility = values.accessibility || "";
      const deliveryTime = normalizeDeliveryTime(values.deliveryTime || "");
      const collectionTime = normalizeCollectionTime(
        values.collectionTime || "",
      );
      const floorType = stripFeeLabel(values.floorType || "");
      const userType = values.userType || "";
      const hireOccasion =
        HIRE_OCCASION_VALUE_MAP[values.hireOccasion || ""] || "";
      const notes = values.notes || "";

      const shippingAddress = {
        // Personal Information
        firstName: shippingFirstName,
        lastName: shippingLastName,
        email: values.email,
        phone: values.phone,

        // Delivery Information
        street: streetCombined,
        street2,
        city,
        state: stateCounty,
        country: "United Kingdom",
        zipCode: zip,
        location: location || "",

        // Additional Fields
        companyName: companyName || "",
        locationAccessibility: accessibility,
        deliveryTime,
        collectionTime,
        floorType,
        userType,
        keepOvernight: Boolean(values.keepOvernight),
        hireOccasion,
        notes,

        differentBillingAddress: false,
      };

      const products = items.map((item) => {
        const startDate = item.startDateISO || item.dateISO;
        let endDate = item.endDateISO;
        if (!endDate && startDate) {
          const start = parseISO(startDate);
          const days = Math.max(1, item.days || 1);
          const end = new Date(start);
          end.setDate(start.getDate() + Math.max(0, days - 1));
          endDate = format(end, "yyyy-MM-dd");
        }
        return {
          productId: item.id,
          quantity: Math.max(1, item.quantity || 1),
          startDate: startDate || format(new Date(), "yyyy-MM-dd"),
          endDate: endDate || startDate || format(new Date(), "yyyy-MM-dd"),
          // Selected add-ons. Only the key and quantity are sent — the server
          // prices them from the product so the total cannot be tampered with.
          extras: (item.extras ?? []).map((extra) => ({
            key: extra.key,
            quantity: extra.quantity,
          })),
        };
      });

      const payload: any = {
        products,
        shippingAddress,
        paymentMethod: "cash_on_delivery",
        termsAccepted: true,
        invoiceType: "regular",
      };

      const resp = await api.post("/checkout", payload);

      const orderNumber =
        resp?.data?.orderNumber ||
        resp?.data?.order?.orderNumber ||
        resp?.data?.data?.order?.orderNumber ||
        "";
      const refId =
        resp?.data?.reference ||
        resp?.data?.orderId ||
        resp?.data?.order?.id ||
        resp?.data?.order?._id ||
        resp?.data?.data?.order?.id ||
        resp?.data?.data?.order?._id ||
        "";

      toast.success("Order confirmed!");
      await clear();

      const orderParam = orderNumber || refId;
      router.push(
        orderParam
          ? `/checkout/success?orderNumber=${encodeURIComponent(orderParam)}`
          : "/checkout/success",
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to place order. Please try again.";
      toast.error(msg);
      console.error("Checkout error:", err);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const baseInput =
    "block w-full min-w-0 h-10 rounded-md border bg-white px-3 py-2 text-[15px] placeholder:text-gray-400 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-emphasis";

  const baseSelect =
    "block w-full min-w-0 h-10 rounded-md border bg-white px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const errorBorder = "border-red-500";
  const checkboxClass =
    "data-[state=checked]:bg-brand-orange-500 data-[state=checked]:border-brand-orange-500 data-[state=checked]:text-white";

  const shipDifferentLive = watch("shipDifferent");
  const deliveryTimeLive = watch("deliveryTime");
  const collectionTimeLive = watch("collectionTime");
  const floorTypeLive = watch("floorType");

  useEffect(() => {
    onDeliveryTimeChange?.(deliveryTimeLive || "");
  }, [deliveryTimeLive, onDeliveryTimeChange]);

  useEffect(() => {
    onCollectionTimeChange?.(collectionTimeLive || "");
  }, [collectionTimeLive, onCollectionTimeChange]);

  useEffect(() => {
    onFloorTypeChange?.(stripFeeLabel(floorTypeLive || ""));
  }, [floorTypeLive, onFloorTypeChange]);

  return (
    <TooltipProvider delayDuration={120}>
      <form
        id={id}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-10 md:mt-0"
      >
        <h2 className="mb-4 text-[18px] font-semibold text-ink-900">
          Customer & Delivery Information
        </h2>

        {/* Mobile: single column; Desktop: two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* First Name */}
          <Field label="First Name" id="firstName" required>
            <Input
              id="firstName"
              placeholder="Enter first name"
              className={`${baseInput} ${errors.firstName ? errorBorder : ""}`}
              {...register("firstName")}
            />
            <ErrorText msg={errors.firstName?.message} />
          </Field>

          {/* Last Name */}
          <Field label="Last Name" id="lastName" required>
            <Input
              id="lastName"
              placeholder="Enter last name"
              className={`${baseInput} ${errors.lastName ? errorBorder : ""}`}
              {...register("lastName")}
            />
            <ErrorText msg={errors.lastName?.message} />
          </Field>

          {/* Phone */}
          <Field label="Phone Number" id="phone" required>
            <Input
              id="phone"
              placeholder="Enter phone number"
              className={`${baseInput} ${errors.phone ? errorBorder : ""}`}
              {...register("phone")}
            />
            <ErrorText msg={errors.phone?.message} />
          </Field>

          {/* Street 1 */}
          <Field label="Street Address" id="street1" required>
            <Input
              id="street1"
              placeholder="House number & street name"
              className={`${baseInput} ${errors.street1 ? errorBorder : ""}`}
              {...register("street1")}
            />
            <ErrorText msg={errors.street1?.message} />
          </Field>

          {/* Street 2 */}
          <Field label="Street Address" id="street2">
            <Input
              id="street2"
              placeholder="Apartment, suite, unit, etc."
              className={`${baseInput} ${errors.street2 ? errorBorder : ""}`}
              {...register("street2")}
            />
            <ErrorText msg={errors.street2?.message} />
          </Field>

          {/* Town/City */}
          <Field label="Town/City" id="townCity" required>
            <Input
              id="townCity"
              placeholder="Enter your city name"
              className={`${baseInput} ${errors.townCity ? errorBorder : ""}`}
              {...register("townCity")}
            />
            <ErrorText msg={errors.townCity?.message} />
          </Field>

          {/* State/County */}
          <Field label="State/County" id="stateCounty">
            <Input
              id="stateCounty"
              placeholder="Enter your state"
              className={`${baseInput} ${errors.stateCounty ? errorBorder : ""}`}
              {...register("stateCounty")}
            />
            <ErrorText msg={errors.stateCounty?.message} />
          </Field>

          {/* Email */}
          <Field label="Email" id="email" required>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              className={`${baseInput} ${errors.email ? errorBorder : ""}`}
              {...register("email")}
            />
            <ErrorText msg={errors.email?.message} />
          </Field>

          {/* Postal */}
          <Field label="Postal / Zip code" id="postalCode" required>
            <Input
              id="postalCode"
              placeholder="Enter postal/zip code"
              className={`${baseInput} ${errors.postalCode ? errorBorder : ""}`}
              {...register("postalCode")}
            />
            <ErrorText msg={errors.postalCode?.message} />
          </Field>

          {/* Company */}
          <Field label="Company Name" id="company">
            <Input
              id="company"
              placeholder="Enter company name"
              className={`${baseInput} ${errors.company ? errorBorder : ""}`}
              {...register("company")}
            />
            <ErrorText msg={errors.company?.message} />
          </Field>

          {/* Accessibility */}
          <Field label="Location Accessibility" id="accessibility">
            <select
              id="accessibility"
              className={`${baseSelect} ${
                errors.accessibility ? errorBorder : ""
              }`}
              {...register("accessibility")}
              defaultValue=""
            >
              <option value="" disabled className="text-gray-100">
                Select location accessibility
              </option>
              <option>Accessible from street</option>
              <option>Through a building</option>
            </select>
            <ErrorText msg={errors.accessibility?.message} />
          </Field>

          {/* Delivery Time + tooltip */}
          <div className="space-y-1.5 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <Label htmlFor="deliveryTime" className="text-sm text-ink-900">
                Product Delivery Time <span className="text-red-600">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Delivery time info"
                    className="cursor-help"
                  >
                    <HelpCircle className="h-4 w-4 text-ink-900" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[340px] text-[13px] leading-5 font-inter">
                  Our standard delivery time is between 8:00 AM and 12:00 PM,
                  during which delivery is completely free. As we handle
                  multiple orders daily, our team follows a fixed delivery
                  route. If you require a specific delivery time (either within
                  8 AM–12 PM or after 12 PM), a £10 delivery fee will apply.
                </TooltipContent>
              </Tooltip>
            </div>
            <select
              id="deliveryTime"
              className={`${baseSelect} ${
                errors.deliveryTime ? errorBorder : ""
              }`}
              {...register("deliveryTime")}
              defaultValue=""
            >
              <option value="" disabled>
                Select delivery time
              </option>
              <option>Standard delivery 8AM to 12PM (Free)</option>
              <option>9:00 AM (+£10)</option>
              <option>9:30 AM (+£10)</option>
              <option>10:00 AM (+£10)</option>
              <option>10:30 AM (+£10)</option>
              <option>11:00 AM (+£10)</option>
              <option>11:30 AM (+£10)</option>
              <option>12:00 PM (+£10)</option>
              <option>12:30 PM (+£10)</option>
              <option>1:00 PM (+£10)</option>
              <option>1:30 PM (+£10)</option>
              <option>2:00 PM (+£10)</option>
              <option>2:30 PM (+£10)</option>
              <option>3:00 PM (+£10)</option>
              <option>3:30 PM (+£10)</option>
              <option>4:00 PM (+£10)</option>
              <option>4:30 PM (+£10)</option>
              <option>5:00 PM (+£10)</option>
              <option>5:30 PM (+£10)</option>
              <option>6:00 PM (+£10)</option>
              <option>6:30 PM (+£10)</option>
              <option>7:00 PM (+£10)</option>
            </select>
            <ErrorText msg={errors.deliveryTime?.message} />
          </div>

          {/* Floor type */}
          <Field label="Product Will Be Placed In" id="floorType" required>
            <select
              id="floorType"
              className={`${baseSelect} ${errors.floorType ? errorBorder : ""}`}
              {...register("floorType")}
              defaultValue=""
            >
              <option value="" disabled>
                Please Select
              </option>
              <option>Indoors on Hard Surface</option>
              <option>Outdoors on Artificial Grass (+£10)</option>
              <option>Outdoors on Grass</option>
              <option>Outdoors on Hard Surface (+£10)</option>
            </select>
            <ErrorText msg={errors.floorType?.message} />
          </Field>

          {/* Collection Time + tooltip */}
          <div className="space-y-1.5 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <Label htmlFor="collectionTime" className="text-sm text-ink-900">
                Product Collection Time <span className="text-red-600">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Collection time info"
                    className="cursor-help"
                  >
                    <HelpCircle className="h-4 w-4 text-ink-900" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[340px] text-[13px] leading-5 font-inter">
                  For collections, our standard pickup time starts after 5:00 PM
                  and is free of charge. Our team will arrive anytime after 5 PM
                  based on the collection route. If you prefer your bouncy
                  castle to be collected at a fixed time, a £10 collection fee
                  will apply.
                </TooltipContent>
              </Tooltip>
            </div>
            <select
              id="collectionTime"
              className={`${baseSelect} ${
                errors.collectionTime ? errorBorder : ""
              }`}
              {...register("collectionTime")}
              defaultValue=""
            >
              <option value="" disabled>
                Select collection time
              </option>
              <option>Standard collection time after 5PM (Free)</option>
              <option>12:00 PM (+£10)</option>
              <option>12:30 PM (+£10)</option>
              <option>1:00 PM (+£10)</option>
              <option>1:30 PM (+£10)</option>
              <option>2:00 PM (+£10)</option>
              <option>2:30 PM (+£10)</option>
              <option>3:00 PM (+£10)</option>
              <option>3:30 PM (+£10)</option>
              <option>4:00 PM (+£10)</option>
              <option>4:30 PM (+£10)</option>
              <option>5:00 PM (+£10)</option>
              <option>5:30 PM (+£10)</option>
              <option>6:00 PM (+£10)</option>
              <option>6:30 PM (+£10)</option>
              <option>7:00 PM (+£10)</option>
              <option>7:30 PM (+£10)</option>
              <option>8:00 PM (+£10)</option>
              <option>8:30 PM (+£20)</option>
            </select>
            <ErrorText msg={errors.collectionTime?.message} />
          </div>

          {/* Product Used By */}
          <Field label="Product Will Used By" id="userType" required>
            <select
              id="userType"
              className={`${baseSelect} ${errors.userType ? errorBorder : ""}`}
              {...register("userType")}
              defaultValue=""
            >
              <option value="" disabled>
                Select user type
              </option>
              <option>Children</option>
              <option>Adults</option>
              <option>Both</option>
            </select>
            <ErrorText msg={errors.userType?.message} />
          </Field>

          {/* Checkboxes */}
          <div className="space-y-4 min-w-0 w-full md:col-span-2">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="keepOvernight"
                render={({ field }) => (
                  <>
                    <Checkbox
                      id="keepOvernight"
                      className={checkboxClass}
                      checked={field.value}
                      onCheckedChange={(v) => {
                        const b = Boolean(v);
                        field.onChange(b);
                        onKeepOvernightChange?.(b);
                      }}
                    />
                    <Label htmlFor="keepOvernight" className="text-sm">
                      Keeping Overnight (+£30)
                    </Label>
                  </>
                )}
              />
            </div>

            <div
              className={`rounded-lg border px-4 py-3 transition-colors ${
                shipDifferentLive
                  ? "border-brand-orange-400 bg-brand-orange-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Controller
                control={control}
                name="shipDifferent"
                render={({ field }) => (
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="shipDifferent"
                      className={`${checkboxClass} mt-0.5 h-5 w-5`}
                      checked={field.value}
                      onCheckedChange={(v) => {
                        const b = Boolean(v);
                        field.onChange(b);
                        onShipDifferentChange?.(b);
                      }}
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="shipDifferent"
                        className="cursor-pointer text-sm font-semibold leading-5 text-ink-900"
                      >
                        Deliver to a Different Address?
                      </Label>
                      <p className="text-xs leading-5 text-ink-700">
                        Tick this if delivery location is not your billing
                        address.
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Hire Occasion */}
          <div className="md:col-span-2 space-y-1.5 min-w-0 w-full">
            <Label htmlFor="hireOccasion" className="text-sm text-ink-900">
              Hire Occasion
            </Label>
            <select
              id="hireOccasion"
              className={baseSelect}
              {...register("hireOccasion")}
              defaultValue=""
            >
              <option value="" disabled>
                Select occasion
              </option>
              <option>Christmas Event</option>
              <option>Eid</option>
              <option>Birthday Party - Child</option>
              <option>Birthday Party - Adult</option>
              <option>Community Event / Fayre</option>
              <option>School Fete</option>
              <option>Wedding</option>
              <option>Christening</option>
              <option>Corporate Funday</option>
            </select>
          </div>

          {/* Secondary address block (conditional) */}
          {shipDifferentLive && (
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Postal / Zip code" id="shipPostalCode" required>
                  <Input
                    id="shipPostalCode"
                    placeholder="Enter postal/zip code"
                    className={`${baseInput} ${
                      errors.shipPostalCode ? errorBorder : ""
                    }`}
                    {...register("shipPostalCode")}
                  />
                  <ErrorText msg={errors.shipPostalCode?.message} />
                </Field>

                <Field label="Street Address" id="shipStreet1" required>
                  <Input
                    id="shipStreet1"
                    placeholder="House number & street name"
                    className={`${baseInput} ${
                      errors.shipStreet1 ? errorBorder : ""
                    }`}
                    {...register("shipStreet1")}
                  />
                  <ErrorText msg={errors.shipStreet1?.message} />
                </Field>

                <Field label="Street Address" id="shipStreet2">
                  <Input
                    id="shipStreet2"
                    placeholder="Apartment, suite, unit, etc."
                    className={`${baseInput} ${
                      errors.shipStreet2 ? errorBorder : ""
                    }`}
                    {...register("shipStreet2")}
                  />
                  <ErrorText msg={errors.shipStreet2?.message} />
                </Field>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="md:col-span-2 space-y-1.5 min-w-0 w-full">
            <Label htmlFor="notes" className="text-sm text-ink-900">
              Notes
            </Label>
            <BaseTextarea
              id="notes"
              placeholder="Placeholder"
              {...register("notes")}
            />
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
}
