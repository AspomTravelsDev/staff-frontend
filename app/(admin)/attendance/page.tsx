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
import { getApprovedLeaveForExport } from "@/lib/api/leave";
import { getWorkFromHomeRequests, type WorkFromHomeRequest } from "@/lib/api/work-from-home";

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
  const [historyRes, statsRes, employeesRes, leaveRes, wfhRes] = await Promise.all([
    historyPromise,
    getAllClockInStats(from, to, userId, lateClockOutsOnly).catch(() => ({
      success: false,
      data: null,
    })),
    getEmployees({ limit: 500, status: "Active" }).catch(() => ({
      items: [],
    })),
    getApprovedLeaveForExport(from, to, userId).catch(() => null),
    getWorkFromHomeRequests({ status: "approved", from, to, per_page: 100 }).catch(() => ({ success: false, data: null })),
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data.data : null;
  const employees = employeesRes.items || [];
  const approvedLeaves = leaveRes ?? [];
  const wfhPayload = wfhRes.success ? wfhRes.data?.data : null;
  const approvedWorkFromHome: WorkFromHomeRequest[] = Array.isArray(wfhPayload) ? wfhPayload : (wfhPayload?.data || []);

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
      approvedLeaves={approvedLeaves}
      leaveFailed={leaveRes === null}
      approvedWorkFromHome={approvedWorkFromHome}
      initialFrom={from}
      initialTo={to}
      initialUserId={userId}
      initialLateClockOutsOnly={lateClockOutsOnly}
      initialPage={page}
      initialPageSize={pageSize}
    />
  );
}
