"use server";

import { api, shouldMock } from "./client";
import type { PaginatedResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export type Severity = "low" | "medium" | "high" | "critical";
export type ComplianceStatus = "open" | "resolved" | "dismissed";

export interface ComplianceIssue {
    id: string;
    user_id: string;
    user_name: string;
    user_department: string;
    type: string;
    date: string;
    description: string;
    severity: Severity;
    status: ComplianceStatus;
}

export interface ComplianceStats {
    avgClockInTime: string; // e.g., "09:15 AM"
    totalIssues: number;
    topOffender: {
        name: string;
        count: number;
    } | null;
    topDepartment: {
        name: string;
        count: number;
    } | null;
}

export interface ComplianceFilters {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    severity?: Severity;
    status?: ComplianceStatus;
}

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockComplianceIssues = async (): Promise<ComplianceIssue[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/compliance.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock compliance data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

export async function getComplianceIssues(
    filters: ComplianceFilters = {}
): Promise<PaginatedResponse<ComplianceIssue>> {
    if (shouldMock("useMockCompliance")) {
        const issues = await getMockComplianceIssues();
        let filtered = [...issues];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (i) =>
                    i.user_name.toLowerCase().includes(search) ||
                    i.description.toLowerCase().includes(search) ||
                    i.type.toLowerCase().includes(search)
            );
        }
        if (filters.department) {
            filtered = filtered.filter((i) => i.user_department === filters.department);
        }
        if (filters.severity) {
            filtered = filtered.filter((i) => i.severity === filters.severity);
        }
        if (filters.status) {
            filtered = filtered.filter((i) => i.status === filters.status);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

export async function getComplianceStats(): Promise<ComplianceStats> {
    if (shouldMock("useMockCompliance")) {
        const issues = await getMockComplianceIssues();

        // Mock Logic for stats
        const totalIssues = issues.length;

        // Top Offender
        const offenderCounts: Record<string, number> = {};
        issues.forEach(i => {
            offenderCounts[i.user_name] = (offenderCounts[i.user_name] || 0) + 1;
        });
        let topOffender = null;
        let maxOffenses = 0;
        Object.entries(offenderCounts).forEach(([name, count]) => {
            if (count > maxOffenses) {
                maxOffenses = count;
                topOffender = { name, count };
            }
        });

        const deptCounts: Record<string, number> = {};
        issues.forEach(i => {
            deptCounts[i.user_department] = (deptCounts[i.user_department] || 0) + 1;
        });
        let topDepartment = null;
        let maxDeptOffenses = 0;
        Object.entries(deptCounts).forEach(([name, count]) => {
            if (count > maxDeptOffenses) {
                maxDeptOffenses = count;
                topDepartment = { name, count };
            }
        });

        return {
            avgClockInTime: "09: 02 AM",
            totalIssues,
            topOffender,
            topDepartment,
        };
    }

    return {
        avgClockInTime: "--:--",
        totalIssues: 0,
        topOffender: null,
        topDepartment: null
    };
}

export async function addComplianceOccurrence(data: Partial<ComplianceIssue>): Promise<void> {
    if (shouldMock("useMockCompliance")) {
        console.log("Mock: Adding compliance occurrence", data);
        return;
    }
    // Real API call would go here
}
