"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface FilterValues {
  status?: "Active" | "Inactive" | "all";
  department?: string;
  sortBy?: "staff_id" | "date_joined" | "name";
  sortOrder?: "asc" | "desc";
}

interface EmployeeFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  departments: string[];
}

export function EmployeeFilters({
  filters,
  onFiltersChange,
  departments,
}: EmployeeFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      status: "all",
      department: "all",
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.department !== "all" ||
    filters.sortBy !== "name" ||
    filters.sortOrder !== "asc";

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-1 flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as FilterValues["status"],
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter */}
        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Department:</label>
            <Select
              value={filters.department || "all"}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, department: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <Select
            value={filters.sortBy || "name"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sortBy: value as FilterValues["sortBy"],
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="staff_id">Staff ID</SelectItem>
              <SelectItem value="date_joined">Date Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Order:</label>
          <Select
            value={filters.sortOrder || "asc"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sortOrder: value as FilterValues["sortOrder"],
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                {filters.sortBy === "date_joined"
                  ? "Oldest First"
                  : "Ascending"}
              </SelectItem>
              <SelectItem value="desc">
                {filters.sortBy === "date_joined"
                  ? "Newest First"
                  : "Descending"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
