import { Suspense } from "react";
import { getLeaveStats, getLeaveEntries } from "./queries";
import { StatCards } from "./components/stat-cards";
import { LeaveTable } from "./components/leave-table";
import { RequestLeaveModal } from "./components/request-leave-modal";
import { getCurrentUser } from "@/lib/auth/session";
import { markLeaveNotificationsViewed } from "@/lib/api/leave";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Leave</h1>
          <p className="text-sm text-muted-foreground">
            Request time off and track your leave request history
          </p>
        </div>
        <RequestLeaveModal
          userName={userName}
          role={department}
        />
      </div>

      <StatCards stats={stats} />

      <Card>
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
    </div>
  );
}
