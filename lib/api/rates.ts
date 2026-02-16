"use server";

import { apiClient, shouldMock, type ApiResponse } from "./client";
import { delay } from "@/lib/utils";

export interface Rates {
    internal_rate: number;
    billing_rate: number;
    updated_at: string;
}

// Mock Data
let MOCK_RATES: Rates = {
    internal_rate: 1500,
    billing_rate: 1650,
    updated_at: new Date().toISOString(),
};

export async function getRates(): Promise<ApiResponse<Rates>> {
    if (shouldMock("useMockRates")) {
        await delay(500);
        return {
            success: true,
            data: MOCK_RATES,
        };
    }
    return apiClient<Rates>("/api/rates");
}

export async function updateRates(data: {
    internal_rate: number;
    billing_rate: number;
}): Promise<ApiResponse<Rates>> {
    if (shouldMock("useMockRates")) {
        await delay(800);
        MOCK_RATES = {
            ...MOCK_RATES,
            ...data,
            updated_at: new Date().toISOString(),
        };
        return {
            success: true,
            data: MOCK_RATES,
        };
    }
    return apiClient<Rates>("/api/rates", {
        method: "POST",
        body: data,
    });
}
