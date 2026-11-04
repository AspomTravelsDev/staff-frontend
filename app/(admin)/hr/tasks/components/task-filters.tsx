"use client";

import type { ExportEmployee } from "@/lib/export-confirmation";
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
import { buildTaskDailySheet } from "@/lib/task-daily-export";
import { exportToCSV } from "@/lib/utils/export";
import { ClockInRecord } from "@/lib/api/clock-in";
import type { ExportLeave } from "@/lib/export-confirmation";

interface TaskFiltersProps {
  filters: AllTaskFilters;
  records?: DailyTaskRecord[];
  attendance?: ClockInRecord[];
  approvedLeaves?: ExportLeave[];
  exportError?: string;
}

export function TaskFilters({ filters, records, attendance, approvedLeaves = [], exportError }: TaskFiltersProps) {
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

  // Identify all unique staff members
  const employeeMap = new Map<string, ExportEmployee>();

  // Add active employees
  employees.forEach((emp) => {
    employeeMap.set(emp.id, {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`.trim(),
        joinDate: emp.joinDate,
        contract_type: emp.contract_type,
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
  const staffOptions = Array.from(employeeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

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

  const { rows: pivotedRows, columns: pivotedExportColumns, dailyRowCount } = buildTaskDailySheet({
    employees: exportEmployees, records, attendance, leaves: approvedLeaves, startDate: startStr, endDate: endStr,
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-lg border">
      <div className="grid gap-2 w-full sm:w-auto">
        <label className="text-sm font-medium">Date Range</label>
        <DatePickerWithRange
          applyOnConfirm
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
          disabled={isLoadingEmployees && staffOptions.length === 0}
        >
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staffOptions.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
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

      {exportError && <p role="alert" className="text-xs text-destructive">{exportError} Refresh the page to export accurate totals.</p>}
      <div className="flex items-center gap-2 mt-auto ml-auto">
        {dailyRowCount > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!!exportError || isLoadingEmployees}
              title={exportError || "Weekdays only. Approved leave and absent days are counted separately from missed submissions."}
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
