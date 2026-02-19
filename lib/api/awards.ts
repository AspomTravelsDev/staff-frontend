"use server";

import { api } from "./client";

// ============================================================================
// Types
// ============================================================================

export interface AwardType {
    value: string;
    label: string;
}

export interface AwardedBy {
    id: string;
    name: string;
    email: string;
}

export interface AwardImage {
    id: string;
    url: string;
}

export interface Award {
    id: string;
    user_id: string;
    award_type: string;
    award_name: string; // Display label
    custom_name: string | null;
    month: string; // YYYY-MM
    awarded_at: string; // ISO datetime
    awarded_by: AwardedBy;
    image: AwardImage | null;
    description: string | null;
    // Optional fields for admin lists (if provided by backend)
    user?: {
        id: string;
        name: string;
        email: string;
        staff_id: string;
        role?: string;
        image_url?: string;
        department?: string;
    };
}

export interface AssignAwardRequest {
    user_id: string;
    type: string;
    custom_name?: string; // Required if type="custom"
    month?: string; // YYYY-MM-01
    image_id?: string;
    description?: string;
}

export interface UpdateAwardRequest {
    month?: string; // YYYY-MM-01
    image_id?: string | null; // Pass null to remove
    description?: string;
}

export interface AwardStats {
    totalAwards: number;
    thisMonth: number;
    topAwardType: string;
    mostAwardedDept: string;
}

// Response wrappers
interface AwardTypesResponse {
    types: AwardType[];
}

interface AwardListResponse {
    data: Award[];
    // Pagination might be added later, for now guide says "data": [...]
}

interface UserAwardsResponse {
    user_id: string;
    user_name: string;
    user_department?: string;
    awards: Award[];
}

interface AssignAwardResponse {
    message: string;
    award: Award;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get available award types
 */
export async function getAwardTypes(): Promise<AwardType[]> {
    const result = await api.get<AwardTypesResponse>("/api/awards/types");
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data.types;
}

/**
 * Get logged-in user's awards
 */
export async function getMyAwards(): Promise<Award[]> {
    const result = await api.get<AwardListResponse>("/api/awards/my");
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data.data;
}

/**
 * Get awards for a specific user
 */
export async function getUserAwards(userId: string): Promise<UserAwardsResponse> {
    const result = await api.get<UserAwardsResponse>(`/api/awards/user/${userId}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

/**
 * Assign an award (HR/Super only)
 */
export async function assignAward(data: AssignAwardRequest): Promise<Award> {
    const result = await api.post<AssignAwardResponse>("/api/awards/assign", data);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data.award;
}

/**
 * Update an award
 */
export async function updateAward(awardId: string, data: UpdateAwardRequest): Promise<Award> {
    const result = await api.patch<{ message: string; award: Award }>(`/api/awards/${awardId}`, data);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data.award;
}

/**
 * Delete an award
 */
export async function deleteAward(awardId: string): Promise<void> {
    const result = await api.delete<{ message: string }>(`/api/awards/${awardId}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
}

/**
 * Get all awards
 */
export async function getAllAwards(): Promise<Award[]> {
    const result = await api.get<AwardListResponse>("/api/awards");
    if (!result.success) {
        console.warn("Failed to fetch all awards:", result.error);
        return [];
    }
    return result.data.data;
}

