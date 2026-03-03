"use server";

import { api, type ApiResponse } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

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
    average_clock_in_time?: string;
    earliest_staff_name?: string;
    earliest_staff_time?: string;
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
    revalidatePath("/my/attendance");
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

export interface PaginatedClockInResponse {
    message: string;
    code: string;
    data: {
        data: ClockInRecord[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

/**
 * GET /api/admin/attendance
 * Get global attendance history with filters
 */
export async function getAllClockIns(
    from?: string,
    to?: string,
    userId?: string,
    perPage = 50
): Promise<ApiResponse<PaginatedClockInResponse>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (userId && userId !== "all") params.append("user_id", userId);
    params.append("per_page", perPage.toString());

    return api.get<PaginatedClockInResponse>(`/api/admin/attendance?${params.toString()}`);
}

/**
 * GET /api/admin/attendance/stats
 * Get global summary stats with filters
 */
export async function getAllClockInStats(
    from?: string,
    to?: string,
    userId?: string
): Promise<ApiResponse<StandardResponse<ClockInSummary>>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (userId && userId !== "all") params.append("user_id", userId);

    return api.get<StandardResponse<ClockInSummary>>(`/api/admin/attendance/stats?${params.toString()}`);
}
