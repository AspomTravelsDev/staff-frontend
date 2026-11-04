"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppraisalHistory, useAppraisalStats } from "@/lib/api/hooks/use-performance-appraisal";
import type { AppraisalStats, AppraisalSummary } from "@/lib/types/performance-appraisal";
import { AppraisalStatsCards } from "./appraisal-stats-cards";
import { AppraisalTable } from "./appraisal-table";

export function MyPerformanceWorkspace({ initialAppraisals, initialStats }: { initialAppraisals: AppraisalSummary[]; initialStats: AppraisalStats }) {
  const history = useAppraisalHistory(initialAppraisals);
  const stats = useAppraisalStats(initialStats);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const items = (history.data ?? initialAppraisals).filter((item) => `${item.month} ${item.department}`.toLowerCase().includes(search.toLowerCase())
    && (filter === "all" || (filter === "action" ? item.can_edit_self : !item.can_edit_self)));

  return <div className="space-y-6">
    <header className="space-y-1"><h1 className="text-2xl font-bold">My Performance</h1><p className="max-w-2xl text-sm text-muted-foreground">Complete your assigned monthly self-assessments and follow their review progress. HR opens each period and assigns its KPI criteria and reviewers.</p></header>
    {(history.error || stats.error) && <div role="alert" className="space-y-2 text-sm text-destructive"><p>Unable to refresh your appraisals. The last loaded information is shown below.</p><Button variant="outline" onClick={() => { void history.refetch(); void stats.refetch(); }}>Retry loading</Button></div>}
    <AppraisalStatsCards stats={stats.data ?? initialStats} />
    <section className="space-y-4" aria-labelledby="appraisals-heading"><h2 id="appraisals-heading" className="text-lg font-semibold">Assigned appraisals</h2>
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="appraisal-search">Search month or department</Label><Input id="appraisal-search" placeholder="e.g. 2026-10" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="appraisal-status">Show</Label><select id="appraisal-status" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All appraisals</option><option value="action">Needs my self-assessment</option><option value="history">In review, completed or closed</option></select></div></div>
      <AppraisalTable appraisals={items} hasAnyAppraisals={!!history.data?.length} />
    </section>
  </div>;
}
