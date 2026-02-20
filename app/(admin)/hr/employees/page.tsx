import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { EmployeeListContent } from "./components/employee-list-content";
import { getAllEmployees, getStats } from "./queries";

export default async function EmployeeListPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [employees, stats] = await Promise.all([getAllEmployees(), getStats()]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee List</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organizations staff directory
          </p>
        </div>
      </div>

      <EmployeeListContent employees={employees} stats={stats} />
    </div>
  );
}
