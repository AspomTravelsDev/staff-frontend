"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ComplianceIssue,
  ComplianceStatus,
  Severity,
} from "@/lib/api/compliance";
import { ComplianceFilters } from "./compliance-filters";
import { ComplianceTable } from "./compliance-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

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

  const handleExportCsv = () => {
    if (filteredIssues.length === 0) {
      toast.error("No records available for export");
      return;
    }

    const headers = [
      "employee",
      "department",
      "type",
      "description",
      "severity",
      "status",
      "outcome",
      "occurrence_date",
      "deduction_days",
      "has_new_replies",
    ];

    const escapeCsv = (value: unknown): string => {
      const text = String(value ?? "").replace(/\"/g, '""');
      return /[",\n]/.test(text) ? `"${text}"` : text;
    };

    const rows = filteredIssues.map((issue) => [
      issue.user_name,
      issue.user_department,
      issue.type,
      issue.description,
      issue.severity,
      issue.status,
      issue.outcome,
      issue.occurrence_date,
      issue.deduction_days ?? 0,
      issue.has_new_replies ? "yes" : "no",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    link.download = `compliance-table-${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Compliance table exported");
  };

  return (
    <div className="space-y-4">
      <ComplianceFilters
        search={search}
        onSearchChange={(val: string) => setSearch(val)}
        status={serverFilters.status}
        onStatusChange={(val: string | null) =>
          handleServerFilterChange("status", val)
        }
        severity={serverFilters.severity}
        onSeverityChange={(val: string | null) =>
          handleServerFilterChange("severity", val)
        }
        dateFrom={serverFilters.date_from}
        onDateFromChange={(val: string | null) =>
          handleServerFilterChange("date_from", val)
        }
        dateTo={serverFilters.date_to}
        onDateToChange={(val: string | null) =>
          handleServerFilterChange("date_to", val)
        }
        onClear={handleClear}
      />
      {isAdmin ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export Table CSV
          </Button>
        </div>
      ) : null}
      <ComplianceTable issues={filteredIssues} isAdmin={isAdmin} />
    </div>
  );
}
