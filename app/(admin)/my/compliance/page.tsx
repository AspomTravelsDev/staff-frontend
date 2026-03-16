import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getComplianceIssues,
  getComplianceStats,
  getComplianceSanctionGrid,
  Severity,
  ComplianceStatus,
} from "@/lib/api/compliance";
import { ComplianceStatsCards } from "../../compliance/components/compliance-stats";
import { ComplianceClientManager } from "../../compliance/components/compliance-client-manager";
import { SanctionLadderGrid } from "../../compliance/components/sanction-ladder-grid";

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

export default async function MyCompliancePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    redirect("/login");
  }

  const page = params.page ? parseInt(params.page) : 1;

  // Fetch only user's issues and their specific stats
  const [issuesData, stats, sanctionGrid] = await Promise.all([
    getComplianceIssues({
      user_id: user.id,
      limit: 500,
      page,
      status: params.status,
      severity: params.severity,
      date_from: params.date_from,
      date_to: params.date_to,
    }),
    getComplianceStats({ user_id: user.id }),
    getComplianceSanctionGrid({ user_id: user.id }),
  ]);

  const { items: issues } = issuesData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Compliance</h1>
        <p className="text-muted-foreground">
          View your compliance records, queries, and responses.
        </p>
      </div>

      {/* Stats Cards */}
      <ComplianceStatsCards stats={stats} />

      <SanctionLadderGrid
        items={sanctionGrid.items}
        steps={sanctionGrid.steps}
        windowStart={sanctionGrid.windowStart}
        windowEnd={sanctionGrid.windowEnd}
        periodLabel={sanctionGrid.periodLabel}
        title="My Sanction Ladder"
        description="Your disciplinary ladder for the active calendar half-year (Jan-Jun or Jul-Dec). Resolved (No Action) records are excluded."
        showDepartment={false}
        allowImageExport={false}
      />

      <ComplianceClientManager
        initialIssues={issues}
        isAdmin={false}
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
