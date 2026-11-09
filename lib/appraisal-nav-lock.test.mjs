import test from "node:test";
import assert from "node:assert/strict";
import { actionLoader } from "./api/action-test-utils.mjs";

test("all appraisal and KPI navigation entries are locked only in production", () => {
  const previous = process.env.NODE_ENV;
  try {
    for (const mode of ["production", "development"]) {
      process.env.NODE_ENV = mode;
      const { departmentNav, personalNav } = actionLoader(() => {}, { "lucide-react": new Proxy({}, { get: () => () => null }) }).load("lib/navigation.ts");
      const all = [...departmentNav, ...personalNav].flatMap(item => [item, ...(item.items || [])]);
      for (const path of ["/hr/performance", "/hr/performance/periods", "/compliance/kpis", "/my/performance", "/performance/reviews"]) {
        const item = all.find(item => item.url === path);
        assert.ok(item, path);
        assert.equal(item.disabled, path === "/performance/reviews" ? undefined : mode === "production", `${mode}: ${path}`);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
