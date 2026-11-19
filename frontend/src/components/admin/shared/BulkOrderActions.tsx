"use client";

import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { useAdminToast } from "@/components/ui/admin-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orderServices } from "@/services/order.service";
import { Loader2, Printer, X } from "lucide-react";
import { useState } from "react";

/** The same statuses the single-order editor offers. */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * The bar that appears above a table once rows are ticked: print every selected
 * invoice in one document, or move every selected order to the same status.
 *
 * A status change sends exactly what a single change would (confirming sends the
 * invoice, cancelling sends the cancellation email), so the loop below just
 * calls the existing per-order endpoint.
 */
export function BulkOrderActions({
  selectedIds,
  onClear,
  onDone,
}: {
  selectedIds: string[];
  onClear: () => void;
  onDone?: () => void;
}) {
  const { notify } = useAdminToast();
  const [printing, setPrinting] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState("");

  if (!selectedIds.length) return null;

  const printInvoices = async () => {
    setPrinting(true);
    try {
      // Fetched through the authenticated client (rather than opening the URL)
      // so the token refresh still applies, then handed to a new tab.
      const res = await api.get("/orders/admin/invoices/print", {
        params: { ids: selectedIds.join(",") },
        responseType: "text",
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "text/html" }),
      );
      window.open(url, "_blank", "noopener");
      // Keep the blob alive long enough for the tab to load it.
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      notify({
        title: `${selectedIds.length} invoice${selectedIds.length === 1 ? "" : "s"} ready`,
        message: "Print them in the new tab, or choose “Save as PDF”.",
        variant: "success",
      });
    } catch (error: any) {
      notify({
        title: "Could not prepare the invoices",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        variant: "error",
      });
    } finally {
      setPrinting(false);
    }
  };

  const applyStatus = async (next: string) => {
    setStatus(next);
    setApplying(true);
    let done = 0;
    try {
      for (const id of selectedIds) {
        setProgress(`${done + 1} of ${selectedIds.length}`);
        await orderServices.updateOrderStatus(id, next);
        done += 1;
      }
      notify({
        title: `Status changed to ${next}`,
        message: `${done} order${done === 1 ? "" : "s"} updated.`,
        variant: "success",
      });
    } catch (error: any) {
      notify({
        title: "Some orders were not updated",
        message: `${done} of ${selectedIds.length} succeeded. ${
          error?.response?.data?.message || error?.message || ""
        }`.trim(),
        variant: "error",
      });
    } finally {
      setApplying(false);
      setProgress("");
      setStatus("");
      onDone?.();
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-orange-200 bg-brand-orange-50 px-4 py-3 sm:gap-3">
      <span className="text-sm font-semibold text-brand-ink-900">
        {selectedIds.length} selected
      </span>

      <Button
        type="button"
        variant="outline"
        onClick={printInvoices}
        disabled={printing || applying}
        className="h-9 rounded-[6px] border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-800"
      >
        {printing ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="mr-1 h-4 w-4" />
        )}
        Print invoices
      </Button>

      <div className="flex items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => void applyStatus(value)}
          disabled={applying || printing}
        >
          <SelectTrigger className="h-9 w-[190px] rounded-[6px] border-slate-300 bg-white text-[13px]">
            <SelectValue
              placeholder={
                applying ? `Updating ${progress}…` : "Change status to…"
              }
            />
          </SelectTrigger>
          <SelectContent align="start">
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {applying ? (
          <span className="text-[12px] text-slate-600">{progress}</span>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onClear}
        disabled={applying || printing}
        className="ml-auto h-9 px-3 text-[13px] text-slate-600"
      >
        <X className="mr-1 h-4 w-4" />
        Clear
      </Button>
    </div>
  );
}
