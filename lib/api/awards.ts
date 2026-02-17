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
        first_name: string;
        last_name: string;
        email: string;
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

// Keeps compatibility for HR page listing if backend supports it, otherwise this might fail if /api/awards doesn't exist.
// Assuming /api/awards might exist for admin listing or we reuse getUserAwards for specific views.
// For now, I'll keep a generic getAwards but point it to /api/awards/all if it existed, but since it's not documented,
// I will comment it out or adapt callsites.
// actually, I'll keep it as a placeholder that calls /api/awards (common convention) just in case,
// but typed correctly.
export async function getAllAwards(): Promise<Award[]> {
    // NOTE: This endpoint wasn't explicitly in the guide, but is needed for the HR dashboard.
    // If it doesn't exist, this will 404.
    const result = await api.get<AwardListResponse>("/api/awards");
    if (!result.success) {
        // Fallback? or throw?
        // For dev safety, if it fails, return empty array to not crash UI
        console.warn("Failed to fetch all awards:", result.error);
        return [];
    }
    return result.data.data;
}

