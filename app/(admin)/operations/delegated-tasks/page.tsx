import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { getCompanyDelegatedTasks } from "@/lib/api/task-tracker";
import { DelegatedTasksClient } from "./components/delegated-tasks-client";

export const metadata = {
  title: "Company Delegated Deliverables | Aspom Portal",
  description: "Company-wide oversight of delegated tasks, deadlines, and deliverables.",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    department?: string;
    search?: string;
  }>;
}

export default async function DelegatedTasksPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!userHasAnyRole(user, ["office-operations", "super", "mp", "md"])) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const response = await getCompanyDelegatedTasks().catch(() => ({
    success: false as const,
    error: { code: "500", error: "Failed to load delegated deliverables" },
  }));

  const initialTasks = response.success ? response.data.data : [];
  const initialStats = response.success
    ? response.data.stats
    : {
        total: 0,
        pending: 0,
        due_soon: 0,
        overdue: 0,
        pending_extensions: 0,
        completed: 0,
      };

  return (
    <DelegatedTasksClient
      initialTasks={initialTasks}
      initialStats={initialStats}
      initialFilters={{
        status: params?.status || "all",
        priority: params?.priority || "all",
        department: params?.department || "all",
        search: params?.search || "",
      }}
    />
  );
}
