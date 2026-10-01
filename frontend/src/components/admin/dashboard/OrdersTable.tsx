"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import EmptyIcon from "@/assets/icons/empty_icon.svg";
import { OrderDetailsModal } from "@/components/admin/dashboard/OrderDetailsModal";
import { TableFooter } from "@/components/admin/shared/TableFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderServices } from "@/services/order.service";
import { TOrder } from "@/types/order";
import { cn } from "@/lib/utils";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const formatStableDate = (value?: string | Date) => {
  if (!value) return "-";
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const dateOnly = raw.split("T")[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) {
    const fallback = new Date(raw);
    if (Number.isNaN(fallback.getTime())) return "-";
    return fallback.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const localDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return localDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const parseDateCandidate = (value?: string | Date) => {
  if (!value) return null;
  const raw = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(raw.getTime()) ? null : raw;
};

const getReservationDate = (order: TOrder): string | Date | undefined => {
  const orderStartDate = (order as any)?.startDate;
  if (orderStartDate) return orderStartDate;

  const itemStartDates = (Array.isArray(order?.items) ? order.items : [])
    .map((item) => parseDateCandidate(item?.startDate as any))
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());

  return itemStartDates[0]?.toISOString();
};

const getStableDateKey = (value?: string | Date) => {
  if (!value) return "";
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const dateOnly = raw.split("T")[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusStyles: Record<
  OrderStatus,
  { text: string; dot: string; bg: string }
> = {
  pending: {
    text: "text-[#f5a000]",
    dot: "bg-[#f5a000]",
    bg: "bg-[#f5a000]/10",
  },
  confirmed: {
    text: "text-[#08c26b]",
    dot: "bg-[#08c26b]",
    bg: "bg-[#08c26b]/10",
  },
  completed: {
    text: "text-[#3c82ff]",
    dot: "bg-[#3c82ff]",
    bg: "bg-[#3c82ff]/10",
  },
  cancelled: {
    text: "text-[#f04438]",
    dot: "bg-[#f04438]",
    bg: "bg-[#f04438]/10",
  },
};

const OrderTableRowSkeleton = () => (
  <TableRow>
    <TableCell className="px-5 py-3">
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell className="px-5 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-4 w-48" />
      </div>
    </TableCell>
    <TableCell className="px-5 py-3">
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell className="px-5 py-3">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="px-5 py-3">
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell className="px-5 py-3">
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell className="px-5 py-3">
      <Skeleton className="h-6 w-24 rounded-lg" />
    </TableCell>
    <TableCell className="px-5 py-3 text-right">
      <Skeleton className="ml-auto h-8 w-[120px] rounded-lg" />
    </TableCell>
  </TableRow>
);

export function OrdersTable({
  status = "all",
  search = "",
  startDate,
  endDate,
}: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TOrder | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const rowsPerPage = Number(searchParams.get("rows")) || 10;

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams],
  );

  const {
    data: ordersData,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: [
      "orders",
      currentPage,
      rowsPerPage,
      status,
      search,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      try {
        if (search) {
          const searchResult = await orderServices.searchOrders(search);
          return {
            orders: searchResult.orders,
            total: searchResult.total,
            page: 1,
            limit: searchResult.orders.length || 10,
          };
        }
        return await orderServices.getOrders({
          page: currentPage,
          limit: rowsPerPage,
          status,
          startDate,
          endDate,
        });
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const orders = ordersData?.orders || [];
  const total = ordersData?.total || 0;
  const hasDateFilter = !!startDate || !!endDate;

  const filteredOrders = useMemo(() => {
    if (!hasDateFilter) return orders;
    const from = startDate || endDate;
    const to = endDate || startDate;
    if (!from || !to) return orders;

    return orders.filter((order) => {
      const reservationKey = getStableDateKey(getReservationDate(order));
      if (!reservationKey) return false;
      return reservationKey >= from && reservationKey <= to;
    });
  }, [orders, hasDateFilter, startDate, endDate]);

  const totalForDisplay = hasDateFilter ? filteredOrders.length : total;
  const totalPages = Math.max(1, Math.ceil(totalForDisplay / rowsPerPage));

  const handleViewDetails = (order: TOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  return (
    <>
      <section className="w-full">
        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <div className="overflow-hidden rounded-2xl -mt-4">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="w-[9%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Order ID
                  </TableHead>
                  <TableHead className="w-[26%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Orders
                  </TableHead>
                  <TableHead className="w-[17%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Customer Name
                  </TableHead>
                  <TableHead className="w-[11%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Amount
                  </TableHead>
                  <TableHead className="w-[13%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Created at
                  </TableHead>
                  <TableHead className="w-[13%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Reservation Date
                  </TableHead>
                  <TableHead className="w-[11%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                    Order Status
                  </TableHead>
                  <TableHead className="w-[10%] px-5 py-2 text-right text-[12px] font-medium text-brand-gray-500">
                    {/* Action col */}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-200">
                {isLoading || isFetching ? (
                  Array(rowsPerPage || 10)
                    .fill(0)
                    .map((_, i) => <OrderTableRowSkeleton key={i} />)
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      Could not fetch orders. Please try again later.
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(filteredOrders) || filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Image
                          src={EmptyIcon || ""}
                          alt="Empty"
                          width={80}
                          height={80}
                        />
                        <p>No orders found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const orderId = order?._id || order?.id;
                    if (!order || (!orderId && !order.orderNumber)) return null;
                    
                    const styles =
                      order.status && statusStyles[order.status as OrderStatus]
                        ? statusStyles[order.status as OrderStatus]
                        : statusStyles.pending;
                    
                    const orderItems = Array.isArray(order.items)
                      ? order.items
                      : Array.isArray((order as any).products)
                        ? ((order as any).products as typeof order.items)
                        : [];
                    const isUnknownName = (name?: string) =>
                      (name || "").trim().toLowerCase() === "unknown item";
                    const namedItems = orderItems.filter(
                      (item) => !!item?.name && !isUnknownName(item?.name),
                    );
                    const itemWithNameAndImage =
                      namedItems.find((item) => !!item?.imageCover) ??
                      orderItems.find(
                        (item) => !!item?.imageCover && !!item?.name,
                      );
                    const firstItem = itemWithNameAndImage ?? namedItems[0];
                    const extraCount = Math.max(
                      0,
                      (namedItems.length || orderItems.length) - 1,
                    );
                    const productImage =
                      itemWithNameAndImage?.imageCover &&
                      (Array.isArray(itemWithNameAndImage.imageCover)
                        ? itemWithNameAndImage.imageCover[0]
                        : itemWithNameAndImage.imageCover);
                    const displayName = firstItem?.name || "Unknown Item";

                    return (
                      <TableRow key={orderId || order.orderNumber} className="border-slate-200">
                        {/* Order ID */}
                        <TableCell className="px-5 py-3 text-[13px] text-slate-900">
                          {order?.orderNumber}
                        </TableCell>

                        {/* Orders cell */}
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                              {productImage && (
                                <Image
                                  src={
                                    Array.isArray(productImage)
                                      ? productImage[0]
                                      : productImage
                                  }
                                  alt={displayName}
                                  fill
                                  className="object-cover"
                                  sizes="36px"
                                />
                              )}
                            </div>
                            <p className="truncate text-[13px] text-slate-900">
                              {displayName}
                            </p>
                            {extraCount > 0 && (
                              <span className="inline-flex h-6 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700">
                                +{extraCount}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Customer Name */}
                        <TableCell className="truncate px-5 py-3 text-[13px] text-slate-900">
                          {order?.user?.name || 
                           (order?.shippingAddress?.firstName 
                             ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ""}` 
                             : "Guest")}
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="px-5 py-3 text-[13px] font-medium text-slate-900">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(order?.totalAmount || 0)}
                        </TableCell>

                        {/* Created at */}
                        <TableCell className="px-5 py-3 text-[13px] text-slate-700">
                          {formatStableDate(order?.createdAt as any)}
                        </TableCell>

                        {/* Reservation Date */}
                        <TableCell className="px-5 py-3 text-[13px] text-slate-700">
                          {formatStableDate(getReservationDate(order))}
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold capitalize shadow-[0px_1px_2px_rgba(16,24,40,0.05)]",
                              styles?.text,
                              "border-slate-200"
                            )}
                          >
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                styles?.dot
                              )}
                            />
                            {order?.status || "Unknown"}
                          </span>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="px-5 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-800 shadow-sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer: pagination / info */}
          <TableFooter
            totalResults={totalForDisplay}
            showingCount={filteredOrders?.length || 0}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            onRowsPerPageChange={(value) => {
              router.push(
                `${pathname}?${createQueryString({ rows: value, page: 1 })}`,
              );
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              router.push(`${pathname}?${createQueryString({ page: page })}`);
            }}
            variant="compact"
          />
        </Card>
      </section>

      {/* DETAILS MODAL */}
      <OrderDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        order={selectedOrder}
      />
    </>
  );
}
