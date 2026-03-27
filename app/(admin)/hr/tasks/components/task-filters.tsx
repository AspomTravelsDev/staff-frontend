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
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useEmployees } from "@/lib/api/hooks/use-employees";
import { TableExportButton } from "@/components/ui/table-export-button";

interface TaskFiltersProps {
  filters: AllTaskFilters;
  records?: DailyTaskRecord[];
}

export function TaskFilters({ filters, records }: TaskFiltersProps) {
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
          <TableExportButton
            data={records}
            columns={exportColumns}
            filename={`Staff_Tasks_${filters.start_date || filters.date || "Export"}`}
          />
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
