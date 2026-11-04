import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatAppraisalTime } from "@/lib/performance-self-assessment";
import type { PerformanceResult } from "@/lib/types/performance-result";

export function PerformanceTable({ results }: { results: PerformanceResult[] }) {
  return <ul className="divide-y rounded-xl border">{results.map((result) => <li key={result.id} className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5"><div className="min-w-0 space-y-2"><h3 className="break-words font-semibold">{result.employee_name}</h3><p className="text-sm text-muted-foreground">{result.employee_staff_id} · {result.department} · {result.month}</p><p className="text-sm font-medium tabular-nums">Final score: {Number(result.final_score).toFixed(2)} / 5</p><p className="text-sm text-muted-foreground">Completed {formatAppraisalTime(result.completed_at)} · MP: {result.mp_reviewer_name}</p></div><Button variant="outline" asChild><Link href={`/hr/performance/${result.id}`} aria-label={`View completed result for ${result.employee_name}, ${result.month}`}>View completed result</Link></Button></li>)}</ul>;
}
