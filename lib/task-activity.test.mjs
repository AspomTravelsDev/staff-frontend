import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const exports = {};
new Function("exports", ts.transpileModule(fs.readFileSync(new URL("./task-activity.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports);

test("oversight-only viewers do not request participant notification receipts", () => {
  assert.equal(exports.canReadTaskReceipt({ is_delegated: true, can_manage: false, can_review: false, can_submit: false, can_comment: false }), false);
  assert.equal(exports.canReadTaskReceipt({ can_review: true }), true);
  assert.equal(exports.canReadTaskReceipt({ can_submit: true }), true);
});

test("history and comments settle independently when one request fails", async () => {
  const result = await exports.loadTaskActivity(async () => { throw new Error("History unavailable"); }, async () => ({ success: true, data: { data: [{ body: "Progress update" }] } }));
  assert.equal(result.historyResult.status, "rejected");
  assert.equal(result.commentsResult.status, "fulfilled");
  assert.equal(result.commentsResult.value.data.data[0].body, "Progress update");
});

test("a rejected comments response does not discard successful history", async () => {
  const result = await exports.loadTaskActivity(async () => ({ success: true, data: { data: [{ type: "created" }] } }), async () => ({ success: false, error: { error: "Access denied" } }));
  assert.equal(result.historyResult.value.data.data[0].type, "created");
  assert.equal(result.commentsResult.value.success, false);
});
