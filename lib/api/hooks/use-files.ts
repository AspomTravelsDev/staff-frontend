"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadDocument, getAllDocuments, deleteDocument } from "@/lib/api/files";
import { toast } from "sonner";

export const fileQueryKeys = {
    all: ["files"] as const,
    documents: () => [...fileQueryKeys.all, "documents"] as const,
};

export function useDocuments() {
    return useQuery({
        queryKey: fileQueryKeys.documents(),
        queryFn: async () => {
            const result = await getAllDocuments();
            if (!result.success) {
                throw new Error(result.error.error);
            }
            return result.data;
        },
    });
}

export function useUploadDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const result = await uploadDocument(formData);
            if (!result.success) {
                // If it's a 413, we might want a specific error, but the API generic error is fine
                throw new Error(result.error.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fileQueryKeys.documents() });
            toast.success("Document uploaded successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload document");
        }
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (fileId: string) => {
            const result = await deleteDocument(fileId);
            if (!result.success) {
                throw new Error(result.error.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fileQueryKeys.documents() });
            toast.success("Document deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete document");
        }
    });
}
