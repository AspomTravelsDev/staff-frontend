import type { PipelineContext, PipelineStage } from "../types/recruitment-pipeline";

export function stageOverview(context: PipelineContext, stage: PipelineStage) {
  const record = context.records.find(item => item.stage === stage);
  if (stage === "management_review") {
    const decision = context.events.find(event => event.event.startsWith("management_"));
    const labels: Record<string, string> = { management_approve: "Approved", management_decline: "Declined", management_hold: "On hold", management_return: "Returned to HR" };
    return { score: null, result: decision ? labels[decision.event] ?? "Review recorded" : context.events.some(event => event.event === "review_submitted") ? "Awaiting decision" : "Not submitted", state: record?.state ?? "Not started" };
  }
  if (stage === "offer_preparation") {
    return { score: null, result: context.candidate.status === "accepted" ? "Accepted" : context.candidate.status === "offered" ? "Offer sent" : context.candidate.onboarding_application_id ? "Offer prepared" : "Not started", state: "Offer & onboarding" };
  }
  const score = stage === "cv_screening" ? context.candidate.ai_score : record?.results?.score_100 ?? null;
  const passed = stage === "call_screening" && record?.payload.compatibility
    ? record.payload.compatibility === "Compatible" ? true : false
    : record?.results?.passed;
  const rejectedHere = context.candidate.pipeline_outcome === "rejected" && context.candidate.pipeline_stage === stage;
  const result = rejectedHere ? passed === false ? "Failed · rejected" : "Rejected by HR"
    : record?.state === "skipped" ? "Skipped by exception"
    : !record ? stage === "cv_screening" && score != null ? "Awaiting HR review" : "Not assessed"
    : record.state === "draft" ? passed === false ? "Below standard · draft" : "In progress"
    : passed === true ? "Passed" : passed === false ? "Failed" : record.results?.manual_review ? "Manually reviewed" : "Completed · unscored";
  return { score, result, state: record?.state ?? "Not started" };
}
