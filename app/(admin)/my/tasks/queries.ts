import { getMyDailyTasks } from "@/lib/api/tasks";
import { format, subDays } from "date-fns";
import type { DailyTaskRecord } from "@/types/task-types";

export async function getTodaysTasks(): Promise<DailyTaskRecord[]> {
    const today = format(new Date(), "yyyy-MM-dd");
    const result = await getMyDailyTasks({ date: today });
    if (!result.success) {
        return [];
    }
    return result.data;
}

export async function getRecentTaskHistory(): Promise<DailyTaskRecord[]> {
    const now = new Date();
    const start_date = format(subDays(now, 7), "yyyy-MM-dd");
    const end_date = format(subDays(now, 1), "yyyy-MM-dd");
    const result = await getMyDailyTasks({ start_date, end_date });
    if (!result.success) {
        return [];
    }
    return result.data;
}
