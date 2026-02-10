"use server";

import { PaginatedResponse } from "./types";
import { shouldMock } from "./client";

// ============================================================================
// Types
// ============================================================================

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
export type LeaveType = "Annual Leave" | "Sick Leave" | "Casual Leave" | "Maternity Leave" | "Unpaid Leave" | "Study Leave";

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
}

export interface LeaveStats {
    requestsPending: number;
    approvedThisMonth: number;
    onLeave: number; // Currently on leave
    rejectedThisMonth: number;
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

    return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
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
            r.status === "Rejected" && r.startDate.startsWith(currentYearMonth) // Simplified logic: using start date as proxy for decision date
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

    return {
        requestsPending: 0,
        approvedThisMonth: 0,
        onLeave: 0,
        rejectedThisMonth: 0
    }
}
