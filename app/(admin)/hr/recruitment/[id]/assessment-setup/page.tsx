import Link from "next/link";
import { getRecruitmentRole } from "@/lib/api/recruitment";
import {
  getAssessmentBank,
  getAssessmentPlan,
} from "@/lib/api/applicant-assessment";
import { AssessmentSetup } from "../components/assessment-setup";

export const dynamic = "force-dynamic";
export default async function AssessmentSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [roleData, bank, plan] = await Promise.all([
    getRecruitmentRole(id),
    getAssessmentBank(),
    getAssessmentPlan(id),
  ]);
  if (!bank.success || !plan.success)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Assessment setup unavailable</h1>
        <p role="alert">
          {!bank.success
            ? bank.error
            : !plan.success
              ? plan.error
              : "Please retry."}
        </p>
        <Link
          className="underline underline-offset-4"
          href={`/hr/recruitment/${id}`}
        >
          Back to vacancy
        </Link>
      </div>
    );
  return (
    <AssessmentSetup
      role={roleData.role}
      bank={bank.data}
      initialPlan={plan.data}
    />
  );
}
