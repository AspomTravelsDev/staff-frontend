"use client";

import { StatsCard } from "@/components/stats-card";
import { Clock, CalendarCheck, AlertTriangle, Trophy, Moon } from "lucide-react";
import { ClockInSummary } from "@/lib/api/clock-in";

interface AttendanceStatsProps {
  stats: ClockInSummary | null;
  isLoading: boolean;
}

export function AttendanceStats({ stats, isLoading }: AttendanceStatsProps) {
  const totalClockIns = stats ? stats.total_clock_ins.toString() : "0";
  const onTimeDays = String(stats?.on_time ?? 0);
  const lateDays = String(stats?.late_arrivals ?? 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-busy={isLoading}>
      <StatsCard
        title="Total Records"
        icon={Clock}
        value={totalClockIns}
        description="Clock-ins for period"
        variant="dashboard"
        cardColor="blue"
      />
      <StatsCard
        title="On Time"
        icon={CalendarCheck}
        value={onTimeDays}
        description="Arrivals before 9:05 AM"
        variant="dashboard"
        cardColor="green"
      />
      <StatsCard
        title="Late Arrivals"
        icon={AlertTriangle}
        value={lateDays}
        description="Arrivals after 9:05 AM"
        variant="dashboard"
        cardColor="red"
      />
      <StatsCard
        title="Late Clock-outs"
        icon={Moon}
        value={String(stats?.late_clock_outs ?? 0)}
        description={`${stats?.late_clock_out_staff ?? 0} staff · After 8 PM Lagos time`}
        variant="dashboard"
        cardColor="orange"
      />
      <StatsCard
        title="Early Bird Recognition"
        icon={Trophy}
        value={stats?.earliest_staff_name || "-"}
        description={
          stats?.earliest_staff_time
            ? `Avg. Arrival: ${stats.earliest_staff_time}`
            : "Consistently early staff"
        }
        variant="dashboard"
        cardColor="purple"
      />
    </div>
  );
}
