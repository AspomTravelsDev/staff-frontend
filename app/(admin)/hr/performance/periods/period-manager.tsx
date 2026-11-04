"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { callAction } from "@/lib/api/action-result";
import { getPerformancePeriodOptions, listPerformancePeriods } from "@/lib/api/performance-period.actions";
import type { PerformancePeriod, PeriodStaff } from "@/lib/types/performance-period";
import { PeriodEditor } from "./period-editor";

const periodsKey = ["performance", "periods"] as const;

export function PeriodManager({ initialPeriods, initialOptions }: {
  initialPeriods: { items: PerformancePeriod[] };
  initialOptions: { staff: PeriodStaff[] };
}) {
  const client = useQueryClient();
  const periods = useQuery({ queryKey: periodsKey, queryFn: () => callAction(listPerformancePeriods), initialData: initialPeriods });
  const options = useQuery({ queryKey: ["performance", "period-options"], queryFn: () => callAction(getPerformancePeriodOptions), initialData: initialOptions });
  const [editor, setEditor] = useState<{ period: PerformancePeriod | null } | null>(null);

  function saved(period: PerformancePeriod) {
    client.setQueryData<{ items: PerformancePeriod[] }>(periodsKey, (old) => ({
      items: [...(old?.items ?? []).filter((item) => item.id !== period.id), period].sort((a, b) => b.month.localeCompare(a.month)),
    }));
    void client.invalidateQueries({ queryKey: periodsKey });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1"><h1 className="text-2xl font-bold">Monthly appraisal setup</h1><p className="max-w-2xl text-sm text-muted-foreground">Choose staff and reviewers, check readiness, then open the month with a saved copy of each department’s KPIs.</p></div>
        {!editor && <Button onClick={() => setEditor({ period: null })}><Plus aria-hidden="true" />New monthly period</Button>}
      </header>
      {(periods.error || options.error) && <div role="alert" className="space-y-2 text-sm text-destructive"><p>Could not refresh periods or staff. Your current changes are still here.</p><Button variant="outline" onClick={() => { void periods.refetch(); void options.refetch(); }}>Retry loading</Button></div>}
      {editor ? <PeriodEditor key={editor.period?.id ?? "new"} initialPeriod={editor.period} staff={options.data.staff} onSaved={saved} onClose={() => setEditor(null)} /> : (
        <section aria-label="Appraisal periods" className="space-y-3">
          <h2 className="text-lg font-semibold">Periods</h2>
          {!periods.data.items.length ? <div className="rounded-xl border border-dashed px-6 py-12 text-center"><h3 className="font-medium">No monthly periods yet</h3><p className="mt-2 text-sm text-muted-foreground">Start a draft to select staff and assign the people who will review them.</p><Button className="mt-4" variant="outline" onClick={() => setEditor({ period: null })}>Create first period</Button></div> : (
            <ul className="divide-y rounded-xl border">{periods.data.items.map((period) => <li key={period.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="space-y-2"><div className="flex items-center gap-3"><h3 className="font-semibold">{period.month}</h3><Badge variant={period.status === "draft" ? "outline" : "secondary"}>{period.status === "draft" ? "Draft" : period.status === "open" ? "Open" : "Closed"}</Badge></div><p className="text-sm text-muted-foreground">{period.assignments.length} staff · Submission deadline {period.submission_deadline}</p></div>
              <Button variant="outline" aria-label={`${period.status === "draft" ? "Continue setup for" : "View setup for"} ${period.month}`} onClick={() => setEditor({ period })}>{period.status === "draft" ? "Continue setup" : "View saved setup"}</Button>
            </li>)}</ul>
          )}
        </section>
      )}
    </div>
  );
}
