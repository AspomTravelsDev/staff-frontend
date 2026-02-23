"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllTaskFilters } from "@/types/task-types";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useEmployees } from "@/lib/api/hooks/use-employees";

interface TaskFiltersProps {
  filters: AllTaskFilters;
}

export function TaskFilters({ filters }: TaskFiltersProps) {
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchParams({ date: e.target.value || undefined });
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
    status: "Active",
  });
  const employees = employeesData?.items || [];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-lg border">
      <div className="grid gap-2 w-full sm:w-auto">
        <label className="text-sm font-medium">Date</label>
        <Input
          type="date"
          value={filters.date || ""}
          onChange={handleDateChange}
          className="w-full sm:w-[180px]"
        />
      </div>

      <div className="grid gap-2 w-full sm:w-auto">
        <label className="text-sm font-medium">Staff Member</label>
        <Select
          value={filters.user_id || "all"}
          onValueChange={handleUserChange}
          disabled={isLoadingEmployees}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
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
        {(filters.date ||
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
