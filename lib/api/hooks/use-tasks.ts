"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskQueryKeys } from "./task-query-keys";
import {
    updateDailyTasks,
    getMyDailyTasks,
    submitDailyReport,
    getAllDailyTasks
} from "@/lib/api/tasks";
import { TaskFilters, AllTaskFilters, CreateTaskRequest, DailyTaskRecord } from "@/types/task-types";
import { toast } from "sonner";

export function useMyDailyTasks(options: TaskFilters & { initialData?: DailyTaskRecord[] }) {
    const { initialData, ...filters } = options;
    return useQuery({
        queryKey: taskQueryKeys.myTasks(filters),
        queryFn: async () => {
            const result = await getMyDailyTasks(filters);
            if (!result.success) {
                throw new Error(result.error.error);
            }
            return result.data;
        },
        initialData,
    });
}

export function useAllDailyTasks(filters: AllTaskFilters) {
    return useQuery({
        queryKey: taskQueryKeys.allTasks(filters),
        queryFn: async () => {
            const result = await getAllDailyTasks(filters);
            if (!result.success) {
                throw new Error(result.error.error);
            }
            return result.data;
        },
    });
}

export function useUpdateDailyTasks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateTaskRequest) => {
            const result = await updateDailyTasks(data);
            if (!result.success) {
                throw new Error(result.error.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
            // toast.success("Tasks saved successfully");
        },
    });
}

export function useSubmitDailyReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await submitDailyReport();
            if (!result.success) {
                throw new Error(result.error.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
            // toast.success("Report submitted successfully");
        },
    });
}
