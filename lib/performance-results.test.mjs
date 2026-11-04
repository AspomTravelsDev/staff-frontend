import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("completed-results requests encode staff department and period filters and retain the API envelope", async () => {
  const calls = [];
  const fixture = { items: [], stats: { completed: 0, average_score: null } };
  const { load } = actionLoader((method, endpoint) => { calls.push([method, endpoint]); return { success: true, data: { data: fixture } }; });
  const client = load("lib/api/performance.ts");
  assert.deepEqual(await client.getCompletedResults({ search: "Ada & Co", department: "Social Media", month: "2026-10", page: 2 }), fixture);
  assert.deepEqual(await client.getCompletedResult("appraisal"), fixture);
  assert.deepEqual(calls, [["get", "/api/performance/results?search=Ada+%26+Co&department=Social+Media&month=2026-10&page=2"], ["get", "/api/performance/results/appraisal"]]);
});

test("HR results errors cannot appear as an empty successful result set", async () => {
  const { load } = actionLoader(() => ({ success: false, error: { error: "Only HR staff can view completed appraisal results.", code: "HTTP_403" } }));
  const client = load("lib/api/performance.ts");
  await assert.rejects(client.getCompletedResults(), { name: "ExpectedActionError", code: "HTTP_403" });
  await assert.rejects(client.getCompletedResult("unfinished"), { name: "ExpectedActionError", code: "HTTP_403" });
});

test("results navigation requires an explicit HR role and excludes department accounts", () => {
  const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
  const { getNavigationForUser } = load("lib/navigation.ts");
  const resultLink = (user) => getNavigationForUser(user).department.find((item) => item.url === "/hr/performance");
  for (const role of ["super", "mp", "md", "compliance", "office-operations", "visa"]) assert.equal(resultLink({ role }), undefined, role);
  assert.equal(resultLink({ role: "hr" }).disabled, process.env.NODE_ENV === "production");
  assert.ok(resultLink({ role: "visa", secondary_roles: ["hr"] }));
  assert.equal(resultLink({ role: "hr", is_department_account: true }), undefined);
});

test("results navigation is locked in production and available in development", () => {
  const previous = process.env.NODE_ENV;
  try {
    for (const environment of ["production", "development"]) {
      process.env.NODE_ENV = environment;
      const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
      const { getNavigationForUser } = load("lib/navigation.ts");
      const item = getNavigationForUser({ role: "hr" }).department.find(item => item.url === "/hr/performance");
      assert.equal(item.disabled, environment === "production");
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
