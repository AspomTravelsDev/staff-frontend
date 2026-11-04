/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  transitionPayrollRun,
  type PayrollRun,
} from "@/lib/api/payroll";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayrollComments } from "./payroll-comments";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Building2,
  Crown,
} from "lucide-react";

interface WorkflowStep {
  key: string;
  label: string;
  icon: any;
}

const STAGE_PERMISSIONS: Record<string, string[]> = {
  draft: ["hr", "super"],
  hr_draft: ["hr", "super"],
  processing: ["hr", "super"],
  account_review: ["account", "super"],
  compliance_review: ["compliance", "super"],
  mp_review: ["mp", "super"],
  md_approval: ["md", "super"],
};

const WORKFLOW_STEPS: WorkflowStep[] = [
  { key: "draft", label: "HR Draft", icon: Building2 },
  { key: "account_review", label: "Accounts", icon: UserCheck },
  { key: "compliance_review", label: "Compliance", icon: ShieldCheck },
  { key: "mp_review", label: "MP Review", icon: FileCheck2 },
  { key: "md_approval", label: "MD Sign-off", icon: Crown },
  { key: "closed", label: "Closed & Paid", icon: CheckCircle2 },
];

function getStageIndex(status: string): number {
  switch (status) {
    case "draft":
    case "hr_draft":
    case "processing":
      return 0;
    case "account_review":
      return 1;
    case "compliance_review":
      return 2;
    case "mp_review":
      return 3;
    case "md_approval":
      return 4;
    case "closed":
      return 5;
    default:
      return 0;
  }
}

function getAdvanceButtonLabel(status: string): string {
  switch (status) {
    case "draft":
    case "hr_draft":
      return "Submit to Accounts Review";
    case "account_review":
      return "Advance to Compliance Review";
    case "compliance_review":
      return "Advance to MP Review";
    case "mp_review":
      return "Advance to MD for Final Approval";
    case "md_approval":
      return "Approve & Close Payroll";
    default:
      return "Advance Stage";
  }
}

export function PayrollWorkflowBar({
  currentRun,
  onRefresh,
  isBusy,
  commentsOpen = false,
}: {
  currentRun: PayrollRun;
  onRefresh: () => void;
  isBusy: boolean;
  commentsOpen?: boolean;
}) {
  const { user } = useUser();
  const userRoles = user?.roles && user.roles.length > 0
    ? user.roles
    : [user?.role, ...(user?.secondary_roles || [])].filter(Boolean);

  const allowedRoles = STAGE_PERMISSIONS[currentRun.status] || [];
  const canActOnCurrentStage = userRoles.some((r: any) => allowedRoles.includes(r));

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const queryClient = useQueryClient();
  const activeIndex = getStageIndex(currentRun.status);
  const isClosed = currentRun.status === "closed";

  const handleAdvance = async () => {
    setIsTransitioning(true);
    try {
      const res = await transitionPayrollRun(currentRun.id, "advance");
      if (!res.success) {
        throw new Error(res.error.error || "Failed to advance workflow stage.");
      }
      toast.success(res.data.message || "Payroll advanced successfully.");
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Could not advance stage.");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      toast.error("Please enter a rejection reason note.");
      return;
    }

    setIsTransitioning(true);
    try {
      const res = await transitionPayrollRun(currentRun.id, "reject", rejectionNote);
      if (!res.success) {
        throw new Error(res.error.error || "Failed to reject payroll run.");
      }
      toast.success("Payroll run sent back to HR Draft.");
      setIsRejectModalOpen(false);
      setRejectionNote("");
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Could not reject stage.");
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-3 sm:p-4 space-y-2" data-payroll-tour="workflow">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">
              Approval Pipeline
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "capitalize font-bold text-xs px-2.5 py-0.5",
                isClosed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
              )}
            >
              {WORKFLOW_STEPS[activeIndex]?.label || currentRun.status}
            </Badge>
          </div>

        </div>

        {/* Workflow Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <PayrollComments key={currentRun.id} run={currentRun} defaultOpen={commentsOpen} />

          {!isClosed && (
            canActOnCurrentStage ? (
              <>
                {activeIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
                    disabled={isBusy || isTransitioning}
                    onClick={() => setIsRejectModalOpen(true)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Reject / Send Back
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  className="bg-primary text-primary-foreground font-bold shadow-sm"
                  disabled={isBusy || isTransitioning}
                  onClick={handleAdvance}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  {getAdvanceButtonLabel(currentRun.status)}
                </Button>
              </>
            ) : (
              <Badge
                variant="outline"
                className="text-xs py-1 px-3 text-muted-foreground bg-muted/40 border-dashed"
              >
                Awaiting {WORKFLOW_STEPS[activeIndex]?.label}
              </Badge>
            )
          )}
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-2 text-xs" aria-label="Payroll approval stages">
        {WORKFLOW_STEPS.map((step, idx) => {
          const Icon = idx < activeIndex || isClosed ? CheckCircle2 : idx === activeIndex ? Clock : step.icon;
          return <li key={step.key} aria-current={idx === activeIndex ? "step" : undefined} className={cn("flex items-center gap-1.5", idx === activeIndex ? "font-semibold text-primary" : idx < activeIndex ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />{step.label}
          </li>;
        })}
      </ol>

      {/* Rejection Dialog */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Reject & Send Back to HR
            </DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting this payroll run. The run
              status will revert to HR Draft for corrections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-foreground">
              Rejection Reason & Note <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="e.g. Please check attendance deduction for John Doe, Tax calculation mismatch on sales department..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="font-bold"
              disabled={isTransitioning || !rejectionNote.trim()}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
