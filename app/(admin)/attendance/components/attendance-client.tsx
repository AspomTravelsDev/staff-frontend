"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClockInRecord, ClockInSummary } from "@/lib/api/clock-in";
import { Employee } from "@/lib/api/employees";
import { AttendanceStats } from "./attendance-stats";
import { AdminAttendanceTable } from "./admin-attendance-table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { TableExportButton } from "@/components/ui/table-export-button";
import { WallQrPosterDialog } from "@/components/attendance/wall-qr-poster-dialog";
import { ClockInModeToggle } from "@/components/attendance/clock-in-mode-toggle";
import { Button } from "@/components/ui/button";
import { Filter, Users } from "lucide-react";
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
  stats: ClockInSummary | null;
  employees: Employee[];
  initialFrom?: string;
  initialTo?: string;
  initialUserId?: string;
  initialPage?: number;
  initialPageSize?: number;
}

export function AttendanceClient({
  history,
  stats,
  employees,
  initialFrom,
  initialTo,
  initialUserId,
  initialPage = 1,
  initialPageSize = 100,
}: AttendanceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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

  useEffect(() => {
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
    searchParams,
    pathname,
    router,
    startTransition,
  ]);

  // Create a map of date_userId to track status (using earliest clock-in time)
  const attendanceMap = new Map<string, { clockInTime: number; status: "Early" | "Late" | "Late (Permitted)" }>();
  history.forEach((record) => {
    const dateStr = formatLagosDateForInput(record.clock_in_at);
    if (!dateStr) return;
    const userId = record.user_id;
    const key = `${dateStr}_${userId}`;
    const clockInTime = new Date(record.clock_in_at).getTime();
    
    let status: "Early" | "Late" | "Late (Permitted)" = isLate(record.clock_in_at) ? "Late" : "Early";
    if (status === "Late" && record.is_late_permitted) {
      status = "Late (Permitted)";
    }

    const existing = attendanceMap.get(key);
    if (!existing || clockInTime < existing.clockInTime) {
      attendanceMap.set(key, { clockInTime, status });
    }
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
        const record = attendanceMap.get(key);
        row[emp.id] = record ? record.status : "Absent";
      });

      pivotedRows.push(row);
      curr.setDate(curr.getDate() + 1);
    }
  }

  const exportColumns: ExportColumn<any>[] = [
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
      key: (row: any) => row[emp.id] || "Absent",
    })),
  ];

  return (
    <div className="flex flex-col gap-6 p-4 pt-10 lg:pt-4">
      <div>
        <h1 className="text-2xl font-bold">General Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Monitor attendance records across all staff.
        </p>
      </div>

      <AttendanceStats stats={stats} isLoading={isPending} />

      <div className="flex flex-col xl:flex-row gap-4 xl:items-center bg-card p-4 rounded-xl border">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full xl:w-auto">
          <label className="text-sm font-medium px-1 flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <Filter size={14} className="text-muted-foreground" />
            Date Range
          </label>
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            disabled={isPending}
            className="w-full sm:w-65"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full xl:w-auto">
          <label className="text-sm font-medium px-1 flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <Users size={14} className="text-muted-foreground" />
            Staff Member
          </label>
          <div className="w-full sm:w-55">
            <Select
              value={selectedStaff}
              onValueChange={setSelectedStaff}
              disabled={isPending}
            >
              <SelectTrigger className="h-10 bg-background">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => {
              setDateRange(undefined);
              setSelectedStaff("all");
            }}
            disabled={isPending || (!dateRange && selectedStaff === "all")}
          >
            Reset
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full xl:w-auto">
          <label className="text-sm font-medium px-1 flex items-center gap-1.5 whitespace-nowrap shrink-0">
            Rows per page
          </label>
          <div className="w-full sm:w-28">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number.parseInt(value, 10))}
              disabled={isPending}
            >
              <SelectTrigger className="h-10 bg-background">
                <SelectValue placeholder="100" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ClockInModeToggle />
          <WallQrPosterDialog />
          <TableExportButton
            data={pivotedRows}
            columns={exportColumns}
            filename={`Attendance_Export_${format(new Date(), "yyyy_MM_dd")}`}
          />
        </div>
      </div>

      {/* 4. List */}
      <div className="flex flex-col gap-4 mt-2">
        <AdminAttendanceTable
          history={history}
          isLoading={isPending}
          currentPage={initialPage}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
