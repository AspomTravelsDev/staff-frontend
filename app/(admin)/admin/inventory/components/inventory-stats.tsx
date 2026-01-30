"use client";

import { StatsCard } from "@/components/stats-card";
import { Package, AlertTriangle, DollarSign, XCircle } from "lucide-react";
import type { InventoryStats } from "@/lib/api/inventory";

interface InventoryStatsCardsProps {
  stats: InventoryStats;
}

export function InventoryStatsCards({ stats }: InventoryStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Stock Items"
        icon={Package}
        value={stats.totalItems}
        description="Items in stock"
        iconClassName="text-blue-600"
      />

      <StatsCard
        title="Low Stock"
        icon={AlertTriangle}
        value={stats.lowStock}
        description="Need reordering"
        iconClassName="text-orange-500"
      />

      <StatsCard
        title="Total Value"
        icon={DollarSign}
        value={stats.totalValue}
        description="Inventory valuation"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="Out of Stock"
        icon={XCircle}
        value={stats.outOfStock}
        description="Currently unavailable"
        iconClassName="text-destructive"
      />
    </div>
  );
}
