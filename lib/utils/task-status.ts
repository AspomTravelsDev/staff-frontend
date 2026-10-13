import type { TaskTrackerItem, TaskStatus } from "@/lib/types/task-tracker";

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pending", in_progress: "In progress", submitted: "Awaiting approval",
  changes_requested: "Changes requested", completed: "Completed", cancelled: "Cancelled",
};

export function getTaskStatusLabel(task: Pick<TaskTrackerItem, "status" | "custom_status">): string {
  return task.status === "in_progress" && task.custom_status ? task.custom_status : taskStatusLabels[task.status];
}

export function getTaskStatusTone(task: Pick<TaskTrackerItem, "status" | "custom_status">) {
  if (task.status === "in_progress" && task.custom_status?.trim()) {
    const label = task.custom_status.trim().toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ");
    if (["blocked", "waiting on input", "on hold"].includes(label)) return "blocked";
    if (label === "waiting review") return "waiting";
    return "custom";
  }
  return task.status;
}
