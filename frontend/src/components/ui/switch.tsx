"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-brand-orange-500 data-[state=checked]:bg-brand-orange-500",
      "data-[state=unchecked]:border-brand-gray-150 data-[state=unchecked]:bg-brand-gray-110",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-sm ring-0 transition-transform",
        "data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[2px]"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
