import { Suspense } from "react";
import { getLeaveStats, getLeaveEntries } from "./queries";
import { StatCards } from "./components/stat-cards";
import { LeaveTable } from "./components/leave-table";
import { RequestLeaveModal } from "./components/request-leave-modal";
import { getCurrentUser } from "@/lib/auth/session"; // adjust if user context is elsewhere

export default async function MyLeavePage() {
  // Get user info from context/provider (adjust as needed)
  const user = await getCurrentUser();
  const userId = user?.id || "user-id";
  const userName = user?.name || "John Doe";
  const department = user?.role;

  // Fetch leave stats and entries (mock for now)
  const [stats, entries] = await Promise.all([
    getLeaveStats(userId),
    getLeaveEntries(userId),
  ]);

  return (
    <main className="py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Leave</h1>
      <StatCards stats={stats} />
      <RequestLeaveModal
        userName={userName}
        role={department}
      />
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Leave History</h2>
        <Suspense fallback={<div>Loading leave history...</div>}>
          <LeaveTable entries={entries} />
        </Suspense>
      </div>
    </main>
  );
}
