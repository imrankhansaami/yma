import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { CustomerHistoryModal } from "@/components/admin/customers/CustomerHistoryModal";
import { TableFooter } from "@/components/admin/shared/TableFooter";
import { fetchCustomers, type CustomerRow } from "@/services/customer.service";
import type { DateRange } from "react-day-picker";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

type CustomerTableProps = {
  searchQuery?: string;
  dateRange?: DateRange;
};

type CustomerRowDisplay = {
  id: string;
  name: string;
  phone: string;
  orderId: string;
  orderLookupId?: string;
  orderDbId?: string;
  orderName: string;
  orderImage?: string;
  extraCount: number;
  amount: string;
  lastOrder: string;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM d, yyyy");
};

const formatMoney = (value?: number) => {
  if (!value && value !== 0) return "—";
  return `£${value.toFixed(2)}`;
};

const getPrimaryOrder = (customer: CustomerRow) =>
  Array.isArray(customer.orders) && customer.orders.length > 0
    ? customer.orders[0]
    : undefined;

export default function CustomerTable({
  searchQuery = "",
  dateRange,
}: CustomerTableProps) {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRowDisplay | null>(null);

  const fromDate = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : null;
  const toDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, fromDate, toDate, rowsPerPage]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-customers",
      currentPage,
      rowsPerPage,
      searchQuery,
      fromDate,
      toDate,
    ],
    queryFn: () =>
      fetchCustomers({
        page: currentPage,
        limit: rowsPerPage,
        search: searchQuery || null,
        fromDate,
        toDate,
      }),
    placeholderData: keepPreviousData,
  });

  const customers = useMemo(() => {
    const items = data?.data ?? [];
    return items.map<CustomerRowDisplay>((customer) => {
      const primaryOrder = getPrimaryOrder(customer);
      const primaryItem = primaryOrder?.items?.[0];
      const extraCount = Math.max(0, (primaryOrder?.items?.length || 0) - 1);
      const orderDbId = primaryOrder?._id || customer.customerId;
      const orderNumber = primaryOrder?.orderNumber;
      const orderLookupId = orderNumber || orderDbId;

      return {
        id: customer._id,
        name: customer.name || "—",
        phone: customer.phone || "—",
        orderId: orderNumber || orderDbId || "—",
        orderLookupId: orderLookupId || undefined,
        orderDbId: primaryOrder?._id,
        orderName: primaryItem?.name || "No orders yet",
        orderImage: primaryItem?.imageCover,
        extraCount,
        amount: formatMoney(customer.totalSpent),
        lastOrder: formatDate(customer.lastOrderDate),
      };
    });
  }, [data]);

  const totalResults = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const skeletonRows = Array.from({ length: rowsPerPage });

  return (
    <section className="w-full">
      <Card className="rounded-2xl border border-slate-200 shadow-sm">
        <div className="overflow-hidden rounded-2xl -mt-4">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-[15%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Customer Name
                </TableHead>
                <TableHead className="w-[15%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Phone
                </TableHead>
                <TableHead className="w-[10%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Order ID
                </TableHead>
                <TableHead className="w-[30%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Orders
                </TableHead>
                <TableHead className="w-[10%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Amount
                </TableHead>
                <TableHead className="w-[10%] px-5 py-2 text-[12px] font-medium text-brand-gray-500">
                  Last Order Date
                </TableHead>
                <TableHead className="w-[10%] px-5 py-2 text-right text-[12px] font-medium text-brand-gray-500">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-200">
              {isLoading
                ? skeletonRows.map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="border-slate-200">
                      <TableCell className="px-5 py-3">
                        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="h-4 w-16 rounded bg-slate-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-slate-100 animate-pulse" />
                          <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <div className="ml-auto h-8 w-20 rounded bg-slate-100 animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                : customers.map((row, index) => (
                    <TableRow
                      key={row.id || row.orderId || `${row.name}-${row.phone}-${index}`}
                      className="border-slate-200"
                    >
                      <TableCell className="px-5 py-3 text-[13px] text-slate-900">
                        {row.name}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-900">
                        {row.phone}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-900">
                        {row.orderId}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                            {row.orderImage ? (
                              <Image
                                src={row.orderImage}
                                alt={row.orderName}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <Image
                                src="/avatar.png"
                                alt={row.orderName}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            )}
                          </div>
                          <p className="truncate text-[13px] text-slate-900">
                            {row.orderName}
                          </p>
                          {row.extraCount > 0 && (
                            <span className="inline-flex h-6 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700">
                              +{row.extraCount}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] font-medium text-slate-900">
                        {row.amount}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-700">
                        {row.lastOrder}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-800"
                          onClick={() => setSelectedCustomer(row)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        <TableFooter
          totalResults={totalResults}
          showingCount={customers.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          onRowsPerPageChange={(value) => setRowsPerPage(value)}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          variant="compact"
        />
      </Card>
      <CustomerHistoryModal
        open={Boolean(selectedCustomer)}
        orderId={selectedCustomer?.orderLookupId}
        orderDbId={selectedCustomer?.orderDbId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomer(null);
          }
        }}
      />
    </section>
  );
}
