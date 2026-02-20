"use server";

import { apiClient, type ApiResponse } from "./client";

export interface Rates {
    internal_rate: number;
    billing_rate: number;
    updated_at: string;
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
