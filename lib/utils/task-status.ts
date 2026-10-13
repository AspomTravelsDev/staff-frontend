import type { TaskTrackerItem, TaskStatus } from "@/lib/types/task-tracker";

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pending", in_progress: "In progress", submitted: "Awaiting approval",
  changes_requested: "Changes requested", completed: "Completed", cancelled: "Cancelled",
};

export function getTaskStatusLabel(task: Pick<TaskTrackerItem, "status" | "custom_status">): string {
  return task.status === "in_progress" && task.custom_status ? task.custom_status : taskStatusLabels[task.status];
}
