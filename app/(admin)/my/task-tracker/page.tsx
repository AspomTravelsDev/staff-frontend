import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getTaskTrackerItems } from "@/lib/api/task-tracker";
import { TaskTrackerClient } from "./components/task-tracker-client";
import { DataLoadError } from "@/components/data-load-error";

export const metadata = {
  title: "Task Tracker & Deadlines | Aspom Portal",
  description: "Track personal tasks with deadlines and automated reminders.",
};

export default async function TaskTrackerPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const initialView = params.view === "assigned_by_me" ? "assigned_by_me" : "assigned_to_me";
  const loadView = (view: "assigned_to_me" | "assigned_by_me") => getTaskTrackerItems({ view }).catch(() => ({
    success: false as const,
    error: { code: "500", error: "Failed to load tasks" },
  }));
  const [myTasks, assignedTasks] = await Promise.all([
    loadView("assigned_to_me"),
    loadView("assigned_by_me"),
  ]);
  const response = initialView === "assigned_by_me" ? assignedTasks : myTasks;
  if (!response.success) {
    return <DataLoadError title="Unable to load tasks" message="Your tasks are temporarily unavailable. Please try again." />;
  }
  const attentionCounts = {
    assigned_to_me: myTasks.success ? myTasks.data.stats.attention : undefined,
    assigned_by_me: assignedTasks.success ? assignedTasks.data.stats.attention : undefined,
  };

  const initialTasks = response.data.data;
  const initialStats = response.data.stats;

  return (
    <TaskTrackerClient
      key={initialView}
      initialView={initialView}
      initialTasks={initialTasks}
      initialStats={initialStats}
      attentionCounts={attentionCounts}
    />
  );
}
