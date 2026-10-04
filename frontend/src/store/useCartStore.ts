"use client";

import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartExtra = {
  key: string;
  label: string;
  price: number;
  pricingType: "total" | "per_day" | "per_quantity";
  quantity: number;
};

export type CartItem = {
  id: string;
  title: string;
  image: string;
  dateISO: string;
  startDateISO?: string | null;
  endDateISO?: string | null;
  cartId?: string;
  days: number;
  pricePerDay: number;
  quantity: number;
  total: number;
  /** Add-ons selected for this item. */
  extras?: CartExtra[];
  /** Sum of the selected add-ons, kept in step with `days`. */
  extrasTotal?: number;
};

/**
 * What a single selected add-on contributes to a booking.
 * `total` is charged once, `per_day` per booked day, `per_quantity` per unit.
 */
export const computeExtraLineTotal = (
  extra: Pick<CartExtra, "price" | "quantity" | "pricingType">,
  days: number
): number => {
  const safeDays = Math.max(1, days || 1);
  const quantity = Math.max(1, extra.quantity || 1);
  let total: number;
  if (extra.pricingType === "per_day") {
    total = extra.price * quantity * safeDays;
  } else if (extra.pricingType === "per_quantity") {
    total = extra.price * quantity;
  } else {
    total = extra.price;
  }
  return Math.round(total * 100) / 100;
};

/**
 * What a set of selected add-ons contributes to a booking.
 * Mirrors `resolveExtras` in the backend so the cart and the invoice agree.
 */
export const computeExtrasTotal = (
  extras: CartExtra[] | undefined,
  days: number
): number => {
  if (!extras || extras.length === 0) return 0;
  const total = extras.reduce(
    (sum, extra) => sum + computeExtraLineTotal(extra, days),
    0
  );
  return Math.round(total * 100) / 100;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  cartIds: string[];

  count: number;
  subtotal: number;

  open: () => void;
  close: () => void;
  toggle: () => void;

  hydrate: () => Promise<void>;
  addItem: (args: {
    id: string;
    title: string;
    image: string;
    dateISO: string;
    days: number;
    pricePerDay: number;
    quantity?: number;
    extras?: CartExtra[];
  }) => Promise<void>;
  updateItemDays: (
    productId: string,
    startDateISO: string | undefined,
    days: number,
    quantity?: number
  ) => Promise<void>;
  removeItem: (productId: string, _dateKey?: string) => Promise<void>;
  clear: () => Promise<void>;

  _recompute: () => void;
  _setCartIds: (cartIds: string[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartIds: [],

      count: 0,
      subtotal: 0,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      hydrate: async () => {
        get()._recompute();
      },

      addItem: async (payload) => {
        const quantity = 1;

        const start = parseISO(payload.dateISO);
        const days = Math.max(1, payload.days || 1);

        const end = new Date(start);
        end.setDate(start.getDate() + Math.max(0, days - 1));

        const startDate = format(start, "yyyy-MM-dd");
        const endDate = format(end, "yyyy-MM-dd");

        const extras = payload.extras ?? [];
        const extrasTotal = computeExtrasTotal(extras, days);

        const localItem: CartItem = {
          id: payload.id,
          title: payload.title,
          image: payload.image,
          dateISO: payload.dateISO,
          startDateISO: startDate,
          endDateISO: endDate,
          days,
          pricePerDay: payload.pricePerDay,
          quantity,
          extras,
          extrasTotal,
          total: payload.pricePerDay * days + extrasTotal,
        };

        const existing = get().items.find((it) => it.id === payload.id);
        if (existing) {
          const existingStart = existing.startDateISO || existing.dateISO;
          const existingEnd = existing.endDateISO || existing.dateISO;
          if (
            existingStart !== startDate ||
            existingEnd !== endDate
          ) {
            toast.error(
              "This item is already in your cart with different dates. Remove it first to change dates.",
            );
            return;
          }
        }

        set((state) => {
          const exists = state.items.find((it) => it.id === payload.id);
          const items = exists
            ? state.items.map((it) =>
                it.id === payload.id ? localItem : it
              )
            : [...state.items, localItem];
          return { items };
        });
        get()._recompute();
      },

      updateItemDays: async (productId, startDateISO, days, _quantity) => {
        void _quantity;
        const startISO =
          (typeof startDateISO === "string" && startDateISO) ||
          format(new Date(), "yyyy-MM-dd");

        const start = parseISO(startISO);
        const safeDays = Math.max(1, days);

        const end = new Date(start);
        end.setDate(start.getDate() + Math.max(0, safeDays - 1));

        const startStr = format(start, "yyyy-MM-dd");
        const endStr = format(end, "yyyy-MM-dd");

        set((state) => ({
          items: state.items.map((it) => {
            if (it.id !== productId) return it;
            const extrasTotal = computeExtrasTotal(it.extras, safeDays);
            return {
              ...it,
              startDateISO: startStr,
              endDateISO: endStr,
              dateISO: startStr,
              days: safeDays,
              quantity: 1,
              extrasTotal,
              total: it.pricePerDay * safeDays + extrasTotal,
            };
          }),
        }));
        get()._recompute();
        toast.success("Cart updated");
      },

      removeItem: async (productId) => {
        set((state) => {
          const items = state.items.filter((it) => it.id !== productId);
          return {
            items,
            cartIds: Array.from(
              new Set(items.map((it) => it.cartId).filter(Boolean) as string[])
            ),
          };
        });
        get()._recompute();
        toast.success("Item removed from cart");
      },

      clear: async () => {
        set({ items: [], cartIds: [] });
        get()._recompute();
      },

      _recompute: () => {
        const items = get().items;
        const count = items.length;
        const subtotal = items.reduce(
          (sum, it) =>
            sum +
            it.pricePerDay * (it.days || 1) +
            (it.extrasTotal || 0),
          0
        );
        const cartIds = Array.from(
          new Set(items.map((it) => it.cartId).filter(Boolean) as string[])
        );
        set({ count, subtotal, cartIds });
      },

      _setCartIds: (cartIds) => {
        const unique = Array.from(new Set(cartIds.filter(Boolean)));
        set({ cartIds: unique });
      },
    }),
    {
      name: "yma-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, cartIds: s.cartIds }),
      onRehydrateStorage: () => (state) => {
        state?._recompute();
      },
    }
  )
);
