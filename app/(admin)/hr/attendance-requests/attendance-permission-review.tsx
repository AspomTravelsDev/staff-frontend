"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  getLatePermissionReviewQueue,
  reviewLatePermissionRequest,
  LatePermissionRequestItem,
} from "@/lib/api/clock-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { getInitials } from "@/lib/utils";
import { LateRequestDetailsSheet } from "@/components/late-request-details-sheet";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";
type SortField = "request_date" | "staff" | "status";
type Summary = { total: number; pending: number; approved: number; rejected: number; cancelled: number };

const emptySummary: Summary = { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };

function requestDescription(request: LatePermissionRequestItem) {
  if (["half_day", "early_departure"].includes(request.request_type || "")) return `Half day · ${request.expected_clock_out_time || "Time not specified"}`;
  return `Late arrival · ${request.expected_arrival_time || "Time not specified"}`;
}

function statusClass(status: LatePermissionRequestItem["status"]) {
  if (status === "approved") return "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300";
  if (status === "rejected") return "border-red-300 bg-red-500/10 text-red-700 dark:border-red-800 dark:text-red-300";
  if (status === "cancelled") return "border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-800 dark:text-slate-300";
  return "border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-800 dark:text-amber-300";
}

export function AttendancePermissionReview({ requestType, embedded = false, canReview = false }: { requestType?: "half_day" | "late_arrival"; embedded?: boolean; canReview?: boolean }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LatePermissionRequestItem[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: null as number | null, to: null as number | null });
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [settledSearch, setSettledSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("25");
  const [sortBy, setSortBy] = useState<SortField>("request_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LatePermissionRequestItem | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [reviewerNote, setReviewerNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [sheetRequest, setSheetRequest] = useState<LatePermissionRequestItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLatePermissionReviewQueue({
        request_type: requestType,
        status: status === "all" ? undefined : status,
        from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        search: settledSearch || undefined,
        page,
        per_page: Number(perPage),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      const payload = res.success ? res.data.data : undefined;
      const records = payload?.requests;
      setRequests(records?.data || []);
      setSummary(payload?.summary || emptySummary);
      setPagination({
        currentPage: records?.current_page || 1,
        lastPage: records?.last_page || 1,
        total: records?.total || 0,
        from: records?.from || null,
        to: records?.to || null,
      });
    } catch {
      toast.error("Could not load attendance requests.");
      setRequests([]);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  }, [requestType, status, dateRange, settledSearch, page, perPage, sortBy, sortOrder]);

  useEffect(() => { void fetchQueue(); }, [fetchQueue]);

  const openReviewModal = (request: LatePermissionRequestItem, action: "approved" | "rejected") => {
    setSelectedRequest(request);
    setActionType(action);
    setReviewerNote("");
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const res = await reviewLatePermissionRequest(selectedRequest.id, {
        status: actionType,
        reviewer_note: reviewerNote.trim() || undefined,
      });
      if (res.success) {
        toast.success(`Request ${actionType === "approved" ? "approved" : "rejected"}.`);
        setReviewModalOpen(false);
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["attendance-request-counts"] });
        await fetchQueue();
      } else {
        toast.error(res.error?.error || "Could not submit the review.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process the review.");
    } finally {
      setActionLoading(false);
    }
  };

  const changeSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((order) => order === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder(field === "request_date" ? "desc" : "asc");
    }
    setPage(1);
  };

  const sortLabel = (field: SortField, label: string) => (
    <button type="button" onClick={() => changeSort(field)} className="inline-flex items-center gap-1.5 font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
      {label}{sortBy === field && <ChevronDown className={`size-3.5 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} />}
    </button>
  );

  return (
    <div className="w-full space-y-5">
      <header className={embedded ? "flex justify-end" : "flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center"}>
        {!embedded && <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Clock className="size-5 text-primary" />{requestType === "half_day" ? "Half-day requests" : requestType === "late_arrival" ? "Late-arrival requests" : "Attendance permission requests"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Review attendance permissions. Approved half days remain deductible.</p>
        </div>}
        <Button variant="outline" size="sm" onClick={() => void fetchQueue()} disabled={loading} className="w-fit gap-2">
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </header>

      <section aria-label="Request summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatsCard title="Requests" value={summary.total} icon={CalendarDays} description="Matching filters" onClick={() => { setStatus("all"); setPage(1); }} active={status === "all"} className="gap-2 py-3 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" />
        <StatsCard title="Pending" value={summary.pending} icon={Clock} description="Awaiting review" onClick={() => { setStatus("pending"); setPage(1); }} active={status === "pending"} iconClassName="text-amber-600" className="gap-2 py-3 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" />
        <StatsCard title="Approved" value={summary.approved} icon={CheckCircle2} description="Approved requests" onClick={() => { setStatus("approved"); setPage(1); }} active={status === "approved"} iconClassName="text-emerald-600" className="gap-2 py-3 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" />
        <StatsCard title="Rejected" value={summary.rejected} icon={XCircle} description="Rejected requests" onClick={() => { setStatus("rejected"); setPage(1); }} active={status === "rejected"} iconClassName="text-red-600" className="gap-2 py-3 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" />
        <StatsCard title="Cancelled" value={summary.cancelled} icon={UserRound} description="Cancelled requests" onClick={() => { setStatus("cancelled"); setPage(1); }} active={status === "cancelled"} iconClassName="text-muted-foreground" className="col-span-2 gap-2 py-3 shadow-none sm:col-span-1 [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4" />
      </section>

      <section aria-label="Filter attendance requests" className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_auto_180px_140px] xl:items-end">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="late-request-search" className="text-xs text-muted-foreground">Search requests</Label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="late-request-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, staff ID, department or reason" className="h-10 pl-9" /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Request dates</Label>
            <DatePickerWithRange date={dateRange} setDate={(range) => { setDateRange(range); setPage(1); }} className="w-full sm:w-[280px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(value) => { setStatus(value as StatusFilter); setPage(1); }}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rows per page</Label>
            <Select value={perPage} onValueChange={(value) => { setPerPage(value); setPage(1); }}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10 rows</SelectItem><SelectItem value="25">25 rows</SelectItem><SelectItem value="50">50 rows</SelectItem><SelectItem value="100">100 rows</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{sortLabel("staff", "Staff member")}</TableHead>
                <TableHead>{sortLabel("request_date", "Request date")}</TableHead>
                <TableHead>Request</TableHead>
                <TableHead className="min-w-56">Reason</TableHead>
                <TableHead>{sortLabel("status", "Status")}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">Loading requests…</TableCell></TableRow>
                  : requests.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><p className="font-medium">No requests found</p><p className="mt-1 text-sm text-muted-foreground">Try changing the search or filters.</p></TableCell></TableRow>
                  : requests.map((request) => (
                    <TableRow key={request.id} tabIndex={0} aria-label={`View ${request.user?.name || "staff"}'s request details`} className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" onClick={() => { setSheetRequest(request); setSheetOpen(true); }} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSheetRequest(request); setSheetOpen(true); } }}>
                      <TableCell><div className="flex min-w-48 items-center gap-3">
                        <Avatar className="size-9 shrink-0 border"><AvatarImage src={toProxiedImageUrl(request.user?.image_url)} alt={request.user?.name || "Staff"} /><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{getInitials(request.user?.name || "Staff")}</AvatarFallback></Avatar>
                        <div className="min-w-0"><p className="truncate text-sm font-medium">{request.user?.name || `User #${request.user_id}`}</p><p className="truncate text-xs text-muted-foreground">{[request.user?.staff_id, request.user?.department].filter(Boolean).join(" · ") || request.user?.email}</p></div>
                      </div></TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{format(parseISO(request.request_date), "d MMM yyyy")}</TableCell>
                      <TableCell className="min-w-48 text-sm">{requestDescription(request)}</TableCell>
                      <TableCell className="max-w-72"><p className="line-clamp-2 text-sm text-muted-foreground" title={request.reason}>{request.reason}</p></TableCell>
                      <TableCell><Badge variant="outline" className={`capitalize ${statusClass(request.status)}`}>{request.status}</Badge></TableCell>
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        {request.status === "pending" && canReview ? <div className="flex justify-end gap-2"><Button size="sm" className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => openReviewModal(request, "approved")}><CheckCircle2 className="size-3.5" /><span className="hidden md:inline">Approve</span></Button><Button size="sm" variant="outline" className="h-8 gap-1.5 text-destructive hover:text-destructive" onClick={() => openReviewModal(request, "rejected")}><XCircle className="size-3.5" /><span className="hidden md:inline">Reject</span></Button></div>
                          : request.status === "pending" ? <Button variant="outline" size="sm" onClick={() => { setSheetRequest(request); setSheetOpen(true); }}>View</Button> : <span className="text-xs text-muted-foreground">{request.reviewer?.name ? `Reviewed by ${request.reviewer.name}` : request.status === "cancelled" ? "Cancelled" : "Reviewed"}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{pagination.total === 0 ? "No requests" : `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} requests`}</p>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs">Page {pagination.currentPage} of {pagination.lastPage}</span>
              <div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="mr-1 size-4" />Previous</Button><Button variant="outline" size="sm" disabled={loading || page >= pagination.lastPage} onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}>Next<ChevronRight className="ml-1 size-4" /></Button></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{actionType === "approved" ? <CheckCircle2 className="size-5 text-emerald-600" /> : <XCircle className="size-5 text-destructive" />}{actionType === "approved" ? "Approve request" : "Reject request"}</DialogTitle>
            <DialogDescription>Confirm the decision for {selectedRequest?.user?.name || "this staff member"} on {selectedRequest?.request_date}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm"><p><span className="font-medium">Request:</span> {selectedRequest ? requestDescription(selectedRequest) : ""}</p><p><span className="font-medium">Reason:</span> {selectedRequest?.reason}</p></div>
            <div className="space-y-2"><Label htmlFor="reviewer-note">Reviewer note <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="reviewer-note" rows={3} placeholder="Add a comment for the staff member…" value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button><Button type="button" disabled={actionLoading} onClick={() => void handleConfirmReview()} className={actionType === "approved" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}>{actionLoading ? "Saving…" : actionType === "approved" ? "Confirm approval" : "Confirm rejection"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <LateRequestDetailsSheet request={sheetRequest} open={sheetOpen} onOpenChange={setSheetOpen} onReviewSuccess={fetchQueue} isHrReview={canReview} />
    </div>
  );
}
