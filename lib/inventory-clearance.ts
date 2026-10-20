import type { InventoryAssignment } from "./api/inventory";

export const clearanceStages = ["Staff handover", "IT inspection", "Compliance review", "Complete"];

export function clearanceStage(status: string): number {
  return ({ return_pending_staff: 0, return_pending_inspection: 1, return_pending_compliance: 2, cleared: 3 } as Record<string, number>)[status] ?? -1;
}

export function groupClearances(assignments: InventoryAssignment[]) {
  const groups = new Map<string, InventoryAssignment[]>();
  for (const item of assignments) {
    // A single return must never merge into a different request for the employee.
    const key = item.clearanceBatchId
      ? `batch:${item.clearanceBatchId}:staff:${item.assignee?.id ?? "unknown"}`
      : `return:${item.id}`;
    const records = groups.get(key) ?? [];
    if (!records.some((record) => record.id === item.id)) records.push(item);
    groups.set(key, records);
  }
  return Array.from(groups, ([id, devices]) => {
    const cleared = devices.filter((device) => device.status === "cleared").length;
    const cancelled = devices.filter((device) => device.status === "cancelled").length;
    const activeStages = devices.map((device) => clearanceStage(device.status)).filter((stage) => stage >= 0 && stage < 3);
    const stage = activeStages.length ? Math.min(...activeStages) : cleared === devices.length ? 3 : -1;
    return { id, devices, cleared, cancelled, stage, complete: cleared === devices.length };
  });
}
