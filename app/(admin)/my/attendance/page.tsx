import { getClockInHistory, getClockInSummary } from "@/lib/api/clock-in";
import { StatsCard } from "@/components/stats-card";
import { Clock, CalendarCheck, AlertTriangle, History } from "lucide-react";
import { AttendanceTable } from "./components/attendance-table";

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

  // Calculate late days locally as well for now, or trust summary if it had it (it doesn't)
  const lateDays = history.filter((record: any) => {
    const date = new Date(record.clock_in_at);
    // Use UTCHours assuming the backend sends the correct time in UTC (or "local as UTC")
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();

    // Late if after 9:05 AM
    if (hour > 9) return true;
    if (hour === 9 && minute > 5) return true;
    return false;
  }).length;

  const onTimeDays = history.length - lateDays;

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          View your attendance stats and history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
          title="Late Arrivals"
          icon={AlertTriangle}
          value={lateDays.toString()}
          description="Arrivals after 9:05 AM"
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
