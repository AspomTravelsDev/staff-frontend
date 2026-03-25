"use server";

import { apiClient, type ApiResponse } from "./client";

export interface Rates {
    internal_rate: number;
    billing_rate: number;
    updated_at: string;
}

export interface RateHistoryItem {
    id: string;
    internal_rate: number;
    billing_rate: number;
    created_at: string;
    updated_at: string;
}

export interface RateHistoryResponse {
    message: string;
    code: string;
    data: RateHistoryItem[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export async function getRates(): Promise<ApiResponse<Rates>> {
    return apiClient<Rates>("/api/rates");
}

export async function updateRates(data: {
    internal_rate: number;
    billing_rate: number;
}): Promise<ApiResponse<Rates>> {
    return apiClient<Rates>("/api/rates", {
        method: "POST",
        body: data,
    });
}

export async function getRatesHistory(
    from?: string,
    to?: string
): Promise<ApiResponse<RateHistoryResponse>> {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    params.append("per_page", "50");
    return apiClient<RateHistoryResponse>(`/api/rates/history?${params.toString()}`);
}
