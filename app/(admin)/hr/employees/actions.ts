"use server";

import {
    updateUser,
    updateEmployeeContractPeriods,
    updateUserStatus,
    retryEmailRestriction,
    retryEmailRestoration,
    type UpdateUserRequest,
    type EmployeeContractPeriodInput,
    type UpdateUserStatusData,
} from "@/lib/api/employees";
import { revalidatePath } from "next/cache";
import type { EmailRestriction } from "@/types/user-types";

export async function updateUserAction(
    userId: string,
    data: UpdateUserRequest
): Promise<{ success: boolean; error?: string; emailRestriction?: EmailRestriction | null }> {
    try {
        const user = await updateUser(userId, data);
        revalidatePath("/hr/employees");
        revalidatePath("/hr/blacklist");
        return { success: true, emailRestriction: data.is_active !== undefined ? user.email_restriction : undefined };
    } catch (error) {
        console.error("Update user error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update user",
        };
    }
}

export async function updateEmployeeContractPeriodsAction(
    userId: string,
    periods: EmployeeContractPeriodInput[],
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateEmployeeContractPeriods(userId, periods);
        revalidatePath("/hr/employees");
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update contract periods" };
    }
}

export async function updateUserStatusAction(
    userId: string,
    statusData: boolean | UpdateUserStatusData
): Promise<{ success: boolean; error?: string; emailRestriction?: EmailRestriction | null }> {
    try {
        const user = await updateUserStatus(userId, statusData);
        revalidatePath("/hr/employees");
        revalidatePath("/hr/blacklist");
        return { success: true, emailRestriction: user.email_restriction };
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

export async function retryEmailRestrictionAction(userId: string, restore = false): Promise<{ success: boolean; error?: string; emailRestriction?: EmailRestriction }> {
    try {
        const emailRestriction = await (restore ? retryEmailRestoration(userId) : retryEmailRestriction(userId));
        revalidatePath("/hr/employees");
        return { success: true, emailRestriction };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Could not retry company email restriction" };
    }
}

export async function deleteUserAction(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { deleteUser } = await import("@/lib/api/employees");
        await deleteUser(userId);
        revalidatePath("/hr/employees");
        return { success: true };
    } catch (error) {
        console.error("Delete user error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete user",
        };
    }
}
