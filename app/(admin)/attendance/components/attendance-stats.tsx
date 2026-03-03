"use client";

import { StatsCard } from "@/components/stats-card";
import { Clock, CalendarCheck, AlertTriangle, Trophy } from "lucide-react";
import { ClockInSummary } from "@/lib/api/clock-in";

interface AttendanceStatsProps {
  stats: ClockInSummary | null;
  isLoading: boolean;
}

export function AttendanceStats({ stats, isLoading }: AttendanceStatsProps) {
  const totalClockIns = stats ? stats.total_clock_ins.toString() : "0";
  const onTimeDays =
    stats && "on_time" in stats ? (stats as any).on_time.toString() : "0";
  const lateDays =
    stats && "late_arrivals" in stats
      ? (stats as any).late_arrivals.toString()
      : "0";

  return (
    <div className="grid gap-4 md:grid-cols-4">
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
