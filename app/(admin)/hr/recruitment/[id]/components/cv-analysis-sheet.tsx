"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRecruitmentScreeningStatus } from "@/lib/api/recruitment-pipeline";
import {
  cvEvaluationScore,
  cvAnalysisFailureMessage,
} from "@/lib/recruitment/cv-evaluation";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";
import type { InterviewPreparation } from "@/lib/types/recruitment";
import { prepareCandidateInterview } from "@/lib/api/recruitment";
import { PipelineDisclosure } from "../../components/pipeline-disclosure";

export function CvAnalysisSheet({
  candidate,
  onManage,
  onClose,
  onRetry,
  retrying,
}: {
  candidate: RecruitmentCandidate;
  onManage: () => void;
  onClose: () => void;
  onRetry: (candidate: RecruitmentCandidate) => Promise<void>;
  retrying: boolean;
}) {
  const [details, setDetails] = useState<{
    source: RecruitmentCandidate;
    data: Awaited<ReturnType<typeof getRecruitmentScreeningStatus>>;
  } | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [preparation, setPreparation] = useState<{ source: RecruitmentCandidate; data: InterviewPreparation } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [preparationError, setPreparationError] = useState("");
  const preparationLock = useRef(false);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const data = await getRecruitmentScreeningStatus(candidate.id);
        if (cancelled) return;
        setDetails({ source: candidate, data });
        setError("");
        if (
          ["pending", "processing"].includes(data.ai_evaluation?.status ?? "")
        )
          timer = setTimeout(() => void load(), 10000);
      } catch {
        if (!cancelled)
          setError("CV analysis could not be loaded. Please retry.");
      }
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [candidate, reload]);
  const loaded = details?.source === candidate;
  const data = loaded ? { ...candidate, ...details.data } : candidate;
  const evaluation = data.ai_evaluation;
  const pending =
    retrying || ["pending", "processing"].includes(evaluation?.status ?? "");
  const score = cvEvaluationScore(data);
  const interview = preparation?.source === candidate ? preparation.data : loaded ? details.data.interview_preparation : null;
  async function prepare() {
    if (preparationLock.current) return;
    preparationLock.current = true; setPreparing(true); setPreparationError("");
    try {
      const result = await prepareCandidateInterview(candidate.id);
      if (result.success) setPreparation({ source: candidate, data: result.data });
      else setPreparationError(result.error);
    } catch { setPreparationError("Interview preparation could not finish. Please retry."); }
    finally { preparationLock.current = false; setPreparing(false); }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full gap-3 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b p-3 pr-10">
          <SheetTitle className="text-sm">{candidate.name}</SheetTitle>
          <SheetDescription className="text-xs">
            CV analysis · AI advice for HR’s screening decision
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-3 pb-3">
          <p className="text-xs text-muted-foreground">
            {[candidate.email, candidate.phone].filter(Boolean).join(" · ")}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium" role="status">
              {pending
                ? "Analysis running"
                : evaluation?.status === "failed"
                  ? "Analysis failed"
                  : evaluation?.status === "not_requested"
                    ? "Analysis not run"
                  : score === null
                    ? "Not scored"
                    : `CV score: ${score}%`}
            </p>
            <Button asChild variant="outline">
              <a
                href={`/api/recruitment/candidates/${candidate.id}/cv`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download CV
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            50% and above meets the screening standard. Advancing below 50%
            requires an HR note.
          </p>
          {!loaded && !error && (
            <p
              role="status"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Loader2 className="size-3 animate-spin" />
              Loading analysis…
            </p>
          )}
          {evaluation?.status === "failed" && (
            <p role="status" className="text-xs text-muted-foreground">
              {cvAnalysisFailureMessage(data)}
            </p>
          )}
          {error && (
            <div role="alert" className="space-y-2 text-xs">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={() => setReload((value) => value + 1)}
              >
                Retry loading
              </Button>
            </div>
          )}
          {pending ? (
            <p className="text-xs text-muted-foreground">
              Analysis is running. You can close this sheet and keep working;
              the result will be available when you return.
            </p>
          ) : (
            <>
              {(data.ai_summary || evaluation?.summary) && (
                <p className="whitespace-pre-wrap text-xs leading-relaxed">
                  {data.ai_summary || evaluation?.summary}
                </p>
              )}
              {(
                [
                  ["strengths", "Strengths"],
                  ["gaps", "Gaps to clarify"],
                ] as const
              ).map(
                ([key, label]) =>
                  !!evaluation?.[key]?.length && (
                    <section key={key} className="space-y-1.5 text-xs">
                      <h3 className="font-medium">{label}</h3>
                      <ul className="list-disc space-y-1 pl-4">
                        {evaluation[key].map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ),
              )}
              {!!evaluation?.skills?.length && (
                <section className="space-y-1.5 text-xs">
                  <h3 className="font-medium">Skills</h3>
                  <p className="text-muted-foreground">
                    {evaluation.skills.join(", ")}
                  </p>
                </section>
              )}
              {!!evaluation?.criteria?.length && <section className="space-y-2 text-xs" aria-label="Role requirement evidence">
                <h3 className="font-medium">Role requirement evidence</h3>
                {evaluation.criteria.map((criterion, index) => <div key={index} className="space-y-1 border-b pb-2">
                  <p className="font-medium">{criterion.requirement} · {{ met: "Shown in CV", not_shown: "Not shown in CV", unclear: "Needs clarification" }[criterion.status]}</p>
                  <p className="text-muted-foreground">{criterion.evidence}</p>
                </div>)}
              </section>}
              {evaluation?.status === "completed" && <section className="space-y-2 border-t pt-3 text-xs" aria-label="Interview preparation">
                <h3 className="font-medium">Interview preparation</h3>
                <p className="text-muted-foreground">Generate detailed questions when you need them. Saved preparation is reused while the CV and role requirements are unchanged.</p>
                {interview?.status === "stale" && <p>Previous preparation is outdated. Refresh AI screening before generating again.</p>}
                {interview?.status === "failed" && <p>The previous preparation did not finish. You can try again.</p>}
                {interview?.probes?.map((probe, index) => <div key={index} className="space-y-1 border-b pb-2"><p className="font-medium">{probe.question}</p><p>CV evidence to clarify: {probe.cv_trigger}</p><p className="text-muted-foreground">Listen for: {probe.what_to_listen_for}</p></div>)}
                {!interview?.probes?.length && <Button variant="outline" disabled={preparing || interview?.status === "processing"} onClick={() => void prepare()}>{preparing ? "Preparing questions…" : interview?.status === "processing" ? "Preparation running — reload to check" : "Generate interview questions"}</Button>}
                {preparationError && <p role="alert" className="text-destructive">{preparationError}</p>}
              </section>}
              {!!evaluation?.suggested_interview_questions?.length && (
                <PipelineDisclosure title="Suggested follow-up questions">
                  <ul className="list-disc space-y-1 pl-4 text-xs">
                    {evaluation.suggested_interview_questions.map(
                      (question, i) => (
                        <li key={i}>{question}</li>
                      ),
                    )}
                  </ul>
                </PipelineDisclosure>
              )}
              <Button
                variant="outline"
                disabled={retrying}
                onClick={() => void onRetry(data)}
              >
                <RotateCw />
                {evaluation?.status === "failed"
                  ? "Retry AI analysis"
                  : evaluation?.status === "not_requested"
                    ? "Run AI analysis"
                    : "Reanalyse CV"}
              </Button>
            </>
          )}
          {loaded && data.cv_extracted_text && (
            <PipelineDisclosure title="Extracted CV text">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {data.cv_extracted_text}
              </p>
            </PipelineDisclosure>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setReload(value => value + 1)}>Reload analysis</Button>
            <Button variant="link" className="h-auto p-0" onClick={onManage}>
              Manage status &amp; decision history
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
