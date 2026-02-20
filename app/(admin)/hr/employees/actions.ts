"use server";

import {
    updateUser,
    updateUserStatus,
    type UpdateUserRequest,
} from "@/lib/api/employees";
import { revalidatePath } from "next/cache";

export async function updateUserAction(
    userId: string,
    data: UpdateUserRequest
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateUser(userId, data);
        revalidatePath("/hr/employees");
        return { success: true };
    } catch (error) {
        console.error("Update user error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update user",
        };
    }
}

export async function updateUserStatusAction(
    userId: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateUserStatus(userId, isActive);
        revalidatePath("/hr/employees");
        return { success: true };
    } catch (error) {
        console.error("Update user status error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update user status",
        };
    }
}
