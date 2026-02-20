"use server";

import { revalidatePath } from "next/cache";
import { updateRates } from "@/lib/api/rates";

export async function updateRatesAction(data: {
    internal_rate: number;
    billing_rate: number;
}) {
    const result = await updateRates(data);

    if (!result.success) {
        return { error: result.error?.error || "Failed to update rates" };
    }

    revalidatePath("/accounts/current-rates");
    revalidatePath("/dashboard");
    return { success: true };
}
