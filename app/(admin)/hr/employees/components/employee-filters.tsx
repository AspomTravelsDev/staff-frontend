"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { USER_EXIT_TYPE_LABELS } from "@/types/user-types";
import { Input } from "@/components/ui/input";

export interface FilterValues {
  status?: "Active" | "Inactive" | "all";
  exit_type?: string;
  department?: string;
  contract_type?: string;
  search?: string;
  sortBy?: "staff_id" | "date_joined" | "name";
  sortOrder?: "asc" | "desc";
  joined_this_month?: boolean;
}

interface EmployeeFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  departments: string[];
  children?: React.ReactNode;
}

export function EmployeeFilters({
  filters,
  onFiltersChange,
  departments,
  children,
}: EmployeeFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      status: "all",
      exit_type: "all",
      department: "all",
      contract_type: "all",
      joined_this_month: false,
      search: "",
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    (filters.exit_type && filters.exit_type !== "all") ||
    filters.department !== "all" ||
    (filters.contract_type && filters.contract_type !== "all") ||
    !!filters.search ||
    !!filters.joined_this_month ||
    filters.sortBy !== "name" ||
    filters.sortOrder !== "asc";
    

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search employees by name" placeholder="Search employees by name…" value={filters.search || ""} onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })} className="h-10 pl-9" />
        </div>
        {children && <div className="flex shrink-0 items-center gap-2 sm:ml-auto">{children}</div>}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Contract</label>
          <Select value={filters.contract_type || "all"} onValueChange={(value) => onFiltersChange({ ...filters, contract_type: value })}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contracts</SelectItem>
              <SelectItem value="full_time">Full staff</SelectItem>
              <SelectItem value="part_time">Part time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="nysc">NYSC</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
              <SelectItem value="none">Not specified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as FilterValues["status"],
                exit_type: value === "Inactive" ? filters.exit_type || "all" : "all",
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

        {filters.status === "Inactive" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Separation</label>
            <Select
              value={filters.exit_type || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  exit_type: value,
                })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All separations</SelectItem>
                {Object.entries(USER_EXIT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Department</label>
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

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort</label>
          <Select
            value={filters.sortBy || "name"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sortBy: value as FilterValues["sortBy"],
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="staff_id">Staff ID</SelectItem>
              <SelectItem value="date_joined">Date Joined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Order</label>
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

      {hasActiveFilters && (
        <div className="flex justify-end border-t pt-2">
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 gap-2 px-2">
            <X className="size-4" /> Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
