"use client";

import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminToast } from "@/components/ui/admin-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createPromoCodeSchema } from "@/lib/validation/createPromoCodeSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import { CalendarIcon, Info, X } from "lucide-react";
import {
  Controller,
  useForm,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";

type CreatePromoCodeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

type FormValues = {
  name: string;
  discountType: string;
  discountPercentage: number | "";
  maxDiscount: string;
  minOrderValue: string;
  totalUsageLimit: string;
  usagePerCustomer: number | "";
  validityStart: Date | null;
  validityEnd: Date | null;
};

const fieldLabel = "text-[14px] font-medium text-brand-slate-800";
const inputClass =
  "h-11 rounded-md border border-brand-gray-245 bg-white text-[14px] text-brand-slate-800 placeholder:text-brand-zinc-400 focus-visible:ring-2 focus-visible:ring-brand-orange-500";
const errorClass = "text-[12px] text-red-600 mt-1";

export function CreatePromoCodeModal({
  open,
  onOpenChange,
  onCreated,
}: CreatePromoCodeModalProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(
      createPromoCodeSchema
    ) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: "",
      discountType: "",
      discountPercentage: "" as const,
      maxDiscount: "",
      minOrderValue: "",
      totalUsageLimit: "",
      usagePerCustomer: "" as const,
      validityStart: null,
      validityEnd: null,
    },
  });
  const { notify } = useAdminToast();

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      const payload = {
        promoName: values.name,
        discountPercentage: Number(values.discountPercentage),
        discountType: values.discountType,
        maxDiscountValue: Number(values.maxDiscount),
        discount: Number(values.discountPercentage),
        totalUsageLimit: Number(values.totalUsageLimit),
        validityPeriod: {
          from: values.validityStart?.toISOString(),
          to: values.validityEnd?.toISOString(),
        },
        minimumOrderValue: Number(values.minOrderValue || 0),
        usageLimitPerCustomer: Number(values.usagePerCustomer),
      };

      const res = await api.post("/promos", payload);
      const message =
        res?.data?.message ||
        "Promo code created and ready for use.";

      notify({ title: "Promo code created", message });
      onCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to create promo code";
      notify({ title: "Promo code failed", message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[65vw] max-w-[900px] sm:w-[65vw] sm:max-w-[900px] max-h-[90vh] font-inter p-0 gap-0 border border-slate-200 rounded-2xl flex flex-col"
      >
        <DialogTitle className="sr-only">Create New Promo Code</DialogTitle>
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>

        <div className="bg-brand-gray-90 px-6 pt-5 pb-4 rounded-t-2xl">
          <p className="text-lg font-semibold text-brand-slate-800">
            Create New Promo Code
          </p>
          <p className="text-sm text-brand-gray-650 mt-1">
            Set up a new promotional discount code
          </p>
        </div>

        <form
          id="create-promo-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="grid grid-cols-2 gap-5">
            <Field label="Promo Code Name" required className="col-span-2">
              <Input
                placeholder="e.g., SUMMER 2024"
                className={inputClass}
                {...register("name")}
              />
              <Error msg={errors.name?.message} />
            </Field>

            <Field label="Discount Type" required>
              <Input
                placeholder="e.g., 20% off"
                className={inputClass}
                {...register("discountType")}
              />
              <Error msg={errors.discountType?.message} />
            </Field>
            <Field label="Discount Percentage" required>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  className={cn(inputClass, "pl-9")}
                  {...register("discountPercentage")}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-gray-650">
                  %
                </span>
              </div>
              <Error msg={errors.discountPercentage?.message} />
            </Field>

            <Field label="Max Discount Value" required className="col-span-2">
              <Input
                type="number"
                placeholder="Enter max discount value"
                className={inputClass}
                {...register("maxDiscount")}
              />
              <Error msg={errors.maxDiscount?.message} />
            </Field>
            <div className="col-span-2 rounded-md border border-brand-blue-100 bg-brand-blue-50 px-3 py-2 text-[13px] text-brand-blue-700 flex gap-2 -mt-3">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                Set a maximum discount cap to limit the total discount amount.
                For example, a 20% discount with a $50 max will give $50 off on
                orders over $250.
              </span>
            </div>

            <Field label="Minimum Order Value" className="col-span-2">
              <Input
                type="number"
                placeholder="Enter minimum order value"
                className={inputClass}
                {...register("minOrderValue")}
              />
              <Error msg={errors.minOrderValue?.message} />
            </Field>

            <Field label="Total Usage Limit" required>
              <Input
                type="number"
                placeholder="100"
                className={inputClass}
                {...register("totalUsageLimit")}
              />
              <Error msg={errors.totalUsageLimit?.message} />
            </Field>
            <Field label="Usage Per Customer" required>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  className={cn(inputClass, "pl-9")}
                  {...register("usagePerCustomer")}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-gray-650">
                  %
                </span>
              </div>
              <Error msg={errors.usagePerCustomer?.message} />
            </Field>

            <Field label="Validity Start Date" required>
              <Controller
                control={control}
                name="validityStart"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select date"
                    hasError={!!errors.validityStart}
                  />
                )}
              />
              <Error msg={errors.validityStart?.message} />
            </Field>
            <Field label="Validity End Date" required>
              <Controller
                control={control}
                name="validityEnd"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select date"
                    hasError={!!errors.validityEnd}
                  />
                )}
              />
              <Error msg={errors.validityEnd?.message} />
            </Field>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg border-slate-300 bg-white px-4 text-[14px] font-medium text-brand-black-950"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-promo-form"
            className="h-10 rounded-lg bg-brand-orange-500 px-5 text-[14px] font-semibold text-white hover:bg-brand-orange-430"
          >
            Save Promo Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label className={fieldLabel}>
        {label} {required && <span className="text-red-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Error({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className={errorClass}>{msg}</p>;
}

function DatePicker({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  hasError?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 w-full justify-start rounded-md border bg-white px-3 text-[14px] font-medium text-brand-slate-800 shadow-sm",
            hasError ? "border-brand-orange-500 text-brand-orange-500" : "border-brand-gray-245"
          )}
        >
          <CalendarIcon
            className={cn(
              "mr-2 h-4 w-4",
              hasError ? "text-brand-orange-500" : "text-brand-gray-650"
            )}
          />
          {value ? (
            <span>
              {value.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          ) : (
            <span className="text-brand-zinc-400">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 font-inter" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => onChange(date ?? null)}
          numberOfMonths={1}
          initialFocus
          className="font-inter"
        />
      </PopoverContent>
    </Popover>
  );
}
