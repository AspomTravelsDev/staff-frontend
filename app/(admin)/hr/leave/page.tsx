import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLeaveRequests, getLeaveStats } from "@/lib/api/leave";
import { LeaveStatsCards } from "./components/leave-stats";
import { LeaveTable } from "./components/leave-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function LeaveManagementPage() {
  const user = await getCurrentUser();

  // Access Control: HR only
  if (!user) {
    redirect("/login");
  }

  // Fetch data
  const [requestsData, stats] = await Promise.all([
    getLeaveRequests({ limit: 100 }),
    getLeaveStats(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage employee leave requests
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      <LeaveStatsCards stats={stats} />

      <LeaveTable requests={requestsData.items} />
    </div>
  );
}
