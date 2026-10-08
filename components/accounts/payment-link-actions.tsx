"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cancelPaymentLink, checkPaymentAttempt, getPaymentLink, getPaymentLinkCheckout, sharePaymentLink } from "@/lib/api/payment-links";
import type { PaymentLink } from "@/lib/types/payment-links";
import { formatPaymentAmount, paymentReviewDescription } from "@/lib/types/payment-links";
import { downloadPaymentReceipt, downloadFile } from "@/lib/utils/payment-link-files";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { QRCodeImage } from "@/components/ui/qr-code-image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function PaymentLinkActions({ link, canManage, onDetails, onReplace, onUpdated }: { link: PaymentLink; canManage: boolean; onDetails: () => void; onReplace: () => void; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrCheckout, setQrCheckout] = useState<{ url: string; reference: string } | null>(null);
  const unpaid = link.effective_status === "awaiting_payment";
  const run = async (action: () => Promise<void>) => { setOpen(false); setBusy(true); try { await action(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not complete this action."); } finally { setBusy(false); } };
  const recordShare = async (channel: "copy" | "email" | "whatsapp" | "qr", reference?: string) => { const result = await sharePaymentLink(link.id, channel, reference); if (!result.success) throw new Error(result.error.error); onUpdated(); };
  const checkout = async () => {
    const result = await getPaymentLinkCheckout(link.id);
    if (!result.success) throw new Error(result.error.error);
    return result.data;
  };
  const copy = async () => {
    const payment = await checkout();
    await navigator.clipboard.writeText(payment.url);
    await recordShare("copy", payment.reference);
    toast.success("Paystack link copied");
  };
  const showQr = async () => {
    setQrUrl(null);
    const payment = await checkout();
    setQrCheckout(payment); setQrOpen(true);
  };
  const whatsapp = () => {
    // Reserve the tab during the click so browser popup blockers do not block the async response.
    const popup = window.open("about:blank", "_blank");
    if (!popup) { toast.error("Allow pop-ups to prepare the WhatsApp message."); return; }
    popup.opener = null;
    popup.document.title = "Preparing WhatsApp";
    popup.document.body.textContent = "Preparing your payment message…";
    void run(async () => {
      let payment;
      try { payment = await checkout(); } catch (error) { popup.close(); throw error; }
      if (popup.closed) return;
      const message = `${link.mode === "test" ? "TEST ONLY: No real money is collected.\n" : ""}Hello ${link.client_name}, please pay ${formatPaymentAmount(link.amount_minor, link.currency)} for ${link.purpose}. Reference: ${link.reference}\n${payment.url}`;
      popup.location.replace(`https://wa.me/?text=${encodeURIComponent(message)}`);
      await recordShare("whatsapp", payment.reference);
    });
  };
  const check = async () => {
    const detail = await getPaymentLink(link.id); if (!detail.success) throw new Error(detail.error.error);
    const latest = detail.data.data.attempts?.[0]; if (!latest) { toast.info("No payment attempts yet."); return; }
    const result = await checkPaymentAttempt(link.id, latest.id); if (!result.success) throw new Error(result.error.error);
    const state = result.data.data.effective_status;
    if (state === "paid") toast.success("Payment verified as paid");
    else if (state === "needs_attention") toast.warning("Payment requires review", { description: paymentReviewDescription(result.data.data), duration: 10000 });
    else if (state === "awaiting_payment") toast.info("Payment is still awaiting confirmation.");
    else toast.info("Payment status checked");
    onUpdated();
  };
  const receipt = async () => {
    const result = await getPaymentLink(link.id); if (!result.success) throw new Error(result.error.error);
    const payment = result.data.data.receipt_document;
    if (!payment?.receipt) throw new Error("No verified receipt is available yet.");
    await downloadPaymentReceipt(payment);
  };
  const qr = async () => {
    if (!qrUrl || !qrCheckout) return;
    const response = await fetch(qrUrl); if (!response.ok) throw new Error("Could not download the QR code. Please try again.");
    downloadFile(await response.blob(), link.reference + "-qr.png"); await recordShare("qr", qrCheckout.reference);
  };
  return <>
    <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button size="sm" variant="outline" disabled={busy} aria-label={`Actions for ${link.reference}`}>Actions<ChevronDown className="h-3.5 w-3.5" /></Button></PopoverTrigger><PopoverContent align="end" className="w-56 gap-1" onCloseAutoFocus={e => e.preventDefault()}>
      <Button size="sm" variant="ghost" className="justify-start" onClick={() => { setOpen(false); onDetails(); }}>View details and history</Button>
      {canManage && unpaid && <>
        <Button size="sm" variant="ghost" className="justify-start" onClick={() => run(copy)}>Copy payment link</Button>
        <Button size="sm" variant="ghost" className="justify-start" onClick={() => run(async () => { await recordShare("email"); toast.success("Payment email sent"); })}>Email client</Button>
        <Button size="sm" variant="ghost" className="justify-start" onClick={whatsapp}>Prepare WhatsApp message</Button>
        <Button size="sm" variant="ghost" className="justify-start" onClick={() => run(showQr)}>Show / download QR code</Button>
      </>}
      {canManage && (link.effective_status !== "cancelled" || link.attempts_exists) && <Button size="sm" variant="ghost" className="justify-start" onClick={() => run(check)}>Check payment status</Button>}
      {["paid", "needs_attention"].includes(link.effective_status) && <Button size="sm" variant="ghost" className="justify-start" onClick={() => run(receipt)}>Download receipt</Button>}
      {canManage && ["awaiting_payment", "expired", "cancelled"].includes(link.effective_status) && <Button size="sm" variant="ghost" className="justify-start" onClick={() => { setOpen(false); onReplace(); }}>Create replacement</Button>}
      {canManage && ["awaiting_payment", "expired"].includes(link.effective_status) && <Button size="sm" variant="ghost" className="justify-start text-destructive" onClick={() => { setOpen(false); setCancelOpen(true); }}>Cancel request</Button>}
    </PopoverContent></Popover>
    <Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent><DialogHeader><DialogTitle>Payment QR code</DialogTitle><DialogDescription>Scan to pay directly on Paystack. Request: {link.reference}.</DialogDescription></DialogHeader>{qrCheckout && <div className="flex justify-center"><QRCodeImage key={qrCheckout.url} value={qrCheckout.url} alt={`Paystack QR code for ${link.reference}`} onReady={setQrUrl} /></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setQrOpen(false)}>Close</Button><Button disabled={!qrUrl || !qrCheckout || busy} onClick={() => run(qr)}>{busy ? "Downloading…" : "Download QR code"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={cancelOpen} onOpenChange={value => { if (!busy) setCancelOpen(value); }}><DialogContent><DialogHeader><DialogTitle>Cancel payment request</DialogTitle><DialogDescription>The portal will stop generating and sharing links for this request. A Paystack link already shared may still accept payment; any later payment will be flagged for Accounts.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(async () => { const result = await cancelPaymentLink(link.id, reason.trim()); if (!result.success) throw new Error(result.error.error); setCancelOpen(false); toast.success("Request cancelled"); onUpdated(); }); }}><Label htmlFor={`cancel-${link.id}`}>Reason</Label><Textarea id={`cancel-${link.id}`} required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /><DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setCancelOpen(false)}>Back</Button><Button variant="destructive" disabled={busy || !reason.trim()}>{busy ? "Cancelling…" : "Cancel request"}</Button></DialogFooter></form></DialogContent></Dialog>
  </>;
}
