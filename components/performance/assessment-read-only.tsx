import { appraisalRatingScale, formatAppraisalTime } from "@/lib/performance-self-assessment";
import type { AppraisalAssessment } from "@/lib/types/performance-appraisal";
import type { PeriodCriterion, ReviewerRoute } from "@/lib/types/performance-period";
import { FormattedChatMessage } from "@/components/chat/formatted-chat-message";

const sectionCommentLabels: Record<string, string> = {
  job_achievements: "Job achievements", initiatives_achieved: "Initiatives achieved",
  improvement_areas: "Improvement areas", recommendation: "Suggestion / recommendation",
  justification: "Justification", management_comment: "Management comment",
};

export function AssessmentReadOnly({ appraisal, assessment, title, assessments }: { appraisal: { criteria: PeriodCriterion[]; type?: "monthly_kpi" | "appraisal"; reviewer_route?: ReviewerRoute }; assessment: AppraisalAssessment | null; title: string; assessments?: AppraisalAssessment[] }) {
  const isComparison = appraisal.type === "appraisal" && Boolean(assessments);
  const selfAssessment = assessments?.find((item) => item.stage === "self");
  const supervisorAssessment = assessments?.find((item) => item.stage === "supervisor" || item.stage === "reviewer" || item.stage === "compliance");
  const managementAssessment = assessments?.find((item) => item.stage === "mp");
  const intermediateLabel =
    appraisal.reviewer_route === "compliance" ||
    supervisorAssessment?.stage === "compliance"
      ? "Compliance"
      : "Supervisor";
  const comparisonAverages = [selfAssessment, supervisorAssessment, managementAssessment].map((source) => {
    const ratings = source?.answers.flatMap((answer) => answer.rating === null ? [] : [answer.rating]) ?? [];
    return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
  });
  const answers = new Map(assessment?.answers.map((answer) => [answer.criterion_id, answer]) ?? []);
  const rated = appraisal.criteria.map((criterion) => answers.get(criterion.id)?.rating).filter((rating): rating is NonNullable<typeof rating> => rating !== null && rating !== undefined);
  const total = rated.reduce((sum, rating) => sum + rating, 0);
  const average = rated.length ? total / rated.length : null;
  const isReviewerStage = Boolean(assessment?.stage && assessment.stage !== "self");
  const showCriteriaList = !isComparison && !(isReviewerStage && (appraisal.type === "appraisal" || rated.length === 0));
  const showRatingStats = Boolean(assessment) && (!isReviewerStage || rated.length > 0);
  return <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{assessment?.submitted_at ? `Submitted ${formatAppraisalTime(assessment.submitted_at)}` : assessment ? `Draft saved ${formatAppraisalTime(assessment.updated_at)}` : "No answers were saved."}</p></div>{showRatingStats && <div className="flex flex-wrap gap-x-6 gap-y-2 border-y py-2 text-sm"><p><span className="text-muted-foreground">Rated </span><span className="font-semibold tabular-nums">{rated.length}/{appraisal.criteria.length}</span></p><p><span className="text-muted-foreground">Total </span><span className="font-semibold tabular-nums">{total}/{appraisal.criteria.length * 5}</span></p><p><span className="text-muted-foreground">Average </span><span className="font-semibold tabular-nums">{average === null ? "—" : `${average.toFixed(2)} / 5`}</span></p></div>}</div>
    {isComparison ? <><div className="grid gap-3 sm:grid-cols-3">{["Staff average", `${intermediateLabel} average`, "Management average"].map((label, index) => <div key={label} className="rounded-lg border bg-muted/30 px-4 py-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{comparisonAverages[index] === null ? "—" : `${comparisonAverages[index]?.toFixed(2)} / 5`}</p></div>)}</div><div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/40 text-left"><tr><th className="min-w-64 px-4 py-3 font-medium">Criterion</th><th className="min-w-32 px-4 py-3 font-medium">Staff</th><th className="min-w-32 px-4 py-3 font-medium">{intermediateLabel}</th><th className="min-w-32 px-4 py-3 font-medium">Management</th></tr></thead><tbody className="divide-y">{appraisal.criteria.map((criterion, index) => {
      const columns = [selfAssessment, supervisorAssessment, managementAssessment];
      return <tr key={criterion.id}><td className="max-w-80 px-4 py-3 font-medium"><span className="mb-1 block text-xs font-normal text-muted-foreground">{criterion.key_result_area ?? `Criterion ${index + 1}`}</span>{criterion.name}</td>{columns.map((source, columnIndex) => {
        const rating = source?.answers.find((answer) => answer.criterion_id === criterion.id)?.rating;
        const scale = appraisalRatingScale.find((item) => item.value === rating);
        return <td key={columnIndex} className="px-4 py-3 align-top">{scale ? <><span className="font-semibold tabular-nums">{scale.value} / 5</span><span className="mt-0.5 block text-xs text-muted-foreground">{["Unsatisfactory · <50%", "Requires improvement · 50–69%", "Satisfactory · 70–80%", "Exceeded expectations · 81–90%", "Exceptional · >90%"][scale.value - 1]}</span></> : "—"}</td>;
      })}</tr>;
    })}</tbody></table></div></> : showCriteriaList ? <ul className="divide-y rounded-lg border">{appraisal.criteria.map((criterion, index) => {
      const answer = answers.get(criterion.id);
      const scale = appraisalRatingScale.find((item) => item.value === answer?.rating);
      const scaleLabel = appraisal.type === "appraisal" && scale ? ["Unsatisfactory · <50%", "Requires improvement · 50–69%", "Satisfactory · 70–80%", "Exceeded expectations · 81–90%", "Exceptional · >90%"][scale.value - 1] : scale?.label;
      return <li key={criterion.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex items-start gap-3"><span className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">{criterion.key_result_area}</p><h3 className="break-words font-medium">{criterion.name}</h3>{appraisal.type !== "appraisal" && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Target:</span> {criterion.expectation}</p>}{answer?.comment && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{answer.comment}</p>}</div></div></div><div className="flex items-center gap-2 sm:justify-end"><span className="text-xs text-muted-foreground">{scaleLabel ?? "Unanswered"}</span><span className="min-w-12 rounded-md bg-muted px-2.5 py-1.5 text-center text-sm font-semibold tabular-nums">{scale ? `${scale.value}/5` : "—"}</span></div></li>;
    })}</ul> : null}
    {assessment?.section_comments && Object.entries(assessment.section_comments).filter(([, comment]) => !!comment).map(([key, comment]) => <div key={key} className="rounded-lg bg-muted/40 px-4 py-3"><h3 className="text-sm font-medium">{sectionCommentLabels[key] ?? "Comment"}</h3><FormattedChatMessage content={comment} className="mt-1 text-sm text-muted-foreground" /></div>)}
    {assessment?.comment && <div className="rounded-lg bg-muted/40 px-4 py-3"><h3 className="text-sm font-medium">Overall comment</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{assessment.comment}</p></div>}
  </section>;
}
