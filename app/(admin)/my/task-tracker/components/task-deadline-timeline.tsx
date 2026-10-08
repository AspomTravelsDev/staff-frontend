"use client";

import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { computeTaskDeadlineTimeline } from "@/lib/utils/task-timeline";
import { cn } from "@/lib/utils";

export function TaskDeadlineTimeline({ task, now }: { task: TaskTrackerItem; now: number | null }) {
  if (now === null) return null;
  const timeline = computeTaskDeadlineTimeline(task, now);
  if (!timeline) return null;
  const frozen = ["submitted", "completed"].includes(task.status);
  return <div className="mt-2 min-w-[150px] space-y-1.5" title="Time from assignment or creation to the deadline. The filled portion shows time elapsed, not work completed.">
    <div role="progressbar" aria-label={`Deadline time for ${task.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={timeline.percent} aria-valuetext={`${timeline.percent}% of deadline time elapsed${frozen ? " at submission or completion" : ""}. ${timeline.remainingText}`} className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width] duration-300", timeline.colorScheme === "emerald" && "bg-emerald-500", timeline.colorScheme === "amber" && "bg-amber-500", timeline.colorScheme === "rose" && "bg-rose-500")} style={{ width: `${timeline.percent}%` }} />
    </div>
    <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[10px] leading-tight text-muted-foreground">
      <span>{timeline.percent}% elapsed{frozen ? " at finish" : ""}</span>
      <span className={cn(timeline.isOverdue && "text-rose-600 dark:text-rose-400")}>{timeline.remainingText}</span>
    </div>
  </div>;
}
