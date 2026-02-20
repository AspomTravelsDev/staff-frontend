"use server";

import {
    createRequest,
    updateRequest,
    deleteRequest,
    type UpdateRequestPayload,
} from "@/lib/api/requests";
import type { RequestFormValues } from "@/lib/validations/requests";

export async function createRequestAction(
    data: RequestFormValues
): Promise<{ success: boolean; error?: string }> {
    try {
        await createRequest(data);
        return { success: true };
    } catch (error) {
        console.error("Create request error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to submit request",
        };
    }
}

export async function updateRequestAction(
    id: string,
    data: UpdateRequestPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateRequest(id, data);
        return { success: true };
    } catch (error) {
        console.error("Update request error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to update request",
        };
    }
}

export async function deleteRequestAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteRequest(id);
        return { success: true };
    } catch (error) {
        console.error("Delete request error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to delete request",
        };
    }
}
