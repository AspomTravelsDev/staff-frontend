"use client";

import { StatsCard } from "@/components/stats-card";
import { CheckCircle2, Clock, Inbox, Loader2 } from "lucide-react";
import type { RequestStats } from "@/lib/api/requests";

interface StatsCardsProps {
  stats: RequestStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Requests"
        icon={Inbox}
        value={stats.total}
        description="All time requests"
        iconClassName="text-muted-foreground"
      />

      <StatsCard
        title="Pending"
        icon={Clock}
        value={stats.pending}
        description="Awaiting review"
        iconClassName="text-orange-500"
      />

      <StatsCard
        title="In Progress"
        icon={Loader2}
        value={stats.in_progress}
        description="Being processed"
        iconClassName="text-blue-500"
      />

      <StatsCard
        title="Completed"
        icon={CheckCircle2}
        value={stats.completed}
        description="Resolved requests"
        iconClassName="text-green-500"
      />
    </div>
  );
}
