"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, CircleCheck, Clock } from "lucide-react";
import { beginPublicPayment, getPublicPayment, verifyPublicPayment } from "@/lib/api/payment-links";
import type { PublicPayment } from "@/lib/types/payment-links";
import { formatPaymentAmount } from "@/lib/types/payment-links";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { downloadPaymentReceipt } from "@/lib/utils/payment-link-files";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PublicPaymentClient({ token, initial, reference }: { token: string; initial: PublicPayment; reference?: string }) {
  const [payment, setPayment] = useState(initial);
  const [busy, setBusy] = useState(!!reference);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const downloadReceipt = async () => {
    setDownloading(true); setError("");
    try { await downloadPaymentReceipt(payment); }
    catch { setError("Could not download your receipt. Please try again."); }
    finally { setDownloading(false); }
  };
  useEffect(() => {
    if (!reference) return;
    let active = true;
    verifyPublicPayment(token, reference).then(result => { if (!active) return; if (result.success) setPayment(result.data.data); else setError(result.error.error); }).catch(() => { if (active) setError("Could not check your payment. Please try again."); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [reference, token]);
  const refresh = async () => {
    setBusy(true); setError("");
    try {
      const ref = payment.current_attempt?.reference;
      const result = ref ? await verifyPublicPayment(token, ref) : await getPublicPayment(token);
      if (result.success) setPayment(result.data.data); else setError(result.error.error);
    } catch { setError("Could not check your payment. Please try again."); } finally { setBusy(false); }
  };
  const pay = async () => {
    setBusy(true); setError("");
    try {
      const result = await beginPublicPayment(token);
      if (!result.success) { setError(result.error.error); const fresh = await getPublicPayment(token); if (fresh.success) setPayment(fresh.data.data); setBusy(false); return; }
      window.location.assign(result.data.url);
    } catch { setError("Could not open checkout. Please try again."); setBusy(false); }
  };
  const paid = payment.status === "paid";
  return <div className="mx-auto w-full max-w-lg space-y-4">
    <Card><CardHeader><CardTitle className="text-xl">{paid ? "Payment received" : "Payment request"}</CardTitle></CardHeader><CardContent className="space-y-5">
      {payment.mode === "test" && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">Test payment. This link does not collect real money.</p>}
      <div><h1 className="text-lg font-medium break-words">{payment.purpose}</h1><p className="mt-2 text-3xl font-semibold">{formatPaymentAmount(payment.amount_minor, payment.currency)}</p><p className="mt-2 text-xs text-muted-foreground">Reference: {payment.reference}</p></div>
      {payment.due_at && <p className="text-sm text-muted-foreground">Due {formatReadableDate(payment.due_at)}</p>}
      {busy && <p role="status" className="text-sm text-muted-foreground">Please wait while we confirm your payment…</p>}
      {error && <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      {paid ? <div className="space-y-3"><p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><CircleCheck className="h-5 w-5" />Your payment has been verified.</p>{payment.receipt && <><p className="text-sm text-muted-foreground">{formatReadableDate(payment.receipt.paid_at)}</p><Button variant="outline" className="w-full" disabled={downloading || busy} onClick={downloadReceipt}>{downloading ? "Preparing receipt…" : "Download receipt"}</Button></>}</div>
        : payment.status === "needs_attention" ? <div className="space-y-3"><p className="text-sm">Your payment needs an Accounts review. Please contact the team that sent this payment request with reference {payment.reference} before trying another payment.</p>{payment.receipt && <Button variant="outline" className="w-full" disabled={downloading || busy} onClick={downloadReceipt}>{downloading ? "Preparing receipt…" : "Download payment receipt"}</Button>}</div>
        : ["cancelled", "expired"].includes(payment.status) ? <p className="text-sm">This request is {payment.status}. Please ask Accounts for a new payment link.</p>
        : <div className="space-y-3">{!payment.configured ? <p className="text-sm">Payments are not available on this link yet. Please contact Accounts.</p> : <Button className="w-full" disabled={busy} onClick={pay}>Pay {formatPaymentAmount(payment.amount_minor, payment.currency)}</Button>}
        </div>}
      {!!payment.receipt?.customer_fee_minor && <dl className="space-y-2 border-t pt-3 text-sm"><div className="flex justify-between gap-3"><dt>Request amount</dt><dd>{formatPaymentAmount(payment.receipt.request_amount_minor ?? payment.amount_minor, payment.currency)}</dd></div><div className="flex justify-between gap-3"><dt>Paystack fees</dt><dd>{formatPaymentAmount(payment.receipt.customer_fee_minor, payment.currency)}</dd></div><div className="flex justify-between gap-3 font-medium"><dt>Total paid</dt><dd>{formatPaymentAmount(payment.receipt.amount_minor, payment.currency)}</dd></div></dl>}
      {!paid && payment.current_attempt && <><p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-4 w-4" />If you have already paid, check your payment before trying again.</p><Button variant="outline" className="w-full" disabled={busy} onClick={refresh}>Check payment status</Button></>}
      {!paid && payment.status === "awaiting_payment" && <p className="text-xs text-muted-foreground">Paystack adds transaction fees to your total at checkout.</p>}
      <p className="flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Payment is handled securely by Paystack. Your card details are entered only on Paystack checkout.</p>
    </CardContent></Card>
  </div>;
}
