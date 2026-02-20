"use server";

import { api } from "./client";
import { getCurrentUser as getSessionUser } from "@/lib/auth/session";
import { PaginatedResponse } from "./types";
import type { User } from "@/types/user-types";

// ============================================================================
// Types
// ============================================================================

export interface Employee {
    id: string;
    staff_id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    status: "Active" | "Inactive";
    is_supervisor: boolean;
    joinDate: string | null;
    exitDate?: string;
    dob: string | null;
    contract_type: string | null;
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
    sortBy?: "staff_id" | "date_joined" | "name";
    sortOrder?: "asc" | "desc";
}

interface UsersApiResponse {
    message: string;
    code: string;
    data: User[];
}



// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map backend User to frontend Employee
 */
function mapUserToEmployee(user: User): Employee {
    // Split name into first and last name
    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
        id: user.id,
        staff_id: user.staff_id,
        firstName,
        lastName,
        email: user.email,
        phone: user.phone || "",
        department: user.department || "",
        role: user.role,
        status: user.is_active ? "Active" : "Inactive",
        is_supervisor: user.is_supervisor,
        joinDate: user.date_joined || "",
        exitDate: undefined,
        dob: user.dob,
        contract_type: user.contract_type,
    };
}

// ============================================================================
// API Functions
// ============================================================================

export async function getEmployees(
    filters: EmployeeFilters = {}
): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();

    // Map frontend status filter to backend is_active
    if (filters.status === "Active") {
        params.append("is_active", "true");
    } else if (filters.status === "Inactive") {
        params.append("is_active", "false");
    }

    // Backend doesn't support department or search filters
    // We'll fetch all users and filter client-side

    const result = await api.get<UsersApiResponse>(`/api/users?${params.toString()}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }

    // Map User[] to Employee[]
    let employees = result.data.data.map(mapUserToEmployee);

    // Apply client-side filters for unsupported backend filters
    if (filters.search) {
        const search = filters.search.toLowerCase();
        employees = employees.filter(
            (e) =>
                e.firstName.toLowerCase().includes(search) ||
                e.lastName.toLowerCase().includes(search) ||
                e.email.toLowerCase().includes(search) ||
                e.id.toLowerCase().includes(search)
        );
    }

    if (filters.department) {
        employees = employees.filter(e => e.department === filters.department);
    }

    // Apply sorting
    const sortBy = filters.sortBy || "name";
    const sortOrder = filters.sortOrder || "asc";

    employees.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case "staff_id":
                comparison = a.staff_id.localeCompare(b.staff_id);
                break;
            case "date_joined":
                const dateA = a.joinDate ? new Date(a.joinDate).getTime() : 0;
                const dateB = b.joinDate ? new Date(b.joinDate).getTime() : 0;
                comparison = dateA - dateB;
                break;
            case "name":
            default:
                comparison = a.firstName.localeCompare(b.firstName);
                break;
        }

        return sortOrder === "desc" ? -comparison : comparison;
    });

    // Implement client-side pagination
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const total = employees.length;

    return {
        items: employees.slice((page - 1) * limit, page * limit),
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
        },
    };
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
    const result = await api.get<UsersApiResponse>("/api/users");
    if (!result.success) {
        throw new Error(result.error.error);
    }

    const users = result.data.data;

    const totalActive = users.filter(u => u.is_active).length;
    const totalInactive = users.filter(u => !u.is_active).length;

    // Calculate turnover rate (Inactive / Total * 100)
    const total = totalActive + totalInactive;
    const turnoverRate = total > 0 ? ((totalInactive / total) * 100).toFixed(1) + "%" : "0%";

    // New joiners this month (users created in current month/year)
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const newJoiners = users.filter(u => u.created_at.startsWith(currentYearMonth)).length;

    return {
        totalActive,
        totalInactive,
        turnoverRate,
        newJoiners
    };
}

/**
 * Update user active status
 */
export async function updateUserStatus(
    userId: string,
    isActive: boolean
): Promise<User> {
    const result = await api.patch<UsersApiResponse>(`/api/users/${userId}`, {
        is_active: isActive,
    });

    if (!result.success) {
        throw new Error(result.error.error);
    }

    // Backend returns the updated user in the same response format
    return result.data.data[0];
}

/**
 * Update user details
 */
export interface UpdateUserRequest {
    staff_id?: string | null;
    name?: string;
    email?: string;
    phone?: string | null;
    image_url?: string | null;
    role?: string;
    department?: string | null;
    is_supervisor?: boolean;
    net_pay?: number | null;
    is_active?: boolean;
    date_joined?: string | null; // ISO date string (YYYY-MM-DD)
    dob?: string | null;
    contract_type?: string | null;
}

export async function updateUser(
    userId: string,
    data: UpdateUserRequest
): Promise<User> {
    const result = await api.patch<{ message: string; code: string; data: User }>(`/api/users/${userId}`, data);

    if (!result.success) {
        throw new Error(result.error.error);
    }

    // Backend returns the updated user directly (not in an array)
    return result.data.data;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    return getSessionUser();
}
