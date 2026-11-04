"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StatsCard } from "@/components/stats-card";
import { Laptop, Archive, UserCheck, Wrench } from "lucide-react";
import type { InventoryStats } from "@/lib/api/inventory";

interface InventoryStatsCardsProps {
  stats: InventoryStats;
}

export function InventoryStatsCards({ stats }: InventoryStatsCardsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") || "all";
  const filterStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.set("tab", "inventory");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Devices"
        icon={Laptop}
        value={stats.totalDevices}
        description="All registered assets"
        onClick={() => filterStatus("all")}
        active={activeStatus === "all"}
        iconClassName="text-blue-600"
      />

      <StatsCard
        title="In Storage"
        icon={Archive}
        value={stats.inStorage}
        description="Available for assignment"
        onClick={() => filterStatus("Storage")}
        active={activeStatus === "Storage"}
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Assigned"
        icon={UserCheck}
        value={stats.assigned}
        description="Currently with staff"
        onClick={() => filterStatus("Assigned")}
        active={activeStatus === "Assigned"}
        iconClassName="text-purple-600"
      />

      <StatsCard
        title="In Repairs"
        icon={Wrench}
        value={stats.inRepairs}
        description="Out for maintenance"
        onClick={() => filterStatus("Repairs")}
        active={activeStatus === "Repairs"}
        iconClassName="text-orange-500"
      />
    </div>
  );
}
