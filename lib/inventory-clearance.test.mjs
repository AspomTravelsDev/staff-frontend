import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("./inventory-clearance.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { groupClearances } = exports;

test("clearance comments omit old generated handover text and preserve real staff notes", () => {
  assert.equal(exports.clearanceStaffNotes("Device submitted for offboarding clearance handover."), undefined);
  assert.equal(exports.clearanceStaffNotes("  Device submitted for offboarding clearance handover.  "), undefined);
  assert.equal(exports.clearanceStaffNotes("Charger has a loose cable."), "Charger has a loose cable.");
  assert.equal(exports.clearanceStaffNotes(undefined), undefined);
});
const device = (id, status, batch, staff = "staff-1") => ({ id, status, clearanceBatchId: batch, assignee: { id: staff } });

test("groups a batch while keeping unrelated requests and employees separate", () => {
  const groups = groupClearances([
    device("1", "cleared", "batch-1"), device("2", "return_pending_inspection", "batch-1"),
    device("3", "return_pending_staff"), device("4", "return_pending_staff"),
    device("5", "return_pending_staff", "batch-1", "staff-2"),
  ]);
  assert.equal(groups.length, 4);
  assert.equal(groups[0].devices.length, 2);
  assert.equal(groups[0].cleared, 1);
  assert.equal(groups[0].complete, false);
  assert.equal(groups[0].stage, 1);
});

test("progress waits on the earliest outstanding device and ignores duplicate queue records", () => {
  const groups = groupClearances([
    device("1", "return_pending_compliance", "batch"), device("2", "return_pending_staff", "batch"),
    device("1", "return_pending_compliance", "batch"),
  ]);
  assert.equal(groups[0].devices.length, 2);
  assert.equal(groups[0].stage, 0);
});

test("only all-cleared batches are complete; cancellation never implies full clearance", () => {
  const complete = groupClearances([device("1", "cleared", "batch"), device("2", "cleared", "batch")])[0];
  assert.equal(complete.complete, true);
  assert.equal(complete.stage, 3);
  const partial = groupClearances([device("1", "cleared", "batch"), device("2", "cancelled", "batch")])[0];
  assert.equal(partial.complete, false);
  assert.equal(partial.cancelled, 1);
  assert.equal(partial.stage, -1);
});
