import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { actionLoader } from "./action-test-utils.mjs";

const fallback = "DataLoadError";
const react = { createElement: (type, props) => ({ type, props }) };
const jsx = { jsx: react.createElement, jsxs: react.createElement };

function loaderForPage(filename, apiFailure = true, additional = {}) {
  const tree = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const overrides = {
    react,
    "react/jsx-runtime": jsx,
    "@/components/data-load-error": { DataLoadError: fallback },
    "@/lib/auth/session": { getCurrentUser: async () => ({ id: "1", role: "super", is_active: true }) },
    "@/types/user-types": { userHasAnyRole: () => true, getRoles: () => ["super"] },
    "@/lib/api/employees": { getEmployees: async () => {
      if (apiFailure) throw new Error("Private connection details");
      return { items: [] };
    } },
    "@/app/(admin)/hr/employees/queries": { getAllEmployees: async () => [] },
  };
  for (const statement of tree.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const name = statement.moduleSpecifier.text;
    if (name in overrides || name === "next/navigation" || name.includes("/lib/api/") || name === "./queries") continue;
    overrides[name] = new Proxy({ __esModule: true }, { get: (target, prop) => prop in target ? target[prop] : String(prop) });
  }
  return actionLoader(async () => apiFailure
    ? { success: false, error: { code: "NETWORK_ERROR", error: "Unable to reach the server." } }
    : { success: true, data: { data: [] } }, { ...overrides, ...additional });
}

for (const route of ["directory", "compliance", "admin/inventory", "my/inventory", "my/it/assets", "hr/anonymous-comments", "hr/award-staff", "my/awards", "hr/applications", "hr/applications/[id]", "it/onboarding", "it/departmental-contacts", "admin/it-desk", "my/it", "my/it/[slug]", "admin/it-desk/[id]/edit", "my/performance"]) {
  test(`${route}: failed loads show a retry state instead of empty records or a generic crash`, async () => {
    const filename = `app/(admin)/${route}/page.tsx`;
    const { load } = loaderForPage(filename);
    const page = load(filename).default;
    const result = await page({ searchParams: Promise.resolve({}), params: Promise.resolve({ id: "1", slug: "guide" }) });
    assert.equal(result.type, fallback);
    assert.match(result.props.title, /Unable to load/);
    assert.doesNotMatch(result.props.message || "", /Private connection/);
  });
}

test("page failure handling preserves Next.js redirects and not-found responses", async () => {
  const { load } = actionLoader(async () => {}, {
    react, "@/components/data-load-error": { DataLoadError: fallback },
  });
  const { renderDataPage } = load("lib/api/render-data-page.ts");
  for (const digest of ["NEXT_REDIRECT;replace;/login;307;", "NEXT_HTTP_ERROR_FALLBACK;404"]) {
    const error = Object.assign(new Error("navigation"), { digest });
    await assert.rejects(renderDataPage(async () => { throw error; }, "Records"), caught => caught === error);
  }
});

test("a failed page load with an unverified session redirects to cookie cleanup instead of offering a retry", async () => {
  const { load } = actionLoader(async () => {}, {
    react, "@/components/data-load-error": { DataLoadError: fallback },
    "@/lib/auth/session": { getCurrentUser: async () => null },
  });
  const { renderDataPage } = load("lib/api/render-data-page.ts");
  await assert.rejects(renderDataPage(async () => { throw new Error("Unable to verify session"); }, "Records"), error => error.digest?.includes("/auth/logout?redirect="));
});

for (const kind of ["loan", "salary-advance"]) {
  for (const mode of ["my", "hr", "accounts"]) {
    test(`${kind}/${mode}: failed records are unavailable; successful empty records remain empty`, async () => {
      const filename = `components/payroll/${kind}-requests-page-shell.tsx`;
      const loan = kind === "loan";
      const apiPath = loan ? "@/lib/api/loan-requests" : "@/lib/api/salary-advance-requests";
      const functionName = loan ? "LoanRequestsPageShell" : "SalaryAdvanceRequestsPageShell";
      const title = loan ? "Loan requests" : "Salary advances";
      for (const failure of [true, false]) {
        const get = async () => {
          if (failure) throw new Error("Private backend error");
          return { data: [], summary: { total_requested_amount: 0, pending_balance: 0, open_active_count: 0, paid_count: 0 } };
        };
        const api = loan ? { getMyLoanRequests: get, getAllLoanRequests: get, markLoanRequestNotificationsViewed: async () => { throw new Error("Notification failed"); } }
          : { getMySalaryAdvanceRequests: get, getAllSalaryAdvanceRequests: get, markSalaryAdvanceNotificationsViewed: async () => { throw new Error("Notification failed"); } };
        const { load } = loaderForPage(filename, false, { [apiPath]: api });
        const result = await load(filename)[functionName]({ mode, title, description: "Requests", cardTitle: "Requests" });
        assert.equal(result.type, failure ? fallback : "div");
      }
    });
  }
}
