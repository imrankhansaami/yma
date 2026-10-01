"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

type ConfirmDeleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  itemLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title,
  description = "This action can't be undone.",
  itemLabel,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[420px] max-w-[90vw] rounded-2xl border border-slate-200 p-0 font-inter"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose asChild>
          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>

        <div className="rounded-t-2xl border-b border-slate-200 bg-brand-gray-90 px-6 pt-5 pb-4">
          <p className="text-lg font-semibold text-brand-slate-800">{title}</p>
          <p className="mt-1 text-sm text-brand-gray-650">{description}</p>
        </div>

        <div className="px-6 py-5 text-sm text-brand-slate-800">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{itemLabel || "this item"}</span>?
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-slate-200 bg-white px-4 text-[13px] font-medium text-brand-black-950 shadow-none"
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="h-9 rounded-lg bg-brand-red-520 px-4 text-[13px] font-semibold text-white hover:bg-brand-red-600"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
