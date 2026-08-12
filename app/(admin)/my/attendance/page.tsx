import { getClockInHistory, getClockInSummary } from "@/lib/api/clock-in";
import { StatsCard } from "@/components/stats-card";
import { Clock, CalendarCheck, AlertTriangle, History } from "lucide-react";
import { AttendanceTable } from "./components/attendance-table";
import { isLate } from "@/lib/utils/attendance";

import { LatePermissionRequestModal } from "@/components/late-permission-request-modal";

export default async function MyAttendancePage() {
  const [summaryResponse, historyResponse] = await Promise.all([
    getClockInSummary(),
    getClockInHistory(),
  ]);

  let summary = null;
  let history: any[] = []; // Explicitly typing as any[] temporarily to fix build, or properly import generic type
  let totalClockIns = "0";
  let averageDuration = 0;

  if (summaryResponse.success) {
    summary = summaryResponse.data.data;
    totalClockIns = summary.total_clock_ins.toString();
    averageDuration = summary.average_duration_minutes;
  }

  if (historyResponse.success) {
    history = historyResponse.data.data;
  }

  const unexcusedLateDays = history.filter(
    (record: any) => isLate(record.clock_in_at) && !record.is_late_permitted,
  ).length;

  const permittedLateDays = history.filter(
    (record: any) => isLate(record.clock_in_at) && record.is_late_permitted,
  ).length;

  const onTimeDays = history.filter(
    (record: any) => !isLate(record.clock_in_at),
  ).length;

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-sm text-muted-foreground">
            View your attendance stats and history
          </p>
        </div>
        <LatePermissionRequestModal />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Clock-Ins"
          icon={Clock}
          value={totalClockIns}
          description="Lifetime check-ins"
          variant="dashboard"
          cardColor="blue"
        />
        <StatsCard
          title="On Time"
          icon={CalendarCheck}
          value={onTimeDays.toString()}
          description="Arrivals before 9:05 AM"
          variant="dashboard"
          cardColor="green"
        />
        <StatsCard
          title="Late (Permitted)"
          icon={CalendarCheck}
          value={permittedLateDays.toString()}
          description="Approved late requests"
          variant="dashboard"
          cardColor="purple"
        />
        <StatsCard
          title="Late (Unexcused)"
          icon={AlertTriangle}
          value={unexcusedLateDays.toString()}
          description="Arrivals without approval"
          variant="dashboard"
          cardColor="red"
        />
        <StatsCard
          title="Avg. Duration"
          icon={History}
          value={
            averageDuration
              ? `${Math.floor(averageDuration / 60)}h ${Math.round(
                  averageDuration % 60,
                )}m`
              : "0h 0m"
          }
          description="Per work day"
          variant="dashboard"
          cardColor="purple"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Attendance History</h2>

        <AttendanceTable history={history} />
      </div>
    </div>
  );
}
