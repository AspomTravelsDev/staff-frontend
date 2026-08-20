"use client";

import { StatsCard } from "@/components/stats-card";
import { CalendarDays, Stethoscope, Coffee, UserX } from "lucide-react";
import type { LeaveStat } from "../queries";

interface StatCardsProps {
  stats: LeaveStat;
}

export function StatCards({ stats }: StatCardsProps) {
  const allowance = stats.allowance ?? 20;
  const sickInstances = stats.sickInstances ?? 0;
  const statusDesc = stats.isConfirmed ? "Confirmed Staff" : "Probationary Staff";

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Annual Days Left"
        icon={CalendarDays}
        value={stats.totalLeaveDaysLeft}
        description={`Out of ${allowance} allowed (${statusDesc})`}
        iconClassName="text-green-500"
      />

      <StatsCard
        title="Sick Leave Used"
        icon={Stethoscope}
        value={`${stats.sickLeaveTaken || 0}d`}
        description={`${sickInstances}/3 instances used`}
        iconClassName="text-purple-500"
      />

      <StatsCard
        title="Casual Days"
        icon={Coffee}
        value={stats.casualLeaveDays || 0}
        description="Casual days taken"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Total Days Absent"
        icon={UserX}
        value={stats.totalDaysAbsent || 0}
        description="All absent / leave days"
        iconClassName="text-red-500"
      />
    </div>
  );
}
