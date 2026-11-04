"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskTrackerItem, TaskTrackerDashboardStats } from "@/lib/types/task-tracker";
import { getTaskTrackerDashboardSummary, updateTaskTrackerItem } from "@/lib/api/task-tracker";
import { TaskCompletionDialog } from "@/components/tasks/task-completion-dialog";
import { TaskWorkflowControls, isActiveTask } from "@/app/(admin)/my/task-tracker/components/task-workflow-controls";
import { computeTaskTimeline } from "@/lib/utils/task-timeline";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import {
  CalendarClock,
  ArrowRight,
  AlertTriangle,
  Clock,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UpcomingTasksWidgetProps {
  initialTasks: TaskTrackerItem[];
  stats: TaskTrackerDashboardStats;
  className?: string;
}

export function UpcomingTasksWidget({
  initialTasks,
  stats: initialStats,
  className,
}: UpcomingTasksWidgetProps) {
  const [tasks, setTasks] = useState<TaskTrackerItem[]>(initialTasks);
  const [stats, setStats] = useState<TaskTrackerDashboardStats>(initialStats);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [completionTask, setCompletionTask] = useState<TaskTrackerItem | null>(null);

  const refreshDashboard = async () => {
    try {
      const res = await getTaskTrackerDashboardSummary();
      if (res.success) {
        setTasks(res.data.data);
        setStats(res.data.stats);
      }
    } catch { /* Keep the successful task update if the summary cannot refresh. */ }
  };

  const removeTask = (task: TaskTrackerItem) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    const due = task.due_date ? Date.parse(task.due_date) : NaN;
    const now = Date.now();
    const dueSoon = due >= now && due <= now + 48 * 60 * 60 * 1000;
    setStats(prev => ({
      total_pending: Math.max(0, prev.total_pending - 1),
      overdue: Math.max(0, prev.overdue - (task.is_overdue ? 1 : 0)),
      due_soon: Math.max(0, prev.due_soon - (dueSoon ? 1 : 0)),
    }));
  };

  const handleTaskUpdated = (task: TaskTrackerItem) => {
    if (isActiveTask(task)) setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    else {
      const previous = tasks.find(t => t.id === task.id);
      if (previous) removeTask(previous);
    }
    void refreshDashboard();
  };

  const handleComplete = async () => {
    if (!completionTask || completionTask.is_delegated || togglingId) return false;
    setTogglingId(completionTask.id);
    try {
      const res = await updateTaskTrackerItem(completionTask.id, { status: "completed" });
      if (res.success) {
        removeTask(completionTask);
        toast.success(res.data.message || `Completed "${completionTask.title}"`);
        await refreshDashboard();
        return true;
      } else {
        toast.error(res.error.error || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    } finally {
      setTogglingId(null);
    }
    return false;
  };

  const now = Date.now();
  const attentionTasks = tasks
    .filter(isActiveTask)
    .map(task => ({ task, timeline: computeTaskTimeline(task.created_at, task.due_date, now) }))
    .filter(({ timeline }) => timeline.isOverdue || timeline.isDueSoon);

  if (attentionTasks.length === 0) return null;

  return (
    <Card className={cn("border border-border/80 shadow-xs flex flex-col justify-between overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 ring-1 ring-emerald-500/20">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Tasks needing attention
                </CardTitle>
             
              </div>
              <CardDescription className="text-xs">
                Overdue tasks and deadlines within the next 48 hours
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {stats.overdue > 0 && (
              <Badge
                variant="outline"
                className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-semibold text-[11px] gap-1 px-2.5 py-0.5"
              >
                <AlertTriangle className="h-3 w-3" />
                {stats.overdue} Overdue
              </Badge>
            )}
            {stats.due_soon > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-medium text-[11px] gap-1 px-2.5 py-0.5"
              >
                <Clock className="h-3 w-3" />
                {stats.due_soon} Due Soon
              </Badge>
            )}
            <Link
              href="/my/task-tracker"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline ml-1"
            >
              <span>View All ({stats.total_pending})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1">
        {attentionTasks.length > 0 ? (
          <div className="space-y-2">
            {attentionTasks.map(({ task, timeline }) => {

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-col gap-1.5 px-3 py-2 rounded-xl border text-xs bg-card hover:bg-muted/20",
                    timeline.isOverdue
                      ? "border-rose-300/80 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/15"
                      : "border-border/80"
                  )}
                >
                  {/* Top row: Checkbox, Title, Priority, Remaining Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {task.is_delegated ? <TaskWorkflowControls task={task} compact showHistory={false} onUpdated={handleTaskUpdated} /> : <Checkbox
                        checked={false}
                        disabled={togglingId !== null}
                        onCheckedChange={(checked: boolean | "indeterminate") => { if (checked === true) setCompletionTask(task); }}
                        className="mt-0.5 h-4 w-4 rounded border-muted-foreground/50 data-[state=checked]:bg-emerald-600 transition-transform active:scale-90"
                        aria-label={`Mark task ${task.title} complete`}
                      />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground tracking-tight break-words">
                            {task.title}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider",
                              task.priority === "urgent" && "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
                              task.priority === "high" && "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                              task.priority === "medium" && "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
                              task.priority === "low" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            )}
                          >
                            {task.priority}
                          </span>
                          <TaskStatusBadge task={task} />
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Flag className="h-3 w-3 shrink-0" />
                          <span>Due: {timeline.dueFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remaining Time Countdown Badge */}
                    <div className="shrink-0 pl-6 sm:pl-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold gap-1 px-2.5 py-0.5 whitespace-nowrap shadow-2xs",
                          timeline.colorScheme === "rose" && "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300",
                          timeline.colorScheme === "amber" && "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300",
                          timeline.colorScheme === "emerald" && "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
                          timeline.colorScheme === "slate" && "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {timeline.isOverdue ? (
                          <AlertTriangle className="h-3 w-3 text-rose-600" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{timeline.remainingText}</span>
                      </Badge>
                    </div>
                  </div>


                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
      <TaskCompletionDialog task={completionTask} onClose={() => setCompletionTask(null)} onConfirm={handleComplete} />
    </Card>
  );
}
