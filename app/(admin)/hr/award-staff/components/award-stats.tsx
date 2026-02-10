"use client";

import { StatsCard } from "@/components/stats-card";
import { Trophy, Calendar, Star, Building2 } from "lucide-react";
import type { AwardStats } from "@/lib/api/awards";

interface AwardStatsCardsProps {
  stats: AwardStats;
}

export function AwardStatsCards({ stats }: AwardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Awards"
        icon={Trophy}
        value={stats.totalAwards}
        description="All time awards"
        iconClassName="text-yellow-600"
      />

      <StatsCard
        title="Awards This Month"
        icon={Calendar}
        value={stats.thisMonth}
        description="Current month"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Top Award Type"
        icon={Star}
        value={stats.topAwardType}
        description="Most frequent category"
        iconClassName="text-purple-500"
      />

      <StatsCard
        title="Top Department"
        icon={Building2}
        value={stats.mostAwardedDept}
        description="Most awarded team"
        iconClassName="text-green-500"
      />
    </div>
  );
}
