import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";
const { confirmationStatus, leavePayStatus, approvedLeavePayStatus } = actionLoader(() => {}).load("lib/export-confirmation.ts");
const employee = { id: "a", name: "Ada", contract_type: "full_time", joinDate: "2026-04-26" };

test("confirmation requires strictly more than six calendar months", () => {
  assert.equal(confirmationStatus(employee, "2026-10-25"), "Not yet confirmed");
  assert.equal(confirmationStatus(employee, "2026-10-26"), "Not yet confirmed");
  assert.equal(confirmationStatus(employee, "2026-10-27"), "Confirmed");
  assert.equal(confirmationStatus({ ...employee, joinDate: "2025-08-31" }, "2026-02-28"), "Not yet confirmed");
  assert.equal(confirmationStatus({ ...employee, joinDate: "2025-08-31" }, "2026-03-01"), "Confirmed");
});
test("excluded staff are not applicable; missing or ambiguous details need review", () => {
  for (const contract_type of ["intern", "nysc", "contract"]) assert.equal(confirmationStatus({ ...employee, contract_type }, "2027-10-26"), "Not applicable");
  for (const changes of [{ contract_type: null }, { contract_type: "part_time" }, { joinDate: null }, { joinDate: "2026-02-30" }, { joinDate: "2027-01-01" }]) assert.equal(confirmationStatus({ ...employee, ...changes }, "2026-10-26"), "Needs review");
});
test("leave pay follows confirmation on each leave day, with explicit policy exceptions", () => {
  const leave = { employeeId: "a", status: "Approved", type: "Sick", startDate: "2026-10-26", endDate: "2026-10-29" };
  assert.equal(approvedLeavePayStatus(employee, [leave], "2026-10-26"), "Unpaid leave");
  assert.equal(approvedLeavePayStatus(employee, [leave], "2026-10-27"), "Paid leave");
  for (const type of ["Annual", "Casual", "Sick", "Maternity", "Exam/Study", "Bereavement"]) assert.equal(leavePayStatus(employee, { ...leave, type }, "2026-10-27"), "Paid leave");
  assert.equal(leavePayStatus(employee, { ...leave, type: "Unpaid" }, "2026-10-27"), "Unpaid leave");
  assert.equal(leavePayStatus({ ...employee, contract_type: "intern" }, leave, "2026-10-27"), "Unpaid leave");
  assert.equal(leavePayStatus(employee, { ...leave, type: "Ante-Natal" }, "2026-10-26"), "Paid leave");
  assert.equal(approvedLeavePayStatus(employee, [leave], "2026-10-29"), null);
  assert.equal(approvedLeavePayStatus(employee, [{ ...leave, status: "Pending" }], "2026-10-27"), null);
});
