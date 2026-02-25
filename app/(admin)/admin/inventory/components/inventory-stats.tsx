"use client";

import { StatsCard } from "@/components/stats-card";
import { Laptop, Archive, UserCheck, Wrench } from "lucide-react";
import type { InventoryStats } from "@/lib/api/inventory";

interface InventoryStatsCardsProps {
  stats: InventoryStats;
}

export function InventoryStatsCards({ stats }: InventoryStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Devices"
        icon={Laptop}
        value={stats.totalDevices}
        description="All registered assets"
        iconClassName="text-blue-600"
      />

      <StatsCard
        title="In Storage"
        icon={Archive}
        value={stats.inStorage}
        description="Available for assignment"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Assigned"
        icon={UserCheck}
        value={stats.assigned}
        description="Currently with staff"
        iconClassName="text-purple-600"
      />

      <StatsCard
        title="In Repairs"
        icon={Wrench}
        value={stats.inRepairs}
        description="Out for maintenance"
        iconClassName="text-orange-500"
      />
    </div>
  );
}
