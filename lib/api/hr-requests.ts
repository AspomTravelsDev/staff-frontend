"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";

export const getMyHrRequests = async () => {
    const response = await api.get<any>("/api/hr-requests/my");
    if (!response.success) throw new Error(response.error.error);
    return response;
};

export const createHrRequest = async (data: {
    request_type: string;
    department: string;
    reason: string;
    comment?: string;
    quantity: number;
}) => {
    const response = await api.post<any>("/api/hr-requests", data);
    if (!response.success) throw new Error(response.error.error);
    revalidatePath("/my/request-staff");
    revalidatePath("/hr/staff-requests");
    return response.data;
};

export const getAllHrRequests = async () => {
    const response = await api.get<any>("/api/hr-requests");
    if (!response.success) throw new Error(response.error.error);
    return response;
};

export const updateHrRequestStatus = async (
    id: string,
    status: "pending" | "in review" | "interviewing" | "approved" | "rejected"
) => {
    const response = await api.patch<any>(`/api/hr-requests/${id}/status`, {
        status,
    });
    if (!response.success) throw new Error(response.error.error);
    revalidatePath("/my/request-staff");
    revalidatePath("/hr/staff-requests");
    return response.data;
};
