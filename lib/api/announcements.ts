"use server";

import { api } from "./client";
import type { PaginatedResponse } from "./types";
import { revalidatePath } from "next/cache";

// ============================================================================
// Types
// ============================================================================

export type AnnouncementType = "announcement" | "newsletter";
export type AnnouncementPriority = "low" | "medium" | "high" | "urgent";
export type AnnouncementStatus = "pending" | "approved" | "rejected";

export interface AnnouncementItem {
    id: string;
    type: AnnouncementType;
    priority: AnnouncementPriority;
    title: string;
    content: string;
    author_id: string;
    author_name: string;
    status: AnnouncementStatus;
    publish_at: string | null;
    published_at: string | null;
    visibility_days: number | null;
    rejection_reason?: string | null;
    created_at: string;
    updated_at: string;
    has_read?: boolean;
    readers?: {
        id: string;
        name: string;
        image_url: string | null;
    }[];
}

export interface CreateAnnouncementPayload {
    type: AnnouncementType;
    priority?: AnnouncementPriority;
    title: string;
    content: string;
    publish_at?: string | null;
    visibility_days?: number | null;
}

export interface AnnouncementFilters {
    page?: number;
    limit?: number;
    status?: AnnouncementStatus;
    author_id?: string;
    type?: AnnouncementType;
}

export interface UpdateAnnouncementPayload {
    status?: AnnouncementStatus;
    publish_at?: string | null;
    rejection_reason?: string | null;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated announcements
 */
export async function getAnnouncements(
    filters: AnnouncementFilters = {}
): Promise<PaginatedResponse<AnnouncementItem>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.author_id) params.append("author_id", filters.author_id);
    if (filters.type) params.append("type", filters.type);

    const result = await api.get<{
        data: AnnouncementItem[];
        pagination: PaginatedResponse<AnnouncementItem>["pagination"];
    }>(`/api/announcements?${params.toString()}`);

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
 * Create a new announcement or newsletter suggestion
 */
export async function createAnnouncement(
    payload: CreateAnnouncementPayload
): Promise<AnnouncementItem> {
    const result = await api.post<{ announcement: AnnouncementItem }>(
        "/api/announcements",
        payload
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/announcements");
    revalidatePath("/my/announcement");
    return result.data.announcement;
}

/**
 * Update an announcement status (admin approve/reject + optional publish_at tweak)
 */
export async function updateAnnouncement(
    id: string,
    payload: UpdateAnnouncementPayload
): Promise<AnnouncementItem> {
    const result = await api.patch<{ announcement: AnnouncementItem }>(
        `/api/announcements/${id}`,
        payload
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/announcements");
    revalidatePath("/my/announcement");
    return result.data.announcement;
}

/**
 * Update announcement content (for authors to edit and resubmit)
 */
export async function updateAnnouncementContent(
    id: string,
    payload: CreateAnnouncementPayload
): Promise<AnnouncementItem> {
    const result = await api.put<{ announcement: AnnouncementItem }>(
        `/api/announcements/${id}`,
        payload
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/my/announcement");
    revalidatePath("/admin/announcements");
    return result.data.announcement;
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
    const result = await api.delete<{ message: string }>(
        `/api/announcements/${id}`
    );
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/my/announcement");
    revalidatePath("/admin/announcements");
}

/**
 * Fetch a single announcement by ID with readers data.
 */
export async function getAnnouncementById(
    id: string
): Promise<AnnouncementItem | null> {
    const result = await api.get<{ announcement: AnnouncementItem }>(
        `/api/announcements/${id}`
    );
    if (!result.success) return null;
    return result.data.announcement;
}

/**
 * Mark an announcement as read by the current user
 */
export async function markAnnouncementAsRead(id: string): Promise<void> {
    const result = await api.post<{ message: string }>(
        `/api/announcements/${id}/read`
    );
    if (!result.success) throw new Error(result.error.error);
    // Revalidating these paths ensures the unread count/dashboard feed updates immediately
    revalidatePath("/dashboard");
    revalidatePath("/my/announcement");
    revalidatePath(`/announcements/${id}`);
}

/** Mark all currently published announcements as read for the current user. */
export async function markAllAnnouncementsAsRead(): Promise<void> {
    const result = await api.post<{ message: string }>("/api/announcements/mark-all-read", {});
    if (!result.success) throw new Error(result.error.error);
}

/**
 * Mark a specific announcement and all published announcements as read in a single server action round-trip
 * without forcing an immediate full re-render of the current /announcements/[id] route.
 */
export async function trackAnnouncementView(id: string): Promise<void> {
    await Promise.all([
        api.post<{ message: string }>(`/api/announcements/${id}/read`),
        api.post<{ message: string }>("/api/announcements/mark-all-read", {}),
    ]);
    revalidatePath("/dashboard");
    revalidatePath("/my/announcement");
}


