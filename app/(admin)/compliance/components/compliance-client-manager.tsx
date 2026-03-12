"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ComplianceIssue, ComplianceStatus, Severity } from "@/lib/api/compliance";
import { ComplianceFilters } from "./compliance-filters";
import { ComplianceTable } from "./compliance-table";

interface ComplianceClientManagerProps {
  initialIssues: ComplianceIssue[];
  isAdmin?: boolean;
  serverFilters: {
    status?: ComplianceStatus;
    severity?: Severity;
    date_from?: string;
    date_to?: string;
  };
}

export function ComplianceClientManager({
  initialIssues,
  isAdmin = false,
  serverFilters,
}: ComplianceClientManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>("");

  const handleServerFilterChange = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1"); // Reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch("");
    router.push(pathname);
  };

  const filteredIssues = useMemo(() => {
    if (!search?.trim()) return initialIssues;

    const searchTerm = search.toLowerCase().trim();
    return initialIssues.filter((issue) => {
      // Client-side search for type, user name, or department
      return (
        issue.type.toLowerCase().includes(searchTerm) ||
        issue.user_name?.toLowerCase().includes(searchTerm) ||
        issue.user_department?.toLowerCase().includes(searchTerm) ||
        issue.description.toLowerCase().includes(searchTerm)
      );
    });
  }, [initialIssues, search]);

  return (
    <div className="space-y-4">
      <ComplianceFilters
        search={search}
        onSearchChange={(val: string) => setSearch(val)}
        status={serverFilters.status}
        onStatusChange={(val: string | null) => handleServerFilterChange("status", val)}
        severity={serverFilters.severity}
        onSeverityChange={(val: string | null) => handleServerFilterChange("severity", val)}
        dateFrom={serverFilters.date_from}
        onDateFromChange={(val: string | null) => handleServerFilterChange("date_from", val)}
        dateTo={serverFilters.date_to}
        onDateToChange={(val: string | null) => handleServerFilterChange("date_to", val)}
        onClear={handleClear}
      />
      <ComplianceTable issues={filteredIssues} isAdmin={isAdmin} />
    </div>
  );
}
