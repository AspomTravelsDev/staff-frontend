"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, RotateCcw, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/stats-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV, type ExportColumn } from "@/lib/utils/export";
import { getAllWorkFromHomeRequests, reviewWorkFromHomeRequest, revertWorkFromHomeRequest, type WorkFromHomeFilters, type WorkFromHomeRequest, type WorkFromHomeStats } from "@/lib/api/work-from-home";

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

type RequestExportRow = {
  staff_id: string;
  staff_name: string;
  department: string;
  email: string;
  start_date: string;
  end_date: string;
  weekdays: number;
  status: string;
  reason: string;
  reviewer: string;
  reviewer_note: string;
};

const exportColumns: ExportColumn<RequestExportRow>[] = [
  { header: "Staff ID", key: "staff_id" },
  { header: "Staff Name", key: "staff_name" },
  { header: "Department", key: "department" },
  { header: "Email", key: "email" },
  { header: "Start Date", key: "start_date" },
  { header: "End Date", key: "end_date" },
  { header: "Weekdays", key: "weekdays" },
  { header: "Status", key: "status" },
  { header: "Reason", key: "reason" },
  { header: "Reviewed By", key: "reviewer" },
  { header: "Reviewer Note", key: "reviewer_note" },
];

function displayDate(value: string) {
  try {
    return format(parseISO(value), "d MMM yyyy");
  } catch {
    return value;
  }
}

function requestStatusClass(status: WorkFromHomeRequest["status"]) {
  if (status === "approved") return "border-sky-200 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (status === "rejected") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (status === "pending") return "border-amber-200 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  return "";
}

export function WorkFromHomeReviewTable({
  initialRequests,
  pagination,
  stats,
  filters,
  loadError,
}: {
  initialRequests: WorkFromHomeRequest[];
  pagination: Pagination;
  stats: WorkFromHomeStats;
  filters: WorkFromHomeFilters;
  loadError: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(filters.search || "");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const dateRange = useMemo(() => ({
    from: filters.from ? parseISO(filters.from) : undefined,
    to: filters.to ? parseISO(filters.to) : undefined,
  }), [filters.from, filters.to]);

  useEffect(() => setSearch(filters.search || ""), [filters.search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search === (filters.search || "")) return;
      updateQuery({ search: search || null }, true);
    }, 300);
    return () => window.clearTimeout(timer);
  // updateQuery reads the latest URL values through the router hooks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateQuery(changes: Record<string, string | null>, resetPage = false) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPage) params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await getAllWorkFromHomeRequests({
        status: filters.status,
        from: filters.from,
        to: filters.to,
        search: filters.search,
      });
      if (!rows.length) {
        toast.info("No work-from-home requests match this export.");
        return;
      }
      const data: RequestExportRow[] = rows.map((request) => ({
        staff_id: request.user?.staff_id || "",
        staff_name: request.user?.name || "Staff",
        department: request.user?.department || "",
        email: request.user?.email || "",
        start_date: request.start_date,
        end_date: request.end_date,
        weekdays: request.days,
        status: request.status,
        reason: request.reason,
        reviewer: request.reviewer?.name || "",
        reviewer_note: request.reviewer_note || "",
      }));
      const rangeName = filters.from || filters.to ? `${filters.from || "start"}_to_${filters.to || "end"}` : "all-dates";
      exportToCSV(data, exportColumns, `work-from-home-${rangeName}`);
      toast.success(`Exported ${data.length} request${data.length === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export requests.");
    } finally {
      setExporting(false);
    }
  }

  async function review(request: WorkFromHomeRequest, status: "approved" | "rejected") {
    setBusyId(request.id);
    const result = await reviewWorkFromHomeRequest(request.id, { status });
    if (result.success) {
      toast.success(`Request ${status}.`);
      void queryClient.invalidateQueries({ queryKey: ["attendance-request-counts"] });
      router.refresh();
    } else {
      toast.error(result.error?.error || "Could not review the request.");
    }
    setBusyId(null);
  }

  async function revert(request: WorkFromHomeRequest) {
    setBusyId(request.id);
    const result = await revertWorkFromHomeRequest(request.id);
    if (result.success) {
      toast.success("Request returned to pending review.");
      void queryClient.invalidateQueries({ queryKey: ["attendance-request-counts"] });
      router.refresh();
    } else {
      toast.error(result.error?.error || "Could not return the request to pending.");
    }
    setBusyId(null);
  }

  const onDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    updateQuery({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
    }, true);
  };

  return (
    <div className="space-y-5">
      {loadError && <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Some request counts could not be loaded. Refresh to try again.</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" title="Requests in range" icon={Users} value={stats.total} description="Matching selected dates" onClick={() => updateQuery({ status: null }, true)} active={!filters.status || filters.status === "all"} iconClassName="text-muted-foreground" />
        <StatsCard className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" title="Pending review" icon={Clock} value={stats.pending} description="Awaiting HR review" onClick={() => updateQuery({ status: "pending" }, true)} active={filters.status === "pending"} iconClassName="text-orange-600" />
        <StatsCard className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" title="Approved" icon={CheckCircle2} value={stats.approved} description="Approved in this range" onClick={() => updateQuery({ status: "approved" }, true)} active={filters.status === "approved"} iconClassName="text-green-600" />
        <StatsCard className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" title="Days in approved requests" icon={CalendarDays} value={stats.approved_days} description="Approved work from home" iconClassName="text-blue-500" />
      </div>

      <section aria-label="Filter work-from-home requests" className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 space-y-1.5 lg:max-w-sm">
            <Label htmlFor="wfh-search" className="text-xs text-muted-foreground">Search staff</Label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="wfh-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, staff ID or department" className="h-10 pl-9" /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Request dates</Label>
            <DatePickerWithRange date={dateRange} setDate={onDateRangeChange} className="w-full sm:w-[280px]" />
          </div>
          <div className="space-y-1.5 sm:min-w-40">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filters.status || "all"} onValueChange={(value) => updateQuery({ status: value === "all" ? null : value }, true)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:min-w-32">
            <Label className="text-xs text-muted-foreground">Rows per page</Label>
            <Select value={String(filters.per_page || 10)} onValueChange={(value) => updateQuery({ per_page: value }, true)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10 rows</SelectItem><SelectItem value="25">25 rows</SelectItem><SelectItem value="50">50 rows</SelectItem></SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="h-10 shrink-0 gap-2" onClick={handleExport} disabled={exporting}>
            <Download className="size-4" />{exporting ? "Preparing…" : "Export range"}
          </Button>
        </div>
        {(filters.search || filters.status || filters.from || filters.to) && <div className="flex justify-end border-t pt-2"><Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => { setSearch(""); updateQuery({ status: "all", search: null, from: null, to: null, page: null }); }}><X className="size-4" />Clear filters</Button></div>}
      </section>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div><h2 className="text-sm font-semibold">Request history</h2><p className="text-xs text-muted-foreground">Review pending requests or inspect decisions already made.</p></div>
          <span className="text-xs tabular-nums text-muted-foreground">{pagination.total ? `${pagination.from}–${pagination.to} of ${pagination.total}` : "0 requests"}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Dates</TableHead><TableHead>Weekdays</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Reviewed by</TableHead><TableHead className="text-right">Review</TableHead></TableRow></TableHeader>
            <TableBody>
              {initialRequests.length ? initialRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell><div className="font-medium">{request.user?.name || "Staff"}</div><div className="text-xs text-muted-foreground">{[request.user?.staff_id, request.user?.department].filter(Boolean).join(" · ") || request.user?.email}</div></TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{displayDate(request.start_date)} – {displayDate(request.end_date)}</TableCell>
                  <TableCell className="tabular-nums">{request.days}</TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-sm">{request.reason}</TableCell>
                  <TableCell><Badge variant="outline" className={requestStatusClass(request.status)}>{request.status}</Badge></TableCell>
                  <TableCell className="text-sm">{request.reviewer?.name || "—"}{request.reviewer_note && <p className="max-w-48 truncate text-xs text-muted-foreground" title={request.reviewer_note}>{request.reviewer_note}</p>}</TableCell>
                  <TableCell className="text-right">{request.status === "pending" ? <div className="inline-flex gap-2"><Button size="sm" disabled={busyId === request.id} onClick={() => review(request, "approved")}><Check className="mr-1 size-4" />Approve</Button><Button size="sm" variant="outline" disabled={busyId === request.id} onClick={() => review(request, "rejected")}><X className="mr-1 size-4" />Decline</Button></div> : request.status === "approved" && request.start_date > new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }) ? <Button size="sm" variant="outline" disabled={busyId === request.id} onClick={() => revert(request)}><RotateCcw className="mr-1 size-4" />Revert to pending</Button> : <span className="text-xs text-muted-foreground">Reviewed</span>}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">{filters.search || filters.status || filters.from || filters.to ? "No requests match these filters." : "No work-from-home requests yet."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Page {pagination.current_page} of {pagination.last_page}</p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => updateQuery({ page: String(pagination.current_page - 1) })}><ChevronLeft className="mr-1 size-4" />Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => updateQuery({ page: String(pagination.current_page + 1) })}>Next<ChevronRight className="ml-1 size-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

