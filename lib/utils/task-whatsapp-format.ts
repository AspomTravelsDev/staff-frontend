import { format } from "date-fns";
import type { TaskItem } from "@/types/task-types";

export interface FormatTasksForWhatsAppOptions {
  tasks: Array<TaskItem | { text: string; completed?: boolean }>;
  date?: string | Date | null;
  userName?: string | null;
  staffId?: string | null;
  department?: string | null;
  isSubmitted?: boolean;
  tasksOnly?: boolean;
}

/**
 * Formats a list of tasks into WhatsApp-friendly text.
 * Strictly uses no emojis and uses hyphens (-) for unordered list items.
 */
export function formatTasksForWhatsApp(options: FormatTasksForWhatsAppOptions): string {
  const {
    tasks,
    date,
    userName,
    staffId,
    department,
    isSubmitted = false,
    tasksOnly = false,
  } = options;

  const validTasks = (tasks || []).filter((t) => t.text && t.text.trim() !== "");

  if (validTasks.length === 0) {
    return "";
  }

  const completedCount = validTasks.filter((t) => t.completed).length;
  const isReport = isSubmitted || completedCount > 0;

  // Format individual task line with hyphen for unordered list
  const formatTaskLine = (task: TaskItem | { text: string; completed?: boolean }) => {
    const text = task.text.trim();
    if (isReport) {
      const statusLabel = task.completed ? "Completed" : "Ongoing";
      return `- ${text} (${statusLabel})`;
    }
    return `- ${text}`;
  };

  const taskLines = validTasks.map(formatTaskLine).join("\n");

  if (tasksOnly) {
    return taskLines;
  }

  // Parse and format date
  let formattedDate = "";
  if (date) {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (!isNaN(d.getTime())) {
        formattedDate = format(d, "EEEE, MMM dd, yyyy");
      }
    } catch {
      formattedDate = String(date);
    }
  } else {
    formattedDate = format(new Date(), "EEEE, MMM dd, yyyy");
  }

  const lines: string[] = [];

  // Header
  lines.push(isReport ? "*DAILY REPORT*" : "*DAILY TASKS*");

  // Metadata
  if (userName) {
    const staffLabel = staffId ? `${userName} (${staffId})` : userName;
    lines.push(`*Staff:* ${staffLabel}`);
  }

  if (department) {
    lines.push(`*Department:* ${department}`);
  }

  if (formattedDate) {
    lines.push(`*Date:* ${formattedDate}`);
  }

  if (isReport) {
    const rate = Math.round((completedCount / validTasks.length) * 100);
    lines.push(`*Progress:* ${completedCount}/${validTasks.length} completed (${rate}%)`);
    lines.push(`*Status:* ${isSubmitted ? "Submitted" : "In Progress"}`);
  }

  lines.push("");
  lines.push("*Tasks:*");
  lines.push(taskLines);

  return lines.join("\n");
}

/**
 * Robust copy-to-clipboard function with fallback for non-secure contexts or older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard failed, attempting fallback:", err);
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("execCommand fallback failed:", err);
    return false;
  }
}
