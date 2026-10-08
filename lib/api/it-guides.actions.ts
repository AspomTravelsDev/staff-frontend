"use server";

import { runAction } from "./run-action";
import { ExpectedActionError, type ActionResult } from "./action-result";

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
): Promise<ActionResult<PaginatedResponse<ITGuideItem>>> {
    return runAction(async (): Promise<PaginatedResponse<ITGuideItem>> => {
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
            throw new ExpectedActionError(result.error.error, result.error.code);
        }

        return {
            items: result.data.data,
            pagination: result.data.pagination,
        };
    }, "getITGuides");
}

/**
 * Fetch a single IT guide by ID or Slug
 */
export async function getITGuide(idOrSlug: string): Promise<ActionResult<ITGuideItem | null>> {
    return runAction(async (): Promise<ITGuideItem | null> => {
        const result = await api.get<{ guide: ITGuideItem }>(`/api/it-guides/${idOrSlug}`);
        if (!result.success) {
            if (result.error.code === "HTTP_404") return null;
            throw new ExpectedActionError(result.error.error, result.error.code);
        }
        return result.data.guide;
    }, "getITGuide");
}

/**
 * Create a new IT guide
 */
export async function createITGuide(
    payload: CreateITGuidePayload
): Promise<ActionResult<ITGuideItem>> {
    return runAction(async (): Promise<ITGuideItem> => {
        const result = await api.post<{ guide: ITGuideItem }>(
            "/api/it-guides",
            payload
        );
        if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
        revalidatePath("/admin/it-desk");
        revalidatePath("/my/it");
        return result.data.guide;
    }, "createITGuide");
}

/**
 * Update an IT guide
 */
export async function updateITGuide(
    id: string,
    payload: Partial<CreateITGuidePayload>
): Promise<ActionResult<ITGuideItem>> {
    return runAction(async (): Promise<ITGuideItem> => {
        const result = await api.put<{ guide: ITGuideItem }>(
            `/api/it-guides/${id}`,
            payload
        );
        if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
        revalidatePath("/admin/it-desk");
        revalidatePath("/my/it");
        revalidatePath(`/my/it/${result.data.guide.slug}`);
        return result.data.guide;
    }, "updateITGuide");
}

/**
 * Delete an IT guide
 */
export async function deleteITGuide(id: string): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const result = await api.delete<{ message: string }>(
            `/api/it-guides/${id}`
        );
        if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
        revalidatePath("/admin/it-desk");
        revalidatePath("/my/it");
    }, "deleteITGuide");
}

/**
 * Mark an IT guide as read for the current user
 */
export async function markITGuideAsRead(id: string): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const result = await api.post<{ message: string }>(`/api/it-guides/${id}/mark-read`, {});
        if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
        if (result.success) {
            revalidatePath("/my/it");
            revalidatePath("/admin/it-desk");
            // We might not know the slug here, but normally this is called from the detail page
            // which will have the slug. However, revalidatePath works with the path.
        }
    }, "markITGuideAsRead");
}
