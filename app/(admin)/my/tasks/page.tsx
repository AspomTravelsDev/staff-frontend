import { TaskList } from "./components/task-list";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getTodaysTasks } from "./queries";

export const metadata = {
  title: "My Daily Tasks | Aspom Portal",
  description: "Manage your daily tasks and submit end-of-day reports.",
};

export default async function MyTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initialTasks = await getTodaysTasks();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Daily Tasks</h1>
      </div>

      <TaskList initialData={initialTasks} />
    </div>
  );
}
