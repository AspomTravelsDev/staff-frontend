import { Suspense } from "react";
import { getLeaveStats, getLeaveEntries } from "./queries";
import { StatCards } from "./components/stat-cards";
import { LeaveTable } from "./components/leave-table";
import { RequestLeaveModal } from "./components/request-leave-modal";
import { getCurrentUser } from "@/lib/auth/session";
import { markLeaveNotificationsViewed } from "@/lib/api/leave";
import { LeaveTour, LeaveTourButton } from "./components/leave-tour";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MyLeavePage() {
  const user = await getCurrentUser();
  const userId = user?.id || "user-id";
  const userName = user?.name || "John Doe";
  const department = user?.role;

  const [stats, entries] = await Promise.all([
    getLeaveStats(userId),
    getLeaveEntries(userId),
    markLeaveNotificationsViewed().catch((err) =>
      console.error("Error marking leave notifications viewed:", err)
    ),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div id="tour-leave-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Leave</h1>
          <p className="text-sm text-muted-foreground">
            Request time off, monitor available allowances, and track leave application history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeaveTourButton />
          <div id="tour-request-leave-btn">
            <RequestLeaveModal
              userName={userName}
              role={department}
            />
          </div>
        </div>
      </div>

      <div id="tour-leave-stats">
        <StatCards stats={stats} />
      </div>

      <Card id="tour-leave-history">
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>View your past and pending leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading leave history...</div>}>
            <LeaveTable entries={entries} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Auto-runner for first-time visitors */}
      <LeaveTour />
    </div>
  );
}
