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

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account || !userHasRole(user, "hr")) redirect("/dashboard");
    const { id } = await params;
    const response = await getCompletedResult(id);
    if (!response.success && response.error.code === "HTTP_404") notFound();
    const result = await callAction(async () => response);
    return <div className="space-y-6 pb-8"><Button variant="outline" asChild><Link href="/hr/performance">Back to completed results</Link></Button><header className="space-y-2"><h1 className="text-2xl font-bold">{result.month} completed appraisal</h1><p className="break-words font-medium">{result.employee_name} · {result.employee_staff_id}</p><p className="text-sm text-muted-foreground">{result.department}{result.is_supervisor ? " · Supervisor" : ""} · Completed {formatAppraisalTime(result.completed_at)}</p><p className="text-lg font-semibold tabular-nums">Final score: {Number(result.final_score).toFixed(2)} / 5</p><p className="max-w-2xl text-sm text-muted-foreground">The final result is the equally weighted mean of MP’s KPI ratings. Each assessor’s submitted ratings and comments are preserved separately below.</p></header>{result.assessments.map((assessment) => <AssessmentReadOnly key={assessment.id} appraisal={result} assessment={assessment} title={assessment.stage === "self" ? "Staff self-assessment" : assessment.stage === "mp" ? `MP assessment · ${result.mp_reviewer_name}` : `${result.reviewer_route === "compliance" ? "Compliance" : "Supervisor"} assessment · ${result.reviewer_name}`} />)}</div>;
  }, "Unable to load this completed appraisal");
}
