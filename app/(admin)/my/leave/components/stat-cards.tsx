"use client";

import { StatsCard } from "@/components/stats-card";
import { CalendarDays, Coffee, AlertTriangle, UserX } from "lucide-react";
import type { LeaveStat } from "../queries";

interface StatCardsProps {
  stats: LeaveStat;
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Leave Days Left"
        icon={CalendarDays}
        value={stats.totalLeaveDaysLeft}
        description="Out of 20 allowed days"
        iconClassName="text-green-500"
      />

      <StatsCard
        title="Casual Leave Days"
        icon={Coffee}
        value={stats.casualLeaveDays}
        description="Approved casual days"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Emergency Leave Taken"
        icon={AlertTriangle}
        value={stats.emergencyLeaveTaken}
        description="Emergency days used"
        iconClassName="text-orange-500"
      />

      <StatsCard
        title="Total Days Absent"
        icon={UserX}
        value={stats.totalDaysAbsent}
        description="All absent/leave days"
        iconClassName="text-red-500"
      />
    </div>
  );
}
