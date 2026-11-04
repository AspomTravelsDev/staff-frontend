"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRecruitmentPipeline } from "@/lib/api/recruitment-pipeline";
import { getRecruitmentFinalReview, saveRecruitmentFinalComments, generateRecruitmentFinalReview } from "@/lib/api/recruitment-final-review";
import { pipelineLabels, pipelineStages, type PipelineContext, type PipelineStage } from "@/lib/types/recruitment-pipeline";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";
import type { RecruitmentFinalReview } from "@/lib/types/recruitment-final-review";
import { buildStageDocument, buildFinalRubric, hasStageReport, hasFinalRubric, type StageDocumentMode } from "@/lib/recruitment/stage-document";

type DocumentTarget = PipelineStage | "rubric";

export function StageDocumentsDialog({ candidate, onClose, initialContext, initialReview, onReviewUpdate, onContextLoaded }: { candidate: RecruitmentCandidate; onClose: () => void; initialContext?: PipelineContext; initialReview?: RecruitmentFinalReview; onReviewUpdate?: (review: RecruitmentFinalReview) => void; onContextLoaded?: (context: PipelineContext) => void }) {
  const [context, setContext] = useState<PipelineContext | null>(initialContext ?? null);
  const [review, setReview] = useState<RecruitmentFinalReview | null>(initialReview ?? null);
  const [comments, setComments] = useState(initialReview?.hr_comments ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const inFlight = useRef(false);
  const openingData = useRef({ context: initialContext, review: initialReview });
  const loadedCallbacks = useRef({ onContextLoaded, onReviewUpdate });
  loadedCallbacks.current = { onContextLoaded, onReviewUpdate };
  const dirty = review !== null && comments !== review.hr_comments;
  useEffect(() => {
    const initial = openingData.current;
    if (initial.context && initial.review && reload === 0) return;
    let cancelled = false;
    Promise.all([initial.context && reload === 0 ? Promise.resolve(initial.context) : getRecruitmentPipeline(candidate.id), initial.review && reload === 0 ? Promise.resolve(initial.review) : getRecruitmentFinalReview(candidate.id)])
      .then(([next, finalReview]) => {
        if (cancelled) return;
        setContext(next); setReview(finalReview); setComments(finalReview.hr_comments); setError("");
        loadedCallbacks.current.onContextLoaded?.(next);
        loadedCallbacks.current.onReviewUpdate?.(finalReview);
      }).catch(() => { if (!cancelled) setError("Documents could not be loaded. Please retry."); });
    return () => { cancelled = true; };
  }, [candidate.id, reload]);
  function close() {
    if (!busy && (!dirty || window.confirm("Close without saving HR comments?"))) onClose();
  }
  async function download(target: DocumentTarget, mode: StageDocumentMode) {
    if (inFlight.current || (target === "rubric" && mode === "report" && dirty)) return;
    inFlight.current = true; setBusy(`${target}-${mode}`); setError("");
    try {
      const [latest, finalReview] = await Promise.all([
        getRecruitmentPipeline(candidate.id), target === "rubric" ? getRecruitmentFinalReview(candidate.id) : Promise.resolve(null),
      ]);
      setContext(latest);
      if (mode === "report" && !(target === "rubric" ? hasFinalRubric(latest, finalReview) : hasStageReport(latest, target))) {
        setError("There is no saved assessment for this document yet."); return;
      }
      const document = target === "rubric" ? buildFinalRubric(latest, mode === "report" ? "report" : "worksheet", finalReview) : buildStageDocument(latest, target, mode);
      const { createStageDocumentPdf } = await import("@/lib/recruitment/stage-document-pdf");
      const blob = await createStageDocumentPdf(document, new URL("/aspom-logo.png", window.location.origin).href);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url; link.download = `${target}_${mode}_${candidate.name.replace(/[^a-z0-9_-]/gi, "_")}.pdf`;
      window.document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success("Document downloaded.");
    } catch { setError("The document could not be generated. Please try again."); }
    finally { inFlight.current = false; setBusy(null); }
  }
  async function saveComments() {
    if (!review || inFlight.current) return;
    inFlight.current = true; setBusy("comments"); setError("");
    try {
      const result = await saveRecruitmentFinalComments(candidate.id, review.revision, comments);
      if (!result.success) { setError(result.error); return; }
      setReview(result.data); onReviewUpdate?.(result.data); setComments(result.data.hr_comments); toast.success("HR comments saved.");
    } catch { setError("HR comments could not be saved. Your edits are still here. Please retry."); }
    finally { inFlight.current = false; setBusy(null); }
  }
  async function generate() {
    if (!review?.ready || inFlight.current) return;
    inFlight.current = true; setBusy("analysis"); setError("");
    try {
      const result = await generateRecruitmentFinalReview(candidate.id, review.revision);
      if (!result.success) { setError(result.error); return; }
      setReview(result.data); onReviewUpdate?.(result.data); toast.success("AI review generated. HR comments are unchanged.");
    } catch { setError("The AI review could not be generated. Please retry. Your saved review is unchanged."); }
    finally { inFlight.current = false; setBusy(null); }
  }
  function action(target: DocumentTarget, mode: StageDocumentMode, label: string, available = true) {
    const key = `${target}-${mode}`;
    const title = target === "rubric" ? "Final recruitment rubric" : pipelineLabels[target];
    return <Button type="button" variant="outline" size="sm" className="h-auto min-h-9 w-full whitespace-normal py-2" disabled={!context || busy !== null || !available || (target === "rubric" && mode === "report" && dirty)} onClick={() => void download(target, mode)} aria-label={`Download ${title} ${label.toLowerCase()}`}>
      {busy === key ? <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" /> : <Download aria-hidden className="size-4 shrink-0" />}
      {busy === key ? "Preparing…" : label}
    </Button>;
  }
  return <Dialog open onOpenChange={open => { if (!open) close(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Recruitment documents · {candidate.name}</DialogTitle>
        <DialogDescription>Every stage in one place. Filled PDFs use saved assessments; blank worksheets are ready to print.</DialogDescription>
      </DialogHeader>
      {!context && !error && <p role="status" className="text-sm text-muted-foreground">Loading documents…</p>}
      <div aria-label="Stage documents" className="divide-y">
        <div className="grid grid-cols-2 gap-4 pb-2 text-sm font-semibold"><p>Filled</p><p>Blank</p></div>
        {pipelineStages.map(stage => {
          const available = context ? hasStageReport(context, stage) : false;
          const record = context?.records.find(item => item.stage === stage);
          return <section key={stage} aria-label={`${pipelineLabels[stage]} documents`} className="space-y-2 py-3">
            <h3 className="text-sm font-medium">{pipelineLabels[stage]}</h3>
            <div className="grid grid-cols-2 items-start gap-4">
              <div className="space-y-1.5">
                {action(stage, "report", "Saved report", available)}
                <p className="text-xs text-muted-foreground">{available ? record?.state === "draft" ? "Saved draft · incomplete" : "Latest saved evidence" : "No saved assessment yet"}</p>
              </div>
              <div className="space-y-2">
                {action(stage, "worksheet", stage === "written_exam" ? "HR marking guide" : "HR worksheet")}
                {stage === "written_exam" && action(stage, "candidate", "Candidate question paper")}
              </div>
            </div>
          </section>;
        })}
        <section aria-label="Final rubric documents" className="space-y-2 py-3">
          <h3 className="text-sm font-medium">Final recruitment rubric</h3>
          <p className="text-xs text-muted-foreground">Stage results, recorded competency marks, AI findings and HR final comments. Unrecorded marks are never inferred.</p>
          <div className="grid grid-cols-2 items-start gap-4">
            <div className="space-y-1.5">{action("rubric", "report", "Final rubric report", !!context && hasFinalRubric(context, review))}<p className="text-xs text-muted-foreground">{dirty ? "Save HR comments before downloading." : review?.ready ? "Assessments complete" : "In-progress reports are labelled clearly."}</p></div>
            {action("rubric", "worksheet", "Blank rubric")}
          </div>
        </section>
      </div>
      <p className="text-xs text-muted-foreground">Offer-stage PDFs are checklists. Generate official offer letters through the approved offer workflow.</p>
      {review && <section aria-label="Final candidate review" className="space-y-4 border-t pt-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">AI review of the full recruitment process</h3>
          <p className="text-xs text-muted-foreground">On request, Google Gemini reviews the saved CV, assessments, notes and decisions. AI findings support HR’s review and do not change scores or decisions.</p>
          {!review.ready && <p className="text-xs text-muted-foreground">Complete each assessment stage, or record an exception, to generate the final review.</p>}
          {review.ai_stale && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">Assessment evidence has changed. Regenerate the AI review; the current findings are outdated.</p>}
          <Button type="button" variant="outline" disabled={!review.ready || busy !== null} onClick={() => void generate()}>{busy === "analysis" ? "Reviewing candidate…" : review.ai ? "Regenerate AI review" : "Generate AI review"}</Button>
        </div>
        {review.ai && <div className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">Generated {new Date(review.ai.generated_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} · {review.ai.generated_by.name}</p>
          {([['AI strengths', review.ai.strengths], ['AI weaknesses / areas to develop', review.ai.weaknesses], ['Missing evidence', review.ai.missing_evidence]] as const).map(([title, items]) => <div key={title} className="space-y-1"><h4 className="font-medium">{title}</h4>{items.length ? <ul className="list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="text-muted-foreground">None identified in the saved evidence.</p>}</div>)}
          <div className="space-y-1"><h4 className="font-medium">AI comments</h4><p className="whitespace-pre-wrap break-words">{review.ai.comments}</p></div>
        </div>}
        <div className="space-y-2">
          <Label htmlFor="final-hr-comments">HR final comments</Label>
          <Textarea id="final-hr-comments" rows={4} maxLength={10000} value={comments} disabled={busy !== null} onChange={event => setComments(event.target.value)} placeholder="Record your own observations, concerns and final comments." />
          <p className="text-xs text-muted-foreground">HR comments are saved separately from AI findings and included in the final rubric PDF.</p>
          {review.hr_updated_by && <p className="text-xs text-muted-foreground">Last saved by {review.hr_updated_by.name}{review.hr_updated_at ? ` · ${new Date(review.hr_updated_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}` : ""}</p>}
          <Button type="button" disabled={!dirty || busy !== null} onClick={() => void saveComments()}>{busy === "comments" ? "Saving comments…" : "Save HR comments"}</Button>
        </div>
      </section>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => { if (!dirty || window.confirm("Reload and discard unsaved HR comments?")) { setContext(null); setReview(null); setReload(value => value + 1); } }}>Reload documents</Button>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={close}>Done</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
