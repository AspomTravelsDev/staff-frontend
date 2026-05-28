"use server";

import {
    createCheatsheetSource,
    deleteCheatsheetItem,
    deleteCheatsheetQuestion,
    extractCheatsheetSource,
    updateCheatsheetItem,
    updateCheatsheetQuestion,
    updateCheatsheetSource,
    getAdminDepartmentAttempts,
} from "@/lib/api/cheatsheet-admin";
import type {
    CheatsheetItemAdmin,
    CheatsheetQuestionAdmin,
    CheatsheetSource,
    CheatsheetQuizAttempt,
} from "@/types/cheatsheet-types";

export async function createCheatsheetSourceAction(payload: {
    title?: string | null;
    content: string;
}): Promise<{ success: boolean; data?: CheatsheetSource; error?: string }> {
    try {
        const data = await createCheatsheetSource(payload);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create source",
        };
    }
}

export async function updateCheatsheetSourceAction(
    id: string,
    payload: Partial<{
        title: string | null;
        content: string;
        status: "draft" | "active" | "archived";
        metadata: Record<string, unknown> | null;
    }>,
): Promise<{ success: boolean; data?: CheatsheetSource; error?: string }> {
    try {
        const data = await updateCheatsheetSource(id, payload);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update source",
        };
    }
}

export async function extractCheatsheetSourceAction(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        await extractCheatsheetSource(id);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to extract",
        };
    }
}

export async function updateCheatsheetItemAction(
    id: string,
    payload: Partial<{
        title: string;
        content: string;
        category: string | null;
        metadata: Record<string, unknown> | null;
        is_active: boolean;
    }>,
): Promise<{ success: boolean; data?: CheatsheetItemAdmin; error?: string }> {
    try {
        const data = await updateCheatsheetItem(id, payload);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update item",
        };
    }
}

export async function updateCheatsheetQuestionAction(
    id: string,
    payload: Partial<{
        question: string;
        options: string[];
        correct_option: string;
        explanation: string | null;
        is_active: boolean;
    }>,
): Promise<{
    success: boolean;
    data?: CheatsheetQuestionAdmin;
    error?: string;
}> {
    try {
        const data = await updateCheatsheetQuestion(id, payload);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update question",
        };
    }
}

export async function deleteCheatsheetItemAction(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteCheatsheetItem(id);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete item",
        };
    }
}

export async function deleteCheatsheetQuestionAction(
    id: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteCheatsheetQuestion(id);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete question",
        };
    }
}

export async function getAdminDepartmentAttemptsAction(
    department: string,
): Promise<{ success: boolean; data?: CheatsheetQuizAttempt[]; error?: string }> {
    try {
        const data = await getAdminDepartmentAttempts(department);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to retrieve department attempts",
        };
    }
}
