"use client";

import { StatsCard } from "@/components/stats-card";
import { Clock, CheckCircle2, Plane, XCircle } from "lucide-react";
import type { LeaveStats } from "@/lib/api/leave";

interface LeaveStatsCardsProps {
  stats: LeaveStats;
}

export function LeaveStatsCards({ stats }: LeaveStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Pending Request"
        icon={Clock}
        value={stats.requestsPending}
        description="Awaiting approval"
        iconClassName="text-orange-600"
      />

      <StatsCard
        title="Approved (This Month)"
        icon={CheckCircle2}
        value={stats.approvedThisMonth}
        description="Leave granted"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Currently on Leave"
        icon={Plane}
        value={stats.onLeave}
        description="Staff away"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Rejected (This Month)"
        icon={XCircle}
        value={stats.rejectedThisMonth}
        description="Requests denied"
        iconClassName="text-destructive"
      />
    </div>
  );
}
