"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatPerformanceMonth, reviewStatusLabel } from "@/lib/performance-review";
import type { PerformancePeriod } from "@/lib/types/performance-period";
import type { ReviewQueueFilters, ReviewQueueResponse, ReviewSummary } from "@/lib/types/performance-review";
import { PerformanceMetric, PerformancePageHeader } from "@/components/performance/performance-page-header";
import { AppraisalWindowCard } from "@/app/(admin)/hr/performance/components/appraisal-window-card";

const stages = ["self", "supervisor", "hr", "compliance", "mp"] as const;
type ColumnStage = typeof stages[number];

function progressFor(review: ReviewSummary, stage: ColumnStage) {
  const direct = review.review_progress.find((item) => item.stage === stage);
  if (direct) return direct;
  const legacy = review.review_progress.find((item) => item.stage === "reviewer");
  if (!legacy) return null;
  const legacyStage = review.reviewer_route === "compliance" ? "compliance" : review.reviewer_route === "direct_mp" ? null : "supervisor";
  return legacyStage === stage ? legacy : null;
}

function StageBadge({ review, stage }: { review: ReviewSummary; stage: ColumnStage }) {
  const progress = progressFor(review, stage);
  if (!progress) return <span className="text-muted-foreground">—</span>;
  const labels = { self: "Staff", supervisor: "Supervisor", hr: "HR", compliance: "Compliance", mp: review.type === "appraisal" ? "Management" : "MP" };
  const isCurrent = review.current_stage === stage || (review.current_stage === "reviewer" && progressFor(review, stage)?.stage === "reviewer");
  const status = progress.status === "completed" ? "Done" : progress.status === "ready" ? "Ready" : "Pending";
  return <div className="space-y-1"><Badge variant={isCurrent ? "default" : progress.status === "completed" ? "secondary" : "outline"}>{status}</Badge>{isCurrent && <span className="block text-[11px] text-muted-foreground">Current · {labels[stage]}</span>}</div>;
}

function currentStageLabel(review: ReviewSummary): string {
  if (review.current_stage === "reviewer") return review.reviewer_route === "compliance" ? "Compliance review" : "Supervisor review";
  if (review.current_stage === "supervisor") return "Supervisor review";
  if (review.current_stage === "hr") return "HR review";
  if (review.current_stage === "compliance") return "Compliance review";
  if (review.current_stage === "mp") return review.type === "appraisal" ? "Management review" : "MP review";
  return "Staff assessment";
}

function queueUrl(pathname: string, filters: ReviewQueueFilters): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.month) params.set("month", filters.month);
  if (filters.department !== "all") params.set("department", filters.department);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function ReviewQueue({
  initialData,
  filters,
  periods,
  canManageKpis = false,
}: {
  initialData: ReviewQueueResponse;
  filters: ReviewQueueFilters;
  periods?: PerformancePeriod[];
  canManageKpis?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const { items, pagination, counts } = initialData;
  const defaultMonth = initialData.options.months[0] ?? "all";
  const hasFilters = Boolean(search.trim()) || filters.status !== "all" || filters.type !== "all" || filters.month !== defaultMonth || filters.department !== "all";

  function navigate(next: ReviewQueueFilters) {
    startTransition(() => router.push(queueUrl(pathname, next), { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ ...filters, search: search.trim(), page: 1 });
  }

  const firstItem = pagination.total ? (pagination.page - 1) * pagination.per_page + 1 : 0;
  const lastItem = Math.min(pagination.page * pagination.per_page, pagination.total);

  return <div className="space-y-6">
    {periods !== undefined && <AppraisalWindowCard initialPeriods={periods} />}
    <section aria-label="Review summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4"><PerformanceMetric label="Ready now" value={counts.ready} detail="Waiting for your review" tone="amber" /><PerformanceMetric label="In my queue" value={counts.assigned} detail="Assigned · not completed" /><PerformanceMetric label="Available" value={counts.available} detail="Submitted appraisals" tone="primary" /><PerformanceMetric label="Completed" value={counts.completed} detail="Appraisals closed" /></section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <form onSubmit={submitSearch} className="flex min-w-0 items-end gap-2 xl:col-span-1">
        <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="review-search">Search appraisals</Label><Input id="review-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, staff ID or month" /></div>
        <Button type="submit" variant="outline" disabled={isPending}>Search</Button>
      </form>
      <div className="space-y-2"><Label htmlFor="review-status">Status</Label><Select value={filters.status} onValueChange={(value: ReviewQueueFilters["status"]) => navigate({ ...filters, status: value, page: 1 })}><SelectTrigger id="review-status" className="h-9 w-full px-3 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="awaiting_reviewer">Awaiting review</SelectItem><SelectItem value="awaiting_mp">Awaiting management / MP</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="review-type">Appraisal type</Label><Select value={filters.type} onValueChange={(value: ReviewQueueFilters["type"]) => navigate({ ...filters, type: value, page: 1 })}><SelectTrigger id="review-type" className="h-9 w-full px-3 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="monthly_kpi">Monthly KPI</SelectItem><SelectItem value="appraisal">Appraisal</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="review-month">Appraisal month</Label><Select value={filters.month} onValueChange={(value) => navigate({ ...filters, month: value, page: 1 })}><SelectTrigger id="review-month" className="h-9 w-full px-3 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All months</SelectItem>{initialData.options.months.map((month) => <SelectItem key={month} value={month}>{formatPerformanceMonth(month)}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="review-department">Department</Label><Select value={filters.department} onValueChange={(value) => navigate({ ...filters, department: value, page: 1 })}><SelectTrigger id="review-department" className="h-9 w-full px-3 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{initialData.options.departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent></Select></div>
    </div>
      {!items.length ? <div className="rounded-xl border border-dashed px-6 py-12 text-center"><h2 className="font-medium">{pagination.total ? "No appraisals match these filters" : "No appraisals are available"}</h2><p className="mt-2 text-sm text-muted-foreground">{pagination.total ? "Adjust your search, status, type, month or department." : "Submitted staff appraisals will appear here."}</p>{hasFilters && <Button className="mt-4" variant="outline" onClick={() => { setSearch(""); navigate({ search: "", status: "all", type: "all", month: defaultMonth, department: "all", page: 1 }); }}>Clear filters</Button>}</div> : <>
      <div className="overflow-hidden rounded-lg border"><Table><TableHeader><TableRow><TableHead className="min-w-48">Staff member</TableHead><TableHead>Department</TableHead><TableHead>Appraisal period</TableHead><TableHead>Current stage</TableHead><TableHead>Staff</TableHead><TableHead>Supervisor</TableHead><TableHead>HR</TableHead><TableHead>Compliance</TableHead><TableHead>Management / MP</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{items.map((review) => {
        const canViewCompleted = (review.is_assigned && (review.assessment_status === "submitted" || review.status === "completed")) || (review.status === "completed" && review.final_score !== null);
        return <TableRow key={review.id}><TableCell><div className="font-medium">{review.employee_name}</div><div className="text-xs text-muted-foreground">{review.employee_staff_id}</div></TableCell><TableCell>{review.department}</TableCell><TableCell><div className="space-y-1"><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{review.type === "appraisal" ? "Appraisal" : "Monthly KPI"}</Badge><div className="text-sm">{formatPerformanceMonth(review.month)}</div><div className="text-xs text-muted-foreground">Due {review.submission_deadline}</div></div></TableCell><TableCell>{review.status === "completed" ? <div className="space-y-1"><Badge variant="secondary">Complete</Badge>{review.final_score !== null && <div className="text-xs font-medium tabular-nums text-foreground">{review.type === "appraisal" && review.total_score !== null && review.total_max_score !== null ? `${review.total_score} / ${review.total_max_score} pts · ${Number(review.final_score).toFixed(2)} / 5` : `Score: ${Number(review.final_score).toFixed(2)} / 5`}</div>}</div> : review.current_stage ? <div><div className="font-medium">{currentStageLabel(review)}</div><div className="text-xs text-muted-foreground">{reviewStatusLabel(review)}</div></div> : <span className="text-muted-foreground">—</span>}</TableCell>{stages.map((stage) => <TableCell key={`${review.id}-${stage}`}><StageBadge review={review} stage={stage} /></TableCell>)}<TableCell className="text-right">{review.can_review ? <Button size="sm" asChild><Link href={`/performance/reviews/${review.id}`}>{review.assessment_status === "draft" ? "Continue" : "Review"}</Link></Button> : canViewCompleted ? <Button size="sm" asChild><Link href={`/performance/reviews/${review.id}`}>View</Link></Button> : <Button size="sm" variant="outline" disabled>{review.is_assigned ? "Waiting" : "Not assigned"}</Button>}</TableCell></TableRow>;
      })}</TableBody></Table></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Showing {firstItem}–{lastItem} of {pagination.total} appraisals</p><Pagination className="mx-0 w-auto justify-end"><PaginationContent><PaginationItem><PaginationPrevious href={pagination.page > 1 ? queueUrl(pathname, { ...filters, page: pagination.page - 1 }) : "#"} aria-disabled={pagination.page <= 1 || isPending} className={pagination.page <= 1 || isPending ? "pointer-events-none opacity-50" : undefined} /></PaginationItem><PaginationItem><span className="px-2 text-sm text-muted-foreground">Page {pagination.page} of {pagination.total_pages}</span></PaginationItem><PaginationItem><PaginationNext href={pagination.page < pagination.total_pages ? queueUrl(pathname, { ...filters, page: pagination.page + 1 }) : "#"} aria-disabled={pagination.page >= pagination.total_pages || isPending} className={pagination.page >= pagination.total_pages || isPending ? "pointer-events-none opacity-50" : undefined} /></PaginationItem></PaginationContent></Pagination></div>
    </>}
  </div>;
}
