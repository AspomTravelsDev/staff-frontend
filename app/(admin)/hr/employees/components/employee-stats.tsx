import { StatsCard } from "@/components/stats-card";
import { Users, UserMinus, UserPlus } from "lucide-react";
import { HeadcountChart } from "./headcount-chart";
import type { Employee, EmployeeStats } from "@/lib/api/employees";

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
  employees: Employee[];
  asOf: string;
}

export function EmployeeStatsCards({
  stats,
  employees,
  asOf,
}: EmployeeStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <HeadcountChart employees={employees} asOf={asOf} />

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
