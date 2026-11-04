"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PipelineDisclosure } from "../../components/pipeline-disclosure";
import {
  getRecruitmentPipeline,
  decideRecruitmentStage,
} from "@/lib/api/recruitment-pipeline";
import {
  pipelineLabels,
  type PipelineContext,
} from "@/lib/types/recruitment-pipeline";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";

export function ApplicantStatusDialog({
  candidate,
  roleId,
  onClose,
  onSaved,
  onViewStage,
  initialAction = "",
  initialContext,
  onContextLoaded,
}: {
  candidate: RecruitmentCandidate;
  roleId: string;
  onClose: () => void;
  onSaved: (context: PipelineContext) => void;
  initialAction?: string;
  initialContext?: PipelineContext;
  onContextLoaded?: (context: PipelineContext) => void;
  onViewStage: (
    stage: import("@/lib/types/recruitment-pipeline").PipelineStage,
  ) => void;
}) {
  const [context, setContext] = useState<PipelineContext | null>(initialContext ?? null),
    [error, setError] = useState(""),
    [action, setAction] = useState(initialAction),
    [reason, setReason] = useState(""),
    [date, setDate] = useState(""),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0);
  const inFlight = useRef(false);
  const openingContext = useRef(initialContext);
  const loadedCallback = useRef(onContextLoaded);
  loadedCallback.current = onContextLoaded;
  useEffect(() => {
    if (openingContext.current && reload === 0) return;
    let cancelled = false;
    getRecruitmentPipeline(candidate.id)
      .then((data) => {
        if (!cancelled) {
          setContext(data);
          loadedCallback.current?.(data);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Applicant details could not be loaded. Please retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [candidate.id, reload]);
  const stage = context?.candidate.pipeline_stage ?? candidate.pipeline_stage!,
    outcome = context?.candidate.pipeline_outcome;
  const options: Record<string, string> =
    outcome === "rejected" || outcome === "withdrawn"
      ? { reopen: "Reopen applicant" }
      : outcome === "hold"
        ? {
            resume: "Resume applicant",
            reject: "Reject applicant",
            withdraw: "Record withdrawal",
          }
        : {
            hold: "Place on hold",
            reject: "Reject applicant",
            withdraw: "Record withdrawal",
            reopen: "Reopen this stage",
            ...(stage !== "cv_screening"
              ? { back: "Return to previous stage" }
              : {}),
            ...(stage !== "management_review" && stage !== "offer_preparation"
              ? { skip: "Skip this stage by exception" }
              : {}),
          };
  const required = action !== "resume";
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (
      !context ||
      !options[action] ||
      inFlight.current ||
      (required && reason.trim().length < 3) ||
      (action === "hold" && !date)
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await decideRecruitmentStage(candidate.id, roleId, {
        revision: context.candidate.pipeline_revision!,
        stage,
        action,
        reason: reason.trim() || undefined,
        follow_up_date: action === "hold" ? date : undefined,
      });
      if (result.success) onSaved(result.data);
      else {
        setError(result.error);
        if (result.errorCode === "HTTP_409") {
          setContext(null);
          setAction("");
          setReload((value) => value + 1);
        }
      }
    } catch {
      setError("The decision could not be saved. Please retry.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function canClose() {
    return (
      !busy &&
      ((!reason && !action) ||
        window.confirm("Close without recording this decision?"))
    );
  }
  function close() {
    if (canClose()) onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Applicant status · {candidate.name}</DialogTitle>
          <DialogDescription>
            {pipelineLabels[stage]} · {outcome ?? "Loading…"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          {context && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="applicant-action">Decision</Label>
                <Select
                  required
                  disabled={busy}
                  value={action}
                  onValueChange={setAction}
                >
                  <SelectTrigger id="applicant-action" className="w-full">
                    <SelectValue placeholder="Choose a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(options).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {action && required && (
                <div className="space-y-1.5">
                  <Label htmlFor="status-reason">Reason</Label>
                  <Textarea
                    id="status-reason"
                    required
                    minLength={3}
                    maxLength={2000}
                    disabled={busy}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}
              {action === "hold" && (
                <div className="space-y-1.5">
                  <Label htmlFor="status-follow-up">Follow-up date</Label>
                  <Input
                    id="status-follow-up"
                    type="date"
                    required
                    disabled={busy}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              )}
              <PipelineDisclosure title="Previous stage assessments">
                <div className="flex flex-wrap gap-2">
                  {context.records
                    .filter(
                      (record) =>
                        record.stage !== stage &&
                        record.stage !== "cv_screening",
                    )
                    .map((record) => (
                      <Button
                        key={record.stage}
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          if (canClose()) onViewStage(record.stage);
                        }}
                      >
                        View {pipelineLabels[record.stage].toLowerCase()}
                      </Button>
                    ))}
                </div>
              </PipelineDisclosure>
              <PipelineDisclosure
                title={`Decision history (${context.events.length})`}
              >
                <ol className="divide-y text-xs">
                  {context.events.map((event) => (
                    <li key={event.id} className="space-y-1 py-2">
                      <p className="font-medium">
                        {event.event} · {pipelineLabels[event.from_stage]}
                        {event.to_stage !== event.from_stage
                          ? ` → ${pipelineLabels[event.to_stage]}`
                          : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {event.actor.name} ·{" "}
                        {new Date(event.created_at).toLocaleString("en-GB", {
                          timeZone: "Africa/Lagos",
                        })}
                      </p>
                      {event.reason && <p>{event.reason}</p>}
                      {event.follow_up_date && (
                        <p>Follow up: {event.follow_up_date}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </PipelineDisclosure>
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
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !context ||
                !options[action] ||
                busy ||
                (required && reason.trim().length < 3) ||
                (action === "hold" && !date)
              }
            >
              {busy ? "Saving…" : action === "reject" ? "Reject & review email" : "Record decision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
