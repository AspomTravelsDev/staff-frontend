import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getEmployees, getEmployeeStats } from "@/lib/api/employees";
import { EmployeeStatsCards } from "./components/employee-stats";
import { EmployeeTable } from "./components/employee-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function EmployeeListPage() {
  const user = await getCurrentUser();

  // Basic access control
  if (!user) {
    redirect("/login");
  }

  // Fetch data in parallel
  const [employeesData, stats] = await Promise.all([
    getEmployees({ limit: 100 }), // Get all for now, pagination later if huge
    getEmployeeStats(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee List</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organizations staff directory
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <EmployeeStatsCards stats={stats} />

      <EmployeeTable employees={employeesData.items} />
    </div>
  );
}
