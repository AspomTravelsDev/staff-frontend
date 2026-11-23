import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppraisalPdfButton } from "@/components/performance/appraisal-pdf-button";
import { formatAppraisalTime } from "@/lib/performance-self-assessment";
import { formatPerformanceMonth } from "@/lib/performance-review";
import type { PerformanceResult } from "@/lib/types/performance-result";

export function PerformanceTable({ results }: { results: PerformanceResult[] }) {
  return (
    <ul className="divide-y rounded-xl border">
      {results.map((result) => (
        <li
          key={result.id}
          className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5"
        >
          <div className="min-w-0 space-y-2">
            <h3 className="break-words font-semibold">{result.employee_name}</h3>
            <p className="text-sm text-muted-foreground">
              {result.employee_staff_id} · {result.department} ·{" "}
              {result.type === "appraisal" ? "Appraisal" : "Monthly KPI"} ·{" "}
              {formatPerformanceMonth(result.month)}
            </p>
            <p className="text-sm font-medium tabular-nums">
              {result.type === "appraisal"
                ? `Total ${result.total_score ?? "—"} / ${result.total_max_score ?? "—"} · Average ${Number(result.final_score).toFixed(2)} / 5`
                : `Final score: ${Number(result.final_score).toFixed(2)} / 5`}
            </p>
            <p className="text-sm text-muted-foreground">
              Completed {formatAppraisalTime(result.completed_at)} · MP:{" "}
              {result.mp_reviewer_name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppraisalPdfButton reviewId={result.id} label="Download PDF" />
            <Button variant="outline" asChild>
              <Link
                href={`/hr/performance/${result.id}`}
                aria-label={`View completed result for ${result.employee_name}, ${formatPerformanceMonth(result.month)}`}
              >
                View completed result
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

