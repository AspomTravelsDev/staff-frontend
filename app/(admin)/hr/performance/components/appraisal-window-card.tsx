"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { openAppraisalCycleWindow } from "@/lib/api/performance-period.actions";
import {
  buildSelectablePeriodMonths,
  defaultDeadlineForPeriod,
  formatPerformancePeriodLabel,
  getAppraisalCycleWindowInfo,
} from "@/lib/performance-review";
import type { PerformancePeriod } from "@/lib/types/performance-period";

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
      <DialogContent className="sm:max-w-md">
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
