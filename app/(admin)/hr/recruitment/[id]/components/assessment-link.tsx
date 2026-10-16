import Link from "next/link";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";

export function AssessmentLink({
  candidate,
  roleId,
}: {
  candidate: RecruitmentCandidate;
  roleId: string;
}) {
  const summary = candidate.assessment_summary;
  if (!summary && candidate.status !== "interviewing")
    return <span className="text-sm text-muted-foreground">Not started</span>;
  return (
    <Link
      className="inline-flex min-h-9 flex-col justify-center rounded-md px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={`/hr/recruitment/${roleId}/candidates/${candidate.id}/assessment`}
    >
      {summary?.state === "submitted"
        ? `1. Assessment: ${summary.score_100?.toFixed(1) ?? "—"}/100`
        : summary
          ? `1. Continue assessment · ${summary.completed}/${summary.total}`
          : "1. Start assessment"}
      {summary?.state === "submitted" && (
        <span className="text-xs font-normal text-muted-foreground">
          {summary.recommendation}
        </span>
      )}
    </Link>
  );
}
