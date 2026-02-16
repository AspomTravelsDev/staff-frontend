"use server";

import { api, type ApiResponse } from "@/lib/api/client";

export interface ClockInRecord {
    id: number;
    user_id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    duration_minutes: number | null;
    is_clocked_in?: boolean; // Sometimes returned by /today
    location_method?: "gps" | "ip";
    ip_address?: string;
}

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export interface ClockInSummary {
    total_clock_ins: number;
    this_week: number;
    this_month: number;
    average_duration_minutes: number;
    total_minutes_logged: number;
}

export interface StandardResponse<T> {
    message: string;
    code: string;
    data: T;
}

/**
 * GET /api/clock-ins/today
 * Get today's clock-in status
 */
export async function getTodayStatus(): Promise<ApiResponse<StandardResponse<ClockInRecord | null>>> {
    return api.get<StandardResponse<ClockInRecord | null>>("/api/clock-ins/today");
}

/**
 * POST /api/clock-in
 * Clock in for the day
 */
export async function clockIn(
    location?: LocationData,
    client_ip?: string
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    return api.post<StandardResponse<ClockInRecord>>("/api/clock-in", {
        location,
        client_ip
    });
}

/**
 * POST /api/clock-out
 * Clock out for the day
 */
export async function clockOut(
    location?: LocationData,
    client_ip?: string
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    return api.post<StandardResponse<ClockInRecord>>("/api/clock-out", {
        location,
        client_ip
    });
}

/**
 * GET /api/clock-ins
 * Get clock-in history
 */
export async function getClockInHistory(from?: string, to?: string): Promise<ApiResponse<StandardResponse<ClockInRecord[]>>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<StandardResponse<ClockInRecord[]>>(`/api/clock-ins${queryString}`);
}

/**
 * GET /api/clock-ins/summary
 * Get summary stats
 */
export async function getClockInSummary(): Promise<ApiResponse<StandardResponse<ClockInSummary>>> {
    return api.get<StandardResponse<ClockInSummary>>("/api/clock-ins/summary");
}
