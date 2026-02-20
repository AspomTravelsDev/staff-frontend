import { getRates, type Rates } from "@/lib/api/rates";

export async function getCurrentRates(): Promise<Rates> {
    const result = await getRates();
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to fetch rates");
    }
    // Handle backends that wrap data: { data: { internal_rate, billing_rate } }
    const payload = (result.data as any)?.data ?? result.data;
    return payload as Rates;
}
