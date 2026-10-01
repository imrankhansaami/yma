"use client";

import TickIcon from "@/assets/icons/Featured-icon.svg";
import ErrorIcon from "@/assets/icons/error_icon.png";
import { X } from "lucide-react";
import Image from "next/image";
type NotificationToastProps = {
  title: string;
  message: string;
  variant?: "success" | "error";
  onClose?: () => void;
};

export function NotificationToast({
  title,
  message,
  variant = "success",
  onClose,
}: NotificationToastProps) {
  const iconSrc = variant === "error" ? ErrorIcon : TickIcon;
  return (
    <div className="flex items-start gap-4 rounded-[14px] border border-brand-gray-160 bg-white px-4 py-3 shadow-[0_4px_12px_var(--alpha-slate-900-12)] w-[360px] font-inter">
      <Image
        src={iconSrc}
        alt="Notification icon"
        width={40}
        height={40}
      />
      <div className="flex-1 space-y-1">
        <p className="text-[15px] font-semibold text-brand-orange-500 leading-tight">
          {title}
        </p>
        <p className="text-[14px] text-brand-slate-600 leading-[20px]">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-1 text-brand-gray-350 hover:text-brand-gray-650 transition"
        aria-label="Close notification"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
