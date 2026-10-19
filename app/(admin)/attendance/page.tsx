import {
  attendanceChartPeriod,
  summarizeAttendanceCharts,
} from "@/lib/utils/attendance-charts";
import { formatLagosDateForInput } from "@/lib/utils/attendance";
import {
  getAllClockInsForFilters,
  getAllClockInStats,
} from "@/lib/api/clock-in";
import { getEmployees } from "@/lib/api/employees";
import { AttendanceClient } from "./components/attendance-client";

export default async function GlobalAttendancePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const requestedFrom =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const requestedTo =
    typeof searchParams.to === "string" ? searchParams.to : undefined;
  const userId =
    typeof searchParams.user_id === "string" ? searchParams.user_id : "all";
  const lateClockOutsOnly = searchParams.clock_out === "late";
  const page =
    typeof searchParams.page === "string"
      ? Math.max(1, Number.parseInt(searchParams.page, 10) || 1)
      : 1;
  const pageSize =
    typeof searchParams.page_size === "string"
      ? Math.max(1, Number.parseInt(searchParams.page_size, 10) || 100)
      : 100;
  const period = attendanceChartPeriod(
    requestedFrom,
    requestedTo,
    formatLagosDateForInput(new Date()),
  );
  const { from, to } = period;
  const historyPromise = getAllClockInsForFilters(
    from,
    to,
    userId,
    100,
    lateClockOutsOnly,
  ).catch(() => null);
  const [historyRes, statsRes, employeesRes] = await Promise.all([
    historyPromise,
    getAllClockInStats(from, to, userId, lateClockOutsOnly).catch(() => ({
      success: false,
      data: null,
    })),
    getEmployees({ limit: 500, status: "Active" }).catch(() => ({
      items: [],
    })),
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data.data : null;
  const employees = employeesRes.items || [];

  return (
    <AttendanceClient
      key={JSON.stringify([from, to, userId, lateClockOutsOnly])}
      history={historyRes || []}
      historyFailed={historyRes === null}
      charts={
        historyRes
          ? summarizeAttendanceCharts(historyRes, period.from, period.to)
          : null
      }
      stats={stats}
      employees={employees}
      initialFrom={from}
      initialTo={to}
      initialUserId={userId}
      initialLateClockOutsOnly={lateClockOutsOnly}
      initialPage={page}
      initialPageSize={pageSize}
    />
  );
}
