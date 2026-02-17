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
// import { DatePicker } from "@/components/ui/date-picker"; // Assuming this exists or using standard input
import { AllTaskFilters } from "@/types/task-types";
import { X } from "lucide-react";

interface TaskFiltersProps {
  filters: AllTaskFilters;
  onFilterChange: (filters: AllTaskFilters) => void;
}

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, date: e.target.value || undefined });
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      const { report_submitted, ...rest } = filters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...filters, report_submitted: value === "submitted" });
    }
  };

  const clearFilters = () => {
    onFilterChange({});
  };

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
        {(filters.date || filters.report_submitted !== undefined) && (
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
