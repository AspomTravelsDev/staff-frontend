"use server";

import { api, type ApiResponse } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

export interface ClockInRecord {
    id: number;
    user_id: string;
    clock_in_at: string;
    clock_out_at: string | null;
    is_late_clock_out?: boolean;
    is_half_day?: boolean;
    duration_minutes: number | null;
    is_clocked_in?: boolean; // Sometimes returned by /today
    location_method?: "gps" | "ip" | "exempt" | "disabled" | "qrcode";
    ip_address?: string;
    distance?: number;
    accuracy?: number;
    office_name?: string;
    device_name?: string;
    is_flagged_proxy?: boolean;
    proxy_reason?: string;
    is_late_permitted?: boolean;
    late_permission_reason?: string;
    proxy_matched_user?: {
        id: string;
        name: string;
    } | null;
    user?: {
        name: string;
        email: string;
        department?: string | null;
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
    on_time?: number;
    late_arrivals?: number;
    late_permitted?: number;
    late_clock_outs?: number;
    late_clock_out_staff?: number;
    this_week: number;
    this_month: number;
    average_duration_minutes: number;
    total_minutes_logged: number;
    average_clock_in_time?: string;
    earliest_staff_name?: string;
    earliest_staff_time?: string;
}

export interface LatePermissionRequestItem {
    id: number;
    user_id: string;
    request_date: string;
    request_type?: "late_arrival" | "early_departure" | "half_day";
    expected_arrival_time: string | null;
    expected_clock_out_time?: string | null;
    reason: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
    reviewed_by?: string | null;
    reviewer_note?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
        image_url?: string;
        department?: string;
        role?: string;
        staff_id?: string;
        phone?: string;
    };
    reviewer?: {
        id: string;
        name: string;
        email: string;
    };
    clock_in?: ClockInRecord | null;
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
    },
    qr_scan?: boolean
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    const result = await api.post<StandardResponse<ClockInRecord>>("/api/clock-in", {
        location,
        client_ip,
        ...(deviceData || {}),
        ...(qr_scan !== undefined ? { qr_scan } : {})
    });

    if (result.success) {
        revalidatePath("/my/attendance");
        revalidatePath("/attendance");
        revalidatePath("/attendance/scan");
        revalidatePath("/dashboard");
        revalidatePath("/", "layout");
    }

    return result;
}

/**
 * POST /api/clock-out
 * Clock out for the day
 */
export async function clockOut(
    location?: LocationData,
    client_ip?: string,
    qr_scan?: boolean
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    const result = await api.post<StandardResponse<ClockInRecord>>("/api/clock-out", {
        location,
        client_ip,
        ...(qr_scan !== undefined ? { qr_scan } : {})
    });

    if (result.success) {
        revalidatePath("/my/attendance");
        revalidatePath("/attendance");
        revalidatePath("/attendance/scan");
        revalidatePath("/dashboard");
        revalidatePath("/", "layout");
    }

    return result;
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
    perPage = 50,
    lateClockOutsOnly = false
): Promise<ApiResponse<PaginatedClockInResponse>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (userId && userId !== "all") params.append("user_id", userId);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());
    if (lateClockOutsOnly) params.append("clock_out", "late");

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
    perPage = 100,
    lateClockOutsOnly = false
): Promise<ClockInRecord[]> {
    const firstResponse = await getAllClockIns(from, to, userId, 1, perPage, lateClockOutsOnly);

    if (!firstResponse.success || !firstResponse.data) {
        throw new Error("Unable to load attendance records. Please try again.");
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
        remainingPages.map((page) => getAllClockIns(from, to, userId, page, perPage, lateClockOutsOnly))
    );

    const records = [...firstPage];

    for (const result of pageResults) {
        if (result.success && result.data) {
            records.push(...result.data.data.data);
        } else {
            throw new Error("Unable to load all attendance records. Please try again.");
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
    userId?: string,
    lateClockOutsOnly = false
): Promise<ApiResponse<StandardResponse<ClockInSummary>>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    if (userId && userId !== "all") params.append("user_id", userId);
    if (lateClockOutsOnly) params.append("clock_out", "late");

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

/**
 * PATCH /api/admin/attendance/{id}/flag-proxy
 * Flag a clock-in record as proxy with a reason note
 */
export async function flagClockInAsProxy(
    recordId: number,
    reason: string
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    revalidatePath("/attendance");
    revalidatePath("/my/attendance");
    return api.patch<StandardResponse<ClockInRecord>>(`/api/admin/attendance/${recordId}/flag-proxy`, {
        reason,
    });
}

/**
 * PATCH /api/admin/attendance/{id}/remove-proxy-flag
 * Remove the proxy flag from a clock-in record
 */
export async function removeClockInProxyFlag(
    recordId: number
): Promise<ApiResponse<StandardResponse<ClockInRecord>>> {
    revalidatePath("/attendance");
    revalidatePath("/my/attendance");
    return api.patch<StandardResponse<ClockInRecord>>(`/api/admin/attendance/${recordId}/remove-proxy-flag`, {});
}

/**
 * POST /api/late-permission-requests
 * Submit a request to be late
 */
export async function submitLatePermissionRequest(payload: {
    request_date: string;
    request_type?: "late_arrival" | "early_departure" | "half_day";
    expected_arrival_time?: string;
    expected_clock_out_time?: string;
    reason: string;
}): Promise<ApiResponse<StandardResponse<LatePermissionRequestItem>>> {
    revalidatePath("/my/attendance");
    revalidatePath("/hr/late-requests");
    revalidatePath("/hr/attendance-requests");
    return api.post<StandardResponse<LatePermissionRequestItem>>("/api/late-permission-requests", payload);
}

/**
 * GET /api/late-permission-requests/my
 * Get current staff's late requests
 */
export async function getMyLatePermissionRequests(
    page = 1
): Promise<ApiResponse<StandardResponse<{ data: LatePermissionRequestItem[]; current_page: number; last_page: number; total: number }>>> {
    return api.get<StandardResponse<{ data: LatePermissionRequestItem[]; current_page: number; last_page: number; total: number }>>(`/api/late-permission-requests/my?page=${page}`);
}

/**
 * GET /api/late-permission-requests
 * Get HR review queue for late requests
 */
export async function getLatePermissionReviewQueue(filters?: {
    request_type?: "half_day" | "late_arrival";
    status?: "pending" | "approved" | "rejected" | "cancelled";
    user_id?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: "request_date" | "staff" | "status";
    sort_order?: "asc" | "desc";
}): Promise<ApiResponse<StandardResponse<{
    requests: { data: LatePermissionRequestItem[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
    summary: { total: number; pending: number; approved: number; rejected: number; cancelled: number };
}>>> {
    const params = new URLSearchParams();
    if (filters?.request_type) params.append("request_type", filters.request_type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.user_id && filters.user_id !== "all") params.append("user_id", filters.user_id);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.per_page) params.append("per_page", String(filters.per_page));
    if (filters?.search?.trim()) params.append("search", filters.search.trim());
    if (filters?.sort_by) params.append("sort_by", filters.sort_by);
    if (filters?.sort_order) params.append("sort_order", filters.sort_order);

    return api.get<StandardResponse<{
        requests: { data: LatePermissionRequestItem[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
        summary: { total: number; pending: number; approved: number; rejected: number; cancelled: number };
    }>>(`/api/late-permission-requests?${params.toString()}`);
}

/**
 * POST /api/late-permission-requests/{id}/cancel
 * Cancel a pending late permission request (Staff)
 */
export async function cancelLatePermissionRequest(
    requestId: number
): Promise<ApiResponse<StandardResponse<LatePermissionRequestItem>>> {
    revalidatePath("/attendance");
    revalidatePath("/my/attendance");
    revalidatePath("/hr/late-requests");
    revalidatePath("/hr/attendance-requests");
    return api.post<StandardResponse<LatePermissionRequestItem>>(`/api/late-permission-requests/${requestId}/cancel`, {});
}

/**
 * PATCH /api/late-permission-requests/{id}/review
 * Approve or reject a late permission request (HR / Compliance)
 */
export async function reviewLatePermissionRequest(
    requestId: number,
    payload: { status: "approved" | "rejected"; reviewer_note?: string }
): Promise<ApiResponse<StandardResponse<LatePermissionRequestItem>>> {
    revalidatePath("/attendance");
    revalidatePath("/my/attendance");
    revalidatePath("/hr/late-requests");
    revalidatePath("/hr/attendance-requests");
    return api.patch<StandardResponse<LatePermissionRequestItem>>(`/api/late-permission-requests/${requestId}/review`, payload);
}
