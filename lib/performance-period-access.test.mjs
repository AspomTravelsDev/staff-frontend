import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("monthly setup requires an explicit HR role in navigation", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { getNavigationForUser } = load("lib/navigation.ts");
  const visible = (user) => getNavigationForUser(user).department.some((item) => item.url === "/hr/performance/periods");
  for (const role of ["compliance", "mp", "md", "super", "visa"]) assert.equal(visible({ role }), false, role);
  assert.equal(visible({ role: "hr" }), true);
  assert.equal(visible({ role: "visa", secondary_roles: ["hr"] }), true);
  assert.equal(visible({ role: "hr", is_department_account: true }), false);
});

test("period actions preserve versions and preview tokens and unwrap server responses", async () => {
  const calls = [];
  const fixture = { id: "period-1", version: 2 };
  const { load } = actionLoader((method, endpoint, body) => {
    calls.push([method, endpoint, body]);
    return { success: true, data: { data: fixture } };
  });
  const actions = load("lib/api/performance-period.actions.ts");
  const input = { month: "2026-10", submission_deadline: "2026-11-05", assignments: [], version: 1 };
  assert.deepEqual((await actions.savePerformancePeriod("period-1", input)).data, fixture);
  assert.deepEqual((await actions.previewPerformancePeriod("period-1")).data, fixture);
  assert.deepEqual((await actions.openPerformancePeriod("period-1", "fingerprint")).data, fixture);
  assert.deepEqual(calls, [
    ["patch", "/api/performance/periods/period-1", input],
    ["post", "/api/performance/periods/period-1/preview", {}],
    ["post", "/api/performance/periods/period-1/open", { preview_token: "fingerprint" }],
  ]);
});

test("period actions retain permission and stale-preview failures", async () => {
  const { load } = actionLoader(() => ({ success: false, error: { error: "Preview again before opening.", code: "HTTP_409" } }));
  const actions = load("lib/api/performance-period.actions.ts");
  const result = await actions.openPerformancePeriod("period-1", "old");
  assert.equal(result.success, false);
  assert.equal(result.error.code, "HTTP_409");
  assert.equal(result.error.message, "Preview again before opening.");
});
