import type { InventoryAssignment, InventoryItem } from "./api/inventory";

export const standardAssetTypes = ["Laptop", "Laptop charger", "Phone", "Phone charger", "SIM card"] as const;
export const assetTypes = [...standardAssetTypes, "Other"] as const;

export function assetType(item?: InventoryItem): string {
  return item?.assetType || (item?.category === "Laptop" || item?.category === "Phone" ? item.category : "Other");
}

/** Fixed slots describe the form, never implied custody. Duplicate types append below. */
export function equipmentFormRows(assignments: InventoryAssignment[], current = false) {
  const remaining = [...assignments];
  const rows = standardAssetTypes.map((type) => {
    const index = remaining.findIndex((assignment) => assetType(current ? assignment.inventoryItem : assignment.assetSnapshot ?? assignment.inventoryItem) === type);
    return { type: type as string, assignment: index < 0 ? undefined : remaining.splice(index, 1)[0] };
  });
  return [...rows, ...remaining.map((assignment) => ({ type: assetType(current ? assignment.inventoryItem : assignment.assetSnapshot ?? assignment.inventoryItem), assignment }))];
}

export function suggestedEquipmentSelection(items: InventoryItem[], selectedId: string) {
  return items.filter((item) => item.id === selectedId || item.parentAssetId === selectedId).map((item) => item.id);
}

/** Export actual issue evidence, never synthetic approvals from the item's custody state. */
export function equipmentIssueRecords(items: InventoryItem[], staff: NonNullable<InventoryAssignment["assignee"]>, history: InventoryAssignment[] = []): InventoryAssignment[] {
  return items.map((item) => {
    const record = item.currentAssignment ?? history.filter((entry) => entry.inventoryItemId === item.id &&
      entry.assignee?.id === staff.id && (!entry.type || entry.type === "assignment") && entry.staffDecision === "approved")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    return record ? { ...record, inventoryItem: item, assignee: { ...staff, ...record.assignee, phone: record.assignee?.phone || staff.phone, mobile_phone: record.assignee?.mobile_phone || staff.mobile_phone } }
      : { id: `unrecorded-${item.id}`, inventoryItemId: item.id, inventoryItem: item, status: "completed", createdAt: item.createdAt || "", updatedAt: item.updatedAt || "", assignee: staff };
  });
}
