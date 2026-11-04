import type { PipelineContext, PipelineStage } from "../types/recruitment-pipeline";
import type { RecruitmentFinalReview } from "../types/recruitment-final-review";

export type StageDocumentMode = "worksheet" | "report" | "candidate";
export interface StageDocumentSection { title: string; lines: string[]; writingSpace?: boolean }
export interface StageDocument { title: string; candidate: string; role: string; reference: string; status: string; sections: StageDocumentSection[] }

export function hasStageReport(context: PipelineContext, stage: PipelineStage): boolean {
  if (context.records.some(record => record.stage === stage)) return true;
  if (stage === "cv_screening") return context.candidate.ai_score != null || !!context.candidate.ai_summary;
  if (stage === "management_review") return context.events.some(event => event.event.startsWith("management_") || event.event === "review_submitted");
  if (stage === "offer_preparation") return !!context.candidate.onboarding_application_id;
  return false;
}

export function hasFinalRubric(context: PipelineContext, review: RecruitmentFinalReview | null): boolean {
  return context.records.length > 0 || !!context.candidate.interview_rubric || !!review?.hr_comments || !!review?.ai;
}

const rubricScores = [
  ["cultural_fit", "Cultural fit", 5], ["career_motivation", "Career motivation", 5],
  ["teamwork", "Teamwork", 5], ["technical_skills", "Technical skills", 5],
  ["leadership_capabilities", "Leadership capabilities", 5], ["self_awareness", "Self-awareness", 5],
  ["critical_thinking", "Critical thinking", 5], ["social_skills", "Social skills", 5],
  ["communication", "Communication", 5], ["test_score", "Test score", 10],
] as const;

/** The final rubric consolidates saved evidence; it never invents competency marks. */
export function buildFinalRubric(context: PipelineContext, mode: "worksheet" | "report", review: RecruitmentFinalReview | null = null): StageDocument {
  const report = mode === "report";
  const rubric = report ? context.candidate.interview_rubric : null;
  const sections: StageDocumentSection[] = [];
  const add = (title: string, lines: string[], writingSpace = false) => sections.push({ title, lines, writingSpace });
  const value = (label: string, val: unknown) => `${label}: ${val == null || val === "" ? report ? "Not recorded" : "____________________________" : String(val)}`;
  add("Reviewer", [value("Name", rubric?.reviewer_info?.name), value("Designation", rubric?.reviewer_info?.designation), value("Date", rubric?.reviewer_info?.date)]);
  add("Stage assessment rubric", ["Stage scores are the saved assessment results. Competency marks below are a separate interview rubric and do not replace the pipeline score.",
    ...(["cv_screening", "call_screening", "oral_interview", "written_exam", "practical"] as const).map(stage => {
      const record = context.records.find(item => item.stage === stage);
      if (!report) return `${labels[stage]}: ____________________________`;
      const score = stage === "cv_screening" ? context.candidate.ai_score : record?.results?.score_100;
      return `${labels[stage]}: ${record?.state ?? "Not started"}; ${stage === "call_screening" ? record?.payload.compatibility ?? "Not assessed" : score == null ? "Not scored" : `${score}/100`}`;
    }), value("Combined pipeline score / 100", report ? context.final_score : null),
  ]);
  add("Interview competency rubric", [...rubricScores.map(([key, label, maximum]) => value(`${label} / ${maximum}`, rubric?.scores?.[key])), value("Recorded total / 55", rubric?.scores?.total_score)]);
  if (report) {
    for (const record of context.records.filter(item => item.stage !== "offer_preparation")) {
      add(`${labels[record.stage]} - evidence`, [value("Notes", record.payload.notes), value("Strengths", record.payload.strengths), value("Concerns", record.payload.concerns), value("HR recommendation", record.payload.recommendation), value("Advancement exception", record.payload.advancement_note)]);
    }
    if (rubric) add("Recorded interview observations", [value("Strengths", rubric.qualitative?.key_strengths), value("Weaknesses", rubric.qualitative?.weakness_areas), value("Interview comments", rubric.qualitative?.comments_from_interview)]);
    if (review?.ai) {
      add("AI review - decision support", [value("Generated", review.ai.generated_at), value("Requested by", review.ai.generated_by.name), review.ai_stale ? "OUTDATED: assessment evidence has changed. Regenerate this review before relying on it." : "Based on the saved evidence at generation time. HR retains responsibility for the decision."]);
      add("AI strengths", review.ai.strengths.length ? review.ai.strengths : ["No evidence-supported strengths identified."]);
      add("AI weaknesses / areas to develop", review.ai.weaknesses.length ? review.ai.weaknesses : ["No evidence-supported weaknesses identified."]);
      add("AI comments", [review.ai.comments]);
      if (review.ai.missing_evidence.length) add("Missing evidence", review.ai.missing_evidence);
    } else add("AI review", ["Not generated. No AI findings have been inferred."]);
  } else {
    add("Key strengths", ["________________________________________________________"], true);
    add("Weaknesses / areas to develop", ["________________________________________________________"], true);
  }
  add("HR final comments", [value("Comments", report ? review?.hr_comments : null), ...(report ? [value("Saved by", review?.hr_updated_by?.name), value("Saved at", review?.hr_updated_at)] : [])], !report);
  add("HR sign-off", ["Name and signature: ____________________________", "Date: ____________________________"], !report);
  return { title: `Final recruitment rubric - ${report ? "Saved report" : "Blank worksheet"}`, candidate: context.candidate.name, role: context.role.title, reference: context.candidate.id,
    status: report ? `${review?.ready ? "Assessments complete" : "Assessment in progress"} | Saved record | Revision ${context.candidate.pipeline_revision ?? "N/A"}` : "Blank worksheet - HR use only", sections };
}

const labels: Record<PipelineStage, string> = {
  cv_screening: "CV screening", call_screening: "Call screening", oral_interview: "Oral interview",
  written_exam: "Written exam", practical: "Practical exercise", management_review: "Management review", offer_preparation: "Offer & onboarding",
};

/** Candidate papers deliberately omit all saved answers, grades and assessor guidance. */
export function buildStageDocument(context: PipelineContext, stage: PipelineStage, mode: StageDocumentMode): StageDocument {
  if (mode === "candidate" && stage !== "written_exam") throw new Error("Candidate papers are available for the written exam only.");
  const record = context.records.find(item => item.stage === stage);
  const definition = record?.definition ?? context.role.pipeline_config ?? context.definition;
  const report = mode === "report";
  const candidatePaper = mode === "candidate";
  const payload = report ? record?.payload ?? {} : {};
  const sections: StageDocumentSection[] = [];
  const add = (title: string, lines: string[], writingSpace = false) => sections.push({ title, lines, writingSpace });
  const value = (label: string, val: unknown) => `${label}: ${val == null || val === "" ? report ? "Not recorded" : "____________________________" : String(val)}`;
  const questions = (items: { id: string; text?: string; label?: string; guide?: string; anchors?: Record<string, string> | null; follow_ups?: string[] }[], max: number) => {
    items.forEach((item, index) => add(`${index + 1}. ${item.text ?? item.label}`, [
      ...(!candidatePaper && item.guide ? [`Assessor guide: ${item.guide}`] : []),
      ...(!candidatePaper ? Object.entries(item.anchors ?? {}).map(([score, text]) => `${score}/5: ${text}`) : []),
      ...(!candidatePaper ? (item.follow_ups ?? []).map(text => `Follow-up: ${text}`) : []),
      ...(!candidatePaper ? [value(`Score / ${max}`, payload.grades?.[item.id])] : []),
    ], !report));
  };
  if (!candidatePaper) add("Assessment details", [value("Assessor", report ? record?.updated_by?.name : null), value("Assessment date", report ? record?.updated_at : null)]);
  if (stage === "cv_screening") {
    add("CV review", [value("CV file", context.candidate.cv_original_name), value("HR reviewed CV", report ? payload.reviewed ? "Yes" : "Not confirmed" : null), value("AI fit score / 100", report ? context.candidate.ai_score : null), value("AI summary", report ? context.candidate.ai_summary : null)], !report);
  } else if (stage === "call_screening") {
    add("Call screening checklist", [
      value("Salary expectation (NGN)", payload.salary_expectation), value("Location", payload.location), value("Age", payload.age),
      value("NYSC status", payload.nysc_status), value("Accommodation", payload.accommodation), value("Notice period / availability", payload.notice_period),
      value("Compatibility", payload.compatibility), value("Interview date and time", payload.scheduled_at), value("Interview mode", payload.interview_mode),
    ], !report);
  } else if (stage === "oral_interview") {
    add("Scoring instructions", ["Score each answer from 1 to 5. Use the notes section to record interview evidence."]);
    questions(definition.oral_questions, 5);
  } else if (stage === "written_exam") {
    add(candidatePaper ? "Candidate instructions" : "HR marking instructions", [candidatePaper ? "Answer each question. Use additional sheets where necessary. Complete the computer exercise as instructed by HR." : "Score written answers and computer skills from 0 to 5. Written answers contribute 60%; computer skills contribute 40% of this stage."]);
    questions(definition.written_questions, 5);
    add("Computer skills", candidatePaper ? ["HR will provide the computer exercise instructions separately."] : definition.computer_criteria.flatMap(item => [value(`${item.label} / 5`, payload.grades?.[item.id]), ...(item.guide ? [`Assessor guide: ${item.guide}`] : [])]), !report);
  } else if (stage === "practical") {
    add("HR-selected practical exercise", ["HR selects the practical exercise appropriate to the role. No preset questions are required.", value("Practical score / 10", report ? payload.practical_score ?? (record?.results.score_100 != null ? record.results.score_100 / 10 : null) : null)], !report);
  } else if (stage === "management_review") {
    add("Assessment summary", [value("Combined score / 100", report ? context.final_score : null), ...context.records.filter(item => ["oral_interview", "written_exam", "practical"].includes(item.stage)).map(item => report ? `${labels[item.stage]}: ${item.state}; ${item.results.score_100 == null ? "Not scored" : `${item.results.score_100}/100`}` : `${labels[item.stage]}: ____________________________`)]);
    if (report) for (const item of context.records.filter(item => item.stage !== "management_review")) add(labels[item.stage], [value("Stage state", item.state), value("Notes", item.payload.notes), value("Exception note", item.payload.advancement_note)]);
    add("HR recommendation", [value("Recommendation", payload.recommendation), value("Strengths", payload.strengths), value("Concerns", payload.concerns)], !report);
    if (report) add("Recorded management decisions", context.events.filter(item => item.event.startsWith("management_")).map(item => `${item.created_at}: ${item.event.replace("management_", "")} by ${item.actor.name}${item.reason ? ` - ${item.reason}` : ""}`).concat("Current saved record; this download is not an immutable management submission."));
    else add("Management decision", ["Approve / Hold / Return to HR / Decline", "Reason: ____________________________", "Reviewer and date: ____________________________"], true);
  } else {
    const app = context.candidate.offer_application;
    add("Offer and onboarding checklist", ["This checklist is not an offer letter. Generate official offer documents from the approved offer workflow.", value("Application reference", report ? context.candidate.onboarding_application_id : null), value("Candidate status", report ? context.candidate.status : null), value("Offer state", report ? app?.offer.state : null), value("Gross salary (NGN)", report ? app?.employment_terms.gross_salary : null), value("Start date", report ? app?.employment_terms.effective_date : null), value("Reporting to", report ? app?.employment_terms.reporting_to : null)], !report);
  }
  if (!candidatePaper) {
    if (report && record) add("Stage result", [value("Score / 100", record.results.score_100), value("Pass mark (%)", record.results.threshold), value("Result", record.state === "skipped" ? "Skipped" : record.results.passed == null ? "Incomplete / not assessed" : record.results.passed ? "Passed" : "Below standard"), ...record.results.checks.map(check => `${check.label}: ${check.passed ? "Passed" : "Review required"}`)]);
    add("Notes and evidence", [value("Notes", payload.notes), value("Exception / advancement reason", payload.advancement_note)], !report);
    if (report) {
      const history = context.events.filter(event => event.from_stage === stage || event.to_stage === stage)
        .map(event => `${event.created_at}: ${event.event} by ${event.actor.name}${event.reason ? ` - ${event.reason}` : ""}`);
      add("Decision history for this stage", history.length ? history : ["No decisions recorded."]);
    }
    else add("Sign-off", ["Assessor signature: ____________________________", "Date: ____________________________"]);
  }
  return { title: `${labels[stage]} - ${candidatePaper ? "Candidate paper" : report ? "Saved assessment" : "HR worksheet"}`, candidate: context.candidate.name, role: context.role.title, reference: context.candidate.id, status: candidatePaper ? "Candidate copy" : report ? `${record?.state ?? "Not started"} | Saved record | Revision ${context.candidate.pipeline_revision ?? "N/A"}` : "Blank worksheet - HR use only", sections };
}
