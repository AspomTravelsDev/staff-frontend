import { jsPDF } from "jspdf";
import { INVOICE_LOGOS, INVOICE_PRESETS } from "@/lib/constants/invoice-branding";
import type { PublicPayment } from "@/lib/types/payment-links";

export type PaymentReceiptDocument = Pick<PublicPayment, "reference" | "purpose" | "currency" | "mode" | "receipt" | "subsidiary" | "company_details"> & Partial<Pick<PublicPayment, "status">>;

export function paymentReceiptBrand(payment: PaymentReceiptDocument) {
  const subsidiary = payment.subsidiary || "aspom";
  const preset = INVOICE_PRESETS[subsidiary as keyof typeof INVOICE_PRESETS] || INVOICE_PRESETS.aspom;
  return { ...payment.company_details || preset, logo: INVOICE_LOGOS[subsidiary] || INVOICE_LOGOS.aspom };
}

// Match the invoice's company header, blue document title, item table and totals.
// Draw text directly so receipts remain searchable and readable when printed.
export function createPaymentReceiptPdf(payment: PaymentReceiptDocument, logo?: Uint8Array) {
  if (!payment.receipt) throw new Error("No verified receipt is available yet.");
  const receipt = payment.receipt;
  const brand = paymentReceiptBrand(payment);
  const pdf = new jsPDF();
  const money = (minor: number) => payment.currency + " " + (minor / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paidDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" }).format(new Date(receipt.paid_at));
  const ink = "#1e293b", muted = "#64748b", blue = "#0284c7";
  let y = 22;
  const text = (value: string | string[], x: number, at: number, size = 10, color = ink, bold = false, align: "left" | "right" = "left") => {
    pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(color);
    pdf.text(value, x, at, { align, lineHeightFactor: 1.4 });
  };
  const lines = (value: string, width: number, size: number, bold = false): string[] => {
    pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size);
    return pdf.splitTextToSize(value, width);
  };
  const rule = (at: number) => { pdf.setDrawColor("#e2e8f0"); pdf.setLineWidth(0.25); pdf.line(18, at, 192, at); };
  const ensureSpace = (height: number) => {
    if (y + height <= 265) return;
    pdf.addPage();
    text("PAYMENT RECEIPT - CONTINUED", 18, 22, 11, blue, true);
    text(payment.reference, 192, 22, 8, muted, false, "right"); rule(28); y = 38;
  };
  const paragraph = (value: string, width = 174, size = 9, color = muted, bold = false, x = 18) => {
    for (const line of lines(value, width, size, bold)) {
      ensureSpace(6); text(line, x, y, size, color, bold); y += size * 0.494;
    }
  };

  const heading = lines(brand.company_name.toUpperCase(), 112, 13, true);
  text(heading, 18, y, 13, ink, true); y += heading.length * 6.4 + 3;
  if (logo) {
    const image = pdf.getImageProperties(logo);
    const scale = Math.min(42 / image.width, 24 / image.height);
    const width = image.width * scale, height = image.height * scale;
    pdf.addImage(logo, image.fileType, 192 - width, 17, width, height);
  }
  for (const contact of [brand.company_website, brand.company_email, brand.company_phone, brand.company_address]) {
    if (contact) { paragraph(contact, 112, 8); y += 1; }
  }
  y = Math.max(y + 12, 62);
  ensureSpace(22);
  text("PAYMENT RECEIPT", 18, y, 23, blue, true); y += 12;
  if (payment.mode === "test") {
    ensureSpace(17); pdf.setFillColor("#fffbeb"); pdf.rect(18, y - 4, 174, 13, "F");
    text("TEST PAYMENT - No real money was received.", 22, y + 3, 10, "#92400e", true); y += 16;
  }
  text("RECEIVED FROM", 18, y, 8, muted, true); y += 7;
  paragraph(receipt.payer, 174, 12, ink, true); y += 6;

  const detail = (label: string, value: string) => {
    const wrapped = lines(value, 123, 9);
    ensureSpace(7); text(label.toUpperCase(), 18, y, 8, muted, true);
    for (const line of wrapped) { ensureSpace(6); text(line, 69, y, 9); y += 4.5; }
    y += 2;
  };
  detail("Receipt number", "RCPT-" + receipt.reference);
  detail("Payment request", payment.reference);
  detail("Paid on", paidDate + " (Lagos)");
  detail("Payment method", "Paystack / " + (receipt.channel || "checkout"));
  if (receipt.invoice) detail("Invoice", receipt.invoice.number);
  y += 5;
  const fee = receipt.customer_fee_minor || 0;
  const requested = receipt.request_amount_minor ?? receipt.amount_minor - fee;
  const purposeLines = lines(payment.purpose, 118, 10);
  const tableHeader = () => {
    ensureSpace(18); pdf.setFillColor("#f0f9ff"); pdf.rect(18, y - 4, 174, 11, "F");
    text("DESCRIPTION", 22, y + 3, 8, muted, true); text("AMOUNT", 188, y + 3, 8, muted, true, "right"); y += 14;
  };
  tableHeader();
  purposeLines.forEach((line, index) => {
    if (y + 6 > 265) { ensureSpace(6); tableHeader(); }
    text(line, 22, y, 10); if (index === 0) text(money(requested), 188, y, 10, ink, true, "right"); y += 5;
  });
  y += 6; rule(y); y += 10;
  ensureSpace(54);
  const totalRow = (label: string, value: string, emphasis = false) => {
    text(label, 101, y, emphasis ? 11 : 9, emphasis ? ink : muted, emphasis);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(emphasis ? 11 : 10);
    const size = Math.min(emphasis ? 11 : 10, (emphasis ? 11 : 10) * 43 / pdf.getTextWidth(value));
    text(value, 192, y, size, ink, true, "right"); y += emphasis ? 12 : 9;
  };
  totalRow("Request amount", money(requested));
  totalRow("Paystack fees", money(fee));
  pdf.setDrawColor("#cbd5e1"); pdf.setLineDashPattern([1, 1], 0); pdf.line(101, y - 3, 192, y - 3); pdf.setLineDashPattern([], 0); y += 5;
  totalRow("TOTAL PAID", money(receipt.amount_minor), true);
  if (receipt.invoice?.balance_due_minor !== null && receipt.invoice?.balance_due_minor !== undefined) {
    totalRow(payment.mode === "test" ? "Test invoice balance" : "Current invoice balance", money(receipt.invoice.balance_due_minor));
  }
  y += 5;
  ensureSpace(32); text("PAYMENT VERIFIED", 18, y, 11, "#059669", true); y += 8;
  if (payment.mode === "test") paragraph(receipt.invoice?.balance_due_minor !== null && receipt.invoice?.balance_due_minor !== undefined
    ? "No real money was received. The invoice balance reflects simulated development payments."
    : "This test receipt does not confirm a real payment or reduce your invoice balance.");
  else if (receipt.invoice && receipt.invoice.balance_due_minor === null) paragraph("This payment has not been applied to the invoice. Please contact Accounts for reconciliation.");
  else if (receipt.invoice && (receipt.invoice.balance_due_minor ?? 0) > 0) paragraph("This receipt confirms this payment. The invoice still has an outstanding balance.");
  else paragraph("Thank you for your payment. Keep this receipt for your records.");
  if (payment.status === "needs_attention") {
    y += 4; paragraph("Accounts is reviewing this payment. Contact us before making another payment.", 174, 9, "#92400e");
  }
  y += 4; detail("Paystack reference", receipt.reference);
  if (brand.company_email) { y += 4; paragraph("For payment enquiries, contact " + brand.company_email + "."); }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page); rule(279);
    text(lines(brand.company_name, 145, 8)[0], 18, 285, 8, muted);
    text(`Page ${page} of ${pages}`, 192, 285, 8, muted, false, "right");
  }
  return pdf;
}

export async function downloadPaymentReceipt(payment: PaymentReceiptDocument) {
  let logo: Uint8Array | undefined;
  try {
    const response = await fetch(paymentReceiptBrand(payment).logo);
    if (response.ok) logo = new Uint8Array(await response.arrayBuffer());
  } catch { /* The company header still identifies the issuer if the logo is unavailable. */ }
  const pdf = createPaymentReceiptPdf(payment, logo);
  pdf.save(payment.reference + "-receipt.pdf");
}
