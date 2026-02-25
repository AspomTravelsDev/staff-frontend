"use server";

import { revalidatePath } from "next/cache";
import {
    createVisaInformation,
    updateVisaInformation,
    deleteVisaInformation,
    type CreateVisaInformationRequest,
    type UpdateVisaInformationRequest
} from "@/lib/api/visa";

export async function createVisaInformationAction(data: CreateVisaInformationRequest) {
    try {
        const info = await createVisaInformation(data);
        revalidatePath("/visa/information-desk");
        return { success: true, data: info };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateVisaInformationAction(id: string, data: UpdateVisaInformationRequest) {
    try {
        const info = await updateVisaInformation(id, data);
        revalidatePath("/visa/information-desk");
        return { success: true, data: info };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteVisaInformationAction(id: string) {
    try {
        await deleteVisaInformation(id);
        revalidatePath("/visa/information-desk");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
