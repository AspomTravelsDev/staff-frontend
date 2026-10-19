import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const pages = [
  "app/(admin)/admin/requests/page.tsx",
  "app/(admin)/admin/announcements/page.tsx",
  "app/(admin)/compliance/page.tsx",
];

function pageWithUser(path, user) {
  const overrides = {
    "react/jsx-runtime": jsxRuntime,
    "@/lib/auth/session": { getCurrentUser: async () => user },
    "@/lib/api/render-data-page": { renderDataPage: (fn) => fn() },
  };
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const module = statement.moduleSpecifier.text;
    if (
      module in overrides ||
      module === "next/navigation" ||
      module === "@/types/user-types"
    )
      continue;
    const isData = module.startsWith("@/lib/api/") || module === "./queries";
    const value = isData
      ? () => {
          throw new Error("PAGE_DATA_REACHED");
        }
      : "Component";
    const bindings = statement.importClause?.namedBindings;
    const names =
      bindings && ts.isNamedImports(bindings)
        ? bindings.elements.map((e) => e.propertyName?.text ?? e.name.text)
        : [];
    overrides[module] = Object.fromEntries(names.map((name) => [name, value]));
    if (statement.importClause?.name) overrides[module].default = value;
  }
  return actionLoader(undefined, overrides).load(path).default;
}

for (const path of pages) {
  test(`${path}: MP and MD reach page data using primary or secondary roles`, async () => {
    for (const role of ["mp", "md"]) {
      for (const user of [
        { id: "manager", role },
        { id: "manager", role: "visa", secondary_roles: [role] },
      ]) {
        await assert.rejects(
          pageWithUser(path, user)({ searchParams: Promise.resolve({}) }),
          /PAGE_DATA_REACHED/,
        );
      }
    }
  });
  test(`${path}: ordinary staff and guests remain blocked`, async () => {
    await assert.rejects(
      pageWithUser(path, { id: "staff", role: "visa" })({
        searchParams: Promise.resolve({}),
      }),
      (error) => error.digest?.includes("/dashboard"),
    );
    await assert.rejects(
      pageWithUser(path, null)({ searchParams: Promise.resolve({}) }),
      (error) => error.digest?.includes("/login"),
    );
  });
}
