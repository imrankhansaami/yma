"use client";

import { Button } from "@/components/ui/button";
import { useAdminToast } from "@/components/ui/admin-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isIOSDevice } from "@/lib/downloadInvoice";
import { orderServices } from "@/services/order.service";
import { Download, Loader2, Printer, X } from "lucide-react";
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
 * invoice in one document, download them as one PDF, or move every selected
 * order to the same status.
 *
 * The invoice actions open short-lived direct links rather than fetching a blob
 * and opening a pop-up — iPhone browsers block the latter ("Pop-ups blocked",
 * then blob: unreachable). The window is opened synchronously in the tap so it
 * counts as the user's gesture; on desktop the PDF downloads in place instead.
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
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState("");

  if (!selectedIds.length) return null;

  const openInvoices = async (kind: "print" | "pdf") => {
    // Opened synchronously so it counts as part of the tap; an async
    // window.open is exactly what the pop-up blocker stops.
    const targetWindow = window.open("", "_blank");
    setBusy(kind);
    try {
      const { printUrl, pdfUrl } = await orderServices.getInvoiceLinks(
        selectedIds,
      );
      const ios = isIOSDevice();
      // iOS Safari ignores window.print() from a web page, so the printable
      // HTML page is a dead end there. On iPhone both buttons open the PDF —
      // printing happens through the PDF viewer's Share → Print.
      const url = kind === "print" && !ios ? printUrl : pdfUrl;
      const count = selectedIds.length;
      const noun = `invoice${count === 1 ? "" : "s"}`;

      if (kind === "pdf" && !ios) {
        // Desktop PDF: download in place, don't leave a blank tab behind.
        targetWindow?.close();
        const link = document.createElement("a");
        link.href = url;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (targetWindow) {
        targetWindow.location.href = url;
      } else {
        window.location.assign(url);
      }

      notify({
        title:
          kind === "print" && !ios
            ? `${count} ${noun} ready to print`
            : `${count} ${noun} — PDF opened`,
        message: ios
          ? "To print: tap Share, then Print. Or Save to Files to keep a copy."
          : kind === "print"
            ? "Use Print there, or choose “Save as PDF”."
            : "One PDF containing every selected invoice.",
        variant: "success",
      });
    } catch (error: any) {
      targetWindow?.close();
      notify({
        title: "Could not open the invoices",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(null);
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
        onClick={() => void openInvoices("print")}
        disabled={busy !== null || applying}
        className="h-9 rounded-[6px] border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-800"
      >
        {busy === "print" ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Printer className="mr-1 h-4 w-4" />
        )}
        Print invoices
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => void openInvoices("pdf")}
        disabled={busy !== null || applying}
        className="h-9 rounded-[6px] border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-800"
      >
        {busy === "pdf" ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-1 h-4 w-4" />
        )}
        Download PDF
      </Button>

      <div className="flex items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => void applyStatus(value)}
          disabled={applying || busy !== null}
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
        disabled={applying || busy !== null}
        className="ml-auto h-9 px-3 text-[13px] text-slate-600"
      >
        <X className="mr-1 h-4 w-4" />
        Clear
      </Button>
    </div>
  );
}
