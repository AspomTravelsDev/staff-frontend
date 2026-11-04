"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getAttendanceRequestPendingCounts, type AttendanceRequestPendingCounts } from "@/lib/api/attendance-request-counts";

export function AttendanceRequestTabs({ active, tabs, initialCounts, viewerId }: { active: string; tabs: { value: string; label: string; disabled?: boolean }[]; initialCounts: AttendanceRequestPendingCounts; viewerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { data: counts } = useQuery({ queryKey: ["attendance-request-counts", viewerId], queryFn: getAttendanceRequestPendingCounts, initialData: initialCounts, staleTime: 60_000, refetchInterval: 60_000 });
  return <Tabs value={active} onValueChange={value => startTransition(() => router.replace(`/hr/attendance-requests?type=${value}`, { scroll: false }))}>
    <TabsList aria-label="Attendance request type" className="flex h-auto max-w-full flex-wrap gap-1 group-data-horizontal/tabs:h-auto">
      {tabs.map(tab => {
        const count = counts[tab.value as keyof AttendanceRequestPendingCounts];
        return <TabsTrigger key={tab.value} value={tab.value} disabled={pending || tab.disabled} title={tab.disabled ? "Not available to your current roles" : count === null ? "Pending request count is temporarily unavailable" : undefined} className="h-8 gap-2 px-3">{tab.label}{!tab.disabled && count !== null && count > 0 && <span aria-label={`${count} pending ${tab.label.toLowerCase()} requests`} className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">{count}</span>}{!tab.disabled && count === null && <span className="text-xs text-muted-foreground" aria-label="Pending request count unavailable">?</span>}</TabsTrigger>;
      })}
    </TabsList>
  </Tabs>;
}
