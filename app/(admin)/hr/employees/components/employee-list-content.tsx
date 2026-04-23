"use client";

import { EmployeeStatsCards } from "./employee-stats";
import { EmployeeTable } from "./employee-table";
import { EmployeeFilters, FilterValues } from "./employee-filters";
import { useState, useMemo } from "react";
import type { Employee, EmployeeStats } from "@/lib/api/employees";
import { TableExportButton } from "@/components/ui/table-export-button";
import { formatLagosDate } from "@/lib/utils/attendance";
import { type RoleOption } from "@/types/user-types";

interface EmployeeListContentProps {
  employees: Employee[];
  stats: EmployeeStats;
  roleOptions: RoleOption[];
  departmentsForEditor: string[];
  roleToDepartment: Record<string, string>;
}

export function EmployeeListContent({
  employees,
  stats,
  roleOptions,
  departmentsForEditor,
  roleToDepartment,
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

  const exportColumns = [
    { header: "Staff ID", key: (emp: Employee) => emp.staff_id || "" },
    { header: "First Name", key: (emp: Employee) => emp.firstName || "" },
    { header: "Last Name", key: (emp: Employee) => emp.lastName || "" },
    { header: "Email", key: (emp: Employee) => emp.email || "" },
    { header: "Phone", key: (emp: Employee) => emp.phone || "" },
    { header: "Department", key: (emp: Employee) => emp.department || "" },
    { header: "Role", key: (emp: Employee) => emp.role || "" },
    {
      header: "Date Joined",
      key: (emp: Employee) =>
        emp.joinDate ? formatLagosDate(emp.joinDate) : "-",
    },
    { header: "Status", key: (emp: Employee) => emp.status || "" },
  ];

  return (
    <>
      {/* Stats Cards */}
      <EmployeeStatsCards stats={stats} />

      {/* Filters and Actions */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      >
        <div className="shrink-0 flex items-center ml-auto">
          {filteredAndSortedEmployees.length > 0 && (
            <TableExportButton
              data={filteredAndSortedEmployees}
              columns={exportColumns}
              filename={`Employee_List_${new Date().toISOString().split("T")[0]}.csv`}
            />
          )}
        </div>
      </EmployeeFilters>

      {/* Employee Table - Instant updates, no loading */}
      <EmployeeTable
        employees={filteredAndSortedEmployees}
        roleOptions={roleOptions}
        departments={departmentsForEditor}
        roleToDepartment={roleToDepartment}
      />
    </>
  );
}
