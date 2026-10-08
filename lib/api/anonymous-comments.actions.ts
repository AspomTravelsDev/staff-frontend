"use server";

import { runAction } from "./run-action";
import { ExpectedActionError, type ActionResult } from "./action-result";

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
export async function submitAnonymousComment(content: string): Promise<ActionResult<AnonymousComment>> {
    return runAction(async (): Promise<AnonymousComment> => {
        const result = await api.post<SubmitCommentResponse>("/api/anonymous-comments", { content });
        if (!result.success) {
            throw new ExpectedActionError(result.error.error, result.error.code);
        }
        revalidatePath("/hr/anonymous-comments");
        return result.data.data;
    }, "submitAnonymousComment");
}

/**
 * Fetch all anonymous comments (HR/Super only)
 */
export async function getAnonymousComments(): Promise<ActionResult<AnonymousComment[]>> {
    return runAction(async (): Promise<AnonymousComment[]> => {
        const result = await api.get<AnonymousCommentListResponse>("/api/anonymous-comments");
        if (!result.success) {
            throw new ExpectedActionError(result.error.error, result.error.code);
        }
        return result.data.data;
    }, "getAnonymousComments");
}

/**
 * Mark anonymous comments notifications as viewed
 */
export async function markAnonymousCommentsViewed(): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const result = await api.post<{ message: string }>("/api/anonymous-comments/mark-viewed");
        if (!result.success) {
            throw new ExpectedActionError(result.error.error, result.error.code);
        }
    }, "markAnonymousCommentsViewed");
}
