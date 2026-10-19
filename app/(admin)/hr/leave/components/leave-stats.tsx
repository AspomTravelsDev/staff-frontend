"use client";

import { StatsCard } from "@/components/stats-card";
import { Clock, CheckCircle2, Plane, XCircle } from "lucide-react";
import type { LeaveStats } from "@/lib/api/leave";

interface LeaveStatsCardsProps {
  stats: LeaveStats;
}

export function LeaveStatsCards({ stats }: LeaveStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Pending requests"
        icon={Clock}
        value={stats.requestsPending}
        description="Awaiting approval"
        iconClassName="text-orange-600"
      />

      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Approved (This Month)"
        icon={CheckCircle2}
        value={stats.approvedThisMonth}
        description="Leave granted"
        iconClassName="text-green-600"
      />

      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Currently on Leave"
        icon={Plane}
        value={stats.onLeave}
        description="Staff away"
        iconClassName="text-blue-500"
      />

      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Rejected (This Month)"
        icon={XCircle}
        value={stats.rejectedThisMonth}
        description="Requests denied"
        iconClassName="text-destructive"
      />
    </div>
  );
}
