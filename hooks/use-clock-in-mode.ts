"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ClockInMode, ATTENDANCE_CONFIG } from "@/lib/config/attendance";
import { getClockInMode, setClockInMode as apiSetClockInMode } from "@/lib/api/settings";
import { toast } from "sonner";

const QUERY_KEY = ["settings", "clock-in-mode"];
const CACHE_KEY = "aspom:clock_in_mode";

/** Read the locally-cached mode (env fallback) — used as placeholder while API loads */
function getCachedMode(): ClockInMode {
  if (typeof window === "undefined") return ATTENDANCE_CONFIG.mode;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored === "normal" || stored === "qrcode" || stored === "both") return stored;
  } catch { /* ignore */ }
  return ATTENDANCE_CONFIG.mode;
}

/**
 * Hook that reads/writes the clock-in mode.
 *
 * - Fetches the authoritative value from the backend (stored in DB, global across all devices).
 * - Uses localStorage only as an optimistic placeholder while the fetch is in-flight.
 * - Changes made by IT officers are immediately reflected on all devices on next fetch.
 */
export function useClockInMode() {
  const queryClient = useQueryClient();

  const { data: serverMode } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getClockInMode,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every 60 seconds for global changes
    placeholderData: getCachedMode(),
  });

  const mode: ClockInMode = serverMode ?? ATTENDANCE_CONFIG.mode;

  // Keep localStorage in sync with the server value (for faster hydration on next load)
  useEffect(() => {
    if (serverMode) {
      try { localStorage.setItem(CACHE_KEY, serverMode); } catch { /* ignore */ }
    }
  }, [serverMode]);

  const mutation = useMutation({
    mutationFn: apiSetClockInMode,
    onMutate: async (newMode) => {
      // Optimistically update the cache immediately
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, newMode);
      try { localStorage.setItem(CACHE_KEY, newMode); } catch { /* ignore */ }
      return { previous };
    },
    onError: (_err, _newMode, context) => {
      // Roll back on error
      queryClient.setQueryData(QUERY_KEY, context?.previous);
      toast.error("Failed to update clock-in mode. Please try again.");
    },
    onSuccess: () => {
      toast.success("Clock-in mode updated for all staff.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const setMode = useCallback(
    (newMode: ClockInMode) => mutation.mutate(newMode),
    [mutation]
  );

  return {
    mode,
    setMode,
    isSaving: mutation.isPending,
    isButtonEnabled: mode === "normal" || mode === "both",
    isQrCodeEnabled: mode === "qrcode" || mode === "both",
    isLoginAutoClockInEnabled:
      mode !== "qrcode" &&
      process.env.NEXT_PUBLIC_CLOCK_IN_ON_LOGIN !== "false",
  };
}

