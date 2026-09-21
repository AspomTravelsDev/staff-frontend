import { format, formatDistanceToNow } from "date-fns";

export interface TaskTimeline {
  hasDeadline: boolean;
  percent: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  remainingText: string;
  startFormatted: string;
  dueFormatted: string;
  dueShortFormatted: string;
  colorScheme: "emerald" | "amber" | "rose" | "slate";
}

/**
 * Calculates time elapsed vs remaining time as a progress percentage
 * with human-readable labels and color scheme.
 */
export function computeTaskTimeline(
  createdAtStr: string,
  dueDateStr: string | null
): TaskTimeline {
  if (!dueDateStr) {
    const createdDate = new Date(createdAtStr);
    return {
      hasDeadline: false,
      percent: 0,
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
  const now = Date.now();

  const isOverdue = now >= due;
  const remainingMs = due - now;
  const totalMs = Math.max(1000 * 60, due - created); // at least 1 minute

  let percent = 0;
  if (isOverdue) {
    percent = 100;
  } else {
    const elapsed = Math.max(0, now - created);
    // Give at least 3% width so the start indicator is nicely visible, capped at 99% until reached
    percent = Math.min(99, Math.max(3, Math.round((elapsed / totalMs) * 100)));
  }

  let remainingText = "";
  if (isOverdue) {
    remainingText = `Overdue by ${formatDistanceToNow(due)}`;
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
      remainingText = `${Math.max(1, diffMinutes)}m left`;
    }
  }

  const isDueSoon = !isOverdue && remainingMs <= 48 * 60 * 60 * 1000;

  let colorScheme: "emerald" | "amber" | "rose" | "slate" = "emerald";
  if (isOverdue) {
    colorScheme = "rose";
  } else if (isDueSoon || percent >= 80) {
    colorScheme = "rose";
  } else if (percent >= 50) {
    colorScheme = "amber";
  } else {
    colorScheme = "emerald";
  }

  const createdDate = new Date(created);
  const dueDate = new Date(due);

  return {
    hasDeadline: true,
    percent,
    isOverdue,
    isDueSoon,
    remainingText,
    startFormatted: isNaN(createdDate.getTime()) ? "Started" : format(createdDate, "MMM d, yyyy"),
    dueFormatted: isNaN(dueDate.getTime()) ? "Due" : format(dueDate, "MMM d, yyyy 'at' h:mm a"),
    dueShortFormatted: isNaN(dueDate.getTime()) ? "Due" : format(dueDate, "MMM d, yyyy"),
    colorScheme,
  };
}
