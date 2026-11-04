import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const { buildEmployeeStatusUpdate } = actionLoader(() => {}).load("lib/employee-status-update.ts");
const fields = { is_active: false, exit_type: "resignation", exit_date: "", exit_reason: "", is_blacklisted: true, blacklist_reason: "  Left without proper notice.  " };

test("blacklisting inactive staff sends its own reason without re-deactivation or invented exit details", () => {
  assert.deepEqual(buildEmployeeStatusUpdate({ status: "Inactive" }, fields), { is_blacklisted: true, blacklist_reason: "Left without proper notice." });
});

test("deactivation still sends required separation fields and blacklisting together", () => {
  assert.deepEqual(buildEmployeeStatusUpdate({ status: "Active" }, { ...fields, exit_date: "2026-10-30", exit_reason: "Separation explanation recorded in detail." }), {
    is_active: false, exit_type: "resignation", exit_date: "2026-10-30", exit_reason: "Separation explanation recorded in detail.", is_blacklisted: true, blacklist_reason: "Left without proper notice.",
  });
});

test("reactivation preserves blacklist history and unchanged active profiles do not resend status", () => {
  assert.deepEqual(buildEmployeeStatusUpdate({ status: "Inactive", is_blacklisted: true }, { ...fields, is_active: true }), { is_active: true, exit_type: null, exit_date: null, exit_reason: null });
  assert.deepEqual(buildEmployeeStatusUpdate({ status: "Active", is_blacklisted: true }, { ...fields, is_active: true }), {});
});
