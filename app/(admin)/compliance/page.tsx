import { renderDataPage } from "@/lib/api/render-data-page";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageCompliance } from "@/lib/compliance-access";
import { AddOccurrenceDialog } from "./components/add-occurrence-dialog";
import {
  getComplianceIssues,
  getComplianceSanctionGrid,
  getComplianceMonthlyReview,
  Severity,
  ComplianceStatus,
} from "@/lib/api/compliance";
import { getEmployees } from "@/lib/api/employees";
import { ComplianceClientManager } from "./components/compliance-client-manager";
import { SanctionGridSection } from "./components/sanction-grid-section";
import { MonthlyComplianceReview } from "./components/monthly-compliance-review";
import type { CorrectionFilter } from "@/lib/types/compliance";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    grid_window_end?: string;
    correction?: CorrectionFilter;
    status?: ComplianceStatus;
    severity?: Severity;
    type?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
  }>;
}

export default async function CompliancePage({ searchParams }: PageProps) {
  return renderDataPage(async () => {
  const user = await getCurrentUser();
  const params = await searchParams;

  // Access control
  if (!user) {
    redirect("/login");
  }

  if (!canManageCompliance(user)) {
    redirect("/dashboard");
  }

  const page = params.page ? parseInt(params.page) : 1;

  // Fetch data
  const [issuesData, employeesData, sanctionGrid, monthlyReview] = await Promise.all([
    getComplianceIssues({
      limit: 500,
      page,
      status: params.status,
      correction: params.correction,
      severity: params.severity,
      date_from: params.date_from,
      date_to: params.date_to,
    }),
    getEmployees({ limit: 1000, status: "Active" }),
    getComplianceSanctionGrid({ window_end: params.grid_window_end }),
    getComplianceMonthlyReview(params.month),
  ]);

  const employees = employeesData.items;
  // Derive unique departments from employees
  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean)),
  ).sort();

  const { items: issues } = issuesData;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage compliance queries, review staff responses, and track corrective actions.
          </p>
        </div>
        <AddOccurrenceDialog employees={employees} departments={departments} />
      </div>

      <SanctionGridSection key={sanctionGrid.windowEnd} data={sanctionGrid} />

      <ComplianceClientManager
        initialIssues={issues}
        isAdmin={true}
        serverFilters={{
          correction: params.correction,
          status: params.status,
          severity: params.severity,
          date_from: params.date_from,
          date_to: params.date_to,
        }}
      />

      <MonthlyComplianceReview data={monthlyReview} />
    </div>
  );

  }, "Unable to load compliance records");
}
