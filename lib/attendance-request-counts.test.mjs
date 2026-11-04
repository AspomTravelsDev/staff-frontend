import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { actionLoader } from "./api/action-test-utils.mjs";

function countsLoader(role = "hr", failure = false) {
  const calls = [];
  const { load } = actionLoader(() => {}, {
    "@/lib/auth/session": { getCurrentUser: async () => role ? { id: "reviewer", role } : null },
    "./work-from-home": { getWorkFromHomeStats: async () => {
      calls.push(["work_from_home"]);
      return { success: true, data: { data: { pending: 12 } } };
    } },
    "./clock-in": { getLatePermissionReviewQueue: async filters => {
      calls.push([filters.request_type, filters]);
      if (failure && filters.request_type === "half_day") throw Error("Request failed");
      return { success: true, data: { data: { requests: { data: [], total: 1 }, summary: { pending: filters.request_type === "half_day" ? 45 : 7 } } } };
    } },
  });
  return { calls, getCounts: load("lib/api/attendance-request-counts.ts").getAttendanceRequestPendingCounts };
}

test("tab counts use unfiltered full pending totals, not visible rows or current-page filters", async () => {
  const control = countsLoader();
  assert.deepEqual(await control.getCounts(), { work_from_home: 12, half_day: 45, late_arrival: 7 });
  for (const [, filters] of control.calls.filter(([type]) => type !== "work_from_home")) {
    assert.equal(filters.status, "pending");
    assert.equal(filters.per_page, 1);
    assert.equal(filters.search, undefined);
    assert.equal(filters.from, undefined);
  }
});

test("counts respect tab visibility and ordinary staff do not fetch management queues", async () => {
  const compliance = countsLoader("compliance");
  assert.deepEqual(await compliance.getCounts(), { work_from_home: null, half_day: 45, late_arrival: 7 });
  assert.equal(compliance.calls.some(([type]) => type === "work_from_home"), false);
  for (const role of ["visa", null]) {
    const control = countsLoader(role);
    assert.deepEqual(await control.getCounts(), { work_from_home: null, half_day: null, late_arrival: null });
    assert.equal(control.calls.length, 0);
  }
});

test("a failed queue count remains unavailable without erasing other tab counts", async () => {
  assert.deepEqual(await countsLoader("hr", true).getCounts(), { work_from_home: 12, half_day: null, late_arrival: 7 });
});

test("tabs show positive pending badges, hide empty and disabled counts, and refresh per reviewer", () => {
  const queries = [];
  const { load } = actionLoader(() => {}, {
    react: { useTransition: () => [false, fn => fn()] },
    "react/jsx-runtime": runtime,
    "next/navigation": { useRouter: () => ({ replace() {} }) },
    "@tanstack/react-query": { useQuery: options => { queries.push(options); return { data: options.initialData }; } },
    "@/lib/api/attendance-request-counts": { getAttendanceRequestPendingCounts() {} },
    "@/components/ui/tabs": {
      Tabs: ({ children }) => React.createElement("div", null, children),
      TabsList: ({ children }) => React.createElement("div", null, children),
      TabsTrigger: ({ children, disabled, title }) => React.createElement("button", { disabled, title }, children),
    },
  });
  const Component = load("app/(admin)/hr/attendance-requests/request-tabs.tsx").AttendanceRequestTabs;
  const html = renderToStaticMarkup(React.createElement(Component, { active: "half_day", viewerId: "reviewer", initialCounts: { work_from_home: 99, half_day: 8, late_arrival: 0 }, tabs: [
    { value: "work_from_home", label: "Work From Home", disabled: true },
    { value: "half_day", label: "Half Day" }, { value: "late_arrival", label: "Late Arrival" },
  ] }));
  assert.match(html, /8 pending half day requests/);
  assert.doesNotMatch(html, /99 pending|0 pending/);
  assert.deepEqual(queries[0].queryKey, ["attendance-request-counts", "reviewer"]);
  assert.equal(queries[0].refetchInterval, 60_000);
});
