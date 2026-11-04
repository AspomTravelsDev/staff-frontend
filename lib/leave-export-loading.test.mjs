import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const leave = { employeeId: "staff-1", status: "Approved", type: "Annual", startDate: "2026-10-19", endDate: "2026-10-23" };

test("export action uses the reporting endpoint with the selected dates and employee", async () => {
  const calls = [];
  const { getApprovedLeaveForExport } = actionLoader(async (method, url) => {
    calls.push([method, url]);
    return { success: true, data: { data: [leave] } };
  }).load("lib/api/leave.ts");
  assert.deepEqual(await getApprovedLeaveForExport("2026-10-19", "2026-10-23", "staff-1"), [leave]);
  assert.deepEqual(calls, [["get", "/api/admin/attendance/approved-leaves?from=2026-10-19&to=2026-10-23&user_id=staff-1"]]);
});

test("failed or malformed leave responses cannot become zero-leave results", async () => {
  for (const response of [{ success: false, error: { error: "Forbidden", code: "HTTP_403" } }, { success: true, data: { data: null } }]) {
    const { getApprovedLeaveForExport } = actionLoader(async () => response).load("lib/api/leave.ts");
    await assert.rejects(getApprovedLeaveForExport("2026-10-19", "2026-10-23"));
  }
});

function attendancePage(loadLeaves) {
  return actionLoader(() => {}, {
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@/lib/utils/attendance-charts": { attendanceChartPeriod: (from, to) => ({ from, to }), summarizeAttendanceCharts: () => ({}) },
    "@/lib/utils/attendance": { formatLagosDateForInput: () => "2026-10-26" },
    "@/lib/api/clock-in": { getAllClockInsForFilters: async () => [], getAllClockInStats: async () => ({ success: false }) },
    "@/lib/api/employees": { getEmployees: async () => ({ items: [] }) },
    "@/lib/api/leave": { getApprovedLeaveForExport: loadLeaves },
    "@/lib/api/work-from-home": { getWorkFromHomeRequests: async () => ({ success: false }) },
    "./components/attendance-client": { AttendanceClient: "AttendanceClient" },
  }).load("app/(admin)/attendance/page.tsx").default;
}

test("attendance passes approved leave to the export without discarding it", async () => {
  const page = attendancePage(async (...args) => {
    assert.deepEqual(args, ["2026-10-19", "2026-10-23", "all"]);
    return [leave];
  });
  const result = await page({ searchParams: Promise.resolve({ from: "2026-10-19", to: "2026-10-23" }) });
  assert.deepEqual(result.props.approvedLeaves, [leave]);
  assert.equal(result.props.leaveFailed, false);
});

test("attendance exposes leave-load failure so inaccurate exports are blocked", async () => {
  const page = attendancePage(async () => { throw new Error("Forbidden"); });
  const result = await page({ searchParams: Promise.resolve({ from: "2026-10-19", to: "2026-10-23" }) });
  assert.equal(result.props.leaveFailed, true);
});

test("daily-task page receives approved leave through the reporting source", async () => {
  const jsx = (type, props) => ({ type, props });
  const page = actionLoader(() => {}, {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "date-fns": { format: () => "2026-10-26" },
    "./components/all-tasks-table": { AllTasksTable: "AllTasksTable" },
    "./components/task-filters": { TaskFilters: "TaskFilters" },
    "./components/task-stats": { HRTaskStats: "HRTaskStats" },
    "./components/backfill-report-dialog": { BackfillReportDialog: "BackfillReportDialog" },
    "@/lib/api/tasks": { getDailyTasksOverview: async () => ({ data: [] }) },
    "@/lib/api/clock-in": { getAllClockInsForFilters: async () => [] },
    "@/lib/api/leave": { getApprovedLeaveForExport: async (...args) => {
      assert.deepEqual(args, ["2026-10-19", "2026-10-23", undefined]);
      return [leave];
    } },
  }).load("app/(admin)/hr/tasks/page.tsx").default;
  const result = await page({ searchParams: Promise.resolve({ start_date: "2026-10-19", end_date: "2026-10-23" }) });
  const filters = result.props.children.find(child => child.type === "TaskFilters");
  assert.equal(filters.props.exportError, "");
  assert.deepEqual(filters.props.approvedLeaves, [leave]);
});
