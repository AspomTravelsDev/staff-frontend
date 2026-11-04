"use client";

import { StatsCard } from "@/components/stats-card";
import { CheckCircle2, Clock, Inbox, Loader2 } from "lucide-react";
import type { RequestStats } from "@/lib/api/requests";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface StatsCardsProps {
  stats: RequestStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";
  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatsCard
        title="Total Requests"
        icon={Inbox}
        value={stats.total}
        description="All time requests"
        iconClassName="text-muted-foreground"
        onClick={() => setStatus("all")}
        active={currentStatus === "all"}
      />

      <StatsCard
        title="Pending"
        icon={Clock}
        value={stats.pending}
        description="Awaiting review"
        iconClassName="text-orange-500"
        onClick={() => setStatus("pending")}
        active={currentStatus === "pending"}
      />

      <StatsCard
        title="In Progress"
        icon={Loader2}
        value={stats.in_progress}
        description="Being processed"
        iconClassName="text-blue-500"
        onClick={() => setStatus("in_progress")}
        active={currentStatus === "in_progress"}
      />

      <StatsCard
        title="Completed"
        icon={CheckCircle2}
        value={stats.completed}
        description="Resolved requests"
        iconClassName="text-green-500"
        onClick={() => setStatus("completed")}
        active={currentStatus === "completed"}
      />
    </div>
  );
}
