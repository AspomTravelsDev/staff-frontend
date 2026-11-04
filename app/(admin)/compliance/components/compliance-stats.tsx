"use client";

import { StatsCard } from "@/components/stats-card";
import { AlertTriangle, Clock, Building, UserMinus } from "lucide-react";
import type { ComplianceStats } from "@/lib/api/compliance";

interface ComplianceStatsProps {
  stats: ComplianceStats;
}

export function ComplianceStatsCards({ stats }: ComplianceStatsProps) {
  const isAdmin = stats.isManager ?? !!stats.topOffender;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Open queries"
        icon={Clock}
        value={stats.openIssues}
        description="Awaiting review or response"
        iconClassName="text-muted-foreground"
      />

      {isAdmin ? (
        <>
          <StatsCard
            title="Total queries"
            icon={AlertTriangle}
            value={stats.totalIssues}
            description="Queries raised"
            iconClassName="text-orange-500"
          />

          <StatsCard title="Evidence Needed" icon={AlertTriangle} value={stats.awaitingEvidence ?? 0} description="Open queries without evidence" iconClassName="text-orange-500" />
          <StatsCard title="Staff Replies to Review" icon={Building} value={stats.staffReplies ?? 0} description="Open queries last answered by staff" iconClassName="text-blue-500" />
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
            title="Query history"
            icon={AlertTriangle}
            value={stats.totalIssues}
            description="All compliance queries"
            iconClassName="text-orange-500"
          />
        </>
      )}
    </div>
  );
}
