"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, X } from "lucide-react";

type SuccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
};

export function SuccessModal({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Continue",
  onConfirm,
}: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[420px] max-w-[90vw] rounded-2xl border border-slate-200 p-0 font-inter z-[70]"
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

        <div className="flex flex-col items-center justify-center px-6 pt-10 pb-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-brand-black-950">{title}</h3>
          <p className="text-sm text-brand-gray-600">{message}</p>
        </div>

        <div className="flex items-center justify-center border-t border-slate-200 px-6 py-4">
          <Button
            type="button"
            className="w-full h-10 rounded-lg bg-brand-orange-500 text-sm font-semibold text-white hover:bg-brand-orange-600 transition-colors"
            onClick={() => {
              if (onConfirm) onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
