import { StatsCard } from "@/components/stats-card";
import { Users, UserMinus, TrendingUp, UserPlus } from "lucide-react";
import type { EmployeeStats } from "@/lib/api/employees";

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
}

export function EmployeeStatsCards({ stats }: EmployeeStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Active Employees"
        icon={Users}
        value={stats.totalActive}
        description="Currently active staff"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Inactive Employees"
        icon={UserMinus}
        value={stats.totalInactive}
        description="Former staff members"
        iconClassName="text-muted-foreground"
      />

      <StatsCard
        title="Turnover Rate"
        icon={TrendingUp}
        value={stats.turnoverRate}
        description="Quarterly turnover"
        iconClassName="text-red-500"
      />

      <StatsCard
        title="New Joiners"
        icon={UserPlus}
        value={stats.newJoiners}
        description="Joined this month"
        iconClassName="text-blue-500"
      />
    </div>
  );
}
