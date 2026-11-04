"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Clock, AlertTriangle, CircleAlert, CreditCard, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { getPaymentLinks, getPaymentLinkOptions, exportPaymentLinks } from "@/lib/api/payment-links";
import type { PaymentLink } from "@/lib/types/payment-links";
import { formatPaymentAmount, paymentStatusLabels } from "@/lib/types/payment-links";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { exportPaymentRows } from "@/lib/utils/payment-link-files";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { StatsCard } from "@/components/stats-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreatePaymentLinkDialog } from "./create-payment-link-dialog";
import { PaymentLinkDetailsSheet } from "./payment-link-details-sheet";
import { PaymentLinkActions } from "./payment-link-actions";
import { PaymentLinksGuide } from "./payment-links-guide";
import { DetailsTableRow } from "@/components/ui/details-table-row";

function PaymentFilter({ id, label, value, onChange, options, disabled }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
    <Select value={value || "all"} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="h-10 w-full bg-background"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}

export function PaymentLinksClient() {
  const queryClient = useQueryClient(); const router = useRouter(); const params = useSearchParams();
  const linkedId = params.get("request"); const invoiceId = params.get("invoice") || undefined;
  const linkedStatus = params.get("status");
  const [selectedId, setSelectedId] = useState<string | null>(linkedId);
  const [createOpen, setCreateOpen] = useState(!!invoiceId);
  const [replacing, setReplacing] = useState<PaymentLink | undefined>();
  const [status, setStatus] = useState(params.get("status") || "all");
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [subsidiary, setSubsidiary] = useState(""); const [dateRange, setDateRange] = useState<DateRange>();
  const [currency, setCurrency] = useState(""); const [createdBy, setCreatedBy] = useState("");
  const [exporting, setExporting] = useState(false);
  useEffect(() => { startTransition(() => setSelectedId(linkedId)); }, [linkedId]);
  useEffect(() => { if (invoiceId) startTransition(() => setCreateOpen(true)); }, [invoiceId]);
  useEffect(() => { if (linkedStatus) startTransition(() => { setStatus(linkedStatus); setPage(1); }); }, [linkedStatus]);
  const filters = {
    status, search, ...(subsidiary ? { subsidiary } : {}), ...(currency ? { currency } : {}),
    ...(createdBy ? { created_by_id: createdBy } : {}),
    ...(dateRange?.from ? { from: format(dateRange.from, "yyyy-MM-dd") } : {}),
    ...(dateRange?.to ? { to: format(dateRange.to, "yyyy-MM-dd") } : {}),
  };
  const query = useQuery({
    queryKey: ["payment-links", filters, page, pageSize], placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await getPaymentLinks({ ...filters, page: String(page), page_size: String(pageSize) });
      if (!res.success) throw new Error(res.error.error); return res.data;
    }, refetchInterval: 60_000,
  });
  const staffOptions = useQuery({ queryKey: ["payment-link-options", ""], enabled: !!query.data?.can_manage, queryFn: async () => {
    const res = await getPaymentLinkOptions(); if (!res.success) throw new Error(res.error.error); return res.data;
  } });
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["payment-links"] }); void queryClient.invalidateQueries({ queryKey: ["notifications"] }); };
  const removeParam = (key: string) => { const next = new URLSearchParams(params); next.delete(key); router.replace(`${window.location.pathname}?${next}`, { scroll: false }); };
  const closeCreate = () => { setCreateOpen(false); setReplacing(undefined); if (invoiceId) removeParam("invoice"); };
  const exportRows = async (fileFormat: "csv" | "xlsx") => {
    setExporting(true);
    try {
      const res = await exportPaymentLinks(filters); if (!res.success) throw new Error(res.error.error);
      if (!res.data.rows.length) { toast.info("No matching requests to export."); return; }
      await exportPaymentRows(res.data.rows, fileFormat);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Export failed."); }
    finally { setExporting(false); }
  };
  const clearFilters = () => { setStatus("all"); setSubsidiary(""); setCurrency(""); setCreatedBy(""); setDateRange(undefined); setSearch(""); setPage(1); };
  const pagination = query.data?.pagination;
  return <div className="w-full space-y-4">
    <div id="payment-links-header" className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Payment Links</h1><p className="mt-1 text-sm text-muted-foreground">{query.data?.can_manage ? "Request client payments and follow their progress." : query.data?.can_view_all ? "View company payment requests and their progress." : "Follow payment requests for your clients."}</p></div>
      <div className="flex flex-wrap gap-2">
        <PaymentLinksGuide canManage={query.data?.can_manage || false} canViewAll={query.data?.can_view_all || false} />
        <Button variant="ghost" size="sm" onClick={refresh} disabled={query.isFetching}><RefreshCw className="h-4 w-4" />Refresh</Button>
        {query.data?.can_manage && <Button id="payment-links-create" size="sm" onClick={() => { setReplacing(undefined); setCreateOpen(true); }}><Plus className="h-4 w-4" />Create link</Button>}
      </div>
    </div>
    {query.isLoading ? <p className="py-8 text-sm text-muted-foreground">Loading payment requests…</p>
      : query.isError ? <div role="alert" className="rounded-lg border p-4"><p className="text-sm">{query.error.message}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => query.refetch()}>Try again</Button></div>
      : query.data && <>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={query.data.mode === "test" ? "secondary" : "outline"}>{query.data.mode === "test" ? "Test mode" : "Live payments"}</Badge>
          {query.data.mode === "test" && <span className="text-muted-foreground">{query.data.test_accounting_enabled ? "Test payments can update invoices and Aspom Travel confirmations. No real money is collected." : "Test receipts do not change accounting balances."}</span>}
          {!query.data.configured && <span className="text-amber-700 dark:text-amber-400">Paystack setup is required before clients can pay.</span>}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatsCard title="Awaiting payment" value={query.data.stats.awaiting} icon={Clock} className="gap-2 shadow-none" />
          <StatsCard title="Needs attention" value={query.data.stats.attention} icon={CircleAlert} className="gap-2 shadow-none" />
          <StatsCard title="Overdue requests" value={query.data.stats.overdue} icon={AlertTriangle} className="gap-2 shadow-none" />
          <StatsCard title={query.data.mode === "test" ? "Test receipts this month" : "Received this month"} value={formatPaymentAmount(query.data.stats.received_minor.NGN)} description={formatPaymentAmount(query.data.stats.received_minor.USD, "USD")} icon={CreditCard} className="gap-2 shadow-none" />
        </div>
        <div id="payment-links-filters" className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5"><Label htmlFor="payment-links-search" className="text-xs text-muted-foreground">Search</Label><Input id="payment-links-search" className="h-10 bg-background" placeholder="Client, purpose or reference…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <Button size="sm" variant="outline" className="h-10" onClick={clearFilters}>Clear filters</Button>
            {query.data.can_manage && <Popover><PopoverTrigger asChild><Button size="sm" variant="outline" className="h-10" disabled={exporting || query.isPlaceholderData}><Download className="h-4 w-4" />Export</Button></PopoverTrigger><PopoverContent className="w-40 gap-1" align="end"><Button size="sm" variant="ghost" onClick={() => exportRows("xlsx")}>Excel (.xlsx)</Button><Button size="sm" variant="ghost" onClick={() => exportRows("csv")}>CSV</Button></PopoverContent></Popover>}
          </div>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <PaymentFilter id="payment-links-status" label="Status" value={status} onChange={value => { setStatus(value); setPage(1); }} options={[
              { value: "all", label: "All statuses" }, ...["needs_attention", "awaiting_payment", "paid", "cancelled", "expired"].map(value => ({ value, label: paymentStatusLabels[value as keyof typeof paymentStatusLabels] })),
              { value: "overdue", label: "Overdue" }, ...(status === "action_required" ? [{ value: "action_required", label: "Waiting & needs attention" }] : []),
            ]} />
            <PaymentFilter id="payment-links-subsidiary" label="Subsidiary" value={subsidiary} onChange={value => { setSubsidiary(value === "all" ? "" : value); setPage(1); }} options={[{ value: "all", label: "All subsidiaries" }, { value: "aspom", label: "Aspom" }, { value: "travelatal", label: "Travelatal" }, { value: "abs", label: "ABS" }]} />
            <PaymentFilter id="payment-links-currency" label="Currency" value={currency} onChange={value => { setCurrency(value === "all" ? "" : value); setPage(1); }} options={[{ value: "all", label: "All currencies" }, { value: "NGN", label: "NGN" }, { value: "USD", label: "USD" }]} />
            {query.data.can_manage && <PaymentFilter id="payment-links-creator" label="Created by" value={createdBy} onChange={value => { setCreatedBy(value === "all" ? "" : value); setPage(1); }} disabled={staffOptions.isLoading || staffOptions.isError} options={[{ value: "all", label: staffOptions.isError ? "Staff list unavailable" : "All staff" }, ...(staffOptions.data?.staff || []).map(user => ({ value: user.id, label: user.name }))]} />}
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground" htmlFor="date">Created dates</Label><DatePickerWithRange date={dateRange} setDate={value => { setDateRange(value); setPage(1); }} className="w-full" /></div>
          </div>
        </div>
        <div className="space-y-3">
          <div id="payment-links-table" className="overflow-hidden rounded-md border bg-card" aria-busy={query.isFetching}>
            <Table className="min-w-[850px]">
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Purpose / invoice</TableHead><TableHead>Amount</TableHead><TableHead>Created by</TableHead><TableHead>Due date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{query.data.data.length ? query.data.data.map(link => <DetailsTableRow key={link.id} detailLabel={`Open payment link details for ${link.client_name}`} onOpenDetails={() => setSelectedId(link.id)}>
                <TableCell><p className="font-medium">{link.client_name}</p><p className="text-xs text-muted-foreground">{link.reference}</p></TableCell>
                <TableCell className="max-w-[230px] whitespace-normal"><button className="text-left font-medium hover:underline" onClick={() => setSelectedId(link.id)}>{link.purpose}</button>{link.invoice && <p className="mt-1 text-xs text-muted-foreground">{link.invoice.invoice_number}</p>}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPaymentAmount(link.amount_minor, link.currency)}</TableCell>
                <TableCell className="text-sm">{link.creator?.name || "Staff unavailable"}<p className="text-xs text-muted-foreground">{formatReadableDate(link.created_at, { includeTime: false })}</p></TableCell>
                <TableCell className="max-w-[160px] whitespace-normal text-xs">{link.due_at ? formatReadableDate(link.due_at) : "Not set"}</TableCell>
                <TableCell><Badge variant="outline" className={link.effective_status === "needs_attention" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300" : link.effective_status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : ""}>{paymentStatusLabels[link.effective_status]}</Badge></TableCell>
                <TableCell><div className="flex justify-end"><PaymentLinkActions link={link} canManage={query.data.can_manage} onDetails={() => setSelectedId(link.id)} onReplace={() => { setReplacing(link); setCreateOpen(true); }} onUpdated={refresh} /></div></TableCell>
              </DetailsTableRow>) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No payment requests found.</TableCell></TableRow>}</TableBody>
            </Table>
          </div>
          {pagination && <div id="payment-links-pagination" className="flex flex-col gap-3 px-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {pagination.from}–{pagination.to} of {pagination.total} requests</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5"><Label htmlFor="payment-links-page-size" className="text-xs font-normal">Rows per page:</Label><Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value)); setPage(1); }}><SelectTrigger id="payment-links-page-size" className="h-8 w-20 bg-background"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100].map(size => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-center gap-1"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1 || query.isFetching}><ChevronLeft className="h-4 w-4" /><span className="sr-only">Previous page</span></Button><span className="px-2 font-medium text-foreground">Page {pagination.page} of {pagination.total_pages}</span><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= pagination.total_pages || query.isFetching}><ChevronRight className="h-4 w-4" /><span className="sr-only">Next page</span></Button></div>
            </div>
          </div>}
        </div>
      </>}
    {createOpen && query.data?.can_manage && <CreatePaymentLinkDialog key={replacing?.id || invoiceId || "new"} invoiceId={invoiceId} replacing={replacing} onClose={closeCreate} onCreated={link => { closeCreate(); setSelectedId(link.id); refresh(); }} />}
    {selectedId && <PaymentLinkDetailsSheet key={selectedId} id={selectedId} canManage={query.data?.can_manage || false} onClose={() => { setSelectedId(null); if (linkedId) removeParam("request"); }} />}
  </div>;
}
