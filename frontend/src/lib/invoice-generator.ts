import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TOrder } from "@/types/order";
import { format } from "date-fns";

export const generateInvoice = (order: TOrder) => {
  const doc = new jsPDF();

  const brandColor = "#f97316"; // Orange-500 from your theme
  const grayColor = "#64748b"; // Slate-500
  const blackColor = "#0f172a"; // Slate-900

  // --- Header ---
  // Logo (Text fallback for now)
  doc.setFontSize(24);
  doc.setTextColor(brandColor);
  doc.setFont("helvetica", "bold");
  doc.text("YMA", 20, 20); // Replace with Logo if available

  // Invoice Label
  doc.setFontSize(30);
  doc.setTextColor(grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("INVOICE", 140, 20);

  // Company Info (Left)
  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.setFont("helvetica", "normal");
  doc.text("YMA Bouncy Castle- Fun Supplier", 20, 30);
  doc.text("123 Business Street", 20, 35);
  doc.text("City, Country, ZIP", 20, 40);
  doc.text("info@ymabouncycastles.uk", 20, 45);

  // Invoice Details (Right)
  doc.setFontSize(10);
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const deliveryDate = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate)
    : null;
  doc.text(`Invoice #: ${order.orderNumber || "—"}`, 140, 30);
  doc.text(
    `Date: ${createdAt ? format(createdAt, "MMM dd, yyyy") : "—"}`,
    140,
    35,
  );
  doc.text(
    `Due Date: ${deliveryDate ? format(deliveryDate, "MMM dd, yyyy") : "—"}`,
    140,
    40,
  );
  doc.text(`Status: ${(order.status || "pending").toUpperCase()}`, 140, 45);

  // --- Divider ---
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, 55, 190, 55);

  // --- Bill To / Ship To ---
  const startY = 65;

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(order.user?.name || order.shippingAddress?.firstName || "Guest", 20, startY + 6);
  doc.text(order.user?.email || order.shippingAddress?.email || "", 20, startY + 11);
  doc.text(order.user?.phone || order.shippingAddress?.phone || "", 20, startY + 16);

  // Ship To
  doc.setFont("helvetica", "bold");
  doc.text("Ship To:", 110, startY);
  doc.setFont("helvetica", "normal");
  const address = order.shippingAddress;
  if (address) {
    doc.text(`${address.firstName || ""} ${address.lastName || ""}`.trim(), 110, startY + 6);
    doc.text(address.street || "", 110, startY + 11);
    doc.text(`${address.city || ""}, ${address.state || ""} ${address.zipCode || ""}`, 110, startY + 16);
    doc.text(address.country || "", 110, startY + 21);
  } else {
    doc.text("Same as billing", 110, startY + 6);
  }

  // --- Items Table ---
  const tableColumn = ["Item", "Quantity", "Price", "Total"];
  const tableRows: any[] = [];

  (order.items || []).forEach((item) => {
    const itemData = [
      item.name || item.product?.name || "Item",
      item.quantity,
      `£${item.price.toFixed(2)}`,
      `£${(item.price * item.quantity).toFixed(2)}`,
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: startY + 30,
    head: [tableColumn],
    body: tableRows,
    headStyles: {
      fillColor: brandColor,
      textColor: "#ffffff",
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 90 }, // Item name wider
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // --- Summary ---
  // @ts-expect-error jsPDF autoTable adds lastAutoTable at runtime
  const finalY = doc.lastAutoTable.finalY + 10;
  const summaryX = 130;

  doc.text("Subtotal:", summaryX, finalY);
  doc.text(`£${(order.subtotalAmount || 0).toFixed(2)}`, 190, finalY, {
    align: "right",
  });

  doc.text("Delivery Fee:", summaryX, finalY + 6);
  doc.text(`£${(order.deliveryFee || 0).toFixed(2)}`, 190, finalY + 6, {
    align: "right",
  });

  if (order.overnightFee) {
    doc.text("Overnight Fee:", summaryX, finalY + 12);
    doc.text(`£${order.overnightFee.toFixed(2)}`, 190, finalY + 12, {
      align: "right",
    });
  }

  if (order.discountAmount) {
    doc.setTextColor(220, 38, 38); // Red for discount
    doc.text("Discount:", summaryX, finalY + 18);
    doc.text(`-£${order.discountAmount.toFixed(2)}`, 190, finalY + 18, {
      align: "right",
    });
    doc.setTextColor(blackColor); // Reset
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", summaryX, finalY + 26);
  doc.text(`£${(order.totalAmount || 0).toFixed(2)}`, 190, finalY + 26, {
    align: "right",
  });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor);
  doc.text("Thank you for your business!", 105, pageHeight - 20, { align: "center" });

  // Save the PDF
  doc.save(`Invoice-${order.orderNumber}.pdf`);
};
