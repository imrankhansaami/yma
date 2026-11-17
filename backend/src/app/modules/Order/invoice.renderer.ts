// Invoice renderer — one source of truth for the invoice HTML (email + preview)
// and the attached PDF. Used by the checkout receipt, the admin "send invoice"
// action and the invoice preview/download endpoints, so every surface matches.
//
// The PDF mirrors the invoice layout the business already used (logo, company
// block, billed-to / ship-to / invoice-details columns, booking block inside
// the product row, fee lines and the payment-details footer). Keep both
// renderers in step: they show the same fields.
import { jsPDF } from "jspdf";
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
const COMPANY_SITE = "https://ymabouncycastles.uk";
const LOGO_URL =
  "https://res.cloudinary.com/dj785gqtu/image/upload/v1767711924/logo2_xos8xa.png";

/** Bank details printed at the foot of every invoice. */
const PAYMENT_DETAILS = {
  accountName: "YMA BOUNCY CASTLES LTD",
  sortCode: "20-25-19",
  accountNumber: "60465909",
};

const ORANGE = "#F97316";
const INK = "#0F172A";
const BODY = "#334155";
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

/** "15 November 2026" — used in prose. */
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

/** "November 15, 2026" — the invoice/order date format on the invoice. */
const formatLongDate = (value?: Date | string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/** "21-11-2026" — the booking start/finish format on the invoice. */
const formatShortDate = (value?: Date | string): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
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
    addr.apartment,
    addr.city,
    cityLine,
    addr.country,
    addr.email,
    addr.phone,
  ].filter(Boolean) as string[];

  const deliverLines = [
    recipient,
    addr.street,
    addr.apartment,
    addr.city,
    cityLine,
    addr.country,
  ].filter(Boolean) as string[];

  // "Where" on the booking block is the delivery postcode.
  const where = addr.zipCode || addr.postcode || addr.location || "—";

  const items = (order.items || []).map((item: any) => ({
    name: item.name || "Booking",
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.price || 0),
    lineTotal: Number(item.price || 0) * Number(item.quantity || 1),
    days: itemDays(item),
    startDate: formatShortDate(item.startDate),
    endDate: formatShortDate(item.endDate),
    where,
    extras: (item.extras || []).map((extra: any) => ({
      label: extra.label || "Option",
      quantity: Number(extra.quantity || 1),
      total: Number(extra.total || 0),
    })),
  }));

  // The charged delivery/collection money is stored as one figure
  // (`deliveryFee`). Work out which window caused it so the invoice can name
  // it the way the customer picked it.
  const deliverySlot = DeliveryTimeManager.normalize(
    addr.deliveryTime,
    "delivery",
  );
  const collectionSlot = DeliveryTimeManager.normalize(
    addr.collectionTime,
    "collection",
  );
  const deliverySlotFee = DeliveryTimeManager.getDeliveryFee(deliverySlot);
  const collectionSlotFee =
    DeliveryTimeManager.getCollectionFee(collectionSlot);

  const preferredFeeLabel =
    deliverySlotFee > 0 && collectionSlotFee > 0
      ? "Preferred Delivery & Collection Times"
      : deliverySlotFee > 0
        ? `Preferred Delivery Time (${deliverySlot})`
        : collectionSlotFee > 0
          ? `Preferred Collection Time (${collectionSlot})`
          : "Preferred Delivery & Collection Times";

  return {
    invoiceNumber: invoiceNumberFor(order),
    orderNumber: String(order.orderNumber || "—"),
    orderDate: formatLongDate(order.createdAt),
    invoiceDate: formatLongDate(new Date()),
    payment:
      PAYMENT_LABELS[String(order.paymentMethod || "")] ||
      String(order.paymentMethod || "—"),
    purchaseType: addr.purchaseType || "",
    // "The product will be" line — where the inflatable gets set up.
    placement: stripFeeSuffix(addr.floorType) || "—",
    deliveryTime: deliveryTimeLabel(addr.deliveryTime),
    collectionTime: collectionTimeLabel(addr.collectionTime),
    deliverySlot,
    collectionSlot,
    preferredFeeLabel,
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
 * invoice preview page.
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
        <div style="font-size:13px;font-weight:600;color:${INK};">Booking</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr><td class="k">Name</td><td class="v">${esc(item.name)}</td></tr>
          <tr><td class="k">Start date</td><td class="v">${esc(item.startDate)}</td></tr>
          <tr><td class="k">Finish date</td><td class="v">${esc(item.endDate)}</td></tr>
          <tr><td class="k">Days</td><td class="v">${item.days}</td></tr>
          <tr><td class="k">Where</td><td class="v">${esc(item.where)}</td></tr>
          ${
            item.extras.length
              ? `<tr><td class="k">Extra options</td><td class="v">${item.extras
                  .map((extra) =>
                    Number(extra.total) > 0
                      ? `${esc(extra.label)} × ${extra.quantity}: ${money(extra.total)}`
                      : // A £0 line (the refundable deposit) is information, so
                        // it reads as a plain note rather than "…: £0.00".
                        esc(extra.label),
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
          ${metaBlock("Ship to", m.deliverLines)}
        </td>
        <td width="36%" style="padding:24px 28px 0 8px;vertical-align:top;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Invoice details</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            ${detailRow("Invoice Number", m.invoiceNumber)}
            ${detailRow("Invoice Date", m.invoiceDate)}
            ${detailRow("Order Number", m.orderNumber)}
            ${detailRow("Order Date", m.orderDate)}
            ${detailRow("Payment Method", m.payment)}
            ${detailRow("The product will be", m.placement)}
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
              ${totalRow("Shipping", "Free shipping")}
              ${m.totals.delivery > 0 ? totalRow(m.preferredFeeLabel, money(m.totals.delivery)) : ""}
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

    <div class="pad" style="padding-top:8px;padding-bottom:0;">
      <div style="border-top:1px solid ${BORDER};padding-top:14px;text-align:center;font-size:12px;line-height:1.7;color:${INK};">
        <strong>PAYMENT DETAILS: ${esc(PAYMENT_DETAILS.accountName)}</strong><br>
        SC: ${esc(PAYMENT_DETAILS.sortCode)}<br>
        AC: ${esc(PAYMENT_DETAILS.accountNumber)}
      </div>
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
 * The invoice as a PDF, for attaching to the email and for the customer /
 * admin download. Mirrors the layout the business already sends out.
 */
export const renderInvoicePdf = async (
  order: IOrderDocument,
): Promise<Buffer> => {
  const m = buildInvoiceModel(order);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 15;
  const right = pageWidth - 15;

  const BILLED_X = 15;
  const SHIP_X = 72;
  const META_LABEL_X = 112;
  const META_VALUE_X = 142;
  const META_VALUE_WIDTH = right - META_VALUE_X;

  const QUANTITY_X = 148;
  const PRICE_X = right - 2;

  const money2 = (value?: number) => `£${Number(value || 0).toFixed(2)}`;

  // ── Header: logo (left) and company block (right) ──────────────────────
  const logo = await loadLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", left, 12, 34, 15);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(ORANGE);
      doc.text("YMA", left, 22);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(ORANGE);
    doc.text("YMA", left, 22);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK);
  let companyY = 14;
  doc.text(COMPANY_NAME, right, companyY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(BODY);
  COMPANY_ADDRESS.forEach((line) => {
    companyY += 4.2;
    doc.text(line, right, companyY, { align: "right" });
  });
  companyY += 4.2;
  doc.text(COMPANY_PHONE, right, companyY, { align: "right" });

  // ── Title ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(INK);
  doc.text("INVOICE", left, 43);

  // ── Meta columns: billed to / ship to / invoice details ────────────────
  const columnTop = 54;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(BODY);
  let billedY = columnTop;
  m.billedLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(String(line), 52);
    doc.text(wrapped, BILLED_X, billedY);
    billedY += wrapped.length * 4.4;
  });

  let shipY = columnTop;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK);
  doc.text("Ship To:", SHIP_X, shipY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BODY);
  m.deliverLines.forEach((line) => {
    shipY += 4.4;
    const wrapped = doc.splitTextToSize(String(line), 36);
    doc.text(wrapped, SHIP_X, shipY);
    shipY += (wrapped.length - 1) * 4.4;
  });

  const metaRows: [string, string][] = [
    ["Invoice Number:", m.invoiceNumber],
    ["Invoice Date:", m.invoiceDate],
    ["Order Number:", m.orderNumber],
    ["Order Date:", m.orderDate],
    ["Payment Method:", m.payment],
    ["The product will be:", m.placement],
  ];
  let metaY = columnTop;
  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BODY);
    doc.text(label, META_LABEL_X, metaY);
    doc.setTextColor(INK);
    const wrapped = doc.splitTextToSize(String(value), META_VALUE_WIDTH);
    doc.text(wrapped, META_VALUE_X, metaY);
    metaY += Math.max(5.2, wrapped.length * 4.4 + 0.8);
  });

  let y = Math.max(billedY, shipY, metaY) + 4;

  // ── Product table ──────────────────────────────────────────────────────
  const drawTableHeader = (top: number) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(left, top, right - left, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor("#FFFFFF");
    doc.text("Product", left + 3, top + 5.4);
    doc.text("Quantity", QUANTITY_X, top + 5.4, { align: "center" });
    doc.text("Price", PRICE_X, top + 5.4, { align: "right" });
  };

  const detailLine = (
    label: string,
    value: string,
    atY: number,
    indent = 0,
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK);
    doc.text(`${label} `, left + 1 + indent, atY);
    const width = doc.getTextWidth(`${label} `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BODY);
    doc.text(value, left + 1 + indent + width, atY);
  };

  drawTableHeader(y);
  let rowY = y + 8;

  const footerReserve = 40;

  m.items.forEach((item) => {
    const nameLines = doc.splitTextToSize(
      item.name,
      right - left - 12,
    ) as string[];
    const extraCount = item.extras.length;
    const blockHeight =
      5.5 + nameLines.length * 4.4 + (4 + extraCount) * 4.4 + 2.5;

    if (rowY + blockHeight > pageHeight - footerReserve) {
      doc.addPage();
      rowY = 20;
      drawTableHeader(rowY);
      rowY += 8;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(BODY);
    doc.text("Booking", left + 1, rowY + 4);
    doc.text(String(item.quantity), QUANTITY_X, rowY + 4, { align: "center" });
    doc.text(money2(item.lineTotal), PRICE_X, rowY + 4, { align: "right" });

    let dy = rowY + 9;

    // Name (wraps onto as many lines as it needs)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK);
    doc.text("Name: ", left + 1, dy);
    const nameLabelWidth = doc.getTextWidth("Name: ");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BODY);
    doc.text(nameLines, left + 1 + nameLabelWidth, dy);
    dy += nameLines.length * 4.4;

    detailLine("Start date:", item.startDate, dy);
    dy += 4.4;
    detailLine("Finish date:", item.endDate, dy);
    dy += 4.4;
    detailLine("Days:", String(item.days), dy);
    dy += 4.4;

    const postalLines = doc.splitTextToSize(
      item.where,
      right - left - 8,
    ) as string[];
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK);
    doc.text("Where:", left + 1, dy);
    const whereLabelWidth = doc.getTextWidth("Where: ");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BODY);
    doc.text(postalLines, left + 1 + whereLabelWidth, dy);
    dy += postalLines.length * 4.4;

    item.extras.forEach((extra) => {
      const value =
        Number(extra.total) > 0
          ? `${extra.label} x ${extra.quantity}: ${money2(extra.total)}`
          : extra.label;
      detailLine("Extra:", value, dy);
      dy += 4.4;
    });

    rowY = dy + 0.5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(left, rowY, right, rowY);
  });

  y = rowY + 8;

  // ── Totals ─────────────────────────────────────────────────────────────
  const totalsLabelX = 114;
  const totalsValueX = right;

  const totalLine = (
    label: string,
    value: string,
    options: { bold?: boolean; color?: [number, number, number] } = {},
  ) => {
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(options.bold ? 11.5 : 10);
    const [r, g, b] = options.color || [51, 65, 85];
    const labelWrapped = doc.splitTextToSize(
      label,
      totalsValueX - totalsLabelX - 26,
    ) as string[];
    doc.text(labelWrapped, totalsLabelX, y);
    doc.text(value, totalsValueX, y, { align: "right" });
    y += labelWrapped.length * 5.2;

    if (!options.bold) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(totalsLabelX, y - 4.6, totalsValueX, y - 4.6);
    }
  };

  doc.setTextColor(BODY);
  // Standard-window delivery and collection are free; any charge for a
  // specific window rides on its own line below, so the two never double up.
  totalLine("Shipping", "Free shipping");
  if (m.totals.delivery > 0) {
    totalLine(m.preferredFeeLabel, money(m.totals.delivery));
  }
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

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(totalsLabelX, y - 3, totalsValueX, y - 3);
  totalLine("Total", money(m.totals.total), { bold: true, color: [15, 23, 42] });

  // ── Payment details footer ─────────────────────────────────────────────
  const footerTop = Math.max(y + 12, pageHeight - 34);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(left, footerTop, right, footerTop);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(INK);
  doc.text(
    `PAYMENT DETAILS: ${PAYMENT_DETAILS.accountName}`,
    pageWidth / 2,
    footerTop + 7,
    { align: "center" },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(BODY);
  doc.text(
    `SC: ${PAYMENT_DETAILS.sortCode}`,
    pageWidth / 2,
    footerTop + 12.5,
    { align: "center" },
  );
  doc.text(
    `AC:${PAYMENT_DETAILS.accountNumber}`,
    pageWidth / 2,
    footerTop + 18,
    { align: "center" },
  );

  const output = doc.output("arraybuffer");
  return Buffer.from(output);
};
