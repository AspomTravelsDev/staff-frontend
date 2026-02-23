"use client";

import { StatsCard } from "@/components/stats-card";
import { Users, UserPlus, Briefcase, TrendingUp } from "lucide-react";
import type { CRMStats } from "@/lib/api/crm-constants";

interface CRMStatsCardsProps {
  stats: CRMStats;
}

export function CRMStatsCards({ stats }: CRMStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Paid Customers"
        icon={Users}
        value={stats.totalPaid}
        description="Converted & paid clients"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="New Potentials"
        icon={UserPlus}
        value={stats.newPotentials}
        description="Fresh enquiries & leads"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Active Deals"
        icon={Briefcase}
        value={stats.activeDeals}
        description="Follow-ups & negotiations"
        iconClassName="text-orange-500"
      />

      <StatsCard
        title="Conversion Rate"
        icon={TrendingUp}
        value={stats.conversionRate}
        description="Potential → paid"
        iconClassName="text-purple-500"
      />
    </div>
  );
}
