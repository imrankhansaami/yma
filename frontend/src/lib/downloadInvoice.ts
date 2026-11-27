import api from "@/api/api";

/**
 * Download an order's invoice PDF (customer copy).
 *
 * The backend renders the file (the same one attached to the invoice email),
 * so the admin copy, the customer copy and the emailed copy always agree.
 * Auth rides on the existing axios setup — bearer token or cookie.
 */
export const downloadInvoice = async (
  orderId: string,
  orderNumber?: string | number,
): Promise<void> => {
  const response = await api.get(`/orders/${orderId}/invoice/download`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${orderNumber ?? orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

/** iPhone or iPad — where blob downloads and pop-up tabs raised after an await
 *  are blocked, so invoice links ride a window opened during the tap. */
export const isIOSDevice = (): boolean =>
  typeof navigator !== "undefined" &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/**
 * Admin copy of the single-invoice download: asks the API for a short-lived
 * direct link and follows it — no blob, no pop-up raised after an await, both
 * of which iPhone blocks. On desktop the PDF downloads in place; on iPhone the
 * pre-opened tab shows it so it can be saved, shared or printed.
 */
export const downloadInvoiceAdmin = async (orderId: string): Promise<void> => {
  const targetWindow = window.open("", "_blank");
  try {
    const res = await api.get<{
      status: string;
      data: { printUrl: string; pdfUrl: string };
    }>("/orders/admin/invoices/links", { params: { ids: orderId } });

    const url = res?.data?.data?.pdfUrl;
    if (!url) throw new Error("The invoice link could not be created");

    if (isIOSDevice() || !targetWindow) {
      if (targetWindow) {
        targetWindow.location.href = url;
      } else {
        window.location.assign(url);
      }
    } else {
      // Desktop: download in place, don't leave a blank tab behind.
      targetWindow.close();
      const link = document.createElement("a");
      link.href = url;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (error) {
    targetWindow?.close();
    throw error;
  }
};
