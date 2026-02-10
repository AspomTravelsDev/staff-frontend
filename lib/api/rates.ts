"use server";

import { apiClient, shouldMock, type ApiResponse } from "./client";
import { delay } from "@/lib/utils";

export interface Rates {
    internalRate: number;
    billingRate: number;
    updatedAt: string;
}

// Mock Data
let MOCK_RATES: Rates = {
    internalRate: 1500,
    billingRate: 1650,
    updatedAt: new Date().toISOString(),
};

export async function getRates(): Promise<ApiResponse<Rates>> {
    if (shouldMock("useMockRates")) {
        await delay(500);
        return {
            success: true,
            data: MOCK_RATES,
        };
    }
    return apiClient<Rates>("/accounts/rates");
}

export async function updateRates(data: {
    internalRate: number;
    billingRate: number;
}): Promise<ApiResponse<Rates>> {
    if (shouldMock("useMockRates")) {
        await delay(800);
        MOCK_RATES = {
            ...MOCK_RATES,
            ...data,
            updatedAt: new Date().toISOString(),
        };
        return {
            success: true,
            data: MOCK_RATES,
        };
    }
    return apiClient<Rates>("/accounts/rates", {
        method: "PUT",
        body: data,
    });
}
