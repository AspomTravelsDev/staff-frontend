import type { TaskTrackerItem } from "./types/task-tracker";

export function canReadTaskReceipt(task: TaskTrackerItem): boolean {
  return !!(task.can_manage || task.can_submit || task.can_review || task.can_comment);
}

/** Settle activity independently; notification receipts must not block either panel. */
export async function loadTaskActivity<H, C>(history: () => Promise<H>, comments: () => Promise<C>) {
  const [historyResult, commentsResult] = await Promise.allSettled([history(), comments()]);
  return { historyResult, commentsResult };
}
