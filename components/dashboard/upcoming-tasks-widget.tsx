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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskTrackerItem, TaskTrackerDashboardStats } from "@/lib/types/task-tracker";
import { getTaskTrackerDashboardSummary, updateTaskTrackerItem } from "@/lib/api/task-tracker";
import { TaskCompletionDialog } from "@/components/tasks/task-completion-dialog";
import { TaskWorkflowControls, isActiveTask } from "@/app/(admin)/my/task-tracker/components/task-workflow-controls";
import { computeTaskTimeline } from "@/lib/utils/task-timeline";
import { getTaskStatusLabel } from "@/lib/utils/task-status";
import {
  CalendarClock,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Flag,
  Calendar,
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
                  Upcoming Deadlines & Task Timeline
                </CardTitle>
             
              </div>
              <CardDescription className="text-xs">
                Real-time progress bars showing elapsed vs remaining time until deliverables are due
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

      <CardContent className="p-3 sm:p-4 flex-1">
        {tasks.length > 0 ? (
          <div className="space-y-3.5">
            {tasks.map((task) => {
              const timeline = computeTaskTimeline(task.created_at, task.due_date);

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-xl border transition-all text-xs bg-card hover:bg-muted/20 shadow-2xs",
                    timeline.isOverdue
                      ? "border-rose-300/80 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/15"
                      : "border-border/80"
                  )}
                >
                  {/* Top row: Checkbox, Title, Priority, Remaining Badge */}
                  <div className="flex items-start justify-between gap-3">
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
                          <Badge variant="outline" className="max-w-[180px] whitespace-normal break-words">{getTaskStatusLabel(task)}</Badge>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remaining Time Countdown Badge */}
                    <div className="shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold gap-1 px-2.5 py-0.5 whitespace-nowrap shadow-2xs",
                          timeline.isOverdue && "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 animate-pulse",
                          !timeline.isOverdue && timeline.isDueSoon && "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300",
                          !timeline.isOverdue && !timeline.isDueSoon && timeline.hasDeadline && "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
                          !timeline.hasDeadline && "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
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

                  {/* Visual Timeline Progress Bar */}
                  {timeline.hasDeadline ? (
                    <div className="pt-1.5 space-y-1.5 border-t border-border/40">
                      {/* Timeline Bar Track */}
                      <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden shadow-inner">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            timeline.isOverdue && "bg-rose-500 animate-pulse",
                            !timeline.isOverdue && timeline.colorScheme === "rose" && "bg-gradient-to-r from-amber-500 to-rose-500",
                            !timeline.isOverdue && timeline.colorScheme === "amber" && "bg-gradient-to-r from-emerald-500 to-amber-500",
                            !timeline.isOverdue && timeline.colorScheme === "emerald" && "bg-gradient-to-r from-emerald-400 to-emerald-600"
                          )}
                          style={{ width: `${timeline.percent}%` }}
                        />
                      </div>

                      {/* Milestone Labels */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                          <span>Started: {timeline.startFormatted}</span>
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.2 rounded-full border",
                            timeline.isOverdue
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 font-bold"
                              : "bg-muted/50 text-muted-foreground border-border/60"
                          )}
                        >
                          {timeline.isOverdue ? "100% (Deadline passed)" : `${timeline.percent}% time elapsed`}
                        </span>

                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <Flag className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Due: {timeline.dueShortFormatted}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <Calendar className="h-3 w-3" />
                      <span>No deadline assigned • Manage in Task Tracker</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No urgent deadlines pending</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All your tracked deliverables and tasks are on track.
              </p>
            </div>
            <Link href="/my/task-tracker">
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add New Deadline
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
      <TaskCompletionDialog task={completionTask} onClose={() => setCompletionTask(null)} onConfirm={handleComplete} />
    </Card>
  );
}
