"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodParticipationPanel } from "./period-participation-panel";
import {
  formatPerformanceDate,
  formatPerformancePeriodLabel,
} from "@/lib/performance-review";
import type {
  ReviewQueueFilters,
  ReviewQueueResponse,
  ReviewSummary,
} from "@/lib/types/performance-review";
import { PerformanceMetric } from "@/components/performance/performance-page-header";
import { AppraisalPdfButton } from "@/components/performance/appraisal-pdf-button";
import { PerformanceTour, PerformanceTourButton } from "@/components/performance/performance-tour";

const stages = ["self", "supervisor", "hr", "compliance", "mp"] as const;
type ColumnStage = (typeof stages)[number];

function progressFor(review: ReviewSummary, stage: ColumnStage) {
  const direct = review.review_progress.find((item) => item.stage === stage);
  if (direct) return direct;
  const legacy = review.review_progress.find((item) => item.stage === "reviewer");
  if (!legacy) return null;
  const legacyStage =
    review.reviewer_route === "compliance"
      ? "compliance"
      : review.reviewer_route === "direct_mp"
        ? null
        : "supervisor";
  return legacyStage === stage ? legacy : null;
}

function StageBadge({ review, stage }: { review: ReviewSummary; stage: ColumnStage }) {
  const progress = progressFor(review, stage);
  if (!progress) return <span className="text-muted-foreground">—</span>;
  const labels = {
    self: "Staff",
    supervisor: "Supervisor",
    hr: "HR",
    compliance: "Compliance",
    mp: review.type === "appraisal" ? "Management" : "MP",
  };
  const isCurrent =
    review.current_stage === stage ||
    (review.current_stage === "reviewer" && progressFor(review, stage)?.stage === "reviewer");
  const status =
    progress.status === "completed" ? "Done" : progress.status === "ready" ? "Ready" : "Pending";
  return (
    <div className="space-y-1">
      <Badge
        variant={
          isCurrent ? "default" : progress.status === "completed" ? "secondary" : "outline"
        }
      >
        {status}
      </Badge>
      {isCurrent && (
        <span className="block text-[11px] text-muted-foreground">Current · {labels[stage]}</span>
      )}
    </div>
  );
}

function currentStageLabel(review: ReviewSummary): string {
  if (review.current_stage === "reviewer") {
    return review.reviewer_route === "compliance" ? "Compliance review" : "Supervisor review";
  }
  if (review.current_stage === "supervisor") return "Supervisor review";
  if (review.current_stage === "hr") return "HR review";
  if (review.current_stage === "compliance") return "Compliance review";
  if (review.current_stage === "mp") {
    return review.type === "appraisal" ? "Management review" : "MP review";
  }
  return "Staff assessment";
}

function periodQueueUrl(pathname: string, filters: ReviewQueueFilters): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.department !== "all") params.set("department", filters.department);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function PeriodReviewsView({
  initialData,
  period,
  filters,
  canManagePeriod = false,
  isSuperAdmin = false,
}: {
  initialData: ReviewQueueResponse;
  period: NonNullable<ReviewQueueResponse["period"]>;
  filters: ReviewQueueFilters;
  canManagePeriod?: boolean;
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const { items, pagination, counts } = initialData;
  const isAppraisal = period.type === "appraisal";
  const visibleStages: readonly ColumnStage[] = isAppraisal
    ? (["self", "supervisor", "compliance", "mp"] as const)
    : stages;
  const hasFilters =
    Boolean(search.trim()) || filters.status !== "all" || filters.department !== "all";

  function navigate(next: ReviewQueueFilters) {
    startTransition(() => router.push(periodQueueUrl(pathname, next), { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ ...filters, search: search.trim(), page: 1 });
  }

  const firstItem = pagination.total ? (pagination.page - 1) * pagination.per_page + 1 : 0;
  const lastItem = Math.min(pagination.page * pagination.per_page, pagination.total);

  const submittedReviewsContent = (
    <div className="space-y-6">
      <section id="tour-pr-metrics" aria-label="Period summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PerformanceMetric label="Ready now" value={counts.ready} detail="Waiting for your review" tone="amber" />
        <PerformanceMetric label="In my queue" value={counts.assigned} detail="Assigned · not completed" />
        <PerformanceMetric
          label="Available"
          value={counts.available}
          detail={isAppraisal ? "Submitted appraisals" : "Submitted KPI reviews"}
          tone="primary"
        />
        <PerformanceMetric
          label="Completed"
          value={counts.completed}
          detail={isAppraisal ? "Appraisals closed" : "KPI reviews closed"}
        />
      </section>

      <div id="tour-pr-filters" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <form onSubmit={submitSearch} className="flex min-w-0 items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="review-search">Search staff</Label>
            <Input
              id="review-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or staff ID"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            Search
          </Button>
        </form>
        <div className="space-y-2">
          <Label htmlFor="review-status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: ReviewQueueFilters["status"]) =>
              navigate({ ...filters, status: value, page: 1 })
            }
          >
            <SelectTrigger id="review-status" className="h-9 w-full px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="awaiting_reviewer">Awaiting review</SelectItem>
              <SelectItem value="awaiting_mp">Awaiting management / MP</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-department">Department</Label>
          <Select
            value={filters.department}
            onValueChange={(value) => navigate({ ...filters, department: value, page: 1 })}
          >
            <SelectTrigger id="review-department" className="h-9 w-full px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {initialData.options.departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!items.length ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <h2 className="font-medium">
            {pagination.total ? "No records match these filters" : "No submitted staff reviews yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pagination.total
              ? "Adjust your search, status or department."
              : "Staff assessments will appear here once submitted."}
          </p>
          {hasFilters && (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearch("");
                navigate({
                  search: "",
                  status: "all",
                  type: "all",
                  period_id: period.id,
                  month: "all",
                  department: "all",
                  page: 1,
                });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div id="tour-pr-table" className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Staff member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current stage</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Supervisor</TableHead>
                  {!isAppraisal && <TableHead>HR</TableHead>}
                  <TableHead>Compliance</TableHead>
                  <TableHead>{isAppraisal ? "Management" : "MP"}</TableHead>
                  <TableHead>Final average</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((review) => {
                  const canViewCompleted =
                    (review.is_assigned &&
                      (review.assessment_status === "submitted" || review.status === "completed")) ||
                    (review.status === "completed" && review.final_score !== null);
                  return (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium">{review.employee_name}</div>
                        <div className="text-xs text-muted-foreground">{review.employee_staff_id}</div>
                      </TableCell>
                      <TableCell>{review.department}</TableCell>
                      <TableCell>
                        {review.status === "completed" ? (
                          <Badge variant="secondary">Complete</Badge>
                        ) : review.current_stage ? (
                          <span className="font-medium">{currentStageLabel(review)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {visibleStages.map((stage) => (
                        <TableCell key={`${review.id}-${stage}`}>
                          <StageBadge review={review} stage={stage} />
                        </TableCell>
                      ))}
                      <TableCell>
                        {review.status === "completed" && review.final_score !== null ? (
                          <div className="space-y-0.5 tabular-nums">
                            <div className="font-semibold">
                              {Number(review.final_score).toFixed(2)} / 5
                            </div>
                            {review.type === "appraisal" &&
                              review.total_score !== null &&
                              review.total_max_score !== null && (
                                <div className="text-xs text-muted-foreground">
                                  {review.total_score} / {review.total_max_score} pts
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {review.status === "completed" && canViewCompleted && (
                            <AppraisalPdfButton
                              reviewId={review.id}
                              label="PDF"
                              variant="outline"
                              size="sm"
                            />
                          )}
                          {review.can_review ? (
                            <Button size="sm" asChild>
                              <Link href={`/performance/reviews/${review.id}`}>
                                {review.assessment_status === "draft" ? "Continue" : "Review"}
                              </Link>
                            </Button>
                          ) : canViewCompleted ? (
                            <Button size="sm" asChild>
                              <Link href={`/performance/reviews/${review.id}`}>View</Link>
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              {review.is_assigned ? "Waiting" : "Not assigned"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing {firstItem}–{lastItem} of {pagination.total} records
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={
                      pagination.page > 1
                        ? periodQueueUrl(pathname, { ...filters, page: pagination.page - 1 })
                        : "#"
                    }
                    aria-disabled={pagination.page <= 1 || isPending}
                    className={
                      pagination.page <= 1 || isPending
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={
                      pagination.page < pagination.total_pages
                        ? periodQueueUrl(pathname, { ...filters, page: pagination.page + 1 })
                        : "#"
                    }
                    aria-disabled={pagination.page >= pagination.total_pages || isPending}
                    className={
                      pagination.page >= pagination.total_pages || isPending
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PerformanceTour tourId="period-reviews" />
      <div id="tour-pr-header" className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/performance/reviews?type=${period.type}`}>
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {formatPerformancePeriodLabel(period.type, period.month)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAppraisal ? "Bi-Yearly Appraisal" : "Monthly KPI Review"} · Submission deadline{" "}
              {formatPerformanceDate(period.submission_deadline)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PerformanceTourButton tourId="period-reviews" />
          <Badge variant={period.status === "open" ? "default" : "secondary"} className="capitalize">
            {period.status}
          </Badge>
        </div>
      </div>

      {canManagePeriod ? (
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reviews">Submitted reviews</TabsTrigger>
            <TabsTrigger value="participation">Participation &amp; management</TabsTrigger>
          </TabsList>
          <TabsContent value="reviews" className="space-y-6">
            {submittedReviewsContent}
          </TabsContent>
          <TabsContent value="participation" className="space-y-6">
            <PeriodParticipationPanel
              periodId={period.id}
              periodType={period.type}
              isSuperAdmin={isSuperAdmin}
            />
          </TabsContent>
        </Tabs>
      ) : (
        submittedReviewsContent
      )}
    </div>
  );
}
