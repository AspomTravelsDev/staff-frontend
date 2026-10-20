import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("./inventory-tasks.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const { buildInventoryTasks } = exports;
const record = (id, status) => ({ id, status, updatedAt: "2026-10-19T09:00:00Z", assignee: { name: "Demo Staff" } });
const records = ["pending_staff", "pending_officer", "pending_compliance", "return_pending_staff", "return_pending_inspection", "return_pending_compliance"].map((status, id) => record(String(id), status));

test("IT sees only assignment review and return inspection as actionable", () => {
  const tasks = buildInventoryTasks(records, { officer: true, compliance: false });
  assert.deepEqual(tasks.filter((task) => task.actionable).map((task) => task.action), ["Review assignment", "Inspect return"]);
  assert.equal(tasks.filter((task) => !task.actionable).length, 4);
});

test("compliance sees only its own review stages as actionable", () => {
  const tasks = buildInventoryTasks(records, { officer: false, compliance: true });
  assert.deepEqual(tasks.filter((task) => task.actionable).map((task) => task.action), ["Approve assignment", "Review clearance"]);
});

test("dual-role users retain explicit review responsibilities without duplicate tasks", () => {
  const tasks = buildInventoryTasks([...records, ...records], { officer: true, compliance: true });
  assert.equal(tasks.length, 6);
  assert.equal(tasks.filter((task) => task.actionable).length, 4);
  assert.equal(tasks.find((task) => task.action === "Review clearance").owner, "compliance");
});

test("closed tasks disappear and a send-back becomes work for the new responsible party", () => {
  assert.equal(buildInventoryTasks([record("1", "completed"), record("2", "cleared"), record("3", "cancelled")], { officer: true, compliance: true }).length, 0);
  const sentToStaff = buildInventoryTasks([record("1", "pending_staff")], { officer: true, compliance: true })[0];
  assert.equal(sentToStaff.actionable, false);
  assert.equal(sentToStaff.ownerLabel, "Demo Staff");
  const sentToIT = buildInventoryTasks([record("1", "return_pending_inspection")], { officer: true, compliance: false })[0];
  assert.equal(sentToIT.actionable, true);
  assert.equal(sentToIT.kind, "return");
});

test("no operational permissions never grants an action", () => {
  assert.equal(buildInventoryTasks(records, { officer: false, compliance: false }).some((task) => task.actionable), false);
});
