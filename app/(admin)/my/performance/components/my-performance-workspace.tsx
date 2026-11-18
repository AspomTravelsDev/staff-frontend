"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Circle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppraisalHistory, useAppraisalStats } from "@/lib/api/hooks/use-performance-appraisal";
import { startDevelopmentAppraisal, startMyAppraisal } from "@/lib/api/performance-appraisal.actions";
import { markAppraisalCompletionNotificationsViewed } from "@/lib/api/performance-appraisal";
import { callAction } from "@/lib/api/action-result";
import { appraisalStatusLabel } from "@/lib/performance-self-assessment";
import { formatPerformanceMonth } from "@/lib/performance-review";
import type { AppraisalAvailability, AppraisalStats, AppraisalSummary, AppraisalType } from "@/lib/types/performance-appraisal";
import { PerformanceMetric } from "@/components/performance/performance-page-header";

function StageProgress({ item }: { item: AppraisalSummary }) {
  const labels: Record<string, string> = {
    self: "Staff",
    reviewer: "Reviewer",
    supervisor: "Supervisor",
    hr: "HR",
    compliance: "Compliance",
    mp: item.type === "appraisal" ? "Management" : "MP",
  };
  return <div className="pt-1" aria-label="Assessment stages">
    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Review progress</p>
    <ol className="flex max-w-2xl items-start">
      {item.review_progress.map((stage, index) => {
        const completed = stage.status === "completed";
        const current = stage.stage === item.current_stage;
        return <li key={stage.stage} className="flex min-w-0 flex-1 items-start last:flex-none">
          <div className="flex min-w-0 items-start">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs ${completed ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-muted text-muted-foreground"}`}>
              {completed ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
            </span>
            <span className={`ml-2 truncate pt-1 text-xs ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {labels[stage.stage]}
            </span>
          </div>
          {index < item.review_progress.length - 1 && <span className={`mx-2 mt-3 h-px min-w-4 flex-1 ${completed ? "bg-primary/50" : "bg-border"}`} />}
        </li>;
      })}
    </ol>
  </div>;
}

export function MyPerformanceWorkspace({ initialAppraisals, initialStats, initialAvailability, allowDevelopmentStart = false }: { initialAppraisals: AppraisalSummary[]; initialStats: AppraisalStats; initialAvailability: AppraisalAvailability; allowDevelopmentStart?: boolean }) {
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
  const items = appraisals.filter((item) => `${item.month} ${item.department}`.toLowerCase().includes(search.toLowerCase())
    && (filter === "all" || (filter === "action" ? item.can_edit_self : !item.can_edit_self)));

  async function startTestAppraisal(type: AppraisalType, useDevEndpoint = false) {
    setStarting(true);
    setStartError(null);
    try {
      const appraisal = await callAction(() => (useDevEndpoint ? startDevelopmentAppraisal : startMyAppraisal)(type));
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
        : !(initialAvailability.periods?.some((period) => period.can_start) || allowDevelopmentStart) && <p className="pt-1 text-sm text-muted-foreground">No assessment due right now.</p>}
    </header>
    {(history.error || stats.error) && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"><p>Couldn’t refresh your appraisal details.</p><Button variant="outline" size="sm" onClick={() => { void history.refetch(); void stats.refetch(); }}>Try again</Button></div>}
    {startError && <p role="alert" className="-mt-3 text-sm text-destructive">{startError}</p>}
    {(initialAvailability.periods?.some((period) => period.can_start) || allowDevelopmentStart) && <section className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4" aria-label="Start an assessment">
      <span className="mr-1 text-sm font-medium">Available now</span>
      {(initialAvailability.periods ?? []).filter((period) => period.can_start).map((period) => <Button key={`${period.type}-${period.month}`} onClick={() => void startTestAppraisal(period.type, false)} disabled={starting}>{starting ? "Starting…" : `${period.type === "appraisal" ? "Appraisal" : "Monthly KPI"} · ${formatPerformanceMonth(period.month)}`}<ArrowRight className="ml-2 size-4" /></Button>)}
      {allowDevelopmentStart && !(initialAvailability.periods ?? []).some((period) => period.type === "monthly_kpi" && period.can_start) && <Button variant="outline" onClick={() => void startTestAppraisal("monthly_kpi", true)} disabled={starting}>{starting ? "Starting…" : "Start test monthly KPI"}</Button>}
      {allowDevelopmentStart && !(initialAvailability.periods ?? []).some((period) => period.type === "appraisal" && period.can_start) && <Button variant="outline" onClick={() => void startTestAppraisal("appraisal", true)} disabled={starting}>{starting ? "Starting…" : "Start test Appraisal"}</Button>}
    </section>}
    <section aria-label="Appraisal summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4"><PerformanceMetric label="Assigned" value={(stats.data ?? initialStats).total_appraisals} detail="All appraisal types" /><PerformanceMetric label="Needs your input" value={(stats.data ?? initialStats).pending_self_appraisal} detail="Awaiting submission" tone="amber" /><PerformanceMetric label="Completed" value={(stats.data ?? initialStats).completed_appraisals} detail="Finished appraisals" tone="primary" /><PerformanceMetric label="Average score" value={(stats.data ?? initialStats).average_rating === null ? "—" : `${(stats.data ?? initialStats).average_rating?.toFixed(2)} / 5`} detail="Across completed reviews" /></section>
    <Card><CardHeader className="pb-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><CardTitle>Appraisal history</CardTitle><CardDescription>Monthly KPI and June/December Appraisal cycles.</CardDescription></div><div className="flex flex-wrap gap-2"><div className="relative min-w-48"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search appraisal history" className="pl-9" placeholder="Search month or department" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44" aria-label="Filter appraisal history"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All appraisals</SelectItem><SelectItem value="action">Needs my assessment</SelectItem><SelectItem value="history">In review or complete</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent className="pt-0">
      {!items.length ? <div className="border-t py-8 text-center"><p className="font-medium">{appraisals.length ? "No matching appraisals" : "No appraisal history yet"}</p><p className="mt-1 text-sm text-muted-foreground">{appraisals.length ? "Adjust your search or filter." : "Your appraisals will appear here."}</p></div> : <ul className="divide-y border-y">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{item.type === "appraisal" ? "Appraisal" : "Monthly KPI"} · {formatPerformanceMonth(item.month)}</h3><Badge variant={item.can_edit_self ? "outline" : "secondary"}>{appraisalStatusLabel(item)}</Badge></div><p className="text-sm text-muted-foreground">{item.department}{item.final_score !== null ? ` · Average ${Number(item.final_score).toFixed(2)} / 5${item.total_score !== null ? ` · Total ${item.total_score} / ${item.total_max_score}` : ""}` : ""}</p><StageProgress item={item} /></div><Button variant="outline" size="sm" asChild><Link href={`/my/performance/${item.id}`}>{item.can_edit_self ? item.self_status === "draft" ? "Continue" : "Assess" : "View"}<ArrowRight className="ml-2 size-4" /></Link></Button></li>)}</ul>}
    </CardContent></Card>
  </div>;
}
