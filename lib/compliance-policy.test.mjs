import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

test("review submission preserves zero points and evidence", async () => {
  const calls = [];
  const { load } = actionLoader((method, endpoint, data) => { calls.push(data); return { success: true, data: {} }; });
  await load("lib/api/compliance.ts").resolveComplianceOccurrence("incident", "Give Occurrence", 0, 0, "File history checked", "Review error confirmed");
  assert.equal(calls[0].points, 0);
  assert.equal(calls[0].evidence, "File history checked");
  assert.equal(calls[0].decision_notes, "Review error confirmed");
});

test("compact occurrence grid preserves half points and numbers every position", () => {
  const element = ({ children }) => React.createElement("div", null, children);
  const { load } = actionLoader(() => {}, {
    react: React, "react/jsx-runtime": awaitRuntime,
    "lucide-react": { ChevronDown: () => null, ChevronUp: () => null },
    "@/components/ui/card": Object.fromEntries(["Card", "CardContent", "CardDescription", "CardHeader", "CardTitle"].map((key) => [key, element])),
    "@/components/ui/badge": { Badge: element }, "@/components/ui/button": { Button: element },
    "./sanction-grid-export-button": { SanctionGridExportButton: () => null },
  });
  const { SanctionLadderGrid } = load("app/(admin)/compliance/components/sanction-ladder-grid.tsx");
  const html = renderToStaticMarkup(React.createElement(SanctionLadderGrid, {
    defaultOpen: true, windowStart: "2026-07-01", steps: [{ step: 1, threshold: 2, label: "Verbal Warning" }],
    items: [{ user_id: "employee", name: "Employee", department: "Operations", issues_count: 0.5, current_step: 0, pending_count: 2, confirmed_count: 2, occurrence_markers: [
      { id: "half", type: "Missed message", points: 0.5, outcome: "Give Occurrence" },
      { id: "zero", type: "Application review error", points: 0, outcome: "Give Occurrence" },
    ] }],
  }));
  assert.match(html, /width:50%/);
  assert.doesNotMatch(html, /width:100%/);
  for (let position = 1; position <= 28; position++) assert.match(html, new RegExp(`>${position}</span>`));
  assert.match(html, /Employee/);
  assert.match(html, /Operations/);
  assert.doesNotMatch(html, /pending queries|confirmed incidents|View confirmed actions|Calculated stage|to Step/);
});

const awaitRuntime = await import("react/jsx-runtime");

test("compliance dropdown groups the record and guide for all staff roles", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { getNavigationForUser } = load("lib/navigation.ts");
  for (const role of ["visa", "ticket", "account", "hr", "it", "compliance", "office-operations", "super", "mp", "md"]) {
    const nav = getNavigationForUser({ role });
    const compliance = nav.personal.find(item => item.title === "Compliance");
    assert.ok(compliance, role);
    assert.equal(compliance.items[0].url, "/my/compliance");
    assert.equal(compliance.items[0].badgeKey, "compliance");
    assert.equal(compliance.items[1].url, "/my/compliance/guide");
    assert.equal(compliance.items[1].title, "Compliance Guide");
    assert.ok(!nav.department.some(item => item.url === "/compliance/policy-reference"));
  }
});

test("ordinary staff can open the guide with their own scope and guests must log in", async () => {
  let scope;
  const base = {
    "react/jsx-runtime": awaitRuntime,
    "next/link": { default: () => null },
    "@/lib/api/render-data-page": { renderDataPage: async callback => callback() },
    "@/lib/api/compliance": { getComplianceSanctionGrid: async filter => { scope = filter; return { steps: [] }; } },
    "./guide-content": { ComplianceGuideContent: () => null },
  };
  const staff = actionLoader(() => {}, { ...base, "@/lib/auth/session": { getCurrentUser: async () => ({ id: "staff", role: "visa" }) } });
  await staff.load("app/(admin)/my/compliance/guide/page.tsx").default();
  assert.equal(scope.user_id, "staff");
  const guest = actionLoader(() => {}, { ...base, "@/lib/auth/session": { getCurrentUser: async () => null } });
  await assert.rejects(guest.load("app/(admin)/my/compliance/guide/page.tsx").default(), /redirect/);
});
