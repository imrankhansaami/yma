// Invoice renderer — one source of truth for the invoice HTML (email + preview)
// and the attached PDF. Used by the checkout receipt, the admin "send invoice"
// action and the invoice preview/download endpoints, so every surface matches.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DeliveryTimeManager,
  IOrderDocument,
} from "./order.interface";

const COMPANY_NAME = "YMA Bouncy Castle";
const COMPANY_ADDRESS = [
  "28 Roding Road",
  "Loughton",
  "IG10 3ED",
  "United Kingdom",
];
const COMPANY_PHONE = "07951 431111";
const COMPANY_EMAIL = "info@ymabouncycastles.uk";
const COMPANY_SITE = "https://yma.simplif-ai.co";
const LOGO_URL =
  "https://res.cloudinary.com/dj785gqtu/image/upload/v1767711924/logo2_xos8xa.png";

const ORANGE = "#F97316";
const INK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

const money = (value?: number): string =>
  `£${Number(value || 0).toFixed(2)}`;

const freeOrMoney = (value?: number): string =>
  Number(value || 0) > 0 ? money(value) : "Free";

const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatDate = (value?: Date | string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** Strips the "(+£10)" style suffix the storefront appends to some labels. */
const stripFeeSuffix = (value?: string): string =>
  String(value || "").replace(/\s*\(\+£\d+\)\s*/g, "").trim();

const itemDays = (item: any): number => {
  const start = item?.startDate ? new Date(item.startDate) : null;
  const end = item?.endDate ? new Date(item.endDate) : null;
  if (
    !start ||
    !end ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 1;
  }
  const days =
    Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return days > 0 ? days : 1;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
  online: "Paid online",
};

const deliveryTimeLabel = (value?: string): string => {
  if (!value) return "Standard (8:00 AM – 12:00 PM)";
  const option = DeliveryTimeManager.getDeliveryOption(
    DeliveryTimeManager.normalize(value, "delivery"),
  );
  return option ? option.label : value;
};

const collectionTimeLabel = (value?: string): string => {
  if (!value) return "After 5:00 PM";
  const option = DeliveryTimeManager.getCollectionOption(
    DeliveryTimeManager.normalize(value, "collection"),
  );
  return option ? option.label : value;
};

export const invoiceNumberFor = (order: IOrderDocument): string =>
  `INV-${order?.orderNumber || String(order?._id || "").slice(-6) || "—"}`;

export const buildInvoiceModel = (order: IOrderDocument) => {
  const addr: any = order.shippingAddress || {};
  const customerName =
    `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
    (order as any).user?.name ||
    "Customer";
  const recipient =
    `${addr.deliveryFirstName || ""} ${addr.deliveryLastName || ""}`.trim() ||
    customerName;

  const cityLine = [addr.state, addr.zipCode].filter(Boolean).join(" ");

  const billedLines = [
    customerName,
    addr.street,
    addr.city,
    cityLine,
    addr.country,
    addr.email,
    addr.phone,
  ].filter(Boolean) as string[];

  const deliverLines = [
    recipient,
    addr.street,
    addr.city,
    cityLine,
    addr.country,
  ].filter(Boolean) as string[];

  const items = (order.items || []).map((item: any) => ({
    name: item.name || "Booking",
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.price || 0),
    lineTotal: Number(item.price || 0) * Number(item.quantity || 1),
    days: itemDays(item),
    startDate: formatDate(item.startDate),
    endDate: formatDate(item.endDate),
    where: addr.location || "—",
    extras: (item.extras || []).map((extra: any) => ({
      label: extra.label || "Option",
      quantity: Number(extra.quantity || 1),
      total: Number(extra.total || 0),
    })),
  }));

  return {
    invoiceNumber: invoiceNumberFor(order),
    orderNumber: String(order.orderNumber || "—"),
    orderDate: formatDate(order.createdAt),
    invoiceDate: formatDate(new Date()),
    payment:
      PAYMENT_LABELS[String(order.paymentMethod || "")] ||
      String(order.paymentMethod || "—"),
    purchaseType: addr.purchaseType || "",
    placement: stripFeeSuffix(addr.floorType) || "—",
    deliveryTime: deliveryTimeLabel(addr.deliveryTime),
    collectionTime: collectionTimeLabel(addr.collectionTime),
    billedLines,
    deliverLines,
    items,
    totals: {
      subtotal: Number(order.subtotalAmount || 0),
      delivery: Number(order.deliveryFee || 0),
      placement: Number(order.placementFee || 0),
      overnight: Number(order.overnightFee || 0),
      discount: Number(order.discountAmount || 0),
      total: Number(order.totalAmount || 0),
    },
    customerName,
    customerEmail: addr.email || "",
  };
};

export type InvoiceModel = ReturnType<typeof buildInvoiceModel>;

const INVOICE_STYLES = `
  body { margin:0; padding:0; background:#f1f5f9; color:${INK}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width:680px; margin:0 auto; padding:24px 12px; }
  .card { background:#ffffff; border:1px solid ${BORDER}; border-radius:16px; overflow:hidden; }
  .pad { padding:28px; }
  .title { margin:0; font-size:26px; font-weight:700; letter-spacing:-0.02em; color:${INK}; }
  .muted { color:${MUTED}; }
  .items { width:100%; border-collapse:collapse; }
  .items th { background:${INK}; color:#ffffff; font-size:12px; font-weight:600; text-align:left; padding:12px; }
  .items td { border-bottom:1px solid ${BORDER}; font-size:13px; padding:12px; vertical-align:top; }
  .k { color:${MUTED}; font-size:11px; width:118px; vertical-align:top; padding:2px 0; }
  .v { color:${INK}; font-size:11px; vertical-align:top; padding:2px 0; }
  .total-label { font-size:13px; color:${MUTED}; padding:4px 0; }
  .total-value { font-size:13px; color:${INK}; text-align:right; padding:4px 0; white-space:nowrap; }
  @media only screen and (max-width:600px) {
    .pad { padding:20px !important; }
    .title { font-size:22px !important; }
    .meta, .meta tbody, .meta tr, .meta td { display:block !important; width:100% !important; padding:0 0 18px 0 !important; }
  }
`;

/**
 * The invoice as a complete, email-ready HTML document. Also used for the
 * invoice preview/download pages.
 */
export const renderInvoiceHtml = (order: IOrderDocument): string => {
  const m = buildInvoiceModel(order);

  const metaBlock = (heading: string, lines: string[]) => `
    <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">${esc(heading)}</div>
    <div style="font-size:12px;line-height:1.6;color:${INK};">
      ${lines.map((line, index) => (index === 0 ? `<strong>${esc(line)}</strong>` : esc(line))).join("<br>")}
    </div>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td class="k">${esc(label)}</td>
      <td class="v"><strong>${esc(value)}</strong></td>
    </tr>`;

  const itemRows = m.items
    .map(
      (item) => `
    <tr>
      <td>
        <div style="font-size:13px;font-weight:600;color:${INK};">${esc(item.name)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr><td class="k">Start date</td><td class="v">${esc(item.startDate)}</td></tr>
          <tr><td class="k">Finish date</td><td class="v">${esc(item.endDate)}</td></tr>
          <tr><td class="k">Days</td><td class="v">${item.days}</td></tr>
          <tr><td class="k">Where</td><td class="v">${esc(item.where)}</td></tr>
          ${
            item.extras.length
              ? `<tr><td class="k">Extra options</td><td class="v">${item.extras
                  .map(
                    (extra) =>
                      `${esc(extra.label)} × ${extra.quantity}: ${money(extra.total)}`,
                  )
                  .join("<br>")}</td></tr>`
              : ""
          }
        </table>
      </td>
      <td style="text-align:center;white-space:nowrap;">${item.quantity}</td>
      <td style="text-align:right;white-space:nowrap;">${money(item.lineTotal)}</td>
    </tr>`,
    )
    .join("");

  const totalRow = (
    label: string,
    value: string,
    options: { strong?: boolean; tone?: string } = {},
  ) => `
    <tr>
      <td class="total-label" style="${options.strong ? `color:${INK};font-weight:700;font-size:15px;` : ""}${options.tone ? `color:${options.tone};` : ""}">${esc(label)}</td>
      <td class="total-value" style="${options.strong ? `color:${INK};font-weight:700;font-size:15px;` : ""}${options.tone ? `color:${options.tone};` : ""}">${esc(value)}</td>
    </tr>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${esc(m.invoiceNumber)} · ${esc(COMPANY_NAME)}</title>
<style>${INVOICE_STYLES}</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="pad" style="padding-bottom:0;">
          <img src="${LOGO_URL}" alt="${esc(COMPANY_NAME)}" width="150" style="width:150px;height:auto;display:block;">
        </td>
        <td class="pad" align="right" style="padding-bottom:0;font-size:12px;line-height:1.6;color:${INK};">
          <strong>${esc(COMPANY_NAME)}</strong><br>
          ${COMPANY_ADDRESS.map((line) => esc(line)).join("<br>")}<br>
          ${esc(COMPANY_PHONE)}
        </td>
      </tr>
    </table>

    <div class="pad" style="padding-bottom:0;">
      <h1 class="title">INVOICE</h1>
      <div class="muted" style="font-size:13px;margin-top:4px;">
        ${esc(m.invoiceNumber)} · ${esc(m.invoiceDate)}
      </div>
      <div style="height:3px;width:56px;background:${ORANGE};border-radius:2px;margin:14px 0 0;"></div>
      <p style="font-size:14px;line-height:1.6;margin:18px 0 0;">
        Hi ${esc(m.customerName)}, thanks for your order — your invoice is below.
        A PDF copy is attached to this email.
      </p>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="meta">
      <tr>
        <td width="34%" style="padding:24px 8px 0 28px;vertical-align:top;">
          ${metaBlock("Billed to", m.billedLines)}
        </td>
        <td width="30%" style="padding:24px 8px 0 8px;vertical-align:top;">
          ${metaBlock("Deliver to", m.deliverLines)}
        </td>
        <td width="36%" style="padding:24px 28px 0 8px;vertical-align:top;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Invoice details</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            ${detailRow("Invoice number", m.invoiceNumber)}
            ${detailRow("Invoice date", m.invoiceDate)}
            ${detailRow("Order number", m.orderNumber)}
            ${detailRow("Order date", m.orderDate)}
            ${detailRow("Payment method", m.payment)}
            ${detailRow("Placed in", m.placement)}
            ${detailRow("Delivery", m.deliveryTime)}
            ${detailRow("Collection", m.collectionTime)}
          </table>
        </td>
      </tr>
    </table>

    <div class="pad" style="padding-top:24px;padding-bottom:0;">
      <table role="presentation" class="items" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center;width:74px;">Quantity</th>
            <th style="text-align:right;width:96px;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <div class="pad" style="padding-top:18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="52%"></td>
          <td width="48%">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${totalRow("Subtotal", money(m.totals.subtotal))}
              ${totalRow("Delivery &amp; collection", freeOrMoney(m.totals.delivery))}
              ${m.totals.placement > 0 ? totalRow("Outdoor placement", money(m.totals.placement)) : ""}
              ${m.totals.overnight > 0 ? totalRow("Overnight keeping", money(m.totals.overnight)) : ""}
              ${m.totals.discount > 0 ? totalRow("Discount", `-${money(m.totals.discount)}`, { tone: "#DC2626" }) : ""}
              <tr><td colspan="2" style="border-top:2px solid ${BORDER};padding-top:8px;"></td></tr>
              ${totalRow("Total", money(m.totals.total), { strong: true })}
            </table>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:${INK};color:#CBD5E1;padding:22px 28px;font-size:12px;line-height:1.7;">
      Questions about this invoice? Call <a href="tel:${esc(COMPANY_PHONE)}" style="color:#FDBA74;text-decoration:none;">${esc(COMPANY_PHONE)}</a>
      or email <a href="mailto:${esc(COMPANY_EMAIL)}" style="color:#FDBA74;text-decoration:none;">${esc(COMPANY_EMAIL)}</a>.<br>
      Please quote ${esc(m.invoiceNumber)} in any correspondence. This invoice is generated automatically.
    </div>
  </div>
  <div style="text-align:center;color:#94A3B8;font-size:11px;padding:14px 8px;">
    ${esc(COMPANY_NAME)} · <a href="${COMPANY_SITE}" style="color:#94A3B8;text-decoration:underline;">${esc(COMPANY_SITE.replace("https://", ""))}</a>
  </div>
</div>
</body>
</html>`;
};

const loadLogoDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
};

/**
 * The invoice as a PDF, for attaching to the email. Falls back to a text
 * header if the logo cannot be loaded, so the PDF itself never fails.
 */
export const renderInvoicePdf = async (
  order: IOrderDocument,
): Promise<Buffer> => {
  const m = buildInvoiceModel(order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - 15;

  // ── Header: logo (left) and company block (right) ──────────────────────
  const logo = await loadLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 15, 12, 34, 15);
    } catch {
      // Fall through to the text header below.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(ORANGE);
      doc.text("YMA", 15, 22);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(ORANGE);
    doc.text("YMA", 15, 22);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  let companyY = 15;
  doc.text(COMPANY_NAME, right, companyY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  COMPANY_ADDRESS.forEach((line) => {
    companyY += 4.2;
    doc.text(line, right, companyY, { align: "right" });
  });
  companyY += 4.2;
  doc.text(COMPANY_PHONE, right, companyY, { align: "right" });

  // ── Title ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(INK);
  doc.text("INVOICE", 15, 44);
  doc.setFillColor(ORANGE);
  doc.rect(15, 47.5, 22, 1.4, "F");

  doc.setFontSize(12);
  doc.text(m.invoiceNumber, right, 40, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(m.invoiceDate, right, 45, { align: "right" });

  // ── Meta columns ───────────────────────────────────────────────────────
  const columns = [
    { x: 15, heading: "BILLED TO", lines: m.billedLines },
    { x: 78, heading: "DELIVER TO", lines: m.deliverLines },
    {
      x: 140,
      heading: "INVOICE DETAILS",
      lines: [
        `Invoice: ${m.invoiceNumber}`,
        `Order: ${m.orderNumber}`,
        `Order date: ${m.orderDate}`,
        `Payment: ${m.payment}`,
        `Placed in: ${m.placement}`,
        `Delivery: ${m.deliveryTime}`,
        `Collection: ${m.collectionTime}`,
      ],
    },
  ];

  let metaBottom = 58;
  columns.forEach((column) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(column.heading, column.x, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let y = 63;
    column.lines.forEach((line) => {
      doc.setTextColor(line === column.lines[0] ? INK : "#334155");
      const wrapped = doc.splitTextToSize(String(line), 56);
      doc.text(wrapped, column.x, y);
      y += wrapped.length * 4.2;
    });
    metaBottom = Math.max(metaBottom, y);
  });

  // ── Items table ────────────────────────────────────────────────────────
  const body = m.items.map((item) => {
    const detailLines = [
      `Start date: ${item.startDate}`,
      `Finish date: ${item.endDate}`,
      `Days: ${item.days}`,
      `Where: ${item.where}`,
    ];
    if (item.extras.length) {
      detailLines.push(
        `Extra options: ${item.extras
          .map((extra) => `${extra.label} x ${extra.quantity}: ${money(extra.total)}`)
          .join(", ")}`,
      );
    }
    return [
      `${item.name}\n${detailLines.join("\n")}`,
      String(item.quantity),
      money(item.lineTotal),
    ];
  });

  autoTable(doc, {
    startY: metaBottom + 6,
    margin: { left: 15, right: 15 },
    head: [["Product", "Quantity", "Price"]],
    body,
    theme: "plain",
    headStyles: {
      fillColor: INK,
      textColor: "#FFFFFF",
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    styles: {
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      textColor: "#334155",
      lineColor: BORDER,
      lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
      valign: "top",
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right", cellWidth: 30 },
    },
  });

  // ── Totals ─────────────────────────────────────────────────────────────
  // @ts-expect-error jspdf-autotable attaches lastAutoTable at runtime
  let y = (doc.lastAutoTable?.finalY || metaBottom + 20) + 8;
  const labelX = 130;
  const valueX = right;

  const totalLine = (
    label: string,
    value: string,
    options: { bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(options.bold ? 12 : 10);
    const [r, g, b] = options.color || [51, 65, 85];
    doc.setTextColor(r, g, b);
    doc.text(label, labelX, y);
    doc.text(value, valueX, y, { align: "right" });
    y += options.bold ? 6.5 : 5.5;
  };

  totalLine("Subtotal", money(m.totals.subtotal));
  totalLine("Delivery & collection", freeOrMoney(m.totals.delivery));
  if (m.totals.placement > 0) {
    totalLine("Outdoor placement", money(m.totals.placement));
  }
  if (m.totals.overnight > 0) {
    totalLine("Overnight keeping", money(m.totals.overnight));
  }
  if (m.totals.discount > 0) {
    totalLine("Discount", `-${money(m.totals.discount)}`, {
      color: [220, 38, 38],
    });
  }
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(labelX, y - 3, valueX, y - 3);
  totalLine("Total", money(m.totals.total), { bold: true, color: [15, 23, 42] });

  // ── Footer ─────────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(15, pageHeight - 26, right, pageHeight - 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(
    `Questions about this invoice? Call ${COMPANY_PHONE} or email ${COMPANY_EMAIL}.`,
    15,
    pageHeight - 20,
  );
  doc.text(
    `Please quote ${m.invoiceNumber} in any correspondence. This invoice is generated automatically.`,
    15,
    pageHeight - 15,
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 8, {
    align: "center",
  });

  const output = doc.output("arraybuffer");
  return Buffer.from(output);
};
