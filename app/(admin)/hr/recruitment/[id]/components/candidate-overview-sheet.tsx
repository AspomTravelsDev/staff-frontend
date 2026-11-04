"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getRecruitmentPipeline } from "@/lib/api/recruitment-pipeline";
import { getRecruitmentFinalReview } from "@/lib/api/recruitment-final-review";
import { pipelineLabels, pipelineStages, type PipelineContext, type PipelineStage } from "@/lib/types/recruitment-pipeline";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";
import type { RecruitmentFinalReview } from "@/lib/types/recruitment-final-review";
import { stageOverview } from "@/lib/recruitment/candidate-overview";

export function CandidateOverviewSheet({ candidate, onClose, onCv, onStage, onStatus, onDocuments, onEmail, initialContext, initialReview, onContextLoaded, onReviewLoaded }: {
  candidate: RecruitmentCandidate;
  onClose: () => void;
  onCv: () => void;
  onStage: (stage?: PipelineStage) => void;
  onStatus: () => void;
  onDocuments: () => void;
  onEmail: () => void;
  initialContext?: PipelineContext;
  initialReview?: RecruitmentFinalReview;
  onContextLoaded?: (context: PipelineContext) => void;
  onReviewLoaded?: (review: RecruitmentFinalReview) => void;
}) {
  const [context, setContext] = useState<PipelineContext | null>(initialContext ?? null);
  const [review, setReview] = useState<RecruitmentFinalReview | null>(initialReview ?? null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const openingData = useRef({ context: initialContext, review: initialReview });
  const callbacks = useRef({ onContextLoaded, onReviewLoaded });
  useEffect(() => { callbacks.current = { onContextLoaded, onReviewLoaded }; }, [onContextLoaded, onReviewLoaded]);
  useEffect(() => {
    const initial = openingData.current;
    if (initial.context && initial.review && reload === 0) return;
    let cancelled = false;
    Promise.allSettled([initial.context && reload === 0 ? Promise.resolve(initial.context) : getRecruitmentPipeline(candidate.id), initial.review && reload === 0 ? Promise.resolve(initial.review) : getRecruitmentFinalReview(candidate.id)]).then(([pipeline, final]) => {
      if (cancelled) return;
      if (pipeline.status === "fulfilled") { setContext(pipeline.value); callbacks.current.onContextLoaded?.(pipeline.value); }
      if (final.status === "fulfilled") { setReview(final.value); callbacks.current.onReviewLoaded?.(final.value); }
      setError(pipeline.status === "rejected" ? "The complete candidate record could not be loaded. Please retry." : final.status === "rejected" ? "The final review could not be loaded. Other saved information is shown below." : "");
    });
    return () => { cancelled = true; };
  }, [candidate.id, reload]);
  const person = context?.candidate ?? candidate;
  const call = context?.records.find(record => record.stage === "call_screening")?.payload;
  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent className="w-full gap-4 overflow-y-auto sm:max-w-3xl">
      <SheetHeader className="border-b p-4 pr-10">
        <SheetTitle>{person.name}</SheetTitle>
        <SheetDescription>{context?.role.title ?? "Candidate overview"}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-6 text-sm">
        <section aria-label="Candidate summary" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{person.pipeline_outcome ?? "active"}</Badge><p>{person.pipeline_stage ? pipelineLabels[person.pipeline_stage] : "Stage not recorded"}</p></div>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[["Email", person.email], ["Phone", person.phone], ["Combined assessment score", context?.final_score != null ? `${context.final_score.toFixed(1)}/100` : "Not yet available"], ["Salary expectation", call?.salary_expectation != null ? `NGN ${call.salary_expectation.toLocaleString("en-NG")}` : null], ["Location", call?.location], ["Notice period", call?.notice_period]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value || "Not recorded"}</dd></div>)}
          </dl>
          {person.notes && <p className="whitespace-pre-wrap">{person.notes}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onStage()}>Open current stage</Button>
            <Button variant="outline" size="sm" onClick={onStatus}>Status &amp; history</Button>
            <Button variant="outline" size="sm" onClick={onDocuments}>Documents &amp; final rubric</Button>
            <Button variant="outline" size="sm" onClick={onEmail}>Candidate emails</Button>
          </div>
        </section>
        {!context && !error && <p role="status">Loading the full recruitment record…</p>}
        {context && <section aria-label="Stage scores and results" className="space-y-3">
          <h3 className="font-semibold">Stage scores and results</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-left text-xs"><thead className="bg-muted/50"><tr><th className="p-3 font-medium">Stage</th><th className="p-3 font-medium">Score</th><th className="p-3 font-medium">Result</th></tr></thead>
              <tbody className="divide-y">{pipelineStages.map(stage => {
                const item = stageOverview(context, stage);
                return <tr key={stage}><th scope="row" className="p-3 font-medium"><button type="button" className="text-left underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2" onClick={() => onStage(stage)}>{pipelineLabels[stage]}</button></th><td className="whitespace-nowrap p-3 tabular-nums">{stage === "call_screening" || stage === "management_review" || stage === "offer_preparation" ? "Unscored" : item.score == null ? "Not scored" : `${item.score}/100`}</td><td className="p-3">{item.result}</td></tr>;
              })}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Pass/fail reflects the saved assessment. An advancement exception does not turn a failed assessment into a pass.</p>
        </section>}
        {call && <section aria-label="Call screening details" className="space-y-3">
          <h3 className="font-semibold">Call screening details</h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{[["HR compatibility assessment", call.compatibility], ["Age", call.age], ["NYSC status", call.nysc_status], ["Accommodation needed", call.accommodation], ["Interview date and time", call.scheduled_at], ["Interview mode", call.interview_mode]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value == null || value === "" ? "Not recorded" : value}</dd></div>)}</dl>
        </section>}
        <section aria-label="CV summary" className="space-y-2">
          <h3 className="font-semibold">CV summary</h3>
          <p className="whitespace-pre-wrap">{person.ai_summary || "No CV summary has been generated."}</p>
          {!!person.ai_evaluation?.strengths?.length && <div><h4 className="font-medium">CV strengths</h4><ul className="mt-1 list-disc space-y-1 pl-5">{person.ai_evaluation.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          {!!person.ai_evaluation?.gaps?.length && <div><h4 className="font-medium">CV gaps to verify</h4><ul className="mt-1 list-disc space-y-1 pl-5">{person.ai_evaluation.gaps.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
          <Button variant="outline" size="sm" onClick={onCv}>Detailed CV analysis</Button>
        </section>
        {context && <section aria-label="Recorded stage evidence" className="space-y-3">
          <h3 className="font-semibold">Recorded stage evidence</h3>
          {!context.records.length && <p className="text-muted-foreground">No stage assessments have been saved yet.</p>}
          {context.records.map(record => <details key={record.id} className="border-b pb-3"><summary className="cursor-pointer font-medium">{pipelineLabels[record.stage]} · {record.state}</summary><dl className="mt-3 space-y-2">
            {[["Notes", record.payload.notes], ["Compatibility", record.payload.compatibility], ["Strengths", record.payload.strengths], ["Concerns", record.payload.concerns], ["HR recommendation", record.payload.recommendation], ["Advancement exception", record.payload.advancement_note]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}
            <div><dt className="text-xs text-muted-foreground">Last saved by</dt><dd>{record.updated_by?.name ?? "Not recorded"}{record.updated_at ? ` · ${new Date(record.updated_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}` : ""}</dd></div>
          </dl></details>)}
        </section>}
        {review?.ai && <section aria-label="Final AI review" className="space-y-3"><h3 className="font-semibold">Final AI review</h3>{review.ai_stale && <p role="status" className="text-amber-700 dark:text-amber-400">Outdated: assessment evidence has changed.</p>}<p className="whitespace-pre-wrap">{review.ai.comments}</p>{([['Strengths', review.ai.strengths], ['Weaknesses / areas to develop', review.ai.weaknesses], ['Missing evidence', review.ai.missing_evidence]] as const).map(([label, items]) => items.length ? <div key={label}><h4 className="font-medium">{label}</h4><ul className="mt-1 list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null)}</section>}
        <section aria-label="HR final comments" className="space-y-2"><h3 className="font-semibold">HR final comments</h3><p className="whitespace-pre-wrap">{review?.hr_comments || "No final comments recorded."}</p>{review?.hr_updated_by && <p className="text-xs text-muted-foreground">{review.hr_updated_by.name}</p>}</section>
        {person.interview_rubric && <section aria-label="Recorded interview rubric" className="space-y-2"><h3 className="font-semibold">Recorded interview rubric</h3><p>Total: {person.interview_rubric.scores?.total_score != null ? `${person.interview_rubric.scores.total_score}/55` : "Not recorded"}</p><dl className="space-y-2">{[["Reviewer", person.interview_rubric.reviewer_info?.name], ["Strengths", person.interview_rubric.qualitative?.key_strengths], ["Weaknesses", person.interview_rubric.qualitative?.weakness_areas], ["Interview comments", person.interview_rubric.qualitative?.comments_from_interview], ["HR recommendation", person.interview_rubric.logistics?.recommendation]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value}</dd></div>)}</dl></section>}
        {person.onboarding_application_id && <section aria-label="Offer and onboarding" className="space-y-2"><h3 className="font-semibold">Offer &amp; onboarding</h3><p>Candidate status: {person.status}</p><p>Offer state: {person.offer_application?.offer?.state ?? "Not recorded"}</p><p className="break-all">Application: {person.onboarding_application_id}</p></section>}
        {context && <section aria-label="Decision history" className="space-y-3"><h3 className="font-semibold">Decision history</h3>{!context.events.length && <p className="text-muted-foreground">No decisions recorded.</p>}<ol className="divide-y">{context.events.map(event => <li key={event.id} className="space-y-1 py-3"><p className="font-medium">{event.event.replaceAll("_", " ")} · {pipelineLabels[event.from_stage]}{event.to_stage !== event.from_stage ? ` → ${pipelineLabels[event.to_stage]}` : ""}</p><p className="text-xs text-muted-foreground">{event.actor.name} · {new Date(event.created_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}</p>{event.reason && <p className="whitespace-pre-wrap">{event.reason}</p>}{event.follow_up_date && <p>Follow up: {event.follow_up_date}</p>}</li>)}</ol></section>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button variant="outline" size="sm" onClick={() => setReload(value => value + 1)}>Reload candidate details</Button>
      </div>
    </SheetContent>
  </Sheet>;
}
