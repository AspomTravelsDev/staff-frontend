import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const jsx = await import("react/jsx-runtime");
function pageHarness({ runs = [{ id: "oct", payroll_month: "2026-10" }], selectedRuns = [], fail = false } = {}) {
  const calls = [];
  const ok = data => ({ success: true, data });
  const { load } = actionLoader(() => {}, {
    "react/jsx-runtime": jsx,
    "./components/payroll-manager": { PayrollManager: () => null },
    "./components/salary-settings": { SalarySettings: () => null },
    "@/lib/api/employees": { getEmployees: async () => ({ items: [{ id: "staff" }] }) },
    "@/lib/payroll/months": { currentPayrollMonth: () => "2026-10" },
    "@/lib/api/payroll": {
      listPayrollRuns: async month => { calls.push(["list", month]); return fail ? { success: false } : ok({ data: month ? selectedRuns : runs }); },
      getPayrollRun: async id => { calls.push(["details", id]); return ok({ data: { id, payroll_month: "2026-10", entries: [{ id: "entry" }] } }); },
    },
  });
  return { page: load("app/(admin)/hr/payroll/page.tsx").default, calls };
}

test("server supplies initial payroll details and latest month directly to the workspace", async () => {
  const h = pageHarness();
  const rendered = await h.page({ searchParams: Promise.resolve({ comments: "1" }) });
  const workspace = rendered.props.children[1].props;
  assert.equal(workspace.initialMonth, "2026-10");
  assert.equal(workspace.initialLatestMonth, "2026-10");
  assert.equal(workspace.initialRun.entries[0].id, "entry");
  assert.equal(workspace.commentsOpen, true);
  assert.deepEqual(h.calls, [["list", undefined], ["details", "oct"]]);
});

test("older payroll deep links are fetched even outside the recent run list", async () => {
  const h = pageHarness({ selectedRuns: [{ id: "old", payroll_month: "2024-01" }] });
  const rendered = await h.page({ searchParams: Promise.resolve({ month: "2024-01" }) });
  assert.equal(rendered.props.children[1].props.initialMonth, "2024-01");
  assert.deepEqual(h.calls, [["list", undefined], ["list", "2024-01"], ["details", "old"]]);
});

test("empty payroll starts without a client fetch or invented run", async () => {
  const h = pageHarness({ runs: [] });
  const rendered = await h.page({ searchParams: Promise.resolve({}) });
  assert.equal(rendered.props.children[1].props.initialRun, null);
  assert.deepEqual(h.calls, [["list", undefined]]);
});

test("failed initial loads surface an error instead of rendering false empty totals", async () => {
  const h = pageHarness({ fail: true });
  await assert.rejects(h.page({ searchParams: Promise.resolve({}) }), /Unable to load payroll periods/);
});
