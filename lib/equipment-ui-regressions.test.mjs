import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as dates from "date-fns";
import { actionLoader } from "./api/action-test-utils.mjs";

const element = ({ children }) => React.createElement("div", null, children);
const buttons = { Button: ({ children, ...props }) => React.createElement("button", { disabled: props.disabled }, children) };
const common = { "next/navigation": { useRouter: () => ({ refresh() {} }) }, react: React, "react/jsx-runtime": await import("react/jsx-runtime"), sonner: { toast: {} }, "@/lib/api/inventory": {}, "@/components/ui/button": buttons, "@/components/ui/input": { Input: () => React.createElement("input") }, "@/components/ui/checkbox": { Checkbox: () => null }, "@/components/ui/textarea": { Textarea: () => null }, "@/components/inventory/asset-form-pdf-button": { downloadAssetFormPdf() {} } };

test("staff equipment shows employee choices immediately, without an exact-name selection", () => {
  const { load } = actionLoader(() => {}, { ...common,
    "@/components/ui/table": Object.fromEntries(["Table", "TableBody", "TableCell", "TableHead", "TableHeader", "TableRow"].map((name) => [name, element])),
    "@/components/ui/dialog": { Dialog: () => null },
  });
  const { StaffEquipment } = load("app/(admin)/admin/inventory/components/staff-equipment.tsx");
  const html = renderToStaticMarkup(React.createElement(StaffEquipment, { employees: [{ id: "staff", firstName: "Demo", lastName: "Employee", staff_id: "EMP-001", department: "Operations" }], canIssue: true }));
  assert.match(html, /Open equipment/);
  assert.match(html, /Demo Employee/);
});

test("gadget assignment lists active staff first then sorts names within each group", () => {
  const { load } = actionLoader(() => {}, { ...common,
    "@/components/ui/table": Object.fromEntries(["Table", "TableBody", "TableCell", "TableHead", "TableHeader", "TableRow"].map((name) => [name, element])),
    "@/components/ui/dialog": { Dialog: () => null },
  });
  const { StaffEquipment } = load("app/(admin)/admin/inventory/components/staff-equipment.tsx");
  const employees = [
    { id: "inactive", firstName: "Aaron", lastName: "Former", status: "Inactive" },
    { id: "active-z", firstName: "Zara", lastName: "Current", status: "Active" },
    { id: "active-a", firstName: "Ada", lastName: "Current", status: "Active" },
  ];
  const html = renderToStaticMarkup(React.createElement(StaffEquipment, { employees, canIssue: true }));
  assert.ok(html.indexOf("Ada Current") < html.indexOf("Zara Current"));
  assert.ok(html.indexOf("Zara Current") < html.indexOf("Aaron Former"));
  assert.equal(employees[0].id, "inactive");
});

test("current staff equipment exports retain undertaking rules and blank signature spaces", () => {
  const { load } = actionLoader(() => {}, { ...common, "date-fns": dates, "@/types/user-types": { getRoleLabel: () => "Staff" },
    "@react-pdf/renderer": { ...Object.fromEntries(["Document", "Page", "View", "Text", "Image"].map((name) => [name, element])), StyleSheet: { create: (styles) => styles } },
  });
  const { AssetFormPdfDocument } = load("lib/pdf/asset-form-pdf.tsx");
  const html = renderToStaticMarkup(React.createElement(AssetFormPdfDocument, { current: true, assignments: [] }));
  assert.match(html, /Official Purpose|official purpose/);
  assert.match(html, /last pay check/);
  assert.match(html, /EMPLOYEE SIGNATURE/);
  assert.match(html, /COMPLIANCE OFFICER VERIFICATION/);
});

test("staff export includes recorded contact, signatures and dates across different issues", () => {
  const { load } = actionLoader(() => {}, { ...common, "date-fns": dates, "@/types/user-types": { getRoleLabel: () => "Staff" },
    "@react-pdf/renderer": { ...Object.fromEntries(["Document", "Page", "View", "Text", "Image"].map((name) => [name, element])), StyleSheet: { create: (styles) => styles } },
  });
  const { AssetFormPdfDocument } = load("lib/pdf/asset-form-pdf.tsx");
  const records = ["issue-1", "issue-2"].map((issueBatchId, index) => ({
    id: String(index), issueBatchId, assignee: { id: "staff", name: "Demo Employee", phone: "08000000000" },
    staffDecision: "approved", staffDecidedAt: "2026-10-20T08:00:00Z",
    officerDecision: "approved", officerDecidedAt: "2026-10-20T09:00:00Z", officer: { id: "it", name: "Recorded IT Officer" },
    complianceDecision: "approved", complianceDecidedAt: "2026-10-20T10:00:00Z", complianceOfficer: { id: "compliance", name: "Recorded Compliance Officer" },
  }));
  const html = renderToStaticMarkup(React.createElement(AssetFormPdfDocument, { current: true, assignments: records }));
  assert.match(html, /08000000000/);
  assert.match(html, /Recorded IT Officer/);
  assert.match(html, /Recorded Compliance Officer/);
  assert.match(html, /20 Oct 2026/);
});
