import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

const { load } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) });
const { getNavigationForUser } = load("lib/navigation.ts");
const visible = (user) => getNavigationForUser(user).department.some((item) => item.url === "/compliance/kpis");

test("KPI administration is visible only with an explicit Compliance role", () => {
  for (const role of ["super", "mp", "md", "hr", "visa", "office-operations"]) assert.equal(visible({ role }), false, role);
  assert.equal(visible({ role: "compliance" }), true);
  assert.equal(visible({ role: "mp", secondary_roles: ["compliance"] }), true);
  assert.equal(visible({ role: "visa", roles: ["visa", "compliance"] }), true);
  assert.equal(visible({ role: "compliance", is_department_account: true }), false);
});

test("KPI actions unwrap API envelopes and retain permission failures", async () => {
  const calls = [];
  const fixture = { departments: ["Visa"], items: [] };
  const { load: loadActions } = actionLoader((method, endpoint) => {
    calls.push([method, endpoint]);
    return method === "get" ? { success: true, data: { data: fixture } } : { success: false, error: { error: "Only Compliance staff can manage department KPIs.", code: "HTTP_403" } };
  });
  const actions = loadActions("lib/api/department-kpi.actions.ts");
  assert.deepEqual((await actions.listDepartmentKpis()).data, fixture);
  const result = await actions.saveDepartmentKpi("kpi-1", {});
  assert.equal(result.success, false);
  assert.equal(result.error.code, "HTTP_403");
  assert.deepEqual(calls, [["get", "/api/performance/kpis"], ["patch", "/api/performance/kpis/kpi-1"]]);
});
