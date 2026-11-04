"use client";

import { StatsCard } from "@/components/stats-card";
import { Clock, CheckCircle2, Plane, XCircle } from "lucide-react";
import type { LeaveStats } from "@/lib/api/leave";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface LeaveStatsCardsProps {
  stats: LeaveStats;
}

export function LeaveStatsCards({ stats }: LeaveStatsCardsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("leaveStatus") || "all";
  const activePeriod = searchParams.get("leavePeriod") || "all";
  const selectFilter = (status: string, period = "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("leaveStatus");
    else params.set("leaveStatus", status);
    if (period === "all") params.delete("leavePeriod");
    else params.set("leavePeriod", period);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Pending requests"
        icon={Clock}
        value={stats.requestsPending}
        description="Awaiting approval"
        onClick={() => selectFilter("Pending")}
        active={activeStatus === "Pending" && activePeriod === "all"}
        iconClassName="text-orange-600"
      />

      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Approved (This Month)"
        icon={CheckCircle2}
        value={stats.approvedThisMonth}
        description="Leave granted"
        onClick={() => selectFilter("Approved", "this-month")}
        active={activeStatus === "Approved" && activePeriod === "this-month"}
        iconClassName="text-green-600"
      />

      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Currently on Leave"
        icon={Plane}
        value={stats.onLeave}
        description="Staff away"
        onClick={() => selectFilter("Approved", "active-now")}
        active={activeStatus === "Approved" && activePeriod === "active-now"}
        iconClassName="text-blue-500"
      />

      <StatsCard
        className="gap-2 py-4 shadow-none [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4"
        title="Rejected (This Month)"
        icon={XCircle}
        value={stats.rejectedThisMonth}
        description="Requests denied"
        onClick={() => selectFilter("Rejected", "this-month")}
        active={activeStatus === "Rejected" && activePeriod === "this-month"}
        iconClassName="text-destructive"
      />
    </div>
  );
}
