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
import { getComplianceIssues, getComplianceStats } from "@/lib/api/compliance";

export default async function CompliancePage() {
  const user = await getCurrentUser();

  // Access control
  if (!user || !["super", "admin", "hr", "compliance"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Fetch data
  const [issuesData, stats] = await Promise.all([
    getComplianceIssues({ limit: 50 }),
    getComplianceStats(),
  ]);

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
        <AddOccurrenceDialog />
      </div>

      {/* Stats Cards */}
      <ComplianceStatsCards stats={stats} />

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Occurrences</CardTitle>
          <CardDescription>
            Showing {issues.length} of {pagination.total} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceTable issues={issues} />
        </CardContent>
      </Card>
    </div>
  );
}
