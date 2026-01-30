"use client";

import { StatsCard } from "@/components/stats-card";
import { Users, UserPlus, Briefcase, Percent } from "lucide-react";
import type { CRMStats } from "@/lib/api/crm";

interface CRMStatsCardsProps {
  stats: CRMStats;
}

export function CRMStatsCards({ stats }: CRMStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Clients"
        icon={Users}
        value={stats.totalClients}
        description="Active customers"
        iconClassName="text-green-600"
      />

      <StatsCard
        title="New Leads"
        icon={UserPlus}
        value={stats.newLeads}
        description="Potential opportunities"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Active Deals"
        icon={Briefcase}
        value={stats.activeDeals}
        description="In negotiation/qualified"
        iconClassName="text-orange-500"
      />

      <StatsCard
        title="Conversion Rate"
        icon={Percent}
        value={stats.conversionRate}
        description="Lead to customer"
        iconClassName="text-purple-500"
      />
    </div>
  );
}
