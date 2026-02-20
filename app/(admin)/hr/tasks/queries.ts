import { getAllDailyTasks } from "@/lib/api/tasks";
import type { AllTaskFilters, DailyTaskRecord } from "@/types/task-types";

export async function getHRTasks(filters: AllTaskFilters): Promise<DailyTaskRecord[]> {
    const result = await getAllDailyTasks(filters);
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to fetch tasks");
    }
    return result.data;
}
