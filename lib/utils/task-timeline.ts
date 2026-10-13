import { format, formatDistance } from "date-fns";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";

export interface TaskTimeline {
  hasDeadline: boolean;
  urgencyPercent: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  remainingText: string;
  startFormatted: string;
  dueFormatted: string;
  dueShortFormatted: string;
  colorScheme: "emerald" | "amber" | "rose" | "slate";
}

/**
 * Uses one seven-day urgency scale for every task, independent of assignment age.
 * The numeric fill is for rendering only; staff see the time remaining.
 */
export function computeTaskTimeline(
  createdAtStr: string,
  dueDateStr: string | null,
  now: number = Date.now()
): TaskTimeline {
  if (!dueDateStr || !Number.isFinite(Date.parse(dueDateStr)) || !Number.isFinite(now)) {
    const createdDate = new Date(createdAtStr);
    return {
      hasDeadline: false,
      urgencyPercent: 0,
      isOverdue: false,
      isDueSoon: false,
      remainingText: "No deadline set",
      startFormatted: isNaN(createdDate.getTime()) ? "Created" : format(createdDate, "MMM d, yyyy"),
      dueFormatted: "No deadline",
      dueShortFormatted: "No deadline",
      colorScheme: "slate",
    };
  }

  const created = new Date(createdAtStr).getTime();
  const due = new Date(dueDateStr).getTime();

  const remainingMs = due - now;
  const isOverdue = remainingMs < 0;
  const dayMs = 24 * 60 * 60 * 1000;
  const windowMs = 7 * dayMs;
  const urgencyPercent = remainingMs <= 0 ? 100
    : Math.min(99, Math.max(8, Math.round((1 - remainingMs / windowMs) * 100)));

  let remainingText = "";
  if (isOverdue) {
    remainingText = `Overdue by ${formatDistance(due, now)}`;
  } else if (remainingMs === 0) {
    remainingText = "Due now";
  } else {
    const diffSeconds = Math.floor(remainingMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const remDays = diffDays % 30;
      remainingText = remDays > 0 ? `${months}mo ${remDays}d left` : `${months}mo left`;
    } else if (diffDays >= 1) {
      const remHours = diffHours % 24;
      remainingText = remHours > 0 ? `${diffDays}d ${remHours}h left` : `${diffDays}d left`;
    } else if (diffHours >= 1) {
      const remMins = diffMinutes % 60;
      remainingText = remMins > 0 ? `${diffHours}h ${remMins}m left` : `${diffHours}h left`;
    } else {
      remainingText = diffMinutes < 1 ? "Less than 1m left" : `${diffMinutes}m left`;
    }
  }

  const isDueSoon = !isOverdue && remainingMs <= 48 * 60 * 60 * 1000;

  let colorScheme: "emerald" | "amber" | "rose" | "slate" = "emerald";
  if (remainingMs < dayMs) {
    colorScheme = "rose";
  } else if (remainingMs <= 3 * dayMs) {
    colorScheme = "amber";
  } else if (remainingMs > windowMs) {
    colorScheme = "slate";
  } else {
    colorScheme = "emerald";
  }

  const createdDate = new Date(created);
  const dueDate = new Date(due);

  return {
    hasDeadline: true,
    urgencyPercent,
    isOverdue,
    isDueSoon,
    remainingText,
    startFormatted: isNaN(createdDate.getTime()) ? "Started" : format(createdDate, "MMM d, yyyy"),
    dueFormatted: isNaN(dueDate.getTime()) ? "Due" : format(dueDate, "MMM d, yyyy 'at' h:mm a"),
    dueShortFormatted: isNaN(dueDate.getTime()) ? "Due" : format(dueDate, "MMM d, yyyy"),
    colorScheme,
  };
}

/** Stop the clock when work is submitted/completed, so review delays do not count against staff. */
export function computeTaskDeadlineTimeline(task: TaskTrackerItem, now: number): TaskTimeline | null {
  if (task.status === "cancelled") return null;
  const submitted = task.is_delegated && ["submitted", "completed"].includes(task.status);
  const finishedAt = submitted ? task.submitted_at : task.status === "completed" ? task.completed_at : null;
  const frozenAt = finishedAt ? Date.parse(finishedAt) : NaN;
  if (["submitted", "completed"].includes(task.status) && !Number.isFinite(frozenAt)) return null;
  const deadline = submitted ? task.submission_due_date ?? task.due_date : task.due_date;
  const timeline = computeTaskTimeline(task.created_at, deadline, Number.isFinite(frozenAt) ? frozenAt : now);
  if (!timeline.hasDeadline) return null;
  if (Number.isFinite(frozenAt)) {
    const late = frozenAt > Date.parse(deadline!);
    timeline.remainingText = `${submitted ? "Submitted" : "Completed"} ${late ? "late" : "on time"}`;
    timeline.isOverdue = late;
    timeline.isDueSoon = false;
    timeline.colorScheme = late ? "rose" : "emerald";
  }
  return timeline;
}
