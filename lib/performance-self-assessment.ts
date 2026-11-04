import type { AppraisalAssessment, AppraisalStatus, AppraisalSummary, PerformanceAppraisal, Rating, SelfAssessmentInput } from "./types/performance-appraisal";
import type { PeriodCriterion } from "./types/performance-period";

export const appraisalRatingScale: { value: Rating; label: string }[] = [
  { value: 1, label: "Well below expectations" },
  { value: 2, label: "Below expectations" },
  { value: 3, label: "Meets expectations" },
  { value: 4, label: "Exceeds expectations" },
  { value: 5, label: "Substantially exceeds expectations" },
];

export function selfAssessmentValues(appraisal: PerformanceAppraisal): SelfAssessmentInput {
  return assessmentValues(appraisal.criteria, appraisal.self_assessment, appraisal.self_version);
}

export function assessmentValues(criteria: PeriodCriterion[], assessment: AppraisalAssessment | null, version: number): SelfAssessmentInput {
  const saved = new Map(assessment?.answers.map((answer) => [answer.criterion_id, answer]) ?? []);
  return {
    version,
    comment: assessment?.comment ?? "",
    answers: criteria.map((criterion) => ({
      criterion_id: criterion.id, rating: saved.get(criterion.id)?.rating ?? null,
      comment: saved.get(criterion.id)?.comment ?? "", evidence: saved.get(criterion.id)?.evidence ?? "",
    })),
  };
}

export function appraisalStatusLabel(appraisal: Pick<AppraisalSummary, "status" | "reviewer_route" | "self_status" | "can_edit_self">): string {
  if (appraisal.status === "awaiting_self") {
    if (!appraisal.can_edit_self) return "Self-assessment closed";
    return appraisal.self_status === "draft" ? "Draft saved" : "Self-assessment due";
  }
  const labels: Record<Exclude<AppraisalStatus, "awaiting_self">, string> = {
    awaiting_reviewer: appraisal.reviewer_route === "compliance" ? "Awaiting Compliance review" : "Awaiting supervisor review",
    awaiting_mp: "Awaiting MP review", completed: "Completed",
  };
  return labels[appraisal.status];
}

export function formatAppraisalTime(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value)) : "Not yet saved";
}
