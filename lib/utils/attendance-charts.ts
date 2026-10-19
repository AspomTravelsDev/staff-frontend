import type { ClockInRecord } from "@/lib/api/clock-in";
import { formatLagosDateForInput, isLate } from "@/lib/utils/attendance";

export interface AttendanceChartSummary {
  from: string;
  to: string;
  days: { date: string; early: number; late: number; permitted: number }[];
  departments: {
    department: string;
    early: number;
    arrivals: number;
    rate: number;
  }[];
}

export function attendanceChartPeriod(
  from: string | undefined,
  to: string | undefined,
  today: string,
) {
  const end = to || today;
  const start = new Date(`${end}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { from: from || start.toISOString().slice(0, 10), to: end };
}

export function summarizeAttendanceCharts(
  records: ClockInRecord[],
  from: string,
  to: string,
): AttendanceChartSummary {
  const firstArrivals = new Map<string, ClockInRecord>();
  for (const record of records) {
    if (!record.user_id || !Number.isFinite(Date.parse(record.clock_in_at)))
      continue;
    const day = formatLagosDateForInput(record.clock_in_at);
    if (day < from || day > to) continue;
    const key = `${day}/${record.user_id}`;
    const previous = firstArrivals.get(key);
    if (
      !previous ||
      Date.parse(record.clock_in_at) < Date.parse(previous.clock_in_at) ||
      (record.clock_in_at === previous.clock_in_at && record.id < previous.id)
    )
      firstArrivals.set(key, record);
  }
  const days = new Map<string, AttendanceChartSummary["days"][number]>();
  for (
    let date = new Date(`${from}T00:00:00Z`);
    date <= new Date(`${to}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const key = date.toISOString().slice(0, 10);
    days.set(key, { date: key, early: 0, late: 0, permitted: 0 });
  }
  const departments = new Map<
    string,
    { department: string; early: number; arrivals: number }
  >();
  for (const record of firstArrivals.values()) {
    const day = days.get(formatLagosDateForInput(record.clock_in_at))!;
    const late = isLate(record.clock_in_at);
    day[late ? (record.is_late_permitted ? "permitted" : "late") : "early"]++;
    const department = record.user?.department?.trim() || "Unassigned";
    const row = departments.get(department) || {
      department,
      early: 0,
      arrivals: 0,
    };
    row.arrivals++;
    if (!late) row.early++;
    departments.set(department, row);
  }
  return {
    from,
    to,
    days: [...days.values()],
    departments: [...departments.values()]
      .map((row) => ({
        ...row,
        rate: Math.round((row.early / row.arrivals) * 1000) / 10,
      }))
      .sort(
        (a, b) =>
          b.rate - a.rate ||
          b.arrivals - a.arrivals ||
          a.department.localeCompare(b.department),
      ),
  };
}
