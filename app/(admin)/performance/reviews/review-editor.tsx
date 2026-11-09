"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { callAction } from "@/lib/api/action-result";
import { getAssignedReview, saveReviewDraft, submitReview } from "@/lib/api/performance-review.actions";
import { queryKeys } from "@/lib/api/query-keys";
import { appraisalRatingScale, assessmentValues, formatAppraisalTime } from "@/lib/performance-self-assessment";
import { formatPerformanceMonth, reviewStageLabel, reviewStatusLabel } from "@/lib/performance-review";
import type { ReviewDetail } from "@/lib/types/performance-review";
import { PerformancePageHeader } from "@/components/performance/performance-page-header";

const sectionCommentLabels: Record<string, string> = {
  job_achievements: "Job achievements", initiatives_achieved: "Initiatives achieved",
  improvement_areas: "Improvement areas", recommendation: "Suggestion / recommendation",
  justification: "Justification", management_comment: "Management comment",
};

export function ReviewEditor({ initialReview }: { initialReview: ReviewDetail }) {
  const router = useRouter();
  const client = useQueryClient();
  const [review, setReview] = useState(initialReview);
  const [values, setValues] = useState(() => assessmentValues(initialReview.criteria, initialReview.assessment, initialReview.version));
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"submit" | "discard" | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(assessmentValues(review.criteria, review.assessment, review.version));
  const isMp = review.stage === "mp";
  const isStructured = review.type === "appraisal";
  const nextReviewer = isStructured ? "Management" : review.stage === "supervisor" || (review.stage === "reviewer" && review.hr_reviewer_name)
    ? "HR"
    : review.stage === "hr" ? review.compliance_reviewer_name ? "Compliance" : "MP" : "MP";
  const previousRatings = review.preceding_assessments.filter((assessment) => assessment.answers.some((answer) => answer.rating !== null));
  const staffAssessment = review.preceding_assessments.find((assessment) => assessment.stage === "self");
  const staffRatings = staffAssessment?.answers.flatMap((answer) => answer.rating === null ? [] : [answer.rating]) ?? [];
  const staffAverage = staffRatings.length ? staffRatings.reduce((sum, rating) => sum + rating, 0) / staffRatings.length : null;
  const ownRatings = values.answers.flatMap((answer) => answer.rating === null ? [] : [answer.rating]);
  const ownTotal = ownRatings.reduce((sum, rating) => sum + rating, 0);
  const ownAverage = ownRatings.length ? ownTotal / ownRatings.length : null;
  const appraisalScaleLabels = ["Unsatisfactory · <50%", "Requires improvement · 50–69%", "Satisfactory · 70–80%", "Exceeded expectations · 81–90%", "Exceptional · >90%"];

  function previousStageLabel(stage: string): string {
    if (stage === "self") return "Staff";
    if (stage === "supervisor") return "Supervisor";
    if (stage === "hr") return "HR";
    if (stage === "compliance") return "Compliance";
    if (stage === "reviewer") return review.reviewer_route === "compliance" ? "Compliance" : "Supervisor";
    return review.type === "appraisal" ? "Management" : "MP";
  }

  function acceptSaved(saved: ReviewDetail) {
    setReview(saved);
    setValues(assessmentValues(saved.criteria, saved.assessment, saved.version));
    setError("");
  }

  const save = useMutation({
    mutationFn: (submit: boolean) => callAction(() => submit ? submitReview(review.id, values) : saveReviewDraft(review.id, values)),
    onSuccess: (saved, submitted) => {
      acceptSaved(saved);
      void client.invalidateQueries({ queryKey: ["performance", "available-reviews"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
      void client.invalidateQueries({ queryKey: queryKeys.performance.appraisals.all() });
      void client.invalidateQueries({ queryKey: queryKeys.performance.stats() });
      const next = saved.current_stage === "supervisor" || saved.current_stage === "reviewer" ? "Supervisor"
        : saved.current_stage === "hr" ? "HR"
        : saved.current_stage === "compliance" ? "Compliance"
        : saved.current_stage === "mp" ? saved.type === "appraisal" ? "Management" : "MP" : "MP";
      toast.success(submitted ? saved.status === "completed" ? "Appraisal completed" : `Review submitted to ${next}` : "Review draft saved");
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (isStructured && values.answers.some((answer) => answer.rating === null)) {
      setError("Rate every criterion before submitting.");
      document.getElementById("appraisal-ratings")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const requiredComments = isStructured ? review.stage === "mp" ? ["management_comment"] : ["improvement_areas", "recommendation", "justification"] : [];
    if (isStructured && requiredComments.some((key) => !values.section_comments?.[key as keyof NonNullable<typeof values.section_comments>]?.trim())) {
      setError("Complete all required comment fields before submitting.");
      return;
    }
    if (!isStructured && !values.comment?.trim()) {
      setError(isMp ? "Add a final comment before completing this appraisal." : "Add an overall comment before submitting this review.");
      document.getElementById("review-overall-comment")?.focus();
      return;
    }
    setDialog("submit");
  }

  return <div className="space-y-6 pb-8">
    <Button variant="outline" disabled={pending} onClick={() => dirty ? setDialog("discard") : router.push("/performance/reviews")}>Back to Performance Reviews</Button>
    <PerformancePageHeader eyebrow={`${review.type === "appraisal" ? "Appraisal" : "Monthly KPI appraisal"} · ${formatPerformanceMonth(review.month)}`} title={reviewStageLabel(review)} description={`${review.employee_name} · ${review.employee_staff_id} · ${review.department} · Deadline ${review.submission_deadline}`} icon={ClipboardList} actions={<Badge variant="outline">{reviewStatusLabel(review)}</Badge>} />
    {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><p>If this review changed elsewhere, reload its saved version. Reloading discards unsaved edits on this page.</p><Button variant="outline" disabled={pending} onClick={() => reload.mutate()}>Reload saved review</Button></div>}
    {review.final_score !== null && <p className="text-lg font-semibold tabular-nums">{review.type === "appraisal" ? `Final total ${review.total_score ?? "—"} / ${review.total_max_score ?? "—"} · ` : "Final score: "}{Number(review.final_score).toFixed(2)} / 5</p>}
    <section aria-labelledby="previous-assessments-heading" className="space-y-3">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="previous-assessments-heading" className="text-lg font-semibold">Ratings submitted so far</h2>
          {staffAverage !== null && <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Staff average</span>
            <span className="text-sm font-semibold tabular-nums">{staffAverage.toFixed(2)} / 5</span>
          </div>}
        </div>
        <p className="text-sm text-muted-foreground">Earlier scores are read-only. Add your review comment below.</p>
      </div>
      {previousRatings.length ? <div className="overflow-hidden rounded-lg border"><Table><TableHeader><TableRow><TableHead className="min-w-56"><span>{isStructured ? "Key result area / indicator" : "KPI"}</span><Badge variant="outline" className="mt-1.5 border-primary/20 bg-primary/5 text-primary">{formatPerformanceMonth(review.month)}</Badge></TableHead>{previousRatings.map((assessment) => <TableHead key={assessment.id} className="min-w-36">{previousStageLabel(assessment.stage)}<span className="mt-0.5 block text-[10px] font-normal">{formatAppraisalTime(assessment.submitted_at)}</span></TableHead>)}</TableRow></TableHeader><TableBody>{review.criteria.map((criterion) => <TableRow key={criterion.id}><TableCell className="max-w-80 font-medium">{criterion.key_result_area && <span className="mb-1 block text-xs font-normal text-muted-foreground">{criterion.key_result_area}</span>}{criterion.name}</TableCell>{previousRatings.map((assessment) => { const rating = assessment.answers.find((answer) => answer.criterion_id === criterion.id)?.rating; const scale = appraisalRatingScale.find((item) => item.value === rating); return <TableCell key={assessment.id}><span className="font-semibold tabular-nums">{scale ? `${scale.value} / 5` : "—"}</span>{scale && <span className="mt-0.5 block text-xs text-muted-foreground">{isStructured ? appraisalScaleLabels[scale.value - 1] : scale.label}</span>}</TableCell>; })}</TableRow>)}</TableBody></Table></div> : <p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">No earlier {isStructured ? "ratings" : "KPI ratings"} are available for this review.</p>}
      {isStructured && staffAssessment && Object.values(staffAssessment.section_comments ?? {}).some(Boolean) && <section className="grid gap-3 sm:grid-cols-2">{Object.entries(staffAssessment.section_comments ?? {}).filter(([, comment]) => !!comment).map(([key, comment]) => <div key={key} className="rounded-lg border bg-muted/20 p-4"><h3 className="text-sm font-semibold">{sectionCommentLabels[key] ?? "Staff comment"}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{comment}</p></div>)}</section>}
      {review.preceding_assessments.some((assessment) => assessment.stage !== "self") && <div className="space-y-3 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Earlier reviewer comments</h3>
            <p className="text-xs text-muted-foreground">Select a review to read its comment.</p>
          </div>
          <Badge variant="secondary">{review.preceding_assessments.filter((assessment) => assessment.stage !== "self").length} {review.preceding_assessments.filter((assessment) => assessment.stage !== "self").length === 1 ? "comment" : "comments"}</Badge>
        </div>
        <Accordion type="multiple" className="space-y-2">
          {review.preceding_assessments.filter((assessment) => assessment.stage !== "self").map((assessment) => <AccordionItem key={assessment.id} value={assessment.id} className="overflow-hidden rounded-lg border bg-card transition-colors data-open:border-primary/25 data-open:bg-muted/20">
            <AccordionTrigger className="items-center gap-3 px-4 py-3 hover:bg-muted/40 hover:no-underline">
              <span className="min-w-0 flex-1 space-y-1 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{previousStageLabel(assessment.stage)}</Badge>
                  <span className="truncate text-sm font-medium text-foreground">{assessment.assessor_name || "Reviewer"}</span>
                </span>
                <span className="block text-xs font-normal text-muted-foreground">Submitted {formatAppraisalTime(assessment.submitted_at)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
                <MessageSquareText className="size-3.5" aria-hidden="true" />
                <span>Read comment</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="mb-3 space-y-3 rounded-md bg-muted/50 px-4 py-3">
                {Object.entries(assessment.section_comments ?? {}).filter(([, comment]) => !!comment).map(([key, comment]) => <p key={key} className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90"><span className="font-medium">{sectionCommentLabels[key] ?? "Comment"}: </span>{comment}</p>)}
                {assessment.comment ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">{assessment.comment}</p> : !Object.values(assessment.section_comments ?? {}).some(Boolean) && <p className="text-sm leading-6 text-muted-foreground">No comment provided.</p>}
              </div>
            </AccordionContent>
          </AccordionItem>)}
        </Accordion>
      </div>}
    </section>
    {!review.can_review ? <><p className="text-sm text-muted-foreground">{review.blocked_reason}</p>{review.assessment && <section className="space-y-2 rounded-lg border p-4"><div><h2 className="font-semibold">Your saved comment</h2><p className="text-xs text-muted-foreground">{review.assessment.submitted_at ? `Submitted ${formatAppraisalTime(review.assessment.submitted_at)}` : `Draft saved ${formatAppraisalTime(review.assessment.updated_at)}`}</p></div>{Object.entries(review.assessment.section_comments ?? {}).filter(([, comment]) => !!comment).map(([key, comment]) => <div key={key}><p className="text-xs font-medium text-muted-foreground">{sectionCommentLabels[key] ?? "Comment"}</p><p className="whitespace-pre-wrap break-words text-sm">{comment}</p></div>)}{review.assessment.comment && <p className="whitespace-pre-wrap break-words text-sm">{review.assessment.comment}</p>}</section>}</> : <>
      <form onSubmit={submit} noValidate className="space-y-6"><fieldset disabled={pending} className="min-w-0 space-y-6"><legend className="sr-only">Your review comment</legend>
        <div className="flex justify-end text-sm" aria-live="polite"><p className="text-muted-foreground">{dirty ? "Unsaved changes" : review.assessment ? `Draft saved ${formatAppraisalTime(review.assessment.updated_at)}` : "Not yet saved"}</p></div>
        {isStructured && <section id="appraisal-ratings" className="space-y-3"><div><h2 className="font-semibold">Your ratings</h2><p className="text-sm text-muted-foreground">Choose a whole number from 1 to 5 for each indicator. Fractions are not accepted.</p></div><div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary/5 px-4 py-3"><div><p className="text-xs text-muted-foreground">Current total</p><p className="text-lg font-semibold tabular-nums">{ownTotal} / {review.criteria.length * 5}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Current average</p><p className="text-lg font-semibold tabular-nums">{ownAverage === null ? "—" : ownAverage.toFixed(2)} / 5 <span className="text-xs font-normal">({ownRatings.length}/{review.criteria.length} rated)</span></p></div></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead className="min-w-64">Key result area / indicator</TableHead><TableHead className="w-56">Rating</TableHead></TableRow></TableHeader><TableBody>{review.criteria.map((criterion, index) => <TableRow key={criterion.id}><TableCell><span className="block text-xs text-muted-foreground">{criterion.key_result_area}</span><span className="font-medium">{criterion.name}</span></TableCell><TableCell><Select value={values.answers[index]?.rating?.toString() ?? ""} onValueChange={(value) => { setValues((previous) => ({ ...previous, answers: previous.answers.map((answer, answerIndex) => answerIndex === index ? { ...answer, rating: Number(value) as 1 | 2 | 3 | 4 | 5 } : answer) })); setError(""); }}><SelectTrigger aria-label={`Rating for ${criterion.name}`}><SelectValue placeholder="Choose 1–5" /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((score) => <SelectItem key={score} value={String(score)}>{score} · {["Unsatisfactory (<50%)", "Requires improvement (50–69%)", "Satisfactory (70–80%)", "Exceeded expectations (81–90%)", "Exceptional (>90%)"][score - 1]}</SelectItem>)}</SelectContent></Select></TableCell></TableRow>)}</TableBody></Table></div></section>}
        {isStructured ? (isMp ? [{ key: "management_comment", label: "Management comment" }] : [{ key: "improvement_areas", label: "Improvement areas" }, { key: "recommendation", label: "Suggestion / recommendation" }, { key: "justification", label: "Justification" }]).map(({ key, label }) => <div key={key} className="space-y-2"><Label htmlFor={`review-section-${key}`}>{label} (required)</Label><Textarea id={`review-section-${key}`} required maxLength={5000} value={values.section_comments?.[key as keyof NonNullable<typeof values.section_comments>] ?? ""} onChange={(event) => { setValues((previous) => ({ ...previous, section_comments: { ...previous.section_comments, [key]: event.target.value } })); setError(""); }} /></div>) : <div className="space-y-2"><Label htmlFor="review-overall-comment">{isMp ? "Final comment (required)" : "Overall comment (required)"}</Label><Textarea id="review-overall-comment" required maxLength={5000} value={values.comment ?? ""} onChange={(event) => { setValues((previous) => ({ ...previous, comment: event.target.value })); setError(""); }} placeholder={isMp ? "Summarize performance and agreed development priorities." : "Summarize performance and any support or development needed."} /></div>}
        <div className="space-y-3 border-t pt-4"><p className="text-sm text-muted-foreground">Your draft is private. {isMp ? "Completing this appraisal locks your assessment and saves the final result." : `Submitting locks your assessment and advances the appraisal to ${nextReviewer}.`}</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => save.mutate(false)}>Save review draft</Button><Button type="submit">{isMp ? "Complete appraisal" : `Submit review to ${nextReviewer}`}</Button></div></div>
      </fieldset></form>
    </>}
    {pending && <p role="status" className="text-sm text-muted-foreground">{reload.isPending ? "Reloading saved review…" : save.variables ? "Submitting your assessment…" : "Saving your review draft…"}</p>}
    <AlertDialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{dialog === "discard" ? "Leave without saving?" : isMp ? "Complete this appraisal?" : `Submit this review to ${nextReviewer}?`}</AlertDialogTitle><AlertDialogDescription>{dialog === "discard" ? "Unsaved changes will be lost. Your last saved draft remains available." : isMp ? isStructured ? "Management’s ratings and comment will become the final result, and the appraisal will be marked complete." : "Your final comment will be saved, the staff KPI score retained, and the appraisal marked completed." : `Your review will be saved and sent to ${nextReviewer}. This review will become read-only.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => { if (dialog === "discard") router.push("/performance/reviews"); else save.mutate(true); setDialog(null); }}>{dialog === "discard" ? "Leave without saving" : isMp ? "Complete appraisal" : "Submit review"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
