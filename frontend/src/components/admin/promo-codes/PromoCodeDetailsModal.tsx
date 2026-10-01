"use client";

import api from "@/api/api";
import { TableFooter } from "@/components/admin/shared/TableFooter";
import { useAdminToast } from "@/components/ui/admin-toast";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PromoStatus, type PromoCodeRow } from "@/types/promo";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type PromoCodeDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo: PromoCodeRow;
};

type PromoOrderRow = {
  id: string;
  orderNumber: string;
  productName: string;
  customerName: string;
  amount: string;
  createdAt: string;
  image?: string;
  productCount?: number;
};

const formatCurrency = (value?: number) => {
  const safeValue = Number.isFinite(value) ? (value as number) : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const formatDateRange = (from?: string, to?: string) => {
  if (!from && !to) return "—";
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const fromLabel = from ? fmt.format(new Date(from)) : "—";
  const toLabel = to ? fmt.format(new Date(to)) : "—";
  return `${fromLabel} - ${toLabel}`;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const formatUsageLimit = (limit?: number) => {
  const safeValue = Number.isFinite(limit) ? limit : 0;
  if (safeValue === 0) return "No limit";
  return `${safeValue} time${safeValue === 1 ? "" : "s"}`;
};

const formatDiscountLabel = (type?: string, percentage?: number) => {
  if (!type) return "—";
  if (type === "percentage") {
    const safeValue = Number.isFinite(percentage) ? percentage : 0;
    return `${safeValue}% off`;
  }
  return "Flat discount";
};

const toStatus = (status?: string): PromoStatus => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return PromoStatus.ACTIVE;
  if (normalized === "inactive") return PromoStatus.INACTIVE;
  if (normalized === "expired") return PromoStatus.EXPIRED;
  return PromoStatus.ACTIVE;
};

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const statusStyles: Record<
  PromoStatus,
  { text: string; dot: string; border: string }
> = {
  [PromoStatus.ACTIVE]: {
    text: "text-brand-green-560",
    dot: "bg-brand-green-560",
    border: "border-brand-gray-230",
  },
  [PromoStatus.INACTIVE]: {
    text: "text-brand-amber-550",
    dot: "bg-brand-amber-550",
    border: "border-brand-gray-230",
  },
  [PromoStatus.EXPIRED]: {
    text: "text-brand-gray-350",
    dot: "bg-brand-gray-310",
    border: "border-brand-gray-230",
  },
};

export function PromoCodeDetailsModal({
  open,
  onOpenChange,
  promo,
}: PromoCodeDetailsModalProps) {
  const [details, setDetails] = useState<PromoCodeRow>(promo);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<PromoOrderRow[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const { notify } = useAdminToast();

  useEffect(() => {
    setDetails(promo);
  }, [promo]);

  useEffect(() => {
    if (!open || !promo?.id) return;
    let isMounted = true;

    const loadDetails = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/promos/${promo.id}`);
        const apiPromo = res?.data?.data ?? res?.data ?? {};
        if (!isMounted) return;
        setDetails({
          ...promo,
          code: String(apiPromo.promoName ?? promo.code ?? ""),
          status: toStatus(apiPromo.status ?? promo.status),
          totalUsage: apiPromo.totalUsage ?? apiPromo.usage ?? promo.totalUsage,
          totalUsageLimit:
            apiPromo.totalUsageLimit ?? promo.totalUsageLimit ?? 0,
          totalDiscount: apiPromo.totalDiscount ?? promo.totalDiscount ?? 0,
          avgDiscountPerOrder:
            apiPromo.avgDiscountPerOrder ?? promo.avgDiscountPerOrder ?? 0,
          totalRevenue: apiPromo.totalRevenue ?? promo.totalRevenue ?? 0,
          discountType: apiPromo.discountType ?? promo.discountType ?? "",
          discountPercentage:
            apiPromo.discountPercentage ?? promo.discountPercentage ?? 0,
          maxDiscountValue:
            apiPromo.maxDiscountValue ?? promo.maxDiscountValue ?? 0,
          minimumOrderValue:
            apiPromo.minimumOrderValue ?? promo.minimumOrderValue ?? 0,
          usageLimitPerCustomer:
            apiPromo.usageLimitPerCustomer ?? promo.usageLimitPerCustomer ?? 0,
          validityPeriod: apiPromo.validityPeriod ?? promo.validityPeriod,
          createdOn: apiPromo.createdOn ?? promo.createdOn,
          createdAt: apiPromo.createdAt ?? promo.createdAt,
        });
      } catch {
        notify({
          title: "Unable to load promo details",
          message: "Please try again.",
          variant: "error",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDetails();
    return () => {
      isMounted = false;
    };
  }, [open, promo, notify]);

  useEffect(() => {
    if (!open || !promo?.id) return;
    let isMounted = true;

    const loadOrders = async () => {
      setIsOrdersLoading(true);
      try {
        const res = await api.get(`/promos/${promo.id}/orders`);
        const data = res?.data ?? {};
        const apiOrders = Array.isArray(data?.data) ? data.data : [];
        const mapped: PromoOrderRow[] = apiOrders.map((order: any) => {
          const items = order?.items ?? [];
          const productCount = items.length;
          const primaryItem = items[0];
          return {
            id: String(order?._id ?? order?.orderNumber ?? ""),
            orderNumber: String(order?.orderNumber ?? "—"),
            productName: String(primaryItem?.product?.name ?? "—"),
            customerName: String(order?.customer?.name ?? "Unknown Customer"),
            amount: formatCurrency(order?.totalAmount),
            createdAt: formatDate(order?.createdAt),
            image: primaryItem?.product?.image,
            productCount: productCount,
          };
        });
        if (!isMounted) return;
        setOrders(mapped);
        setOrdersPage(Number(data?.pagination?.page ?? 1));
        setOrdersTotalPages(Number(data?.pagination?.totalPages ?? 1));
        setOrdersTotal(Number(data?.pagination?.total ?? mapped.length));
        setOrdersPerPage(Number(data?.pagination?.limit ?? 10));
      } catch {
        notify({
          title: "Unable to load promo orders",
          message: "Please try again.",
          variant: "error",
        });
      } finally {
        if (isMounted) setIsOrdersLoading(false);
      }
    };

    void loadOrders();
    return () => {
      isMounted = false;
    };
  }, [open, promo, notify]);

  const detailPromo = details ?? promo;
  const styles = statusStyles[detailPromo.status];
  const statusLabel =
    detailPromo.status === PromoStatus.ACTIVE
      ? "Active"
      : detailPromo.status === PromoStatus.INACTIVE
        ? "Inactive"
        : "Expired";
  const rowsPerPage = ordersPerPage;
  const currentPage = ordersPage;
  const totalPages = ordersTotalPages;
  const totalUsage = detailPromo.totalUsage ?? 0;
  const totalUsageLimit = detailPromo.totalUsageLimit ?? 0;
  const createdOn = detailPromo.createdOn ?? detailPromo.createdAt;
  const detailItems = [
    {
      label: "Discount Type",
      value: formatDiscountLabel(
        detailPromo.discountType,
        detailPromo.discountPercentage,
      ),
    },
    {
      label: "Maximum Discount",
      value: formatCurrency(detailPromo.maxDiscountValue),
    },
    {
      label: "Minimum Order Value",
      value: formatCurrency(detailPromo.minimumOrderValue),
    },
    {
      label: "Usage Limit Per Customer",
      value: formatUsageLimit(detailPromo.usageLimitPerCustomer),
    },
    {
      label: "Validity Period",
      value: formatDateRange(
        detailPromo.validityPeriod?.from,
        detailPromo.validityPeriod?.to,
      ),
    },
    { label: "Created On", value: formatDate(createdOn) },
  ];
  const metrics = [
    { label: "Total Usage", value: `${totalUsage}/${totalUsageLimit}` },
    {
      label: "Total Discount",
      value: formatCurrency(detailPromo.totalDiscount),
    },
    {
      label: "Avg. Discount Per Order",
      value: formatCurrency(detailPromo.avgDiscountPerOrder),
    },
    { label: "Total Revenue", value: formatCurrency(detailPromo.totalRevenue) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[70vw] max-w-[70vw] sm:w-[70vw] sm:max-w-[70vw] max-h-[90vh] font-inter p-0 gap-0 border border-slate-200 rounded-2xl flex flex-col"
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-brand-gray-80 px-5 py-4 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-lg font-semibold tracking-tight text-brand-black-950">
                  {detailPromo.code}
                </DialogTitle>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] font-semibold shadow-[0px_1px_2px_var(--alpha-ink-900-5)]",
                    styles.text,
                    styles.border,
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
                  />
                  {statusLabel}
                </span>
              </div>
              <p className="mt-1 text-sm text-brand-zinc-600">
                Promo code analytics and usage details
              </p>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-brand-black-950 hover:bg-white hover:shadow-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-300"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-5 max-h-[75vh] overflow-y-auto pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-3">
            <p className="text-base font-semibold text-brand-slate-800">
              Key Metrics
            </p>
            <div className="grid grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <Card
                      key={`metric-skeleton-${index}`}
                      className="rounded-[16px] border border-brand-gray-235 bg-white px-6 py-5 shadow-[0px_1px_3px_var(--alpha-black-6)]"
                    >
                      <div className="space-y-3">
                        <div className="h-4 w-28 rounded bg-slate-100 animate-pulse" />
                        <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />
                      </div>
                    </Card>
                  ))
                : metrics.map((metric) => (
                    <Card
                      key={metric.label}
                      className="rounded-[16px] border border-brand-gray-235 bg-white px-6 py-5 shadow-[0px_1px_3px_var(--alpha-black-6)]"
                    >
                      <p className="text-[15px] font-medium text-brand-slate-800">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-[28px] font-semibold text-black">
                        {metric.value}
                      </p>
                    </Card>
                  ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-brand-slate-800">
              Promo Code Details
            </p>
            <Card className="rounded-[16px] border border-brand-gray-245 bg-brand-gray-50 px-6 py-6 shadow-none">
              <div className="grid grid-cols-2 gap-y-7 text-sm text-brand-black-950">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`detail-skeleton-${index}`}
                        className="flex flex-col gap-2"
                      >
                        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
                        <div className="h-5 w-40 rounded bg-slate-100 animate-pulse" />
                      </div>
                    ))
                  : detailItems.map((item) => (
                      <div key={item.label} className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-brand-gray-540">
                          {item.label}
                        </span>
                        <span className=" text-black">{item.value}</span>
                      </div>
                    ))}
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <p className="text-base font-semibold text-brand-slate-800">
              Orders Using This Promo Code ({ordersTotal})
            </p>
            <Card className="rounded-[16px] border border-brand-gray-245 bg-white px-0 py-0 shadow-none pb-6">
              <div className="overflow-hidden rounded-[16px]">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b border-brand-gray-175">
                      <TableHead className="w-[10%] px-5 py-3 text-[13px] font-medium text-brand-gray-650">
                        Order ID
                      </TableHead>
                      <TableHead className="w-[32%] px-5 py-3 text-[13px] font-medium text-brand-gray-650">
                        Orders
                      </TableHead>
                      <TableHead className="w-[18%] px-5 py-3 text-[13px] font-medium text-brand-gray-650">
                        Customer Name
                      </TableHead>
                      <TableHead className="w-[14%] px-5 py-3 text-[13px] font-medium text-brand-gray-650">
                        Amount
                      </TableHead>
                      <TableHead className="w-[16%] px-5 py-3 text-[13px] font-medium text-brand-gray-650">
                        Created at
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-brand-gray-175">
                    {isOrdersLoading ? (
                      Array.from({ length: Math.min(rowsPerPage, 6) }).map(
                        (_, index) => (
                          <TableRow
                            key={`orders-skeleton-${index}`}
                            className="border-brand-gray-175"
                          >
                            {Array.from({ length: 5 }).map((__, cellIndex) => (
                              <TableCell
                                key={`orders-skeleton-cell-${cellIndex}`}
                                className="px-5 py-4"
                              >
                                <div className="h-4 w-full max-w-[200px] rounded bg-slate-100 animate-pulse" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ),
                      )
                    ) : orders.length === 0 ? (
                      <TableRow className="border-brand-gray-175">
                        <TableCell
                          colSpan={5}
                          className="px-5 py-6 text-center text-[13px] text-brand-zinc-400"
                        >
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((row) => (
                        <TableRow
                          key={row.id}
                          className="border-brand-gray-175"
                        >
                          <TableCell className="px-5 py-4 text-[13px] text-brand-black-950">
                            {row.orderNumber}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-8 w-8 overflow-hidden rounded border border-brand-gray-175 bg-slate-100">
                                <Image
                                  src={row.image || "/avatar.png"}
                                  alt={row.productName}
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="truncate text-[13px] text-brand-black-950 max-w-[180px]">
                                  {row.productName}
                                </p>
                                {row.productCount && row.productCount > 1 && (
                                  <span className="inline-flex items-center justify-center rounded-md border border-brand-gray-200 bg-transparent px-2.5 py-1 text-[11px] font-medium text-brand-black-950">
                                    +{row.productCount - 1}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-[13px] text-brand-black-950">
                            {row.customerName}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-[13px] text-brand-black-950">
                            {row.amount}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-[13px] text-brand-black-950">
                            {row.createdAt}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <TableFooter
                totalResults={ordersTotal}
                showingCount={orders.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                onRowsPerPageChange={() => {}}
                currentPage={currentPage}
                totalPages={totalPages}
                variant="compact"
              />
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
