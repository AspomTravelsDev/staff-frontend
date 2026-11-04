import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

test("active supervisors have company-wide compliance tools without granting the same access to ordinary staff", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { canManageCompliance } = load("lib/compliance-access.ts");
  const { getNavigationForUser } = load("lib/navigation.ts");
  const supervisor = { role: "visa", is_supervisor: true, is_active: true };
  assert.equal(canManageCompliance(supervisor), true);
  assert.ok(getNavigationForUser(supervisor).department.some(item => item.url === "/compliance"));
  assert.equal(canManageCompliance({ role: "visa", is_active: true }), false);
  assert.equal(canManageCompliance({ ...supervisor, is_active: false }), false);
  assert.equal(canManageCompliance({ ...supervisor, is_department_account: true }), false);
});

function policyFields(previous = 0, points = 3) {
  const selected = [];
  const { load } = actionLoader(() => {}, {
    "react/jsx-runtime": runtime,
    "@/components/ui/button": { Button: ({ children, ...props }) => React.createElement("button", props, children) },
    "@/components/ui/label": { Label: props => React.createElement("label", props) },
    "@/components/ui/textarea": { Textarea: props => React.createElement("textarea", props) },
  });
  const { DecisionPolicyFields } = load("app/(admin)/compliance/components/decision-policy-fields.tsx");
  const tree = DecisionPolicyFields({ issue: { type: "Other", policy_context: { existing_points: 3, previous_action_step: previous, steps: [{ step: 1, threshold: 2, label: "Verbal Warning" }, { step: 2, threshold: 4, label: "First Written Warning" }, { step: 3, threshold: 6, label: "Final Written Warning" }], prior_incidents: [], suggested_deduction_days: null } }, points, value: {}, onChange() {}, onPointsChange() {}, onUseOutcome: value => selected.push(value), onUseDeduction() {} });
  return { tree, selected, html: renderToStaticMarkup(tree) };
}

test("highest-step recommendation is shown without automatically applying a sanction", () => {
  const view = policyFields();
  assert.match(view.html, /Recommended: Step 3/);
  assert.match(view.html, /Final Written Warning/);
  assert.equal(view.selected.length, 0);
});

test("re-entering a previously actioned threshold asks for review without offering automatic escalation", () => {
  const view = policyFields(2, 1);
  assert.match(view.html, /previously actioned/);
  assert.match(view.html, /does not increase punishment/);
  assert.doesNotMatch(view.html, /Use recommended action/);
});
