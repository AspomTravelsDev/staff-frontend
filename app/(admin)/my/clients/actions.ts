"use server";

import {
    createClient,
    updateClient,
    deleteClient,
} from "@/lib/api/crm";
import type {
    CreateClientRequest,
    UpdateClientRequest,
    Client,
} from "@/lib/api/crm-constants";
import { revalidatePath } from "next/cache";

export async function createClientAction(
    data: CreateClientRequest
): Promise<{ success: boolean; client?: Client; error?: string }> {
    const result = await createClient(data);
    if (result.success) {
        revalidatePath("/my/clients");
    }
    return result;
}

export async function updateClientAction(
    id: string,
    data: UpdateClientRequest
): Promise<{ success: boolean; client?: Client; error?: string }> {
    const result = await updateClient(id, data);
    if (result.success) {
        revalidatePath("/my/clients");
    }
    return result;
}

export async function deleteClientAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const result = await deleteClient(id);
    if (result.success) {
        revalidatePath("/my/clients");
    }
    return result;
}
