"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getAppraisalById } from "@/lib/api/performance-appraisal";
import { useSaveSelfAppraisal } from "@/lib/api/hooks/use-performance-appraisal";
import { appraisalRatingScale, appraisalStatusLabel, formatAppraisalTime, selfAssessmentValues } from "@/lib/performance-self-assessment";
import type { AppraisalAnswer, PerformanceAppraisal, Rating } from "@/lib/types/performance-appraisal";
import { AssessmentReadOnly } from "@/components/performance/assessment-read-only";

export function SelfAppraisalForm({ initialAppraisal }: { initialAppraisal: PerformanceAppraisal }) {
  const router = useRouter();
  const [appraisal, setAppraisal] = useState(initialAppraisal);
  const [values, setValues] = useState(() => selfAssessmentValues(initialAppraisal));
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"submit" | "discard" | null>(null);
  const save = useSaveSelfAppraisal();
  const dirty = JSON.stringify(values) !== JSON.stringify(selfAssessmentValues(appraisal));
  const answered = values.answers.filter((answer) => answer.rating !== null).length;

  function acceptSaved(saved: PerformanceAppraisal) {
    setAppraisal(saved);
    setValues(selfAssessmentValues(saved));
    setError("");
  }

  const reload = useMutation({
    mutationFn: () => getAppraisalById(appraisal.id),
    onSuccess: acceptSaved,
    onError: (failure) => setError(failure instanceof Error ? failure.message : "Unable to reload your saved appraisal."),
  });
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

  async function persist(submit: boolean) {
    if (pending) return;
    setError("");
    try {
      const saved = await save.mutateAsync({ id: appraisal.id, data: values, submit });
      acceptSaved(saved);
      toast.success(submit ? "Self-assessment submitted" : "Draft saved");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save. Please try again.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const missing = values.answers.findIndex((answer) => answer.rating === null);
    if (missing !== -1) {
      setError("Choose a rating from 1 to 5 for every KPI before submitting. You can save an incomplete draft.");
      document.getElementById(`rating-${values.answers[missing].criterion_id}`)?.focus();
      return;
    }
    if (!values.answers.length) { setError("No KPI criteria are available. Contact HR before submitting."); return; }
    setDialog("submit");
  }

  return <div className="space-y-6 pb-8">
    <Button variant="outline" disabled={pending} onClick={() => dirty ? setDialog("discard") : router.push("/my/performance")}>Back to My Performance</Button>
    <header className="space-y-2"><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">{appraisal.month} self-assessment</h1><Badge variant="outline">{appraisalStatusLabel(appraisal)}</Badge></div><p className="text-sm text-muted-foreground">{appraisal.employee_name} · {appraisal.employee_staff_id} · {appraisal.department}{appraisal.is_supervisor ? " · Supervisor" : ""}</p><p className="text-sm">Submission deadline: {appraisal.submission_deadline}. {appraisal.reviewer_name ? `Next reviewer: ${appraisal.reviewer_name}. ` : ""}MP: {appraisal.mp_reviewer_name}.</p></header>
    {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><p>For a draft changed elsewhere, reload the saved version below. Reloading discards unsaved edits on this page.</p><Button variant="outline" disabled={pending} onClick={() => reload.mutate()}>Reload saved version</Button></div>}
    {appraisal.final_score !== null && <p className="text-lg font-semibold tabular-nums">Final score: {Number(appraisal.final_score).toFixed(2)} / 5</p>}
    {!appraisal.can_edit_self ? <><p className="text-sm text-muted-foreground">{appraisal.blocked_reason}</p><AssessmentReadOnly appraisal={appraisal} assessment={appraisal.self_assessment} title="Your self-assessment" /></> : <>
      <section aria-labelledby="rating-scale-heading" className="space-y-3"><h2 id="rating-scale-heading" className="font-semibold">Rating scale</h2><p className="text-sm text-muted-foreground">Rate each saved department KPI against its target. Choose each rating yourself; unanswered criteria are left blank.</p><ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">{appraisalRatingScale.map((item) => <li key={item.value}><span className="font-semibold">{item.value}</span> · {item.label}</li>)}</ul></section>
      <form onSubmit={submit} noValidate className="space-y-6">
        <fieldset disabled={pending} className="min-w-0 space-y-6"><legend className="sr-only">Your KPI ratings and comments</legend><div className="flex flex-wrap justify-between gap-2 text-sm" aria-live="polite"><p>{answered} of {appraisal.criteria.length} KPI ratings completed</p><p className="text-muted-foreground">{dirty ? "Unsaved changes" : appraisal.self_status === "draft" ? `Draft saved ${formatAppraisalTime(appraisal.self_updated_at)}` : "Not yet saved"}</p></div>
          <div className="divide-y rounded-xl border">{appraisal.criteria.map((criterion, index) => <section key={criterion.id} className="space-y-4 p-4 sm:p-5" aria-labelledby={`criterion-${criterion.id}`}><div className="space-y-2"><h2 id={`criterion-${criterion.id}`} className="break-words font-semibold">{criterion.name}</h2><p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{criterion.description}</p><p className="whitespace-pre-wrap break-words text-sm"><span className="font-medium">Target: </span>{criterion.expectation}</p></div>
            <div className="max-w-xl space-y-2"><Label htmlFor={`rating-${criterion.id}`}>Your rating</Label><select id={`rating-${criterion.id}`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={values.answers[index].rating ?? ""} onChange={(event) => updateAnswer(index, "rating", event.target.value ? Number(event.target.value) as Rating : null)}><option value="">Choose a rating</option>{appraisalRatingScale.map((item) => <option key={item.value} value={item.value}>{item.value} · {item.label}</option>)}</select></div>
            <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor={`comment-${criterion.id}`}>Comment (optional)</Label><Textarea id={`comment-${criterion.id}`} maxLength={3000} value={values.answers[index].comment ?? ""} onChange={(event) => updateAnswer(index, "comment", event.target.value)} placeholder="Explain your rating or what you achieved." /></div><div className="space-y-2"><Label htmlFor={`evidence-${criterion.id}`}>Evidence note or link (optional)</Label><Textarea id={`evidence-${criterion.id}`} maxLength={3000} value={values.answers[index].evidence ?? ""} onChange={(event) => updateAnswer(index, "evidence", event.target.value)} placeholder="Add a work example, result or supporting link." /></div></div>
          </section>)}</div>
          <div className="space-y-2"><Label htmlFor="self-overall-comment">Overall comment (optional)</Label><Textarea id="self-overall-comment" maxLength={5000} value={values.comment ?? ""} onChange={(event) => { setValues((previous) => ({ ...previous, comment: event.target.value })); setError(""); }} placeholder="Reflect on your progress, challenges or support needed this month." /></div>
          <div className="space-y-3 border-t pt-4"><p className="text-sm text-muted-foreground">Drafts are private to you. Submitting sends your answers to the assigned review stage and locks your self-assessment.</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => void persist(false)}>Save draft</Button><Button type="submit">Submit self-assessment</Button></div></div>
        </fieldset>
      </form>
    </>}
    {pending && <p role="status" className="text-sm text-muted-foreground">{reload.isPending ? "Reloading saved version…" : save.variables?.submit ? "Submitting your self-assessment…" : "Saving your draft…"}</p>}
    {appraisal.submitted_feedback.map((assessment) => <AssessmentReadOnly key={assessment.id} appraisal={appraisal} assessment={assessment} title={assessment.stage === "mp" ? "MP assessment" : appraisal.reviewer_route === "compliance" ? "Compliance assessment" : "Supervisor assessment"} />)}
    <AlertDialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{dialog === "submit" ? "Submit your self-assessment?" : "Leave without saving?"}</AlertDialogTitle><AlertDialogDescription>{dialog === "submit" ? "Your current ratings and comments will be saved and submitted together. You will be able to read them, but cannot edit them after submission." : "Your unsaved changes will be lost. Your last saved draft will remain available."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => { if (dialog === "submit") void persist(true); else router.push("/my/performance"); setDialog(null); }}>{dialog === "submit" ? "Submit self-assessment" : "Leave without saving"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
