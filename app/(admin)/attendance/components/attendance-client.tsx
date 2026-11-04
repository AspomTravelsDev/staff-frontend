"use client";

import { approvedLeavePayStatus, type ExportEmployee } from "@/lib/export-confirmation";
import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClockInRecord, ClockInSummary } from "@/lib/api/clock-in";
import { Employee } from "@/lib/api/employees";
import { AttendanceCharts } from "./attendance-charts";
import type { ExportLeave } from "@/lib/export-confirmation";
import type { WorkFromHomeRequest } from "@/lib/api/work-from-home";
import type { AttendanceChartSummary } from "@/lib/utils/attendance-charts";
import { AttendanceStats } from "./attendance-stats";
import { AttendanceStatusBlocks, type AttendanceStatus } from "@/components/dashboard/attendance-status-blocks";
import { AdminAttendanceTable } from "./admin-attendance-table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { TableExportButton } from "@/components/ui/table-export-button";
import { WallQrPosterDialog } from "@/components/attendance/wall-qr-poster-dialog";
import { ClockInModeToggle } from "@/components/attendance/clock-in-mode-toggle";
import { Button } from "@/components/ui/button";
import { Settings2, QrCode } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import type { ExportColumn } from "@/lib/utils/export";
import {
  isLate,
  formatLagosDate,
  formatLagosTime,
  formatLagosDateForInput,
} from "@/lib/utils/attendance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceClientProps {
  history: ClockInRecord[];
  charts: AttendanceChartSummary | null;
  historyFailed?: boolean;
  leaveFailed?: boolean;
  stats: ClockInSummary | null;
  employees: Employee[];
  approvedLeaves: ExportLeave[];
  approvedWorkFromHome: WorkFromHomeRequest[];
  initialFrom?: string;
  initialTo?: string;
  initialUserId?: string;
  initialLateClockOutsOnly?: boolean;
  initialPage?: number;
  initialPageSize?: number;
}

export function AttendanceClient({
  history: allHistory,
  charts,
  historyFailed = false,
  leaveFailed = false,
  stats,
  employees,
  approvedLeaves,
  approvedWorkFromHome,
  initialFrom,
  initialTo,
  initialUserId,
  initialLateClockOutsOnly = false,
  initialPage = 1,
  initialPageSize = 100,
}: AttendanceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [tableDepartment, setTableDepartment] = useState<string | null>(null);
  const history =
    tableDepartment === null
      ? allHistory
      : allHistory.filter(
          (record) =>
            (record.user?.department?.trim() || "Unassigned") ===
            tableDepartment,
        );
  const selectDepartment = (department: string | null) => {
    setTableDepartment(department);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    startTransition(() =>
      router.replace(`${pathname}?${params.toString()}`, { scroll: false }),
    );
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialFrom) {
      return {
        from: parseISO(initialFrom),
        to: initialTo ? parseISO(initialTo) : undefined,
      };
    }
    return undefined;
  });

  const [selectedStaff, setSelectedStaff] = useState<string>(
    initialUserId || "all",
  );
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [clockOutFilter, setClockOutFilter] = useState(
    initialLateClockOutsOnly ? "late" : "all",
  );

  useEffect(() => {
    if (
      (dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined) ===
        initialFrom &&
      (dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined) ===
        initialTo &&
      selectedStaff === (initialUserId || "all") &&
      pageSize === initialPageSize &&
      clockOutFilter === (initialLateClockOutsOnly ? "late" : "all")
    )
      return;
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (dateRange?.from) {
      const fromStr = format(dateRange.from, "yyyy-MM-dd");
      if (params.get("from") !== fromStr) {
        params.set("from", fromStr);
        hasChanges = true;
      }
    } else {
      if (params.has("from")) {
        params.delete("from");
        hasChanges = true;
      }
    }

    if (dateRange?.to) {
      const toStr = format(dateRange.to, "yyyy-MM-dd");
      if (params.get("to") !== toStr) {
        params.set("to", toStr);
        hasChanges = true;
      }
    } else {
      if (params.has("to")) {
        params.delete("to");
        hasChanges = true;
      }
    }

    if (selectedStaff && selectedStaff !== "all") {
      if (params.get("user_id") !== selectedStaff) {
        params.set("user_id", selectedStaff);
        hasChanges = true;
      }
    } else {
      if (params.has("user_id")) {
        params.delete("user_id");
        hasChanges = true;
      }
    }

    const pageSizeValue = pageSize.toString();
    if (clockOutFilter === "late") {
      if (params.get("clock_out") !== "late") {
        params.set("clock_out", "late");
        hasChanges = true;
      }
    } else if (params.has("clock_out")) {
      params.delete("clock_out");
      hasChanges = true;
    }
    if (params.get("page_size") !== pageSizeValue) {
      params.set("page_size", pageSizeValue);
      hasChanges = true;
    }

    if (hasChanges) {
      params.set("page", "1");
    }

    if (hasChanges) {
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }
  }, [
    dateRange,
    selectedStaff,
    pageSize,
    clockOutFilter,
    searchParams,
    pathname,
    router,
    startTransition,
    initialFrom,
    initialTo,
    initialUserId,
    initialPageSize,
    initialLateClockOutsOnly,
  ]);

  // Create a map of date_userId to track status (using earliest clock-in time)
  const attendanceMap = new Map<
    string,
    {
      clockInTime: number;
      status: "Early" | "Late" | "Late (Permitted)";
      lateClockOutAt?: string;
      isHalfDay: boolean;
    }
  >();
  history.forEach((record) => {
    const dateStr = formatLagosDateForInput(record.clock_in_at);
    if (!dateStr) return;
    const userId = record.user_id;
    const key = `${dateStr}_${userId}`;
    const clockInTime = new Date(record.clock_in_at).getTime();

    let status: "Early" | "Late" | "Late (Permitted)" = isLate(
      record.clock_in_at,
    )
      ? "Late"
      : "Early";
    if (status === "Late" && record.is_late_permitted) {
      status = "Late (Permitted)";
    }

    const existing = attendanceMap.get(key);
    const lateClockOutAt =
      record.is_late_clock_out && record.clock_out_at
        ? record.clock_out_at
        : existing?.lateClockOutAt;
    if (!existing || clockInTime < existing.clockInTime) {
      attendanceMap.set(key, { clockInTime, status, lateClockOutAt, isHalfDay: Boolean(record.is_half_day) });
    } else if (lateClockOutAt) {
        existing.lateClockOutAt = lateClockOutAt;
        existing.isHalfDay = existing.isHalfDay || Boolean(record.is_half_day);
    }
  });

  // Identify all unique staff members
  const employeeMap = new Map<string, ExportEmployee>();

  // Add active employees
  employees
    .filter(
      (emp) =>
        tableDepartment === null ||
        (emp.department?.trim() || "Unassigned") === tableDepartment,
    )
    .forEach((emp) => {
      employeeMap.set(emp.id, {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        joinDate: emp.joinDate,
        contract_type: emp.contract_type,
      });
    });

  // Add any employees from history who might not be active employees
  history.forEach((record) => {
    if (record.user_id && !employeeMap.has(record.user_id)) {
      employeeMap.set(record.user_id, {
        id: record.user_id,
        name:
          `${record.user?.first_name || ""} ${record.user?.last_name || ""}`.trim() ||
          `User ${record.user_id}`,
      });
    }
  });

  const staffOptions = Array.from(employeeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  let exportEmployees = Array.from(employeeMap.values());

  // Filter by selected staff if not "all"
  if (selectedStaff && selectedStaff !== "all") {
    exportEmployees = exportEmployees.filter((emp) => emp.id === selectedStaff);
  }

  // Determine start and end date for rows
  let startStr = "";
  let endStr = "";
  if (dateRange?.from) {
    startStr = formatLagosDateForInput(dateRange.from);
  }
  if (dateRange?.to) {
    endStr = formatLagosDateForInput(dateRange.to);
  }

  if (!startStr || !endStr) {
    const times = history
      .map((h) => new Date(h.clock_in_at).getTime())
      .filter((t) => !isNaN(t));
    if (times.length > 0) {
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      if (!startStr) startStr = formatLagosDateForInput(new Date(minTime));
      if (!endStr) endStr = formatLagosDateForInput(new Date(maxTime));
    } else {
      const todayStr = formatLagosDateForInput(new Date());
      if (!startStr) startStr = todayStr;
      if (!endStr) endStr = todayStr;
    }
  }

  // Generate rows for each day in range
  const pivotedRows: Record<string, string>[] = [];
  const attendanceDayStatuses: AttendanceStatus[] = [];
  const extraTotals = new Map<string, { halfDays: number; lateClockOuts: number }>();
  if (startStr && endStr) {
    const [sYear, sMonth, sDay] = startStr.split("-").map(Number);
    const [eYear, eMonth, eDay] = endStr.split("-").map(Number);

    const startDateObj = new Date(sYear, sMonth - 1, sDay);
    const endDateObj = new Date(eYear, eMonth - 1, eDay);

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const curr = new Date(startDateObj);
    while (curr <= endDateObj) {
      // The attendance grid represents scheduled working days only.
      if (curr.getDay() === 0 || curr.getDay() === 6) {
        curr.setDate(curr.getDate() + 1);
        continue;
      }
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const dStr = String(curr.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${dStr}`;

      const shortYear = String(y).slice(-2);
      const formattedDate = `${dStr}/${m}/${shortYear}`;
      const dayName = daysOfWeek[curr.getDay()];

      const row: Record<string, string> = {
        day: dayName,
        date: formattedDate,
      };

      exportEmployees.forEach((emp) => {
        const key = `${dateKey}_${emp.id}`;
        const record = attendanceMap.get(key);
        const leavePay = approvedLeavePayStatus(emp, approvedLeaves, dateKey);
        const onApprovedLeave = leavePay !== null;
        const onApprovedWfh = approvedWorkFromHome.some((request) => request.user_id === emp.id && request.start_date <= dateKey && dateKey <= request.end_date);
        const status = onApprovedLeave
          ? leavePay === "Paid leave" ? "Paid Leave" : "Unpaid Leave"
          : onApprovedWfh
            ? "Work From Home"
            : record?.status ?? "Absent";
        row[emp.id] = status;
        const totals = extraTotals.get(emp.id) ?? { halfDays: 0, lateClockOuts: 0 };
        if (record?.isHalfDay && !onApprovedLeave && !onApprovedWfh) totals.halfDays++;
        if (record?.lateClockOutAt) totals.lateClockOuts++;
        extraTotals.set(emp.id, totals);
      });

      if (exportEmployees.length === 1) {
        const employeeId = exportEmployees[0].id;
        const record = attendanceMap.get(`${dateKey}_${employeeId}`);
        const onApprovedLeave = approvedLeaves.some((leave) => leave.employeeId === employeeId && leave.startDate <= dateKey && dateKey < leave.endDate);
        const onApprovedWfh = approvedWorkFromHome.some((request) => request.user_id === employeeId && request.start_date <= dateKey && dateKey <= request.end_date);
        attendanceDayStatuses.push(onApprovedLeave ? "leave" : onApprovedWfh ? "work-from-home" : record?.isHalfDay ? "half-day" : record?.status === "Early" ? "on-time" : record?.status === "Late" ? "late" : record?.status === "Late (Permitted)" ? "late-permitted" : "absent");
      }

      pivotedRows.push(row);
      curr.setDate(curr.getDate() + 1);
    }
  }

  const attendanceTotalStatuses = [
    "Early", "Absent", "Late", "Late (Permitted)", "Paid Leave", "Unpaid Leave", "Work From Home",
    "Leave", "Half Day", "Late Clock Out",
  ];
  if (pivotedRows.length > 0) {
    const statusTotals = new Map<string, Record<string, number>>();
    for (const status of attendanceTotalStatuses) statusTotals.set(status, {});
    for (const emp of exportEmployees) {
      for (const row of pivotedRows) {
        const status = row[emp.id];
        const counts = statusTotals.get(status);
        if (counts) counts[emp.id] = (counts[emp.id] || 0) + 1;
        if (status === "Paid Leave" || status === "Unpaid Leave") {
          const leaveCounts = statusTotals.get("Leave")!;
          leaveCounts[emp.id] = (leaveCounts[emp.id] || 0) + 1;
        }
      }
    }
    for (const status of attendanceTotalStatuses) {
      const row: Record<string, string> = { day: `TOTAL - ${status}`, date: "" };
      for (const emp of exportEmployees) {
        row[emp.id] = String(status === "Half Day"
          ? extraTotals.get(emp.id)?.halfDays ?? 0
          : status === "Late Clock Out"
            ? extraTotals.get(emp.id)?.lateClockOuts ?? 0
            : statusTotals.get(status)?.[emp.id] || 0);
      }
      pivotedRows.push(row);
    }
  }

  const exportColumns: ExportColumn<Record<string, string>>[] = [
    {
      header: "Day",
      key: "day",
    },
    {
      header: "Date",
      key: "date",
    },
    ...exportEmployees.map((emp) => ({
      header: emp.name,
      key: (row: Record<string, string>) => row[emp.id] || "Absent",
    })),
  ];

  const lateClockOutExportColumns: ExportColumn<ClockInRecord>[] = [
    { header: "Staff", key: (record) => record.user?.name || record.user_id },
    { header: "Email", key: (record) => record.user?.email || "" },
    {
      header: "Attendance date",
      key: (record) => formatLagosDate(record.clock_in_at),
    },
    {
      header: "Clock in (Lagos)",
      key: (record) => formatLagosTime(record.clock_in_at),
    },
    {
      header: "Clock-out date",
      key: (record) => formatLagosDate(record.clock_out_at || ""),
    },
    {
      header: "Clock out (Lagos)",
      key: (record) => formatLagosTime(record.clock_out_at || ""),
    },
    { header: "Clock-out flag", key: () => "After 8 PM" },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">General Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor attendance records across all staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WallQrPosterDialog
            trigger={
              <Button variant="outline" size="sm">
                <QrCode className="size-4" />
                QR poster
              </Button>
            }
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="size-4" />
                Attendance tools
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3">
              <p className="text-sm font-medium">Clock-in settings</p>
              <ClockInModeToggle compact />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {stats ? (
        <AttendanceStats stats={stats} isLoading={isPending} />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Attendance totals could not load. Refresh the page to try again.
        </p>
      )}

      {exportEmployees.length === 1 && attendanceDayStatuses.length > 0 && (
        <section className="space-y-2 rounded-lg border bg-card px-4 py-3" aria-label={`Attendance status for ${exportEmployees[0].name}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Daily attendance status · {exportEmployees[0].name}</h2>
            <span className="text-xs text-muted-foreground">Selected date range</span>
          </div>
          <AttendanceStatusBlocks statuses={attendanceDayStatuses} showLegend size="large" />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <DatePickerWithRange
          applyOnConfirm
          date={dateRange}
          setDate={(range) => {
            if (range) {
              setDateRange(range);
              return;
            }
            const today = parseISO(formatLagosDateForInput(new Date()));
            const from = new Date(today);
            from.setDate(from.getDate() - 29);
            setDateRange({ from, to: today });
          }}
          disabled={isPending}
          className="h-9 w-full sm:w-72"
        />
        <Select
          value={selectedStaff}
          onValueChange={setSelectedStaff}
          disabled={isPending}
        >
          <SelectTrigger
            aria-label="Filter by staff member"
            className="h-9 w-full sm:w-48"
          >
            <SelectValue placeholder="All staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All staff</SelectItem>
            {staffOptions.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={clockOutFilter}
          onValueChange={setClockOutFilter}
          disabled={isPending}
        >
          <SelectTrigger
            aria-label="Filter by clock-out"
            className="h-9 w-full sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clock-outs</SelectItem>
            <SelectItem value="late">Late clock-outs</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            const today = parseISO(formatLagosDateForInput(new Date()));
            const start = new Date(today);
            start.setDate(start.getDate() - 29);
            setDateRange({ from: start, to: today });
            setSelectedStaff("all");
            setClockOutFilter("all");
            setTableDepartment(null);
          }}
        >
          Reset
        </Button>
      </div>

      <AttendanceCharts
        data={charts}
        onSelectDay={(date) =>
          setDateRange({ from: parseISO(date), to: parseISO(date) })
        }
        onSelectDepartment={selectDepartment}
      />

      {tableDepartment !== null && (
        <div
          className="flex flex-wrap items-center gap-2 text-sm"
          role="status"
        >
          <span>
            Table & export: <strong>{tableDepartment}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectDepartment(null)}
          >
            Clear department
          </Button>
          <span className="text-xs text-muted-foreground">
            Summary cards and charts cover all selected staff.
          </span>
        </div>
      )}
      {leaveFailed && (
        <p role="alert" className="rounded-md border p-4 text-sm">
          Leave records could not be loaded. Refresh the page to export accurate totals.
        </p>
      )}
      {historyFailed && (
        <p role="alert" className="rounded-md border p-4 text-sm">
          Attendance records could not load. Refresh the page to try again.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Attendance records</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
            disabled={isPending}
          >
            <SelectTrigger aria-label="Rows per page" className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <fieldset disabled={isPending || historyFailed || (clockOutFilter !== "late" && leaveFailed)}>
            {clockOutFilter === "late" ? (
              <TableExportButton
                data={history}
                columns={lateClockOutExportColumns}
                filename={`Late_Clock_Outs_${formatLagosDateForInput(new Date())}`}
              />
            ) : (
              <TableExportButton
                data={pivotedRows}
                columns={exportColumns}
                filename={`Attendance_Export_${formatLagosDateForInput(new Date())}`}
              />
            )}
          </fieldset>
        </div>
      </div>
      {/* 4. List */}
      {!historyFailed && (
        <div className="flex flex-col gap-4">
          <AdminAttendanceTable
            history={history}
            isLoading={isPending}
            currentPage={initialPage}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  );
}
