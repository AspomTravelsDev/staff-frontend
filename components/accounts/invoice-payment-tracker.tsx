"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getInvoicePayments, recordInvoicePayment, type Invoice, type InvoicePayment } from "@/lib/api/invoices";

interface InvoicePaymentTrackerProps {
  invoice: Invoice;
  onInvoiceUpdated: (invoice: Invoice) => void;
  onDataChanged: () => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
}).format(amount);

export function InvoicePaymentTracker({ invoice, onInvoiceUpdated, onDataChanged }: InvoicePaymentTrackerProps) {
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("BANK TRANSFER");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInvoicePayments(invoice.id);
      if (result.success) setPayments(result.data || []);
      else toast.error(result.error || "Failed to load payment history");
    } catch (error) {
      console.error("Failed to load invoice payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const paidAmount = Number(invoice.deposit || 0);
  const balanceDue = Math.max(0, Number(invoice.subtotal || 0) - paidAmount);

  const handleRecordPayment = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a payment amount greater than zero");
      return;
    }
    if (parsedAmount > balanceDue) {
      toast.error("Payment cannot exceed the outstanding balance");
      return;
    }
    if (!paymentDate || !paymentMethod.trim()) {
      toast.error("Payment date and method are required");
      return;
    }

    setSaving(true);
    try {
      const result = await recordInvoicePayment(invoice.id, {
        amount: parsedAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to record payment");
        return;
      }

      setPayments((current) => [result.data!.payment, ...current]);
      onInvoiceUpdated(result.data.invoice);
      onDataChanged();
      setAmount("");
      setReference("");
      setNote("");
      setShowForm(false);
      toast.success("Payment recorded");
    } catch (error) {
      console.error("Failed to record invoice payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-xs border-slate-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">
            Payments
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Each payment is recorded against this saved invoice.</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowForm((open) => !open)}
          disabled={balanceDue <= 0 || saving}
          className="gap-1.5"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "Record Payment"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Invoice Total</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(Number(invoice.subtotal))}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Paid</p>
            <p className="text-sm font-bold tabular-nums text-emerald-700">{formatCurrency(paidAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Balance Due</p>
            <p className="text-sm font-bold tabular-nums text-amber-700">{formatCurrency(balanceDue)}</p>
          </div>
        </div>

        {showForm && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="invoice-payment-amount">Amount (NGN)</Label>
                <Input
                  id="invoice-payment-amount"
                  type="number"
                  min="0.01"
                  max={balanceDue}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-payment-date">Payment Date</Label>
                <Input
                  id="invoice-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-payment-method">Payment Method</Label>
                <Input
                  id="invoice-payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  placeholder="e.g. BANK TRANSFER"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-payment-reference">Reference (optional)</Label>
                <Input
                  id="invoice-payment-reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Transaction or receipt reference"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="invoice-payment-note">Note (optional)</Label>
                <Textarea
                  id="invoice-payment-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-16"
                  placeholder="Additional payment details"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleRecordPayment} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Payment
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment History</h4>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading payment history…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {payment.payment_date || "Date not recorded"}
                      {payment.payment_method ? ` · ${payment.payment_method}` : ""}
                    </p>
                    {(payment.reference || payment.note) && (
                      <p className="text-xs text-muted-foreground break-words">
                        {[payment.reference, payment.note].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {payment.recorded_by?.name && (
                      <p className="text-[10px] text-muted-foreground">Recorded by {payment.recorded_by.name}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums text-emerald-700">{formatCurrency(Number(payment.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
