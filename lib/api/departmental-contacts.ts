"use server";

import { api } from "./client";

export interface DepartmentalContact {
    id: string;
    department: string;
    contact_name: string;
    email: string | null;
    phone: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface DepartmentalContactsApiResponse {
    message: string;
    code: string;
    data: DepartmentalContact[];
}

export async function getDepartmentalContacts(): Promise<DepartmentalContact[]> {
    const result = await api.get<DepartmentalContactsApiResponse>("/api/departmental-contacts");
    
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to fetch departmental contacts");
    }

    return result.data.data;
}

export async function createDepartmentalContact(data: Partial<DepartmentalContact>): Promise<DepartmentalContact> {
    const result = await api.post<{ message: string; code: string; data: DepartmentalContact }>("/api/departmental-contacts", data);
    
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to create departmental contact");
    }

    return result.data.data;
}

export async function updateDepartmentalContact(id: string, data: Partial<DepartmentalContact>): Promise<DepartmentalContact> {
    const result = await api.patch<{ message: string; code: string; data: DepartmentalContact }>(`/api/departmental-contacts/${id}`, data);
    
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to update departmental contact");
    }

    return result.data.data;
}

export async function deleteDepartmentalContact(id: string): Promise<void> {
    const result = await api.delete<{ message: string; code: string }>(`/api/departmental-contacts/${id}`);
    
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to delete departmental contact");
    }
}
