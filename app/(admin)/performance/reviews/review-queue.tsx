"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { closePerformancePeriod } from "@/lib/api/performance-period.actions";
import {
  formatPerformanceDate,
  formatPerformancePeriodLabel,
  getAppraisalCycleWindowInfo,
} from "@/lib/performance-review";
import type { PerformancePeriod } from "@/lib/types/performance-period";
import type {
  ReviewPeriodQueueFilters,
  ReviewPeriodQueueResponse,
  ReviewPeriodSummary,
} from "@/lib/types/performance-review";
import { PerformanceMetric } from "@/components/performance/performance-page-header";
import {
  AppraisalPeriodDialog,
  AppraisalWindowCard,
  type PeriodDialogTarget,
} from "@/app/(admin)/hr/performance/components/appraisal-window-card";

function queueUrl(pathname: string, filters: ReviewPeriodQueueFilters): string {
  const params = new URLSearchParams();
  if (filters.type !== "appraisal") params.set("type", filters.type);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.search.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function periodStatusBadge(status: ReviewPeriodSummary["status"]) {
  if (status === "open") return <Badge variant="default">Open</Badge>;
  if (status === "closed") return <Badge variant="secondary">Closed</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

export function ReviewQueue({
  initialData,
  filters,
  periods: initialPeriods,
}: {
  initialData: ReviewPeriodQueueResponse;
  filters: ReviewPeriodQueueFilters;
  periods?: PerformancePeriod[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const [periods, setPeriods] = useState<PerformancePeriod[]>(initialPeriods ?? []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState<PeriodDialogTarget | null>(null);
  const [confirmClosePeriod, setConfirmClosePeriod] = useState<ReviewPeriodSummary | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const canManagePeriods = initialPeriods !== undefined;
  const { items, counts } = initialData;
  const activeTab: "appraisal" | "monthly_kpi" =
    filters.type === "monthly_kpi" ? "monthly_kpi" : "appraisal";
  const hasFilters = Boolean(search.trim()) || filters.status !== "all";

  function navigate(next: ReviewPeriodQueueFilters) {
    startTransition(() => router.push(queueUrl(pathname, next), { scroll: false }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ ...filters, search: search.trim() });
  }

  function openNewPeriodDialog() {
    const windowInfo = getAppraisalCycleWindowInfo();
    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    setDialogTarget({
      type: activeTab,
      month: activeTab === "appraisal" ? windowInfo.targetMonth : currentMonth,
    });
    setDialogOpen(true);
  }

  function openEditPeriodDialog(period: ReviewPeriodSummary) {
    setDialogTarget({
      type: period.type,
      month: period.month,
      submission_deadline: period.submission_deadline,
      status: period.status,
    });
    setDialogOpen(true);
  }

  async function handleClosePeriod(period: ReviewPeriodSummary) {
    if (closingId) return;
    setClosingId(period.id);
    const result = await closePerformancePeriod(period.id);
    setClosingId(null);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    const saved = result.data;
    setPeriods((previous) => previous.map((item) => (item.id === saved.id ? saved : item)));
    toast.success(`${formatPerformancePeriodLabel(saved.type, saved.month)} window closed`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canManagePeriods && (
        <>
          <AppraisalWindowCard onStartNew={openNewPeriodDialog} />
          <AppraisalPeriodDialog
            key={`${dialogTarget?.type ?? activeTab}-${dialogTarget?.month ?? ""}-${dialogTarget?.submission_deadline ?? ""}-${dialogOpen}`}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            periods={periods}
            target={dialogTarget}
            onSaved={(saved) => {
              setPeriods((previous) => {
                const exists = previous.some((item) => item.id === saved.id);
                return exists
                  ? previous.map((item) => (item.id === saved.id ? saved : item))
                  : [saved, ...previous];
              });
            }}
          />
        </>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          navigate({
            ...filters,
            type: value as "appraisal" | "monthly_kpi",
          })
        }
      >
        <TabsList>
          <TabsTrigger value="appraisal">Appraisals</TabsTrigger>
          <TabsTrigger value="monthly_kpi">Monthly KPI Reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      <section aria-label="Review summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PerformanceMetric label="Ready now" value={counts.ready} detail="Waiting for your review" tone="amber" />
        <PerformanceMetric label="In my queue" value={counts.assigned} detail="Assigned · not completed" />
        <PerformanceMetric
          label="Available"
          value={counts.available}
          detail={activeTab === "appraisal" ? "Submitted appraisals" : "Submitted KPI reviews"}
          tone="primary"
        />
        <PerformanceMetric
          label="Completed"
          value={counts.completed}
          detail={activeTab === "appraisal" ? "Appraisals closed" : "KPI reviews closed"}
        />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <form onSubmit={submitSearch} className="flex min-w-0 items-end gap-2 lg:col-span-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="period-search">
              {activeTab === "appraisal" ? "Search appraisal periods" : "Search KPI review periods"}
            </Label>
            <Input
              id="period-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Year-month (e.g. 2026-12) or status"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            Search
          </Button>
        </form>
        <div className="space-y-2">
          <Label htmlFor="period-status">Period status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: ReviewPeriodQueueFilters["status"]) =>
              navigate({ ...filters, status: value })
            }
          >
            <SelectTrigger id="period-status" className="h-9 w-full px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!items.length ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <h2 className="font-medium">
            {hasFilters
              ? "No periods match these filters"
              : activeTab === "appraisal"
                ? "No appraisal periods yet"
                : "No monthly KPI periods yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasFilters
              ? "Adjust your search or period status filter."
              : canManagePeriods
                ? "Click “Start new appraisal / review” above to open a period."
                : "Opened appraisal periods will appear here."}
          </p>
          {hasFilters && (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setSearch("");
                navigate({ type: activeTab, status: "all", search: "" });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-44">
                  {activeTab === "appraisal" ? "Appraisal period" : "Review month"}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission deadline</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Ready for you</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((period) => (
                <TableRow
                  key={period.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/performance/reviews/periods/${period.id}`)}
                >
                  <TableCell className="font-medium">
                    {formatPerformancePeriodLabel(period.type, period.month)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      {period.type === "appraisal" ? "Bi-Yearly Appraisal" : "Monthly KPI"}
                    </Badge>
                  </TableCell>
                  <TableCell>{periodStatusBadge(period.status)}</TableCell>
                  <TableCell>{formatPerformanceDate(period.submission_deadline)}</TableCell>
                  <TableCell className="tabular-nums">{period.total_submitted}</TableCell>
                  <TableCell>
                    {period.ready_count > 0 ? (
                      <Badge variant="default" className="tabular-nums">
                        {period.ready_count} ready
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground tabular-nums">0</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {period.completed_count} / {period.total_submitted}
                  </TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {canManagePeriods && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openEditPeriodDialog(period)}
                          >
                            <Pencil className="mr-1.5 size-3" aria-hidden="true" />
                            Edit deadline
                          </Button>
                          {period.status === "open" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={closingId === period.id}
                              onClick={() => setConfirmClosePeriod(period)}
                            >
                              {closingId === period.id ? "Closing…" : "Close"}
                            </Button>
                          )}
                        </>
                      )}
                      <Button size="sm" asChild>
                        <Link href={`/performance/reviews/periods/${period.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={confirmClosePeriod !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmClosePeriod(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Close{" "}
              {confirmClosePeriod
                ? formatPerformancePeriodLabel(confirmClosePeriod.type, confirmClosePeriod.month)
                : "this period"}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Staff and reviewers will no longer be able to start or submit assessments for this
              period once closed. Existing completed results remain viewable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmClosePeriod) {
                  void handleClosePeriod(confirmClosePeriod);
                }
                setConfirmClosePeriod(null);
              }}
            >
              Close period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
