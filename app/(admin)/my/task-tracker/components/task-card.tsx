"use client";

import { useState } from "react";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MoreVertical,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Bell,
  Mail,
  Edit2,
  Trash2,
  Check,
  Undo2,
  Flag,
  Loader2,
  Sparkles,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { computeTaskTimeline } from "@/lib/utils/task-timeline";
import { approveTaskExtension } from "@/lib/api/task-tracker";
import { RequestExtensionDialog } from "./request-extension-dialog";
import { DeclineExtensionDialog } from "./decline-extension-dialog";
import { toast } from "sonner";

interface TaskCardProps {
  task: TaskTrackerItem;
  view?: "assigned_to_me" | "assigned_by_me";
  onToggle: (id: string) => Promise<void>;
  onEdit: (task: TaskTrackerItem) => void;
  onDelete: (id: string) => Promise<void>;
  onTaskUpdated?: (task: TaskTrackerItem) => void;
}

export function TaskCard({
  task,
  view = "assigned_to_me",
  onToggle,
  onEdit,
  onDelete,
  onTaskUpdated,
}: TaskCardProps) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approvingExt, setApprovingExt] = useState(false);
  const [requestExtOpen, setRequestExtOpen] = useState(false);
  const [declineExtOpen, setDeclineExtOpen] = useState(false);

  const isCompleted = task.status === "completed";
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = !isCompleted && dueDate ? isPast(dueDate) : false;
  const timeline = computeTaskTimeline(task.created_at, task.due_date);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(task.id);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setDeleting(true);
      try {
        await onDelete(task.id);
      } finally {
        setDeleting(false);
      }
    }
  };

  // Quick Approve Extension (Assigner)
  const handleApproveExtension = async () => {
    setApprovingExt(true);
    try {
      const res = await approveTaskExtension(task.id);
      if (res.success) {
        toast.success("Deadline extension approved! Assignee has been notified.");
        if (onTaskUpdated && res.data?.data) {
          onTaskUpdated(res.data.data);
        }
      } else {
        toast.error(res.error?.error || "Failed to approve extension");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve extension");
    } finally {
      setApprovingExt(false);
    }
  };

  // Format Due Date / Completion Badge
  const getDueBadge = () => {
    if (isCompleted) {
      const completedDate = task.completed_at ? new Date(task.completed_at) : null;
      const wasOnTime =
        task.was_completed_on_time !== undefined && task.was_completed_on_time !== null
          ? task.was_completed_on_time
          : completedDate && dueDate
          ? completedDate.getTime() <= dueDate.getTime()
          : true;

      return (
        <div className="inline-flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs flex items-center gap-1 px-2.5 py-0.5",
              wasOnTime
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>{wasOnTime ? "Completed on time" : "Completed past deadline"}</span>
          </Badge>
          {completedDate && (
            <span className="text-[11px] text-muted-foreground font-mono">
              ({format(completedDate, "MMM d, h:mm a")})
            </span>
          )}
        </div>
      );
    }

    if (!dueDate) {
      return (
        <Badge variant="outline" className="text-muted-foreground text-xs font-normal">
          No deadline
        </Badge>
      );
    }

    if (isOverdue) {
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 font-semibold text-xs flex items-center gap-1 animate-pulse"
        >
          <AlertTriangle className="h-3 w-3" />
          Overdue ({formatDistanceToNow(dueDate, { addSuffix: true })})
        </Badge>
      );
    }

    if (isToday(dueDate)) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold text-xs flex items-center gap-1"
        >
          <Clock className="h-3 w-3" />
          Due Today at {format(dueDate, "h:mm a")}
        </Badge>
      );
    }

    if (isTomorrow(dueDate)) {
      return (
        <Badge
          variant="outline"
          className="bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-medium text-xs flex items-center gap-1"
        >
          <Clock className="h-3 w-3" />
          Due Tomorrow ({format(dueDate, "h:mm a")})
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 font-medium text-xs flex items-center gap-1"
      >
        <Calendar className="h-3 w-3 text-muted-foreground" />
        Due {format(dueDate, "MMM d, yyyy 'at' h:mm a")}
      </Badge>
    );
  };

  // Priority Pill Colors
  const getPriorityPill = () => {
    switch (task.priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            Medium
          </span>
        );
      case "low":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Low
          </span>
        );
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/20 transition-all shadow-2xs",
          isCompleted && "opacity-75 bg-muted/30"
        )}
      >
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Quick Complete Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              disabled={toggling || deleting}
              className="h-5 w-5 rounded-md border-muted-foreground/40 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 transition-transform active:scale-95"
              aria-label={`Mark task ${task.title} as ${isCompleted ? "pending" : "completed"}`}
            />
          </div>

          {/* Task Info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  "text-base font-semibold text-foreground tracking-tight break-words",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>
              {getPriorityPill()}

              {/* Delegation Badges */}
              {view === "assigned_by_me" && task.user && (
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-full text-xs font-medium">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned to:</span>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={task.user.image_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-indigo-200 text-indigo-800">
                      {task.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{task.user.name}</span>
                  {task.user.department && (
                    <span className="text-[10px] opacity-75">({task.user.department})</span>
                  )}
                </div>
              )}

              {view !== "assigned_by_me" && task.assigned_by && task.is_delegated && (
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-xs font-medium">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned by:</span>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={task.assigned_by.image_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-emerald-200 text-emerald-800">
                      {task.assigned_by.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{task.assigned_by.name}</span>
                  {task.assigned_by.department && (
                    <span className="text-[10px] opacity-75">({task.assigned_by.department})</span>
                  )}
                </div>
              )}
            </div>

            {task.description && (
              <p
                className={cn(
                  "text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed",
                  isCompleted && "line-through"
                )}
              >
                {task.description}
              </p>
            )}

            {/* Meta & Reminder badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-muted-foreground">
              {getDueBadge()}

              {/* Notification channels info */}
              {(task.enable_push_reminder || task.enable_email_reminder) && (
                <div className="inline-flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded text-[11px] font-mono">
                  {task.enable_push_reminder && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5",
                        (task.sent_reminders && task.sent_reminders.length > 0) || task.reminder_sent_at
                          ? "text-emerald-600 font-semibold"
                          : "text-slate-500"
                      )}
                      title={
                        task.sent_reminders && task.sent_reminders.length > 0
                          ? `Reminders sent: ${task.sent_reminders.join(", ")}`
                          : "Dynamic smart alerts armed (1w, 24h, 1h, 30m, at deadline)"
                      }
                    >
                      <Bell className="h-3 w-3" />
                    </span>
                  )}
                  {task.enable_email_reminder && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5",
                        (task.sent_reminders && task.sent_reminders.length > 0) || task.reminder_sent_at
                          ? "text-emerald-600 font-semibold"
                          : "text-slate-500"
                      )}
                      title={
                        task.sent_reminders && task.sent_reminders.length > 0
                          ? `Reminders sent: ${task.sent_reminders.join(", ")}`
                          : "Dynamic smart alerts armed (1w, 24h, 1h, 30m, at deadline)"
                      }
                    >
                      <Mail className="h-3 w-3" />
                    </span>
                  )}
                  <span
                    className="text-[10px] text-muted-foreground/80 font-sans"
                    title="Dynamic alerts: 1 week, 24h, 1h, 30m, at deadline"
                  >
                    {task.sent_reminders && task.sent_reminders.length > 0
                      ? `${task.sent_reminders.length} sent`
                      : "Auto"}
                  </span>
                </div>
              )}
            </div>

            {/* Contextual Extension Banners */}
            {/* 1. Assigner Context: Pending Extension Review Action Card */}
            {view === "assigned_by_me" && task.extension_status === "pending" && !isCompleted && (
              <div className="mt-2.5 p-3 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-850 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Extension Requested by {task.user?.name || "Assignee"}</span>
                  </div>
                  {task.extension_requested_due_date && (
                    <div className="text-amber-900 dark:text-amber-300 text-xs">
                      Proposed Deadline:{" "}
                      <strong className="font-mono font-bold">
                        {format(new Date(task.extension_requested_due_date), "MMM d, yyyy 'at' h:mm a")}
                      </strong>
                    </div>
                  )}
                  {task.extension_reason && (
                    <p className="text-[11px] italic text-amber-800 dark:text-amber-400">
                      &ldquo;{task.extension_reason}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={approvingExt}
                    onClick={() => setDeclineExtOpen(true)}
                    className="h-8 text-xs border-amber-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-amber-800 dark:text-rose-400 cursor-pointer"
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    disabled={approvingExt}
                    onClick={handleApproveExtension}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer"
                  >
                    {approvingExt ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Approve Extension
                  </Button>
                </div>
              </div>
            )}

            {/* 2. Assignee Context: Pending Extension Banner */}
            {view !== "assigned_by_me" && task.is_delegated && task.extension_status === "pending" && !isCompleted && (
              <div className="mt-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Extension Requested:</span> Proposed deadline is{" "}
                  <strong className="font-mono">
                    {task.extension_requested_due_date
                      ? format(new Date(task.extension_requested_due_date), "MMM d, yyyy 'at' h:mm a")
                      : "pending"}
                  </strong>.
                  {task.extension_reason && (
                    <p className="text-[11px] italic text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                      &ldquo;{task.extension_reason}&rdquo;
                    </p>
                  )}
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">
                    Awaiting review by {task.assigned_by?.name || "your assigner"}.
                  </span>
                </div>
              </div>
            )}

            {/* 3. Assignee Context: Rejected Extension Banner */}
            {view !== "assigned_by_me" && task.is_delegated && task.extension_status === "rejected" && !isCompleted && (
              <div className="mt-2 p-2.5 rounded-lg border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Extension Declined:</span> Your extension request was not granted.
                  {task.extension_feedback && (
                    <p className="text-[11px] italic text-rose-800 dark:text-rose-300 mt-0.5">
                      Note from assigner: &ldquo;{task.extension_feedback}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Visual Timeline Progress Bar */}
            {!isCompleted && timeline.hasDeadline && (
              <div className="pt-2 space-y-1.5 max-w-xl">
                <div className="relative w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
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
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span>Started {timeline.startFormatted}</span>
                  <span className={cn(timeline.isOverdue ? "text-rose-600 font-bold" : "text-muted-foreground")}>
                    {timeline.isOverdue
                      ? "100% (Deadline passed)"
                      : `${timeline.percent}% elapsed • ${timeline.remainingText}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    Due {timeline.dueShortFormatted}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="flex items-center justify-end gap-1 self-end sm:self-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Task Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleToggle} className="cursor-pointer">
                {isCompleted ? (
                  <>
                    <Undo2 className="h-4 w-4 mr-2 text-amber-600" />
                    Mark as Pending
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-600" />
                    Mark Completed
                  </>
                )}
              </DropdownMenuItem>

              {/* Assignee Option: Request Extension */}
              {view !== "assigned_by_me" && !isCompleted && task.is_delegated && task.extension_status !== "pending" && (
                <DropdownMenuItem
                  onClick={() => setRequestExtOpen(true)}
                  className="cursor-pointer text-amber-700 dark:text-amber-400 focus:text-amber-800"
                >
                  <Clock className="h-4 w-4 mr-2 text-amber-600" />
                  Request Extension
                </DropdownMenuItem>
              )}

              {/* Assigner Option: Extend / Change Deadline */}
              {view === "assigned_by_me" && !isCompleted && (
                <DropdownMenuItem
                  onClick={() => onEdit(task)}
                  className="cursor-pointer text-emerald-700 dark:text-emerald-400 focus:text-emerald-800"
                >
                  <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                  Extend / Change Deadline
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
                <Edit2 className="h-4 w-4 mr-2 text-blue-600" />
                Edit Task Details
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Extension Dialogs */}
      {requestExtOpen && (
        <RequestExtensionDialog
          open={requestExtOpen}
          onOpenChange={setRequestExtOpen}
          task={task}
          onSuccess={(updated) => {
            if (onTaskUpdated) onTaskUpdated(updated);
          }}
        />
      )}

      {declineExtOpen && (
        <DeclineExtensionDialog
          open={declineExtOpen}
          onOpenChange={setDeclineExtOpen}
          task={task}
          onSuccess={(updated) => {
            if (onTaskUpdated) onTaskUpdated(updated);
          }}
        />
      )}
    </>
  );
}
