import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const { buildTaskDailySheet } = actionLoader(() => {}).load("lib/task-daily-export.ts");
const employees = [{ id: "a", name: "Ada" }, { id: "b", name: "Bola" }];
const record = (date, report = true) => ({ user_id: "a", date, first_saved_at: date, report_submitted_at: report ? date : null });

test("leave exports split paid and unpaid days without employment metadata", () => {
  const sheet = buildTaskDailySheet({
    employees: [{ id: "a", name: "Ada", joinDate: "2026-04-20", contract_type: "full_time" }],
    startDate: "2026-10-19", endDate: "2026-10-23",
    leaves: [{ employeeId: "a", status: "Approved", type: "Sick", startDate: "2026-10-19", endDate: "2026-10-26" }],
  });
  assert.deepEqual(sheet.rows.slice(0, 5).map(row => row.a_todo), ["UNPAID LEAVE", "UNPAID LEAVE", "PAID LEAVE", "PAID LEAVE", "PAID LEAVE"]);
  assert.equal(sheet.rows.find(row => row.day === "Total paid leave").a_todo, 3);
  assert.equal(sheet.rows.find(row => row.day === "Total unpaid leave").a_todo, 2);
  assert.ok(!sheet.rows.some(row => /Confirmation|Employment type|Joining date/.test(row.day)));
});

test("weekday export has leave totals with one value per employee and no duplicated leave/absence", () => {
  const sheet = buildTaskDailySheet({ employees, startDate: "2026-10-19", endDate: "2026-10-25",
    records: [record("2026-10-19"), record("2026-10-20", false), record("2026-10-24"), record("2026-10-25")],
    attendance: ["2026-10-19", "2026-10-20"].map(date => ({ user_id: "a", clock_in_at: `${date}T08:00:00Z` })),
    leaves: [
      { employeeId: "a", status: "Approved", startDate: "2026-10-21", endDate: "2026-10-23" },
      { employeeId: "b", status: "Approved", startDate: "2026-10-23", endDate: "2026-10-26" },
      { employeeId: "b", status: "Pending", startDate: "2026-10-20", endDate: "2026-10-21" },
    ],
  });
  assert.equal(sheet.dailyRowCount, 5);
  assert.ok(sheet.rows.every(row => !["Sat", "Sun"].includes(row.day)));
  const totals = sheet.rows.filter(row => row.day.startsWith("Total "));
  assert.deepEqual(totals.map(row => row.day), ["Total Todo sent", "Total report sent", "Total Todo missed", "Total report missed", "Total days absent", "Total leave", "Total paid leave", "Total unpaid leave"]);
  assert.deepEqual(totals.map(row => row.a_todo), [2, 1, 0, 1, 1, 2, 0, 2]);
  assert.deepEqual(totals.map(row => row.b_todo), [0, 0, 0, 0, 4, 1, 0, 1]);
  for (const row of totals) {
    assert.equal(sheet.columns[3].key(row), "");
    assert.equal(sheet.columns[5].key(row), "");
  }
  assert.equal(sheet.rows[4].a_todo, "ABSENT"); // Resumption date is not leave.
});

test("clock-ins use Lagos dates and zero totals remain zero", () => {
  const sheet = buildTaskDailySheet({ employees: employees.slice(0, 1), startDate: "2026-10-19", endDate: "2026-10-19",
    attendance: [{ user_id: "a", clock_in_at: "2026-10-18T23:30:00Z" }],
  });
  assert.equal(sheet.rows[0].a_todo, "NOT SENT");
  assert.equal(sheet.rows.find(row => row.day === "Total Todo missed").a_todo, 1);
  assert.equal(sheet.columns[2].key(sheet.rows.find(row => row.day === "Total leave")), 0);
});

test("weekend-only ranges produce no exported rows or totals", () => {
  const sheet = buildTaskDailySheet({ employees, startDate: "2026-10-24", endDate: "2026-10-25" });
  assert.equal(sheet.dailyRowCount, 0);
  assert.equal(sheet.rows.length, 0);
});

test("overlapping approved leave is counted once per weekday", () => {
  const leave = { employeeId: "a", status: "Approved", startDate: "2026-10-19", endDate: "2026-10-22" };
  const sheet = buildTaskDailySheet({ employees, startDate: "2026-10-19", endDate: "2026-10-21", leaves: [leave, leave] });
  assert.equal(sheet.rows.find(row => row.day === "Total leave").a_todo, 3);
  assert.equal(sheet.rows.find(row => row.day === "Total days absent").a_todo, 0);
});
