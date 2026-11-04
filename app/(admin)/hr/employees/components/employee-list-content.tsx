"use client";

import { EmployeeStatsCards } from "./employee-stats";
import { EmployeeTable } from "./employee-table";
import { EmployeeFilters, FilterValues } from "./employee-filters";
import { useState, useMemo } from "react";
import type { Employee, EmployeeStats } from "@/lib/api/employees";
import { TableExportButton } from "@/components/ui/table-export-button";
import { formatLagosDate } from "@/lib/utils/attendance";
import { formatEmployeeDuration } from "@/lib/utils/employee-duration";
import {
  type RoleOption,
  USER_EXIT_TYPE_LABELS,
  type UserExitType,
} from "@/types/user-types";

interface EmployeeListContentProps {
  blacklist?: boolean;
  employees: Employee[];
  stats: EmployeeStats;
  headcountAsOf: string;
  roleOptions: RoleOption[];
  departmentsForEditor: string[];
  roleToDepartment: Record<string, string>;
}

export function EmployeeListContent({
  employees,
  stats,
  headcountAsOf,
  roleOptions,
  departmentsForEditor,
  roleToDepartment,
  blacklist = false,
}: EmployeeListContentProps) {
  const [filters, setFilters] = useState<FilterValues>({
    status: "all",
    exit_type: "all",
    department: "all",
    contract_type: "all",
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    joined_this_month: false,
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

    if (filters.search?.trim()) {
      const search = filters.search.trim().toLocaleLowerCase();
      result = result.filter((employee) => `${employee.firstName} ${employee.lastName}`.toLocaleLowerCase().includes(search));
    }

    if (filters.contract_type === "none") {
      result = result.filter((employee) => !employee.contract_type);
    } else if (filters.contract_type && filters.contract_type !== "all") {
      result = result.filter((employee) => employee.contract_type === filters.contract_type);
    }

    // Apply status filter
    if (filters.status !== "all") {
      result = result.filter((e) => e.status === filters.status);
    }

    if (filters.joined_this_month) {
      const now = new Date(headcountAsOf);
      result = result.filter((employee) => {
        if (!employee.joinDate) return false;
        const joined = new Date(employee.joinDate);
        return joined.getFullYear() === now.getFullYear() && joined.getMonth() === now.getMonth();
      });
    }

    // Apply exit_type filter (when status is Inactive)
    if (
      filters.status === "Inactive" &&
      filters.exit_type &&
      filters.exit_type !== "all"
    ) {
      result = result.filter((e) => e.exit_type === filters.exit_type);
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
  }, [employees, filters, headcountAsOf]);

  const activeStatFilter = filters.joined_this_month
    ? "new-joiners"
    : filters.status === "Active"
      ? "active"
      : filters.status === "Inactive"
        ? "inactive"
        : "all";

  const selectStatFilter = (filter: "active" | "inactive" | "new-joiners") => {
    setFilters((current) => ({
      ...current,
      status: filter === "active" ? "Active" : filter === "inactive" ? "Inactive" : "all",
      joined_this_month: filter === "new-joiners",
      exit_type: "all",
    }));
  };

  const exportColumns = [
    ...(blacklist ? [
      { header: "Blacklist Reason", key: (emp: Employee) => emp.blacklist_reason || "" },
      { header: "Blacklisted On", key: (emp: Employee) => emp.blacklisted_at ? formatLagosDate(emp.blacklisted_at) : "" },
    ] : []),
    { header: "Staff ID", key: (emp: Employee) => emp.staff_id || "" },
    { header: "Tax ID", key: (emp: Employee) => emp.tax_id || "" },
    { header: "First Name", key: (emp: Employee) => emp.firstName || "" },
    { header: "Last Name", key: (emp: Employee) => emp.lastName || "" },
    { header: "Email", key: (emp: Employee) => emp.email || "" },
    { header: "Phone", key: (emp: Employee) => emp.phone || "" },
    { header: "Department", key: (emp: Employee) => emp.department || "" },
    { header: "Role", key: (emp: Employee) => emp.role || "" },
    { header: "Contract Type", key: (emp: Employee) => emp.contract_type || "-" },
    { header: "Contract Start", key: (emp: Employee) => emp.contract_start_date || "-" },
    { header: "Contract End", key: (emp: Employee) => emp.contract_end_date || "-" },
    {
      header: "Date Joined",
      key: (emp: Employee) =>
        emp.joinDate ? formatLagosDate(emp.joinDate) : "-",
    },
    {
      header: "Staff Duration",
      key: (emp: Employee) =>
        formatEmployeeDuration(emp.joinDate, emp.status, emp.exit_date),
    },
    { header: "Status", key: (emp: Employee) => emp.status || "" },
    {
      header: "Separation Type",
      key: (emp: Employee) =>
        emp.exit_type
          ? USER_EXIT_TYPE_LABELS[emp.exit_type as UserExitType] ||
            emp.exit_type
          : "-",
    },
    {
      header: "Separation Date",
      key: (emp: Employee) =>
        emp.exit_date ? formatLagosDate(emp.exit_date) : "-",
    },
    {
      header: "Separation Reason",
      key: (emp: Employee) => emp.exit_reason || "-",
    },
  ];

  return (
    <>
      {/* Stats Cards */}
      {!blacklist && <EmployeeStatsCards
        stats={stats}
        employees={employees}
        asOf={headcountAsOf}
        onSelect={selectStatFilter}
        activeFilter={activeStatFilter}
      />}

      {/* Filters and Actions */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      >
        <div className="flex shrink-0 items-center">
          {filteredAndSortedEmployees.length > 0 && (
            <TableExportButton
              data={filteredAndSortedEmployees}
              columns={exportColumns}
              filename={`${blacklist ? "Staff_Blacklist" : "Employee_List"}_${new Date().toISOString().split("T")[0]}.csv`}
            />
          )}
        </div>
      </EmployeeFilters>

      {/* Employee Table - Instant updates, no loading */}
      <EmployeeTable
        blacklist={blacklist}
        employees={filteredAndSortedEmployees}
        roleOptions={roleOptions}
        departments={departmentsForEditor}
        roleToDepartment={roleToDepartment}
      />
    </>
  );
}
