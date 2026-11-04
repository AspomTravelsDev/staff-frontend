import { appraisalRatingScale, formatAppraisalTime } from "@/lib/performance-self-assessment";
import type { AppraisalAssessment } from "@/lib/types/performance-appraisal";
import type { PeriodCriterion } from "@/lib/types/performance-period";

export function AssessmentReadOnly({ appraisal, assessment, title }: { appraisal: { criteria: PeriodCriterion[] }; assessment: AppraisalAssessment | null; title: string }) {
  const answers = new Map(assessment?.answers.map((answer) => [answer.criterion_id, answer]) ?? []);
  return <section className="space-y-4"><div className="space-y-1"><h2 className="text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{assessment?.submitted_at ? `Submitted ${formatAppraisalTime(assessment.submitted_at)}` : assessment ? `Draft saved ${formatAppraisalTime(assessment.updated_at)}` : "No answers were saved."}</p></div>
    <ul className="divide-y rounded-xl border">{appraisal.criteria.map((criterion) => {
      const answer = answers.get(criterion.id);
      const scale = appraisalRatingScale.find((item) => item.value === answer?.rating);
      return <li key={criterion.id} className="space-y-3 p-4 sm:p-5"><h3 className="break-words font-semibold">{criterion.name}</h3><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{criterion.description}</p><p className="whitespace-pre-wrap break-words text-sm"><span className="font-medium">Target: </span>{criterion.expectation}</p><p className="text-sm font-medium">Rating: {scale ? `${scale.value} / 5 · ${scale.label}` : "Unanswered"}</p>{answer?.comment && <p className="whitespace-pre-wrap break-words text-sm"><span className="font-medium">Comment: </span>{answer.comment}</p>}{answer?.evidence && <p className="whitespace-pre-wrap break-words text-sm"><span className="font-medium">Evidence: </span>{answer.evidence}</p>}</li>;
    })}</ul>
    {assessment?.comment && <div className="space-y-2"><h3 className="font-medium">Overall comment</h3><p className="whitespace-pre-wrap break-words text-sm">{assessment.comment}</p></div>}
  </section>;
}
