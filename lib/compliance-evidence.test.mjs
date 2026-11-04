import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("query creation sends evidence files and every staff ID in one multipart request", async () => {
  let submitted;
  const { load } = actionLoader((method, endpoint, body) => {
    submitted = { method, endpoint, body };
    return { success: true, data: [{ id: "query-1" }] };
  });
  const files = new FormData();
  files.append("evidence_files[]", new Blob(["sample evidence"], { type: "application/pdf" }), "reference.pdf");
  const result = await load("lib/api/compliance.ts").addBatchComplianceOccurrences({
    user_ids: ["staff-a", "staff-b"], type: "Customer Complaint", points: 0.5,
    occurrence_date: "2026-10-30 12:00:00", severity: "low", description: "Review the attached reference", evidence: "Booking reference",
  }, files);
  assert.equal(result.success, true);
  assert.equal(submitted.endpoint, "/api/compliance");
  assert.deepEqual(submitted.body.getAll("user_ids[]"), ["staff-a", "staff-b"]);
  assert.equal(submitted.body.get("points"), "0.5");
  assert.equal(submitted.body.get("evidence"), "Booking reference");
  assert.equal(submitted.body.get("evidence_files[]").name, "reference.pdf");
});

test("failed evidence submissions return failure and preserve the server message", async () => {
  const { load } = actionLoader(() => ({ success: false, error: { error: "The attachment exceeds the allowed size." } }));
  const result = await load("lib/api/compliance.ts").addBatchComplianceOccurrences({ user_ids: ["staff"], type: "Other", occurrence_date: "2026-10-30", severity: "low", description: "Test" }, new FormData());
  assert.equal(result.success, false);
  assert.equal(result.error, "The attachment exceeds the allowed size.");
});
