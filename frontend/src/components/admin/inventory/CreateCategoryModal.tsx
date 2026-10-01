"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminToast } from "@/components/ui/admin-toast";
import { createCategorySchema } from "@/lib/validation/createCategorySchema";
import { createCategory } from "@/services/category.service";
import { yupResolver } from "@hookform/resolvers/yup";
import { X } from "lucide-react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";

type CreateCategoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

type FormValues = {
  name: string;
};

const inputClass =
  "h-11 rounded-lg border border-brand-gray-245 bg-white text-[14px] text-brand-slate-800 placeholder:text-brand-zinc-400 focus-visible:ring-2 focus-visible:ring-brand-orange-500";
const errorClass = "text-[12px] text-red-600 mt-1";

export function CreateCategoryModal({
  open,
  onOpenChange,
  onCreated,
}: CreateCategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(
      createCategorySchema,
    ) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: "",
    },
  });
  const { notify } = useAdminToast();

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      await createCategory(values.name);
      notify({
        title: "Category created",
        message: "The category is ready to use.",
      });
      reset();
      onCreated?.();
      onOpenChange(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to create category";
      notify({ title: "Category failed", message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className=" max-w-[92vw] rounded-2xl border border-slate-200 p-0 font-inter"
      >
        <DialogTitle className="sr-only">Create Category</DialogTitle>
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>

        <div className="rounded-t-2xl border-b border-slate-200 bg-brand-gray-50 px-6 pt-5 pb-4">
          <p className="text-lg font-semibold text-brand-slate-800">
            Create Category
          </p>
          <p className="mt-1 text-sm text-brand-gray-650">
            Add categories to group products and keep your inventory structured.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-6">
            <Input
              placeholder="Enter category name"
              className={inputClass}
              {...register("name")}
            />
            <p className={errorClass}>{errors.name?.message}</p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-brand-black-950 shadow-none"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="h-9 rounded-lg bg-brand-orange-500 px-4 text-[13px] font-semibold text-white hover:bg-brand-orange-650"
              disabled={isSubmitting}
            >
              Save Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
