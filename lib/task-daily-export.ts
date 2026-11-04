import type { ExportColumn } from "./utils/export";

import { approvedLeavePayStatus, type ExportLeave, type ExportEmployee } from "./export-confirmation";

type DailyStatus = "TODO" | "REPORT" | "NOT SENT" | "ABSENT" | "LEAVE";
type SheetRow = Record<string, string | number>;
type Employee = ExportEmployee;
interface TaskRecord { user_id: string; date: string; first_saved_at: string | null; report_submitted_at: string | null }
interface Attendance { user_id: string; clock_in_at: string }
type Leave = ExportLeave;

function lagosDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function buildTaskDailySheet({ employees, records = [], attendance = [], leaves = [], startDate, endDate }: {
  employees: Employee[]; records?: TaskRecord[]; attendance?: Attendance[]; leaves?: Leave[]; startDate: string; endDate: string;
}) {
  const recordMap = new Map(records.map(record => [`${record.date}_${record.user_id}`, record]));
  const present = new Set(attendance.map(record => `${lagosDate(record.clock_in_at)}_${record.user_id}`));
  const totals = new Map(employees.map(employee => [employee.id, { todoSent: 0, reportSent: 0, todoMissed: 0, reportMissed: 0, absent: 0, leave: 0, paidLeave: 0, unpaidLeave: 0 }]));
  const rows: SheetRow[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end) {
    const weekday = current.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const keyDate = current.toISOString().slice(0, 10);
      const [year, month, day] = keyDate.split("-");
      const row: SheetRow = { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday], date: `${day}/${month}/${year.slice(-2)}` };
      for (const employee of employees) {
        const key = `${keyDate}_${employee.id}`;
        const record = recordMap.get(key);
        // endDate is the resumption date, so it is not a leave day.
        const leavePay = approvedLeavePayStatus(employee, leaves, keyDate);
        const onLeave = leavePay !== null;
        const todo: DailyStatus = onLeave ? "LEAVE" : record?.first_saved_at ? "TODO" : present.has(key) ? "NOT SENT" : "ABSENT";
        const report: DailyStatus = onLeave ? "LEAVE" : record?.report_submitted_at ? "REPORT" : present.has(key) ? "NOT SENT" : "ABSENT";
        row[`${employee.id}_todo`] = leavePay ? leavePay.toUpperCase() : todo;
        row[`${employee.id}_report`] = leavePay ? leavePay.toUpperCase() : report;
        const count = totals.get(employee.id)!;
        if (todo === "TODO") count.todoSent++;
        if (report === "REPORT") count.reportSent++;
        if (todo === "NOT SENT") count.todoMissed++;
        if (report === "NOT SENT") count.reportMissed++;
        if (todo === "ABSENT" || report === "ABSENT") count.absent++;
        if (onLeave) count.leave++;
        if (leavePay === "Paid leave") count.paidLeave++;
        if (leavePay === "Unpaid leave") count.unpaidLeave++;
      }
      rows.push(row);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const dailyRowCount = rows.length;
  if (dailyRowCount) {
    rows.push({ day: "", date: "" });
    const heading: SheetRow = { day: "TOTALS", date: "" };
    for (const employee of employees) heading[`${employee.id}_todo`] = employee.name;
    rows.push(heading);
    const metrics = [
      ["Total Todo sent", "todoSent"], ["Total report sent", "reportSent"],
      ["Total Todo missed", "todoMissed"], ["Total report missed", "reportMissed"],
      ["Total days absent", "absent"], ["Total leave", "leave"],
      ["Total paid leave", "paidLeave"], ["Total unpaid leave", "unpaidLeave"],
    ] as const;
    for (const [label, metric] of metrics) {
      const row: SheetRow = { day: label, date: "" };
      for (const employee of employees) row[`${employee.id}_todo`] = totals.get(employee.id)![metric];
      rows.push(row);
    }
  }
  const columns: ExportColumn<SheetRow>[] = [
    { header: "Day", key: "day" }, { header: "Date", key: "date" },
    ...employees.flatMap(employee => [
      { header: `${employee.name} (Todo)`, key: (row: SheetRow) => row[`${employee.id}_todo`] ?? "" },
      { header: `${employee.name} (Report)`, key: (row: SheetRow) => row[`${employee.id}_report`] ?? "" },
    ]),
  ];
  return { rows, columns, dailyRowCount };
}
