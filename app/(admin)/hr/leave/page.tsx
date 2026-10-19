import { renderDataPage } from "@/lib/api/render-data-page";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLeaveManagementRequests, getLeaveStats } from "@/lib/api/leave";
import { LeaveStatsCards } from "./components/leave-stats";
import { LeaveTable } from "./components/leave-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LeaveManagementPage() {
  const user = await getCurrentUser();

  // Access Control: HR only
  if (!user) {
    redirect("/login");
  }

  return renderDataPage(async () => {
    const [requestsData, stats] = await Promise.all([
      getLeaveManagementRequests(),
      getLeaveStats(),
    ]);

    return (
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Leave Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Review and manage employee leave requests
            </p>
          </div>
        </div>

        <LeaveStatsCards stats={stats} />

        <Card className="gap-3 py-4 shadow-none min-w-0">
          <CardHeader className="px-4">
            <CardTitle>Employee Leave Requests</CardTitle>
            <CardDescription>
              Review pending applications, approve time off, or reject requests
              with comments.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <LeaveTable requests={requestsData} />
          </CardContent>
        </Card>
      </div>
    );
  }, "Unable to load leave management");
}
