import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { format } from "date-fns";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const user = { id: "staff", name: "Sample Staff", staff_id: "ST-001", department: "Operations" };
const entry = status => ({ id: "entry", user_id: user.id, run: { id: "run", payroll_month: "2026-10", status }, gross_salary: 65000, net_amount: 60000, tax_amount: 3000, deduction_amount: 2000, calculation_snapshot: {} });
const icons = new Proxy({}, { get: () => () => null });

test("payslip history action preserves drafts alongside finalized entries", async () => {
  const entries = [entry("draft"), { ...entry("closed"), id: "closed-entry" }];
  const calls = [];
  const { load } = actionLoader((method, endpoint) => { calls.push([method, endpoint]); return { success: true, data: { data: entries } }; });
  const result = await load("lib/api/payroll.ts").getMyPayrollHistory();
  assert.equal(result.success, true);
  assert.equal(result.data.data.length, 2);
  assert.equal(result.data.data[0].run.status, "draft");
  assert.equal(result.data.data[1].run.status, "closed");
  assert.deepEqual(calls, [["get", "/api/my/payroll/history"]]);
});

test("all unfinished stages retain the provisional payslip watermark and status", () => {
  const { load } = actionLoader(() => {}, { "react/jsx-runtime": runtime, "lucide-react": icons });
  const { PayslipContent } = load("app/(admin)/my/payslip/components/payslip-content.tsx");
  for (const status of ["draft", "hr_draft", "account_review", "compliance_review", "mp_review", "md_approval", "processing"]) {
    const html = renderToStaticMarkup(React.createElement(PayslipContent, { entry: entry(status), user }));
    assert.match(html, /DRAFT/);
    assert.match(html, /Provisional Draft/);
    assert.match(html, /Draft \(/);
    assert.doesNotMatch(html, /Payroll Finalized/);
  }
  const finalized = renderToStaticMarkup(React.createElement(PayslipContent, { entry: entry("closed"), user }));
  assert.match(finalized, /Payroll Finalized/);
  assert.doesNotMatch(finalized, /Provisional Draft|DRAFT-PR-/);
});

test("draft history retains preview controls and both download formats", () => {
  const div = ({ children }) => React.createElement("div", null, children);
  const components = names => Object.fromEntries(names.map(name => [name, div]));
  const { load } = actionLoader(() => {}, {
    react: React, "react/jsx-runtime": runtime, "date-fns": { format }, "lucide-react": icons, "sonner": { toast: {} },
    "@/components/ui/table": components(["Table", "TableBody", "TableCell", "TableHead", "TableHeader", "TableRow"]),
    "@/components/ui/button": { Button: ({ children, title, disabled }) => React.createElement("button", { title, disabled }, children) },
    "@/components/ui/badge": { Badge: div },
    "@/components/ui/dialog": { ...components(["DialogContent", "DialogHeader", "DialogTitle", "DialogDescription"]), Dialog: ({ open, children }) => open ? children : null },
    "@/components/ui/dropdown-menu": components(["DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuTrigger"]),
    "./payslip-document": { PayslipDocument: () => null }, "./payslip-content": { PayslipContent: () => null },
    "@/components/stats-card": { StatsCard: () => null },
  });
  const { PayrollHistory } = load("app/(admin)/my/payslip/components/payroll-history.tsx");
  const html = renderToStaticMarkup(React.createElement(PayrollHistory, { initialEntries: [entry("draft")], user }));
  assert.match(html, /Draft/);
  assert.match(html, /title="Preview Payslip"/);
  assert.match(html, /title="Download Payslip"/);
  assert.match(html, /PDF Format.*\(Draft\)/);
  assert.match(html, /JPG Format.*\(Draft\)/);
  assert.doesNotMatch(html, /disabled=""/);
});
