"use client";

import EmptyIcons from "@/assets/images/Empty icons.png";
import { useCartStore } from "@/store/useCartStore";
import { format, parseISO } from "date-fns";
import { ArrowRight, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

function formatListDate(startISO?: string | null, endISO?: string | null) {
  const start = startISO ? parseISO(startISO) : null;
  const end = endISO ? parseISO(endISO) : null;
  if (start && end) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }
  if (start) {
    return format(start, "MMM d, yyyy");
  }
  return "";
}

export default function CartSidebar() {
  const { isOpen, close, items, removeItem } = useCartStore();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isEmpty = items.length === 0;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black-70 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[61] h-full w-[80%] sm:w-[23.5rem] max-w-[100vw] bg-white shadow-2xl border-l border-subtle font-inter
        transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-subtle">
          <span className="text-ink-900 font-medium">In Cart</span>
          <button
            onClick={close}
            aria-label="Close cart"
            className="p-2 rounded-full hover:bg-gray-50"
          >
            <X className="h-4 w-4 text-ink-900" />
          </button>
        </div>

        {/* Items / Empty */}
        <div className="h-[calc(100%-140px)] overflow-auto px-3 pb-4">
          {!isEmpty &&
            items.map((it, idx) => (
              <div key={`${it.id}-${idx}`}>
                <div className="flex items-start gap-3 py-3">
                  <div className="relative h-10 w-10 rounded-md overflow-hidden border border-subtle shrink-0">
                    <Image
                      src={it.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-ink-900 leading-5">
                        {it.title}
                      </p>
                      <button
                        className="p-1 rounded hover:bg-gray-50"
                        onClick={() => removeItem(it.id, it.dateISO)}
                        aria-label="Remove from cart"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="mt-2 border-t border-subtle" />

                    {/* Dates */}
                    <div className="mt-2">
                      <div className="text-[12px] text-ink-900 font-semibold">
                        Dates
                      </div>
                      <div className="text-[12px] text-gray-600 mt-1">
                        {formatListDate(
                          it.startDateISO ?? it.dateISO,
                          it.endDateISO ?? it.dateISO,
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mt-2 border-t border-subtle" />

                    {/* Price details */}
                    <div className="mt-2 text-[12px]">
                      <div className="text-ink-900 font-semibold">
                        Price Details
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-gray-600">
                          {it.days} day x £{it.pricePerDay}
                        </span>
                        <span className="text-ink-900">
                          £{it.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mx-1 my-2 border-t border-dashed border-subtle" />
              </div>
            ))}

          {isEmpty && (
            <div className="h-full w-full flex flex-col items-center justify-center text-center">
              <Image src={EmptyIcons} alt="empty icons" priority />
              <h3 className="mt-6 text-ink-900 text-[18px] font-semibold">
                Your cart is currently empty!
              </h3>
              <p className="mt-2 text-gray-600 text-sm max-w-[18rem]">
                Looks like you haven&apos;t added anything yet. Start shopping
                to fill it up.
              </p>
              <Link
                href="/booking-catalog"
                className="mt-6 inline-flex w-[calc(100%-24px)] h-10 rounded-full bg-brand-orange-500 text-white font-semibold items-center justify-center gap-1 shadow-[0_2px_0_var(--alpha-black-15)] border border-white hover:bg-brand-orange-400 transition-colors"
                onClick={close}
              >
                Browse Catalogue <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-subtle bg-white px-3 pt-2 pb-3 font-inter">
            <Link
              href={"/checkout"}
              className="w-full h-10 rounded-full bg-brand-orange-500 text-white font-medium flex items-center justify-center gap-1 shadow-sm border border-white hover:bg-brand-orange-400 transition-colors text-base"
              onClick={close}
            >
              Checkout <ArrowRight size={20} />
            </Link>

            <Link
              href={"/cart"}
              className="mt-2 w-full h-10 rounded-full bg-white text-ink-900 font-medium border border-subtle hover:bg-gray-50 flex items-center justify-center gap-1 text-base shadow-sm"
              onClick={close}
            >
              View Cart <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
