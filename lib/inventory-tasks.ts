import type { InventoryAssignment } from "./api/inventory";

const stages: Record<string, { owner: "staff" | "officer" | "compliance"; action: string; kind: "assignment" | "return" }> = {
  pending_staff: { owner: "staff", action: "Accept device", kind: "assignment" },
  pending_officer: { owner: "officer", action: "Review assignment", kind: "assignment" },
  pending_compliance: { owner: "compliance", action: "Approve assignment", kind: "assignment" },
  return_pending_staff: { owner: "staff", action: "Complete handover", kind: "return" },
  return_pending_inspection: { owner: "officer", action: "Inspect return", kind: "return" },
  return_pending_compliance: { owner: "compliance", action: "Review clearance", kind: "return" },
};

export function buildInventoryTasks(records: InventoryAssignment[], permissions: { officer: boolean; compliance: boolean }) {
  const unique = new Map(records.map((record) => [record.id, record]));
  return Array.from(unique.values()).flatMap((record) => {
    const stage = stages[record.status];
    if (!stage) return [];
    const actionable = stage.owner === "officer" ? permissions.officer : stage.owner === "compliance" ? permissions.compliance : false;
    const ownerLabel = stage.owner === "staff" ? record.assignee?.name || "Staff member" : stage.owner === "officer" ? "Admin / IT" : "Compliance";
    return [{ record, ...stage, actionable, ownerLabel }];
  }).sort((a, b) => Date.parse(a.record.updatedAt) - Date.parse(b.record.updatedAt));
}
