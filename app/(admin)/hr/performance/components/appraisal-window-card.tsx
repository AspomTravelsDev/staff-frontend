"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openAppraisalCycleWindow } from "@/lib/api/performance-period.actions";
import {
  formatPerformanceDate,
  formatPerformanceMonth,
  getAppraisalCycleWindowInfo,
} from "@/lib/performance-review";
import type { PerformancePeriod } from "@/lib/types/performance-period";

export function AppraisalWindowCard({ initialPeriods }: { initialPeriods: PerformancePeriod[] }) {
  const windowInfo = getAppraisalCycleWindowInfo();
  const [periods, setPeriods] = useState(initialPeriods);
  const currentPeriod =
    periods.find((item) => item.type === "appraisal" && item.month === windowInfo.targetMonth) ??
    periods.find((item) => item.type === "appraisal" && item.status === "open");
  const isOpen = currentPeriod?.status === "open";
  const [deadline, setDeadline] = useState(() =>
    (currentPeriod?.submission_deadline ?? windowInfo.defaultDeadline).slice(0, 10),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!deadline) {
      setError("Choose a submission deadline.");
      return;
    }

    setPending(true);
    setError(null);
    const targetMonth = isOpen && currentPeriod ? currentPeriod.month : windowInfo.targetMonth;
    const result = await openAppraisalCycleWindow({
      month: targetMonth,
      submission_deadline: deadline,
    });
    setPending(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    const saved = result.data;
    setPeriods((previous) => {
      const exists = previous.some((item) => item.id === saved.id);
      return exists ? previous.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...previous];
    });
    setDeadline(saved.submission_deadline.slice(0, 10));
    toast.success(
      isOpen
        ? "Appraisal submission deadline updated"
        : `${windowInfo.cycleLabel} Appraisal window is now open`,
    );
  }

  const badge = isOpen
    ? { label: "Window open", variant: "default" as const }
    : windowInfo.canOpenNow
      ? { label: "Early open available", variant: "outline" as const }
      : { label: "Scheduled", variant: "secondary" as const };

  const title = isOpen && currentPeriod
    ? `${formatPerformanceMonth(currentPeriod.month)} Bi-Yearly Appraisal Window`
    : `${windowInfo.cycleLabel} Bi-Yearly Appraisal Window`;

  const description = isOpen && currentPeriod
    ? `Staff can start and submit their appraisal on My Performance until ${formatPerformanceDate(currentPeriod.submission_deadline)}.`
    : windowInfo.canOpenNow
      ? `Open the ${windowInfo.cycleLabel} appraisal cycle early so staff have extra time to complete their self-assessment.`
      : `Opens automatically on ${windowInfo.cycleLabel.split(" ")[0]} 1, or HR can open it early starting in ${windowInfo.earlyOpenMonthLabel}.`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      {(isOpen || windowInfo.canOpenNow) && (
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div className="space-y-1.5">
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
                className="w-48"
              />
            </div>
            <Button type="submit" variant={isOpen ? "outline" : "default"} disabled={pending}>
              {pending
                ? isOpen
                  ? "Updating…"
                  : "Opening…"
                : isOpen
                  ? "Update deadline"
                  : `Open ${windowInfo.cycleLabel} window`}
            </Button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
