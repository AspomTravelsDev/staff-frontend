"use server";

import { api } from "@/lib/api/client";
import type { ClockInMode } from "@/lib/config/attendance";

interface ClockInModeResponse {
  message: string;
  code: string;
  data: { clock_in_mode: ClockInMode };
}

/**
 * Fetch the current clock-in mode from the server.
 * Available to all authenticated users.
 */
export async function getClockInMode(): Promise<ClockInMode> {
  const res = await api.get<ClockInModeResponse>("/api/settings/clock-in-mode");
  if (res.success) {
    return res.data.data.clock_in_mode;
  }
  throw new Error(res.error?.error || "Failed to fetch clock-in mode");
}

/**
 * Update the clock-in mode on the server.
 * Restricted to IT officers and super-admins.
 */
export async function setClockInMode(mode: ClockInMode): Promise<void> {
  const res = await api.put<ClockInModeResponse>("/api/settings/clock-in-mode", { mode });
  if (!res.success) {
    throw new Error(res.error?.error || "Failed to update clock-in mode");
  }
}

