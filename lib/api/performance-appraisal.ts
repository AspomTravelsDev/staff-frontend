"use server";

import { api, shouldMock } from "./client";
import { delay } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface KRAScores {
    quality: number[];
    productivity: number[];
    job_knowledge: number[];
    reliability: number[];
    attendance: number[];
    initiative: number[];
    teamwork: number[];
    policy_compliance: number[];
    customer_service: number[];
    communication: number[];
}

export interface PerformanceAppraisal {
    id: string;
    employee_id: string;
    employee_name: string;
    department: string;
    designation: string;
    date_of_joining: string;
    appraisal_type: string;
    period_start: string;
    period_end: string;

    // Three-stage scoring
    self_scores?: KRAScores;
    supervisor_scores?: KRAScores;
    mp_scores?: KRAScores;

    // Workflow
    status: "draft" | "submitted" | "supervisor_review" | "mp_review" | "completed";
    self_submitted_at?: string;
    supervisor_submitted_at?: string;
    mp_submitted_at?: string;

    // Additional
    job_achievements: string;
    new_innovations: string;

    // Final
    overall_rating?: number; // 1-10 from MP
}

export interface AppraisalStats {
    total_appraisals: number;
    pending_self_appraisal: number;
    average_rating: number;
    last_review_date: string | null;
}

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockAppraisals = async (): Promise<PerformanceAppraisal[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/performance-appraisals.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock performance appraisals data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get appraisal history for the current user
 */
export async function getAppraisalHistory(): Promise<PerformanceAppraisal[]> {
    if (shouldMock("useMockPerformance")) {
        await delay(600);
        return getMockAppraisals();
    }

    const result = await api.get<PerformanceAppraisal[]>("/performance/appraisals");
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

/**
 * Get single appraisal by ID
 */
export async function getAppraisalById(id: string): Promise<PerformanceAppraisal> {
    if (shouldMock("useMockPerformance")) {
        await delay(400);
        const appraisals = await getMockAppraisals();
        const appraisal = appraisals.find((a) => a.id === id);
        if (!appraisal) {
            throw new Error("Appraisal not found");
        }
        return appraisal;
    }

    const result = await api.get<PerformanceAppraisal>(`/performance/appraisals/${id}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

/**
 * Get appraisal statistics
 */
export async function getAppraisalStats(): Promise<AppraisalStats> {
    if (shouldMock("useMockPerformance")) {
        await delay(500);
        const appraisals = await getMockAppraisals();

        const totalAppraisals = appraisals.length;
        const pendingSelfAppraisal = appraisals.filter(
            (a) => a.status === "draft"
        ).length;

        // Calculate average rating from completed appraisals
        const completedAppraisals = appraisals.filter(
            (a) => a.status === "completed" && a.overall_rating
        );
        const averageRating =
            completedAppraisals.length > 0
                ? completedAppraisals.reduce((sum, a) => sum + (a.overall_rating || 0), 0) /
                completedAppraisals.length
                : 0;

        // Get last review date
        const lastReviewDate =
            completedAppraisals.length > 0
                ? completedAppraisals
                    .sort(
                        (a, b) =>
                            new Date(b.mp_submitted_at || "").getTime() -
                            new Date(a.mp_submitted_at || "").getTime()
                    )[0]
                    .mp_submitted_at?.split("T")[0] || null
                : null;

        return {
            total_appraisals: totalAppraisals,
            pending_self_appraisal: pendingSelfAppraisal,
            average_rating: averageRating,
            last_review_date: lastReviewDate,
        };
    }

    const result = await api.get<AppraisalStats>("/performance/appraisals/stats");
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

/**
 * Submit self-appraisal
 */
export async function submitSelfAppraisal(
    data: Partial<PerformanceAppraisal>
): Promise<PerformanceAppraisal> {
    if (shouldMock("useMockPerformance")) {
        await delay(800);
        const newAppraisal: PerformanceAppraisal = {
            id: `appr-${Date.now()}`,
            employee_id: "emp-123",
            employee_name: data.employee_name || "Esther Orji",
            department: data.department || "Visa",
            designation: data.designation || "TEAM MEMBER",
            date_of_joining: data.date_of_joining || "2023-01-15",
            appraisal_type: data.appraisal_type || "Annual Review",
            period_start: data.period_start || new Date().toISOString().split("T")[0],
            period_end: data.period_end || new Date().toISOString().split("T")[0],
            status: "submitted",
            self_scores: data.self_scores,
            job_achievements: data.job_achievements || "",
            new_innovations: data.new_innovations || "",
            self_submitted_at: new Date().toISOString(),
        };
        return newAppraisal;
    }

    const result = await api.post<PerformanceAppraisal>("/performance/appraisals", data);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

/**
 * Submit supervisor appraisal
 */
export async function submitSupervisorAppraisal(
    id: string,
    data: { supervisor_scores: KRAScores }
): Promise<PerformanceAppraisal> {
    if (shouldMock("useMockPerformance")) {
        await delay(800);
        const appraisals = await getMockAppraisals();
        const appraisal = appraisals.find((a) => a.id === id);
        if (!appraisal) {
            throw new Error("Appraisal not found");
        }
        return {
            ...appraisal,
            supervisor_scores: data.supervisor_scores,
            status: "mp_review",
            supervisor_submitted_at: new Date().toISOString(),
        };
    }

    const result = await api.post<PerformanceAppraisal>(
        `/performance/appraisals/${id}/supervisor`,
        data
    );
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

/**
 * Submit MP (Managing Partner) appraisal
 */
export async function submitMPAppraisal(
    id: string,
    data: { mp_scores: KRAScores; overall_rating: number }
): Promise<PerformanceAppraisal> {
    if (shouldMock("useMockPerformance")) {
        await delay(800);
        const appraisals = await getMockAppraisals();
        const appraisal = appraisals.find((a) => a.id === id);
        if (!appraisal) {
            throw new Error("Appraisal not found");
        }
        return {
            ...appraisal,
            mp_scores: data.mp_scores,
            overall_rating: data.overall_rating,
            status: "completed",
            mp_submitted_at: new Date().toISOString(),
        };
    }

    const result = await api.post<PerformanceAppraisal>(
        `/performance/appraisals/${id}/mp`,
        data
    );
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}
