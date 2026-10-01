"use client";

import api from "@/api/api";
import { PromoCodeDetailsModal } from "@/components/admin/promo-codes/PromoCodeDetailsModal";
import { TableFooter } from "@/components/admin/shared/TableFooter";
import { useAdminToast } from "@/components/ui/admin-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { Switch } from "@/components/ui/switch";
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
import { Eye, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

type PromoCodesTableProps = {
  refreshKey?: number;
};

export function PromoCodesTable({ refreshKey = 0 }: PromoCodesTableProps) {
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCodeRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PromoCodeRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useAdminToast();

  useEffect(() => {
    let isMounted = true;

    const formatDateRange = (from?: string, to?: string) => {
      if (!from || !to) return "—";
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${formatter.format(new Date(from))} - ${formatter.format(
        new Date(to)
      )}`;
    };

    const toStatus = (status?: string): PromoStatus => {
      const normalized = String(status || "").toLowerCase();
      if (normalized === "active") return PromoStatus.ACTIVE;
      if (normalized === "inactive") return PromoStatus.INACTIVE;
      if (normalized === "expired") return PromoStatus.EXPIRED;
      return PromoStatus.ACTIVE;
    };

    const loadPromos = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
        }
        const res = await api.get("/promos");
        const apiData = Array.isArray(res?.data?.data) ? res.data.data : [];
        const mapped: PromoCodeRow[] = apiData.map((promo: any) => ({
          id: String(promo._id ?? promo.id ?? promo.promoName),
          code: String(promo.promoName ?? ""),
          discount: `${promo.discountPercentage ?? 0}% off`,
          minOrder: `$${promo.minimumOrderValue ?? 0}`,
          maxDiscount: `$${promo.maxDiscountValue ?? 0}`,
          usage: `${promo.usage ?? 0}/${promo.totalUsageLimit ?? 0}`,
          validity: formatDateRange(
            promo?.validityPeriod?.from,
            promo?.validityPeriod?.to
          ),
          status: toStatus(promo.status),
          totalUsage: promo.totalUsage ?? promo.usage ?? 0,
          totalUsageLimit: promo.totalUsageLimit ?? 0,
          totalDiscount: promo.totalDiscount ?? 0,
          avgDiscountPerOrder: promo.avgDiscountPerOrder ?? 0,
          totalRevenue: promo.totalRevenue ?? 0,
          discountType: promo.discountType ?? "",
          discountPercentage: promo.discountPercentage ?? 0,
          maxDiscountValue: promo.maxDiscountValue ?? 0,
          minimumOrderValue: promo.minimumOrderValue ?? 0,
          usageLimitPerCustomer: promo.usageLimitPerCustomer ?? 0,
          validityPeriod: promo.validityPeriod,
          createdOn: promo.createdOn,
          createdAt: promo.createdAt,
        }));

        if (isMounted) {
          setPromoCodes(mapped);
        }
      } catch {
        // Keep existing placeholder data on failure.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadPromos();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const totalResults = promoCodes.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / rowsPerPage));
  const pagedPromos = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return promoCodes.slice(start, start + rowsPerPage);
  }, [currentPage, promoCodes, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleOpenDetails = (promo: PromoCodeRow) => {
    setSelectedPromo(promo);
    setDetailsOpen(true);
  };

  const handleToggleStatus = async (promo: PromoCodeRow) => {
    if (promo.status === PromoStatus.EXPIRED) return;
    const nextStatus =
      promo.status === PromoStatus.ACTIVE
        ? PromoStatus.INACTIVE
        : PromoStatus.ACTIVE;

    setPromoCodes((prev) =>
      prev.map((item) =>
        item.id === promo.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await api.put(`/promos/${promo.id}`, { status: nextStatus });
      notify({
        title: "Promo updated",
        message: `Status set to ${nextStatus}.`,
      });
    } catch (error: any) {
      setPromoCodes((prev) =>
        prev.map((item) =>
          item.id === promo.id ? { ...item, status: promo.status } : item
        )
      );
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to update promo status";
      notify({ title: "Update failed", message, variant: "error" });
    }
  };

  const handleDeletePromo = async (promo: PromoCodeRow) => {
    const prevPromos = promoCodes;
    setPromoCodes((items) => items.filter((item) => item.id !== promo.id));
    setIsDeleting(true);

    try {
      await api.delete(`/promos/${promo.id}`);
      notify({
        title: "Promo deleted",
        message: "Promo code removed successfully.",
      });
      setDeleteOpen(false);
      setPendingDelete(null);
    } catch (error: any) {
      setPromoCodes(prevPromos);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to delete promo code";
      notify({ title: "Delete failed", message, variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (promo: PromoCodeRow) => {
    setPendingDelete(promo);
    setDeleteOpen(true);
  };

  return (
    <Card className="rounded-2xl border border-brand-gray-150 shadow-[0px_1px_2px_var(--alpha-ink-900-5)]">
      <div className="overflow-hidden rounded-2xl -mt-4">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-brand-gray-150">
              <TableHead className="w-[15%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600">
                Promo Code
              </TableHead>
              <TableHead className="w-[15%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600">
                Discount
              </TableHead>
              <TableHead className="w-[10%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600">
                Usage
              </TableHead>
              <TableHead className="w-[21%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600">
                Validity Period
              </TableHead>
              <TableHead className="w-[12%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600">
                Status
              </TableHead>
              <TableHead className="w-[10%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600">
                {/* Toggle */}
              </TableHead>
              <TableHead className="w-[9%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600 text-center">
                View
              </TableHead>
              <TableHead className="w-[8%] px-5 py-3 text-[12px] font-semibold text-brand-zinc-600 text-center">
                Delete
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-brand-gray-150">
            {isLoading ? (
              Array.from({ length: Math.min(rowsPerPage, 6) }).map(
                (_, index) => (
                  <TableRow
                    key={`promo-skeleton-${index}`}
                    className="border-brand-gray-150"
                  >
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <TableCell
                        key={`promo-skeleton-cell-${cellIndex}`}
                        className="px-5 py-3"
                      >
                        <div className="h-4 w-full max-w-[160px] rounded bg-slate-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : promoCodes.length === 0 ? (
              <TableRow className="border-brand-gray-150">
                <TableCell
                  colSpan={8}
                  className="px-5 py-6 text-center text-[13px] text-brand-zinc-400"
                >
                  No promo codes found.
                </TableCell>
              </TableRow>
            ) : (
              pagedPromos.map((promo) => {
              const styles = statusStyles[promo.status];
              return (
                <TableRow
                  key={promo.id}
                  className="border-brand-gray-150 hover:bg-brand-gray-25"
                >
                  <TableCell className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-medium text-brand-black-950">
                        {promo.code}
                      </span>
                      <span className="text-[12px] text-brand-zinc-400 leading-[18px]">
                        Min. order: {promo.minOrder}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px] font-medium text-brand-black-950">
                        {promo.discount}
                      </span>
                      <div className="text-[12px] text-brand-zinc-400 leading-[18px]">
                        <div>Max: {promo.maxDiscount}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-5 py-3 text-[13px] font-medium text-brand-black-950">
                    {promo.usage}
                  </TableCell>

                  <TableCell className="px-5 py-3 text-[13px] text-brand-black-950">
                    {promo.validity}
                  </TableCell>

                  <TableCell className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] font-semibold shadow-[0px_1px_2px_var(--alpha-ink-900-5)]",
                        styles.text,
                        styles.border
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
                      />
                      {promo.status === PromoStatus.ACTIVE
                        ? "Active"
                        : promo.status === PromoStatus.INACTIVE
                        ? "Inactive"
                        : "Expired"}
                    </span>
                  </TableCell>

                  <TableCell className="px-5 py-3">
                    <Switch
                      checked={promo.status === PromoStatus.ACTIVE}
                      disabled={promo.status === PromoStatus.EXPIRED}
                      onCheckedChange={() => handleToggleStatus(promo)}
                      className="data-[state=checked]:bg-brand-orange-500 data-[state=checked]:border-brand-orange-500"
                    />
                  </TableCell>

                  <TableCell className="px-5 py-3 text-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg border-brand-gray-150 bg-white text-brand-zinc-600 shadow-none"
                      onClick={() => handleOpenDetails(promo)}
                    >
                      <Eye className="h-[18px] w-[18px]" />
                    </Button>
                  </TableCell>

                  <TableCell className="px-5 py-3 text-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg border-brand-gray-150 bg-white text-brand-zinc-600 shadow-none"
                      onClick={() => openDeleteModal(promo)}
                    >
                      <Trash2 className="h-[18px] w-[18px]" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
      </div>

      <TableFooter
        totalResults={totalResults}
        showingCount={pagedPromos.length}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        variant="compact"
      />
      {selectedPromo ? (
        <PromoCodeDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          promo={selectedPromo}
        />
      ) : null}

      <ConfirmDeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Promo Code"
        itemLabel={pendingDelete?.code || "this promo code"}
        confirmLabel="Delete Promo"
        isLoading={isDeleting}
        onConfirm={() =>
          pendingDelete ? handleDeletePromo(pendingDelete) : null
        }
      />
    </Card>
  );
}
