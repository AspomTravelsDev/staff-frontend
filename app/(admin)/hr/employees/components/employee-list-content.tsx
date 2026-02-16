"use client";

import { useEmployees, useEmployeeStats } from "@/lib/api/hooks/use-employees";
import { EmployeeStatsCards } from "./employee-stats";
import { EmployeeTable } from "./employee-table";
import { EmployeeFilters, FilterValues } from "./employee-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Employee } from "@/lib/api/employees";

export function EmployeeListContent() {
  const [filters, setFilters] = useState<FilterValues>({
    status: "all",
    department: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Fetch stats independently
  const { data: stats, isLoading: statsLoading } = useEmployeeStats();

  // Fetch all employees once
  const { data: allEmployeesData, isLoading: employeesLoading } = useEmployees({
    limit: 1000,
  });

  // Extract unique departments
  const departments = useMemo(() => {
    if (!allEmployeesData?.items) return [];
    const depts = new Set(
      allEmployeesData.items
        .map((e) => e.role)
        .filter((role) => role && role.trim() !== ""),
    );
    return Array.from(depts).sort();
  }, [allEmployeesData]);

  // Client-side filtering and sorting (instant, no API calls)
  const filteredAndSortedEmployees = useMemo(() => {
    if (!allEmployeesData?.items) return [];

    let result = [...allEmployeesData.items];

    // Apply status filter
    if (filters.status !== "all") {
      result = result.filter((e) => e.status === filters.status);
    }

    // Apply department filter
    if (filters.department !== "all") {
      result = result.filter((e) => e.role === filters.department);
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
  }, [allEmployeesData, filters]);

  return (
    <>
      {/* Stats Cards - Always show first */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <EmployeeStatsCards stats={stats!} />
      )}

      {/* Filters - Below stats, above table */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      />

      {/* Employee Table - Instant updates, no loading */}
      {employeesLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <EmployeeTable employees={filteredAndSortedEmployees} />
      )}
    </>
  );
}
