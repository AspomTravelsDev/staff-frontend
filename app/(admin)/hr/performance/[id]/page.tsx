import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasRole } from "@/types/user-types";
import { getCompletedResult } from "@/lib/api/performance.actions";
import { callAction } from "@/lib/api/action-result";
import { renderDataPage } from "@/lib/api/render-data-page";
import { Button } from "@/components/ui/button";
import { AssessmentReadOnly } from "@/components/performance/assessment-read-only";
import { formatAppraisalTime } from "@/lib/performance-self-assessment";
import { Award } from "lucide-react";
import { PerformancePageHeader } from "@/components/performance/performance-page-header";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !["hr", "compliance", "mp", "md", "super"].some((role) => userHasRole(user, role as Parameters<typeof userHasRole>[1]))) redirect("/dashboard");
    const { id } = await params;
    const response = await getCompletedResult(id);
    if (!response.success && response.error.code === "HTTP_404") notFound();
    const result = await callAction(async () => response);
    return <div className="space-y-6 pb-8"><Button variant="outline" asChild><Link href="/hr/performance">Back to completed results</Link></Button><PerformancePageHeader eyebrow={`${result.type === "appraisal" ? "Appraisal" : "Monthly KPI appraisal"} · ${result.month} · completed`} title={result.employee_name} description={`${result.employee_staff_id} · ${result.department}${result.is_supervisor ? " · Supervisor" : ""} · Completed ${formatAppraisalTime(result.completed_at)}`} icon={Award} meta={<p className="mt-3 text-sm text-muted-foreground">{result.type === "appraisal" ? "The final result uses Management’s ratings. Review comments are preserved by stage below." : "The final result is the average of the staff member’s KPI ratings. Reviewer comments are preserved by stage below."}</p>} actions={<div className="rounded-lg bg-primary/10 px-4 py-2 text-right"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{result.type === "appraisal" ? "Total · Average" : "Final score"}</p><p className="text-xl font-semibold tabular-nums">{result.type === "appraisal" ? `${result.total_score ?? "—"} / ${result.total_max_score ?? "—"} · ` : ""}{Number(result.final_score).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ 5</span></p></div>} />{result.assessments.map((assessment) => { const reviewerTitle = assessment.stage === "supervisor" ? `Supervisor review · ${result.reviewer_name ?? ""}` : assessment.stage === "hr" ? `HR review · ${result.hr_reviewer_name ?? ""}` : assessment.stage === "compliance" ? `Compliance review · ${result.compliance_reviewer_name ?? ""}` : assessment.stage === "reviewer" ? `${result.reviewer_route === "compliance" ? "Compliance" : "Supervisor"} review · ${result.reviewer_name ?? ""}` : result.type === "appraisal" ? `Management review · ${result.mp_reviewer_name}` : `MP review · ${result.mp_reviewer_name}`; return <AssessmentReadOnly key={assessment.id} appraisal={result} assessment={assessment} title={assessment.stage === "self" ? "Staff self-assessment" : reviewerTitle} />; })}</div>;
  }, "Unable to load this completed appraisal");
}
