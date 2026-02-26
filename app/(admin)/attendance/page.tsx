import { getAllClockIns, getAllClockInStats } from "@/lib/api/clock-in";
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
  const [historyRes, statsRes, employeesRes] = await Promise.all([
    getAllClockIns(from, to, userId, 100).catch((e) => ({
      success: false,
      data: null,
    })),
    getAllClockInStats(from, to, userId).catch((e) => ({
      success: false,
      data: null,
    })),
    getEmployees({ limit: 500, status: "Active" }).catch((e) => ({
      items: [],
    })),
  ]);

  const history =
    historyRes.success && historyRes.data ? historyRes.data.data.data : [];
  const stats = statsRes.success && statsRes.data ? statsRes.data.data : null;
  const employees = employeesRes.items || [];

  return (
    <AttendanceClient
      history={history}
      stats={stats}
      employees={employees}
      initialFrom={from}
      initialTo={to}
      initialUserId={userId}
    />
  );
}
