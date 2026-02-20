"use client";

import { EmployeeStatsCards } from "./employee-stats";
import { EmployeeTable } from "./employee-table";
import { EmployeeFilters, FilterValues } from "./employee-filters";
import { useState, useMemo } from "react";
import type { Employee, EmployeeStats } from "@/lib/api/employees";

interface EmployeeListContentProps {
  employees: Employee[];
  stats: EmployeeStats;
}

export function EmployeeListContent({
  employees,
  stats,
}: EmployeeListContentProps) {
  const [filters, setFilters] = useState<FilterValues>({
    status: "all",
    department: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set(
      employees
        .map((e) => e.department)
        .filter((dept): dept is string => !!dept && dept.trim() !== ""),
    );
    return Array.from(depts).sort();
  }, [employees]);

  // Client-side filtering and sorting (instant, no API calls)
  const filteredAndSortedEmployees = useMemo(() => {
    let result = [...employees];

    // Apply status filter
    if (filters.status !== "all") {
      result = result.filter((e) => e.status === filters.status);
    }

    // Apply department filter
    if (filters.department !== "all") {
      result = result.filter((e) => e.department === filters.department);
    }

    // Apply sorting
    const sortBy = filters.sortBy || "name";
    const sortOrder = filters.sortOrder || "asc";

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "staff_id":
          comparison = a.staff_id.localeCompare(b.staff_id);
          break;
        case "date_joined":
          const dateA = a.joinDate ? new Date(a.joinDate).getTime() : 0;
          const dateB = b.joinDate ? new Date(b.joinDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case "name":
        default:
          comparison = a.firstName.localeCompare(b.firstName);
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [employees, filters]);

  return (
    <>
      {/* Stats Cards */}
      <EmployeeStatsCards stats={stats} />

      {/* Filters - Below stats, above table */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      />

      {/* Employee Table - Instant updates, no loading */}
      <EmployeeTable employees={filteredAndSortedEmployees} />
    </>
  );
}
