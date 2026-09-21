import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getTaskTrackerItems } from "@/lib/api/task-tracker";
import { TaskTrackerClient } from "./components/task-tracker-client";

export const metadata = {
  title: "Task Tracker & Deadlines | Aspom Portal",
  description: "Track personal tasks with deadlines and automated reminders.",
};

export default async function TaskTrackerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const response = await getTaskTrackerItems().catch(() => ({
    success: false as const,
    error: { code: "500", error: "Failed to load tasks" },
  }));

  const initialTasks = response.success ? response.data.data : [];
  const initialStats = response.success
    ? response.data.stats
    : { total: 0, pending: 0, due_soon: 0, overdue: 0, completed: 0 };

  return (
    <TaskTrackerClient
      initialTasks={initialTasks}
      initialStats={initialStats}
    />
  );
}
