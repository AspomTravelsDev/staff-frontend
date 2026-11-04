import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appraisalStatusLabel } from "@/lib/performance-self-assessment";
import type { AppraisalSummary } from "@/lib/types/performance-appraisal";

export function AppraisalTable({ appraisals, hasAnyAppraisals }: { appraisals: AppraisalSummary[]; hasAnyAppraisals: boolean }) {
  if (!appraisals.length) return <div className="rounded-xl border border-dashed px-6 py-12 text-center"><h3 className="font-medium">{hasAnyAppraisals ? "No matching appraisals" : "No appraisals assigned yet"}</h3><p className="mt-2 text-sm text-muted-foreground">{hasAnyAppraisals ? "Try another search or show all appraisals." : "Your monthly appraisal will appear here when HR opens a period for you."}</p></div>;
  return <ul className="divide-y rounded-xl border">{appraisals.map((appraisal) => <li key={appraisal.id} className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
    <div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">{appraisal.month}</h3><Badge variant={appraisal.can_edit_self ? "outline" : "secondary"}>{appraisalStatusLabel(appraisal)}</Badge></div><p className="text-sm text-muted-foreground">{appraisal.department} · Submission deadline {appraisal.submission_deadline}</p>{appraisal.final_score !== null && <p className="text-sm font-medium tabular-nums">Final score: {Number(appraisal.final_score).toFixed(2)} / 5</p>}</div>
    <Button variant={appraisal.can_edit_self ? "default" : "outline"} asChild><Link href={`/my/performance/${appraisal.id}`} aria-label={`${appraisal.can_edit_self ? "Complete self-assessment for" : "View appraisal for"} ${appraisal.month}`}>{appraisal.can_edit_self ? appraisal.self_status === "draft" ? "Continue draft" : "Complete self-assessment" : "View appraisal"}</Link></Button>
  </li>)}</ul>;
}
