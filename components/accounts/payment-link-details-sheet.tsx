"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { getPaymentLink, markPaymentLinkViewed } from "@/lib/api/payment-links";
import type { PaymentLink } from "@/lib/types/payment-links";
import { formatPaymentAmount, paymentStatusLabels, paymentReviewDescription } from "@/lib/types/payment-links";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { PaymentLinkCopyField } from "./payment-link-copy-field";

export function PaymentLinkDetailsSheet({ id, canManage, onClose }: { id: string; canManage: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await getPaymentLink(id);
        if (!active) return;
        if (!result.success) { setError(result.error.error); return; }
        setLink(result.data.data);
        if (result.data.through_id) {
          const marked = await markPaymentLinkViewed(id, result.data.through_id);
          if (marked.success) void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      } catch { if (active) setError("Could not load this payment request. Close and reopen to retry."); }
    };
    void load(); return () => { active = false; };
  }, [id, queryClient, reload]);
  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}><SheetContent className="w-full sm:max-w-xl overflow-y-auto">
    <SheetHeader className="border-b pr-10"><SheetTitle>{link?.purpose || "Payment request"}</SheetTitle><SheetDescription>{link?.reference || "Loading request details…"}</SheetDescription></SheetHeader>
    <div className="space-y-5 p-4 pt-0">
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !link ? <p className="text-sm text-muted-foreground">Loading details…</p> : <>
        <div className="flex items-center justify-between"><span className="text-2xl font-semibold">{formatPaymentAmount(link.amount_minor, link.currency)}</span><Badge variant="outline">{paymentStatusLabels[link.effective_status]}</Badge></div>
        {link.mode === "test" && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{link.receipt_document?.test_accounting_enabled && (link.invoice_id || link.subsidiary === "aspom") ? "Test request. Payments can update development accounting records. No real money is collected." : "Test request. Payments are recorded in Payment Links only. No real money is collected."}</p>}
        {canManage && link.effective_status === "awaiting_payment" && <PaymentLinkCopyField key={link.id} id={link.id} onCopied={() => {
          setReload(value => value + 1);
          void queryClient.invalidateQueries({ queryKey: ["payment-links"] });
        }} />}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[ ["Client", link.client_name], ["Email", link.client_email], ["Subsidiary", link.subsidiary], ["Created by", link.creator?.name || "Staff unavailable"], ["Responsible staff", link.responsible?.name || "Not assigned"], ["Created", formatReadableDate(link.created_at)], ["Due date", link.due_at ? formatReadableDate(link.due_at) : "Not set"], ["Expires", link.expires_at ? formatReadableDate(link.expires_at) : "No expiry"], ["Invoice", link.invoice?.invoice_number || "Standalone payment"] ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
        </dl>
        <p className="text-sm text-muted-foreground">{link.invoice_id ? "Verified payments are recorded against this invoice." : link.subsidiary === "aspom" ? "Verified Aspom Travel payments create a pending Payment Confirmation for Accounts review." : "Standalone payments for this subsidiary stay in Payment Links. No new Payment Confirmation is created."}{link.mode === "test" && !link.receipt_document?.test_accounting_enabled && " Accounting updates are disabled for this test request."}</p>
        {link.attention_reason && <div className="space-y-1 rounded-md border border-amber-300 p-3 text-sm"><p className="font-medium">Accounts review needed</p><p>{paymentReviewDescription(link)}</p>{paymentReviewDescription(link) !== link.attention_reason && <p className="text-xs text-muted-foreground">{link.attention_reason}</p>}</div>}
        {link.cancellation_reason && <p className="text-sm">Cancellation: {link.cancellation_reason}</p>}
        <section className="space-y-3 border-t pt-4"><h3 className="font-medium">Payment attempts</h3>{link.attempts?.length ? link.attempts.map(attempt => <article key={attempt.id} className="space-y-1 border-l-2 pl-3 text-sm">
          <p className="font-medium">{attempt.status === "success" ? (attempt.message ? "Payment needs review" : "Payment verified") : attempt.status === "initialized" ? "Checkout link ready" : attempt.status.replaceAll("_", " ")}</p><p className="break-all text-xs text-muted-foreground">{attempt.reference}</p>
          {attempt.paid_at && <p>{formatReadableDate(attempt.paid_at)} · {attempt.verified_currency === link.currency ? formatPaymentAmount(attempt.verified_amount_minor ?? attempt.amount_minor, link.currency) : `${attempt.verified_currency || "Unknown currency"} — review required`}</p>}
          {attempt.message && <p>{attempt.message}</p>}
          {attempt.fees_minor !== null && attempt.verified_currency === link.currency && attempt.status === "success" && <p className="text-xs text-muted-foreground">Paystack reported fees: {formatPaymentAmount(attempt.fees_minor, link.currency)}</p>}
          {attempt.payment_confirmation_id && (canManage ? <Link className="text-primary underline" href="/accounts/confirmation">View payment confirmation for Accounts review</Link> : <p className="text-xs text-muted-foreground">Payment confirmation sent for Accounts review.</p>)}
          {attempt.invoice_payment_id && <p className="text-xs text-muted-foreground">Recorded in invoice payment history.</p>}
        </article>) : <p className="text-sm text-muted-foreground">No checkout attempts yet.</p>}</section>
        <section className="space-y-3 border-t pt-4"><h3 className="font-medium">History</h3>{link.events?.map(event => <article key={event.id} className="space-y-1 border-l-2 pl-3 text-sm"><p>{event.message}</p><p className="text-xs text-muted-foreground">{event.user?.name || "Payment system"} · {formatReadableDate(event.created_at)}</p></article>)}</section>
        <p className="border-t pt-4 text-xs text-muted-foreground">Payment verification does not mean the money has settled to the bank.</p>
      </>}
    </div>
  </SheetContent></Sheet>;
}
