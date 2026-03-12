import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ComplianceStatsCards } from "./components/compliance-stats";
import { ComplianceTable } from "./components/compliance-table";
import { AddOccurrenceDialog } from "./components/add-occurrence-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getComplianceIssues, getComplianceStats, Severity, ComplianceStatus } from "@/lib/api/compliance";
import { getEmployees } from "@/lib/api/employees";
import { ComplianceClientManager } from "./components/compliance-client-manager";

interface PageProps {
  searchParams: Promise<{
    status?: ComplianceStatus;
    severity?: Severity;
    type?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
  }>;
}

export default async function CompliancePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  // Access control
  if (!user) {
    redirect("/login");
  }

  if (!["super", "admin", "hr", "compliance"].includes(user.role)) {
    redirect("/dashboard");
  }

  const page = params.page ? parseInt(params.page) : 1;

  // Fetch data
  const [issuesData, stats, employeesData] = await Promise.all([
    getComplianceIssues({ 
      limit: 500, 
      page,
      status: params.status,
      severity: params.severity,
      date_from: params.date_from,
      date_to: params.date_to,
    }),
    getComplianceStats(),
    getEmployees({ limit: 1000, status: "Active" }),
  ]);

  const employees = employeesData.items;
  // Derive unique departments from employees
  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ).sort();

  const { items: issues, pagination } = issuesData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage company-wide compliance and occurrences.
          </p>
        </div>
        <AddOccurrenceDialog employees={employees} departments={departments} />
      </div>

      {/* Stats Cards */}
      <ComplianceStatsCards stats={stats} />

      <ComplianceClientManager 
        initialIssues={issues}
        isAdmin={true}
        serverFilters={{
          status: params.status,
          severity: params.severity,
          date_from: params.date_from,
          date_to: params.date_to,
        }}
      />
    </div>
  );
}
