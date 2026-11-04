"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AssessmentReadOnly } from "@/components/performance/assessment-read-only";
import { callAction } from "@/lib/api/action-result";
import { getAssignedReview, saveReviewDraft, submitReview } from "@/lib/api/performance-review.actions";
import { queryKeys } from "@/lib/api/query-keys";
import { appraisalRatingScale, assessmentValues, formatAppraisalTime } from "@/lib/performance-self-assessment";
import { previewReviewMean, reviewStageLabel, reviewStatusLabel } from "@/lib/performance-review";
import type { AppraisalAnswer, Rating } from "@/lib/types/performance-appraisal";
import type { ReviewDetail } from "@/lib/types/performance-review";

export function ReviewEditor({ initialReview }: { initialReview: ReviewDetail }) {
  const router = useRouter();
  const client = useQueryClient();
  const [review, setReview] = useState(initialReview);
  const [values, setValues] = useState(() => assessmentValues(initialReview.criteria, initialReview.assessment, initialReview.version));
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"submit" | "discard" | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(assessmentValues(review.criteria, review.assessment, review.version));
  const isMp = review.stage === "mp";
  const answered = values.answers.filter((answer) => answer.rating !== null).length;

  function acceptSaved(saved: ReviewDetail) {
    setReview(saved);
    setValues(assessmentValues(saved.criteria, saved.assessment, saved.version));
    setError("");
  }

  const save = useMutation({
    mutationFn: (submit: boolean) => callAction(() => submit ? submitReview(review.id, values) : saveReviewDraft(review.id, values)),
    onSuccess: (saved, submitted) => {
      acceptSaved(saved);
      void client.invalidateQueries({ queryKey: ["performance", "assigned-reviews"] });
      void client.invalidateQueries({ queryKey: queryKeys.performance.appraisals.all() });
      void client.invalidateQueries({ queryKey: queryKeys.performance.stats() });
      toast.success(submitted ? saved.status === "completed" ? "Appraisal completed" : "Review submitted to MP" : "Review draft saved");
    },
    onError: (failure) => setError(failure instanceof Error ? failure.message : "Unable to save your review. Please try again."),
  });
  const reload = useMutation({ mutationFn: () => callAction(() => getAssignedReview(review.id)), onSuccess: acceptSaved, onError: (failure) => setError(failure instanceof Error ? failure.message : "Unable to reload saved review.") });
  const pending = save.isPending || reload.isPending;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateAnswer(index: number, key: "rating" | "comment" | "evidence", value: Rating | string | null) {
    setValues((previous) => ({ ...previous, answers: previous.answers.map((answer, answerIndex) => answerIndex === index ? { ...answer, [key]: value } as AppraisalAnswer : answer) }));
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const missing = values.answers.find((answer) => answer.rating === null);
    if (missing || !values.answers.length) {
      setError("Choose a rating from 1 to 5 for every KPI before submitting. You can save an incomplete draft.");
      if (missing) document.getElementById(`review-rating-${missing.criterion_id}`)?.focus();
      return;
    }
    if (isMp && !values.comment?.trim()) {
      setError("Add a final comment before completing this appraisal.");
      document.getElementById("review-overall-comment")?.focus();
      return;
    }
    setDialog("submit");
  }

  return <div className="space-y-6 pb-8">
    <Button variant="outline" disabled={pending} onClick={() => dirty ? setDialog("discard") : router.push("/my/performance/reviews")}>Back to assigned reviews</Button>
    <header className="space-y-2"><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">{reviewStageLabel(review)}</h1><Badge variant="outline">{reviewStatusLabel(review)}</Badge></div><p className="break-words font-medium">{review.employee_name} · {review.employee_staff_id}</p><p className="text-sm text-muted-foreground">{review.department} · {review.month} · Submission deadline {review.submission_deadline}</p></header>
    {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><p>If this review changed elsewhere, reload its saved version. Reloading discards unsaved edits on this page.</p><Button variant="outline" disabled={pending} onClick={() => reload.mutate()}>Reload saved review</Button></div>}
    {review.final_score !== null && <p className="text-lg font-semibold tabular-nums">Final score: {Number(review.final_score).toFixed(2)} / 5</p>}
    <section aria-labelledby="previous-assessments-heading" className="space-y-3"><h2 id="previous-assessments-heading" className="text-lg font-semibold">Previous submitted assessments</h2><p className="text-sm text-muted-foreground">Read the earlier ratings for context, then give your own assessment against each KPI target.</p>{review.preceding_assessments.map((assessment) => <details key={assessment.id} className="border-b py-4"><summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{assessment.stage === "self" ? "Staff self-assessment" : review.reviewer_route === "compliance" ? "Compliance assessment" : "Supervisor assessment"} · Submitted {formatAppraisalTime(assessment.submitted_at)}</summary><div className="mt-4"><AssessmentReadOnly appraisal={review} assessment={assessment} title={assessment.stage === "self" ? "Staff self-assessment" : "Intermediate assessment"} /></div></details>)}</section>
    {!review.can_review ? <><p className="text-sm text-muted-foreground">{review.blocked_reason}</p>{review.assessment && <AssessmentReadOnly appraisal={review} assessment={review.assessment} title="Your saved assessment" />}</> : <>
      <section className="space-y-3" aria-labelledby="review-rating-scale"><h2 id="review-rating-scale" className="font-semibold">Rating scale</h2><ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">{appraisalRatingScale.map((item) => <li key={item.value}><span className="font-semibold">{item.value}</span> · {item.label}</li>)}</ul></section>
      <form onSubmit={submit} noValidate className="space-y-6"><fieldset disabled={pending} className="min-w-0 space-y-6"><legend className="sr-only">Your assigned KPI assessment</legend>
        <div className="flex flex-wrap justify-between gap-2 text-sm" aria-live="polite"><p>{answered} of {review.criteria.length} KPI ratings completed</p><p className="text-muted-foreground">{dirty ? "Unsaved changes" : review.assessment ? `Draft saved ${formatAppraisalTime(review.assessment.updated_at)}` : "Not yet saved"}</p></div>
        <div className="divide-y rounded-xl border">{review.criteria.map((criterion, index) => <section key={criterion.id} className="space-y-4 p-4 sm:p-5" aria-labelledby={`review-criterion-${criterion.id}`}><div className="space-y-2"><h2 id={`review-criterion-${criterion.id}`} className="break-words font-semibold">{criterion.name}</h2><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{criterion.description}</p><p className="whitespace-pre-wrap break-words text-sm"><span className="font-medium">Target: </span>{criterion.expectation}</p></div>
          <div className="max-w-xl space-y-2"><Label htmlFor={`review-rating-${criterion.id}`}>Your rating</Label><select id={`review-rating-${criterion.id}`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={values.answers[index].rating ?? ""} onChange={(event) => updateAnswer(index, "rating", event.target.value ? Number(event.target.value) as Rating : null)}><option value="">Choose a rating</option>{appraisalRatingScale.map((item) => <option key={item.value} value={item.value}>{item.value} · {item.label}</option>)}</select></div>
          <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor={`review-comment-${criterion.id}`}>Comment (optional)</Label><Textarea id={`review-comment-${criterion.id}`} maxLength={3000} value={values.answers[index].comment ?? ""} onChange={(event) => updateAnswer(index, "comment", event.target.value)} placeholder="Explain your rating against the KPI target." /></div><div className="space-y-2"><Label htmlFor={`review-evidence-${criterion.id}`}>Evidence note or link (optional)</Label><Textarea id={`review-evidence-${criterion.id}`} maxLength={3000} value={values.answers[index].evidence ?? ""} onChange={(event) => updateAnswer(index, "evidence", event.target.value)} placeholder="Add an example, result or supporting link." /></div></div>
        </section>)}</div>
        <div className="space-y-2"><Label htmlFor="review-overall-comment">{isMp ? "Final comment (required)" : "Overall comment (optional)"}</Label><Textarea id="review-overall-comment" aria-required={isMp} maxLength={5000} value={values.comment ?? ""} onChange={(event) => { setValues((previous) => ({ ...previous, comment: event.target.value })); setError(""); }} placeholder={isMp ? "Summarize the final assessment and any agreed development priorities." : "Summarize performance and any support or development needed."} /></div>
        {isMp && <div className="space-y-1"><p className="font-medium tabular-nums">{previewReviewMean(values.answers) === null ? "Rate all KPIs to preview the final score." : `Proposed final score: ${previewReviewMean(values.answers)} / 5`}</p><p className="text-sm text-muted-foreground">The final score is the equally weighted average of your MP ratings. Staff and intermediate reviewer scores remain separate.</p></div>}
        <div className="space-y-3 border-t pt-4"><p className="text-sm text-muted-foreground">Your draft is private. {isMp ? "Completing this appraisal locks your assessment and saves the final result." : "Submitting locks your assessment and advances the appraisal to MP."}</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => save.mutate(false)}>Save review draft</Button><Button type="submit">{isMp ? "Complete appraisal" : "Submit review to MP"}</Button></div></div>
      </fieldset></form>
    </>}
    {pending && <p role="status" className="text-sm text-muted-foreground">{reload.isPending ? "Reloading saved review…" : save.variables ? "Submitting your assessment…" : "Saving your review draft…"}</p>}
    <AlertDialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{dialog === "discard" ? "Leave without saving?" : isMp ? "Complete this appraisal?" : "Submit this review to MP?"}</AlertDialogTitle><AlertDialogDescription>{dialog === "discard" ? "Unsaved changes will be lost. Your last saved draft remains available." : isMp ? "Your current ratings and final comment will be saved, the final score calculated, and the appraisal marked completed. Submitted assessments cannot be edited." : "Your current ratings and comments will be saved and submitted together. The appraisal will advance to MP and your assessment will become read-only."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => { if (dialog === "discard") router.push("/my/performance/reviews"); else save.mutate(true); setDialog(null); }}>{dialog === "discard" ? "Leave without saving" : isMp ? "Complete appraisal" : "Submit review"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
