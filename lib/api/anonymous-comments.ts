"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";

export interface AnonymousComment {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

interface AnonymousCommentListResponse {
    data: AnonymousComment[];
}

interface SubmitCommentResponse {
    message: string;
    data: AnonymousComment;
}

/**
 * Submit an anonymous comment
 */
export async function submitAnonymousComment(content: string): Promise<AnonymousComment> {
    const result = await api.post<SubmitCommentResponse>("/api/anonymous-comments", { content });
    if (!result.success) {
        throw new Error(result.error.error);
    }
    revalidatePath("/hr/anonymous-comments");
    return result.data.data;
}

/**
 * Fetch all anonymous comments (HR/Super only)
 */
export async function getAnonymousComments(): Promise<AnonymousComment[]> {
    const result = await api.get<AnonymousCommentListResponse>("/api/anonymous-comments");
    if (!result.success) {
        console.warn("Failed to fetch anonymous comments:", result.error);
        return [];
    }
    return result.data.data;
}

/**
 * Mark anonymous comments notifications as viewed
 */
export async function markAnonymousCommentsViewed(): Promise<void> {
    const result = await api.post<{ message: string }>("/api/anonymous-comments/mark-viewed");
    if (!result.success) {
        console.warn("Failed to mark anonymous comments notifications viewed:", result.error);
    }
}
