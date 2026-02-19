import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getRequests,
    getRequestStats,
    createRequest,
    updateRequest,
    deleteRequest,
    type RequestFilters,
    type RequestItem,
} from "../requests";
import type { RequestFormValues } from "@/lib/validations/requests";
import { toast } from "sonner";

// ============================================================================
// Query Hooks
// ============================================================================

export function useRequests(filters: RequestFilters = {}) {
    return useQuery({
        queryKey: queryKeys.requests.list(filters),
        queryFn: () => getRequests(filters),
    });
}

export function useRequestStats() {
    return useQuery({
        queryKey: queryKeys.requests.stats(),
        queryFn: () => getRequestStats(),
    });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RequestFormValues) => createRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
            toast.success("Request submitted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to submit request");
        },
    });
}

export function useUpdateRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RequestFormValues> }) =>
            updateRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
            toast.success("Request updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update request");
        },
    });
}

export function useDeleteRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
            toast.success("Request deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete request");
        },
    });
}
