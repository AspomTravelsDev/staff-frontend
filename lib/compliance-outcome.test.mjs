import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

const { complianceOutcomeAmounts, defaultSuspensionDays } = actionLoader(() => {}).load("lib/compliance-outcome.ts");

test("occurrence and suspension amounts are independent", () => {
  assert.deepEqual(complianceOutcomeAmounts("Give Occurrence", 1, 5), { points: 1, deductionDays: 0 });
  assert.deepEqual(complianceOutcomeAmounts("One-day Suspension", 1, 5), { points: 0, deductionDays: 1 });
  assert.deepEqual(complianceOutcomeAmounts("Three-day Suspension", 3, 0), { points: 0, deductionDays: 3 });
  assert.deepEqual(complianceOutcomeAmounts("One-month Suspension", 1, 22), { points: 0, deductionDays: 22 });
  assert.deepEqual(complianceOutcomeAmounts("Resolved (No Action)", 8, 3), { points: 0, deductionDays: 0 });
  assert.equal(defaultSuspensionDays("One-day Suspension"), "1");
  assert.equal(defaultSuspensionDays("One-month Suspension"), "");
});

function find(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(item => find(item, type));
  return [...(tree.type === type ? [tree] : []), ...find(tree.props?.children, type)];
}

function workspace() {
  const issue = { id: "query", type: "Other", status: "open", description: "Check record", points: 1, evidence: "File reviewed", decision_notes: "Finding confirmed", user: { name: "Staff" } };
  const states = [];
  let cursor = 0;
  const calls = [];
  const jsx = (type, props) => ({ type, props });
  const components = names => Object.fromEntries(names.map(name => [name, name]));
  const { load } = actionLoader(() => {}, {
    react: { useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; } },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/providers/user-provider": { useUser: () => ({ user: { id: "officer" } }) },
    "@/lib/api/hooks/use-compliance": { useComplianceQuery: () => ({ data: issue, isFetchedAfterMount: true }) },
    "@/lib/api/compliance": { resolveComplianceOccurrence: async (...args) => { calls.push(args); return { success: true }; } },
    "date-fns": { format: () => "30 Oct" }, "sonner": { toast: { error: message => { throw new Error(message); }, success() {} } },
    "lucide-react": { Loader2: "Loader2" },
    "@/components/ui/dialog": components(["Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription", "DialogFooter"]),
    "@/components/ui/sheet": components(["Sheet", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription", "SheetFooter"]),
    "@/components/ui/avatar": components(["Avatar", "AvatarFallback", "AvatarImage"]),
    "@/components/ui/select": components(["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"]),
    "@/components/ui/button": { Button: "Button" }, "@/components/ui/badge": { Badge: "Badge" },
    "@/components/ui/textarea": { Textarea: "Textarea" }, "@/components/ui/input": { Input: "Input" }, "@/components/ui/label": { Label: "Label" },
    "./decision-policy-fields": { DecisionPolicyFields: "Policy" }, "./correction-plan-fields": { CorrectionPlanFields: "Correction" }, "./query-evidence": { QueryEvidence: "Evidence" },
    "@/lib/utils/employee-headcount": { lagosDateKey: () => "2026-10-30" },
  });
  const { ComplianceDetailsDialog } = load("app/(admin)/compliance/components/compliance-details-dialog.tsx");
  function render() {
    cursor = 0;
    const node = ComplianceDetailsDialog({ open: true, issueId: issue.id, mode: "outcome", isAdmin: true, onOpenChange() {} });
    return node.type(node.props);
  }
  return { render, calls };
}

test("choosing suspension hides occurrences and submits exactly one payroll day", async () => {
  const view = workspace();
  find(view.render(), "Select")[0].props.onValueChange("One-day Suspension");
  const tree = view.render();
  assert.ok(find(tree, "Input").some(node => node.props.id === "suspension-days"));
  assert.ok(!find(tree, "Input").some(node => node.props.id === "award-points" || node.props.id === "deduction"));
  assert.equal(find(tree, "Policy")[0].props.points, 0);
  await find(tree, "Button").find(node => node.props.onClick && node.props.variant !== "ghost").props.onClick();
  assert.equal(view.calls[0][2], 1);
  assert.equal(view.calls[0][3], 0);
});

test("switching from suspension to occurrence never leaks deduction days", async () => {
  const view = workspace();
  find(view.render(), "Select")[0].props.onValueChange("One-day Suspension");
  find(view.render(), "Select")[0].props.onValueChange("Give Occurrence");
  const tree = view.render();
  assert.ok(find(tree, "Input").some(node => node.props.id === "award-points"));
  assert.ok(!find(tree, "Input").some(node => node.props.id === "suspension-days"));
  await find(tree, "Button").find(node => node.props.onClick && node.props.variant !== "ghost").props.onClick();
  assert.equal(view.calls[0][2], 0);
  assert.equal(view.calls[0][3], 1);
});

test("ordinary queries show only relevant policy fields", () => {
  const element = ({ children, ...props }) => React.createElement("div", props, children);
  const { load } = actionLoader(() => {}, { "react/jsx-runtime": runtime,
    "@/components/ui/button": { Button: element }, "@/components/ui/label": { Label: element }, "@/components/ui/textarea": { Textarea: element } });
  const { DecisionPolicyFields } = load("app/(admin)/compliance/components/decision-policy-fields.tsx");
  const props = { issue: { type: "Other", policy_context: { existing_points: 0, steps: [], prior_incidents: [], client_error_levels: [] } }, points: 1, value: {}, onChange() {}, onPointsChange() {}, onUseOutcome() {} };
  const html = renderToStaticMarkup(React.createElement(DecisionPolicyFields, props));
  assert.doesNotMatch(html, /Investigation|Previous coaching|Link related history|deduction|Below the disciplinary/);
  const termination = renderToStaticMarkup(React.createElement(DecisionPolicyFields, { ...props, outcome: "Termination" }));
  assert.match(termination, /Investigation and HR review completed/);
});
