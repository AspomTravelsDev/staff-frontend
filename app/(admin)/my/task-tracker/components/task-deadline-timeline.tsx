"use client";

import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { computeTaskDeadlineTimeline } from "@/lib/utils/task-timeline";
import { cn } from "@/lib/utils";

export function TaskDeadlineTimeline({ task, now }: { task: TaskTrackerItem; now: number | null }) {
  if (now === null) return null;
  const timeline = computeTaskDeadlineTimeline(task, now);
  if (!timeline) return null;
  const frozen = ["submitted", "completed"].includes(task.status);
  return <div className="min-w-[150px] space-y-1.5" title={frozen ? "Submission and completion dates stop the deadline clock." : "Urgency increases as the deadline approaches. Every task uses the same seven-day scale; a full red bar means the deadline has been reached."}>
    <p className={cn("text-xs font-medium leading-tight", timeline.colorScheme === "rose" && "text-rose-700 dark:text-rose-400", timeline.colorScheme === "amber" && "text-amber-800 dark:text-amber-300", timeline.colorScheme === "emerald" && "text-emerald-700 dark:text-emerald-400", timeline.colorScheme === "slate" && "text-muted-foreground")}>{timeline.remainingText}</p>
    {!frozen && <div role="meter" aria-label={`Deadline urgency for ${task.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={timeline.urgencyPercent} aria-valuetext={timeline.remainingText} className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", timeline.colorScheme === "emerald" && "bg-emerald-500/70", timeline.colorScheme === "amber" && "bg-amber-500", timeline.colorScheme === "rose" && "bg-rose-500", timeline.colorScheme === "slate" && "bg-slate-400/60")} style={{ width: `${timeline.urgencyPercent}%` }} />
    </div>}
  </div>;
}
