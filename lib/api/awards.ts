"use server";

import { api, shouldMock } from "./client";
import type { PaginatedResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface Award {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    awardType: string;
    date: string;
    reason: string;
    awardedBy: string;
}

export interface AwardStats {
    totalAwards: number;
    thisMonth: number;
    topAwardType: string;
    mostAwardedDept: string;
}

export interface AwardFilters {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    awardType?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface CreateAwardRequest {
    employeeId: string;
    awardType: string;
    date: string;
    reason: string;
}

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockAwards = async (): Promise<Award[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/awards.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock awards data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

export async function getAwards(
    filters: AwardFilters = {}
): Promise<PaginatedResponse<Award>> {
    if (shouldMock("useMockAwards")) {
        const awards = await getMockAwards();
        let filtered = [...awards];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (a) =>
                    a.employeeName.toLowerCase().includes(search) ||
                    a.reason.toLowerCase().includes(search) ||
                    a.awardType.toLowerCase().includes(search)
            );
        }

        if (filters.department) {
            filtered = filtered.filter((a) => a.department === filters.department);
        }

        if (filters.awardType) {
            filtered = filtered.filter((a) => a.awardType === filters.awardType);
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

    // Real API implementation
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const result = await api.get<PaginatedResponse<Award>>(`/awards?${params.toString()}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function getAwardStats(): Promise<AwardStats> {
    if (shouldMock("useMockAwards")) {
        const awards = await getMockAwards();

        const totalAwards = awards.length;

        const today = new Date().toISOString().split('T')[0];
        const currentYearMonth = today.substring(0, 7);
        const thisMonth = awards.filter(a => a.date.startsWith(currentYearMonth)).length;

        // Top Award Type
        const typeCounts: Record<string, number> = {};
        awards.forEach(a => { typeCounts[a.awardType] = (typeCounts[a.awardType] || 0) + 1; });
        let topAwardType = "N/A";
        let maxTypeCount = 0;
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count > maxTypeCount) {
                maxTypeCount = count;
                topAwardType = type;
            }
        });

        // Most Awarded Dept
        const deptCounts: Record<string, number> = {};
        awards.forEach(a => { deptCounts[a.department] = (deptCounts[a.department] || 0) + 1; });
        let mostAwardedDept = "N/A";
        let maxDeptCount = 0;
        Object.entries(deptCounts).forEach(([dept, count]) => {
            if (count > maxDeptCount) {
                maxDeptCount = count;
                mostAwardedDept = dept;
            }
        });

        return {
            totalAwards,
            thisMonth,
            topAwardType,
            mostAwardedDept
        };
    }

    const result = await api.get<AwardStats>("/awards/stats");
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function createAward(data: CreateAwardRequest): Promise<Award> {
    if (shouldMock("useMockAwards")) {
        console.log("Mock: Creating award", data);
        // Return a mock created award
        return {
            id: `new-${Date.now()}`,
            employeeId: data.employeeId,
            employeeName: "Mock Employee", // In a real app we'd fetch the name
            department: "Mock Dept",
            awardType: data.awardType,
            date: data.date,
            reason: data.reason,
            awardedBy: "Current User"
        };
    }

    const result = await api.post<Award>("/awards", data);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}
