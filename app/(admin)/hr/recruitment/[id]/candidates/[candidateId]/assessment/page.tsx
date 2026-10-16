import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getApplicantAssessment,
  getAssessmentPlan,
  getAssessmentBank,
} from "@/lib/api/applicant-assessment";
import { ApplicantAssessmentScreen } from "../../../components/applicant-assessment-screen";

export const dynamic = "force-dynamic";
export default async function ApplicantAssessmentPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id, candidateId } = await params;
  const result = await getApplicantAssessment(candidateId);
  if (!result.success) {
    if (result.errorCode === "HTTP_404") notFound();
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">
          Applicant Assessment unavailable
        </h1>
        <p role="alert">{result.error}</p>
        <Link href={`/hr/recruitment/${id}`} className="underline">
          Back to vacancy
        </Link>
      </div>
    );
  }
  if (result.data.role.id !== id) notFound();
  const plan = result.data.assessment ? null : await getAssessmentPlan(id);
  if (plan?.success && plan.data && !plan.data.locked_at) {
    const bank = await getAssessmentBank();
    if (bank.success) {
      const definition = plan.data.definition;
      plan.data = {
        ...plan.data,
        definition: {
          ...definition,
          questions: [
            ...bank.data.questions.filter(
              (question) => question.section === "general",
            ),
            ...definition.questions.filter(
              (question) => question.section !== "general",
            ),
          ],
        },
      };
    }
  }
  return (
    <ApplicantAssessmentScreen
      context={result.data}
      initialPlan={plan?.success ? plan.data : null}
      planError={plan && !plan.success ? plan.error : undefined}
    />
  );
}
