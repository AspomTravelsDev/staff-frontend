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
    location_method?: "gps" | "ip" | "exempt" | "disabled";
    ip_address?: string;
    distance?: number;
    accuracy?: number;
    office_name?: string;
    device_name?: string;
    is_flagged_proxy?: boolean;
    proxy_reason?: string;
    proxy_matched_user?: {
        id: string;
        name: string;
    } | null;
    user?: {
        name: string;
        email: string;
        image_url?: string;
        first_name?: string;
        last_name?: string;
    };
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
    client_ip?: string,
    deviceData?: {
        device_uuid?: string;
        device_fingerprint?: string;
        device_name?: string;
    }
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    revalidatePath("/my/attendance");
    return api.post<StandardResponse<ClockInRecord>>("/api/clock-in", {
        location,
        client_ip,
        ...(deviceData || {})
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
    page = 1,
    perPage = 50
): Promise<ApiResponse<PaginatedClockInResponse>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (userId && userId !== "all") params.append("user_id", userId);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    return api.get<PaginatedClockInResponse>(`/api/admin/attendance?${params.toString()}`);
}

/**
 * Fetch all clock-in records for the active filters.
 * The backend paginates at a maximum of 100 rows per request, so this
 * helper walks each page and merges the results into one array.
 */
export async function getAllClockInsForFilters(
    from?: string,
    to?: string,
    userId?: string,
    perPage = 100
): Promise<ClockInRecord[]> {
    const firstResponse = await getAllClockIns(from, to, userId, 1, perPage);

    if (!firstResponse.success || !firstResponse.data) {
        return [];
    }

    const firstPage = firstResponse.data.data.data;
    const meta = firstResponse.data.data.meta;

    if (!meta || meta.last_page <= 1) {
        return firstPage;
    }

    const remainingPages = Array.from(
        { length: meta.last_page - 1 },
        (_, index) => index + 2
    );

    const pageResults = await Promise.all(
        remainingPages.map((page) => getAllClockIns(from, to, userId, page, perPage))
    );

    const records = [...firstPage];

    for (const result of pageResults) {
        if (result.success && result.data) {
            records.push(...result.data.data.data);
        }
    }

    return records;
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

/**
 * PATCH /api/admin/attendance/{id}/mark-late
 * Mark a clock-in record as late (default 09:06 AM)
 */
export async function markClockInAsLate(
    recordId: number,
    time?: string
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    revalidatePath("/attendance");
    revalidatePath("/my/attendance");
    return api.patch<StandardResponse<ClockInRecord>>(`/api/admin/attendance/${recordId}/mark-late`, {
        time: time || "09:06",
    });
}

