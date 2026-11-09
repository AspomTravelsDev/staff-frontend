import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

const { COMPLIANCE_GUIDE_RULES, filterComplianceRules } = actionLoader(() => {}).load("lib/compliance-guide.ts");

test("guide searches descriptions and combines category and search filters", () => {
  assert.equal(filterComplianceRules("lateness", "Attendance")[0].type, "Tardies");
  assert.equal(filterComplianceRules(" EMAIL ", "Communication")[0].type, "Missed mail");
  assert.equal(filterComplianceRules("email", "Attendance").length, 0);
  assert.equal(filterComplianceRules("not-a-rule", "All rules").length, 0);
  assert.equal(filterComplianceRules("", "All rules").length, COMPLIANCE_GUIDE_RULES.length);
});

test("guide keeps half occurrences and special cases distinct", () => {
  const rules = filterComplianceRules("", "All rules");
  assert.equal(rules.find(rule => rule.type === "Tardies").points, 0.5);
  assert.equal(rules.find(rule => rule.type === "Errors during client application review").points, 0);
  assert.match(rules.find(rule => rule.type === "Insubordination").note, /Step 5 or higher.*review/);
});

test("guide content renders openly with search, rule descriptions and server-provided steps", () => {
  const { load } = actionLoader(() => {}, {
    react: React, "react/jsx-runtime": runtime,
    "lucide-react": { Search: () => null, X: () => null },
    "next/image": { default: ({ unoptimized: _unoptimized, ...props }) => React.createElement("img", props) },
    "@/components/ui/input": { Input: props => React.createElement("input", props) },
    "@/components/ui/button": { Button: ({ children }) => React.createElement("button", null, children) },
  });
  const { ComplianceGuideContent } = load("app/(admin)/my/compliance/guide/guide-content.tsx");
  const html = renderToStaticMarkup(React.createElement(ComplianceGuideContent, { steps: [{ step: 1, threshold: 2, label: "Verbal Warning" }] }));
  for (const text of ["Search rules", "Attendance", "Disciplinary steps", "Verbal Warning", "from 2 occurrences", "Occurrence totals", "Attendance deductions", "third unauthorized late day", "Cloud default", "View policy grid images", "Policy grid images", "/compliance-sanction-grid.jpeg", "/compliance-other-sanction-grid.jpeg", "/compliance-recurring-issues.jpeg"]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Expand|Collapse|My compliance record|data-slot="card"|max-h-96/);
});
