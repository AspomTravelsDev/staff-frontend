import { StatsCard } from "@/components/stats-card";
import { Users, UserMinus, UserPlus } from "lucide-react";
import { HeadcountChart } from "./headcount-chart";
import type { Employee, EmployeeStats } from "@/lib/api/employees";

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
  employees: Employee[];
  asOf: string;
  onSelect: (filter: "active" | "inactive" | "new-joiners") => void;
  activeFilter: "all" | "active" | "inactive" | "new-joiners";
}

export function EmployeeStatsCards({
  stats,
  employees,
  asOf,
  onSelect,
  activeFilter,
}: EmployeeStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Active Employees"
        icon={Users}
        value={stats.totalActive}
        description="Currently active staff"
        onClick={() => onSelect("active")}
        active={activeFilter === "active"}
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Inactive Employees"
        icon={UserMinus}
        value={stats.totalInactive}
        description="Former staff members"
        onClick={() => onSelect("inactive")}
        active={activeFilter === "inactive"}
        iconClassName="text-muted-foreground"
      />

      <HeadcountChart employees={employees} asOf={asOf} />

      <StatsCard
        title="New Joiners"
        icon={UserPlus}
        value={stats.newJoiners}
        description="Joined this month"
        onClick={() => onSelect("new-joiners")}
        active={activeFilter === "new-joiners"}
        iconClassName="text-blue-500"
      />
    </div>
  );
}
