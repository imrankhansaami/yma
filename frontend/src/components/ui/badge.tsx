"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    React.RefAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

const baseClasses =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors";

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses =
      variant === "outline"
        ? "border-slate-200 text-slate-700 bg-white"
        : variant === "secondary"
          ? "border-transparent bg-slate-100 text-slate-700"
          : "border-transparent bg-slate-900 text-white";

    return (
      <div ref={ref} className={cn(baseClasses, variantClasses, className)} {...props} />
    );
  }
);
Badge.displayName = "Badge";
