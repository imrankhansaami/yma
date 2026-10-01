"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, LogOut, Package, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orderServices } from "@/services/order.service";
import {
  selectIsAuthenticated,
  selectUser,
  useAuthStore,
} from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

type OrderProduct = {
  _id?: string;
  name?: string;
  price?: number;
  imageCover?: string;
};

type OrderItem = {
  product?: OrderProduct | null;
  quantity: number;
  price: number;
  name: string;
  startDate?: string;
  endDate?: string;
  hireOccasion?: string;
  keepOvernight?: boolean;
};

type Order = {
  id?: string;
  _id?: string;
  orderNumber?: string;
  user?: string;
  items: OrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  overnightFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    country?: string;
    city?: string;
    street?: string;
    zipCode?: string;
    apartment?: string;
    location?: string;
    companyName?: string;
    locationAccessibility?: string;
    deliveryTime?: string;
    collectionTime?: string;
    floorType?: string;
    userType?: string;
    keepOvernight?: boolean;
    hireOccasion?: string;
    notes?: string;
    differentBillingAddress?: boolean;
    billingFirstName?: string;
    billingLastName?: string;
    billingStreet?: string;
    billingCity?: string;
    billingZipCode?: string;
    billingCompanyName?: string;
  };
  termsAccepted?: boolean;
  invoiceType?: string;
  bankDetails?: string;
  promoDiscount?: number;
  estimatedDeliveryDate?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function formatDateRange(startISO?: string, endISO?: string) {
  if (!startISO) return "—";
  const start = parseISO(startISO);
  const end = endISO ? parseISO(endISO) : null;
  if (end) {
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  }
  return format(start, "MMM d, yyyy");
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const {
    data: ordersPayload,
    isLoading,
    isError,
    isFetching,
  } = useQuery<{
    orders: Order[];
    total: number;
    pages: number;
  }>({
    queryKey: ["my-orders", currentPage, limit],
    queryFn: () =>
      orderServices.getMyOrders<Order>({ page: currentPage, limit }),
    staleTime: 30 * 1000,
  });

  const orders = ordersPayload?.orders || [];
  const total = ordersPayload?.total ?? 0;
  const pageCount = Math.max(
    1,
    ordersPayload?.pages ?? Math.ceil(total / limit),
  );

  const activeOrder = orders.find(
    (entry) => (entry.id || entry._id) === activeOrderId,
  );
  useEffect(() => {
    if (!activeOrderId) return;
    if (!activeOrder) setActiveOrderId(null);
  }, [activeOrderId, activeOrder]);

  const pagesToShow = useMemo(() => {
    if (pageCount <= 5)
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "ellipsis", pageCount] as const;
    if (currentPage >= pageCount - 2)
      return [1, "ellipsis", pageCount - 2, pageCount - 1, pageCount] as const;
    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      pageCount,
    ] as const;
  }, [currentPage, pageCount]);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(pageCount, p + 1));
  const goPage = (n: number) =>
    setCurrentPage(Math.min(pageCount, Math.max(1, n)));

  const activeOrderTitle =
    activeOrder?.items?.[0]?.name ?? activeOrder?.orderNumber ?? "Order";
  const customerName = activeOrder?.shippingAddress
    ? `${activeOrder.shippingAddress.firstName ?? ""} ${activeOrder.shippingAddress.lastName ?? ""}`.trim()
    : "";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isAuthenticated) {
        const ok = await checkAuth();
        if (!ok && isMounted) {
          router.push("/login");
          return;
        }
      }
      if (isMounted) setAuthChecked(true);
    })();
    return () => {
      isMounted = false;
    };
  }, [checkAuth, isAuthenticated, router]);

  if (!authChecked) {
    return (
      <section className="w-full mt-20 md:mt-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 sm:py-12 font-inter">
          <div className="rounded-2xl border border-brand-gray-150 bg-white p-6 text-sm text-brand-gray-600">
            Checking your account...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mt-20 md:mt-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10 sm:py-14 font-inter">
        <div className="flex flex-col items-stretch md:flex-row md:items-start gap-6">
          <Card className="rounded-2xl border border-brand-orange-200 bg-white shadow-[0_18px_35px_var(--alpha-black-8)] md:sticky md:top-28">
            <CardContent className="p-5">
              <div className="mb-4 rounded-2xl border border-brand-orange-100 bg-brand-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white border border-brand-orange-100 flex items-center justify-center text-brand-orange-500 shadow-[0_6px_14px_var(--alpha-black-6)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-ink-900">
                      {user?.name || "Customer"}
                    </div>
                    <div className="text-xs text-brand-gray-600">
                      {user?.email || "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={[
                    "inline-flex items-center justify-start gap-3",
                    "rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    activeTab === "profile"
                      ? "border-brand-orange-300 bg-brand-orange-50 text-brand-orange-600 shadow-[0_6px_14px_var(--alpha-black-6)]"
                      : "border-brand-yellow-200 text-brand-ink-900 hover:bg-brand-yellow-50",
                  ].join(" ")}
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={[
                    "inline-flex items-center justify-start gap-3",
                    "rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                    activeTab === "orders"
                      ? "border-brand-orange-300 bg-brand-orange-50 text-brand-orange-600 shadow-[0_6px_14px_var(--alpha-black-6)]"
                      : "border-brand-emerald-200 text-brand-ink-900 hover:bg-brand-emerald-50",
                  ].join(" ")}
                >
                  <Package className="h-4 w-4" />
                  Orders
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </CardContent>
          </Card>

          {activeTab === "profile" ? (
            <Card className="min-w-0 w-full rounded-2xl border border-brand-yellow-200 bg-white shadow-[0_18px_35px_var(--alpha-black-8)]">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-brand-ink-900 font-semibold text-[22px] sm:text-[26px]">
                      Profile Details
                    </h2>
                    <p className="text-brand-gray-600 mt-1 text-sm sm:text-[15px]">
                      Keep your contact information up to date.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-brand-yellow-200 bg-brand-yellow-50 px-5 py-4 shadow-[0_10px_20px_var(--alpha-black-5)]">
                    <div className="text-xs uppercase tracking-[0.2em] text-brand-gray-500">
                      Full Name
                    </div>
                    <div className="mt-2 text-lg font-semibold text-brand-ink-900">
                      {user?.name || "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-brand-orange-200 bg-brand-orange-50 px-5 py-4 shadow-[0_10px_20px_var(--alpha-black-5)]">
                    <div className="text-xs uppercase tracking-[0.2em] text-brand-gray-500">
                      Email
                    </div>
                    <div className="mt-2 text-lg font-semibold text-brand-ink-900 break-all">
                      {user?.email || "—"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="min-w-0 w-full rounded-2xl border border-brand-emerald-200 bg-white shadow-[0_18px_35px_var(--alpha-black-8)]">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-brand-ink-900 font-semibold text-[22px] sm:text-[26px]">
                      Orders
                    </h2>
                    <p className="text-brand-gray-600 mt-1 text-sm sm:text-[15px]">
                      Review your previous orders and current order status.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-brand-emerald-200 bg-brand-emerald-50 px-3 py-1 text-xs text-brand-emerald-700">
                    {total} orders
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={`sk-${i}`}
                          className="w-full rounded-xl border border-brand-gray-150 bg-brand-orange-50 px-4 py-4 animate-pulse"
                        >
                          <div className="h-3 w-24 rounded bg-brand-gray-200" />
                          <div className="mt-2 h-4 w-48 rounded bg-brand-gray-200" />
                          <div className="mt-2 h-3 w-36 rounded bg-brand-gray-200" />
                        </div>
                      ))
                    : null}

                  {!isLoading && !isError && orders.length === 0 && (
                    <div className="rounded-xl border border-dashed border-brand-emerald-200 bg-brand-emerald-50 px-6 py-10 text-center text-sm text-brand-emerald-700">
                      You have no orders yet. Start browsing the catalog to book
                      your next event.
                    </div>
                  )}

                  {!isLoading &&
                    !isError &&
                    orders.map((order) => {
                      const statusClass =
                        statusStyles[order.status] ??
                        "bg-brand-gray-100 text-brand-gray-700 border-brand-gray-200";
                      const firstItem = order.items?.[0];
                      const imageCover = firstItem?.product?.imageCover;
                      const orderId = order.id || order._id || "";

                      return (
                        <button
                          key={orderId}
                          type="button"
                          onClick={() => setActiveOrderId(orderId)}
                          className="w-full text-left rounded-xl border border-brand-gray-150 bg-white px-4 py-4 transition hover:border-brand-emerald-300 hover:bg-brand-emerald-50/40 hover:shadow-[0_4px_14px_var(--alpha-black-6)]"
                        >
                          <div className="flex items-start gap-4">
                            {imageCover ? (
                              <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-brand-gray-150 bg-brand-gray-50">
                                <Image
                                  src={imageCover}
                                  alt={firstItem?.name ?? "Order item"}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                            ) : null}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-xs text-brand-gray-500">
                                    Order #{order.orderNumber}
                                  </div>
                                  <div className="text-sm font-semibold text-brand-ink-900 mt-1">
                                    {firstItem?.name ?? "Order items"}
                                  </div>
                                  <div className="text-xs text-brand-gray-600 mt-1">
                                    {formatDateRange(
                                      firstItem?.startDate,
                                      firstItem?.endDate,
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}
                                  >
                                    {order.status}
                                  </span>
                                  <div className="text-sm font-semibold text-brand-ink-900 mt-2">
                                    £{order.totalAmount.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-brand-gray-500">
                                <span>Items: {order.items?.length ?? 0}</span>
                                <span className="h-1 w-1 rounded-full bg-brand-gray-300" />
                                <span>
                                  Placed{" "}
                                  {format(
                                    parseISO(order.createdAt),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                  {isError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-700">
                      We couldn&apos;t load your orders right now. Please
                      refresh the page and try again.
                    </div>
                  )}
                </div>

                {orders.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <nav
                      aria-label="Pagination"
                      className="inline-flex items-center rounded-xl border border-brand-gray-150 overflow-hidden h-10 sm:h-14"
                    >
                      <button
                        onClick={goPrev}
                        disabled={currentPage === 1 || isFetching}
                        className="inline-flex items-center justify-center text-brand-zinc-400 disabled:opacity-60 h-10 sm:h-14 px-3 sm:px-5"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>

                      <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />

                      <div className="flex items-stretch">
                        {pagesToShow.map((p, idx) => {
                          const isEllipsis = p === "ellipsis";
                          const isActive =
                            typeof p === "number" && p === currentPage;

                          return (
                            <div
                              key={`${p}-${idx}`}
                              className="flex items-stretch"
                            >
                              <button
                                disabled={isEllipsis || isFetching}
                                onClick={() =>
                                  typeof p === "number" ? goPage(p) : undefined
                                }
                                className={[
                                  "inline-flex items-center justify-center",
                                  "h-10 sm:h-14",
                                  "min-w-[44px] sm:min-w-[64px]",
                                  "px-3 sm:px-6",
                                  "text-[14px] sm:text-[18px] font-medium",
                                  isActive
                                    ? "bg-brand-orange-50 text-brand-orange-500"
                                    : "text-brand-ink-900",
                                  isEllipsis
                                    ? "cursor-default"
                                    : "hover:bg-brand-gray-25",
                                ].join(" ")}
                              >
                                {isEllipsis ? "..." : p}
                              </button>
                              {idx !== pagesToShow.length - 1 && (
                                <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="w-px bg-brand-gray-175 h-10 sm:h-14" />

                      <button
                        onClick={goNext}
                        disabled={currentPage === pageCount || isFetching}
                        className="inline-flex items-center justify-center text-brand-ink-900 disabled:opacity-60 h-10 sm:h-14 px-3 sm:px-5"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </nav>
                  </div>
                )}

                {activeOrder && (
                  <div className="mt-6 rounded-xl border border-brand-blue-200 bg-brand-blue-50 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-brand-gray-400">
                      Selected order
                    </div>
                    <div className="mt-2 text-sm font-semibold text-brand-ink-900">
                      {activeOrderTitle}
                    </div>
                    <div className="mt-1 text-xs text-brand-gray-600">
                      {customerName || "—"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(activeOrder)}
        onOpenChange={(open) => {
          if (!open) setActiveOrderId(null);
        }}
      >
        <DialogContent className="max-w-[340px] md:max-w-[680px] rounded-2xl border border-brand-orange-200 p-0 bg-white font-inter max-h-[85vh] overflow-y-auto md:max-h-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {activeOrder ? (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-brand-orange-100 bg-brand-orange-50">
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="text-lg font-semibold text-brand-ink-900">
                    Order #{activeOrder.orderNumber}
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="px-6 py-5 space-y-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-brand-gray-500">Status</div>
                    <div className="text-sm font-semibold text-brand-ink-900">
                      {activeOrder.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-brand-gray-500">Placed</div>
                    <div className="text-sm font-semibold text-brand-ink-900">
                      {format(parseISO(activeOrder.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-200 bg-brand-blue-50 px-4 py-3">
                  <div className="text-xs text-brand-gray-500">
                    Delivery address
                  </div>
                  <div className="text-sm font-semibold text-brand-ink-900">
                    {activeOrder.shippingAddress?.street || "—"}
                  </div>
                  <div className="text-xs text-brand-gray-600">
                    {activeOrder.shippingAddress?.city || "—"},{" "}
                    {activeOrder.shippingAddress?.zipCode || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-brand-gray-500">Items</div>
                  <div className="mt-2 space-y-2">
                    {activeOrder.items.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="rounded-xl border border-brand-emerald-200 bg-brand-emerald-50/30 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-brand-ink-900">
                              {item.name}
                            </div>
                            <div className="text-xs text-brand-gray-600 mt-1">
                              {formatDateRange(item.startDate, item.endDate)}
                            </div>
                            <div className="text-xs text-brand-gray-500 mt-1">
                              Occasion: {item.hireOccasion}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-brand-ink-900">
                              £{item.price}
                            </div>
                            <div className="text-xs text-brand-gray-500">
                              Qty {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-brand-gray-150 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-brand-gray-600">
                    <span>Subtotal</span>
                    <span className="text-brand-ink-900 font-semibold">
                      £{activeOrder.subtotalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-brand-gray-600">
                    <span>Delivery</span>
                    <span className="text-brand-ink-900 font-semibold">
                      £{activeOrder.deliveryFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-brand-gray-600">
                    <span>Overnight fee</span>
                    <span className="text-brand-ink-900 font-semibold">
                      £{activeOrder.overnightFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-brand-gray-600">
                    <span>Discount</span>
                    <span className="text-brand-ink-900 font-semibold">
                      £{activeOrder.discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-brand-gray-200 pt-3 flex items-center justify-between">
                    <span className="text-brand-ink-900 font-semibold">
                      Total
                    </span>
                    <span className="text-brand-ink-900 font-semibold text-[18px]">
                      £{activeOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 text-xs text-brand-gray-500">
                    Payment:{" "}
                    {activeOrder.paymentMethod
                      ? activeOrder.paymentMethod.replaceAll("_", " ")
                      : "—"}
                  </div>
                  <div className="text-xs text-brand-gray-500">
                    Estimated delivery:{" "}
                    {activeOrder.estimatedDeliveryDate
                      ? format(
                          parseISO(activeOrder.estimatedDeliveryDate),
                          "MMM d, yyyy • h:mm a",
                        )
                      : "—"}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
