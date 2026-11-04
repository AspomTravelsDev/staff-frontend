import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("a no-action outcome can submit an independent correction plan and retain its saved state", async () => {
  const calls = [];
  const saved = { id: "issue", status: "closed", outcome: "Resolved (No Action)", correction_status: "pending" };
  const { load } = actionLoader((method, endpoint, payload) => {
    calls.push({ method, endpoint, payload });
    return { success: true, data: saved };
  });
  const api = load("lib/api/compliance.ts");
  const plan = { correction_notes: "Correct and verify the record", correction_due_date: "2026-11-02", correction_reminder_days: 2 };
  const result = await api.resolveComplianceOccurrence("issue", "Resolved (No Action)", 0, 0, "", "No sanction required", plan);
  assert.equal(result.data.correction_status, "pending");
  assert.equal(calls[0].payload.correction_required, true);
  for (const [key, value] of Object.entries(plan)) assert.equal(calls[0].payload[key], value);
  await api.saveComplianceCorrection("issue", plan);
  await api.completeComplianceCorrection("issue", "Checked against original source");
  assert.deepEqual(calls.slice(1), [
    { method: "patch", endpoint: "/api/compliance/issue/correction", payload: plan },
    { method: "post", endpoint: "/api/compliance/issue/correction/complete", payload: { correction_completion_notes: "Checked against original source" } },
  ]);
});

test("correction filtering is sent to the server and completion failures remain failures", async () => {
  let requested;
  const { load } = actionLoader((method, endpoint) => {
    requested = endpoint;
    return method === "get" ? { success: true, data: { items: [], pagination: { total: 0 } } } : { success: false, error: { error: "There is no unfinished correction on this query." } };
  });
  const api = load("lib/api/compliance.ts");
  await api.getComplianceIssues({ correction: "overdue" });
  assert.equal(requested, "/api/compliance?correction=overdue");
  assert.deepEqual(await api.completeComplianceCorrection("issue", "Verified"), { success: false, error: "There is no unfinished correction on this query." });
});
