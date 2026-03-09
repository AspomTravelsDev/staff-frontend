"use server";

import { api } from "./client";
import type { PaginatedResponse } from "./types";
import { revalidatePath } from "next/cache";

// ============================================================================
// Types
// ============================================================================

export type ITGuideStatus = "draft" | "published";

export interface ITGuideItem {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    author_id: string;
    author_name: string;
    category: string | null;
    status: ITGuideStatus;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    readers?: {
        id: string;
        name: string;
        image_url: string | null;
    }[];
}

export interface CreateITGuidePayload {
    title: string;
    excerpt?: string | null;
    content: string;
    category?: string | null;
    status?: ITGuideStatus;
}

export interface ITGuideFilters {
    page?: number;
    limit?: number;
    status?: ITGuideStatus;
    category?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated IT guides
 */
export async function getITGuides(
    filters: ITGuideFilters = {}
): Promise<PaginatedResponse<ITGuideItem>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.category) params.append("category", filters.category);

    const result = await api.get<{
        data: ITGuideItem[];
        pagination: PaginatedResponse<ITGuideItem>["pagination"];
    }>(`/api/it-guides?${params.toString()}`);

    if (!result.success) {
        return {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
        };
    }

    return {
        items: result.data.data,
        pagination: result.data.pagination,
    };
}

/**
 * Fetch a single IT guide by ID or Slug
 */
export async function getITGuide(idOrSlug: string): Promise<ITGuideItem | null> {
    const result = await api.get<{ guide: ITGuideItem }>(`/api/it-guides/${idOrSlug}`);
    if (!result.success) return null;
    return result.data.guide;
}

/**
 * Create a new IT guide
 */
export async function createITGuide(
    payload: CreateITGuidePayload
): Promise<ITGuideItem> {
    const result = await api.post<{ guide: ITGuideItem }>(
        "/api/it-guides",
        payload
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/it-desk");
    revalidatePath("/my/it");
    return result.data.guide;
}

/**
 * Update an IT guide
 */
export async function updateITGuide(
    id: string,
    payload: Partial<CreateITGuidePayload>
): Promise<ITGuideItem> {
    const result = await api.put<{ guide: ITGuideItem }>(
        `/api/it-guides/${id}`,
        payload
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/it-desk");
    revalidatePath("/my/it");
    revalidatePath(`/my/it/${result.data.guide.slug}`);
    return result.data.guide;
}

/**
 * Delete an IT guide
 */
export async function deleteITGuide(id: string): Promise<void> {
    const result = await api.delete<{ message: string }>(
        `/api/it-guides/${id}`
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/it-desk");
    revalidatePath("/my/it");
}

/**
 * Mark an IT guide as read for the current user
 */
export async function markITGuideAsRead(id: string): Promise<void> {
    const result = await api.post<{ message: string }>(`/api/it-guides/${id}/mark-read`, {});
    if (result.success) {
        revalidatePath("/my/it");
        revalidatePath("/admin/it-desk");
        // We might not know the slug here, but normally this is called from the detail page
        // which will have the slug. However, revalidatePath works with the path.
    }
}
