"use client";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderOverview from "@/components/checkout/OrderOverview";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CheckoutClient() {
  const formId = "checkout-form";
  const [agree, setAgree] = useState(false);

  const [keepOvernight, setKeepOvernight] = useState(false);
  const [shipDifferent, setShipDifferent] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [collectionTime, setCollectionTime] = useState("");
  const [floorType, setFloorType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    if (isSubmitting) return;
    if (!agree) {
      toast.error("Please agree to the Terms and Conditions.");
      const helper = document.getElementById("tnc-helper");
      if (helper) helper.classList.remove("hidden");
      return;
    }
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        );
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--checkout-mobile-bar", "72px");
    return () => {
      root.style.removeProperty("--checkout-mobile-bar");
    };
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 max-w-[1240px] mx-auto">
        <section className="md:col-span-6">
          <CheckoutForm
            id={formId}
            keepOvernight={keepOvernight}
            shipDifferent={shipDifferent}
            onKeepOvernightChange={setKeepOvernight}
            onShipDifferentChange={setShipDifferent}
            onDeliveryTimeChange={setDeliveryTime}
            onCollectionTimeChange={setCollectionTime}
            onFloorTypeChange={setFloorType}
            onSubmittingChange={setIsSubmitting}
          />
        </section>

        <aside className="md:col-span-6">
          <OrderOverview
            keepOvernight={keepOvernight}
            deliveryTime={deliveryTime}
            collectionTime={collectionTime}
            floorType={floorType}
          />
        </aside>
      </div>

      <div className="max-w-[1280px] mx-auto hidden md:block">
        <Separator className="my-4" />
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="agree"
              className="data-[state=checked]:bg-brand-orange-500 data-[state=checked]:border-brand-orange-500 data-[state=checked]:text-white"
              checked={agree}
              onCheckedChange={(v) => {
                setAgree(Boolean(v));
                const helper = document.getElementById("tnc-helper");
                if (helper) helper.classList.add("hidden");
              }}
            />
            <Label htmlFor="agree" className="text-sm">
              I have read and agreed to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500-brand underline underline-offset-2"
              >
                Terms and Conditions.
              </a>
            </Label>
          </div>
          <p id="tnc-helper" className="hidden text-[13px] text-red-600">
            This field is required.
          </p>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="ml-auto h-10 rounded-full bg-brand-orange-500 px-6 text-white hover:bg-brand-orange-400 border-2 border-white shadow-sm text-base"
          >
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-subtle bg-white p-3 md:hidden">
        <div className="flex items-start gap-3">
          <Checkbox
            id="agree-m"
            className="data-[state=checked]:bg-brand-orange-500 data-[state=checked]:border-brand-orange-500 data-[state=checked]:text-white"
            checked={agree}
            onCheckedChange={(v) => {
              setAgree(Boolean(v));
              const helper = document.getElementById("tnc-helper");
              if (helper) helper.classList.add("hidden");
            }}
          />
          <Label htmlFor="agree-m" className="text-[13px] leading-4">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500-brand underline underline-offset-2"
            >
              Terms and Conditions
            </a>
          </Label>
        </div>

        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="mt-3 h-11 w-full rounded-full bg-brand-orange-500 text-white hover:bg-brand-orange-400 border-2 border-white shadow-sm text-base"
        >
          {isSubmitting ? "Processing..." : "Confirm Order"}
        </Button>
      </div>
    </>
  );
}
