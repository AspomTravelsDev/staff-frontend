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

  const from =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const to = typeof searchParams.to === "string" ? searchParams.to : undefined;
  const userId =
    typeof searchParams.user_id === "string" ? searchParams.user_id : "all";
  const page =
    typeof searchParams.page === "string"
      ? Math.max(1, Number.parseInt(searchParams.page, 10) || 1)
      : 1;
  const pageSize =
    typeof searchParams.page_size === "string"
      ? Math.max(1, Number.parseInt(searchParams.page_size, 10) || 100)
      : 100;
  const [historyRes, statsRes, employeesRes] = await Promise.all([
    getAllClockInsForFilters(from, to, userId).catch(() => []),
    getAllClockInStats(from, to, userId).catch((e) => ({
      success: false,
      data: null,
    })),
    getEmployees({ limit: 500, status: "Active" }).catch((e) => ({
      items: [],
    })),
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data.data : null;
  const employees = employeesRes.items || [];

  return (
    <AttendanceClient
      history={historyRes}
      stats={stats}
      employees={employees}
      initialFrom={from}
      initialTo={to}
      initialUserId={userId}
      initialPage={page}
      initialPageSize={pageSize}
    />
  );
}
