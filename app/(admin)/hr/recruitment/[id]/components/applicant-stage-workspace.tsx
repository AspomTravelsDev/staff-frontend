"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRecruitmentPipeline } from "@/lib/api/recruitment-pipeline";
import {
  pipelineLabels,
  type PipelineContext,
} from "@/lib/types/recruitment-pipeline";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";
import { ApplicantStageForm } from "./applicant-stage-form";

export function ApplicantStageWorkspace({
  candidate,
  roleId,
  onClose,
  onUpdate,
  onComplete,
  onCv,
  viewStage,
  onReject,
  initialContext,
  onContextLoaded,
}: {
  candidate: RecruitmentCandidate;
  roleId: string;
  onClose: () => void;
  onUpdate: (context: PipelineContext) => void;
  onComplete: (context: PipelineContext) => void;
  onCv: (candidate: RecruitmentCandidate) => void;
  viewStage?: import("@/lib/types/recruitment-pipeline").PipelineStage;
  onReject?: () => void;
  initialContext?: PipelineContext;
  onContextLoaded?: (context: PipelineContext) => void;
}) {
  const [context, setContext] = useState<PipelineContext | null>(initialContext ?? null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [closing, setClosing] = useState(false);
  const closeGuard = useRef<() => Promise<boolean>>(async () => true),
    closePending = useRef(false);
  const callbacks = useRef({ onUpdate, onComplete, onCv, onClose, onContextLoaded });
  callbacks.current = { onUpdate, onComplete, onCv, onClose, onContextLoaded };
  const openingContext = useRef(initialContext);
  const registerClose = useCallback((guard: () => Promise<boolean>) => {
    closeGuard.current = guard;
    return () => {
      closeGuard.current = async () => true;
    };
  }, []);
  useEffect(() => {
    if (openingContext.current && reload === 0) return;
    let cancelled = false;
    getRecruitmentPipeline(candidate.id)
      .then((data) => {
        if (cancelled) return;
        if (data.role.id !== roleId) {
          setError("This applicant belongs to a different recruitment role.");
          return;
        }
        if (data.candidate.pipeline_stage === "cv_screening" && !viewStage) {
          callbacks.current.onCv(data.candidate);
          return;
        }
        setContext(data);
        callbacks.current.onContextLoaded?.(data);
        setError("");
      })
      .catch(() => {
        if (!cancelled)
          setError("The stage could not be loaded. Please retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [candidate.id, roleId, reload, viewStage]);
  const stage =
    viewStage ?? context?.candidate.pipeline_stage ?? candidate.pipeline_stage!;
  const oral = stage === "oral_interview";
  async function close() {
    if (closePending.current) return;
    closePending.current = true;
    setClosing(true);
    try {
      if (await closeGuard.current()) callbacks.current.onClose();
    } finally {
      closePending.current = false;
      setClosing(false);
    }
  }
  const body = (
    <div className="space-y-3">
      {!context && !error && (
        <p
          role="status"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Loader2 className="size-3 animate-spin" />
          Loading stage…
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
      {context && (
        <ApplicantStageForm
          key={stage}
          initial={context}
          viewStage={viewStage}
          closing={closing}
          onDone={() => void close()}
          registerClose={registerClose}
          onDiscard={onClose}
          onReject={onReject}
          onUpdate={(next) => {
            setContext(next);
            callbacks.current.onUpdate(next);
          }}
          onComplete={(next) => callbacks.current.onComplete(next)}
        />
      )}
      {!context && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={closing}
            onClick={() => void close()}
          >
            {closing ? "Saving…" : "Done"}
          </Button>
        </div>
      )}
    </div>
  );
  if (oral)
    return (
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) void close();
        }}
      >
        <SheetContent className="w-full gap-3 overflow-y-auto sm:max-w-4xl">
          <SheetHeader className="border-b p-3 pr-10">
            <SheetTitle className="text-sm">
              Oral interview · {candidate.name}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {context?.role.title ?? "Score the interview answers"}
            </SheetDescription>
          </SheetHeader>
          <div className="px-3 pb-3">{body}</div>
        </SheetContent>
      </Sheet>
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void close();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {pipelineLabels[stage]} · {candidate.name}
          </DialogTitle>
          <DialogDescription>
            {context?.role.title ?? "Complete this stage’s form"}
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
