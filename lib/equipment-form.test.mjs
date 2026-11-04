import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { actionLoader } from "./api/action-test-utils.mjs";

const exports = {};
new Function("exports", ts.transpileModule(fs.readFileSync(new URL("./equipment-form.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports);
const { equipmentFormRows, suggestedEquipmentSelection, equipmentIssueRecords } = exports;
const assignment = (id, type) => ({ id, inventoryItem: { id, name: type, assetType: type } });

test("standard slots remain in management's order without inventing assignments", () => {
  const rows = equipmentFormRows([]);
  assert.deepEqual(rows.map((row) => row.type), ["Laptop", "Laptop charger", "Phone", "Phone charger", "SIM card"]);
  assert.ok(rows.every((row) => !row.assignment));
});

test("duplicate standard items and other equipment append without losing records", () => {
  const rows = equipmentFormRows([assignment("1", "Laptop"), assignment("2", "Laptop"), assignment("3", "Other")]);
  assert.equal(rows.length, 7);
  assert.equal(rows[0].assignment.id, "1");
  assert.equal(rows[5].assignment.id, "2");
  assert.equal(rows[6].assignment.id, "3");
});

test("historical forms use issue snapshots while current lists use current item data", () => {
  const item = { ...assignment("1", "Phone"), assetSnapshot: { id: "1", assetType: "Laptop" } };
  assert.equal(equipmentFormRows([item])[0].assignment.id, "1");
  assert.equal(equipmentFormRows([item], true)[2].assignment.id, "1");
});

test("accessory suggestions include linked items without unrelated employee equipment", () => {
  assert.deepEqual(suggestedEquipmentSelection([{ id: "1" }, { id: "2", parentAssetId: "1" }, { id: "3", parentAssetId: "4" }], "1"), ["1", "2"]);
});

test("grouped issue and acknowledgement preserve every item's payload and batch identity", async () => {
  const checklist = { screen: "N/A", charger: "Original", buttons: "N/A", battery: "N/A", ports: "Working", cameraMic: "N/A", overall: "Clean" };
  const { load } = actionLoader(async (method, endpoint, body) => {
    assert.equal(method, "post");
    if (endpoint === "/api/admin/equipment/issue") {
      assert.equal(body.assignee_id, "staff");
      assert.deepEqual(body.items, [{ id: "1", admin_checklist: checklist }]);
    } else {
      assert.equal(endpoint, "/api/my-equipment/acknowledge");
      assert.equal(body.batch_id, "batch");
      assert.equal(body.agreed_to_terms, true);
      assert.deepEqual(body.items, [{ id: "1", condition_rating: "Good", condition_details: "Working normally", staff_checklist: checklist }]);
    }
    return { success: true, data: { data: [] } };
  });
  const api = load("lib/api/inventory.ts");
  await api.issueEquipment({ assigneeId: "staff", items: [{ id: "1", adminChecklist: checklist }] });
  await api.acknowledgeEquipment({ batchId: "batch", agreedToTerms: true, items: [{ id: "1", conditionRating: "Good", conditionDetails: "Working normally", staffChecklist: checklist }] });
});

test("staff export preserves the current issue's recorded contact and approval metadata", async () => {
  const { load } = actionLoader(async () => ({ success: true, data: { data: [{
    id: 1, name: "Laptop", category: "Laptop", status: "Assigned", assigned_to: "staff", condition_rating: "Good",
    current_issue: { id: 9, inventory_item_id: 1, type: "assignment", status: "completed",
      staff_decision: "approved", staff_decided_at: "2026-10-20T08:00:00Z",
      officer_decision: "approved", officer_decided_at: "2026-10-20T09:00:00Z", officer: { id: "it", name: "IT Officer" },
      assignee: { id: "staff", name: "Demo Employee", phone: "08000000000", mobile_phone: "08000000001" },
    },
  }] } }));
  const items = await load("lib/api/inventory.ts").getEmployeeEquipment("staff");
  const records = equipmentIssueRecords(items, { id: "staff", name: "Demo Employee" });
  assert.equal(records[0].id, "9");
  assert.equal(records[0].assignee.phone, "08000000000");
  assert.equal(records[0].assignee.mobile_phone, "08000000001");
  assert.equal(records[0].staffDecidedAt, "2026-10-20T08:00:00Z");
  assert.equal(records[0].officer.name, "IT Officer");
  assert.equal(records[0].inventoryItem.id, "1");
});
