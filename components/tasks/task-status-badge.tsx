import { Badge } from "@/components/ui/badge";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { getTaskStatusLabel, getTaskStatusTone } from "@/lib/utils/task-status";
import { cn } from "@/lib/utils";

const tones = {
  pending: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  blocked: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  changes_requested: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  waiting: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  custom: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  submitted: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  completed: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export function TaskStatusBadge({ task, className }: {
  task: Pick<TaskTrackerItem, "status" | "custom_status">;
  className?: string;
}) {
  return <Badge variant="outline" className={cn("h-auto min-h-5 max-w-[180px] whitespace-normal break-words", tones[getTaskStatusTone(task)], className)}>
    {getTaskStatusLabel(task)}
  </Badge>;
}
