import { getRates, getRatesHistory, type Rates, type RateHistoryItem } from "@/lib/api/rates";

export async function getCurrentRates(): Promise<Rates> {
    const result = await getRates();
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to fetch rates");
    }
    // Handle backends that wrap data: { data: { internal_rate, billing_rate } }
    const payload = (result.data as any)?.data ?? result.data;
    return payload as Rates;
}

export async function getRatesHistoryData(
    from?: string,
    to?: string
): Promise<RateHistoryItem[]> {
    const result = await getRatesHistory(from, to);
    if (!result.success) {
        return [];
    }
    const payload = result.data as any;
    return payload?.data ?? [];
}
