"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPaymentLinkCheckout, sharePaymentLink } from "@/lib/api/payment-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentLinkCopyField({ id, onCopied }: { id: string; onCopied: () => void }) {
  const [copying, setCopying] = useState(false);
  const checkout = useQuery({
    queryKey: ["payment-link-checkout", id],
    queryFn: async () => {
      const result = await getPaymentLinkCheckout(id);
      if (!result.success) throw new Error(result.error.error);
      return result.data;
    },
    // Recheck availability when the sheet opens; reuse the pending Paystack URL on the server.
    staleTime: 0, gcTime: 0, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });

  const copy = async () => {
    if (!checkout.data || checkout.isFetching || checkout.isError || copying) return;
    setCopying(true);
    let copied = false;
    try {
      // The link is ready before this click, so clipboard access keeps the user's gesture.
      await navigator.clipboard.writeText(checkout.data.url);
      copied = true;
      const result = await sharePaymentLink(id, "copy", checkout.data.reference);
      if (!result.success) throw new Error(result.error.error);
      toast.success("Paystack link copied");
    } catch (error) {
      if (copied) toast.warning("Link copied, but sharing history could not be saved.", {
        description: error instanceof Error ? error.message : "Please refresh the request.",
      });
      else toast.error("Could not copy the link. Select it and copy it manually.");
    } finally {
      setCopying(false);
      if (copied) onCopied();
    }
  };

  return <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
    <Label htmlFor={`payment-link-${id}`}>Paystack payment link</Label>
    <div className="flex items-center gap-2">
      <Input id={`payment-link-${id}`} readOnly value={checkout.isError ? "" : checkout.data?.url || ""}
        placeholder={checkout.isFetching ? "Preparing payment link…" : "Payment link unavailable"}
        onFocus={event => event.currentTarget.select()} className="h-9 min-w-0 bg-background" />
      <Button type="button" variant="outline" className="h-9" onClick={copy}
        disabled={!checkout.data || checkout.isFetching || checkout.isError || copying}>
        {copying || checkout.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
        {copying ? "Copying…" : "Copy"}
      </Button>
    </div>
    {checkout.isError ? <div className="space-y-2">
      <p role="alert" className="text-xs text-destructive">{checkout.error.message}</p>
      <Button type="button" variant="outline" size="sm" disabled={checkout.isFetching} onClick={() => void checkout.refetch()}>Try again</Button>
    </div> : checkout.isFetching ? <p role="status" className="text-xs text-muted-foreground">Preparing the direct Paystack link…</p>
      : <p className="text-xs text-muted-foreground">Copy this link to send to the client.</p>}
  </section>;
}
