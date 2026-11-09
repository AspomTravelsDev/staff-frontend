import type { ReviewSummary } from "./types/performance-review";
import type { AppraisalAnswer } from "./types/performance-appraisal";

export function formatPerformanceMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return value;
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

export function reviewStageLabel(review: Pick<ReviewSummary, "reviewer_route" | "type"> & { stage: NonNullable<ReviewSummary["stage"]> }): string {
  const labels = { reviewer: review.reviewer_route === "compliance" ? "Compliance assessment" : "Supervisor assessment", supervisor: review.type === "appraisal" ? "Supervisor assessment" : "Supervisor review", hr: "HR review", compliance: review.type === "appraisal" ? "Compliance assessment" : "Compliance review", mp: review.type === "appraisal" ? "Management assessment" : "MP assessment" };
  return labels[review.stage];
}

export function reviewStatusLabel(review: ReviewSummary): string {
  if (review.status === "completed") return "Completed";
  if (review.assessment_status === "submitted") return "Review submitted";
  if (review.can_review) return review.assessment_status === "draft" ? "Draft saved" : "Ready for your review";
  const currentStage = review.current_stage ?? (review.stage === "mp" && review.status === "awaiting_reviewer"
    ? (review.reviewer_route === "compliance" ? "reviewer" : "reviewer") : null);
  if (currentStage && currentStage !== review.stage) {
    const current = currentStage === "reviewer" ? (review.reviewer_route === "compliance" ? "Compliance" : "supervisor") : currentStage;
    return `Waiting for ${current === "mp" && review.type === "appraisal" ? "management" : current}`;
  }
  return "Submission closed";
}

export function previewReviewMean(answers: AppraisalAnswer[]): string | null {
  return answers.length && answers.every((answer) => answer.rating !== null)
    ? (answers.reduce((sum, answer) => sum + (answer.rating ?? 0), 0) / answers.length).toFixed(2) : null;
}
