"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmActionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  variant?: "danger" | "primary" | "warning";
};

export function ConfirmActionModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading,
  onConfirm,
  variant = "primary",
}: ConfirmActionModalProps) {
  
  const confirmButtonStyles = {
    primary: "bg-brand-orange-500 hover:bg-brand-orange-600 text-white",
    danger: "bg-brand-red-520 hover:bg-brand-red-600 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[420px] max-w-[90vw] rounded-2xl border border-slate-200 p-0 font-inter z-[60]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm transition-all"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>

        <div className="rounded-t-2xl border-b border-slate-200 bg-brand-gray-100 px-6 pt-5 pb-4">
          <p className="text-lg font-semibold text-brand-black-950">{title}</p>
        </div>

        <div className="px-6 py-5 text-sm text-brand-gray-600">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-brand-gray-260 bg-white px-4 text-[13px] font-medium text-brand-black-950 shadow-none hover:bg-brand-gray-50"
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            className={cn(
              "h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors",
              confirmButtonStyles[variant]
            )}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
