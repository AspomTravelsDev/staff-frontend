import { TaskFilters, AllTaskFilters } from "@/types/task-types";

export const taskQueryKeys = {
    all: ["tasks"] as const,
    myTasks: (filters: TaskFilters) => [...taskQueryKeys.all, "my", filters] as const,
    allTasks: (filters: AllTaskFilters) => [...taskQueryKeys.all, "all", filters] as const,
};
