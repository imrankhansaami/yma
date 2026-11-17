import api from "@/api/api";

/**
 * Download an order's invoice PDF.
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
