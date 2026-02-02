"use client";

import { StatsCard } from "@/components/stats-card";
import { Star, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import type { PerformanceStats } from "@/lib/api/performance";

interface PerformanceStatsCardsProps {
  stats: PerformanceStats;
}

export function PerformanceStatsCards({ stats }: PerformanceStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Avg. Performance Score"
        icon={Star}
        value={stats.averageScore}
        description="Company wide average (5.0 scale)"
        iconClassName="text-yellow-500"
      />

      <StatsCard
        title="Pending Reviews"
        icon={Clock}
        value={stats.pendingReviews}
        description="Awaiting completion"
        iconClassName="text-orange-500"
      />

      <StatsCard
        title="Completed (Month)"
        icon={CheckCircle2}
        value={stats.completedThisMonth}
        description="Reviews finalized"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Total Reviews"
        icon={ClipboardList}
        value={stats.totalReviews}
        description="All recorded sessions"
        iconClassName="text-blue-500"
      />
    </div>
  );
}
