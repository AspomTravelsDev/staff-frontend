"use client";
import { useEffect, useState, startTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPaymentLink, getPaymentLinkOptions } from "@/lib/api/payment-links";
import { getInvoice } from "@/lib/api/invoices";
import type { NewPaymentLink, PaymentLink } from "@/lib/types/payment-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const selectStyle = "h-9 w-full rounded-md border bg-background px-3 text-sm";
export function CreatePaymentLinkDialog({ onClose, onCreated, invoiceId, replacing }: { onClose: () => void; onCreated: (link: PaymentLink) => void; invoiceId?: string; replacing?: PaymentLink }) {
  const queryClient = useQueryClient();
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [source, setSource] = useState(invoiceId || replacing?.invoice_id ? "invoice" : "client");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewPaymentLink>({ purpose: replacing?.purpose || "", amount: replacing ? (replacing.amount_minor / 100).toFixed(2) : "",
    subsidiary: replacing?.subsidiary || "aspom", invoice_id: replacing?.invoice_id || invoiceId, crm_client_id: replacing?.crm_client_id || undefined,
    client_email: replacing?.client_email || "", currency: replacing?.currency === "USD" ? "USD" : "NGN", responsible_user_id: replacing?.responsible_user_id || undefined, replaces_id: replacing?.id });
  const options = useQuery({ queryKey: ["payment-link-options", search], queryFn: async () => { const res = await getPaymentLinkOptions(search); if (!res.success) throw new Error(res.error.error); return res.data; } });
  const invoice = useQuery({ queryKey: ["payment-link-invoice", invoiceId], enabled: !!invoiceId && !replacing, queryFn: async () => { const res = await getInvoice(invoiceId!); if (!res.success || !res.data) throw new Error(res.error); return res.data; } });
  useEffect(() => { if (invoice.data) startTransition(() => setForm(prev => ({ ...prev, invoice_id: invoice.data!.id, purpose: "Invoice " + invoice.data!.invoice_number, amount: String(invoice.data!.balance_due), client_email: invoice.data!.client_email || "", currency: invoice.data!.currency ?? "NGN", subsidiary: invoice.data!.subsidiary }))); }, [invoice.data]);
  const update = (key: keyof NewPaymentLink, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const isNewCustomer = source === "client" && addingCustomer;
      const res = await createPaymentLink({ ...form, responsible_user_id: form.responsible_user_id || null, currency: form.currency, invoice_id: source === "invoice" ? form.invoice_id : undefined, crm_client_id: source === "client" ? form.crm_client_id : undefined,
        ...(isNewCustomer ? { crm_client_id: undefined, new_customer_name: customer.name.trim(), client_email: customer.email.trim() } : {}),
        due_at: form.due_at ? new Date(form.due_at + "+01:00").toISOString() : undefined,
        expires_at: form.expires_at ? new Date(form.expires_at + "+01:00").toISOString() : undefined });
      if (!res.success) { toast.error(res.error.error); return; }
      if (isNewCustomer) void queryClient.invalidateQueries({ queryKey: ["payment-link-options"] });
      toast.success("Payment link created"); onCreated(res.data.data);
    } catch { toast.error("Could not create the payment link. Please try again."); } finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{replacing ? "Replace payment request" : "Create payment link"}</DialogTitle><DialogDescription>{replacing ? "A new request will replace the old link and keep its history." : "Request a fixed payment or deposit. Client email is required for Paystack."}</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <div className={source === "client" && addingCustomer ? "grid gap-3" : "grid grid-cols-2 gap-3"}><div className="space-y-1.5"><Label htmlFor="payment-source">Request for</Label><select id="payment-source" className={selectStyle} value={source} disabled={saving} onChange={e => { setSource(e.target.value); setForm(prev => ({ ...prev, invoice_id: undefined, crm_client_id: undefined })); }}><option value="client">Client payment</option><option value="invoice">Existing invoice</option></select></div>{!(source === "client" && addingCustomer) && <div className="space-y-1.5"><Label htmlFor="payment-search">{source === "client" ? "Find client" : "Find invoice"}</Label><Input id="payment-search" value={search} disabled={saving} onChange={e => setSearch(e.target.value)} placeholder={source === "client" ? "Search name or email" : "Search name or number"} /></div>}</div>
      {options.isError && <p role="alert" className="text-sm text-destructive">{options.error.message}</p>}
      {invoice.isError && <p role="alert" className="text-sm text-destructive">{invoice.error.message}</p>}
      <div className="space-y-1.5"><div className="flex items-center justify-between gap-2"><Label htmlFor={source === "client" && addingCustomer ? "payment-new-customer-name" : "payment-record"}>{source === "invoice" ? "Invoice" : addingCustomer ? "Customer name" : "Client"}</Label>{source === "client" && <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setAddingCustomer(prev => !prev)}>{addingCustomer ? "Choose existing customer" : "Add new customer"}</Button>}</div>
        {source === "invoice" ? <select id="payment-record" required className={selectStyle} value={form.invoice_id || ""} disabled={saving || options.isLoading} onChange={e => { const selected = options.data?.invoices.find(i => i.id === e.target.value); if (selected) setForm(prev => ({ ...prev, invoice_id: selected.id, purpose: "Invoice " + selected.invoice_number, amount: String(selected.balance_due), client_email: selected.client_email || "", currency: selected.currency ?? "NGN", subsidiary: selected.subsidiary })); }}>
          <option value="">Choose invoice</option>{form.invoice_id && !options.data?.invoices.some(i => i.id === form.invoice_id) && <option value={form.invoice_id}>{invoice.data?.invoice_number || replacing?.invoice?.invoice_number || "Selected invoice"}</option>}{options.data?.invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_number} · {i.client_name} · {i.currency ?? "NGN"} {i.balance_due} remaining</option>)}
        </select> : addingCustomer ? <Input id="payment-new-customer-name" required maxLength={255} autoComplete="name" value={customer.name} disabled={saving} onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))} /> : <select id="payment-record" required className={selectStyle} value={form.crm_client_id || ""} disabled={saving || options.isLoading} onChange={e => { const client = options.data?.clients.find(c => c.id === e.target.value); if (client) setForm(prev => ({ ...prev, crm_client_id: client.id, client_email: client.email || "", responsible_user_id: client.assigned_to || undefined })); else setForm(prev => ({ ...prev, crm_client_id: undefined })); }}>
          <option value="">Choose client</option>{form.crm_client_id && !options.data?.clients.some(c => c.id === form.crm_client_id) && <option value={form.crm_client_id}>{replacing?.client_name || "Selected client"}</option>}{options.data?.clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ""}</option>)}
        </select>}
      </div>
      <div className="space-y-1.5"><Label htmlFor="payment-email">{source === "client" && addingCustomer ? "Email" : "Client email"}</Label><Input id="payment-email" required type="email" maxLength={255} value={source === "client" && addingCustomer ? customer.email : form.client_email || ""} onChange={e => source === "client" && addingCustomer ? setCustomer(prev => ({ ...prev, email: e.target.value })) : update("client_email", e.target.value)} disabled={saving} /></div>
      {source === "client" && addingCustomer && <p className="text-xs text-muted-foreground">The customer will be saved to the CRM when you create this payment link.</p>}
      <div className="space-y-1.5"><Label htmlFor="payment-purpose">Payment purpose</Label><Input id="payment-purpose" required maxLength={255} value={form.purpose ?? ""} onChange={e => update("purpose", e.target.value)} placeholder="e.g. Visa processing deposit" disabled={saving} /></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="payment-currency">Currency</Label><select id="payment-currency" className={selectStyle} value={form.currency ?? "NGN"} disabled={saving || source === "invoice"} onChange={e => update("currency", e.target.value)}><option value="NGN">NGN — Naira</option><option value="USD">USD — US dollar</option></select></div><div className="space-y-1.5"><Label htmlFor="payment-amount">Amount ({form.currency ?? "NGN"})</Label><Input id="payment-amount" required type="number" min={form.currency === "USD" ? "2" : "50"} step="0.01" value={form.amount ?? ""} onChange={e => update("amount", e.target.value)} disabled={saving} /></div></div>
      {form.currency === "USD" && <p className="text-xs text-muted-foreground">USD collection must be enabled on the connected Paystack account, including for test checkout. Contact Paystack support if test USD access is unavailable. Minimum USD 2.00.</p>}
      <div className="space-y-1.5"><Label htmlFor="payment-subsidiary">Subsidiary</Label><select id="payment-subsidiary" className={selectStyle} value={form.subsidiary || "aspom"} onChange={e => update("subsidiary", e.target.value)} disabled={saving || source === "invoice"}><option value="aspom">Aspom</option><option value="travelatal">Travelatal</option><option value="abs">ABS</option></select></div>
      <div className="space-y-1.5"><Label htmlFor="payment-owner">Responsible staff (optional)</Label><select id="payment-owner" className={selectStyle} value={form.responsible_user_id || ""} onChange={e => update("responsible_user_id", e.target.value)} disabled={saving}><option value="">None</option>{options.data?.staff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="payment-due">Due date (optional)</Label><Input id="payment-due" type="datetime-local" value={form.due_at || ""} onChange={e => update("due_at", e.target.value)} disabled={saving} /></div><div className="space-y-1.5"><Label htmlFor="payment-expiry">Request expires (optional)</Label><Input id="payment-expiry" type="datetime-local" value={form.expires_at || ""} onChange={e => update("expires_at", e.target.value)} disabled={saving} /></div></div>
      <p className="text-xs text-muted-foreground">Clients pay Paystack fees on top of the requested amount. Paystack calculates the total at checkout.</p>
      <p className="text-xs text-muted-foreground">Dates use Lagos time. Expiry stops generating and sharing links in the portal. Paystack links already shared may still accept payment; later payments need Accounts review.</p>
      <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Back</Button><Button disabled={saving || options.isLoading || invoice.isLoading && !!invoiceId || invoice.isError && source === "invoice"}>{saving ? "Creating…" : "Create link"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
