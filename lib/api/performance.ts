"use server";

import { PaginatedResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export type ReviewStatus = "Pending" | "In Progress" | "Completed";

export interface Review {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    period: string;
    reviewer: string;
    status: ReviewStatus;
    score: number | null; // scale 1-5
    date: string;
}

export interface PerformanceStats {
    totalReviews: number;
    pendingReviews: number;
    averageScore: string;
    completedThisMonth: number;
}

export interface PerformanceFilters {
    page?: number;
    limit?: number;
    search?: string; // Employee Name
    status?: ReviewStatus;
    period?: string;
}

const USE_REAL_API = true; // Mock toggle

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockReviews = async (): Promise<Review[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/performance.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock performance data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

export async function getReviews(
    filters: PerformanceFilters = {}
): Promise<PaginatedResponse<Review>> {
    if (USE_REAL_API) {
        const reviews = await getMockReviews();
        let filtered = [...reviews];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (r) =>
                    r.employeeName.toLowerCase().includes(search) ||
                    r.reviewer.toLowerCase().includes(search)
            );
        }

        if (filters.status) {
            filtered = filtered.filter(r => r.status === filters.status);
        }

        if (filters.period) {
            filtered = filtered.filter(r => r.period === filters.period);
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

export async function getPerformanceStats(): Promise<PerformanceStats> {
    if (USE_REAL_API) {
        const reviews = await getMockReviews();

        const totalReviews = reviews.length;
        const pendingReviews = reviews.filter(r => r.status !== "Completed").length;

        const completedReviews = reviews.filter(r => r.status === "Completed" && r.score !== null);
        const totalScore = completedReviews.reduce((acc, r) => acc + (r.score || 0), 0);
        const averageScore = completedReviews.length > 0
            ? (totalScore / completedReviews.length).toFixed(1)
            : "0.0";

        const today = new Date().toISOString().split('T')[0];
        const currentYearMonth = today.substring(0, 7);
        const completedThisMonth = reviews.filter(r =>
            r.status === "Completed" && r.date.startsWith(currentYearMonth)
        ).length;


        return {
            totalReviews,
            pendingReviews,
            averageScore,
            completedThisMonth
        }
    }

    return {
        totalReviews: 0,
        pendingReviews: 0,
        averageScore: "0.0",
        completedThisMonth: 0
    }
}
