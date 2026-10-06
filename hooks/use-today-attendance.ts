"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTodayStatus, type ClockInRecord } from "@/lib/api/clock-in";
import { useUser } from "@/providers/user-provider";

const ATTENDANCE_CHANGED = "portal-attendance-changed";
const lagosDay = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);

export function useTodayAttendance(initialStatus?: ClockInRecord | null) {
  const { user } = useUser();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [day, setDay] = useState(lagosDay);
  const queryKey = ["today-attendance", userId, day] as const;
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getTodayStatus();
      if (!response.success) throw new Error(response.error.error);
      return response.data.data;
    },
    enabled: !!user && !user.is_department_account,
    initialData: initialStatus && new Date(new Date(initialStatus.clock_in_at).getTime() + 60 * 60 * 1000).toISOString().slice(0, 10) !== day ? undefined : initialStatus,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const refresh = () => {
      setDay(lagosDay());
      void queryClient.invalidateQueries({ queryKey: ["today-attendance", userId] });
    };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === ATTENDANCE_CHANGED && event.newValue === userId) refresh();
    };
    // A daily key prevents yesterday's "Work Completed" state persisting overnight.
    const timer = setInterval(() => setDay(lagosDay()), 30_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient, userId]);

  const updateStatus = useCallback(async (record: ClockInRecord) => {
    const currentDay = lagosDay();
    const key = ["today-attendance", userId, currentDay];
    // Cancel an older read so it cannot overwrite the successful mutation result.
    await queryClient.cancelQueries({ queryKey: ["today-attendance", userId] });
    queryClient.setQueryData(key, record);
    setDay(currentDay);
    // Signal other portal tabs without persisting any attendance details.
    try {
      localStorage.removeItem(ATTENDANCE_CHANGED);
      localStorage.setItem(ATTENDANCE_CHANGED, userId ?? "");
    } catch { /* Storage may be unavailable; focus and polling still refresh status. */ }
    void queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient, userId]);

  return { ...query, status: query.data ?? null, updateStatus };
}
