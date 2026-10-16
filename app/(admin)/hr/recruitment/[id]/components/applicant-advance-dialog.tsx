"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getRecruitmentPipeline,
  decideRecruitmentStage,
} from "@/lib/api/recruitment-pipeline";
import { cvEvaluationScore } from "@/lib/recruitment/cv-evaluation";
import {
  pipelineLabels,
  pipelineStages,
  type PipelineContext,
} from "@/lib/types/recruitment-pipeline";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";

export function ApplicantAdvanceDialog({
  candidate,
  roleId,
  onClose,
  onMoved,
  onContinue,
}: {
  candidate: RecruitmentCandidate;
  roleId: string;
  onClose: () => void;
  onMoved: (context: PipelineContext) => void;
  onContinue: () => void;
}) {
  const [context, setContext] = useState<PipelineContext | null>(null),
    [error, setError] = useState(""),
    [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0);
  const submitting = useRef(false);
  useEffect(() => {
    let cancelled = false;
    getRecruitmentPipeline(candidate.id)
      .then((data) => {
        if (!cancelled) {
          setContext(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not load the current stage. Please retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [candidate.id, reload]);
  const stage = context?.candidate.pipeline_stage ?? candidate.pipeline_stage!;
  const next = pipelineStages[pipelineStages.indexOf(stage) + 1];
  const record = context?.records.find((record) => record.stage === stage);
  const cvScore = context ? cvEvaluationScore(context.candidate) : null;
  const missingCv = stage === "cv_screening" && cvScore === null;
  const incomplete = stage !== "cv_screening" && record?.state !== "completed";
  const required =
    stage === "cv_screening"
      ? cvScore === null || cvScore < 50
      : record?.results?.passed !== true;
  const active = context?.candidate.pipeline_outcome === "active";
  async function advance(e: React.FormEvent) {
    e.preventDefault();
    if (
      !context ||
      !next ||
      !active ||
      incomplete ||
      (required && comment.trim().length < 3) ||
      submitting.current
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await decideRecruitmentStage(candidate.id, roleId, {
        revision: context.candidate.pipeline_revision!,
        stage,
        action: "advance",
        complete_cv: stage === "cv_screening",
        manual_cv: missingCv,
        reason: comment.trim() || undefined,
      });
      if (result.success) onMoved(result.data);
      else {
        setError(result.error);
        if (
          result.errorCode === "HTTP_409" ||
          result.errorCode === "HTTP_422"
        ) {
          setContext(null);
          setReload((value) => value + 1);
        }
      }
    } catch {
      setError("The applicant could not be moved. Please retry.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-sm"
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {next
              ? `Move to ${next === "management_review" ? "management review" : pipelineLabels[next].toLowerCase()}`
              : "Applicant stage changed"}
          </DialogTitle>
          <DialogDescription>
            {candidate.name} · {pipelineLabels[stage]}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={advance} className="space-y-3">
          {!context && !error && (
            <p
              role="status"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Loader2 className="size-3 animate-spin" />
              Checking current stage…
            </p>
          )}
          {context && !active && (
            <p className="text-xs text-muted-foreground">
              Resume or reopen this applicant before advancing.
            </p>
          )}
          {context && active && missingCv && (
            <p className="text-xs text-muted-foreground">
              AI scoring is unavailable. Review the original CV and record why
              this applicant should progress. This is an unscored HR review.
              <Button asChild variant="link" className="h-auto px-0">
                <a
                  href={`/api/recruitment/candidates/${candidate.id}/cv`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download original CV
                </a>
              </Button>
            </p>
          )}
          {context && active && incomplete && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Complete {pipelineLabels[stage].toLowerCase()} before moving
                this applicant.
              </p>
              <Button type="button" variant="outline" onClick={onContinue}>
                Continue {pipelineLabels[stage].toLowerCase()}
              </Button>
            </div>
          )}
          {context && active && !incomplete && next && (
            <>
              {stage === "cv_screening" && !missingCv && (
                <p className="text-xs text-muted-foreground">
                  CV score: {cvScore}% · Pass mark: 50%
                </p>
              )}
              {required && (
                <p className="text-xs text-destructive">
                  {stage === "cv_screening"
                    ? missingCv
                      ? "No AI score is available."
                      : "Below the CV screening pass mark."
                    : "This stage did not meet the standard."}{" "}
                  Add an HR note to advance by exception.
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="advance-comment">
                  {required ? "HR note (required)" : "Comment (optional)"}
                </Label>
                <Textarea
                  id="advance-comment"
                  disabled={busy}
                  autoFocus={required}
                  required={required}
                  minLength={required ? 3 : undefined}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    required
                      ? "Why should this applicant proceed?"
                      : "Add context for the next stage"
                  }
                />
              </div>
            </>
          )}
          {error && (
            <div role="alert" className="space-y-2 text-xs">
              <p className="text-destructive">{error}</p>
              {!context && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReload((value) => value + 1)}
                >
                  Retry loading
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !context ||
                !active ||
                !next ||
                incomplete ||
                busy ||
                (required && comment.trim().length < 3)
              }
            >
              {busy ? "Moving…" : "Move applicant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
