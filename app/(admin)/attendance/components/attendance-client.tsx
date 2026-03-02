"use client";

import { useState, useEffect } from "react";
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
}

export function AttendanceClient({
  history,
  stats,
  employees,
  initialFrom,
  initialTo,
  initialUserId,
}: AttendanceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

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

  const [isPending, setIsPending] = useState(false);

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

    if (hasChanges) {
      setIsPending(true);
      router.push(`${pathname}?${params.toString()}`);
    } else {
      setIsPending(false);
    }
  }, [dateRange, selectedStaff, searchParams, pathname, router]);

  useEffect(() => {
    setIsPending(false);
  }, [history, stats]);

  const exportColumns = [
    {
      header: "Staff Name",
      key: (item: any) =>
        `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim() ||
        "Unknown",
    },
    {
      header: "Email",
      key: (item: any) => item.user?.email || "",
    },
    {
      header: "Date",
      key: (item: any) =>
        new Date(item.clock_in_at).toLocaleDateString("en-US", {
          timeZone: "UTC",
        }),
    },
    {
      header: "Clock In",
      key: (item: any) => {
        const d = new Date(item.clock_in_at);
        return `${d.getUTCHours() % 12 || 12}:${d.getUTCMinutes().toString().padStart(2, "0")} ${d.getUTCHours() >= 12 ? "PM" : "AM"}`;
      },
    },
    {
      header: "Clock Out",
      key: (item: any) => {
        if (!item.clock_out_at) return "-";
        const d = new Date(item.clock_out_at);
        return `${d.getUTCHours() % 12 || 12}:${d.getUTCMinutes().toString().padStart(2, "0")} ${d.getUTCHours() >= 12 ? "PM" : "AM"}`;
      },
    },
    {
      header: "Duration (Mins)",
      key: (item: any) => item.duration_minutes || "",
    },
    {
      header: "Late Status",
      key: (item: any) => {
        const d = new Date(item.clock_in_at);
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        const isLate = hours > 9 || (hours === 9 && minutes > 5);
        return isLate ? "Late" : "On Time";
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
            className="w-full sm:w-[260px]"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-2 w-full xl:w-auto">
          <label className="text-sm font-medium px-1 flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <Users size={14} className="text-muted-foreground" />
            Staff Member
          </label>
          <div className="w-full sm:w-[220px]">
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
        <AdminAttendanceTable history={history} isLoading={isPending} />
      </div>
    </div>
  );
}
