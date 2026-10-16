"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssessmentDefinition, AssessmentDraft } from "@/lib/types/applicant-assessment";

export function AssessmentPreparation({plan, draft, disabled, onChange, onContinue}: {
  plan: AssessmentDefinition;
  draft: AssessmentDraft;
  disabled: boolean;
  onChange: (draft: AssessmentDraft) => void;
  onContinue: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  async function downloadTasks() {
    setDownloading(true);
    try {
      const {createCandidateBriefPdfBlob} = await import("@/lib/recruitment/assessment-pdf");
      const blob = await createCandidateBriefPdfBlob(plan);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${plan.track.id}-candidate-tasks.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {toast.error("Candidate tasks could not be downloaded. Please retry.");}
    finally {setDownloading(false);}
  }
  return <section className="space-y-6">
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">Before you begin</h2>
      <p className="text-sm text-muted-foreground">Confirm the details once. Your answers and scores save automatically.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1 text-sm font-medium">Interviewer
        <Input value={draft.interviewer_name} disabled={disabled} maxLength={255} onChange={e => onChange({...draft,interviewer_name:e.target.value})}/>
      </label>
      <label className="space-y-1 text-sm font-medium">Interview date
        <Input type="date" value={draft.interview_date} disabled={disabled} onChange={e => onChange({...draft,interview_date:e.target.value})}/>
      </label>
    </div>
    <div className="space-y-3 border-t pt-4 text-sm">
      <h3 className="font-semibold">How to complete the assessment</h3>
      <p><span className="font-medium">During the interview:</span> ask the questions and score each answer. Add notes only when useful.</p>
      {!!plan.weights.practical && <p><span className="font-medium">After the interview:</span> review the completed practical work and enter the marks. You can leave these blank until you have reviewed it.</p>}
      <p><span className="font-medium">Finish:</span> review the evidence, record your recommendation, and submit when all required scores are complete.</p>
    </div>
    <details className="border-t pt-4 text-sm" open>
      <summary className="w-fit cursor-pointer font-semibold">Scoring reference</summary>
      <dl className="mt-3 divide-y">
        {[[1,"Weak — little relevant evidence"],[2,"Developing — significant gaps"],[3,"Competent — clear, workable answer"],[4,"Strong — specific evidence and sound judgment"],[5,"Excellent — thorough, accurate and well reasoned"]].map(([score,label]) => <div key={score} className="flex gap-3 py-2"><dt className="font-medium">{score}</dt><dd className="text-muted-foreground">{label}</dd></div>)}
      </dl>
      <p className="mt-3 text-muted-foreground">Practical criteria also allow 0 for no evidence. Required checks must pass, regardless of the total score.</p>
      <p className="mt-2 text-muted-foreground">{plan.guidance}</p>
    </details>
    {!!plan.practical_modules?.length && <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">Give the candidate the practical task sheet before they begin.</p>
      <Button variant="outline" disabled={downloading} onClick={downloadTasks}>{downloading ? "Preparing task sheet…" : "Download task sheet"}</Button>
    </div>}
    <div className="border-t pt-4"><Button disabled={!draft.interviewer_name.trim() || !draft.interview_date} onClick={onContinue}>Continue to interview</Button></div>
  </section>;
}
