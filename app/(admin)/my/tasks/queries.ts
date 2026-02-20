import { getMyDailyTasks } from "@/lib/api/tasks";
import { format } from "date-fns";
import type { DailyTaskRecord } from "@/types/task-types";

export async function getTodaysTasks(): Promise<DailyTaskRecord[]> {
    const today = format(new Date(), "yyyy-MM-dd");
    const result = await getMyDailyTasks({ date: today });
    if (!result.success) {
        return [];
    }
    return result.data;
}
