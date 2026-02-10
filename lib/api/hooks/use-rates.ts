import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRates, updateRates } from "../rates";
import { toast } from "sonner";

export const RATES_QUERY_KEY = ["rates"];

export function useRates() {
    return useQuery({
        queryKey: RATES_QUERY_KEY,
        queryFn: async () => {
            const response = await getRates();
            if (!response.success) {
                throw new Error(response.error?.error || "Failed to fetch rates");
            }
            return response.data;
        },
    });
}

export function useUpdateRates() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { internalRate: number; billingRate: number }) => {
            const response = await updateRates(data);
            if (!response.success) {
                throw new Error(response.error?.error || "Failed to update rates");
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RATES_QUERY_KEY });
            toast.success("Rates updated successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
