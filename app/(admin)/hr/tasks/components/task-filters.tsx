"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllTaskFilters, DailyTaskRecord } from "@/types/task-types";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { X, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useEmployees } from "@/lib/api/hooks/use-employees";
import { TableExportButton } from "@/components/ui/table-export-button";
import { exportToCSV, type ExportColumn } from "@/lib/utils/export";
import { formatLagosDateForInput } from "@/lib/utils/attendance";
import { ClockInRecord } from "@/lib/api/clock-in";

function formatLagosHHMM(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch (e) {
    return "";
  }
}

interface TaskFiltersProps {
  filters: AllTaskFilters;
  records?: DailyTaskRecord[];
  attendance?: ClockInRecord[];
}

export function TaskFilters({ filters, records, attendance }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const dateRange: DateRange | undefined =
    filters.start_date && filters.end_date
      ? { from: parseISO(filters.start_date), to: parseISO(filters.end_date) }
      : filters.date
        ? { from: parseISO(filters.date), to: parseISO(filters.date) }
        : undefined;

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      if (format(range.from, "yyyy-MM-dd") === format(range.to, "yyyy-MM-dd")) {
        updateSearchParams({
          date: format(range.from, "yyyy-MM-dd"),
          start_date: undefined,
          end_date: undefined,
        });
      } else {
        updateSearchParams({
          date: undefined,
          start_date: format(range.from, "yyyy-MM-dd"),
          end_date: format(range.to, "yyyy-MM-dd"),
        });
      }
    } else if (range?.from) {
      updateSearchParams({
        date: format(range.from, "yyyy-MM-dd"),
        start_date: undefined,
        end_date: undefined,
      });
    } else {
      updateSearchParams({
        date: undefined,
        start_date: undefined,
        end_date: undefined,
      });
    }
  };

  const handleUserChange = (value: string) => {
    updateSearchParams({ user_id: value === "all" ? undefined : value });
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      updateSearchParams({ report_submitted: undefined });
    } else {
      updateSearchParams({
        report_submitted: value === "submitted" ? "true" : "false",
      });
    }
  };

  const clearFilters = () => {
    router.push("?");
  };

  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    limit: 1000,
    status: "Active",
  });
  const employees = employeesData?.items || [];

  // Create a map of date_userId to track daily task records
  const recordsMap = new Map<string, DailyTaskRecord>();
  records?.forEach((rec) => {
    const key = `${rec.date}_${rec.user_id}`;
    recordsMap.set(key, rec);
  });

  // Create a set of date_userId keys where a clock-in record exists (wasn't absent)
  const clockInMap = new Set<string>();
  attendance?.forEach((record) => {
    const dateStr = formatLagosDateForInput(record.clock_in_at);
    if (!dateStr) return;
    const userId = record.user_id;
    const key = `${dateStr}_${userId}`;
    clockInMap.add(key);
  });

  // Identify all unique staff members
  const employeeMap = new Map<string, { id: string; name: string }>();

  // Add active employees
  employees.forEach((emp) => {
    employeeMap.set(emp.id, {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`.trim(),
    });
  });

  // Add any employees from records who might not be active employees
  records?.forEach((rec) => {
    if (rec.user_id && !employeeMap.has(rec.user_id)) {
      employeeMap.set(rec.user_id, {
        id: rec.user_id,
        name: rec.user?.name || `User ${rec.user_id}`,
      });
    }
  });

  let exportEmployees = Array.from(employeeMap.values());

  // Filter by selected staff if filters.user_id is set
  if (filters.user_id) {
    exportEmployees = exportEmployees.filter((emp) => emp.id === filters.user_id);
  }

  // Determine start and end date for rows
  let startStr = "";
  let endStr = "";
  if (filters.start_date) {
    startStr = filters.start_date;
  }
  if (filters.end_date) {
    endStr = filters.end_date;
  }
  if (filters.date) {
    if (!startStr) startStr = filters.date;
    if (!endStr) endStr = filters.date;
  }

  // If no date range is set, default to range of dates in records, or today
  if (!startStr || !endStr) {
    const dates = records
      ?.map((r) => r.date)
      .filter(Boolean)
      .sort();
    if (dates && dates.length > 0) {
      if (!startStr) startStr = dates[0];
      if (!endStr) endStr = dates[dates.length - 1];
    } else {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (!startStr) startStr = todayStr;
      if (!endStr) endStr = todayStr;
    }
  }

  // Generate rows for each day in range
  const pivotedRows: any[] = [];
  if (startStr && endStr) {
    const [sYear, sMonth, sDay] = startStr.split("-").map(Number);
    const [eYear, eMonth, eDay] = endStr.split("-").map(Number);

    const startDateObj = new Date(sYear, sMonth - 1, sDay);
    const endDateObj = new Date(eYear, eMonth - 1, eDay);

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const curr = new Date(startDateObj);
    while (curr <= endDateObj) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const dStr = String(curr.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${dStr}`;

      const shortYear = String(y).slice(-2);
      const formattedDate = `${dStr}/${m}/${shortYear}`;
      const dayName = daysOfWeek[curr.getDay()];

      const row: any = {
        day: dayName,
        date: formattedDate,
      };

      exportEmployees.forEach((emp) => {
        const key = `${dateKey}_${emp.id}`;
        const record = recordsMap.get(key);
        const hasClockIn = clockInMap.has(key);

        const hasTodo = !!(record && record.first_saved_at);
        const hasReport = !!(record && record.report_submitted_at);

        row[`${emp.id}_todo`] = hasTodo ? "TODO" : (hasClockIn ? "nil" : "absent");
        row[`${emp.id}_report`] = hasReport ? "REPORT" : (hasClockIn ? "nil" : "absent");
      });

      pivotedRows.push(row);
      curr.setDate(curr.getDate() + 1);
    }
  }

  const pivotedExportColumns: ExportColumn<any>[] = [
    {
      header: "Day",
      key: "day",
    },
    {
      header: "Date",
      key: "date",
    },
    ...exportEmployees.flatMap((emp) => [
      {
        header: `${emp.name} (Todo)`,
        key: (row: any) => row[`${emp.id}_todo`] || "",
      },
      {
        header: `${emp.name} (Report)`,
        key: (row: any) => row[`${emp.id}_report`] || "",
      },
    ]),
  ];

  const exportColumns = [
    { header: "Staff ID", key: (r: DailyTaskRecord) => r.user?.staff_id || "" },
    { header: "Name", key: (r: DailyTaskRecord) => r.user?.name || "" },
    { header: "Email", key: (r: DailyTaskRecord) => r.user?.email || "" },
    { header: "Date", key: (r: DailyTaskRecord) => r.date },
    { header: "Total Tasks", key: (r: DailyTaskRecord) => r.total_tasks },
    { header: "Completed", key: (r: DailyTaskRecord) => r.completed_count },
    { header: "Ongoing", key: (r: DailyTaskRecord) => r.ongoing_count },
    {
      header: "Progress %",
      key: (r: DailyTaskRecord) =>
        r.total_tasks > 0
          ? Math.round((r.completed_count / r.total_tasks) * 100) + "%"
          : "0%",
    },
    {
      header: "Report Status",
      key: (r: DailyTaskRecord) =>
        r.report_submitted ? "Submitted" : "Pending",
    },
    {
      header: "First Saved",
      key: (r: DailyTaskRecord) =>
        r.first_saved_at ? format(new Date(r.first_saved_at), "HH:mm") : "-",
    },
    {
      header: "Submitted At",
      key: (r: DailyTaskRecord) =>
        r.report_submitted_at
          ? format(new Date(r.report_submitted_at), "HH:mm")
          : "-",
    },
    {
      header: "Task List",
      key: (r: DailyTaskRecord) =>
        r.tasks
          .map((t) => (t.completed ? "[x] " : "[ ] ") + t.text)
          .join(" | "),
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-lg border">
      <div className="grid gap-2 w-full sm:w-auto">
        <label className="text-sm font-medium">Date Range</label>
        <DatePickerWithRange
          date={dateRange}
          setDate={handleDateRangeChange}
          className="w-full sm:w-65"
        />
      </div>

      <div className="grid gap-2 w-full sm:w-auto">
        <label className="text-sm font-medium">Staff Member</label>
        <Select
          value={filters.user_id || "all"}
          onValueChange={handleUserChange}
          disabled={isLoadingEmployees}
        >
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 w-full sm:w-auto">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={
            filters.report_submitted === undefined
              ? "all"
              : filters.report_submitted
                ? "submitted"
                : "pending"
          }
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 mt-auto ml-auto">
        {records && records.length > 0 && (
          <>
            <TableExportButton
              data={records}
              columns={exportColumns}
              filename={`Staff_Tasks_${filters.start_date || filters.date || "Export"}`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  pivotedRows,
                  pivotedExportColumns,
                  `Staff_Tasks_Daily_Sheet_${filters.start_date || filters.date || "Export"}`
                )
              }
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Daily Sheet
            </Button>
          </>
        )}
        {(filters.date ||
          filters.start_date ||
          filters.end_date ||
          filters.report_submitted !== undefined ||
          filters.user_id) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" /> Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
