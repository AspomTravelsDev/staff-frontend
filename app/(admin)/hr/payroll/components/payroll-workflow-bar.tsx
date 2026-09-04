/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  transitionPayrollRun,
  type PayrollRun,
  type PayrollApprovalHistoryItem,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  History,
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
  roleLabel: string;
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
  { key: "draft", label: "HR Draft", roleLabel: "HR Officer", icon: Building2 },
  { key: "account_review", label: "Accounts", roleLabel: "Accounts Officer", icon: UserCheck },
  { key: "compliance_review", label: "Compliance", roleLabel: "Compliance Officer", icon: ShieldCheck },
  { key: "mp_review", label: "MP Review", roleLabel: "Managing Partner", icon: FileCheck2 },
  { key: "md_approval", label: "MD Sign-off", roleLabel: "Managing Director", icon: Crown },
  { key: "closed", label: "Closed & Paid", roleLabel: "Finalized", icon: CheckCircle2 },
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
}: {
  currentRun: PayrollRun;
  onRefresh: () => void;
  isBusy: boolean;
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
  const [showHistory, setShowHistory] = useState(false);

  const activeIndex = getStageIndex(currentRun.status);
  const isClosed = currentRun.status === "closed";
  const history: PayrollApprovalHistoryItem[] = currentRun.approval_history || [];

  const handleAdvance = async () => {
    setIsTransitioning(true);
    try {
      const res = await transitionPayrollRun(currentRun.id, "advance");
      if (!res.success) {
        throw new Error(res.error.error || "Failed to advance workflow stage.");
      }
      toast.success(res.data.message || "Payroll advanced successfully.");
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
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Could not reject stage.");
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">
              Approval Pipeline
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "capitalize font-bold text-xs px-2.5 py-0.5",
                isClosed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200",
              )}
            >
              {WORKFLOW_STEPS[activeIndex]?.label || currentRun.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage {activeIndex + 1} of {WORKFLOW_STEPS.length}:{" "}
            {WORKFLOW_STEPS[activeIndex]?.roleLabel} Action Required
          </p>
        </div>

        {/* Workflow Actions */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-1.5" />
              {showHistory ? "Hide History" : `Log History (${history.length})`}
            </Button>
          )}

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
                Awaiting {WORKFLOW_STEPS[activeIndex]?.roleLabel} Action
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <div
              key={step.key}
              className={cn(
                "relative rounded-lg p-3 border transition-all flex flex-col justify-between",
                isCurrent && "border-primary bg-primary/5 ring-1 ring-primary/20",
                isPassed && "border-emerald-200 bg-emerald-50/50 text-emerald-800",
                !isCurrent && !isPassed && "border-slate-100 bg-slate-50/50 opacity-60",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPassed && "bg-emerald-200 text-emerald-800",
                    !isCurrent && !isPassed && "bg-slate-200 text-slate-600",
                  )}
                >
                  Step {idx + 1}
                </span>
                {isPassed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <Icon className="h-4 w-4 text-slate-400" />
                )}
              </div>

              <div>
                <p className="font-bold text-xs leading-tight text-foreground">
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {step.roleLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit History Panel */}
      {showHistory && history.length > 0 && (
        <div className="border-t pt-4 space-y-3 animate-in fade-in duration-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-primary" /> Approval Audit Trail
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.slice().reverse().map((item, i) => (
              <div
                key={i}
                className="text-xs p-3 rounded-lg border bg-muted/30 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {item.actor_name} ({item.actor_role?.toUpperCase()})
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-[10px] px-1.5 py-0",
                      item.action === "advance"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200",
                    )}
                  >
                    {item.action === "advance" ? "Advanced" : "Rejected"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Transitioned from{" "}
                  <span className="font-medium">{item.from_status}</span> →{" "}
                  <span className="font-medium">{item.to_status}</span> on{" "}
                  {new Date(item.created_at).toLocaleString()}
                </p>
                {item.note && (
                  <p className="text-foreground bg-background p-2 rounded border italic mt-1 text-[11px]">
                    &quot;{item.note}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
