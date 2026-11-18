"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppraisalHistory, useAppraisalStats } from "@/lib/api/hooks/use-performance-appraisal";
import { startMyAppraisal } from "@/lib/api/performance-appraisal.actions";
import { markAppraisalCompletionNotificationsViewed } from "@/lib/api/performance-appraisal";
import { callAction } from "@/lib/api/action-result";
import { appraisalStatusLabel } from "@/lib/performance-self-assessment";
import { formatPerformanceDate, formatPerformancePeriodLabel } from "@/lib/performance-review";
import type { AppraisalAvailability, AppraisalStats, AppraisalSummary, AppraisalType } from "@/lib/types/performance-appraisal";
import { PerformanceMetric } from "@/components/performance/performance-page-header";

const stages = ["self", "supervisor", "hr", "compliance", "mp"] as const;
type ColumnStage = (typeof stages)[number];

function progressFor(item: AppraisalSummary, stage: ColumnStage) {
  const direct = item.review_progress.find((entry) => entry.stage === stage);
  if (direct) return direct;
  const legacy = item.review_progress.find((entry) => entry.stage === "reviewer");
  if (!legacy) return null;
  const legacyStage =
    item.reviewer_route === "compliance"
      ? "compliance"
      : item.reviewer_route === "direct_mp"
        ? null
        : "supervisor";
  return legacyStage === stage ? legacy : null;
}

function StageBadge({ item, stage }: { item: AppraisalSummary; stage: ColumnStage }) {
  const progress = progressFor(item, stage);
  if (!progress) return <span className="text-muted-foreground">—</span>;
  const labels = {
    self: "Staff",
    supervisor: "Supervisor",
    hr: "HR",
    compliance: "Compliance",
    mp: item.type === "appraisal" ? "Management" : "MP",
  };
  const isCurrent =
    item.current_stage === stage ||
    (item.current_stage === "reviewer" && progressFor(item, stage)?.stage === "reviewer");
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

export function MyPerformanceWorkspace({ initialAppraisals, initialStats, initialAvailability }: { initialAppraisals: AppraisalSummary[]; initialStats: AppraisalStats; initialAvailability: AppraisalAvailability }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markedReadOnVisit = useRef(false);
  const history = useAppraisalHistory(initialAppraisals);
  const stats = useAppraisalStats(initialStats);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const appraisals = history.data ?? initialAppraisals;
  const nextAction = useMemo(() => appraisals.find((item) => item.can_edit_self), [appraisals]);
  const startedPeriodKeys = useMemo(
    () => new Set(appraisals.map((item) => `${item.type}:${item.month}`)),
    [appraisals],
  );
  const items = appraisals.filter((item) => `${item.month} ${item.department}`.toLowerCase().includes(search.toLowerCase())
    && (filter === "all" || (filter === "action" ? item.can_edit_self : !item.can_edit_self)));
  const openUnstartedPeriods = (initialAvailability.periods ?? []).filter(
    (period) =>
      period.can_start &&
      !startedPeriodKeys.has(`${period.type}:${period.month}`) &&
      (filter === "all" || filter === "action") &&
      `${period.month} ${formatPerformancePeriodLabel(period.type, period.month)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  async function startTestAppraisal(type: AppraisalType, month?: string) {
    setStarting(true);
    setStartError(null);
    try {
      const appraisal = await callAction(() => startMyAppraisal(type, month));
      await Promise.all([history.refetch(), stats.refetch()]);
      router.push(`/my/performance/${appraisal.id}`);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Unable to start the appraisal.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (markedReadOnVisit.current) return;
    markedReadOnVisit.current = true;
    void markAppraisalCompletionNotificationsViewed()
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch((error) => console.error("Failed to mark appraisal notifications as read:", error));
  }, [queryClient]);

  return <div className="flex min-w-0 flex-col gap-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">My Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start an available assessment and follow its review to the final result.</p>
      </div>
      {nextAction ? <Button asChild><Link href={`/my/performance/${nextAction.id}`}>{nextAction.self_status === "draft" ? "Continue assessment" : "View assessment"}<ArrowRight className="ml-2 size-4" /></Link></Button>
        : !initialAvailability.periods?.some((period) => period.can_start) && <p className="pt-1 text-sm text-muted-foreground">No assessment due right now.</p>}
    </header>
    {(history.error || stats.error) && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"><p>Couldn’t refresh your appraisal details.</p><Button variant="outline" size="sm" onClick={() => { void history.refetch(); void stats.refetch(); }}>Try again</Button></div>}
    {startError && <p role="alert" className="-mt-3 text-sm text-destructive">{startError}</p>}
    {initialAvailability.periods?.some((period) => period.can_start) && <section className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4" aria-label="Start an assessment">
      <span className="mr-1 text-sm font-medium">Available now</span>
      {(initialAvailability.periods ?? []).filter((period) => period.can_start).map((period) => <Button key={`${period.type}-${period.month}`} onClick={() => void startTestAppraisal(period.type, period.month)} disabled={starting}>{starting ? "Starting…" : `${period.type === "appraisal" ? "Appraisal" : "Monthly KPI"} · ${formatPerformancePeriodLabel(period.type, period.month)}`}<ArrowRight className="ml-2 size-4" /></Button>)}
    </section>}
    <section aria-label="Appraisal summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4"><PerformanceMetric label="Assigned" value={(stats.data ?? initialStats).total_appraisals} detail="All appraisal types" /><PerformanceMetric label="Needs your input" value={(stats.data ?? initialStats).pending_self_appraisal} detail="Awaiting submission" tone="amber" /><PerformanceMetric label="Completed" value={(stats.data ?? initialStats).completed_appraisals} detail="Finished appraisals" tone="primary" /><PerformanceMetric label="Average score" value={(stats.data ?? initialStats).average_rating === null ? "—" : `${(stats.data ?? initialStats).average_rating?.toFixed(2)} / 5`} detail="Across completed reviews" /></section>
    <Card><CardHeader className="pb-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><CardTitle>Appraisal history</CardTitle><CardDescription>Monthly KPI and June/December Appraisal cycles.</CardDescription></div><div className="flex flex-wrap gap-2"><div className="relative min-w-48"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search appraisal history" className="pl-9" placeholder="Search month or department" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44" aria-label="Filter appraisal history"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All appraisals</SelectItem><SelectItem value="action">Needs my assessment</SelectItem><SelectItem value="history">In review or complete</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent className="pt-0">
      {!openUnstartedPeriods.length && !items.length ? <div className="border-t py-8 text-center"><p className="font-medium">{appraisals.length ? "No matching appraisals" : "No appraisal history yet"}</p><p className="mt-1 text-sm text-muted-foreground">{appraisals.length ? "Adjust your search or filter." : "Your appraisals will appear here."}</p></div> : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-44">Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status / Result</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>HR</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Management / MP</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openUnstartedPeriods.map((period) => (
                <TableRow key={`open-${period.type}-${period.month}`}>
                  <TableCell>
                    <div className="font-medium">{formatPerformancePeriodLabel(period.type, period.month)}</div>
                    <div className="text-xs text-muted-foreground">Due {formatPerformanceDate(period.submission_deadline)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      {period.type === "appraisal" ? "Appraisal" : "Monthly KPI"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Open · Not started</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Ready</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => void startTestAppraisal(period.type, period.month)} disabled={starting}>
                      {starting ? "Starting…" : "Start"}
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/my/performance/${item.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{formatPerformancePeriodLabel(item.type, item.month)}</div>
                    <div className="text-xs text-muted-foreground">Due {formatPerformanceDate(item.submission_deadline)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      {item.type === "appraisal" ? "Appraisal" : "Monthly KPI"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === "completed" ? (
                      <div className="space-y-1">
                        <Badge variant="secondary">Complete</Badge>
                        {item.final_score !== null && (
                          <div className="text-xs font-medium tabular-nums text-foreground">
                            {item.type === "appraisal" && item.total_score !== null && item.total_max_score !== null
                              ? `${item.total_score} / ${item.total_max_score} pts · ${Number(item.final_score).toFixed(2)} / 5`
                              : `Score: ${Number(item.final_score).toFixed(2)} / 5`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant={item.can_edit_self ? "outline" : "secondary"}>
                        {appraisalStatusLabel(item)}
                      </Badge>
                    )}
                  </TableCell>
                  {stages.map((stage) => (
                    <TableCell key={`${item.id}-${stage}`}>
                      <StageBadge item={item} stage={stage} />
                    </TableCell>
                  ))}
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <Button variant={item.can_edit_self ? "default" : "outline"} size="sm" asChild>
                      <Link href={`/my/performance/${item.id}`}>
                        {item.can_edit_self ? (item.self_status === "draft" ? "Continue" : "Start Appraisal") : "View"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent></Card>
  </div>;
}
