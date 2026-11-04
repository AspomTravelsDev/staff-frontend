import type { ReviewSummary } from "./types/performance-review";
import type { AppraisalAnswer } from "./types/performance-appraisal";

export function reviewStageLabel(review: Pick<ReviewSummary, "stage" | "reviewer_route">): string {
  return review.stage === "mp" ? "MP assessment" : review.reviewer_route === "compliance" ? "Compliance assessment" : "Supervisor assessment";
}

export function reviewStatusLabel(review: ReviewSummary): string {
  if (review.status === "completed") return "Completed";
  if (review.assessment_status === "submitted") return "Submitted · awaiting MP";
  if (review.can_review) return review.assessment_status === "draft" ? "Draft saved" : "Ready for your review";
  if (review.stage === "mp" && review.status === "awaiting_reviewer") return review.reviewer_route === "compliance" ? "Waiting for Compliance" : "Waiting for supervisor";
  return "Submission closed";
}

export function previewReviewMean(answers: AppraisalAnswer[]): string | null {
  return answers.length && answers.every((answer) => answer.rating !== null)
    ? (answers.reduce((sum, answer) => sum + (answer.rating ?? 0), 0) / answers.length).toFixed(2) : null;
}
