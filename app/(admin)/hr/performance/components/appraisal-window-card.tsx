"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, Loader2, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPeriodReadiness, openAppraisalCycleWindow } from "@/lib/api/performance-period.actions";
import {
  buildSelectablePeriodMonths,
  defaultDeadlineForPeriod,
  formatPerformancePeriodLabel,
  getAppraisalCycleWindowInfo,
} from "@/lib/performance-review";
import type { PerformancePeriod, PeriodReadinessResponse } from "@/lib/types/performance-period";

type PeriodType = PerformancePeriod["type"];

export interface PeriodDialogTarget {
  type: PeriodType;
  month: string;
  submission_deadline?: string;
  status?: "draft" | "open" | "closed";
}

function periodTypeLabel(type: PeriodType): string {
  return type === "appraisal" ? "Bi-Yearly Appraisal" : "Monthly KPI";
}

function getCurrentUtcMonth(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function AppraisalPeriodDialog({
  open,
  onOpenChange,
  periods,
  target,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: PerformancePeriod[];
  target: PeriodDialogTarget | null;
  onSaved: (period: PerformancePeriod) => void;
}) {
  const router = useRouter();
  const windowInfo = getAppraisalCycleWindowInfo();
  const currentYearMonth = getCurrentUtcMonth();

  const initialType: PeriodType = target?.type ?? "appraisal";
  const initialMonth = target?.month ?? windowInfo.targetMonth;
  const initialDeadline =
    target?.submission_deadline?.slice(0, 10) ??
    defaultDeadlineForPeriod(initialType, initialMonth);

  const [selectedType, setSelectedType] = useState<PeriodType>(initialType);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [deadline, setDeadline] = useState<string>(initialDeadline);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<PeriodReadinessResponse | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [showReadinessDetails, setShowReadinessDetails] = useState(false);

  const existingTypeMonths = periods
    .filter((item) => item.type === selectedType)
    .map((item) => item.month);
  const selectableMonths = buildSelectablePeriodMonths(selectedType, existingTypeMonths);
  const openMonthsForSelectedType = new Set(
    periods
      .filter((item) => item.status === "open" && item.type === selectedType)
      .map((item) => item.month),
  );

  const matchingPeriod = periods.find(
    (item) => item.type === selectedType && item.month === selectedMonth,
  );
  const isEditingOpen = matchingPeriod?.status === "open";

  useEffect(() => {
    if (!open || isEditingOpen) return;
    let active = true;
    setReadinessLoading(true);
    setReadinessError(null);
    void getPeriodReadiness(selectedType).then((result) => {
      if (!active) return;
      setReadinessLoading(false);
      if (!result.success) {
        setReadinessError(result.error.message);
        return;
      }
      setReadiness(result.data);
    });
    return () => {
      active = false;
    };
  }, [open, isEditingOpen, selectedType]);

  function applySelection(nextType: PeriodType, nextMonth?: string) {
    const monthsForType = periods
      .filter((item) => item.type === nextType)
      .map((item) => item.month);
    const availableMonths = buildSelectablePeriodMonths(nextType, monthsForType);
    const defaultForType =
      nextMonth ?? (nextType === "appraisal" ? windowInfo.targetMonth : currentYearMonth);
    const resolvedMonth = availableMonths.includes(defaultForType)
      ? defaultForType
      : (availableMonths[0] ?? windowInfo.targetMonth);
    const existing = periods.find(
      (item) => item.type === nextType && item.month === resolvedMonth,
    );

    setSelectedType(nextType);
    setSelectedMonth(resolvedMonth);
    setDeadline(
      existing
        ? existing.submission_deadline.slice(0, 10)
        : defaultDeadlineForPeriod(nextType, resolvedMonth),
    );
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!deadline) {
      setError("Choose a submission deadline.");
      return;
    }

    const wasEditingOpen = isEditingOpen;
    setPending(true);
    setError(null);
    const result = await openAppraisalCycleWindow({
      type: selectedType,
      month: selectedMonth,
      submission_deadline: deadline,
    });
    setPending(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    const saved = result.data;
    onSaved(saved);
    onOpenChange(false);
    toast.success(
      wasEditingOpen
        ? "Submission deadline updated"
        : `${formatPerformancePeriodLabel(saved.type, saved.month)} ${periodTypeLabel(saved.type)} window is now open`,
    );
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditingOpen ? "Update submission deadline" : "Start new appraisal / review"}
          </DialogTitle>
          <DialogDescription>
            Choose the cycle type, period, and submission deadline for staff.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appraisal-window-type">Cycle type</Label>
            <Select
              value={selectedType}
              disabled={pending}
              onValueChange={(value: PeriodType) => applySelection(value)}
            >
              <SelectTrigger id="appraisal-window-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appraisal">Bi-Yearly Appraisal</SelectItem>
                <SelectItem value="monthly_kpi">Monthly KPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appraisal-window-month">Period</Label>
            <Select
              value={selectedMonth}
              disabled={pending}
              onValueChange={(value) => applySelection(selectedType, value)}
            >
              <SelectTrigger id="appraisal-window-month" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatPerformancePeriodLabel(selectedType, month)}
                    {openMonthsForSelectedType.has(month) ? " · Open" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appraisal-window-deadline">Submission deadline</Label>
            <Input
              id="appraisal-window-deadline"
              type="date"
              required
              disabled={pending}
              value={deadline}
              onChange={(event) => {
                setDeadline(event.target.value);
                setError(null);
              }}
            />
          </div>
          {!isEditingOpen && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-foreground">Pre-flight staff readiness</span>
                {readinessLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Checking staff setup…
                  </span>
                ) : readiness ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="size-3 text-green-600" aria-hidden="true" />
                      {readiness.summary.ready} ready
                    </Badge>
                    {readiness.summary.warning > 0 && (
                      <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        {readiness.summary.warning} advisory
                      </Badge>
                    )}
                    {readiness.summary.blocked > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="size-3" aria-hidden="true" />
                        {readiness.summary.blocked} blocked
                      </Badge>
                    )}
                  </div>
                ) : null}
              </div>

              {readinessError && (
                <p className="text-destructive">{readinessError}</p>
              )}

              {readiness && (readiness.summary.blocked > 0 || readiness.summary.warning > 0) && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                    <span>
                      {readiness.summary.blocked > 0
                        ? "Blocked staff will get an error when clicking Start until resolved."
                        : "Some staff only match General KPIs or skip HR review."}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      onClick={() => setShowReadinessDetails((value) => !value)}
                    >
                      {showReadinessDetails ? "Hide details" : "Inspect staff"}
                      {showReadinessDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>
                  </div>

                  {showReadinessDetails && (
                    <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border bg-background p-2">
                      {readiness.items
                        .filter((item) => item.status !== "ready")
                        .map((item) => (
                          <div key={item.employee_id} className="rounded border px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-foreground">
                                {item.employee_name}
                                {item.department ? ` · ${item.department}` : ""}
                              </span>
                              <Badge variant={item.status === "blocked" ? "destructive" : "outline"} className="text-[10px]">
                                {item.kpi_count} KPI{item.kpi_count === 1 ? "" : "s"}
                              </Badge>
                            </div>
                            {[...item.issues, ...item.warnings].map((msg) => (
                              <p
                                key={msg}
                                className={`mt-1 ${item.issues.includes(msg) ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}
                              >
                                {msg}
                              </p>
                            ))}
                          </div>
                        ))}
                      <div className="pt-1 text-right">
                        <Link href="/hr/department-supervisors" className="text-primary hover:underline">
                          Manage Department Supervisors →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? isEditingOpen
                  ? "Updating…"
                  : "Opening…"
                : isEditingOpen
                  ? "Update deadline"
                  : `Open ${formatPerformancePeriodLabel(selectedType, selectedMonth)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AppraisalWindowCard({
  onStartNew,
}: {
  onStartNew: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Appraisal Windows &amp; Deadlines</CardTitle>
              <CardDescription className="mt-1">
                Start a new Bi-Yearly Appraisal or Monthly KPI review period, or edit deadlines from the table below.
              </CardDescription>
            </div>
          </div>
          <Button type="button" onClick={onStartNew}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Start new appraisal / review
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
