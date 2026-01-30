"use server";

import { PaginatedResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    status: "Active" | "Inactive";
    joinDate: string;
    exitDate?: string;
}

export interface EmployeeStats {
    totalActive: number;
    totalInactive: number;
    turnoverRate: string; // Percentage e.g. "5.2%"
    newJoiners: number; // This month
}

export interface EmployeeFilters {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: "Active" | "Inactive";
}

const USE_REAL_API = true; // Mock toggle

// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockEmployees = async (): Promise<Employee[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/employees.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock employee data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions
// ============================================================================

export async function getEmployees(
    filters: EmployeeFilters = {}
): Promise<PaginatedResponse<Employee>> {
    if (USE_REAL_API) {
        const employees = await getMockEmployees();
        let filtered = [...employees];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (e) =>
                    e.firstName.toLowerCase().includes(search) ||
                    e.lastName.toLowerCase().includes(search) ||
                    e.email.toLowerCase().includes(search) ||
                    e.id.toLowerCase().includes(search)
            );
        }

        if (filters.department) {
            filtered = filtered.filter(e => e.department === filters.department);
        }

        if (filters.status) {
            filtered = filtered.filter(e => e.status === filters.status);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        // Sort by name default
        filtered.sort((a, b) => a.firstName.localeCompare(b.firstName));

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

export async function getEmployeeStats(): Promise<EmployeeStats> {
    if (USE_REAL_API) {
        const employees = await getMockEmployees();

        const totalActive = employees.filter(e => e.status === "Active").length;
        const totalInactive = employees.filter(e => e.status === "Inactive").length;

        // Mock turnover calculation (Inactive / Total * 100)
        const total = totalActive + totalInactive;
        const turnoverRate = total > 0 ? ((totalInactive / total) * 100).toFixed(1) + "%" : "0%";

        // New joiners this month (Mock logic: joinDate in current month/year)
        // For simplicity reusing static data, let's just count those from 2024
        const newJoiners = employees.filter(e => e.joinDate.startsWith("2024")).length;

        return {
            totalActive,
            totalInactive,
            turnoverRate,
            newJoiners
        }
    }

    return {
        totalActive: 0,
        totalInactive: 0,
        turnoverRate: "0%",
        newJoiners: 0
    }
}
