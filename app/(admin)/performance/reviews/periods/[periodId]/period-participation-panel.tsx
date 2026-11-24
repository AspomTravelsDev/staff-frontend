"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bell,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PerformanceMetric } from "@/components/performance/performance-page-header";
import { callAction } from "@/lib/api/action-result";
import {
  getPeriodParticipation,
  reassignAppraisalReviewer,
  refreshAppraisalCriteria,
  remindPeriodParticipant,
  resetPeriodAppraisal,
} from "@/lib/api/performance-period.actions";
import type {
  PeriodParticipationItem,
  PeriodParticipationResponse,
  ReassignableStage,
  ReviewerOption,
} from "@/lib/types/performance-period";

const STAGE_LABELS: Record<ReassignableStage, string> = {
  supervisor: "Supervisor",
  hr: "HR Reviewer",
  compliance: "Compliance",
  mp: "MP / Management",
};

function statusBadge(item: PeriodParticipationItem, isAppraisal: boolean) {
  switch (item.status) {
    case "not_started":
      return <Badge variant="outline">Not started</Badge>;
    case "drafting":
      return <Badge variant="secondary">Drafting self-assessment</Badge>;
    case "awaiting_reviewer":
      return <Badge variant="default">In review</Badge>;
    case "awaiting_mp":
      return (
        <Badge variant="default">
          {isAppraisal ? "Awaiting Management" : "Awaiting MP"}
        </Badge>
      );
    case "completed":
      return <Badge variant="secondary">Completed</Badge>;
  }
}

export function PeriodParticipationPanel({
  periodId,
  periodType,
  isSuperAdmin,
}: {
  periodId: string;
  periodType: "monthly_kpi" | "appraisal";
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryKey = ["performance", "period-participation", periodId] as const;

  const { data, isLoading, error, refetch, isFetching } = useQuery<PeriodParticipationResponse>({
    queryKey,
    queryFn: () => callAction(() => getPeriodParticipation(periodId)),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const [refreshTarget, setRefreshTarget] = useState<PeriodParticipationItem | null>(null);
  const [resetTarget, setResetTarget] = useState<PeriodParticipationItem | null>(null);
  const [resetReason, setResetReason] = useState("");
  const [reassignTarget, setReassignTarget] = useState<{
    item: PeriodParticipationItem;
    stage: ReassignableStage;
    reviewerId: string;
  } | null>(null);

  const isAppraisal = periodType === "appraisal";

  const refreshParticipation = () => {
    void queryClient.invalidateQueries({ queryKey });
    router.refresh();
  };

  const remindMutation = useMutation({
    mutationFn: (item: PeriodParticipationItem) =>
      callAction(() =>
        remindPeriodParticipant(
          periodId,
          item.appraisal_id
            ? { appraisal_id: item.appraisal_id }
            : { employee_id: item.employee_id },
        ),
      ),
    onSuccess: (res) => {
      toast.success(res.message);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Unable to send reminder.");
    },
  });

  const refreshCriteriaMutation = useMutation({
    mutationFn: (item: PeriodParticipationItem) =>
      callAction(() => refreshAppraisalCriteria(periodId, item.appraisal_id!)),
    onSuccess: (res) => {
      setRefreshTarget(null);
      refreshParticipation();
      toast.success(res.message);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Unable to refresh criteria.");
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ item, reason }: { item: PeriodParticipationItem; reason?: string }) =>
      callAction(() => resetPeriodAppraisal(periodId, item.appraisal_id!, reason)),
    onSuccess: (res) => {
      setResetTarget(null);
      setResetReason("");
      refreshParticipation();
      toast.success(res.message);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Unable to reset appraisal.");
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({
      appraisalId,
      stage,
      reviewerId,
    }: {
      appraisalId: string;
      stage: ReassignableStage;
      reviewerId: string;
    }) => callAction(() => reassignAppraisalReviewer(periodId, appraisalId, stage, reviewerId)),
    onSuccess: (res) => {
      setReassignTarget(null);
      refreshParticipation();
      toast.success(res.message);
    },
    onError: (failure) => {
      toast.error(failure instanceof Error ? failure.message : "Unable to reassign reviewer.");
    },
  });

  function openReassignDialog(item: PeriodParticipationItem) {
    const editableStage =
      (["supervisor", "hr", "compliance", "mp"] as ReassignableStage[]).find(
        (stage) =>
          item.applicable_stages.includes(stage) &&
          !item.submitted_stages.includes(stage) &&
          !(stage === "supervisor" && item.submitted_stages.includes("reviewer")) &&
          !(stage === "compliance" && item.submitted_stages.includes("reviewer")),
      ) ?? "mp";

    setReassignTarget({
      item,
      stage: editableStage,
      reviewerId: currentReviewerIdForStage(item, editableStage),
    });
  }

  function currentReviewerIdForStage(
    item: PeriodParticipationItem,
    stage: ReassignableStage,
  ): string {
    if (!item.reviewers) return "";
    if (stage === "supervisor") return item.reviewers.reviewer_id ?? "";
    if (stage === "hr") return item.reviewers.hr_reviewer_id ?? "";
    if (stage === "compliance") {
      return (
        item.reviewers.compliance_reviewer_id ??
        (isAppraisal && item.is_supervisor ? item.reviewers.reviewer_id ?? "" : "")
      );
    }
    return item.reviewers.mp_reviewer_id ?? "";
  }

  function optionsForStage(
    item: PeriodParticipationItem,
    stage: ReassignableStage,
  ): ReviewerOption[] {
    if (!data) return [];
    const pool =
      stage === "hr"
        ? data.reviewer_options.hr
        : stage === "compliance"
          ? data.reviewer_options.compliance
          : stage === "mp"
            ? data.reviewer_options.mp
            : data.reviewer_options.supervisors;
    return pool.filter((candidate) => candidate.id !== item.employee_id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading participation tracker…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <span>Unable to load period participation data.</span>
        <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const departments = Array.from(
    new Set(data.items.map((item) => item.department).filter((dept): dept is string => Boolean(dept))),
  ).sort((a, b) => a.localeCompare(b));

  const filteredItems = data.items.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${item.employee_name} ${item.employee_staff_id ?? ""} ${item.department ?? ""} ${item.waiting_on_name ?? ""}`
        .toLowerCase()
        .includes(query);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "in_review"
        ? item.status === "awaiting_reviewer" || item.status === "awaiting_mp"
        : item.status === statusFilter);
    const matchesDept = departmentFilter === "all" || item.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const resetNeedsReason = Boolean(resetTarget && resetTarget.status !== "drafting");

  return (
    <div className="space-y-6">
      <section aria-label="Participation summary" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <PerformanceMetric label="Eligible staff" value={data.summary.total} detail="Tracked for this cycle" />
        <PerformanceMetric label="Not started" value={data.summary.not_started} detail="Haven't clicked Start" tone="amber" />
        <PerformanceMetric label="Drafting" value={data.summary.drafting} detail="Self-assessment open" />
        <PerformanceMetric label="In review" value={data.summary.in_review} detail="With reviewers / MP" tone="primary" />
        <PerformanceMetric label="Completed" value={data.summary.completed} detail="Finalized" />
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search staff or current reviewer"
            className="h-9 pl-9"
            placeholder="Search staff, ID, or waiting on…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="participation-status-filter" className="text-sm">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="participation-status-filter" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="drafting">Drafting</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="participation-dept-filter" className="text-sm">Department</Label>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger id="participation-dept-filter" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-44">Staff member</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="min-w-44">Currently waiting on</TableHead>
              <TableHead>Criteria</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredItems.length && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No staff match the current filters.
                </TableCell>
              </TableRow>
            )}
            {filteredItems.map((item) => {
              const canResetRow = item.can_reset && (item.status === "drafting" || isSuperAdmin);
              const hasMenuActions =
                item.can_remind || item.can_refresh_criteria || item.can_reassign || canResetRow;
              return (
                <TableRow key={item.employee_id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{item.employee_name}</span>
                      {item.is_supervisor && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          Supervisor
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.employee_staff_id || "—"}</p>
                  </TableCell>
                  <TableCell>{item.department || "—"}</TableCell>
                  <TableCell>{statusBadge(item, isAppraisal)}</TableCell>
                  <TableCell>
                    {item.status === "completed" ? (
                      <span className="text-xs text-muted-foreground">Finalized</span>
                    ) : item.waiting_on_name ? (
                      <div className="space-y-0.5">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {item.waiting_on_role}
                        </Badge>
                        <p className="text-sm font-medium">{item.waiting_on_name}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.appraisal_id ? (
                      <span>{item.criteria_count}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.can_remind && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={remindMutation.isPending}
                          onClick={() => remindMutation.mutate(item)}
                        >
                          <Bell className="mr-1.5 size-3.5" aria-hidden="true" />
                          Remind
                        </Button>
                      )}
                      {hasMenuActions && (item.can_refresh_criteria || item.can_reassign || canResetRow) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Manage ${item.employee_name}`}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {item.can_refresh_criteria && (
                              <DropdownMenuItem onSelect={() => setRefreshTarget(item)}>
                                <RefreshCw className="mr-2 size-4" />
                                Refresh KPI criteria
                              </DropdownMenuItem>
                            )}
                            {item.can_reassign && (
                              <DropdownMenuItem onSelect={() => openReassignDialog(item)}>
                                <UserCog className="mr-2 size-4" />
                                Reassign reviewer
                              </DropdownMenuItem>
                            )}
                            {canResetRow && (
                              <>
                                {(item.can_refresh_criteria || item.can_reassign) && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => {
                                    setResetReason("");
                                    setResetTarget(item);
                                  }}
                                >
                                  <RotateCcw className="mr-2 size-4" />
                                  Reset appraisal
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Refresh KPI Criteria confirmation */}
      <AlertDialog open={!!refreshTarget} onOpenChange={(open) => { if (!open && !refreshCriteriaMutation.isPending) setRefreshTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh KPI criteria for {refreshTarget?.employee_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the snapshotted KPI list on their unsubmitted draft with the latest active KPIs from Compliance (General + Department + extra staff categories). Any saved draft ratings will be cleared so they match the updated KPIs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refreshCriteriaMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={refreshCriteriaMutation.isPending}
              onClick={() => refreshTarget && refreshCriteriaMutation.mutate(refreshTarget)}
            >
              {refreshCriteriaMutation.isPending ? "Refreshing…" : "Refresh KPIs"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Appraisal confirmation */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open && !resetMutation.isPending) setResetTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset appraisal for {resetTarget?.employee_name}?</DialogTitle>
            <DialogDescription>
              This deletes their current {isAppraisal ? "appraisal" : "Monthly KPI"} attempt, criteria snapshot, and any saved draft/review answers so they can click <strong>Start</strong> fresh.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {resetNeedsReason && (
              <div className="space-y-2">
                <Label htmlFor="reset-appraisal-reason">
                  Reason for resetting submitted appraisal (required, min 10 characters)
                </Label>
                <Textarea
                  id="reset-appraisal-reason"
                  rows={3}
                  maxLength={500}
                  value={resetReason}
                  onChange={(event) => setResetReason(event.target.value)}
                  placeholder="Explain why this submitted assessment is being reset…"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={resetMutation.isPending}
                onClick={() => setResetTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={
                  resetMutation.isPending ||
                  (resetNeedsReason && resetReason.trim().length < 10)
                }
                onClick={() =>
                  resetTarget &&
                  resetMutation.mutate({
                    item: resetTarget,
                    reason: resetNeedsReason ? resetReason.trim() : undefined,
                  })
                }
              >
                {resetMutation.isPending ? "Resetting…" : "Reset appraisal"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Reviewer Dialog */}
      <Dialog open={!!reassignTarget} onOpenChange={(open) => { if (!open && !reassignMutation.isPending) setReassignTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign reviewer for {reassignTarget?.item.employee_name}</DialogTitle>
            <DialogDescription>
              Choose an unsubmitted review stage and select the active reviewer who should handle it.
            </DialogDescription>
          </DialogHeader>
          {reassignTarget && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!reassignTarget.item.appraisal_id || !reassignTarget.reviewerId || reassignMutation.isPending) return;
                reassignMutation.mutate({
                  appraisalId: reassignTarget.item.appraisal_id,
                  stage: reassignTarget.stage,
                  reviewerId: reassignTarget.reviewerId,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="reassign-stage">Review stage</Label>
                <Select
                  value={reassignTarget.stage}
                  disabled={reassignMutation.isPending}
                  onValueChange={(value) => {
                    const nextStage = value as ReassignableStage;
                    setReassignTarget((old) =>
                      old
                        ? {
                            ...old,
                            stage: nextStage,
                            reviewerId: currentReviewerIdForStage(old.item, nextStage),
                          }
                        : old,
                    );
                  }}
                >
                  <SelectTrigger id="reassign-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["supervisor", "hr", "compliance", "mp"] as ReassignableStage[])
                      .filter((stage) => reassignTarget.item.applicable_stages.includes(stage))
                      .map((stage) => {
                        const locked =
                          reassignTarget.item.submitted_stages.includes(stage) ||
                          ((stage === "supervisor" || stage === "compliance") &&
                            reassignTarget.item.submitted_stages.includes("reviewer"));
                        return (
                          <SelectItem key={stage} value={stage} disabled={locked}>
                            {STAGE_LABELS[stage]}
                            {locked ? " (Submitted · locked)" : ""}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reassign-reviewer">Assigned reviewer</Label>
                <Select
                  value={reassignTarget.reviewerId}
                  disabled={reassignMutation.isPending}
                  onValueChange={(value) =>
                    setReassignTarget((old) => (old ? { ...old, reviewerId: value } : old))
                  }
                >
                  <SelectTrigger id="reassign-reviewer">
                    <SelectValue placeholder="Choose an active reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {optionsForStage(reassignTarget.item, reassignTarget.stage).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                        {option.department ? ` · ${option.department}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={reassignMutation.isPending}
                  onClick={() => setReassignTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reassignMutation.isPending || !reassignTarget.reviewerId}
                >
                  {reassignMutation.isPending ? "Saving…" : "Save reviewer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
