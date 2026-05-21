"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ClockInRecord, ClockInSummary } from "@/lib/api/clock-in";
import { Employee } from "@/lib/api/employees";
import { AttendanceStats } from "./attendance-stats";
import { AdminAttendanceTable } from "./admin-attendance-table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { TableExportButton } from "@/components/ui/table-export-button";
import { Button } from "@/components/ui/button";
import { Filter, Users } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, parseISO } from "date-fns";
import type { ExportColumn } from "@/lib/utils/export";
import {
  isLate,
  formatLagosDate,
  formatLagosTime,
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

  const exportColumns: ExportColumn<ClockInRecord>[] = [
    {
      header: "Staff Name",
      key: (item) =>
        `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim() ||
        "Unknown",
    },
    {
      header: "Email",
      key: (item) => item.user?.email || "",
    },
    {
      header: "Date",
      key: (item) => formatLagosDate(item.clock_in_at),
    },
    {
      header: "Clock In",
      key: (item) => formatLagosTime(item.clock_in_at),
    },
    {
      header: "Clock Out",
      key: (item) =>
        item.clock_out_at ? formatLagosTime(item.clock_out_at) : "",
    },

    {
      header: "Duration (Mins)",
      key: (item) => item.duration_minutes || "",
    },
    {
      header: "Late Status",
      key: (item) => {
        return isLate(item.clock_in_at) ? "Late" : "On Time";
      },
    },
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
          <TableExportButton
            data={history}
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
