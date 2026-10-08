export type PaymentLinkStatus = "awaiting_payment" | "paid" | "needs_attention" | "cancelled" | "expired";
export interface PaymentAttempt {
  id: string; reference: string; provider_id: string | null; status: string; amount_minor: number; verified_amount_minor: number | null; verified_requested_amount_minor: number | null;
  verified_currency: string | null; verified_mode: string | null; details_verified: boolean; fees_minor: number | null;
  channel: string | null; paid_at: string | null; reconciled_at: string | null; message: string | null;
  invoice_payment_id: string | null; payment_confirmation_id: string | null;
}
export interface PaymentLink {
  id: string; reference: string; invoice_id: string | null; crm_client_id: string | null;
  client_name: string; client_email: string; client_phone: string | null; purpose: string; subsidiary: string;
  amount_minor: number; currency: string; mode: "test" | "live"; status: PaymentLinkStatus; effective_status: PaymentLinkStatus;
  due_at: string | null; expires_at: string | null; paid_at: string | null; created_at: string;
  responsible_user_id: string | null; cancellation_reason: string | null; attention_reason: string | null; public_url: string;
  creator?: { id: string; name: string }; responsible?: { id: string; name: string };
  invoice?: { id: string; invoice_number: string; balance_due: string };
  attempts?: PaymentAttempt[];
  attempts_exists?: boolean;
  receipt_document?: PublicPayment;
  events?: { id: number; type: string; message: string; created_at: string; user?: { name: string } }[];
}
export interface PaymentList {
  data: PaymentLink[]; pagination: { page: number; page_size: number; total_pages: number; total: number; from: number; to: number };
  mode: "test" | "live"; configured: boolean; can_manage: boolean; test_accounting_enabled?: boolean;
  stats: { awaiting: number; overdue: number; received_minor: { NGN: number; USD: number }; attention: number };
}
export interface PaymentOptions {
  clients: { id: string; name: string; email: string | null; phone: string | null; assigned_to: string | null }[];
  invoices: { id: string; invoice_number: string; client_name: string; client_email: string | null; client_phone: string | null; crm_client_id: string | null; subsidiary: string; balance_due: string }[];
  staff: { id: string; name: string }[];
}
export interface NewPaymentLink {
  new_customer_name?: string;
  invoice_id?: string; crm_client_id?: string; client_email?: string; purpose: string; subsidiary?: string;
  amount: string; currency?: "NGN" | "USD"; due_at?: string; expires_at?: string; responsible_user_id?: string | null; replaces_id?: string;
}
export interface PublicPayment {
  reference: string; purpose: string; amount_minor: number; currency: string; mode: "test" | "live";
  status: PaymentLinkStatus; due_at: string | null; expires_at: string | null; company: string; configured: boolean;
  subsidiary?: string;
  test_accounting_enabled?: boolean;
  company_details?: { company_name: string; company_email: string | null; company_website: string | null; company_phone: string | null; company_address: string | null } | null;
  current_attempt: { reference: string; status: string } | null;
  receipt: { reference: string; payer: string; amount_minor: number; request_amount_minor?: number; customer_fee_minor?: number; paid_at: string; channel: string | null;
    invoice?: { number: string; balance_due_minor: number | null } | null;
  } | null;
}
export const paymentStatusLabels: Record<PaymentLinkStatus, string> = { awaiting_payment: "Awaiting payment", paid: "Paid", needs_attention: "Needs attention", cancelled: "Cancelled", expired: "Expired" };
export function formatPaymentAmount(minor: number | string, currency = "NGN") { return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(Number(minor) / 100); }
export function hasVerifiedPaymentReceipt(attempt: PaymentAttempt, link: Pick<PaymentLink, "currency" | "mode">) {
  const amountMatches = attempt.verified_amount_minor === attempt.amount_minor || (
    attempt.verified_requested_amount_minor === attempt.amount_minor && attempt.fees_minor !== null && attempt.fees_minor > 0
    && attempt.verified_amount_minor !== null && attempt.verified_amount_minor - attempt.fees_minor === attempt.amount_minor
  );
  return attempt.details_verified && attempt.status === "success" && !!attempt.provider_id && !!attempt.reconciled_at && !!attempt.paid_at
    && attempt.verified_currency === link.currency && attempt.verified_mode === link.mode && amountMatches;
}
export function paymentReviewDescription(link: PaymentLink) {
  const attempt = link.attempts?.find(item => item.status === "success" && item.message);
  if (link.attention_reason === "The verified payment details did not match this request." && attempt && attempt.verified_currency === link.currency && attempt.verified_amount_minor !== null && attempt.verified_amount_minor !== attempt.amount_minor) {
    const amounts = `Paystack reported ${formatPaymentAmount(attempt.verified_amount_minor, link.currency)} for a ${formatPaymentAmount(attempt.amount_minor, link.currency)} request.`;
    return `${amounts}${attempt.fees_minor !== null ? ` Paystack fee: ${formatPaymentAmount(attempt.fees_minor, link.currency)}.` : ""}`;
  }
  return link.attention_reason || "Accounts needs to review the payment details.";
}
