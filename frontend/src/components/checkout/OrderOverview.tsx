"use client";

import { Separator } from "@/components/ui/separator";
import { applyPromoCode } from "@/services/promo.service";
import {
  CartExtra,
  computeExtrasTotal,
  useCartStore,
} from "@/store/useCartStore";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "@/lib/validation/checkout-schema";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function OrderOverview({
  deliveryTime = "",
  collectionTime = "",
  floorType = "",
  paymentMethod = PAYMENT_METHOD_OPTIONS.CASH_ON_DELIVERY,
  onPaymentMethodChange,
  isBusinessOrder = false,
}: {
  deliveryTime?: string;
  collectionTime?: string;
  floorType?: string;
  /** Chosen in the checkout form; shown here so the two can never disagree. */
  paymentMethod?: string;
  /** Set from here too, so the payment method can be picked in either place. */
  onPaymentMethodChange?: (v: PaymentMethod) => void;
  /** Business orders also get the bank transfer option. */
  isBusinessOrder?: boolean;
}) {
  const store = useCartStore?.() as any;

  const fallbackItems = [
    {
      id: "1",
      title: "Long tail castle name will be like this dummy text if it is....",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=200&auto=format&fit=crop",
      qty: 1,
      price: 130,
      from: "From: Nov 21 - 21, 2024",
      days: 1,
      extras: [] as CartExtra[],
    },
    {
      id: "2",
      title: "Long tail castle name will be like this dummy text if it is....",
      image:
        "https://images.unsplash.com/photo-1631049552453-54b9c7a3b1ef?q=80&w=200&auto=format&fit=crop",
      qty: 1,
      price: 130,
      from: "From: Nov 21 - 21, 2024",
      days: 1,
      extras: [] as CartExtra[],
    },
  ];

  const items = (store?.items as any[])?.length
    ? (store.items as any[]).map((it) => ({
        id: it.id,
        title: it.title ?? it.name,
        image: it.image,
        qty: Number(it.quantity ?? 1),
        price: Number(it.pricePerDay ?? it.price ?? 130),
        from:
          it.startDateISO && it.endDateISO
            ? `From: ${new Date(it.startDateISO).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
              })} - ${new Date(it.endDateISO).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`
            : "From: Nov 21 - 21, 2024",
        days: it.days ?? 1,
        extras: (it.extras ?? []) as CartExtra[],
      }))
    : fallbackItems;

  const computedSubtotal = useMemo(
    () =>
      items.reduce(
        (s, it) => s + it.price * it.days + computeExtrasTotal(it.extras, it.days),
        0
      ),
    [items],
  );
  const subTotal =
    typeof store?.subtotal === "number" && store.subtotal > 0
      ? store.subtotal
      : computedSubtotal;

  const standardDelivery = /standard/i.test(deliveryTime);
  const standardCollection = /standard/i.test(collectionTime);
  const shipping = !standardDelivery && deliveryTime ? 10 : 0;
  const isLateCollection = /8:30/i.test(collectionTime);
  const collectionFee =
    !standardCollection && collectionTime ? (isLateCollection ? 20 : 10) : 0;

  const [couponOpen, setCouponOpen] = useState<boolean>(false);
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedPromoData, setAppliedPromoData] = useState<{
    discount: number;
    finalAmount: number;
    promoCode: string;
  } | null>(null);

  const couponValue = appliedPromoData?.discount ?? 0;

  // £10 placement fee applies outdoors on a hard surface or on artificial
  // grass. Indoors is always free, including indoors on a hard surface.
  const isIndoors = /indoors/i.test(floorType);
  const needsPlacementFee =
    !isIndoors && (/hard surface/i.test(floorType) || /artificial grass/i.test(floorType));
  const floorFee = needsPlacementFee ? 10 : 0;

  const total =
    subTotal - couponValue + shipping + collectionFee + floorFee;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const orderAmount = subTotal + shipping + collectionFee + floorFee;

      const response = await applyPromoCode({
        promo: couponInput.trim(),
        orderAmount,
      });

      if (response.success) {
        setAppliedPromoData({
          discount: response.discount,
          finalAmount: response.finalAmount,
          promoCode: couponInput.trim(),
        });
        setCouponApplied(true);
        toast.success(response.message || "Promo code applied successfully!");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to apply promo code";
      toast.error(errorMessage);
      console.error("Error applying promo code:", error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCancelCoupon = () => {
    setCouponApplied(false);
    setAppliedPromoData(null);
    setCouponInput("");
    toast.info("Promo code removed");
  };

  const deliveryLabel =
    !deliveryTime || standardDelivery
      ? "Free Delivery (Standard time 8AM to 12PM)"
      : `Specific Delivery Time ${deliveryTime}`;
  const collectionLabel =
    !collectionTime || standardCollection
      ? "Free Collection (Standard time after 5PM)"
      : `Specific Collection Time ${collectionTime}`;

  return (
    <div className="rounded-md bg-brand-gray-50 min-w-0">
      <div className="p-4">
        <h3 className="mb-3 text-[18px] font-semibold text-ink-900">
          Order Overview
        </h3>

        {/* Items table */}
        <div className="overflow-hidden">
          {/* Header */}
          <div className="flex justify-between px-4 py-2 text-sm font-medium text-ink-900">
            <span className="min-w-0">Details</span>
            <span className="text-right">Total Price</span>
          </div>
          <Separator className="col-span-2 my-3" />

          {/* Rows */}
          {items.map((it, idx) => (
            <div
              key={`${it.id}-${idx}`}
              className="grid grid-cols-[minmax(0,1fr),auto] items-center py-3 text-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Image
                  src={it.image}
                  alt={it.title}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-md bg-white object-contain"
                />
                <div className="space-y-1 min-w-0">
                  <p className="line-clamp-2 text-ink-900 break-words">
                    {it.title}
                  </p>
                  <div className="text-[12px] leading-4 text-gray-600">
                    <div>{it.from}</div>
                    <div>
                      <span className="font-medium">Days:</span> {it.days}
                    </div>
                    {(it.extras ?? []).map((extra) => (
                      <div key={extra.key} className="text-gray-500">
                        + {extra.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right text-ink-900">
                <span className="font-medium">
                  £{it.price * it.days + computeExtrasTotal(it.extras, it.days)}
                </span>
              </div>

              <Separator className="col-span-2 my-3" />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 space-y-8 text-sm">
          {/* Sub-Total */}
          <div className="flex items-center justify-between">
            <span className="text-ink-900">Sub-Total:</span>
            <span className="font-medium text-brand-orange-500">
              £{subTotal}
            </span>
          </div>

          {/* Outdoor Placement Fee (hard surface or artificial grass) */}
          {floorFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-ink-900">Outdoor Placement Fee</span>
              <span className="font-medium text-brand-orange-500">
                +£{floorFee}
              </span>
            </div>
          )}

          {/* Shipping Details */}
          <div>
            <div className="mb-2 font-medium text-ink-900">
              Shipping Details
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* small orange outlined dot */}
                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                  <input
                    id="delivery-method"
                    type="radio"
                    name="delivery"
                    value="delivery"
                    checked
                    onChange={() => {}}
                    className="absolute inset-0 h-4 w-4 cursor-pointer opacity-0"
                    aria-checked
                  />
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${"border-brand-orange-500"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${"bg-brand-orange-500"}`}
                    />
                  </span>
                </span>
                <span className="text-ink-900">{deliveryLabel}</span>
              </div>
              <span className="text-brand-orange-500">£{shipping}</span>
            </div>
          </div>

          {/* Collection Details */}
          <div>
            <div className="mb-2 font-medium text-ink-900">
              Collection Details
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                  <input
                    id="collection-method"
                    type="radio"
                    name="collection"
                    value="collection"
                    checked
                    onChange={() => {}}
                    className="absolute inset-0 h-4 w-4 cursor-pointer opacity-0"
                    aria-checked
                  />
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-brand-orange-500"
                  >
                    <span className="h-2 w-2 rounded-full bg-brand-orange-500" />
                  </span>
                </span>
                <span className="text-ink-900">{collectionLabel}</span>
              </div>
              <span className="text-brand-orange-500">£{collectionFee}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 font-medium text-ink-900">Payment Method</div>

            <div className="space-y-2">
              <PaymentOption
                id="summary-payment-cod"
                label={PAYMENT_METHOD_LABELS.cash_on_delivery}
                checked={paymentMethod === PAYMENT_METHOD_OPTIONS.CASH_ON_DELIVERY}
                onSelect={() =>
                  onPaymentMethodChange?.(PAYMENT_METHOD_OPTIONS.CASH_ON_DELIVERY)
                }
              />

              {isBusinessOrder ? (
                <PaymentOption
                  id="summary-payment-bank"
                  label={PAYMENT_METHOD_LABELS.bank_transfer}
                  checked={paymentMethod === PAYMENT_METHOD_OPTIONS.BANK_TRANSFER}
                  onSelect={() =>
                    onPaymentMethodChange?.(PAYMENT_METHOD_OPTIONS.BANK_TRANSFER)
                  }
                />
              ) : null}
            </div>
          </div>

          {/* Promo / Coupon */}
          <div>
            <button
              type="button"
              onClick={() => setCouponOpen((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between text-left text-ink-900"
            >
              <span className="font-medium">Coupon Code</span>
              <span
                className={`ml-2 select-none transition-transform ${
                  couponOpen ? "rotate-180" : ""
                }`}
              >
                ⌄
              </span>
            </button>

            {couponOpen && (
              <div className="mt-2 text-sm">
                {couponApplied ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-900">
                        Coupon Applied ({appliedPromoData?.promoCode})
                      </span>
                      <span className="font-medium text-brand-orange-500">
                        -£{couponValue.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelCoupon}
                      className="mt-1 text-[13px] text-blue-600 hover:underline"
                    >
                      Cancel Coupon
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code"
                      disabled={isApplyingCoupon}
                      className="h-10 w-64 rounded-md border border-subtle bg-background px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="text-[14px] font-medium text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply Coupon"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-end gap-4 text-[16px]">
            <span className="font-medium text-ink-900">Total:</span>
            <span className="font-semibold text-brand-orange-500">
              £{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One payment choice in the order summary.
 *
 * Kept in step with the form's PAYMENT METHOD section through the checkout page
 * state, so either place can be used to pick the method.
 */
function PaymentOption({
  id,
  label,
  checked,
  onSelect,
}: {
  id: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3"
    >
      <span className="flex items-start gap-2">
        <input
          id={id}
          type="radio"
          name="summary-payment"
          value={id}
          checked={checked}
          onChange={onSelect}
          className="mt-0.5 h-4 w-4 accent-brand-orange-500"
        />
        <span className="text-ink-900">{label}</span>
      </span>
      <span className="text-brand-orange-500">£0</span>
    </label>
  );
}
