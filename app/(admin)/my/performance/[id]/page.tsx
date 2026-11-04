import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { renderDataPage } from "@/lib/api/render-data-page";
import { callAction } from "@/lib/api/action-result";
import { getAppraisalById } from "@/lib/api/performance-appraisal.actions";
import { SelfAppraisalForm } from "../components/self-appraisal-form";

export default async function AppraisalPage({ params }: { params: Promise<{ id: string }> }) {
  return renderDataPage(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.is_active || user.is_department_account) redirect("/dashboard");
    const { id } = await params;
    const result = await getAppraisalById(id);
    if (!result.success && result.error.code === "HTTP_404") notFound();
    const appraisal = await callAction(async () => result);
    return <SelfAppraisalForm key={appraisal.id} initialAppraisal={appraisal} />;
  }, "Unable to load this appraisal");
}
