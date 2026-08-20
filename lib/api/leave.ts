"use server";

import { PaginatedResponse } from "./types";
import { api, shouldMock } from "./client";
import { revalidatePath } from "next/cache";

// ============================================================================
// Types
// ============================================================================

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
export type LeaveType =
    | "Annual"
    | "Casual"
    | "Emergency"
    | "Sick"
    | "Exam/Study"
    | "Bereavement"
    | "Maternity"
    | "Unpaid"
    | "Ante-Natal"
    | "Special"
    | string;

export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    status: LeaveStatus;
    reason: string;
    attachmentUrl?: string;
    handoverNoteUrl?: string;
    rejectionReason?: string;
    approvedByName?: string;
    approvedAt?: string;
}

export interface LeaveStats {
    requestsPending: number;
    approvedThisMonth: number;
    onLeave: number; // Currently on leave
    rejectedThisMonth: number;
}

export interface MyLeaveStats {
    totalLeaveDaysLeft: number;
    allowance: number;
    casualLeaveDays: number;
    emergencyLeaveTaken: number;
    sickLeaveTaken: number;
    sickInstances: number;
    unpaidLeaveTaken: number;
    studyLeaveTaken: number;
    maternityTaken: boolean;
    totalDaysAbsent: number;
    isConfirmed: boolean;
    tenureMonths: number;
}

export interface LeaveFilters {
    page?: number;
    limit?: number;
    search?: string; // Employee Name
    status?: LeaveStatus;
    department?: string;
}

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockLeaveRequests = async (): Promise<LeaveRequest[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/leave.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock leave data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

export async function getLeaveRequests(
    filters: LeaveFilters = {}
): Promise<PaginatedResponse<LeaveRequest>> {
    if (shouldMock("useMockLeave")) {
        const requests = await getMockLeaveRequests();
        let filtered = [...requests];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (r) =>
                    r.employeeName.toLowerCase().includes(search) ||
                    r.id.toLowerCase().includes(search)
            );
        }

        if (filters.status) {
            filtered = filtered.filter(r => r.status === filters.status);
        }

        if (filters.department) {
            filtered = filtered.filter(r => r.department === filters.department);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        // Sort by status (Pending first), then start date desc
        filtered.sort((a, b) => {
            if (a.status === "Pending" && b.status !== "Pending") return -1;
            if (a.status !== "Pending" && b.status === "Pending") return 1;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });

        return {
            items: filtered.slice((page - 1) * limit, page * limit),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.department) params.append("department", filters.department);
    if (filters.search) params.append("search", filters.search);

    const result = await api.get<{ data: LeaveRequest[] }>(`/api/hr/leave?${params.toString()}`);
    if (!result.success) return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
    
    return {
        items: result.data.data,
        pagination: {
            page: filters.page ?? 1,
            limit: filters.limit ?? 20,
            total: result.data.data.length,
            total_pages: 1
        }
    };
}

export async function getLeaveStats(): Promise<LeaveStats> {
    if (shouldMock("useMockLeave")) {
        const requests = await getMockLeaveRequests();
        const today = new Date().toISOString().split('T')[0];
        const currentYearMonth = today.substring(0, 7); // YYYY-MM

        const requestsPending = requests.filter(r => r.status === "Pending").length;

        const approvedThisMonth = requests.filter(r =>
            r.status === "Approved" && r.startDate.startsWith(currentYearMonth)
        ).length;

        const rejectedThisMonth = requests.filter(r =>
            r.status === "Rejected" && r.startDate.startsWith(currentYearMonth)
        ).length;

        const onLeave = requests.filter(r =>
            r.status === "Approved" &&
            r.startDate <= today &&
            r.endDate >= today
        ).length;

        return {
            requestsPending,
            approvedThisMonth,
            onLeave,
            rejectedThisMonth
        }
    }

    const result = await api.get<{ data: LeaveStats }>("/api/hr/leave/stats");
    if (!result.success) {
        return {
            requestsPending: 0,
            approvedThisMonth: 0,
            onLeave: 0,
            rejectedThisMonth: 0
        };
    }
    return result.data.data;
}

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
    const result = await api.get<{ data: any[] }>("/api/my/leave");
    if (!result.success) return [];
    return result.data.data.map(req => ({
        id: req.id,
        employeeId: "",
        employeeName: "",
        department: "",
        type: req.type as LeaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        days: req.days,
        status: req.status as LeaveStatus,
        reason: req.reason,
        attachmentUrl: req.attachmentUrl,
        handoverNoteUrl: req.handoverNoteUrl,
        rejectionReason: req.rejectionReason,
        approvedByName: req.approvedByName,
        approvedAt: req.approvedAt,
    }));
}

export async function getMyLeaveStats(): Promise<MyLeaveStats> {
    const result = await api.get<{ data: MyLeaveStats }>("/api/my/leave/stats");
    if (!result.success) {
        return {
            totalLeaveDaysLeft: 20,
            allowance: 20,
            casualLeaveDays: 0,
            emergencyLeaveTaken: 0,
            sickLeaveTaken: 0,
            sickInstances: 0,
            unpaidLeaveTaken: 0,
            studyLeaveTaken: 0,
            maternityTaken: false,
            totalDaysAbsent: 0,
            isConfirmed: true,
            tenureMonths: 12,
        };
    }
    return result.data.data;
}

export async function uploadLeaveFile(formData: FormData): Promise<string> {
    formData.append("model_type", "LeaveRequest");
    formData.append("model_id", "temp");
    const result = await api.post<{ data: { download_url: string } }>("/api/files/upload/leave_document", formData);
    if (!result.success) throw new Error(result.error.error || "Failed to upload document");
    return result.data.data.download_url;
}

export async function createLeaveRequest(data: {
    type: string;
    start_date: string;
    days: number;
    reason: string;
    attachment_url?: string;
    handover_note_url?: string;
}) {
    const result = await api.post<{ message: string; data: any }>("/api/my/leave", data);
    if (!result.success) throw new Error(result.error.error || "Failed to create leave request");
    revalidatePath("/my/leave");
    revalidatePath("/hr/leave");
    return result.data;
}

export async function cancelLeaveRequest(id: string) {
    const result = await api.post<{ message: string }>(`/api/my/leave/${id}/cancel`, {});
    if (!result.success) throw new Error(result.error.error || "Failed to cancel leave request");
    revalidatePath("/my/leave");
    revalidatePath("/hr/leave");
    return result.data;
}

export async function approveLeaveRequest(id: string) {
    const result = await api.post<{ message: string }>(`/api/hr/leave/${id}/approve`, {});
    if (!result.success) throw new Error(result.error.error || "Failed to approve leave request");
    revalidatePath("/my/leave");
    revalidatePath("/hr/leave");
    return result.data;
}

export async function rejectLeaveRequest(id: string, reason: string) {
    const result = await api.post<{ message: string }>(`/api/hr/leave/${id}/reject`, { rejection_reason: reason });
    if (!result.success) throw new Error(result.error.error || "Failed to reject leave request");
    revalidatePath("/my/leave");
    revalidatePath("/hr/leave");
    return result.data;
}

export async function markLeaveNotificationsViewed() {
    const result = await api.post<{ message: string }>("/api/my/leave/notifications/mark-viewed", {});
    if (!result.success) throw new Error(result.error.error || "Failed to mark leave notifications viewed");
    return result.data;
}
