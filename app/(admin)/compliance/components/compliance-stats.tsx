"use client";

import { StatsCard } from "@/components/stats-card";
import { AlertTriangle, Clock, Building, UserMinus } from "lucide-react";
import type { ComplianceStats } from "@/lib/api/compliance";

interface ComplianceStatsProps {
  stats: ComplianceStats;
}

export function ComplianceStatsCards({ stats }: ComplianceStatsProps) {
  const isAdmin = !!stats.topOffender;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Open Issues"
        icon={Clock}
        value={stats.openIssues}
        description="Pending resolution"
        iconClassName="text-muted-foreground"
      />

      {isAdmin ? (
        <>
          <StatsCard
            title="Total Issues"
            icon={AlertTriangle}
            value={stats.totalIssues}
            description="Reported occurrences"
            iconClassName="text-orange-500"
          />

          <StatsCard
            title="Top Offender"
            icon={UserMinus}
            value={
              <span
                className="truncate block"
                title={stats.topOffender?.name || "None"}
              >
                {stats.topOffender?.name || "None"}
              </span>
            }
            description={`${stats.topOffender?.count || 0} occurrences`}
            iconClassName="text-red-500"
          />

          <StatsCard
            title="Top Department"
            icon={Building}
            value={
              <span
                className="truncate block"
                title={stats.topDepartment?.name || "None"}
              >
                {stats.topDepartment?.name || "None"}
              </span>
            }
            description={`${stats.topDepartment?.count || 0} occurrences`}
            iconClassName="text-blue-500"
          />
        </>
      ) : (
        <>
          <StatsCard
            title="Resolved"
            icon={Clock}
            value={stats.resolvedIssues}
            description="Completed queries"
            iconClassName="text-green-500"
          />

          <StatsCard
            title="Total Deductions"
            icon={UserMinus}
            value={`${stats.totalDeductions} Days`}
            description="Salary impact"
            iconClassName="text-red-500"
          />

          <StatsCard
            title="Total History"
            icon={AlertTriangle}
            value={stats.totalIssues}
            description="All occurrences"
            iconClassName="text-orange-500"
          />
        </>
      )}
    </div>
  );
}
